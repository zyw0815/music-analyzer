# 🎵 音质分析器 | Music Analyzer

专业级音频质量分析工具，支持多种音频格式的多维度分析。

## 功能特性

- 🎵 **内置播放器** — 波形可视化播放
- 📊 **质量检测** — 7 维度综合评分
- 📈 **频谱分析** — 实时频谱、频谱热力图、频率分布
- 🔊 **波形显示** — 高分辨率可缩放波形
- 🔀 **声道分析** — L/R 分离、相位相关、Mid/Side 分析
- ℹ️ **音频信息** — 完整技术元数据

## 支持格式

MP3, WAV, FLAC, AAC, OGG, AIFF, WMA, M4A, APE, OPUS, DSF, DFF (DSD)

## 快速开始

### 环境要求

- Python 3.9+ (Anaconda recommended)
- Node.js 18+
- ffmpeg

### 后端

```bash
# 创建 conda 环境（首次运行）
conda env create -f backend/environment.yml
```

```bash
# 激活 conda 环境
conda activate music-analyzer

# 启动后端
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 9220
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:9211

## 技术栈

- **后端**: Python, FastAPI, librosa, mutagen, numpy, scipy
- **前端**: React, TypeScript, ECharts, Tailwind CSS, Vite

## 常见问题

### 端口被占用

如果启动时提示 `address already in use`，说明端口被其他程序占用，执行以下命令释放：

```bash
# 释放后端端口 9220
lsof -i :9220 -t | xargs kill

# 释放前端端口 9211
lsof -i :9211 -t | xargs kill
```

释放后重新启动服务即可。

## License

MIT
