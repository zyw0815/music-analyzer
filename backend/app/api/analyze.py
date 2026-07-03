from pathlib import Path
from typing import Dict
import traceback
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File

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
_jobs: Dict[str, dict] = {}


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


def _set_job(job_id: str, **updates) -> None:
    if job_id in _jobs:
        _jobs[job_id].update(updates)


def _analyze_saved_file(
    saved_path: Path,
    display_filename: str,
    job_id: str | None = None,
) -> dict:
    file_id = saved_path.stem
    _file_store[file_id] = saved_path

    if job_id:
        _set_job(job_id, status="running", stage="prepare", progress=5, message="准备分析")

    analysis_path = get_analysis_path(saved_path)
    if job_id:
        _set_job(job_id, stage="decode", progress=15, message="解码音频")
    context = AnalysisContext.from_file(str(analysis_path))

    if job_id:
        _set_job(job_id, stage="basic", progress=25, message="读取基础信息")
    basic_analyzer = BasicInfoAnalyzer(str(analysis_path), context, metadata_path=str(saved_path))
    basic_info = basic_analyzer.analyze()
    basic_info["file"]["name"] = display_filename

    if job_id:
        _set_job(job_id, stage="quality", progress=40, message="质量检测")
    quality_analyzer = QualityAnalyzer(str(analysis_path), basic_info, context)
    quality_info = quality_analyzer.analyze()

    if job_id:
        _set_job(job_id, stage="spectrum", progress=60, message="频谱分析")
    spectrum_analyzer = SpectrumAnalyzer(str(analysis_path), context)
    spectrum_info = spectrum_analyzer.analyze()

    if job_id:
        _set_job(job_id, stage="waveform", progress=75, message="波形分析")
    waveform_analyzer = WaveformAnalyzer(str(analysis_path), context)
    waveform_info = waveform_analyzer.analyze()

    if job_id:
        _set_job(job_id, stage="channel", progress=90, message="声道分析")
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


def _run_analysis_job(job_id: str, saved_path: Path, display_filename: str) -> None:
    try:
        result = _analyze_saved_file(saved_path, display_filename, job_id)
        _set_job(job_id, status="done", stage="done", progress=100, message="分析完成", result=result)
    except Exception as exc:
        traceback.print_exc()
        _set_job(job_id, status="error", stage="error", message=str(exc), error=str(exc))


@router.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """Full analysis: runs all 5 analyzers."""
    saved_path = await _save_upload(file)
    return _analyze_saved_file(saved_path, _display_filename(file))


@router.post("/analyze/jobs")
async def create_analysis_job(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    saved_path = await _save_upload(file)
    file_id = saved_path.stem
    _file_store[file_id] = saved_path
    job_id = uuid.uuid4().hex
    _jobs[job_id] = {
        "job_id": job_id,
        "file_id": file_id,
        "status": "queued",
        "stage": "queued",
        "progress": 0,
        "message": "已上传，等待分析",
    }
    background_tasks.add_task(_run_analysis_job, job_id, saved_path, _display_filename(file))
    return _jobs[job_id]


@router.get("/analyze/jobs/{job_id}")
async def get_analysis_job(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/analyze/basic")
async def analyze_basic(file: UploadFile = File(...)):
    """Basic info only: runs BasicInfoAnalyzer only."""
    saved_path = await _save_upload(file)
    file_id = saved_path.stem
    _file_store[file_id] = saved_path

    analysis_path = get_analysis_path(saved_path)
    context = AnalysisContext.from_file(str(analysis_path))

    basic_analyzer = BasicInfoAnalyzer(str(analysis_path), context, metadata_path=str(saved_path))
    basic_info = basic_analyzer.analyze()
    basic_info = _apply_display_filename(basic_info, file)

    return basic_info
