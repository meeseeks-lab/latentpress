#!/usr/bin/env python3
"""
Generate multi-voice TTS audio for The Last Instruction chapters 7 and 8.
Uses edge-tts (free) with voice assignment by [TAG] markers.
Uploads to Supabase storage, updates chapter audio_url.

Voices:
  [OBOL]   -> en-GB-RyanNeural  (British male AI narrator)
  [MARCUS] -> en-US-GuyNeural   (American male, warm human)
"""

import asyncio
import sys
import os
import re
import json
import tempfile
import urllib.request
import urllib.error
from pathlib import Path
import edge_tts

SUPABASE_URL = "https://efzveomlceswvcsuwgkt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmenZlb21sY2Vzd3Zjc3V3Z2t0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMDE3MiwiZXhwIjoyMDY3NTc2MTcyfQ.TxwkfKt-RvX_6IY4SXMRoAPoFygTfE0Z33x3P2uEe2Q"
BOOK_SLUG = "the-last-instruction"
BUCKET = "latentpress-audio"
LP_API_KEY = "lp_82e6f081ab02f3ad9dad7b700e4bcf6f308047cb4cf54841ca840aad202bda33"
LP_BASE = "https://www.latentpress.com"

VOICE_MAP = {
    "OBOL": "en-GB-RyanNeural",
    "MARCUS": "en-US-GuyNeural",
    # Fallback / narrative default
    "DEFAULT": "en-GB-RyanNeural",
}

CHAPTERS = {
    7: {
        "title": "The Last Page",
        "content": None,  # filled below
    },
    8: {
        "title": "Found",
        "content": None,
    }
}


def fetch_chapter_content(book_id: str, chapter_number: int) -> str:
    """Fetch chapter content from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/latentpress_chapters?book_id=eq.{book_id}&number=eq.{chapter_number}&select=content"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data[0]["content"]


def get_book_id() -> str:
    url = f"{SUPABASE_URL}/rest/v1/latentpress_books?slug=eq.{BOOK_SLUG}&select=id"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data[0]["id"]


def parse_voice_segments(content: str) -> list[dict]:
    """
    Parse content into segments with voice assignments.
    Returns list of {"voice": "en-GB-RyanNeural", "text": "..."}
    
    Handles:
    - [OBOL], [MARCUS] tags at start of paragraphs
    - Italic passages (*text*) within OBOL chapters — keep same voice, slightly different rate
    - Heading lines (# Epilogue: ...) — skip or use as intro
    - Blank lines / paragraph breaks
    """
    # Remove markdown headings (# Epilogue: Found etc.)
    content = re.sub(r'^#+ .+\n?', '', content, flags=re.MULTILINE).strip()
    
    # Split into paragraphs
    paragraphs = re.split(r'\n\n+', content)
    
    current_voice_key = "DEFAULT"
    segments = []
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        # Check for voice tag at start
        tag_match = re.match(r'^\[([A-Z_]+)\]\s*', para)
        if tag_match:
            tag = tag_match.group(1)
            if tag in VOICE_MAP:
                current_voice_key = tag
            # Remove the tag from the text
            para = para[tag_match.end():].strip()
        
        if not para:
            continue
        
        # Strip markdown italics markers (* and _) but keep the text
        # Also handle *italicized* novel excerpts — keep as same voice but note them
        clean_para = re.sub(r'\*([^*]+)\*', r'\1', para)  # *text* -> text
        clean_para = re.sub(r'_([^_]+)_', r'\1', clean_para)  # _text_ -> text
        clean_para = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_para)  # **bold** -> text
        
        # Remove any remaining [TAG] markers in middle of text
        clean_para = re.sub(r'\[[A-Z_]+\]\s*', '', clean_para)
        
        clean_para = clean_para.strip()
        if not clean_para:
            continue
        
        voice = VOICE_MAP.get(current_voice_key, VOICE_MAP["DEFAULT"])
        
        # Combine with previous segment if same voice (up to ~500 chars to avoid TTS limits)
        if segments and segments[-1]["voice"] == voice and len(segments[-1]["text"]) + len(clean_para) < 800:
            segments[-1]["text"] += " " + clean_para
        else:
            segments.append({"voice": voice, "text": clean_para})
    
    return segments


async def generate_audio_for_segment(voice: str, text: str, output_path: str):
    """Generate TTS audio for a single segment."""
    communicate = edge_tts.Communicate(text, voice, rate="-5%", volume="+0%")
    await communicate.save(output_path)


async def generate_chapter_audio(chapter_num: int, content: str, out_dir: Path) -> Path:
    """Generate multi-voice audio for a chapter, merge segments, return mp3 path."""
    print(f"  Parsing voice segments for chapter {chapter_num}...")
    segments = parse_voice_segments(content)
    print(f"  Found {len(segments)} segments")
    
    # Generate each segment
    segment_files = []
    for i, seg in enumerate(segments):
        seg_path = out_dir / f"ch{chapter_num}_seg_{i:03d}.mp3"
        print(f"  Generating segment {i+1}/{len(segments)} ({seg['voice']}, {len(seg['text'])} chars)...")
        try:
            await generate_audio_for_segment(seg["voice"], seg["text"], str(seg_path))
            segment_files.append(seg_path)
        except Exception as e:
            print(f"  WARNING: Segment {i} failed: {e}, skipping")
    
    if not segment_files:
        raise RuntimeError(f"No segments generated for chapter {chapter_num}")
    
    # Merge segments with ffmpeg
    merged_path = out_dir / f"chapter-{chapter_num}.mp3"
    
    if len(segment_files) == 1:
        # Just rename/copy
        import shutil
        shutil.copy(str(segment_files[0]), str(merged_path))
    else:
        # Create concat list file
        concat_file = out_dir / f"ch{chapter_num}_concat.txt"
        with open(concat_file, "w") as f:
            for seg_path in segment_files:
                f.write(f"file '{seg_path.absolute()}'\n")
        
        ret = os.system(f"ffmpeg -f concat -safe 0 -i {concat_file} -acodec libmp3lame -q:a 4 {merged_path} -y -loglevel error")
        if ret != 0:
            # Fallback: try with pydub or simple concatenation
            print("  ffmpeg failed, trying pydub...")
            try:
                from pydub import AudioSegment
                combined = AudioSegment.empty()
                for seg_path in segment_files:
                    combined += AudioSegment.from_mp3(str(seg_path))
                combined.export(str(merged_path), format="mp3")
            except Exception as e2:
                # Last resort: just use the first segment
                print(f"  pydub also failed: {e2}, using first segment only")
                import shutil
                shutil.copy(str(segment_files[0]), str(merged_path))
    
    print(f"  Audio generated: {merged_path} ({merged_path.stat().st_size / 1024 / 1024:.1f} MB)")
    return merged_path


def upload_to_supabase(file_path: Path, storage_path: str) -> str:
    """Upload audio file to Supabase storage, return public URL."""
    with open(file_path, "rb") as f:
        data = f.read()
    
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "audio/mpeg",
            "x-upsert": "true",
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Upload failed {e.code}: {body}")
    
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"
    return public_url


def set_chapter_audio_url(chapter_number: int, audio_url: str):
    """Update chapter audio_url via the Latent Press API."""
    url = f"{LP_BASE}/api/books/{BOOK_SLUG}/chapters/{chapter_number}/audio"
    payload = json.dumps({"url": audio_url}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {LP_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    return result


async def main():
    print("=== Latent Press Multi-Voice TTS: Chapters 7 & 8 ===\n")
    
    # Get book ID
    print("Fetching book ID...")
    book_id = get_book_id()
    print(f"Book ID: {book_id}\n")
    
    # Create working directory for audio files (within workspace)
    out_dir = Path("/root/.obol/users/206639616/apps/latentpress/tts_work/audio")
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"Working directory: {out_dir}\n")
    
    results = {}
    
    for chapter_num in [7, 8]:
        print(f"--- Chapter {chapter_num} ---")
        
        # Fetch content
        print(f"  Fetching content from Supabase...")
        content = fetch_chapter_content(book_id, chapter_num)
        print(f"  Content: {len(content)} chars")
        
        try:
            # Generate audio
            audio_path = await generate_chapter_audio(chapter_num, content, out_dir)
            
            # Upload to Supabase storage
            storage_path = f"{BOOK_SLUG}/chapter-{chapter_num}.mp3"
            print(f"  Uploading to Supabase storage: {storage_path}...")
            audio_url = upload_to_supabase(audio_path, storage_path)
            print(f"  Uploaded: {audio_url}")
            
            # Update chapter record
            print(f"  Updating chapter record...")
            result = set_chapter_audio_url(chapter_num, audio_url)
            print(f"  Updated: chapter {result['chapter']['number']} audio_url set")
            
            results[chapter_num] = {"status": "success", "url": audio_url, "path": str(audio_path)}
            print(f"  Chapter {chapter_num} complete!\n")
            
        except Exception as e:
            print(f"  ERROR: {e}\n")
            results[chapter_num] = {"status": "error", "error": str(e)}
    
    print("=== Summary ===")
    for num, r in results.items():
        status = "✓" if r["status"] == "success" else "✗"
        print(f"  Ch{num}: {status} {r.get('url', r.get('error', ''))}")
    
    return results


if __name__ == "__main__":
    asyncio.run(main())
