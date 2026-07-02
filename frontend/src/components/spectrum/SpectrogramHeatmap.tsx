import ResponsiveChart from '../ResponsiveChart'
import type { SpectrogramData } from '../../types/analysis'

interface SpectrogramHeatmapProps {
  spectrogram: SpectrogramData
}

export default function SpectrogramHeatmap({ spectrogram }: SpectrogramHeatmapProps) {
  if (!spectrogram || !spectrogram.frequencies || !spectrogram.times || !spectrogram.magnitude_db) {
    console.error('SpectrogramHeatmap: invalid data', spectrogram)
    return <div className="rounded-lg p-5" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', color: '#f85149' }}>
      声谱图数据加载失败
    </div>
  }

  const { frequencies, times, magnitude_db } = spectrogram

  // Downsample to prevent browser crash (max ~40k data points)
  const MAX_TIME = 200
  const MAX_FREQ = 200
  const timeStep = Math.max(1, Math.floor(times.length / MAX_TIME))
  const freqStep = Math.max(1, Math.floor(frequencies.length / MAX_FREQ))
  const dTimes = times.filter((_, i) => i % timeStep === 0)
  const dFreqs = frequencies.filter((_, i) => i % freqStep === 0)

  const data: Array<[number, number, number]> = []
  for (let t = 0; t < dTimes.length; t++) {
    for (let f = 0; f < dFreqs.length; f++) {
      const origT = t * timeStep
      const origF = f * freqStep
      if (magnitude_db[origT] && magnitude_db[origT][origF] !== undefined) {
        data.push([t, f, magnitude_db[origT][origF]])
      }
    }
  }

  const option = {
    tooltip: {
      backgroundColor: '#1c2128',
      borderColor: '#30363d',
      textStyle: { color: '#e6edf3', fontSize: 12 },
      formatter: (params: { value: [number, number, number] }) => {
        const [tIdx, fIdx, db] = params.value
        const time = dTimes[tIdx]
        const freq = dFreqs[fIdx]
        const freqStr = freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${freq} Hz`
        const timeStr = `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`
        return `时间: ${timeStr}<br/>频率: ${freqStr}<br/>幅度: ${db.toFixed(1)} dB`
      },
    },
    grid: {
      left: 70,
      right: 40,
      top: 20,
      bottom: 40,
    },
    xAxis: {
      type: 'category' as const,
      data: dTimes.map((t) => {
        const min = Math.floor(t / 60)
        const sec = Math.floor(t % 60)
        return `${min}:${String(sec).padStart(2, '0')}`
      }),
      axisLabel: { color: '#8b949e', interval: Math.floor(dTimes.length / 10) },
      axisLine: { lineStyle: { color: '#30363d' } },
    },
    yAxis: {
      type: 'category' as const,
      data: dFreqs.map((f) => (f >= 1000 ? `${(f / 1000).toFixed(1)}k` : `${f}`)),
      axisLabel: { color: '#8b949e' },
      axisLine: { lineStyle: { color: '#30363d' } },
    },
    visualMap: {
      min: -90,
      max: 0,
      calculable: false,
      orient: 'vertical' as const,
      right: 0,
      top: 'center',
      inRange: {
        color: ['#0c1445', '#1a3a8a', '#2563eb', '#f59e0b', '#ef4444'],
      },
      textStyle: { color: '#8b949e' },
    },
    series: [
      {
        type: 'heatmap',
        data,
        emphasis: {
          itemStyle: { borderColor: '#e6edf3', borderWidth: 1 },
        },
      },
    ],
  }

  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#e6edf3' }}>声谱图</h3>
      <p className="text-xs mb-3" style={{ color: '#8b949e' }}>
        横轴是时间，纵轴是频率，颜色代表音量（蓝=轻，红=响）。可以直观看到音乐随时间的频率变化，例如鼓点在低频的规律脉冲。
      </p>
      <ResponsiveChart option={option} height={350} />
    </div>
  )
}
