import numpy as np
import librosa
from app.analyzers.context import AnalysisContext, true_runs


class WaveformAnalyzer:
    def __init__(self, file_path: str, context: AnalysisContext | None = None):
        self.file_path = file_path
        self.context = context

    def analyze(self) -> dict:
        if self.context is not None:
            y, sr = self.context.mono, self.context.sr
        else:
            y, sr = librosa.load(self.file_path, sr=None, mono=True)
        return {
            "waveform": self._waveform(y, sr),
            "rms_envelope": self._rms_envelope(y, sr),
            "clipping_regions": self._detect_clipping(y, sr),
            "silence_regions": self._detect_silence(y, sr),
        }

    def _waveform(self, y: np.ndarray, sr: int) -> dict:
        # Downsample to max ~5000 points
        max_points = 5000
        if len(y) > max_points:
            indices = np.linspace(0, len(y) - 1, max_points, dtype=int)
            samples = y[indices]
            times = indices / sr
        else:
            samples = y
            times = np.arange(len(y)) / sr
        return {
            "samples": samples.tolist(),
            "times": np.round(times, 4).tolist(),
            "sample_rate": sr,
            "downsampled_rate": sr,
            "duration_seconds": round(len(y) / sr, 2),
        }

    def _rms_envelope(self, y: np.ndarray, sr: int) -> dict:
        frame_length = 2048
        hop = 512
        if self.context is not None:
            rms = self.context.rms(y, frame_length=frame_length, hop_length=hop)
        else:
            rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop)[0]
        rms_db = 20 * np.log10(rms + 1e-10)
        times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
        return {
            "values": rms_db.tolist(),
            "times": times.tolist(),
        }

    def _detect_clipping(self, y: np.ndarray, sr: int) -> list:
        threshold = 0.999
        clip_mask = np.abs(y) >= threshold
        starts, ends = true_runs(clip_mask, min_length=3)
        return [
            {
                "start": round(float(start / sr), 3),
                "end": round(float(end / sr), 3),
            }
            for start, end in zip(starts, ends)
        ]

    def _detect_silence(self, y: np.ndarray, sr: int) -> list:
        frame_length = 2048
        hop = 512
        if self.context is not None:
            rms = self.context.rms(y, frame_length=frame_length, hop_length=hop)
        else:
            rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop)[0]
        rms_db = 20 * np.log10(rms + 1e-10)
        silence_threshold = -60.0
        min_frames = int(0.3 * sr / hop)  # > 0.3s
        silence_mask = rms_db < silence_threshold
        regions = []
        consecutive = 0
        start_frame = 0
        for i, val in enumerate(silence_mask):
            if val:
                if consecutive == 0:
                    start_frame = i
                consecutive += 1
            else:
                if consecutive >= min_frames:
                    start_time = librosa.frames_to_time(start_frame, sr=sr, hop_length=hop)
                    end_time = librosa.frames_to_time(i - 1, sr=sr, hop_length=hop)
                    regions.append({
                        "start": round(float(start_time), 3),
                        "end": round(float(end_time), 3),
                    })
                consecutive = 0
        if consecutive >= min_frames:
            start_time = librosa.frames_to_time(start_frame, sr=sr, hop_length=hop)
            end_time = librosa.frames_to_time(len(silence_mask) - 1, sr=sr, hop_length=hop)
            regions.append({
                "start": round(float(start_time), 3),
                "end": round(float(end_time), 3),
            })
        return regions
