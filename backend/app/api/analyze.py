from pathlib import Path
from typing import Dict

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.config import SUPPORTED_FORMATS, AUDIO_EXTENSIONS, MAX_FILE_SIZE_BYTES
from app.utils import get_analysis_path, save_upload
from app.analyzers.basic_info import BasicInfoAnalyzer
from app.analyzers.quality import QualityAnalyzer
from app.analyzers.spectrum import SpectrumAnalyzer
from app.analyzers.waveform import WaveformAnalyzer
from app.analyzers.channel import ChannelAnalyzer

router = APIRouter()

# Map file_id -> Path so stream can look up uploads later
_file_store: Dict[str, Path] = {}


def _validate_upload(file: UploadFile, content: bytes) -> None:
    """Validate format and size, raise 400 on failure."""
    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: .{ext}")
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large")


@router.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """Full analysis: runs all 5 analyzers."""
    content = await file.read()
    _validate_upload(file, content)

    saved_path = save_upload(content, file.filename or "upload.bin")
    file_id = saved_path.stem
    _file_store[file_id] = saved_path

    analysis_path = get_analysis_path(saved_path)

    basic_analyzer = BasicInfoAnalyzer(str(analysis_path))
    basic_info = basic_analyzer.analyze()

    quality_analyzer = QualityAnalyzer(str(analysis_path), basic_info)
    quality_info = quality_analyzer.analyze()

    spectrum_analyzer = SpectrumAnalyzer(str(analysis_path))
    spectrum_info = spectrum_analyzer.analyze()

    waveform_analyzer = WaveformAnalyzer(str(analysis_path))
    waveform_info = waveform_analyzer.analyze()

    channel_analyzer = ChannelAnalyzer(str(analysis_path))
    channel_info = channel_analyzer.analyze()

    return {
        "file_id": file_id,
        "basic_info": basic_info,
        "quality": quality_info,
        "spectrum": spectrum_info,
        "waveform": waveform_info,
        "channel": channel_info,
    }


@router.post("/analyze/basic")
async def analyze_basic(file: UploadFile = File(...)):
    """Basic info only: runs BasicInfoAnalyzer only."""
    content = await file.read()
    _validate_upload(file, content)

    saved_path = save_upload(content, file.filename or "upload.bin")
    file_id = saved_path.stem
    _file_store[file_id] = saved_path

    analysis_path = get_analysis_path(saved_path)

    basic_analyzer = BasicInfoAnalyzer(str(analysis_path))
    basic_info = basic_analyzer.analyze()

    return basic_info
