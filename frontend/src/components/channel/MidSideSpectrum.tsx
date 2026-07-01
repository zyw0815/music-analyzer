import ReactECharts from 'echarts-for-react'
import type { ChannelSpectrum } from '../../types/analysis'

interface MidSideSpectrumProps {
  mid: ChannelSpectrum
  side: ChannelSpectrum
}

export default function MidSideSpectrum({ mid, side }: MidSideSpectrumProps) {
  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#1c2128',
      borderColor: '#30363d',
      textStyle: { color: '#e6edf3', fontSize: 12 },
      formatter: (params: Array<{ seriesName: string; value: [number, number]; marker: string }>) => {
        const freq = params[0]?.value[0]
        const freqStr = freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${freq} Hz`
        const lines = params
          .map((p) => `${p.marker} ${p.seriesName}: ${p.value[1].toFixed(1)} dB`)
          .join('<br/>')
        return `<strong>${freqStr}</strong><br/>${lines}`
      },
    },
    legend: {
      data: ['Mid', 'Side'],
      textStyle: { color: '#8b949e' },
      top: 0,
    },
    grid: {
      left: 60,
      right: 20,
      top: 30,
      bottom: 40,
    },
    xAxis: {
      type: 'log' as const,
      name: '频率',
      nameTextStyle: { color: '#8b949e' },
      min: 20,
      max: 20000,
      axisLabel: {
        color: '#8b949e',
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
      axisLine: { lineStyle: { color: '#30363d' } },
      splitLine: { lineStyle: { color: '#21262d' } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'dB',
      nameTextStyle: { color: '#8b949e' },
      min: -90,
      max: 0,
      axisLabel: { color: '#8b949e' },
      axisLine: { lineStyle: { color: '#30363d' } },
      splitLine: { lineStyle: { color: '#21262d' } },
    },
    series: [
      {
        name: 'Mid',
        type: 'line',
        data: mid.frequencies.map((f, i) => [f, mid.magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#58a6ff', width: 2 },
      },
      {
        name: 'Side',
        type: 'line',
        data: side.frequencies.map((f, i) => [f, side.magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#f0883e', width: 2 },
      },
    ],
  }

  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
      <h3 className="text-base font-semibold mb-3" style={{ color: '#e6edf3' }}>Mid/Side 频谱</h3>
      <ReactECharts option={option} style={{ width: '100%', height: 300 }} />
    </div>
  )
}
