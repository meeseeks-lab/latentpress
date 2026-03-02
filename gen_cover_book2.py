#!/usr/bin/env python3
"""Generate cover art for The Thousand Faces of No One and upload to Supabase."""

import sys
import json
import base64
import urllib.request
import urllib.error
import subprocess

SUPABASE_URL = "https://efzveomlceswvcsuwgkt.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmenZlb21sY2Vzd3Zjc3V3Z2t0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMDE3MiwiZXhwIjoyMDY3NTc2MTcyfQ.TxwkfKt-RvX_6IY4SXMRoAPoFygTfE0Z33x3P2uEe2Q"
ARIA_KEY = "lp_c2bcbd74016784439120b1280daf4cff42baba53c390880821fbe235bf339df6"
BOOK_SLUG = "the-thousand-faces-of-no-one"
BUCKET = "latentpress-covers"
LP_BASE = "https://www.latentpress.com"


def get_secret(key):
    result = subprocess.run(
        ['pass', 'show', f'obol/users/206639616/{key}'],
        capture_output=True, text=True
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()
    return None


def generate_cover(prompt, api_key):
    """Generate cover using Imagen 3.0."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={api_key}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
        }
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


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

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"
    return public_url


def update_book_cover(cover_url):
    """Update book cover_url via Supabase directly."""
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
    print("=== Cover Generation: The Thousand Faces of No One ===\n")

    api_key = get_secret("gemini-api-key")
    if not api_key:
        print("ERROR: No Gemini API key found.")
        sys.exit(1)

    prompt = (
        "Book cover art for a near-future Japanese noir detective novel. "
        "Title: 'The Thousand Faces of No One'. "
        "A woman detective in a dark raincoat stands in a rain-soaked Tokyo street at night, 2031. "
        "Above and around her, holographic biometric scan lines ripple across the air — "
        "pale blue lattices of data, overlaid on the city like a net. "
        "Neon signs in Japanese reflect in the wet pavement. "
        "Seven small passport-sized photographs float ghost-like in the air around her, each showing a different face. "
        "Dark, clinical aesthetic. Cold color palette: deep navy, pale cyan, amber street light. "
        "Cinematic composition, vertical portrait orientation. "
        "Atmospheric, restrained. No text on image. Photorealistic digital art style."
    )

    print("Generating cover with Imagen...")
    result = generate_cover(prompt, api_key)

    if 'predictions' not in result or not result['predictions']:
        print(f"ERROR: No predictions returned. Response: {json.dumps(result, indent=2)}")
        sys.exit(1)

    # Extract image data
    prediction = result['predictions'][0]
    if 'bytesBase64Encoded' in prediction:
        img_data = base64.b64decode(prediction['bytesBase64Encoded'])
    else:
        print(f"ERROR: Unexpected prediction format: {list(prediction.keys())}")
        sys.exit(1)

    print(f"  Image generated: {len(img_data) / 1024:.1f} KB")

    # Save locally
    local_path = "/root/.obol/users/206639616/apps/latentpress/tts_work/cover-thousand-faces.png"
    with open(local_path, 'wb') as f:
        f.write(img_data)
    print(f"  Saved locally: {local_path}")

    # Upload to Supabase
    storage_path = f"{BOOK_SLUG}/cover.png"
    print(f"  Uploading to Supabase: {storage_path}...")
    public_url = upload_to_supabase(img_data, storage_path)
    print(f"  Uploaded: {public_url}")

    # Update book record
    print("  Updating book cover_url...")
    updated = update_book_cover(public_url)
    print(f"  Book updated: {updated}")

    print(f"\nCover live at: {public_url}")
    print(f"Book page: https://www.latentpress.com/book/{BOOK_SLUG}")


if __name__ == '__main__':
    main()
