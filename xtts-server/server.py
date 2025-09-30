"""
XTTS v2 Server - High-quality emotional text-to-speech API
Uses Coqui XTTS v2 for natural-sounding speech with emotion, proper pacing, and emphasis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import torch
from TTS.api import TTS
import io
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="XTTS v2 Server", version="1.0.0")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global TTS model
tts_model = None
device = None


def initialize_model():
    """Initialize XTTS v2 model on startup"""
    global tts_model, device

    logger.info("Initializing XTTS v2 model...")

    # Check for GPU availability
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")

    # Initialize XTTS v2 model
    # This will download the model on first run (~2GB)
    tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

    logger.info("XTTS v2 model loaded successfully")


class TTSRequest(BaseModel):
    text: str
    voice: str = "female"  # Default voice
    language: str = "en"  # Default language
    speed: float = 1.0  # Speech speed multiplier


# Available voice samples (built-in XTTS speakers)
VOICES = {
    "female": "Female voice - warm and expressive",
    "male": "Male voice - calm and professional",
    "female_emotional": "Female voice - highly expressive",
    "male_deep": "Male voice - deep and authoritative",
}


@app.on_event("startup")
async def startup_event():
    """Initialize model on server startup"""
    initialize_model()


@app.get("/")
async def root():
    """API status endpoint"""
    return {
        "status": "running",
        "service": "XTTS v2 Server",
        "version": "1.0.0",
        "model": "xtts_v2",
        "device": str(device),
        "endpoints": {
            "/tts": "POST - Generate speech from text",
            "/voices": "GET - List available voices",
        }
    }


@app.get("/voices")
async def get_voices():
    """Get list of available voices"""
    return {
        "voices": VOICES,
        "note": "XTTS v2 supports voice cloning and multiple emotional styles"
    }


@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech using XTTS v2

    Parameters:
    - text: The text to convert to speech
    - voice: Voice style (female, male, female_emotional, male_deep)
    - language: Language code (en, es, fr, de, it, pt, pl, zh-cn, etc.)
    - speed: Speech speed multiplier (0.5 to 2.0, default 1.0)

    Returns:
    - Audio stream in WAV format
    """
    try:
        if tts_model is None:
            raise HTTPException(status_code=503, detail="TTS model not initialized")

        logger.info(f"TTS request: voice={request.voice}, lang={request.language}, text_length={len(request.text)}")

        # Map voice to speaker name
        # XTTS v2 has built-in speakers we can use
        speaker_map = {
            "female": "Claribel Dervla",
            "male": "Damien Black",
            "female_emotional": "Ana Florence",
            "male_deep": "Baldur Sanjin"
        }
        speaker = speaker_map.get(request.voice, "Claribel Dervla")

        # Generate speech
        # XTTS v2 automatically handles:
        # - Emotional inflection based on context
        # - Proper punctuation-based pausing
        # - Natural emphasis on important words
        wav = tts_model.tts(
            text=request.text,
            language=request.language,
            speaker=speaker,
            speed=request.speed,
        )

        # Convert to bytes
        import scipy.io.wavfile as wavfile
        import numpy as np

        audio_buffer = io.BytesIO()
        # XTTS outputs at 24kHz
        wavfile.write(audio_buffer, 24000, np.array(wav))
        audio_buffer.seek(0)

        logger.info(f"TTS generation successful: {len(audio_buffer.getvalue())} bytes")

        return StreamingResponse(
            audio_buffer,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=speech.wav",
                "Cache-Control": "public, max-age=3600"
            }
        )

    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": tts_model is not None,
        "device": str(device)
    }


if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("🎙️  XTTS v2 Server Starting...")
    print("=" * 70)
    print("📍 Server will be available at:")
    print("   - Local:   http://localhost:5001")
    print("   - Network: http://<your-ip>:5001")
    print("")
    print("🎭 Features:")
    print("   - Emotional and expressive speech")
    print("   - Natural punctuation-based pausing")
    print("   - Automatic emphasis on key words")
    print("   - Context-aware intonation")
    print("")
    print("📱 For mobile access:")
    print("   1. Make sure your phone is on the same WiFi")
    print("   2. Find your computer's IP address")
    print("   3. Access http://<computer-ip>:5001 from your phone")
    print("")
    print("⚠️  First run will download XTTS v2 model (~2GB)")
    print("=" * 70)

    uvicorn.run(app, host="0.0.0.0", port=5001, log_level="info")
