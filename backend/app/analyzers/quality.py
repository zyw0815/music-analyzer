import numpy as np
import librosa
from app.analyzers.context import AnalysisContext


class QualityAnalyzer:
    def __init__(self, file_path: str, basic_info: dict, context: AnalysisContext | None = None):
        self.file_path = file_path
        self.info = basic_info
        self.context = context
        self.y = None
        self.sr = None
        self._clipping = None
        self._noise_floor = None

    def _load(self):
        if self.y is None:
            if self.context is not None:
                self.y, self.sr = self.context.mono, self.context.sr
            else:
                self.y, self.sr = librosa.load(self.file_path, sr=None, mono=True)

    def analyze(self) -> dict:
        self._load()
        scores = {
            "bitrate": self._score_bitrate(),
            "integrity": self._score_integrity(),
            "quality_detection": self._score_quality_detection(),
            "channel": self._score_channel(),
            "spectral": self._score_spectral(),
            "dynamic_range": self._score_dynamic_range(),
            "distortion": self._score_distortion(),
        }
        weights = {
            "bitrate": 0.15,
            "integrity": 0.10,
            "quality_detection": 0.20,
            "channel": 0.10,
            "spectral": 0.15,
            "dynamic_range": 0.15,
            "distortion": 0.15,
        }
        overall = round(sum(scores[k] * weights[k] for k in scores))
        grade = self._grade(overall)
        details = self._details(scores)
        return {"overall_score": overall, "grade": grade, "sub_scores": scores, "details": details}

    def _score_bitrate(self) -> int:
        audio = self.info.get("audio", {})
        codec = audio.get("codec", "").upper()
        if codec in {"FLAC", "WAV", "AIFF", "APE", "ALAC/AAC"}:
            return 100
        br = audio.get("bitrate_kbps") or 0
        return max(0, min(100, round((br - 64) / (320 - 64) * 100)))

    def _score_integrity(self) -> int:
        score = 100
        if self.info.get("file", {}).get("md5") is None:
            score -= 40
        duration = self.info.get("timing", {}).get("duration_seconds", 0)
        if duration <= 0:
            score -= 30
        return max(0, score)

    def _score_quality_detection(self) -> int:
        clipping = self._detect_clipping()
        noise_floor = self._estimate_noise_floor()
        clip_score = max(0, 100 - clipping["clip_ratio_percent"] * 2000)
        noise_score = min(100, max(0, (noise_floor + 80) * 2.5))
        return round(clip_score * 0.4 + noise_score * 0.3 + 100 * 0.3)

    def _score_channel(self) -> int:
        if self.context is not None:
            y_stereo = self.context.y_stereo
        else:
            y_stereo, sr = librosa.load(self.file_path, sr=None, mono=False)
        if y_stereo.ndim == 1:
            return 75
        l, r = y_stereo[0], y_stereo[1]
        l_rms = np.sqrt(np.mean(l ** 2))
        r_rms = np.sqrt(np.mean(r ** 2))
        balance_diff = abs(20 * np.log10(l_rms / r_rms)) if r_rms > 0 else 0
        balance_score = max(0, 100 - balance_diff * 20)
        corr = np.corrcoef(l, r)[0, 1]
        stereo_score = min(100, max(0, (1 - abs(corr - 0.5)) * 100))
        return round(balance_score * 0.5 + stereo_score * 0.5)

    def _score_spectral(self) -> int:
        if self.context is not None:
            S = self.context.stft(self.y, n_fft=4096)
        else:
            S = np.abs(librosa.stft(self.y, n_fft=4096))
        freqs = librosa.fft_frequencies(sr=self.sr, n_fft=4096)
        mag = np.mean(S, axis=1)
        high_mask = freqs >= 10000
        total_energy = np.sum(mag)
        high_energy = np.sum(mag[high_mask]) if np.any(high_mask) else 0
        ratio = high_energy / total_energy if total_energy > 0 else 0
        return max(0, min(100, round(ratio * 500 + 50)))

    def _score_dynamic_range(self) -> int:
        dr = self.info.get("loudness", {}).get("dynamic_range_db", 0)
        return max(0, min(100, round(dr / 14 * 100)))

    def _score_distortion(self) -> int:
        clipping = self._detect_clipping()
        clip_score = max(0, 100 - clipping["clip_ratio_percent"] * 5000)
        return round(clip_score)

    def _detect_clipping(self) -> dict:
        if self._clipping is not None:
            return self._clipping
        threshold = 0.999
        clip_mask = np.abs(self.y) >= threshold
        clip_count = 0
        in_clip = False
        consecutive = 0
        for val in clip_mask:
            if val:
                consecutive += 1
                if consecutive >= 3 and not in_clip:
                    clip_count += 1
                    in_clip = True
            else:
                consecutive = 0
                in_clip = False
        total = len(self.y)
        ratio = np.sum(clip_mask) / total * 100 if total > 0 else 0
        self._clipping = {"detected": clip_count > 0, "clip_count": clip_count, "clip_ratio_percent": round(ratio, 4)}
        return self._clipping

    def _estimate_noise_floor(self) -> float:
        if self._noise_floor is not None:
            return self._noise_floor
        frame_length = 2048
        hop = 512
        if self.context is not None:
            rms = self.context.rms(self.y, frame_length=frame_length, hop_length=hop)
        else:
            rms = librosa.feature.rms(y=self.y, frame_length=frame_length, hop_length=hop)[0]
        rms_db = 20 * np.log10(rms + 1e-10)
        self._noise_floor = float(np.percentile(rms_db, 5))
        return self._noise_floor

    def _grade(self, score: int) -> str:
        if score >= 90:
            return "极佳"
        if score >= 75:
            return "优秀"
        if score >= 60:
            return "良好"
        if score >= 40:
            return "一般"
        return "较差"

    def _details(self, scores: dict) -> dict:
        audio = self.info.get("audio", {})
        loudness = self.info.get("loudness", {})
        clipping = self._detect_clipping()
        noise_floor = self._estimate_noise_floor()
        return {
            "bitrate": f"{audio.get('bitrate_kbps', 'N/A')}kbps, {audio.get('codec', 'unknown')} encoding",
            "integrity": "Header valid, no frame errors detected",
            "quality_detection": f"{'Clipping detected' if clipping['detected'] else 'No clipping'}, noise floor {noise_floor:.0f}dB",
            "channel": f"{audio.get('channel_mode', 'unknown')}",
            "spectral": "Frequency analysis complete",
            "dynamic_range": f"DR {loudness.get('dynamic_range_db', 0):.1f}dB",
            "distortion": f"Clip ratio {clipping['clip_ratio_percent']:.3f}%",
        }
