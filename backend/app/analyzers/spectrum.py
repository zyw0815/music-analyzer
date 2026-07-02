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
        mag_db = librosa.amplitude_to_db(mag, ref=np.max)
        peak_hold = np.max(S, axis=1)
        peak_hold_db = librosa.amplitude_to_db(peak_hold, ref=np.max)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        return {
            "frequencies": freqs.tolist(),
            "magnitude_db": np.round(mag_db, 2).tolist(),
            "peak_hold_db": np.round(peak_hold_db, 2).tolist(),
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
        bands_def = [
            ("20-60Hz", 20, 60),
            ("60-250Hz", 60, 250),
            ("250-2kHz", 250, 2000),
            ("2k-6kHz", 2000, 6000),
            ("6k-20kHz", 6000, 20000),
        ]
        n_fft = 4096
        S = np.abs(librosa.stft(y, n_fft=n_fft))
        mag = np.mean(S, axis=1)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        ref = np.max(mag) if np.max(mag) > 0 else 1.0
        band_names = []
        energies = []
        for name, low, high in bands_def:
            mask = (freqs >= low) & (freqs < high)
            if np.any(mask):
                band_mag = np.mean(mag[mask])
                energy_db = float(librosa.amplitude_to_db(np.array([band_mag]), ref=ref)[0])
            else:
                energy_db = -80.0
            band_names.append(name)
            energies.append(round(energy_db, 1))
        return {"bands": band_names, "energy_db": energies}
