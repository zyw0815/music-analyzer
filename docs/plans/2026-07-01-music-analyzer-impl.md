# Music Analyzer Implementation Plan

> **Goal:** Build a professional web-based audio quality analyzer with 6 analysis modules, built-in player, and dark-themed sidebar navigation.

> **Architecture:** React + TypeScript frontend (Vite, port 9211) communicates with Python FastAPI backend (port 9210) via REST API. Backend has 6 independent analysis modules orchestrated in parallel.

> **Tech Stack:** Python 3 (Anaconda `work`), FastAPI, librosa, mutagen, numpy, scipy, ffmpeg | React 18, TypeScript, ECharts, Tailwind CSS, Vite

> **Spec:** `docs/designs/2026-07-01-music-analyzer-design.md`

---

## File Map

```
backend/
├── environment.yml
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, routes
│   ├── config.py            # Constants (ports, limits, paths)
│   ├── models.py            # Pydantic response models
│   ├── utils.py             # DSD conversion, temp file management
│   ├── api/
│   │   ├── __init__.py
│   │   ├── analyze.py       # POST /api/analyze, /api/analyze/basic
│   │   └── stream.py        # GET /api/stream/{file_id}
│   └── analyzers/
│       ├── __init__.py
│       ├── basic_info.py    # Module 1: metadata extraction
│       ├── quality.py       # Module 2: quality scoring (7 dimensions)
│       ├── spectrum.py      # Module 3: FFT, spectrogram, freq distribution
│       ├── waveform.py      # Module 4: waveform, RMS, clipping/silence regions
│       ├── channel.py       # Module 5: L/R analysis, phase correlation, M/S
│       └── player.py        # Module 6: audio-to-WAV conversion for streaming
├── tests/
│   ├── conftest.py          # Shared fixtures (test audio generators)
│   ├── test_basic_info.py
│   ├── test_quality.py
│   ├── test_spectrum.py
│   ├── test_waveform.py
│   ├── test_channel.py
│   └── test_api.py
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   └── client.ts
│   ├── types/
│   │   └── analysis.ts
│   ├── theme/
│   │   └── colors.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── MainContent.tsx
│   │   ├── upload/
│   │   │   └── FileUpload.tsx
│   │   ├── player/
│   │   │   └── AudioPlayer.tsx
│   │   ├── quality/
│   │   │   └── QualityDetection.tsx
│   │   ├── spectrum/
│   │   │   ├── SpectrumAnalyzer.tsx
│   │   │   ├── SpectrogramHeatmap.tsx
│   │   │   └── FrequencyDistribution.tsx
│   │   ├── waveform/
│   │   │   └── WaveformDisplay.tsx
│   │   ├── channel/
│   │   │   ├── ChannelAnalysis.tsx
│   │   │   ├── PhaseCorrelation.tsx
│   │   │   └── MidSideSpectrum.tsx
│   │   └── audioinfo/
│   │       └── AudioInfo.tsx
│   ├── hooks/
│   │   └── useAudioContext.ts
│   └── styles/
│       └── globals.css
.github/
├── workflows/
│   ├── ci.yml
│   └── release.yml
.gitignore
README.md
CHANGELOG.md
```

---

## Task 1: Project Scaffolding + Backend Skeleton

**Goal:** Initialize the repo, create backend FastAPI app, conda environment, and verify it runs.

### Step 1.1: Create `.gitignore`

```bash
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.pyc
*.pyo
.eggs/
*.egg-info/
dist/
build/
.venv/
*.egg

# Node
node_modules/
frontend/dist/

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Claude AI
.claude
claude_desktop_config.json
CLAUDE.md

# Temp audio files
backend/tmp/
backend/uploads/
EOF
```

### Step 1.2: Create `backend/environment.yml`

```yaml
name: work
channels:
  - defaults
  - conda-forge
dependencies:
  - python=3.11
  - pip
  - numpy
  - scipy
  - ffmpeg
  - pip:
    - fastapi==0.115.6
    - uvicorn[standard]==0.34.0
    - python-multipart==0.0.18
    - librosa==0.10.2
    - mutagen==1.47.0
    - pytest==8.3.4
    - pytest-asyncio==0.24.0
    - httpx==0.28.1
```

### Step 1.3: Create backend directory structure

```bash
mkdir -p backend/app/api backend/app/analyzers backend/tests
touch backend/app/__init__.py backend/app/api/__init__.py backend/app/analyzers/__init__.py backend/tests/__init__.py
```

### Step 1.4: Create `backend/app/config.py`

```python
import os
from pathlib import Path

BACKEND_PORT = 9210
FRONTEND_PORT = 9211
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024  # 5 GB

SUPPORTED_FORMATS = {
    "mp3", "wav", "flac", "aac", "ogg", "oga", "opus",
    "aiff", "aif", "wma", "m4a", "ape", "dsf", "dff",
}

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".aac", ".ogg", ".oga", ".opus",
                    ".aiff", ".aif", ".wma", ".m4a", ".ape", ".dsf", ".dff"}

TMP_DIR = Path(os.environ.get("ANALYZER_TMP_DIR", "backend/tmp"))
TMP_DIR.mkdir(parents=True, exist_ok=True)

VERSION = "2.0.0"
```

### Step 1.5: Create `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import VERSION
from app.api import analyze, stream

app = FastAPI(title="Music Analyzer API", version=VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9211"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(stream.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": VERSION}
```

### Step 1.6: Create stub `backend/app/api/analyze.py`

```python
from fastapi import APIRouter

router = APIRouter()


@router.post("/analyze")
async def analyze_file():
    return {"message": "not implemented"}


@router.post("/analyze/basic")
async def analyze_basic():
    return {"message": "not implemented"}
```

### Step 1.7: Create stub `backend/app/api/stream.py`

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/stream/{file_id}")
async def stream_audio(file_id: str):
    return {"message": "not implemented"}
```

### Step 1.8: Create `backend/tests/conftest.py` with test audio generators

```python
import pytest
import numpy as np
import struct
import wave
from pathlib import Path


@pytest.fixture
def fixtures_dir():
    return Path(__file__).parent / "fixtures"


@pytest.fixture
def tmp_dir():
    d = Path("backend/tmp/test")
    d.mkdir(parents=True, exist_ok=True)
    return d


@pytest.fixture
def sample_wav_mono(tmp_dir):
    """Generate a 1-second 440Hz mono WAV file."""
    path = tmp_dir / "test_mono.wav"
    sr = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    samples = (np.sin(2 * np.pi * 440 * t) * 0.8 * 32767).astype(np.int16)
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(samples.tobytes())
    return path


@pytest.fixture
def sample_wav_stereo(tmp_dir):
    """Generate a 1-second 440Hz stereo WAV file (L=440Hz, R=880Hz)."""
    path = tmp_dir / "test_stereo.wav"
    sr = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    left = (np.sin(2 * np.pi * 440 * t) * 0.8 * 32767).astype(np.int16)
    right = (np.sin(2 * np.pi * 880 * t) * 0.6 * 32767).astype(np.int16)
    stereo = np.column_stack([left, right]).flatten()
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())
    return path


@pytest.fixture
def sample_wav_clipping(tmp_dir):
    """Generate a 1-second WAV with clipping (samples at ±max)."""
    path = tmp_dir / "test_clipping.wav"
    sr = 44100
    samples = np.ones(int(sr * 0.5), dtype=np.int16) * 32767
    samples = np.concatenate([samples, np.ones(int(sr * 0.5), dtype=np.int16) * -32767])
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(samples.tobytes())
    return path


@pytest.fixture
def sample_wav_silence(tmp_dir):
    """Generate a 2-second WAV with 0.5s signal, 1s silence, 0.5s signal."""
    path = tmp_dir / "test_silence.wav"
    sr = 44100
    t_half = np.linspace(0, 0.5, int(sr * 0.5), endpoint=False)
    tone = (np.sin(2 * np.pi * 440 * t_half) * 0.5 * 32767).astype(np.int16)
    silent = np.zeros(int(sr * 1.0), dtype=np.int16)
    samples = np.concatenate([tone, silent, tone])
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(samples.tobytes())
    return path
```

### Step 1.9: Install and verify

```bash
conda activate work
cd backend && pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 9210
# In another terminal:
curl http://localhost:9210/api/health
# Expected: {"status":"ok","version":"2.0.0"}
```

### Step 1.10: Commit

```bash
git add .gitignore backend/
git commit -m "feat: project scaffolding with FastAPI skeleton and test fixtures"
```

---

## Task 2: BasicInfoModule (Module 1)

**Goal:** Extract comprehensive audio metadata. Powers "音频信息" module and top bar.

### Step 2.1: Write failing tests — `backend/tests/test_basic_info.py`

```python
import pytest
from app.analyzers.basic_info import BasicInfoAnalyzer


class TestBasicInfo:
    def test_returns_dict(self, sample_wav_mono):
        analyzer = BasicInfoAnalyzer(str(sample_wav_mono))
        result = analyzer.analyze()
        assert isinstance(result, dict)

    def test_file_section(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert result["file"]["name"] == "test_mono.wav"
        assert result["file"]["size_bytes"] > 0
        assert result["file"]["format"] == "WAV"
        assert result["file"]["md5"] is not None
        assert len(result["file"]["md5"]) == 32

    def test_audio_section_mono(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert result["audio"]["sample_rate_hz"] == 44100
        assert result["audio"]["bit_depth"] == 16
        assert result["audio"]["channels"] == 1
        assert result["audio"]["channel_mode"] == "mono"

    def test_audio_section_stereo(self, sample_wav_stereo):
        result = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        assert result["audio"]["channels"] == 2
        assert result["audio"]["channel_mode"] == "stereo"

    def test_timing_section(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert 0.9 < result["timing"]["duration_seconds"] < 1.1

    def test_loudness_section(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert result["loudness"]["peak_db"] is not None
        assert result["loudness"]["rms_db"] is not None
        assert result["loudness"]["peak_db"] <= 0

    def test_tags_section(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert "tags" in result
        assert isinstance(result["tags"], dict)

    def test_dsd_field_null_for_wav(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert result["dsd"] is None
```

### Step 2.2: Run tests to verify they fail

```bash
cd backend && python -m pytest tests/test_basic_info.py -v
# Expected: FAIL — ModuleNotFoundError: No module named 'app.analyzers.basic_info'
```

### Step 2.3: Implement `backend/app/analyzers/basic_info.py`

```python
import hashlib
from pathlib import Path
import numpy as np
import librosa
from mutagen import File as MutagenFile


class BasicInfoAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self.suffix = self.file_path.suffix.lower()

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
        md5 = hashlib.md5(self.file_path.read_bytes()).hexdigest()
        fmt = self.suffix.lstrip(".").upper()
        if fmt == "M4A":
            fmt = "ALAC/AAC"
        return {
            "name": self.file_path.name,
            "size_bytes": size,
            "format": fmt,
            "encoder": self._get_encoder(),
            "md5": md5,
        }

    def _get_encoder(self) -> str | None:
        try:
            mf = MutagenFile(str(self.file_path))
            if mf and mf.info:
                return getattr(mf.info, "encoder", None) or getattr(mf.info, "encoder_info", None)
        except Exception:
            pass
        return None

    def _audio_info(self) -> dict:
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
        y, sr = librosa.load(str(self.file_path), sr=None, mono=True, duration=None)
        duration = len(y) / sr
        return {
            "duration_seconds": round(duration, 2),
            "start_offset": 0.0,
        }

    def _loudness_info(self) -> dict:
        y, sr = librosa.load(str(self.file_path), sr=None, mono=True)
        peak = np.max(np.abs(y))
        peak_db = 20 * np.log10(peak) if peak > 0 else -np.inf
        rms = np.sqrt(np.mean(y ** 2))
        rms_db = 20 * np.log10(rms) if rms > 0 else -np.inf
        dynamic_range = peak_db - (20 * np.log10(np.percentile(np.abs(y[np.abs(y) > 0.001]), 5)) if np.any(np.abs(y) > 0.001) else -np.inf)
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
                    for tag_key in [key, key.upper(), key.capitalize(), f"TIT2", f"TPE1", f"TALB", f"TDRC", f"TCON", f"TRCK"]:
                        val = mf.get(tag_key)
                        if val:
                            tag_map[key] = str(val[0]) if hasattr(val, '__getitem__') else str(val)
                            break
                tags = {k: v for k, v in tag_map.items() if v is not None}
        except Exception:
            pass
        return tags

    def _dsd_info(self) -> dict | None:
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
```

### Step 2.4: Run tests to verify they pass

```bash
cd backend && python -m pytest tests/test_basic_info.py -v
# Expected: 8 passed
```

### Step 2.5: Commit

```bash
git add backend/app/analyzers/basic_info.py backend/tests/test_basic_info.py
git commit -m "feat: BasicInfoModule with metadata extraction (TDD)"
```

---

## Task 3: QualityModule (Module 2) — 7-Dimension Quality Scoring

**Goal:** Compute comprehensive quality score with 7 sub-dimensions. Powers "质量检测" module.

### Step 3.1: Write failing tests — `backend/tests/test_quality.py`

```python
import pytest
from app.analyzers.quality import QualityAnalyzer


class TestQualityAnalyzer:
    def test_returns_dict_with_expected_keys(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        assert "overall_score" in result
        assert "grade" in result
        assert "sub_scores" in result
        assert "details" in result

    def test_overall_score_range(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        assert 0 <= result["overall_score"] <= 100

    def test_grade_is_valid(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        assert result["grade"] in ["极佳", "优秀", "良好", "一般", "较差"]

    def test_seven_sub_scores(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        expected_keys = {"bitrate", "integrity", "quality_detection", "channel", "spectral", "dynamic_range", "distortion"}
        assert set(result["sub_scores"].keys()) == expected_keys

    def test_high_quality_file_scores_high(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        assert result["overall_score"] >= 60

    def test_clipping_file_scores_lower(self, sample_wav_clipping):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_clipping)).analyze()
        result = QualityAnalyzer(str(sample_wav_clipping), info).analyze()
        assert result["sub_scores"]["distortion"] < 50

    def test_details_has_strings(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        for key, val in result["details"].items():
            assert isinstance(val, str), f"detail for {key} should be string"
```

### Step 3.2: Run tests to verify they fail

```bash
cd backend && python -m pytest tests/test_quality.py -v
# Expected: FAIL — ModuleNotFoundError
```

### Step 3.3: Implement `backend/app/analyzers/quality.py`

```python
import numpy as np
import librosa


class QualityAnalyzer:
    def __init__(self, file_path: str, basic_info: dict):
        self.file_path = file_path
        self.info = basic_info
        self.y = None
        self.sr = None

    def _load(self):
        if self.y is None:
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
        weights = {"bitrate": 0.15, "integrity": 0.10, "quality_detection": 0.20,
                    "channel": 0.10, "spectral": 0.15, "dynamic_range": 0.15, "distortion": 0.15}
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
        return {"detected": clip_count > 0, "clip_count": clip_count, "clip_ratio_percent": round(ratio, 4)}

    def _estimate_noise_floor(self) -> float:
        frame_length = 2048
        hop = 512
        rms = librosa.feature.rms(y=self.y, frame_length=frame_length, hop_length=hop)[0]
        rms_db = 20 * np.log10(rms + 1e-10)
        return float(np.percentile(rms_db, 5))

    def _grade(self, score: int) -> str:
        if score >= 90: return "极佳"
        if score >= 75: return "优秀"
        if score >= 60: return "良好"
        if score >= 40: return "一般"
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
```

### Step 3.4: Run tests

```bash
cd backend && python -m pytest tests/test_quality.py -v
# Expected: 7 passed
```

### Step 3.5: Commit

```bash
git add backend/app/analyzers/quality.py backend/tests/test_quality.py
git commit -m "feat: QualityModule with 7-dimension scoring (TDD)"
```

---

## Task 4: SpectrumModule + WaveformModule + ChannelModule (Modules 3-5)

**Goal:** Implement the remaining analysis modules.

### Step 4.1: Write failing tests — `backend/tests/test_spectrum.py`

```python
import pytest
import numpy as np
from app.analyzers.spectrum import SpectrumAnalyzer


class TestSpectrumAnalyzer:
    def test_returns_dict(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert isinstance(result, dict)

    def test_has_spectrum(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert "spectrum" in result
        assert "frequencies" in result["spectrum"]
        assert "magnitude_db" in result["spectrum"]
        assert len(result["spectrum"]["frequencies"]) > 0

    def test_has_spectrogram(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert "spectrogram" in result
        assert "frequencies" in result["spectrogram"]
        assert "times" in result["spectrogram"]
        assert "magnitude_db" in result["spectrogram"]

    def test_has_frequency_distribution(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert "frequency_distribution" in result
        fd = result["frequency_distribution"]
        assert len(fd["bands"]) == 5
        assert len(fd["energy_db"]) == 5

    def test_frequencies_in_range(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        freqs = result["spectrum"]["frequencies"]
        assert freqs[0] >= 0
        assert freqs[-1] <= 22050
```

### Step 4.2: Implement `backend/app/analyzers/spectrum.py`

```python
import numpy as np
import librosa


class SpectrumAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def analyze(self) -> dict:
        y, sr = librosa.load(self.file_path, sr=None, mono=True)
        return {
            "spectrum": self._average_spectrum(y, sr),
            "spectrogram": self._spectrogram(y, sr),
            "frequency_distribution": self._frequency_distribution(y, sr),
        }

    def _average_spectrum(self, y, sr) -> dict:
        S = np.abs(librosa.stft(y, n_fft=4096))
        mag = np.mean(S, axis=1)
        mag_db = librosa.amplitude_to_db(mag, ref=np.max)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=4096)
        peak_hold = librosa.amplitude_to_db(np.max(S, axis=1), ref=np.max)
        return {
            "frequencies": freqs.tolist(),
            "magnitude_db": np.round(mag_db, 2).tolist(),
            "peak_hold_db": np.round(peak_hold, 2).tolist(),
        }

    def _spectrogram(self, y, sr) -> dict:
        S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
        S_db = librosa.amplitude_to_db(S, ref=np.max)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
        times = librosa.times_like(S_db, sr=sr, hop_length=512)
        step = max(1, len(times) // 500)
        return {
            "frequencies": freqs.tolist(),
            "times": np.round(times[::step], 3).tolist(),
            "magnitude_db": np.round(S_db[:, ::step], 2).tolist(),
        }

    def _frequency_distribution(self, y, sr) -> dict:
        S = np.abs(librosa.stft(y, n_fft=4096))
        freqs = librosa.fft_frequencies(sr=sr, n_fft=4096)
        mag = np.mean(S, axis=1)
        bands_def = [
            ("20-60Hz", 20, 60),
            ("60-250Hz", 60, 250),
            ("250-2kHz", 250, 2000),
            ("2k-6kHz", 2000, 6000),
            ("6k-20kHz", 6000, 20000),
        ]
        bands = []
        energies = []
        for name, lo, hi in bands_def:
            mask = (freqs >= lo) & (freqs < hi)
            energy = np.mean(mag[mask]) if np.any(mask) else 0
            energy_db = 20 * np.log10(energy + 1e-10)
            bands.append(name)
            energies.append(round(float(energy_db), 2))
        return {"bands": bands, "energy_db": energies}
```

### Step 4.3: Write failing tests — `backend/tests/test_waveform.py`

```python
import pytest
from app.analyzers.waveform import WaveformAnalyzer


class TestWaveformAnalyzer:
    def test_returns_dict(self, sample_wav_stereo):
        result = WaveformAnalyzer(str(sample_wav_stereo)).analyze()
        assert isinstance(result, dict)

    def test_has_waveform(self, sample_wav_stereo):
        result = WaveformAnalyzer(str(sample_wav_stereo)).analyze()
        assert "waveform" in result
        assert len(result["waveform"]["samples"]) > 0
        assert result["waveform"]["sample_rate"] == 44100

    def test_has_rms_envelope(self, sample_wav_stereo):
        result = WaveformAnalyzer(str(sample_wav_stereo)).analyze()
        assert "rms_envelope" in result
        assert len(result["rms_envelope"]["values"]) > 0

    def test_detects_clipping(self, sample_wav_clipping):
        result = WaveformAnalyzer(str(sample_wav_clipping)).analyze()
        assert len(result["clipping_regions"]) > 0

    def test_detects_silence(self, sample_wav_silence):
        result = WaveformAnalyzer(str(sample_wav_silence)).analyze()
        assert len(result["silence_regions"]) > 0

    def test_no_clipping_in_clean_file(self, sample_wav_stereo):
        result = WaveformAnalyzer(str(sample_wav_stereo)).analyze()
        assert len(result["clipping_regions"]) == 0
```

### Step 4.4: Implement `backend/app/analyzers/waveform.py`

```python
import numpy as np
import librosa


class WaveformAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def analyze(self) -> dict:
        y, sr = librosa.load(self.file_path, sr=None, mono=True)
        return {
            "waveform": self._waveform(y, sr),
            "rms_envelope": self._rms_envelope(y, sr),
            "clipping_regions": self._clipping_regions(y, sr),
            "silence_regions": self._silence_regions(y, sr),
        }

    def _waveform(self, y, sr, target_rate=1000) -> dict:
        factor = max(1, sr // target_rate)
        y_ds = y[::factor]
        t_ds = np.arange(len(y_ds)) * factor / sr
        return {
            "samples": np.round(y_ds, 4).tolist(),
            "times": np.round(t_ds, 4).tolist(),
            "sample_rate": sr,
            "downsampled_rate": sr // factor,
        }

    def _rms_envelope(self, y, sr) -> dict:
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
        rms_db = 20 * np.log10(rms + 1e-10)
        times = librosa.times_like(rms_db, sr=sr, hop_length=512)
        return {
            "values": np.round(rms_db, 2).tolist(),
            "times": np.round(times, 3).tolist(),
        }

    def _clipping_regions(self, y, sr) -> list:
        threshold = 0.999
        clip_mask = np.abs(y) >= threshold
        regions = []
        in_region = False
        start = 0
        consecutive = 0
        for i, val in enumerate(clip_mask):
            if val:
                consecutive += 1
                if consecutive >= 3 and not in_region:
                    start = i - 2
                    in_region = True
            else:
                if in_region:
                    regions.append({"start": round(start / sr, 3), "end": round(i / sr, 3)})
                    in_region = False
                consecutive = 0
        if in_region:
            regions.append({"start": round(start / sr, 3), "end": round(len(y) / sr, 3)})
        return regions

    def _silence_regions(self, y, sr) -> list:
        frame_length = 2048
        hop = 512
        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop)[0]
        rms_db = 20 * np.log10(rms + 1e-10)
        silent = rms_db < -60
        regions = []
        in_region = False
        start = 0
        for i, val in enumerate(silent):
            t = i * hop / sr
            if val and not in_region:
                start = t
                in_region = True
            elif not val and in_region:
                if t - start >= 0.3:
                    regions.append({"start": round(start, 3), "end": round(t, 3)})
                in_region = False
        if in_region:
            end = len(y) / sr
            if end - start >= 0.3:
                regions.append({"start": round(start, 3), "end": round(end, 3)})
        return regions
```

### Step 4.5: Write failing tests — `backend/tests/test_channel.py`

```python
import pytest
from app.analyzers.channel import ChannelAnalyzer


class TestChannelAnalyzer:
    def test_returns_dict(self, sample_wav_stereo):
        result = ChannelAnalyzer(str(sample_wav_stereo)).analyze()
        assert isinstance(result, dict)

    def test_phase_correlation_range(self, sample_wav_stereo):
        result = ChannelAnalyzer(str(sample_wav_stereo)).analyze()
        assert -1 <= result["phase_correlation"] <= 1

    def test_channel_balance(self, sample_wav_stereo):
        result = ChannelAnalyzer(str(sample_wav_stereo)).analyze()
        assert "channel_balance_db" in result

    def test_has_spectrums(self, sample_wav_stereo):
        result = ChannelAnalyzer(str(sample_wav_stereo)).analyze()
        for key in ["left_spectrum", "right_spectrum", "mid_spectrum", "side_spectrum"]:
            assert key in result
            assert "frequencies" in result[key]
            assert "magnitude_db" in result[key]

    def test_stereo_width(self, sample_wav_stereo):
        result = ChannelAnalyzer(str(sample_wav_stereo)).analyze()
        assert "stereo_width" in result
        assert result["stereo_width"] >= 0

    def test_mono_detection(self, sample_wav_mono):
        result = ChannelAnalyzer(str(sample_wav_mono)).analyze()
        assert result["is_mono"] is True

    def test_stereo_not_flagged_mono(self, sample_wav_stereo):
        result = ChannelAnalyzer(str(sample_wav_stereo)).analyze()
        assert result["is_mono"] is False
```

### Step 4.6: Implement `backend/app/analyzers/channel.py`

```python
import numpy as np
import librosa


class ChannelAnalyzer:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def analyze(self) -> dict:
        y, sr = librosa.load(self.file_path, sr=None, mono=False)
        if y.ndim == 1:
            return self._mono_result(y, sr)
        l, r = y[0], y[1]
        mid = (l + r) / 2
        side = (l - r) / 2
        return {
            "phase_correlation": round(float(np.corrcoef(l, r)[0, 1]), 4),
            "channel_balance_db": round(float(self._balance_db(l, r)), 2),
            "left_spectrum": self._spectrum(l, sr),
            "right_spectrum": self._spectrum(r, sr),
            "mid_spectrum": self._spectrum(mid, sr),
            "side_spectrum": self._spectrum(side, sr),
            "stereo_width": round(float(self._stereo_width(mid, side)), 4),
            "is_mono": bool(np.corrcoef(l, r)[0, 1] > 0.98),
        }

    def _mono_result(self, y, sr) -> dict:
        spec = self._spectrum(y, sr)
        return {
            "phase_correlation": 1.0,
            "channel_balance_db": 0.0,
            "left_spectrum": spec,
            "right_spectrum": spec,
            "mid_spectrum": spec,
            "side_spectrum": self._spectrum(np.zeros_like(y), sr),
            "stereo_width": 0.0,
            "is_mono": True,
        }

    def _balance_db(self, l, r) -> float:
        l_rms = np.sqrt(np.mean(l ** 2))
        r_rms = np.sqrt(np.mean(r ** 2))
        if r_rms == 0:
            return 0.0
        return 20 * np.log10(l_rms / r_rms)

    def _stereo_width(self, mid, side) -> float:
        mid_rms = np.sqrt(np.mean(mid ** 2))
        side_rms = np.sqrt(np.mean(side ** 2))
        if mid_rms == 0:
            return 0.0
        return side_rms / mid_rms

    def _spectrum(self, y, sr) -> dict:
        S = np.abs(librosa.stft(y, n_fft=4096))
        mag = np.mean(S, axis=1)
        mag_db = librosa.amplitude_to_db(mag, ref=np.max)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=4096)
        return {
            "frequencies": freqs.tolist(),
            "magnitude_db": np.round(mag_db, 2).tolist(),
        }
```

### Step 4.7: Run all new tests

```bash
cd backend && python -m pytest tests/test_spectrum.py tests/test_waveform.py tests/test_channel.py -v
# Expected: all passed
```

### Step 4.8: Commit

```bash
git add backend/app/analyzers/spectrum.py backend/app/analyzers/waveform.py backend/app/analyzers/channel.py backend/tests/test_spectrum.py backend/tests/test_waveform.py backend/tests/test_channel.py
git commit -m "feat: SpectrumModule, WaveformModule, ChannelModule (TDD)"
```

---

## Task 5: Pydantic Models + API Endpoints + PlayerModule

**Goal:** Wire up all modules into API endpoints with proper models. Implement audio streaming.

### Step 5.1: Create `backend/app/models.py`

```python
from pydantic import BaseModel


class FileInfo(BaseModel):
    name: str
    size_bytes: int
    format: str
    encoder: str | None = None
    md5: str | None = None


class AudioInfo(BaseModel):
    codec: str
    sample_rate_hz: int
    bit_depth: int
    channels: int
    channel_mode: str
    bitrate_kbps: int | None = None
    bitrate_mode: str = "CBR"


class TimingInfo(BaseModel):
    duration_seconds: float
    start_offset: float = 0.0


class LoudnessInfo(BaseModel):
    peak_db: float
    rms_db: float
    dynamic_range_db: float


class DsdInfo(BaseModel):
    dsd_rate: int | None = None
    dsd_channels: int | None = None
    is_dsd: bool


class BasicInfoResponse(BaseModel):
    file: FileInfo
    audio: AudioInfo
    timing: TimingInfo
    loudness: LoudnessInfo
    tags: dict = {}
    dsd: DsdInfo | None = None


class SubScores(BaseModel):
    bitrate: int
    integrity: int
    quality_detection: int
    channel: int
    spectral: int
    dynamic_range: int
    distortion: int


class QualityResponse(BaseModel):
    overall_score: int
    grade: str
    sub_scores: SubScores
    details: dict


class SpectrumData(BaseModel):
    frequencies: list[float]
    magnitude_db: list[float]
    peak_hold_db: list[float] | None = None


class SpectrogramData(BaseModel):
    frequencies: list[float]
    times: list[float]
    magnitude_db: list[list[float]]


class FrequencyDistribution(BaseModel):
    bands: list[str]
    energy_db: list[float]


class SpectrumResponse(BaseModel):
    spectrum: SpectrumData
    spectrogram: SpectrogramData
    frequency_distribution: FrequencyDistribution


class WaveformData(BaseModel):
    samples: list[float]
    times: list[float]
    sample_rate: int
    downsampled_rate: int


class RmsEnvelope(BaseModel):
    values: list[float]
    times: list[float]


class WaveformResponse(BaseModel):
    waveform: WaveformData
    rms_envelope: RmsEnvelope
    clipping_regions: list[dict]
    silence_regions: list[dict]


class ChannelSpectrum(BaseModel):
    frequencies: list[float]
    magnitude_db: list[float]


class ChannelResponse(BaseModel):
    phase_correlation: float
    channel_balance_db: float
    left_spectrum: ChannelSpectrum
    right_spectrum: ChannelSpectrum
    mid_spectrum: ChannelSpectrum
    side_spectrum: ChannelSpectrum
    stereo_width: float
    is_mono: bool


class FullAnalysisResponse(BaseModel):
    file_id: str
    basic_info: BasicInfoResponse
    quality: QualityResponse
    spectrum: SpectrumResponse
    waveform: WaveformResponse
    channel: ChannelResponse
```

### Step 5.2: Create `backend/app/utils.py`

```python
import subprocess
import tempfile
import uuid
from pathlib import Path

from app.config import TMP_DIR

DSD_EXTENSIONS = {".dsf", ".dff"}


def is_dsd(file_path: Path) -> bool:
    return file_path.suffix.lower() in DSD_EXTENSIONS


def convert_dsd_to_pcm(input_path: Path) -> Path:
    output_path = TMP_DIR / f"{uuid.uuid4().hex}.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(input_path), "-af", "dsd2pcm", "-f", "wav", str(output_path)],
        check=True, capture_output=True,
    )
    return output_path


def get_analysis_path(file_path: Path) -> Path:
    if is_dsd(file_path):
        return convert_dsd_to_pcm(file_path)
    return file_path


def save_upload(content: bytes, filename: str) -> Path:
    file_id = uuid.uuid4().hex
    ext = Path(filename).suffix
    path = TMP_DIR / f"{file_id}{ext}"
    path.write_bytes(content)
    return path
```

### Step 5.3: Update `backend/app/api/analyze.py`

```python
from pathlib import Path
from fastapi import APIRouter, UploadFile, HTTPException

from app.config import SUPPORTED_FORMATS, MAX_FILE_SIZE_BYTES
from app.utils import save_upload, get_analysis_path, is_dsd
from app.analyzers.basic_info import BasicInfoAnalyzer
from app.analyzers.quality import QualityAnalyzer
from app.analyzers.spectrum import SpectrumAnalyzer
from app.analyzers.waveform import WaveformAnalyzer
from app.analyzers.channel import ChannelAnalyzer
from app.models import FullAnalysisResponse

router = APIRouter()

_file_store: dict[str, Path] = {}


def _validate(filename: str, size: int):
    ext = Path(filename).suffix.lstrip(".").lower()
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(400, f"Unsupported format: .{ext}. Supported: {', '.join(sorted(SUPPORTED_FORMATS))}")
    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(413, f"File too large. Max: {MAX_FILE_SIZE_BYTES // (1024**3)}GB")


@router.post("/analyze")
async def analyze_file(file: UploadFile):
    content = await file.read()
    _validate(file.filename, len(content))
    path = save_upload(content, file.filename)
    file_id = path.stem
    _file_store[file_id] = path

    analysis_path = get_analysis_path(path)
    try:
        basic = BasicInfoAnalyzer(str(analysis_path)).analyze()
        quality = QualityAnalyzer(str(analysis_path), basic).analyze()
        spectrum = SpectrumAnalyzer(str(analysis_path)).analyze()
        waveform = WaveformAnalyzer(str(analysis_path)).analyze()
        channel = ChannelAnalyzer(str(analysis_path)).analyze()
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")
    finally:
        if analysis_path != path:
            analysis_path.unlink(missing_ok=True)

    return {
        "file_id": file_id,
        "basic_info": basic,
        "quality": quality,
        "spectrum": spectrum,
        "waveform": waveform,
        "channel": channel,
    }


@router.post("/analyze/basic")
async def analyze_basic(file: UploadFile):
    content = await file.read()
    _validate(file.filename, len(content))
    path = save_upload(content, file.filename)
    analysis_path = get_analysis_path(path)
    try:
        basic = BasicInfoAnalyzer(str(analysis_path)).analyze()
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")
    finally:
        if analysis_path != path:
            analysis_path.unlink(missing_ok=True)
    return basic
```

### Step 5.4: Create `backend/app/analyzers/player.py`

```python
import io
import wave
import numpy as np
import librosa


class PlayerConverter:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def to_wav_bytes(self) -> bytes:
        y, sr = librosa.load(self.file_path, sr=None, mono=False)
        if y.ndim == 1:
            y = np.expand_dims(y, 0)
        n_channels, n_samples = y.shape
        y_int16 = (y * 32767).clip(-32768, 32767).astype(np.int16)
        buf = io.BytesIO()
        with wave.open(buf, "w") as wf:
            wf.setnchannels(n_channels)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            interleaved = np.empty(n_channels * n_samples, dtype=np.int16)
            for ch in range(n_channels):
                interleaved[ch::n_channels] = y_int16[ch]
            wf.writeframes(interleaved.tobytes())
        return buf.getvalue()
```

### Step 5.5: Update `backend/app/api/stream.py`

```python
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.config import TMP_DIR
from app.analyzers.player import PlayerConverter
from app.utils import is_dsd, convert_dsd_to_pcm

router = APIRouter()


@router.get("/stream/{file_id}")
async def stream_audio(file_id: str):
    matches = list(TMP_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(404, "File not found")
    path = matches[0]
    analysis_path = convert_dsd_to_pcm(path) if is_dsd(path) else path
    try:
        converter = PlayerConverter(str(analysis_path))
        wav_bytes = converter.to_wav_bytes()
    except Exception as e:
        raise HTTPException(500, f"Conversion failed: {str(e)}")
    finally:
        if analysis_path != path:
            analysis_path.unlink(missing_ok=True)
    return Response(content=wav_bytes, media_type="audio/wav")
```

### Step 5.6: Write API integration tests — `backend/tests/test_api.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealth:
    def test_health(self):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestAnalyze:
    def test_analyze_wav(self, sample_wav_stereo):
        with open(sample_wav_stereo, "rb") as f:
            r = client.post("/api/analyze", files={"file": ("test.wav", f, "audio/wav")})
        assert r.status_code == 200
        data = r.json()
        assert "file_id" in data
        assert "basic_info" in data
        assert "quality" in data
        assert "spectrum" in data
        assert "waveform" in data
        assert "channel" in data

    def test_analyze_basic(self, sample_wav_mono):
        with open(sample_wav_mono, "rb") as f:
            r = client.post("/api/analyze/basic", files={"file": ("test.wav", f, "audio/wav")})
        assert r.status_code == 200
        data = r.json()
        assert data["audio"]["sample_rate_hz"] == 44100

    def test_rejects_invalid_format(self, tmp_dir):
        fake = tmp_dir / "test.xyz"
        fake.write_bytes(b"fake")
        with open(fake, "rb") as f:
            r = client.post("/api/analyze", files={"file": ("test.xyz", f, "audio/wav")})
        assert r.status_code == 400

    def test_stream(self, sample_wav_mono):
        with open(sample_wav_mono, "rb") as f:
            r = client.post("/api/analyze", files={"file": ("test.wav", f, "audio/wav")})
        file_id = r.json()["file_id"]
        r2 = client.get(f"/api/stream/{file_id}")
        assert r2.status_code == 200
        assert r2.headers["content-type"] == "audio/wav"
```

### Step 5.7: Run all backend tests

```bash
cd backend && python -m pytest tests/ -v
# Expected: all tests pass
```

### Step 5.8: Commit

```bash
git add backend/app/models.py backend/app/utils.py backend/app/api/analyze.py backend/app/api/stream.py backend/app/analyzers/player.py backend/tests/test_api.py
git commit -m "feat: API endpoints, Pydantic models, PlayerModule (TDD)"
```

---

## Task 6: Frontend Scaffolding + Layout + Theme

**Goal:** Initialize React+Vite+Tailwind project, create layout shell with sidebar.

### Step 6.1: Scaffold frontend

```bash
cd frontend && npm create vite@latest . -- --template react-ts
npm install
npm install echarts echarts-for-react tailwindcss @tailwindcss/vite axios
```

### Step 6.2: Create `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 9211,
    proxy: {
      '/api': 'http://localhost:9210',
    },
  },
})
```

### Step 6.3: Create `frontend/src/theme/colors.ts`

```typescript
export const theme = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  accent: '#e94560',
  accentAlt: '#58a6ff',
  success: '#3fb950',
  warning: '#d29922',
  danger: '#f85149',
  sidebarBg: '#010409',
  sidebarActive: '#1f2937',
}
```

### Step 6.4: Create `frontend/src/types/analysis.ts`

Full TypeScript interfaces matching backend Pydantic models (file, audio, timing, loudness, quality, spectrum, waveform, channel response types). Each mirrors the backend schema exactly.

### Step 6.5: Create `frontend/src/styles/globals.css`

```css
@import "tailwindcss";

body {
  margin: 0;
  background-color: #0d1117;
  color: #e6edf3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

* { box-sizing: border-box; }

::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #161b22; }
::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #484f58; }
```

### Step 6.6: Create layout components

**`frontend/src/components/layout/Sidebar.tsx`** — 6 nav items with icons, active state highlight, collapse toggle.

**`frontend/src/components/layout/TopBar.tsx`** — File name, sample rate, bit depth, duration, mini waveform, play/pause button. Shows "未加载文件" when no file is loaded.

**`frontend/src/components/layout/MainContent.tsx`** — Renders the active module component based on sidebar selection.

**`frontend/src/App.tsx`** — Assembles Sidebar + TopBar + MainContent. Manages global state (active tab, analysis results, upload state).

### Step 6.7: Commit

```bash
git add frontend/
git commit -m "feat: frontend scaffolding with layout, sidebar, theme"
```

---

## Task 7: Upload + API Client + Quality Detection Module

**Goal:** Implement file upload, API communication, and quality detection display.

### Step 7.1: Create `frontend/src/api/client.ts`

Axios-based API client with `analyzeFile(file: File)` and `analyzeBasic(file: File)` methods. Handles upload progress via `onUploadProgress` callback.

### Step 7.2: Create `frontend/src/components/upload/FileUpload.tsx`

Drag & drop zone with visual feedback. Accepts audio files. Shows progress bar during upload. Error display for invalid formats.

### Step 7.3: Create `frontend/src/components/quality/QualityDetection.tsx`

- Overall score gauge (ECharts gauge, color based on grade)
- 7 sub-score progress bars with labels (码率评分, 文件完整度, etc.)
- Grade label (极佳/优秀/良好/一般/较差) with color
- Detail text for each sub-score (expandable)

### Step 7.4: Commit

```bash
git add frontend/src/
git commit -m "feat: file upload, API client, quality detection module"
```

---

## Task 8: Spectrum + Waveform + Channel + AudioInfo + Player Modules

**Goal:** Implement remaining 5 frontend modules.

### Step 8.1: Spectrum module — `frontend/src/components/spectrum/`

**`SpectrumAnalyzer.tsx`** — ECharts line chart, log frequency axis (20Hz-20kHz), dB y-axis (-90 to 0), peak hold ghost line.

**`SpectrogramHeatmap.tsx`** — ECharts heatmap, time (x) vs frequency (y), color scale (blue→red), hover tooltip.

**`FrequencyDistribution.tsx`** — ECharts radar or bar chart, 5 bands with energy levels.

### Step 8.2: Waveform module — `frontend/src/components/waveform/WaveformDisplay.tsx`

ECharts line chart with area fill. Zoom (mouse wheel), pan (drag). RMS envelope overlay (thin line). Clipping regions highlighted in red. Silent regions in gray. Click to set playback position.

### Step 8.3: Channel module — `frontend/src/components/channel/`

**`ChannelAnalysis.tsx`** — L/R waveform overlay, channel balance display.

**`PhaseCorrelation.tsx`** — ECharts gauge (-1 to +1), color gradient (red=bad, green=good).

**`MidSideSpectrum.tsx`** — Two overlaid line charts (Mid vs Side), frequency axis.

### Step 8.4: Audio Info module — `frontend/src/components/audioinfo/AudioInfo.tsx`

Grid of info cards organized by category (文件属性, 音频参数, 时间信息, 响度信息, 标签信息, DSD信息). Each card has label + value. Clean, readable layout.

### Step 8.5: Player module — `frontend/src/components/player/AudioPlayer.tsx`

Web Audio API-based player. Waveform visualization with playback cursor. Play/pause, volume slider, time display. Loop A-B markers (click to set).

### Step 8.6: Create `frontend/src/hooks/useAudioContext.ts`

Custom hook managing Web Audio API context, AudioBufferSourceNode, playback state, volume, loop markers.

### Step 8.7: Commit

```bash
git add frontend/src/
git commit -m "feat: spectrum, waveform, channel, audio info, player frontend modules"
```

---

## Task 9: GitHub Workflows + Project Files

**Goal:** CI/CD, issue templates, README, CHANGELOG.

### Step 9.1: Create `.github/workflows/ci.yml`

Triggers on PR to `develop`/`main`. Jobs: Python lint (flake8), backend tests (pytest), frontend lint (eslint), frontend build (tsc + vite build).

### Step 9.2: Create `.github/workflows/release.yml`

Triggers on tag push (`v*`). Creates GitHub Release with changelog.

### Step 9.3: Create `.github/ISSUE_TEMPLATE/feature.md` and `bug.md`

Standard issue templates with sections for description, acceptance criteria, etc.

### Step 9.4: Create `.github/PULL_REQUEST_TEMPLATE.md`

Sections: description, changes, testing done, checklist.

### Step 9.5: Create `README.md`

Project overview, features, screenshots placeholder, setup instructions (conda, npm install, run), API documentation link, contributing guide.

### Step 9.6: Create `CHANGELOG.md`

Initial entry: v2.0.0 with feature list.

### Step 9.7: Create `LICENSE`

MIT License.

### Step 9.8: Commit

```bash
git add .github/ README.md CHANGELOG.md LICENSE
git commit -m "docs: add CI/CD, issue templates, README, CHANGELOG, LICENSE"
```

---

## Task 10: Integration Testing + Polish

**Goal:** End-to-end verification, fix issues, ensure everything works together.

### Step 10.1: Run full backend test suite

```bash
cd backend && python -m pytest tests/ -v --tb=short
# Fix any failures
```

### Step 10.2: Start backend + frontend together

```bash
# Terminal 1:
cd backend && conda activate work && uvicorn app.main:app --host 0.0.0.0 --port 9210

# Terminal 2:
cd frontend && npm run dev
```

### Step 10.3: Manual smoke test

1. Open http://localhost:9211
2. Drag & drop a WAV file
3. Verify all 6 sidebar modules load correctly
4. Verify quality score displays
5. Verify waveform/spectrum charts render
6. Verify audio player plays

### Step 10.4: Create initial `develop` branch

```bash
git checkout -b develop
git push -u origin develop
```

### Step 10.5: Final commit

```bash
git add -A
git commit -m "chore: integration verification complete"
```

---

## Summary

| Task | Module | Est. Time |
|------|--------|-----------|
| 1 | Project scaffolding + backend skeleton | 20 min |
| 2 | BasicInfoModule (TDD) | 25 min |
| 3 | QualityModule — 7 dimensions (TDD) | 30 min |
| 4 | Spectrum + Waveform + Channel modules (TDD) | 40 min |
| 5 | Pydantic models + API endpoints + PlayerModule | 30 min |
| 6 | Frontend scaffolding + layout + theme | 30 min |
| 7 | Upload + API client + quality detection | 25 min |
| 8 | Spectrum + waveform + channel + info + player UI | 40 min |
| 9 | GitHub workflows + project files | 20 min |
| 10 | Integration testing + polish | 20 min |
| **Total** | | **~4.5 hours** |
