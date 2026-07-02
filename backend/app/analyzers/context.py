from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple

import librosa
import numpy as np

from app.config import ANALYSIS_MAX_SAMPLES


def adaptive_hop_length(y: np.ndarray, target_frames: int, minimum: int = 512) -> int:
    return max(minimum, int(np.ceil(len(y) / target_frames)))


@dataclass
class AnalysisContext:
    file_path: str
    y_stereo: np.ndarray
    sr: int
    _mono: Optional[np.ndarray] = None
    _stft_cache: Dict[Tuple[int, int, int], np.ndarray] = field(default_factory=dict)
    _rms_cache: Dict[Tuple[int, int, int], np.ndarray] = field(default_factory=dict)

    @classmethod
    def from_file(cls, file_path: str) -> "AnalysisContext":
        sr = librosa.get_samplerate(path=file_path)
        duration = ANALYSIS_MAX_SAMPLES / sr
        y_stereo, sr = librosa.load(file_path, sr=None, mono=False, duration=duration)
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
