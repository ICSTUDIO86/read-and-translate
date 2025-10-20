#!/usr/bin/env python3
"""
Edge TTS Server for BookReader Application
Provides text-to-speech synthesis using Microsoft Edge TTS
"""

import asyncio
import hashlib
import os
import re
import tempfile
from pathlib import Path

import edge_tts
from quart import Quart, request, send_file, jsonify
from quart_cors import cors

app = Quart(__name__)
app = cors(app, allow_origin="*")  # Enable CORS for browser requests

# Cache directory for generated audio files
CACHE_DIR = Path(tempfile.gettempdir()) / "edge-tts-cache"
CACHE_DIR.mkdir(exist_ok=True)

print(f"[Edge TTS Server] Cache directory: {CACHE_DIR}")

# Default voice mappings by language
DEFAULT_VOICES = {
    'zh': 'zh-CN-XiaoxiaoNeural',
    'zh-CN': 'zh-CN-XiaoxiaoNeural',
    'zh-TW': 'zh-TW-HsiaoChenNeural',
    'en': 'en-US-AriaNeural',
    'en-US': 'en-US-AriaNeural',
    'en-GB': 'en-GB-SoniaNeural',
    'ja': 'ja-JP-NanamiNeural',
    'ko': 'ko-KR-SunHiNeural',
    'es': 'es-ES-ElviraNeural',
    'fr': 'fr-FR-DeniseNeural',
    'de': 'de-DE-KatjaNeural',
}


def clean_text(text: str) -> str:
    """
    Clean text for Edge TTS processing
    Removes control characters and normalizes whitespace
    """
    if not text:
        return ''

    # Remove control characters (except newline and tab)
    # Control chars are in range \x00-\x1F and \x7F-\x9F
    text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]', '', text)

    # Normalize quotes and apostrophes (optional, but helps with consistency)
    text = text.replace('"', '"').replace('"', '"')
    text = text.replace(''', "'").replace(''', "'")

    # Replace multiple consecutive spaces with single space
    text = re.sub(r' {2,}', ' ', text)

    # Replace multiple consecutive newlines with double newline
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Strip leading/trailing whitespace
    text = text.strip()

    # Ensure text has at least some readable content
    if not text or not re.search(r'[a-zA-Z0-9\u4e00-\u9fa5]', text):
        raise ValueError("Text contains no readable content after cleaning")

    return text


def get_cache_key(text: str, voice: str, rate: str, pitch: str) -> str:
    """Generate cache key from parameters"""
    key_string = f"{text}|{voice}|{rate}|{pitch}"
    return hashlib.md5(key_string.encode()).hexdigest()


async def generate_speech(text: str, voice: str, rate: str = "+0%", pitch: str = "+0Hz") -> bytes:
    """Generate speech using Edge TTS with text cleaning"""

    # Clean text before processing
    original_length = len(text)
    cleaned_text = clean_text(text)
    cleaned_length = len(cleaned_text)

    print(f"[Edge TTS] Text cleaned: {original_length} -> {cleaned_length} chars")
    print(f"[Edge TTS] Text preview: {cleaned_text[:100]}...")

    # Validate voice parameter
    if not voice or not isinstance(voice, str):
        raise ValueError(f"Invalid voice parameter: {voice}")

    # Create Edge TTS communicate object with cleaned text
    communicate = edge_tts.Communicate(cleaned_text, voice, rate=rate, pitch=pitch)

    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
    temp_path = temp_file.name
    temp_file.close()

    try:
        print(f"[Edge TTS] Calling Edge TTS API...")
        await communicate.save(temp_path)
        print(f"[Edge TTS] Edge TTS API completed successfully")

        # Read the file content
        with open(temp_path, 'rb') as f:
            audio_data = f.read()

        print(f"[Edge TTS] Generated {len(audio_data)} bytes of audio")
        return audio_data
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Edge TTS Server',
        'cache_dir': str(CACHE_DIR),
        'cache_files': len(list(CACHE_DIR.glob('*.mp3')))
    })


@app.route('/voices', methods=['GET'])
async def list_voices():
    """List available voices"""
    try:
        voices = await edge_tts.list_voices()
        # Return simplified voice list
        voice_list = [
            {
                'name': v['ShortName'],
                'gender': v['Gender'],
                'locale': v['Locale'],
                'friendlyName': v['FriendlyName']
            }
            for v in voices
        ]
        return jsonify({
            'voices': voice_list,
            'count': len(voice_list)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/synthesize', methods=['POST'])
async def synthesize():
    """Synthesize speech from text"""
    try:
        print("=" * 60)
        print("[Edge TTS] Received synthesize request")
        data = await request.json

        # Get parameters with validation
        text = data.get('text', '')
        voice = data.get('voice', 'zh-CN-XiaoxiaoNeural')
        rate = data.get('rate', '+0%')
        pitch = data.get('pitch', '+0Hz')

        print(f"[Edge TTS] Parameters:")
        print(f"  - Text length: {len(text)} chars")
        print(f"  - Voice: {voice}")
        print(f"  - Rate: {rate}")
        print(f"  - Pitch: {pitch}")
        print(f"  - Text preview: {text[:100]}...")

        # Validate text
        if not text:
            print("[Edge TTS] Error: No text provided")
            return jsonify({'error': 'No text provided'}), 400

        if not text.strip():
            print("[Edge TTS] Error: Text is empty or whitespace only")
            return jsonify({'error': 'Text is empty or whitespace only'}), 400

        # Validate rate and pitch format
        if not (rate.endswith('%') or rate.endswith('Hz')):
            print(f"[Edge TTS] Warning: Invalid rate format: {rate}, using +0%")
            rate = '+0%'

        if not pitch.endswith('Hz'):
            print(f"[Edge TTS] Warning: Invalid pitch format: {pitch}, using +0Hz")
            pitch = '+0Hz'

        # Check cache first (use original text for cache key)
        cache_key = get_cache_key(text, voice, rate, pitch)
        cache_file = CACHE_DIR / f"{cache_key}.mp3"

        if cache_file.exists():
            print(f"[Edge TTS] Cache hit: {cache_key[:8]}...")
            print("=" * 60)
            return await send_file(
                str(cache_file),
                mimetype='audio/mpeg',
                as_attachment=False
            )

        # Generate new speech (will clean text internally)
        print(f"[Edge TTS] Cache miss, generating new audio...")
        audio_data = await generate_speech(text, voice, rate, pitch)
        print(f"[Edge TTS] Generated audio, size: {len(audio_data)} bytes")

        # Save to cache
        with open(cache_file, 'wb') as f:
            f.write(audio_data)
        print(f"[Edge TTS] Saved to cache: {cache_key[:8]}...")
        print("=" * 60)

        return await send_file(
            str(cache_file),
            mimetype='audio/mpeg',
            as_attachment=False
        )

    except ValueError as e:
        # Text cleaning errors (no readable content)
        print(f"[Edge TTS] Validation error: {e}")
        print("=" * 60)
        return jsonify({'error': f'Text validation failed: {str(e)}'}), 400

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Edge TTS] Error: {e}")
        print(f"[Edge TTS] Traceback:\n{error_trace}")
        print("=" * 60)
        return jsonify({
            'error': str(e),
            'detail': error_trace,
            'type': type(e).__name__
        }), 500


@app.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear audio cache"""
    try:
        count = 0
        for cache_file in CACHE_DIR.glob('*.mp3'):
            cache_file.unlink()
            count += 1

        return jsonify({
            'status': 'ok',
            'cleared': count,
            'message': f'Cleared {count} cached files'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5002))

    # Use 0.0.0.0 for cloud deployment, localhost for local dev
    host = '0.0.0.0' if os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('RENDER') else 'localhost'

    print("=" * 60)
    print("Edge TTS Server for BookReader")
    print("=" * 60)
    print(f"Cache directory: {CACHE_DIR}")
    print(f"Server starting on http://{host}:{port}")
    print("=" * 60)
    print("\nEndpoints:")
    print("  GET  /health       - Health check")
    print("  GET  /voices       - List available voices")
    print("  POST /synthesize   - Generate speech from text")
    print("  POST /clear-cache  - Clear audio cache")
    print("\nPress Ctrl+C to stop")
    print("=" * 60)

    # Use asyncio event loop
    from hypercorn.asyncio import serve
    from hypercorn.config import Config

    config = Config()
    config.bind = [f"{host}:{port}"]

    asyncio.run(serve(app, config))
