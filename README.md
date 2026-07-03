<div align="center">

# Music Analyzer

本地运行的专业音频质量分析工具，面向有损、无损和 DSD 音乐文件。

![release](https://img.shields.io/badge/release-v2.0.1-blue)
![python](https://img.shields.io/badge/python-3.9%2B-3776AB)
![node](https://img.shields.io/badge/node-18%2B-339933)
![ffmpeg](https://img.shields.io/badge/ffmpeg-required-007808)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

[功能](#功能) · [环境要求](#环境要求) · [快速开始](#快速开始) · [清理缓存](#清理缓存) · [常见问题](#常见问题)

</div>

---

## 简介

Music Analyzer 是一个本地 Web 应用，用来检查音频文件的技术信息和声音质量。后端使用 FastAPI，前端使用 React/ECharts，重点覆盖播放、元数据、波形、频谱、声道表现和综合质量评分。

支持格式：

`MP3`, `WAV`, `FLAC`, `AAC`, `OGG`, `AIFF`, `WMA`, `M4A`, `APE`, `OPUS`, `DSF`, `DFF`

## 功能

- 内置播放器：通过后端转 WAV 流，支持浏览器播放。
- 音频信息：文件属性、标签、响度、DSD 信息、MD5、时长、采样率、位深、声道和码率。
- 质量检测：码率、完整度、频谱质量、动态范围、失真、声道、综合质量检测评分。
- 频谱分析：频谱曲线、声谱图热力图、频段能量分布。
- 波形显示：降采样波形、RMS 包络、削波区域、静音区域。
- 声道分析：相位相关、立体声宽度、声道平衡、L/R 频谱、Mid/Side 频谱。
- 明暗主题切换。
- 支持最大 5 GB 文件上传。

## 环境要求

### Python

推荐使用 Anaconda 或 Miniconda。

项目当前使用 Python 3.11 测试，理论支持 Python 3.9+。

检查 Python 版本：

```bash
python --version
```

安装 Miniconda：

- macOS/Linux: https://docs.conda.io/en/latest/miniconda.html
- Windows: https://docs.conda.io/en/latest/miniconda.html

### Node.js

前端需要 Node.js 18+。

检查 Node.js 版本：

```bash
node --version
npm --version
```

安装方式：

```bash
# macOS with Homebrew
brew install node
```

```bash
# Windows with winget
winget install OpenJS.NodeJS.LTS
```

```bash
# Linux example with NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### ffmpeg

ffmpeg 用于音频转码，以及 DSF/DFF 等 DSD 文件的播放和分析支持。

检查 ffmpeg：

```bash
ffmpeg -version
```

安装方式：

```bash
# macOS with Homebrew
brew install ffmpeg
```

```bash
# Windows with winget
winget install Gyan.FFmpeg
```

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ffmpeg
```

如果使用项目提供的 Conda 环境，`backend/environment.yml` 会安装 ffmpeg。

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/zyw0815/music-analyzer.git
cd music-analyzer
```

### 2. 创建后端 Conda 环境

```bash
conda env create -f backend/environment.yml
conda activate music-analyzer
```

如果环境已经存在，但依赖发生变化：

```bash
conda env update -f backend/environment.yml --prune
conda activate music-analyzer
```

检查后端工具：

```bash
python --version
ffmpeg -version
```

### 3. 安装前端依赖

```bash
cd frontend
npm install
cd ..
```

### 4. 启动后端

打开一个终端：

```bash
conda activate music-analyzer
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 9220
```

检查后端健康状态：

```bash
curl http://localhost:9220/api/health
```

期望返回：

```json
{"status":"ok","version":"2.0.1"}
```

### 5. 启动前端

再打开一个终端：

```bash
cd frontend
npm run dev
```

浏览器打开：

```text
http://localhost:9211
```

## 开发命令

后端测试：

```bash
cd backend
conda activate music-analyzer
python -m pytest
```

前端 lint：

```bash
cd frontend
npm run lint
```

前端生产构建：

```bash
cd frontend
npm run build
```

预览生产构建：

```bash
cd frontend
npm run preview
```

## 清理缓存

上传文件和转码后的临时音频会写入：

```text
backend/tmp/
```

该目录已被 Git 忽略。只要后端当前没有正在分析文件，就可以安全清理。

清理临时音频：

```bash
find backend/tmp -mindepth 1 -delete
```

查看 tmp 目录大小：

```bash
du -sh backend/tmp
```

项目也会忽略本地系统、编辑器和 AI 助手产生的文件，例如：

```text
.DS_Store
.claude/
.codex/
.agents/
```

## 常见问题

### 端口被占用

后端端口：

```bash
lsof -i :9220 -t | xargs kill
```

前端端口：

```bash
lsof -i :9211 -t | xargs kill
```

### Conda 环境已经存在

不用删除重建，直接更新：

```bash
conda env update -f backend/environment.yml --prune
```

### 找不到 ffmpeg

确认当前 shell 能找到 ffmpeg：

```bash
which ffmpeg
ffmpeg -version
```

如果 ffmpeg 是通过 Conda 环境安装的：

```bash
conda activate music-analyzer
which ffmpeg
```

### DSD 文件分析失败

DSF/DFF 文件需要 ffmpeg 支持 DSD 解码。检查解码器：

```bash
ffmpeg -hide_banner -decoders | grep -i dsd
```

正常情况下应该能看到 `dsd_lsbf`、`dsd_msbf` 或相关 DSD decoder。

### 上传很快但分析很慢

上传只负责把原始文件写入磁盘。分析阶段会解码音频并计算波形、频谱、响度、削波、静音和声道特征。大型 FLAC/DSD 文件会占用更多 CPU 和内存，耗时也会更长。

## 项目结构

```text
music-analyzer/
├── backend/
│   ├── app/
│   │   ├── analyzers/
│   │   ├── api/
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   └── environment.yml
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── styles/
│   │   └── types/
│   └── package.json
├── docs/
└── README.md
```

## 技术栈

- 后端：Python, FastAPI, librosa, mutagen, NumPy, SciPy, ffmpeg
- 前端：React, TypeScript, ECharts, Tailwind CSS, Vite
- 测试：pytest, pytest-asyncio, oxlint, TypeScript build

## License

MIT
