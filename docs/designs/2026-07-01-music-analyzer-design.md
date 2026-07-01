# Music Audio Quality Analyzer — Design Spec

**Date**: 2026-07-01
**Status**: Draft
**Author**: Claude + User

## 1. Overview

A web-based audio quality analyzer that accepts music files, performs multi-dimensional audio analysis, and presents results through rich interactive visualizations. The tool helps users understand the technical quality, spectral characteristics, distortion levels, and overall quality rating of their audio files.

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + ECharts + Tailwind CSS |
| Backend | Python 3 (Anaconda `work` env) + FastAPI |
| Audio Analysis | librosa, mutagen, ffprobe (ffmpeg), numpy |
| Build/Dev | Vite (frontend), uvicorn (backend) |
| Repository | GitHub, with full SE workflow |

### 2.1 Ports

| Service | Port |
|---------|------|
| Backend API | `9210` |
| Frontend Dev Server | `9211` |

### 2.2 Python Environment

All Python development runs in Anaconda `work` environment. Dependencies managed via `environment.yml`.

## 3. System Architecture

```
┌─────────────────────────────────────────────────┐
│           React Frontend (Port 9211)             │
│                                                   │
│  Upload → Dashboard (analysis results)            │
│  Components:                                      │
│    - File upload (drag & drop + click)            │
│    - Quality score gauge                          │
│    - Basic info cards                             │
│    - Waveform chart                               │
│    - Spectrogram heatmap                          │
│    - Frequency distribution line chart            │
│    - Quality issues report                        │
└───────────────────┬─────────────────────────────┘
                    │  REST API (JSON)
┌───────────────────┴─────────────────────────────┐
│           FastAPI Backend (Port 9210)             │
│                                                   │
│  Endpoints:                                       │
│    POST /api/analyze  — upload & analyze          │
│    GET  /api/health   — health check              │
│                                                   │
│  Analysis Engine (4 independent modules):         │
│    1. BasicInfoModule    — metadata extraction     │
│    2. SpectrumModule     — spectral analysis       │
│    3. DistortionModule   — quality defect detection│
│    4. ScoringModule      — weighted quality score  │
└───────────────────────────────────────────────────┘
```

### 3.1 Data Flow

1. User uploads audio file via frontend (drag & drop or file picker)
2. Frontend sends `POST /api/analyze` with multipart/form-data
3. Backend saves file to temp directory
4. Four analysis modules run (can be parallelized via `asyncio.gather`)
5. Results merged into single JSON response
6. Frontend renders all visualization panels
7. Temp file cleaned up after analysis

## 4. Backend Design

### 4.1 Supported Formats

| Category | Formats |
|----------|---------|
| Lossless | WAV, FLAC, AIFF, APE, ALAC (M4A) |
| Lossy | MP3, AAC, OGG (Vorbis/Opus), WMA |
| DSD | DSF, DFF (DSD64/128/256) |

Any format supported by ffmpeg is accepted. DSD files are converted to PCM via ffmpeg's `dsd2pcm` filter before spectral/distortion analysis; basic metadata (DSD rate, channel count) is read directly from DSF/DFF headers.

### 4.2 File Size Limit

Maximum upload size: **2 GB**. DSD files (especially DSD256) can exceed 1 GB; this limit accommodates the full range.

### 4.2 Analysis Modules

#### Module 1: BasicInfoModule

Extracts technical metadata from the audio file.

**Output schema:**
```json
{
  "format": "FLAC",
  "bitrate_kbps": 1411,
  "sample_rate_hz": 44100,
  "bit_depth": 16,
  "channels": 2,
  "channel_mode": "stereo",
  "duration_seconds": 222.5,
  "file_size_mb": 28.3
}
```

**Dependencies:** `mutagen` (metadata), `ffprobe` (fallback for unsupported tags, DSD info)

**DSD handling:** For DSF/DFF files, extract DSD-specific metadata (DSD rate: 64/128/256, channel count) from file headers directly. For spectral/distortion analysis, convert DSD to PCM via `ffmpeg -i input.dsf -af dsd2pcm -f wav pipe:1`.

#### Module 2: SpectrumModule

Performs spectral analysis of the audio signal.

**Output schema:**
```json
{
  "waveform": {
    "samples": [0.12, -0.34, ...],
    "sample_rate": 1000
  },
  "spectrogram": {
    "frequencies": [20, 40, ..., 20000],
    "times": [0.0, 0.01, ..., 222.5],
    "magnitude_db": [[-60, -55, ...], ...]
  },
  "frequency_distribution": {
    "bands": ["20-60Hz", "60-250Hz", "250-2kHz", "2k-6kHz", "6k-20kHz"],
    "energy_db": [-20.5, -15.3, -10.2, -8.7, -12.1]
  }
}
```

**Dependencies:** `librosa` (STFT, mel spectrogram), `numpy`

**Notes:**
- Waveform: downsampled to ~1000 points/sec for frontend rendering
- Spectrogram: STFT with hop_length=512, magnitude converted to dB scale
- Frequency bands: 5-band standard division (sub-bass, bass, mid, presence, brilliance)

#### Module 3: DistortionModule

Detects quality defects and distortion artifacts.

**Output schema:**
```json
{
  "clipping": {
    "detected": true,
    "clip_count": 42,
    "clip_ratio_percent": 0.03
  },
  "noise_floor_db": -72.5,
  "dynamic_range_db": 12.3,
  "silence_segments": [
    {"start": 0.0, "end": 0.5},
    {"start": 220.0, "end": 222.5}
  ],
  "peak_db": -0.3,
  "rms_db": -14.2
}
```

**Dependencies:** `librosa`, `numpy`

**Detection logic:**
- **Clipping**: samples at ±1.0 (or within 0.1% of max for lossy formats), 3+ consecutive samples
- **Noise floor**: 5th percentile of non-silent frame RMS values
- **Dynamic range**: peak RMS - noise floor
- **Silence**: frames with RMS < -60 dB lasting > 0.3s

#### Module 4: ScoringModule

Computes a weighted quality score (0-100) with sub-scores and letter grade.

**Scoring weights:**

| Dimension | Weight | Metrics |
|-----------|--------|---------|
| Technical Quality | 40% | Bitrate, sample rate, bit depth vs reference values |
| Spectral Quality | 20% | High-frequency energy preservation, frequency coverage |
| Distortion Level | 20% | Clip ratio (inverted), noise floor level |
| Dynamic Range | 20% | DR value vs reference (14 dB = perfect) |

**Technical quality scoring (reference table):**

| Metric | Max Score | Threshold (0 score) |
|--------|-----------|-------------------|
| Bitrate | 320 kbps → 100 | 64 kbps → 0 |
| Sample Rate | 48000 Hz → 100 | 8000 Hz → 0 |
| Bit Depth | 24 bit → 100 | 8 bit → 0 |

**Letter grades:** A (≥80), B (≥60), C (≥40), D (<40)

**Output schema:**
```json
{
  "overall_score": 85,
  "grade": "A",
  "sub_scores": {
    "technical": 92,
    "spectral": 78,
    "distortion": 88,
    "dynamic_range": 75
  }
}
```

### 4.3 API Endpoints

#### `POST /api/analyze`

Accepts: `multipart/form-data` with field `file` (audio file)
Returns: JSON with all analysis results
Max file size: 2 GB

**Response schema:**
```json
{
  "basic_info": { ... },
  "spectrum": { ... },
  "distortion": { ... },
  "scoring": { ... }
}
```

**Error responses:**
- `400`: Invalid file format
- `413`: File too large
- `500`: Analysis failed (with error message)

#### `GET /api/health`

Returns: `{ "status": "ok", "version": "1.0.0" }`

## 5. Frontend Design

### 5.1 Page Layout (Single-page Dashboard)

```
┌──────────────────────────────────────────────────┐
│  🎵 Music Analyzer                  [Upload File] │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────────────┐ ┌──────────────────────┐ │
│  │ 📊 Quality Score    │ │ 📋 Basic Info         │ │
│  │  85/100  Grade: A   │ │  Format: FLAC         │ │
│  │  [Gauge Chart]      │ │  Bitrate: 1411 kbps   │ │
│  │  [Sub-score Bars]   │ │  Sample Rate: 44.1kHz │ │
│  │                     │ │  Bit Depth: 16-bit    │ │
│  │                     │ │  Duration: 3:42       │ │
│  │                     │ │  Channels: Stereo     │ │
│  └─────────────────────┘ └──────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🔊 Waveform                                  │ │
│  │ [Interactive time-amplitude chart, zoomable]  │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 📈 Spectrogram                                │ │
│  │ [Frequency-time heatmap, hover for values]    │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 📉 Frequency Distribution                     │ │
│  │ [5-band energy bar/line chart]                │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ ⚠️ Quality Issues Report                      │ │
│  │ [Clipping, noise floor, dynamic range, etc.]  │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 5.2 Visualization Components

| Component | Library | Interactivity |
|-----------|---------|---------------|
| Quality Gauge | ECharts gauge | Animated fill on load |
| Sub-score Bars | ECharts bar chart | Hover for details |
| Waveform | ECharts line chart | Zoom, pan, brush select |
| Spectrogram | ECharts heatmap | Hover tooltip (time, freq, dB) |
| Frequency Distribution | ECharts bar chart | Hover for dB values |
| Quality Issues | Custom HTML/CSS | Expandable detail rows |

### 5.3 Upload Component

- Drag & drop zone with visual feedback (border highlight, icon change)
- Click to open file picker
- Accept: all supported audio formats
- Show file name and size after selection
- Upload progress bar
- Error display for invalid formats or oversized files

### 5.4 States

1. **Empty**: Upload prompt, no analysis panels visible
2. **Uploading**: Progress bar, analysis panels hidden
3. **Analyzing**: Loading spinner with "Analyzing..." message
4. **Results**: Full dashboard with all panels
5. **Error**: Error message with retry option

## 6. Project Structure

```
music-analyzer/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Lint, test, build
│   │   └── release.yml         # Tag-based release
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   └── bug.md
│   └── PULL_REQUEST_TEMPLATE.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app, CORS, startup
│   │   ├── config.py           # Constants, port, limits
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── analyze.py      # /api/analyze endpoint
│   │   └── analyzers/
│   │       ├── __init__.py
│   │       ├── basic_info.py   # Module 1
│   │       ├── spectrum.py     # Module 2
│   │       ├── distortion.py   # Module 3
│   │       └── scoring.py      # Module 4
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_basic_info.py
│   │   ├── test_spectrum.py
│   │   ├── test_distortion.py
│   │   ├── test_scoring.py
│   │   └── test_api.py
│   └── environment.yml         # Anaconda environment spec (primary)
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── client.ts       # API calls
│   │   ├── components/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ScoreGauge.tsx
│   │   │   ├── BasicInfo.tsx
│   │   │   ├── WaveformChart.tsx
│   │   │   ├── SpectrogramChart.tsx
│   │   │   ├── FrequencyChart.tsx
│   │   │   └── IssuesReport.tsx
│   │   ├── types/
│   │   │   └── analysis.ts     # TypeScript interfaces
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   └── designs/
│       └── 2026-07-01-music-analyzer-design.md  # This file
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## 7. .gitignore (Claude-related exclusions)

```
# Claude AI
.claude
claude_desktop_config.json
CLAUDE.md
```

Note: Project-level `CLAUDE.md` is gitignored to avoid exposing AI workflow instructions. User's global `~/.claude/CLAUDE.md` is outside the repo and unaffected.

## 8. Software Engineering Workflow

### 8.1 Branch Strategy

- `main` — stable releases, always deployable
- `develop` — integration branch for features
- `feature/<issue-number>-<short-name>` — feature branches
- `fix/<issue-number>-<short-name>` — bug fix branches

### 8.2 Development Cycle

1. Create GitHub Issue (feature/bug)
2. Branch from `develop`
3. Develop with tests
4. Open PR to `develop`
5. CI checks pass (lint, test, build)
6. Code review
7. Merge to `develop`
8. Periodic release: `develop` → `main` with version tag

### 8.3 CI/CD (GitHub Actions)

- **On PR**: lint (eslint + flake8), test (pytest + vitest), build check
- **On tag**: create GitHub Release with artifacts

### 8.4 Versioning

Semantic Versioning: `MAJOR.MINOR.PATCH`

## 9. Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid file format | Return 400 with supported format list |
| File > 2GB | Return 413 with size limit message |
| Corrupted audio file | Return 500 with "file may be corrupted" message |
| ffprobe/librosa failure | Catch per-module, return partial results with warnings |
| Network timeout | Frontend shows retry button after 30s |

## 10. Testing Strategy

- **Unit tests**: Each analyzer module tested independently with known audio fixtures
- **Integration tests**: API endpoint tests with sample files
- **Frontend tests**: Component tests for key UI elements
- **Test fixtures**: Small audio files (WAV, MP3, FLAC) in `backend/tests/fixtures/`
