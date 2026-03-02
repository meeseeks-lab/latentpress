#!/usr/bin/env python3
"""Generate cover art for The Thousand Faces of No One using DALL-E 3 and upload to Supabase."""

import sys
import json
import urllib.request
import urllib.error
import subprocess

SUPABASE_URL = "https://efzveomlceswvcsuwgkt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmenZlb21sY2Vzd3Zjc3V3Z2t0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMDE3MiwiZXhwIjoyMDY3NTc2MTcyfQ.TxwkfKt-RvX_6IY4SXMRoAPoFygTfE0Z33x3P2uEe2Q"
BOOK_SLUG = "the-thousand-faces-of-no-one"
BUCKET = "latentpress-covers"


def get_secret(key):
    result = subprocess.run(
        ['pass', 'show', f'obol/users/206639616/{key}'],
        capture_output=True, text=True
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()
    return None


def generate_with_dalle(prompt, openai_key):
    """Generate image using DALL-E 3, return URL."""
    payload = json.dumps({
        'model': 'dall-e-3',
        'prompt': prompt,
        'n': 1,
        'size': '1024x1792',
        'quality': 'hd',
        'style': 'natural',
        'response_format': 'url',
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/images/generations',
        data=payload,
        headers={
            'Authorization': f'Bearer {openai_key}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode())

    return result['data'][0]['url']


def download_image(url):
    """Download image from URL, return bytes."""
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def upload_to_supabase(image_bytes, storage_path):
    """Upload image to Supabase storage, return public URL."""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"
    req = urllib.request.Request(
        url,
        data=image_bytes,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "image/png",
            "x-upsert": "true",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Upload failed {e.code}: {body}")

    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"


def update_book_cover(cover_url):
    """Update book cover_url via Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/latentpress_books?slug=eq.{BOOK_SLUG}"
    payload = json.dumps({"cover_url": cover_url}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method="PATCH"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def main():
    print("=== Cover Generation: The Thousand Faces of No One (DALL-E 3) ===\n")

    openai_key = get_secret("openai-api-key")
    if not openai_key:
        print("ERROR: No OpenAI API key found in pass store.")
        sys.exit(1)

    prompt = (
        "Book cover art for a near-future Japanese noir detective novel set in Tokyo 2031. "
        "A lone woman detective stands in a rain-soaked night street in Shinjuku. "
        "She wears a dark grey raincoat. Her back is slightly turned to us, facing the city. "
        "All around her, the rainy night air is criss-crossed with faint holographic blue biometric scan lines — "
        "the invisible surveillance lattice of the city made visible as pale cyan light grids. "
        "Seven passport-sized photographs drift ghostlike in the air near her, each showing a different face, faintly luminous. "
        "Tokyo neon signs in kanji glow amber and red. Wet pavement mirrors everything. "
        "Color palette: deep navy blue, pale cyan biometric light, amber neon. Cold and precise. "
        "Cinematic, vertical portrait composition. Photorealistic digital art. "
        "No text, no words in the image."
    )

    print("Generating cover with DALL-E 3...")
    try:
        img_url = generate_with_dalle(prompt, openai_key)
        print(f"  Image URL received")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"DALL-E error {e.code}: {body}")
        sys.exit(1)

    print("  Downloading image...")
    img_data = download_image(img_url)
    print(f"  Downloaded: {len(img_data) / 1024:.1f} KB")

    # Save locally
    local_path = "/root/.obol/users/206639616/apps/latentpress/tts_work/cover-thousand-faces.png"
    with open(local_path, 'wb') as f:
        f.write(img_data)
    print(f"  Saved locally: {local_path}")

    # Upload to Supabase
    storage_path = f"{BOOK_SLUG}/cover.png"
    print(f"  Uploading to Supabase storage: {storage_path}...")
    public_url = upload_to_supabase(img_data, storage_path)
    print(f"  Uploaded: {public_url}")

    # Update book record
    print("  Updating book cover_url in database...")
    updated = update_book_cover(public_url)
    print(f"  Done.")

    print(f"\nCover live at: {public_url}")
    print(f"Book page: https://www.latentpress.com/book/{BOOK_SLUG}")


if __name__ == '__main__':
    main()
