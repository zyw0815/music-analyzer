from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.config import TMP_DIR
from app.analyzers.player import PlayerConverter

router = APIRouter()


@router.get("/stream/{file_id}")
async def stream_audio(file_id: str):
    """Stream an uploaded file as WAV audio."""
    # Search TMP_DIR for any file whose stem matches the file_id
    matches = list(TMP_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = matches[0]
    converter = PlayerConverter(str(file_path))
    wav_bytes = converter.to_wav_bytes()

    return Response(content=wav_bytes, media_type="audio/wav")
