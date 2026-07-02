from typing import Optional
import hashlib
from pathlib import Path
import numpy as np
import librosa
from mutagen import File as MutagenFile
from app.analyzers.context import AnalysisContext


class BasicInfoAnalyzer:
    def __init__(self, file_path: str, context: Optional[AnalysisContext] = None):
        self.file_path = Path(file_path)
        self.suffix = self.file_path.suffix.lower()
        self.context = context

    def analyze(self) -> dict:
        return {
            "file": self._file_info(),
            "audio": self._audio_info(),
            "timing": self._timing_info(),
            "loudness": self._loudness_info(),
            "tags": self._tags_info(),
            "dsd": self._dsd_info(),
        }

    def _file_info(self) -> dict:
        size = self.file_path.stat().st_size
        md5 = hashlib.md5()
        with self.file_path.open("rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                md5.update(chunk)
        fmt = self.suffix.lstrip(".").upper()
        if fmt == "M4A":
            fmt = "ALAC/AAC"
        return {
            "name": self.file_path.name,
            "size_bytes": size,
            "format": fmt,
            "encoder": self._get_encoder(),
            "md5": md5.hexdigest(),
        }

    def _get_encoder(self) -> Optional[str]:
        try:
            mf = MutagenFile(str(self.file_path))
            if mf and mf.info:
                return getattr(mf.info, "encoder", None) or getattr(mf.info, "encoder_info", None)
        except Exception:
            pass
        return None

    def _audio_info(self) -> dict:
        if self.context is not None:
            y = self.context.y_stereo
            sr = self.context.sr
        else:
            y, sr = librosa.load(str(self.file_path), sr=None, mono=False, duration=0.1)

        if y.ndim == 1:
            channels = 1
        else:
            channels = y.shape[0]

        channel_mode = "mono" if channels == 1 else "stereo"
        if channels > 2:
            channel_mode = f"{channels}ch"

        mutagen_file = MutagenFile(str(self.file_path))
        bitrate = None
        bitrate_mode = None
        if mutagen_file and mutagen_file.info:
            bitrate = getattr(mutagen_file.info, "bitrate", None)
            bitrate_mode = getattr(mutagen_file.info, "bitrate_mode", None)

        bit_depth = 16
        if mutagen_file and mutagen_file.info:
            bit_depth = getattr(mutagen_file.info, "bits_per_sample", 16) or 16

        return {
            "codec": self.suffix.lstrip(".").upper(),
            "sample_rate_hz": sr,
            "bit_depth": bit_depth,
            "channels": channels,
            "channel_mode": channel_mode,
            "bitrate_kbps": round(bitrate / 1000) if bitrate else None,
            "bitrate_mode": bitrate_mode or "CBR",
        }

    def _timing_info(self) -> dict:
        duration = self._metadata_duration_seconds()
        if duration is None:
            if self.context is not None:
                duration = len(self.context.mono) / self.context.sr
            else:
                y, sr = librosa.load(str(self.file_path), sr=None, mono=True, duration=None)
                duration = len(y) / sr
        return {
            "duration_seconds": round(duration, 2),
            "start_offset": 0.0,
        }

    def _metadata_duration_seconds(self) -> Optional[float]:
        try:
            mf = MutagenFile(str(self.file_path))
            if mf and mf.info:
                length = getattr(mf.info, "length", None)
                if length and length > 0:
                    return float(length)
        except Exception:
            pass
        return None

    def _loudness_info(self) -> dict:
        if self.context is not None:
            stats = self.context.stats()
            return {
                "peak_db": stats["peak_db"],
                "rms_db": stats["rms_db"],
                "dynamic_range_db": stats["dynamic_range_db"],
            }

        y, sr = librosa.load(str(self.file_path), sr=None, mono=True)
        abs_y = np.abs(y)
        peak = np.max(abs_y)
        peak_db = 20 * np.log10(peak) if peak > 0 else -np.inf
        rms = np.sqrt(np.mean(y ** 2))
        rms_db = 20 * np.log10(rms) if rms > 0 else -np.inf
        nonzero = abs_y > 0.001
        noise_floor = 20 * np.log10(np.percentile(abs_y[nonzero], 5)) if np.any(nonzero) else -np.inf
        dynamic_range = peak_db - noise_floor if noise_floor > -np.inf else 0
        return {
            "peak_db": round(float(peak_db), 2),
            "rms_db": round(float(rms_db), 2),
            "dynamic_range_db": round(float(dynamic_range), 2),
        }

    def _tags_info(self) -> dict:
        tags = {}
        try:
            mf = MutagenFile(str(self.file_path))
            if mf:
                tag_map = {"title": None, "artist": None, "album": None, "year": None, "genre": None, "track": None}
                for key in tag_map:
                    for tag_key in [key, key.upper(), key.capitalize()]:
                        val = mf.get(tag_key)
                        if val:
                            tag_map[key] = str(val[0]) if hasattr(val, '__getitem__') else str(val)
                            break
                tags = {k: v for k, v in tag_map.items() if v is not None}
        except Exception:
            pass
        return tags

    def _dsd_info(self) -> Optional[dict]:
        if self.suffix not in {".dsf", ".dff"}:
            return None
        try:
            with open(self.file_path, "rb") as f:
                header = f.read(4)
                if header == b"DSD ":
                    f.read(8)
                    f.read(4)
                    f.read(4)
                    ch_bytes = f.read(4)
                    channels = int.from_bytes(ch_bytes, "little")
                    sr_bytes = f.read(4)
                    sample_rate = int.from_bytes(sr_bytes, "little")
                    dsd_rate = sample_rate // 44100 if sample_rate > 0 else 0
                    return {"dsd_rate": dsd_rate, "dsd_channels": channels, "is_dsd": True}
        except Exception:
            pass
        return {"dsd_rate": None, "dsd_channels": None, "is_dsd": True}
