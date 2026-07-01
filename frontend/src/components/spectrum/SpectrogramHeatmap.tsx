import ReactECharts from 'echarts-for-react'
import type { SpectrogramData } from '../../types/analysis'

interface SpectrogramHeatmapProps {
  spectrogram: SpectrogramData
}

export default function SpectrogramHeatmap({ spectrogram }: SpectrogramHeatmapProps) {
  const { frequencies, times, magnitude_db } = spectrogram

  // Flatten 2D array into [time_index, freq_index, value] for ECharts heatmap
  const data: Array<[number, number, number]> = []
  for (let t = 0; t < times.length; t++) {
    for (let f = 0; f < frequencies.length; f++) {
      if (magnitude_db[t] && magnitude_db[t][f] !== undefined) {
        data.push([t, f, magnitude_db[t][f]])
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
        const time = times[tIdx]
        const freq = frequencies[fIdx]
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
      data: times.map((t) => {
        const min = Math.floor(t / 60)
        const sec = Math.floor(t % 60)
        return `${min}:${String(sec).padStart(2, '0')}`
      }),
      axisLabel: { color: '#8b949e', interval: Math.floor(times.length / 10) },
      axisLine: { lineStyle: { color: '#30363d' } },
    },
    yAxis: {
      type: 'category' as const,
      data: frequencies.map((f) => (f >= 1000 ? `${(f / 1000).toFixed(1)}k` : `${f}`)),
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
      <h3 className="text-base font-semibold mb-3" style={{ color: '#e6edf3' }}>声谱图</h3>
      <ReactECharts option={option} style={{ height: 350 }} />
    </div>
  )
}
