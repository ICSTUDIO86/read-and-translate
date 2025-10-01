#!/usr/bin/env python3
"""
Edge TTS Server for BookReader Application
Provides text-to-speech synthesis using Microsoft Edge TTS
"""

import asyncio
import hashlib
import os
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


def get_cache_key(text: str, voice: str, rate: str, pitch: str) -> str:
    """Generate cache key from parameters"""
    key_string = f"{text}|{voice}|{rate}|{pitch}"
    return hashlib.md5(key_string.encode()).hexdigest()


async def generate_speech(text: str, voice: str, rate: str = "+0%", pitch: str = "+0Hz") -> bytes:
    """Generate speech using Edge TTS"""
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)

    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
    temp_path = temp_file.name
    temp_file.close()

    try:
        await communicate.save(temp_path)

        # Read the file content
        with open(temp_path, 'rb') as f:
            audio_data = f.read()

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
        data = await request.get_json()

        # Get parameters
        text = data.get('text', '')
        voice = data.get('voice', 'zh-CN-XiaoxiaoNeural')
        rate = data.get('rate', '+0%')
        pitch = data.get('pitch', '+0Hz')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Check cache first
        cache_key = get_cache_key(text, voice, rate, pitch)
        cache_file = CACHE_DIR / f"{cache_key}.mp3"

        if cache_file.exists():
            print(f"[Edge TTS] Cache hit: {cache_key[:8]}...")
            return send_file(
                cache_file,
                mimetype='audio/mpeg',
                as_attachment=False,
                download_name='speech.mp3'
            )

        # Generate new speech
        print(f"[Edge TTS] Generating: {text[:50]}... (voice: {voice})")
        audio_data = await generate_speech(text, voice, rate, pitch)

        # Save to cache
        with open(cache_file, 'wb') as f:
            f.write(audio_data)

        print(f"[Edge TTS] Generated and cached: {cache_key[:8]}...")

        return send_file(
            cache_file,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3'
        )

    except Exception as e:
        print(f"[Edge TTS] Error: {e}")
        return jsonify({'error': str(e)}), 500


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
