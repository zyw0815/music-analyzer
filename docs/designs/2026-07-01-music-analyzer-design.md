# Music Audio Quality Analyzer — Design Spec

**Date**: 2026-07-01
**Status**: Draft
**Version**: 2.0

## 1. Overview

A professional web-based audio analysis suite inspired by tools like "Audio Expert". Users upload music files and switch between analysis modules via a left sidebar. Features include quality detection, spectrum analysis, waveform visualization, channel analysis, audio information, and a built-in player — all with rich interactive visualizations and a professional dark-themed UI.

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + ECharts + Tailwind CSS |
| Backend | Python 3 (Anaconda `work` env) + FastAPI |
| Audio Analysis | librosa, mutagen, ffprobe (ffmpeg), numpy, scipy |
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
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend (Port 9211)                 │
│                                                               │
│  ┌────────┐  ┌────────────────────────────────────────────┐  │
│  │        │  │  ┌──────────────────────────────────────┐  │  │
│  │ Left   │  │  │  Top Bar: Player + File Info         │  │  │
│  │ Sidebar│  │  │  [waveform] [play] [name] [info]     │  │  │
│  │        │  │  └──────────────────────────────────────┘  │  │
│  │ 🎵播放 │  │  ┌──────────────────────────────────────┐  │  │
│  │ 📊质量 │  │  │                                      │  │  │
│  │ 📈频谱 │  │  │  Main Content Area                   │  │  │
│  │ 🔊波形 │  │  │  (switches based on sidebar selection)│  │  │
│  │ 🔀声道 │  │  │                                      │  │  │
│  │ ℹ️信息 │  │  │                                      │  │  │
│  │        │  │  └──────────────────────────────────────┘  │  │
│  └────────┘  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    │  REST API (JSON)
┌───────────────────┴─────────────────────────────────────────┐
│                   FastAPI Backend (Port 9210)                 │
│                                                               │
│  Endpoints:                                                   │
│    POST /api/analyze        — full analysis (all modules)     │
│    POST /api/analyze/basic  — basic info only (fast)          │
│    POST /api/analyze/stream — streaming for large files       │
│    GET  /api/health         — health check                    │
│                                                               │
│  Analysis Engine (6 independent modules):                     │
│    1. BasicInfoModule     — metadata + file info              │
│    2. QualityModule       — quality scoring (redesigned)      │
│    3. SpectrumModule      — spectral analysis                 │
│    4. WaveformModule      — waveform data extraction          │
│    5. ChannelModule       — stereo/channel analysis           │
│    6. PlayerModule        — audio stream for playback         │
└───────────────────────────────────────────────────────────────┘
```

### 3.1 Data Flow

1. User uploads audio file via drag & drop or file picker
2. Frontend immediately calls `POST /api/analyze/basic` for quick file info (shown in top bar)
3. Frontend then calls `POST /api/analyze` for full analysis
4. Backend runs 6 modules; results returned as JSON
5. User navigates between modules via left sidebar
6. Each module renders its own visualization panel
7. Built-in player streams audio via `GET /api/stream/{file_id}`

## 4. UI Layout & Navigation

### 4.1 Overall Layout

Dark theme (background: #1a1a2e, panels: #16213e, accent: #0f3460, highlight: #e94560).

```
┌───────────────────────────────────────────────────────────────┐
│  ┌──────┐ ┌──────────────────────────────────────────────┐    │
│  │      │ │ 🎵 filename.flac    44.1kHz | 16bit | 3:42   │    │
│  │      │ │ [=== waveform mini player ===] [▶/⏸] [🔊]    │    │
│  │ SIDE │ ├──────────────────────────────────────────────┤    │
│  │ BAR  │ │                                              │    │
│  │      │ │         ACTIVE MODULE CONTENT                │    │
│  │  🎵  │ │         (changes based on sidebar)           │    │
│  │  📊  │ │                                              │    │
│  │  📈  │ │                                              │    │
│  │  🔊  │ │                                              │    │
│  │  🔀  │ │                                              │    │
│  │  ℹ️  │ │                                              │    │
│  │      │ │                                              │    │
│  └──────┘ └──────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 Left Sidebar Modules

| Icon | Module | Description |
|------|--------|-------------|
| 🎵 | **播放器** (Player) | Full waveform player with playback controls, loop markers |
| 📊 | **质量检测** (Quality Detection) | Overall quality score + sub-scores with gauge and bar charts |
| 📈 | **频谱分析** (Spectrum Analysis) | Real-time spectrum analyzer, spectrogram heatmap, frequency distribution |
| 🔊 | **波形显示** (Waveform Display) | Detailed zoomable waveform with amplitude markers |
| 🔀 | **声道分析** (Channel Analysis) | L/R channel separation, stereo width, phase correlation |
| ℹ️ | **音频信息** (Audio Info) | Comprehensive technical metadata, codec details, file properties |

### 4.3 Sidebar Behavior

- Collapsed: shows only icons (48px wide)
- Expanded: shows icons + labels (200px wide)
- Toggle button at bottom
- Active module highlighted with accent color
- Hover tooltip when collapsed

## 5. Module Designs

### 5.1 Module: 播放器 (Player)

Built-in audio player with mini waveform visualization.

**Features:**
- Play/pause, seek (click waveform), volume control
- Waveform display colored by amplitude
- Current position indicator (moving cursor)
- Loop A-B selection (set start/end markers)
- Time display (current / total)
- File info summary (format, bitrate, sample rate, channels)

**Backend:** `GET /api/stream/{file_id}` — streams audio for Web Audio API playback

### 5.2 Module: 质量检测 (Quality Detection)

Comprehensive quality scoring, redesigned to match professional tools.

**Layout:**
```
┌──────────────────────────────────────────────────┐
│                                                    │
│   ┌──────────┐  ┌───────────────────────────────┐ │
│   │ Overall  │  │  码率评分      ████████░░  50  │ │
│   │  Score   │  │  文件完整度    ██████████ 100  │ │
│   │          │  │  质量检测      ██████████ 100  │ │
│   │   94     │  │  声道评分      ████████░░  75  │ │
│   │  极佳    │  │                               │ │
│   │          │  │  频谱质量      █████████░  88  │ │
│   │ [仪表盘] │  │  动态范围      ████████░░  82  │ │
│   └──────────┘  │  失真程度      █████████░  90  │ │
│                  └───────────────────────────────┘ │
│                                                    │
│   ┌─────────────────────────────────────────────┐ │
│   │  评分明细 / 评分说明                          │ │
│   │  (expandable detail for each sub-score)      │ │
│   └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Sub-scores (7 dimensions):**

| Dimension | Weight | Metrics |
|-----------|--------|---------|
| 码率评分 (Bitrate Score) | 15% | Bitrate vs format reference |
| 文件完整度 (File Integrity) | 10% | Header validity, seek table, frame consistency |
| 质量检测 (Quality Detection) | 20% | Clipping, noise floor, artifacts |
| 声道评分 (Channel Score) | 10% | Channel balance, stereo separation |
| 频谱质量 (Spectral Quality) | 15% | High-freq preservation, frequency coverage |
| 动态范围 (Dynamic Range) | 15% | Peak-to-noise ratio |
| 失真程度 (Distortion) | 15% | THD+N, clipping ratio, lossy artifacts |

**Grades:** 极佳(A, ≥90), 优秀(B, ≥75), 良好(C, ≥60), 一般(D, ≥40), 较差(E, <40)

### 5.3 Module: 频谱分析 (Spectrum Analysis)

Professional-grade spectrum analysis tools.

**Sub-views (tabs within the module):**

1. **实时频谱** (Live Spectrum) — frequency (x) vs magnitude dB (y), updated with playback
   - ECharts line chart, logarithmic frequency axis (20Hz–20kHz)
   - dB scale: -90 to 0
   - Peak hold line (transient peaks shown as ghost line)
   - Frequency cursor on hover

2. **频谱图** (Spectrogram/Heatmap) — time (x) vs frequency (y), color = magnitude
   - ECharts heatmap
   - Colormap: dark blue (low) → red (high)
   - Hover tooltip: time, frequency, dB

3. **频率分布** (Frequency Distribution) — 5-band energy overview
   - Sub-bass (20-60Hz), Bass (60-250Hz), Mid (250-2kHz), Presence (2k-6kHz), Brilliance (6k-20kHz)
   - ECharts radar chart or bar chart
   - Shows energy balance across bands

### 5.4 Module: 波形显示 (Waveform Display)

Detailed waveform visualization.

**Features:**
- Full-resolution waveform (not downsampled like the mini player)
- Zoomable (mouse wheel) and pannable (drag)
- Y-axis: amplitude (-1.0 to 1.0)
- X-axis: time (MM:SS.ms)
- Clipping regions highlighted in red
- Silent regions highlighted in gray
- RMS envelope overlay (thin line showing RMS level)
- Click to set playback position

### 5.5 Module: 声道分析 (Channel Analysis)

Stereo and channel-specific analysis.

**Layout:**
```
┌──────────────────────────────────────────────────┐
│                                                    │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ L/R Waveform     │  │ Correlation Meter     │   │
│  │ (overlaid or     │  │ (-1 to +1 gauge)      │   │
│  │  side-by-side)   │  │                       │   │
│  └──────────────────┘  └──────────────────────┘   │
│                                                    │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ L/R Spectrum     │  │ Channel Balance       │   │
│  │ (two line charts │  │ (L vs R dB level)     │   │
│  │  overlaid)       │  │                       │   │
│  └──────────────────┘  └──────────────────────┘   │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ Mid/Side Spectrum                           │   │
│  │ (M = (L+R)/2, S = (L-R)/2)                 │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Features:**
- Phase correlation meter (-1 to +1): -1=out of phase, +1=in phase, 0=uncorrelated
- Channel balance: L vs R RMS level comparison
- L/R spectrum overlay: compare frequency response of each channel
- Mid/Side spectrum: analyze stereo content distribution
- Mono compatibility check (sum to mono, check for cancellation)

### 5.6 Module: 音频信息 (Audio Info)

Comprehensive technical metadata display.

**Layout:** Clean info card grid

**Fields:**

| Category | Fields |
|----------|--------|
| 文件属性 | 文件名, 文件大小, 格式, 编码器, MD5 |
| 音频参数 | 采样率, 位深度, 声道数, 声道模式, 比特率, 比特率模式 |
| 时间信息 | 总时长, 起始偏移 |
| 响度信息 | 峰值电平, RMS 电平, 动态范围 |
| 标签信息 | Title, Artist, Album, Year, Genre, Track# (if available) |
| DSD 信息 | DSD rate (64/128/256), DSD channels (DSD files only) |

## 6. Backend Design

### 6.1 Supported Formats

| Category | Formats |
|----------|---------|
| Lossless | WAV, FLAC, AIFF, APE, ALAC (M4A) |
| Lossy | MP3, AAC, OGG (Vorbis/Opus), WMA |
| DSD | DSF, DFF (DSD64/128/256) |

Any format supported by ffmpeg is accepted. DSD files are converted to PCM via ffmpeg's `dsd2pcm` filter before spectral/distortion analysis; basic metadata (DSD rate, channel count) is read directly from DSF/DFF headers.

### 6.2 File Size Limit

Maximum upload size: **5 GB**. DSD files (especially DSD256) can exceed 1 GB; this limit accommodates the full range.

### 6.3 Analysis Modules

#### Module 1: BasicInfoModule

Extracts comprehensive technical metadata. Powers the "音频信息" module and the top bar file info.

**Output schema:**
```json
{
  "file": {
    "name": "song.flac",
    "size_bytes": 29687808,
    "format": "FLAC",
    "encoder": "libFLAC 1.3.3",
    "md5": "a1b2c3d4..."
  },
  "audio": {
    "codec": "FLAC",
    "sample_rate_hz": 44100,
    "bit_depth": 16,
    "channels": 2,
    "channel_mode": "stereo",
    "bitrate_kbps": 1411,
    "bitrate_mode": "CBR"
  },
  "timing": {
    "duration_seconds": 222.5,
    "start_offset": 0.0
  },
  "loudness": {
    "peak_db": -0.3,
    "rms_db": -14.2,
    "dynamic_range_db": 12.3
  },
  "tags": {
    "title": "Song Name",
    "artist": "Artist",
    "album": "Album",
    "year": "2020",
    "genre": "Rock",
    "track": "1"
  },
  "dsd": null
}
```

For DSD files, `dsd` field contains:
```json
{
  "dsd_rate": 128,
  "dsd_channels": 2,
  "is_dsd": true
}
```

**Dependencies:** `mutagen` (metadata + tags), `ffprobe` (codec info fallback)

**DSD handling:** For DSF/DFF files, extract DSD-specific metadata (DSD rate: 64/128/256, channel count) from file headers directly. For spectral/distortion analysis, convert DSD to PCM via `ffmpeg -i input.dsf -af dsd2pcm -f wav pipe:1`.

#### Module 2: QualityModule

Comprehensive quality scoring with 7 sub-dimensions. Powers the "质量检测" module.

**Output schema:**
```json
{
  "overall_score": 94,
  "grade": "极佳",
  "sub_scores": {
    "bitrate": 50,
    "integrity": 100,
    "quality_detection": 100,
    "channel": 75,
    "spectral": 88,
    "dynamic_range": 82,
    "distortion": 90
  },
  "details": {
    "bitrate": "CBR 1411kbps, lossless encoding",
    "integrity": "Header valid, seek table present, no frame errors",
    "quality_detection": "No clipping detected, noise floor -72dB",
    "channel": "Stereo, L/R balance within 0.5dB",
    "spectral": "Full frequency coverage up to 20kHz",
    "dynamic_range": "DR 12.3dB (good)",
    "distortion": "THD+N < 0.01%"
  }
}
```

**Sub-score calculation:**

| Dimension | Weight | Algorithm |
|-----------|--------|-----------|
| 码率评分 | 15% | Linear: 64kbps→0, 320kbps→100 (lossless always 100) |
| 文件完整度 | 10% | Header validity (40), seek table (30), frame consistency (30) |
| 质量检测 | 20% | Clipping (40), noise floor (30), artifacts (30) |
| 声道评分 | 10% | Balance (50), stereo width (50) |
| 频谱质量 | 15% | High-freq energy (50), frequency coverage (50) |
| 动态范围 | 15% | 0dB→0, 14dB→100 |
| 失真程度 | 15% | Inverse of clip ratio + noise level |

**Grades:** 极佳(A, ≥90), 优秀(B, ≥75), 良好(C, ≥60), 一般(D, ≥40), 较差(E, <40)

#### Module 3: SpectrumModule

Performs spectral analysis. Powers the "频谱分析" module.

**Output schema:**
```json
{
  "spectrum": {
    "frequencies": [20, 25, ..., 20000],
    "magnitude_db": [-60, -55, ...],
    "peak_hold_db": [-50, -45, ...]
  },
  "spectrogram": {
    "frequencies": [20, 40, ..., 20000],
    "times": [0.0, 0.05, ..., 222.5],
    "magnitude_db": [[-60, -55, ...], ...]
  },
  "frequency_distribution": {
    "bands": ["20-60Hz", "60-250Hz", "250-2kHz", "2k-6kHz", "6k-20kHz"],
    "energy_db": [-20.5, -15.3, -10.2, -8.7, -12.1]
  }
}
```

**Dependencies:** `librosa` (STFT, mel spectrogram), `numpy`, `scipy`

**Notes:**
- Spectrum: FFT size 4096, logarithmic frequency axis, 1/3 octave smoothing
- Peak hold: max magnitude per frequency bin across all frames
- Spectrogram: STFT with hop_length=512, magnitude in dB
- Frequency bands: 5-band standard division

#### Module 4: WaveformModule

Extracts waveform data for the "波形显示" and "播放器" modules.

**Output schema:**
```json
{
  "waveform": {
    "samples": [0.12, -0.34, ...],
    "times": [0.0, 0.0001, ...],
    "sample_rate": 44100,
    "downsampled_rate": 1000
  },
  "rms_envelope": {
    "values": [-14.2, -13.8, ...],
    "times": [0.0, 0.01, ...]
  },
  "clipping_regions": [
    {"start": 45.2, "end": 45.25}
  ],
  "silence_regions": [
    {"start": 0.0, "end": 0.5},
    {"start": 220.0, "end": 222.5}
  ]
}
```

**Dependencies:** `librosa`, `numpy`

**Notes:**
- Main waveform: downsampled to ~1000 points/sec for frontend rendering
- RMS envelope: windowed RMS (window=1024, hop=512)
- Clipping: 3+ consecutive samples at ±1.0 (or 0.1% max for lossy)
- Silence: frames with RMS < -60 dB lasting > 0.3s

#### Module 5: ChannelModule

Performs stereo/channel analysis. Powers the "声道分析" module.

**Output schema:**
```json
{
  "phase_correlation": 0.85,
  "channel_balance_db": 0.3,
  "left_spectrum": {
    "frequencies": [20, 25, ..., 20000],
    "magnitude_db": [-60, -55, ...]
  },
  "right_spectrum": {
    "frequencies": [20, 25, ..., 20000],
    "magnitude_db": [-62, -54, ...]
  },
  "mid_spectrum": {
    "frequencies": [20, 25, ..., 20000],
    "magnitude_db": [-58, -52, ...]
  },
  "side_spectrum": {
    "frequencies": [20, 25, ..., 20000],
    "magnitude_db": [-70, -65, ...]
  },
  "stereo_width": 0.65,
  "is_mono": false
}
```

**Dependencies:** `librosa`, `numpy`

**Notes:**
- Phase correlation: Pearson correlation coefficient between L and R (-1 to +1)
- Channel balance: difference in RMS between L and R
- Mid = (L+R)/2, Side = (L-R)/2
- Stereo width: RMS of Side / RMS of Mid
- Mono detection: if phase_correlation > 0.98, flag as mono

#### Module 6: PlayerModule

Backend streaming for the built-in player.

**Endpoint:** `GET /api/stream/{file_id}` — streams audio as WAV for Web Audio API

**Behavior:** Reads uploaded file, converts to WAV (16-bit, stereo), streams with `Content-Type: audio/wav`. DSD files converted via `dsd2pcm` filter.

### 6.4 API Endpoints

#### `POST /api/analyze`

Full analysis — runs all modules, returns combined results.

Accepts: `multipart/form-data` with field `file` (audio file)
Returns: JSON with all analysis results
Max file size: 5 GB

**Response schema:**
```json
{
  "file_id": "uuid-string",
  "basic_info": { ... },
  "quality": { ... },
  "spectrum": { ... },
  "waveform": { ... },
  "channel": { ... }
}
```

**Error responses:**
- `400`: Invalid file format
- `413`: File too large
- `500`: Analysis failed (with error message)

#### `POST /api/analyze/basic`

Quick metadata extraction only (no signal processing). For showing file info in the top bar while full analysis runs.

Accepts: `multipart/form-data` with field `file`
Returns: `basic_info` object only

#### `GET /api/stream/{file_id}`

Streams audio for built-in player. Returns WAV audio.

#### `GET /api/health`

Returns: `{ "status": "ok", "version": "2.0.0" }`

## 7. Frontend Design

### 7.1 App States

1. **Empty**: Upload prompt (centered, large drop zone), no sidebar content
2. **Uploading**: Progress bar overlay, sidebar disabled
3. **Analyzing**: Loading spinner per module as they complete
4. **Results**: Full app with sidebar + active module
5. **Error**: Error message with retry option

### 7.2 Upload Flow

- Drag & drop anywhere in the app window, or click upload button
- Accept: all supported audio formats
- Show file name, size, and format after selection
- Upload progress bar
- Error display for invalid formats or oversized files
- After upload: immediately show basic info in top bar, start full analysis

### 7.3 Theme

Dark professional theme:
- Background: `#0d1117`
- Panel: `#161b22`
- Border: `#30363d`
- Text primary: `#e6edf3`
- Text secondary: `#8b949e`
- Accent: `#e94560` (red highlight)
- Accent alt: `#58a6ff` (blue)
- Success: `#3fb950` (green)
- Warning: `#d29922` (yellow)

## 8. Project Structure

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
│   │   ├── models.py           # Pydantic response models
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── analyze.py      # /api/analyze, /api/analyze/basic
│   │   │   └── stream.py       # /api/stream/{file_id}
│   │   └── analyzers/
│   │       ├── __init__.py
│   │       ├── basic_info.py   # Module 1
│   │       ├── quality.py      # Module 2
│   │       ├── spectrum.py     # Module 3
│   │       ├── waveform.py     # Module 4
│   │       ├── channel.py      # Module 5
│   │       └── player.py       # Module 6
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_basic_info.py
│   │   ├── test_quality.py
│   │   ├── test_spectrum.py
│   │   ├── test_waveform.py
│   │   ├── test_channel.py
│   │   └── test_api.py
│   └── environment.yml         # Anaconda environment spec
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── client.ts       # API calls
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── TopBar.tsx
│   │   │   │   └── MainContent.tsx
│   │   │   ├── upload/
│   │   │   │   └── FileUpload.tsx
│   │   │   ├── player/
│   │   │   │   └── AudioPlayer.tsx
│   │   │   ├── quality/
│   │   │   │   └── QualityDetection.tsx
│   │   │   ├── spectrum/
│   │   │   │   ├── SpectrumAnalyzer.tsx
│   │   │   │   ├── SpectrogramHeatmap.tsx
│   │   │   │   └── FrequencyDistribution.tsx
│   │   │   ├── waveform/
│   │   │   │   └── WaveformDisplay.tsx
│   │   │   ├── channel/
│   │   │   │   ├── ChannelAnalysis.tsx
│   │   │   │   ├── PhaseCorrelation.tsx
│   │   │   │   └── MidSideSpectrum.tsx
│   │   │   └── audioinfo/
│   │   │       └── AudioInfo.tsx
│   │   ├── hooks/
│   │   │   └── useAudioContext.ts  # Web Audio API hook
│   │   ├── types/
│   │   │   └── analysis.ts     # TypeScript interfaces
│   │   ├── theme/
│   │   │   └── colors.ts       # Theme color constants
│   │   └── styles/
│   │       └── globals.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   ├── designs/
│   │   └── 2026-07-01-music-analyzer-design.md
│   └── plans/
│       └── 2026-07-01-music-analyzer-impl.md
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## 9. .gitignore

```
# Python
__pycache__/
*.pyc
*.pyo
.eggs/
*.egg-info/
dist/
build/
.venv/

# Node
node_modules/
dist/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Claude AI
.claude
claude_desktop_config.json
CLAUDE.md

# Temp audio files
backend/tmp/
```

## 10. Software Engineering Workflow

### 10.1 Branch Strategy

- `main` — stable releases, always deployable
- `develop` — integration branch for features
- `feature/<issue-number>-<short-name>` — feature branches
- `fix/<issue-number>-<short-name>` — bug fix branches

### 10.2 Development Cycle

1. Create GitHub Issue (feature/bug)
2. Branch from `develop`
3. Develop with tests
4. Open PR to `develop`
5. CI checks pass (lint, test, build)
6. Code review
7. Merge to `develop`
8. Periodic release: `develop` → `main` with version tag

### 10.3 CI/CD (GitHub Actions)

- **On PR**: lint (eslint + flake8), test (pytest + vitest), build check
- **On tag**: create GitHub Release with artifacts

### 10.4 Versioning

Semantic Versioning: `MAJOR.MINOR.PATCH`

## 11. Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid file format | Return 400 with supported format list |
| File > 5GB | Return 413 with size limit message |
| Corrupted audio file | Return 500 with "file may be corrupted" message |
| ffprobe/librosa failure | Catch per-module, return partial results with warnings |
| Network timeout | Frontend shows retry button after 30s |

## 12. Testing Strategy

- **Unit tests**: Each analyzer module tested independently with known audio fixtures
- **Integration tests**: API endpoint tests with sample files
- **Frontend tests**: Component tests for key UI elements
- **Test fixtures**: Small audio files (WAV, MP3, FLAC) in `backend/tests/fixtures/`
