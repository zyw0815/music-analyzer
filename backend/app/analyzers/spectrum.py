import numpy as np
import librosa


class SpectrumAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def analyze(self) -> dict:
        y, sr = librosa.load(self.file_path, sr=None, mono=True)
        return {
            "spectrum": self._spectrum(y, sr),
            "spectrogram": self._spectrogram(y, sr),
            "frequency_distribution": self._frequency_distribution(y, sr),
        }

    def _spectrum(self, y: np.ndarray, sr: int) -> dict:
        n_fft = 4096
        S = np.abs(librosa.stft(y, n_fft=n_fft))
        mag = np.mean(S, axis=1)
        mag_db = 20 * np.log10(mag + 1e-10)
        peak_hold = np.max(S, axis=1)
        peak_hold_db = 20 * np.log10(peak_hold + 1e-10)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        return {
            "frequencies": freqs.tolist(),
            "magnitude_db": mag_db.tolist(),
            "peak_hold_db": peak_hold_db.tolist(),
        }

    def _spectrogram(self, y: np.ndarray, sr: int) -> dict:
        n_fft = 2048
        hop = 512
        S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop))
        S_db = librosa.amplitude_to_db(S, ref=np.max)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        # Downsample to ~500 time steps
        n_times = S_db.shape[1]
        if n_times > 500:
            indices = np.linspace(0, n_times - 1, 500, dtype=int)
            S_db = S_db[:, indices]
        return {
            "frequencies": freqs.tolist(),
            "times": np.linspace(0, len(y) / sr, S_db.shape[1]).tolist(),
            "magnitude_db": S_db.tolist(),
        }

    def _frequency_distribution(self, y: np.ndarray, sr: int) -> dict:
        bands = [
            {"label": "Sub-bass (20-60Hz)", "low": 20, "high": 60},
            {"label": "Bass (60-250Hz)", "low": 60, "high": 250},
            {"label": "Mid (250-2kHz)", "low": 250, "high": 2000},
            {"label": "Upper-mid (2k-6kHz)", "low": 2000, "high": 6000},
            {"label": "High (6k-20kHz)", "low": 6000, "high": 20000},
        ]
        n_fft = 4096
        S = np.abs(librosa.stft(y, n_fft=n_fft))
        mag = np.mean(S, axis=1)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        total_energy = np.sum(mag ** 2)
        result_bands = []
        for band in bands:
            mask = (freqs >= band["low"]) & (freqs < band["high"])
            energy = np.sum(mag[mask] ** 2) if np.any(mask) else 0
            energy_db = 10 * np.log10(energy / total_energy + 1e-10) if total_energy > 0 else -np.inf
            result_bands.append({
                "label": band["label"],
                "energy_db": round(float(energy_db), 2),
            })
        return {"bands": result_bands}
