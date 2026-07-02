import ResponsiveChart from '../ResponsiveChart'
import type { SpectrumData } from '../../types/analysis'
import { cssVar } from '../../theme/cssVars'

interface SpectrumAnalyzerProps {
  spectrum: SpectrumData
}

export default function SpectrumAnalyzer({ spectrum }: SpectrumAnalyzerProps) {
  if (!spectrum || !spectrum.frequencies || !spectrum.magnitude_db) {
    console.error('SpectrumAnalyzer: invalid data', spectrum)
    return <div className="surface rounded-lg p-5" style={{ color: 'var(--danger)' }}>
      频谱数据加载失败
    </div>
  }

  const { frequencies, magnitude_db, peak_hold_db } = spectrum
  const text = cssVar('--text', '#edf3fb')
  const muted = cssVar('--text-muted', '#98a6b8')
  const border = cssVar('--border', '#2a3545')
  const grid = cssVar('--chart-grid', '#223044')
  const tooltip = cssVar('--chart-tooltip', '#151d28')
  const accent = cssVar('--accent', '#4f8cff')

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: tooltip,
      borderColor: border,
      textStyle: { color: text, fontSize: 12 },
      formatter: (params: Array<{ seriesName: string; value: [number, number]; marker: string }>) => {
        const freq = params[0]?.value[0]
        const lines = params
          .map((p) => `${p.marker} ${p.seriesName}: ${p.value[1].toFixed(1)} dB`)
          .join('<br/>')
        return `<strong>${freq >= 1000 ? (freq / 1000).toFixed(1) + ' kHz' : freq + ' Hz'}</strong><br/>${lines}`
      },
    },
    grid: {
      left: 60,
      right: 20,
      top: 20,
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
        name: '平均幅度',
        type: 'line',
        data: frequencies.map((f, i) => [f, magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: accent, width: 2 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79,140,255,0.3)' },
              { offset: 1, color: 'rgba(79,140,255,0.02)' },
            ],
          },
        },
      },
      ...(peak_hold_db
        ? [
            {
              name: '峰值保持',
              type: 'line',
              data: frequencies.map((f, i) => [f, peak_hold_db[i]]),
              smooth: true,
              symbol: 'none',
              lineStyle: { color: accent, width: 1, opacity: 0.4 },
            },
          ]
        : []),
    ],
  }

  return (
    <div className="surface rounded-lg p-5">
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>频谱分析</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        显示各频率的音量大小。横轴是频率（低音→高音），纵轴是音量。曲线越高说明该频率越响，高频区域丰富则声音明亮，缺失则沉闷。
      </p>
      <ResponsiveChart option={option} height={350} />
    </div>
  )
}
