"""
Edge TTS Server - Free, high-quality text-to-speech API
Uses Microsoft Edge's TTS engine for natural-sounding speech
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import edge_tts
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Edge TTS Server", version="1.0.0")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TTSRequest(BaseModel):
    text: str
    voice: str = "zh-CN-XiaoxiaoNeural"  # Default Chinese voice
    rate: str = "+0%"  # Speed: -50% to +100%
    pitch: str = "+0Hz"  # Pitch adjustment


class VoiceInfo(BaseModel):
    name: str
    short_name: str
    gender: str
    locale: str


# Popular voices for different languages
RECOMMENDED_VOICES = {
    "zh-CN": [
        {"name": "Xiaoxiao (Female, CN)", "short_name": "zh-CN-XiaoxiaoNeural", "gender": "Female", "locale": "zh-CN"},
        {"name": "Yunxi (Male, CN)", "short_name": "zh-CN-YunxiNeural", "gender": "Male", "locale": "zh-CN"},
        {"name": "Xiaoyi (Female, CN)", "short_name": "zh-CN-XiaoyiNeural", "gender": "Female", "locale": "zh-CN"},
    ],
    "en-US": [
        {"name": "Aria (Female, US)", "short_name": "en-US-AriaNeural", "gender": "Female", "locale": "en-US"},
        {"name": "Guy (Male, US)", "short_name": "en-US-GuyNeural", "gender": "Male", "locale": "en-US"},
        {"name": "Jenny (Female, US)", "short_name": "en-US-JennyNeural", "gender": "Female", "locale": "en-US"},
    ],
    "en-GB": [
        {"name": "Sonia (Female, UK)", "short_name": "en-GB-SoniaNeural", "gender": "Female", "locale": "en-GB"},
        {"name": "Ryan (Male, UK)", "short_name": "en-GB-RyanNeural", "gender": "Male", "locale": "en-GB"},
    ],
}


@app.get("/")
async def root():
    """API status endpoint"""
    return {
        "status": "running",
        "service": "Edge TTS Server",
        "version": "1.0.0",
        "endpoints": {
            "/tts": "POST - Generate speech from text",
            "/voices": "GET - List available voices",
        }
    }


@app.get("/voices")
async def get_voices():
    """Get list of recommended voices"""
    return {
        "voices": RECOMMENDED_VOICES,
        "note": "These are recommended voices. Edge TTS supports 100+ voices."
    }


def split_text(text: str, max_length: int = 1000) -> list[str]:
    """
    Split text into chunks that are safe for Edge TTS.
    Tries to split at sentence boundaries.
    """
    if len(text) <= max_length:
        return [text]

    chunks = []
    sentences = text.replace('!', '.').replace('?', '.').split('.')
    current_chunk = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        if len(current_chunk) + len(sentence) + 1 <= max_length:
            current_chunk += sentence + ". "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech using Edge TTS

    Parameters:
    - text: The text to convert to speech
    - voice: Voice ID (e.g., "zh-CN-XiaoxiaoNeural")
    - rate: Speech rate (-50% to +100%, default +0%)
    - pitch: Pitch adjustment (e.g., "+0Hz", "-10Hz")

    Returns:
    - Audio stream in MP3 format
    """
    try:
        logger.info(f"TTS request: voice={request.voice}, text_length={len(request.text)}")

        # Split long text into chunks
        text_chunks = split_text(request.text, max_length=1000)
        logger.info(f"Split text into {len(text_chunks)} chunks")

        # Generate audio for each chunk
        audio_data = io.BytesIO()

        for i, chunk in enumerate(text_chunks):
            logger.info(f"Processing chunk {i+1}/{len(text_chunks)}, length={len(chunk)}")

            # Create TTS communicate object
            communicate = edge_tts.Communicate(
                text=chunk,
                voice=request.voice,
                rate=request.rate,
                pitch=request.pitch
            )

            # Generate audio
            async for stream_chunk in communicate.stream():
                if stream_chunk["type"] == "audio":
                    audio_data.write(stream_chunk["data"])

        audio_data.seek(0)

        logger.info(f"TTS generation successful: {len(audio_data.getvalue())} bytes")

        return StreamingResponse(
            audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Cache-Control": "public, max-age=3600"
            }
        )

    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🎙️  Edge TTS Server Starting...")
    print("=" * 60)
    print("📍 Server will be available at:")
    print("   - Local:   http://localhost:5002")
    print("   - Network: http://<your-ip>:5002")
    print("")
    print("📱 For mobile access:")
    print("   1. Make sure your phone is on the same WiFi")
    print("   2. Find your computer's IP address")
    print("   3. Access http://<computer-ip>:5002 from your phone")
    print("=" * 60)

    uvicorn.run(app, host="0.0.0.0", port=5002, log_level="info")
