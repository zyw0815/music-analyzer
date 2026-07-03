import ResponsiveChart from '../ResponsiveChart'
import type { ChannelSpectrum } from '../../types/analysis'
import { cssVar } from '../../theme/cssVars'

interface MidSideSpectrumProps {
  mid: ChannelSpectrum
  side: ChannelSpectrum
}

export default function MidSideSpectrum({ mid, side }: MidSideSpectrumProps) {
  const text = cssVar('--text', '#edf3fb')
  const muted = cssVar('--text-muted', '#98a6b8')
  const border = cssVar('--border', '#2a3545')
  const grid = cssVar('--chart-grid', '#223044')
  const tooltip = cssVar('--chart-tooltip', '#151d28')
  const accent = cssVar('--accent', '#4f8cff')
  const orange = cssVar('--orange', '#ed8f38')

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: tooltip,
      borderColor: border,
      textStyle: { color: text, fontSize: 12 },
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
      textStyle: { color: muted },
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
      nameTextStyle: { color: muted },
      min: 20,
      max: 20000,
      axisLabel: {
        color: muted,
        formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`),
      },
      axisLine: { lineStyle: { color: border } },
      splitLine: { lineStyle: { color: grid } },
    },
    yAxis: {
      type: 'value' as const,
      name: 'dB',
      nameTextStyle: { color: muted },
      min: -90,
      max: 0,
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: border } },
      splitLine: { lineStyle: { color: grid } },
    },
    series: [
      {
        name: 'Mid',
        type: 'line',
        data: mid.frequencies.map((f, i) => [f, mid.magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: accent, width: 2 },
      },
      {
        name: 'Side',
        type: 'line',
        data: side.frequencies.map((f, i) => [f, side.magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: orange, width: 2 },
      },
    ],
  }

  return (
    <div className="surface h-full rounded-lg p-5">
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>Mid/Side 频谱</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        <strong>Mid</strong>=中间声音（人声、贝斯等居中元素），<strong>Side</strong>=立体声宽度（环境声、左右差异）。Side 越强立体声感越强。
      </p>
      <ResponsiveChart option={option} height={300} />
    </div>
  )
}
