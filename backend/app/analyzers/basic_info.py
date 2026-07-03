from typing import Optional
import hashlib
from pathlib import Path
import numpy as np
import librosa
from mutagen import File as MutagenFile
from app.analyzers.context import AnalysisContext


class BasicInfoAnalyzer:
    def __init__(
        self,
        file_path: str,
        context: Optional[AnalysisContext] = None,
        metadata_path: Optional[str] = None,
    ):
        self.file_path = Path(file_path)
        self.metadata_path = Path(metadata_path) if metadata_path else self.file_path
        self.suffix = self.metadata_path.suffix.lower()
        self.context = context
        self._dsd_cache = None

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
        size = self.metadata_path.stat().st_size
        md5 = hashlib.md5()
        with self.metadata_path.open("rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                md5.update(chunk)
        fmt = self.suffix.lstrip(".").upper()
        if fmt == "M4A":
            fmt = "ALAC/AAC"
        return {
            "name": self.metadata_path.name,
            "size_bytes": size,
            "format": fmt,
            "encoder": self._get_encoder(),
            "md5": md5.hexdigest(),
        }

    def _get_encoder(self) -> Optional[str]:
        try:
            mf = MutagenFile(str(self.metadata_path))
            if mf and mf.info:
                return getattr(mf.info, "encoder", None) or getattr(mf.info, "encoder_info", None)
        except Exception:
            pass
        return None

    def _audio_info(self) -> dict:
        dsd_info = self._dsd_info()
        if dsd_info:
            channels = dsd_info.get("dsd_channels")
            if channels is None and self.context is not None:
                channels = 1 if self.context.y_stereo.ndim == 1 else self.context.y_stereo.shape[0]
            channels = channels or 1
            channel_mode = "mono" if channels == 1 else "stereo"
            if channels > 2:
                channel_mode = f"{channels}ch"
            duration = self._metadata_duration_seconds()
            if duration is None and self.context is not None and self.context.sr > 0:
                duration = len(self.context.mono) / self.context.sr
            bitrate = None
            if duration and duration > 0:
                bitrate = round(self.metadata_path.stat().st_size * 8 / duration / 1000)
            return {
                "codec": self.suffix.lstrip(".").upper(),
                "sample_rate_hz": dsd_info.get("sample_rate_hz") or (self.context.sr if self.context else 0),
                "bit_depth": dsd_info.get("bits_per_sample") or 1,
                "channels": channels,
                "channel_mode": channel_mode,
                "bitrate_kbps": bitrate,
                "bitrate_mode": "CBR",
            }

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

        mutagen_file = MutagenFile(str(self.metadata_path))
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
            mf = MutagenFile(str(self.metadata_path))
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
            mf = MutagenFile(str(self.metadata_path))
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
        if self._dsd_cache is not None:
            return self._dsd_cache
        if self.suffix not in {".dsf", ".dff"}:
            return None
        if self.suffix == ".dff":
            self._dsd_cache = self._dff_info()
            return self._dsd_cache

        self._dsd_cache = self._dsf_info()
        return self._dsd_cache

    def _dsf_info(self) -> dict:
        try:
            data = self.metadata_path.read_bytes()
            fmt_offset = data.find(b"fmt ")
            if fmt_offset >= 0 and len(data) >= fmt_offset + 52:
                base = fmt_offset + 12
                channels = int.from_bytes(data[base + 12:base + 16], "little")
                sample_rate = int.from_bytes(data[base + 16:base + 20], "little")
                bits_per_sample = int.from_bytes(data[base + 20:base + 24], "little")
                dsd_rate = sample_rate // 44100 if sample_rate > 0 else None
                return {
                    "dsd_rate": dsd_rate,
                    "dsd_channels": channels,
                    "sample_rate_hz": sample_rate,
                    "bits_per_sample": bits_per_sample or 1,
                    "is_dsd": True,
                }
        except Exception:
            pass
        return {"dsd_rate": None, "dsd_channels": None, "is_dsd": True}

    def _dff_info(self) -> dict:
        try:
            sample_rate, channels = self._parse_dff_chunks()
            if sample_rate or channels:
                dsd_rate = sample_rate // 44100 if sample_rate else None
                return {
                    "dsd_rate": dsd_rate,
                    "dsd_channels": channels,
                    "sample_rate_hz": sample_rate,
                    "bits_per_sample": 1,
                    "is_dsd": True,
                }
            mf = MutagenFile(str(self.metadata_path))
            if mf and mf.info:
                sample_rate = getattr(mf.info, "sample_rate", None)
                channels = getattr(mf.info, "channels", None)
                dsd_rate = sample_rate // 44100 if sample_rate else None
                return {
                    "dsd_rate": dsd_rate,
                    "dsd_channels": channels,
                    "sample_rate_hz": sample_rate,
                    "bits_per_sample": 1,
                    "is_dsd": True,
                }
        except Exception:
            pass
        return {"dsd_rate": None, "dsd_channels": None, "is_dsd": True}

    def _parse_dff_chunks(self) -> tuple[Optional[int], Optional[int]]:
        sample_rate = None
        channels = None

        def read_chunk_header(f):
            chunk_id = f.read(4)
            if len(chunk_id) < 4:
                return None, None
            size_bytes = f.read(8)
            if len(size_bytes) < 8:
                return None, None
            return chunk_id, int.from_bytes(size_bytes, "big")

        def scan_chunks(f, end):
            nonlocal sample_rate, channels
            while f.tell() + 12 <= end and (sample_rate is None or channels is None):
                chunk_start = f.tell()
                chunk_id, size = read_chunk_header(f)
                if not chunk_id:
                    break
                data_start = f.tell()
                data_end = min(data_start + size, end)

                if chunk_id == b"FS  " and size >= 4:
                    sample_rate = int.from_bytes(f.read(4), "big")
                elif chunk_id == b"CHNL" and size >= 2:
                    channels = int.from_bytes(f.read(2), "big")
                elif chunk_id == b"PROP" and size >= 4:
                    f.read(4)
                    scan_chunks(f, data_end)

                next_pos = chunk_start + 12 + size + (size % 2)
                f.seek(min(next_pos, end))

        with self.metadata_path.open("rb") as f:
            chunk_id, size = read_chunk_header(f)
            if chunk_id != b"FRM8" or not size:
                return None, None
            f.read(4)
            scan_chunks(f, min(12 + size, self.metadata_path.stat().st_size))

        return sample_rate, channels
