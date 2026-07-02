import numpy as np
import librosa
from app.analyzers.context import AnalysisContext


class ChannelAnalyzer:
    def __init__(self, file_path: str, context: AnalysisContext | None = None):
        self.file_path = file_path
        self.context = context

    def analyze(self) -> dict:
        if self.context is not None:
            y_stereo, sr = self.context.y_stereo, self.context.sr
        else:
            y_stereo, sr = librosa.load(self.file_path, sr=None, mono=False)
        if y_stereo.ndim == 1:
            # Mono file
            return self._mono_result(y_stereo, sr)
        left = y_stereo[0]
        right = y_stereo[1]
        return self._stereo_result(left, right, sr)

    def _mono_result(self, y: np.ndarray, sr: int) -> dict:
        spectrum = self._compute_spectrum(y, sr)
        return {
            "phase_correlation": 1.0,
            "channel_balance_db": 0.0,
            "left_spectrum": spectrum,
            "right_spectrum": spectrum,
            "mid_spectrum": spectrum,
            "side_spectrum": {
                "frequencies": spectrum["frequencies"],
                "magnitude_db": [0.0] * len(spectrum["frequencies"]),
            },
            "stereo_width": 0.0,
            "is_mono": True,
        }

    def _stereo_result(self, left: np.ndarray, right: np.ndarray, sr: int) -> dict:
        phase_corr = float(np.corrcoef(left, right)[0, 1])
        l_rms = np.sqrt(np.mean(left ** 2))
        r_rms = np.sqrt(np.mean(right ** 2))
        balance_db = round(float(20 * np.log10(l_rms / r_rms)) if r_rms > 0 else 0.0, 2)
        mid = (left + right) / 2.0
        side = (left - right) / 2.0
        mid_rms = np.sqrt(np.mean(mid ** 2))
        side_rms = np.sqrt(np.mean(side ** 2))
        stereo_width = round(float(side_rms / mid_rms) if mid_rms > 0 else 0.0, 4)
        return {
            "phase_correlation": round(phase_corr, 4),
            "channel_balance_db": balance_db,
            "left_spectrum": self._compute_spectrum(left, sr),
            "right_spectrum": self._compute_spectrum(right, sr),
            "mid_spectrum": self._compute_spectrum(mid, sr),
            "side_spectrum": self._compute_spectrum(side, sr),
            "stereo_width": stereo_width,
            "is_mono": False,
        }

    def _compute_spectrum(self, y: np.ndarray, sr: int) -> dict:
        n_fft = 4096
        if self.context is not None:
            S = self.context.stft(y, n_fft=n_fft, cache=False)
        else:
            S = np.abs(librosa.stft(y, n_fft=n_fft))
        mag = np.mean(S, axis=1)
        mag_db = librosa.amplitude_to_db(mag, ref=np.max)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        return {
            "frequencies": freqs.tolist(),
            "magnitude_db": np.round(mag_db, 2).tolist(),
        }
