from pathlib import Path
from typing import Dict

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.config import SUPPORTED_FORMATS, AUDIO_EXTENSIONS, MAX_FILE_SIZE_BYTES
from app.utils import get_analysis_path, reserve_upload_path
from app.analyzers.context import AnalysisContext
from app.analyzers.basic_info import BasicInfoAnalyzer
from app.analyzers.quality import QualityAnalyzer
from app.analyzers.spectrum import SpectrumAnalyzer
from app.analyzers.waveform import WaveformAnalyzer
from app.analyzers.channel import ChannelAnalyzer

router = APIRouter()

# Map file_id -> Path so stream can look up uploads later
_file_store: Dict[str, Path] = {}


def _validate_upload_extension(file: UploadFile) -> None:
    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: .{ext}")


async def _save_upload(file: UploadFile) -> Path:
    _validate_upload_extension(file)
    path = reserve_upload_path(file.filename or "upload.bin")
    total = 0
    try:
        with path.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(status_code=400, detail="File too large")
                out.write(chunk)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    return path


def _display_filename(file: UploadFile) -> str:
    return Path(file.filename or "upload.bin").name


def _apply_display_filename(basic_info: dict, file: UploadFile) -> dict:
    basic_info["file"]["name"] = _display_filename(file)
    return basic_info


@router.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """Full analysis: runs all 5 analyzers."""
    saved_path = await _save_upload(file)
    file_id = saved_path.stem
    _file_store[file_id] = saved_path

    analysis_path = get_analysis_path(saved_path)
    context = AnalysisContext.from_file(str(analysis_path))

    basic_analyzer = BasicInfoAnalyzer(str(analysis_path), context)
    basic_info = basic_analyzer.analyze()
    basic_info = _apply_display_filename(basic_info, file)

    quality_analyzer = QualityAnalyzer(str(analysis_path), basic_info, context)
    quality_info = quality_analyzer.analyze()

    spectrum_analyzer = SpectrumAnalyzer(str(analysis_path), context)
    spectrum_info = spectrum_analyzer.analyze()

    waveform_analyzer = WaveformAnalyzer(str(analysis_path), context)
    waveform_info = waveform_analyzer.analyze()

    channel_analyzer = ChannelAnalyzer(str(analysis_path), context)
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
    saved_path = await _save_upload(file)
    file_id = saved_path.stem
    _file_store[file_id] = saved_path

    analysis_path = get_analysis_path(saved_path)
    context = AnalysisContext.from_file(str(analysis_path))

    basic_analyzer = BasicInfoAnalyzer(str(analysis_path), context)
    basic_info = basic_analyzer.analyze()
    basic_info = _apply_display_filename(basic_info, file)

    return basic_info
