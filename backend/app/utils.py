import subprocess
import uuid
from pathlib import Path

from app.config import TMP_DIR

DSD_EXTENSIONS = {".dsf", ".dff"}


def is_dsd(file_path: Path) -> bool:
    return file_path.suffix.lower() in DSD_EXTENSIONS


def convert_dsd_to_pcm(input_path: Path) -> Path:
    output_path = TMP_DIR / f"{uuid.uuid4().hex}.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(input_path), "-af", "dsd2pcm", "-f", "wav", str(output_path)],
        check=True,
        capture_output=True,
    )
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
