import os
from pathlib import Path

BACKEND_PORT = 9220
FRONTEND_PORT = 9211
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024  # 5 GB
ANALYSIS_MAX_SAMPLES = int(os.environ.get("ANALYZER_MAX_SAMPLES", 8_000_000))

SUPPORTED_FORMATS = {
    "mp3", "wav", "flac", "aac", "ogg", "oga", "opus",
    "aiff", "aif", "wma", "m4a", "ape", "dsf", "dff",
}

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".aac", ".ogg", ".oga", ".opus",
                    ".aiff", ".aif", ".wma", ".m4a", ".ape", ".dsf", ".dff"}

BACKEND_DIR = Path(__file__).resolve().parents[1]
TMP_DIR = Path(os.environ.get("ANALYZER_TMP_DIR", BACKEND_DIR / "tmp"))
TMP_DIR.mkdir(parents=True, exist_ok=True)

VERSION = "1.0.0"
