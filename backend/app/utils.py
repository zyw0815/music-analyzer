import subprocess
import uuid
from pathlib import Path

from app.config import TMP_DIR

DSD_EXTENSIONS = {".dsf", ".dff"}


def is_dsd(file_path: Path) -> bool:
    return file_path.suffix.lower() in DSD_EXTENSIONS


def convert_dsd_to_pcm(input_path: Path) -> Path:
    output_path = TMP_DIR / f"{uuid.uuid4().hex}.wav"
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(input_path),
        "-map",
        "0:a:0",
        "-vn",
        "-acodec",
        "pcm_s24le",
        "-ar",
        "176400",
        "-f",
        "wav",
        str(output_path),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        output_path.unlink(missing_ok=True)
        detail = (exc.stderr or exc.stdout or str(exc)).strip()
        raise RuntimeError(f"DSD to PCM conversion failed: {detail}") from exc
    return output_path


def get_analysis_path(file_path: Path) -> Path:
    if is_dsd(file_path):
        return convert_dsd_to_pcm(file_path)
    return file_path


def save_upload(content: bytes, filename: str) -> Path:
    file_id = uuid.uuid4().hex
    ext = Path(filename).suffix
    path = TMP_DIR / f"{file_id}{ext}"
    path.write_bytes(content)
    return path


def reserve_upload_path(filename: str) -> Path:
    file_id = uuid.uuid4().hex
    ext = Path(filename).suffix
    return TMP_DIR / f"{file_id}{ext}"
