from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple

import librosa
import numpy as np


def adaptive_hop_length(y: np.ndarray, target_frames: int, minimum: int = 512) -> int:
    return max(minimum, int(np.ceil(len(y) / target_frames)))


def true_runs(mask: np.ndarray, min_length: int = 1) -> tuple[np.ndarray, np.ndarray]:
    if mask.size == 0:
        return np.array([], dtype=int), np.array([], dtype=int)

    padded = np.concatenate(([False], mask, [False]))
    changes = np.diff(padded.astype(np.int8))
    starts = np.flatnonzero(changes == 1)
    ends = np.flatnonzero(changes == -1)
    keep = (ends - starts) >= min_length
    return starts[keep], ends[keep]


def _iter_chunks(y: np.ndarray, chunk_size: int = 1_000_000):
    for start in range(0, len(y), chunk_size):
        end = min(start + chunk_size, len(y))
        yield start, end, y[start:end]


@dataclass
class AnalysisContext:
    file_path: str
    y_stereo: np.ndarray
    sr: int
    _mono: Optional[np.ndarray] = None
    _stft_cache: Dict[Tuple[int, int, int], np.ndarray] = field(default_factory=dict)
    _rms_cache: Dict[Tuple[int, int, int], np.ndarray] = field(default_factory=dict)
    _stats: Optional[dict] = None
    _clipping_regions: Optional[list[dict]] = None

    @classmethod
    def from_file(cls, file_path: str) -> "AnalysisContext":
        y_stereo, sr = librosa.load(file_path, sr=None, mono=False)
        return cls(file_path=file_path, y_stereo=y_stereo, sr=sr)

    @property
    def is_mono(self) -> bool:
        return self.y_stereo.ndim == 1

    @property
    def mono(self) -> np.ndarray:
        if self._mono is None:
            if self.is_mono:
                self._mono = self.y_stereo
            else:
                self._mono = np.mean(self.y_stereo, axis=0)
        return self._mono

    @property
    def left(self) -> np.ndarray:
        return self.y_stereo if self.is_mono else self.y_stereo[0]

    @property
    def right(self) -> np.ndarray:
        return self.y_stereo if self.is_mono else self.y_stereo[1]

    def stft(
        self,
        y: np.ndarray,
        n_fft: int,
        hop_length: Optional[int] = None,
        cache: bool = True,
    ) -> np.ndarray:
        hop = hop_length or n_fft // 4
        if not cache:
            return np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop))

        key = (id(y), n_fft, hop)
        if key not in self._stft_cache:
            self._stft_cache[key] = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop))
        return self._stft_cache[key]

    def rms(self, y: np.ndarray, frame_length: int = 2048, hop_length: int = 512) -> np.ndarray:
        key = (id(y), frame_length, hop_length)
        if key not in self._rms_cache:
            self._rms_cache[key] = librosa.feature.rms(
                y=y,
                frame_length=frame_length,
                hop_length=hop_length,
            )[0]
        return self._rms_cache[key]

    def stats(self) -> dict:
        if self._stats is not None:
            return self._stats

        y = self.mono
        total = len(y)
        peak = 0.0
        square_sum = 0.0
        clip_samples = 0
        clip_count = 0
        clip_run_start = None
        clip_run_length = 0
        hist = np.zeros(2048, dtype=np.int64)
        hist_min = 0.001
        hist_max = 1.0

        for start, _end, chunk in _iter_chunks(y):
            abs_chunk = np.abs(chunk)
            if len(abs_chunk):
                peak = max(peak, float(np.max(abs_chunk)))
                square_sum += float(np.dot(chunk, chunk))

            hist += np.histogram(abs_chunk, bins=len(hist), range=(hist_min, hist_max))[0]

            clip_mask = abs_chunk >= 0.999
            clip_samples += int(np.count_nonzero(clip_mask))
            for offset in np.flatnonzero(clip_mask):
                index = start + int(offset)
                if clip_run_start is None or index != clip_run_start + clip_run_length:
                    if clip_run_length >= 3:
                        clip_count += 1
                    clip_run_start = index
                    clip_run_length = 1
                else:
                    clip_run_length += 1

        if clip_run_length >= 3:
            clip_count += 1

        peak_db = 20 * np.log10(peak) if peak > 0 else -np.inf

        rms = np.sqrt(square_sum / total) if total else 0.0
        rms_db = 20 * np.log10(rms) if rms > 0 else -np.inf

        hist_total = int(hist.sum())
        if hist_total:
            target = max(1, int(np.ceil(hist_total * 0.05)))
            bin_index = int(np.searchsorted(np.cumsum(hist), target))
            noise_amp = hist_min + (bin_index + 0.5) * ((hist_max - hist_min) / len(hist))
            noise_floor = 20 * np.log10(noise_amp)
        else:
            noise_floor = -np.inf

        clip_ratio_percent = float(clip_samples / total * 100) if total else 0.0

        dynamic_range = peak_db - noise_floor if noise_floor > -np.inf else 0
        self._stats = {
            "peak_db": round(float(peak_db), 2),
            "rms_db": round(float(rms_db), 2),
            "noise_floor_db": float(noise_floor),
            "dynamic_range_db": round(float(dynamic_range), 2),
            "clipping": {
                "detected": clip_count > 0,
                "clip_count": int(clip_count),
                "clip_ratio_percent": round(clip_ratio_percent, 4),
            },
        }
        return self._stats

    def clipping_regions(self, threshold: float = 0.999, min_length: int = 3) -> list[dict]:
        if self._clipping_regions is not None:
            return self._clipping_regions

        regions = []
        run_start = None
        run_length = 0
        y = self.mono
        for start, _end, chunk in _iter_chunks(y):
            clip_offsets = np.flatnonzero(np.abs(chunk) >= threshold)
            for offset in clip_offsets:
                index = start + int(offset)
                if run_start is None or index != run_start + run_length:
                    if run_length >= min_length:
                        regions.append({"start_sample": run_start, "end_sample": run_start + run_length})
                    run_start = index
                    run_length = 1
                else:
                    run_length += 1

        if run_length >= min_length:
            regions.append({"start_sample": run_start, "end_sample": run_start + run_length})

        self._clipping_regions = regions
        return regions
