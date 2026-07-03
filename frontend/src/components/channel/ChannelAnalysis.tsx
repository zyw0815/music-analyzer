import ResponsiveChart from '../ResponsiveChart'
import type { ChannelResponse } from '../../types/analysis'
import PhaseCorrelation from './PhaseCorrelation'
import MidSideSpectrum from './MidSideSpectrum'
import { cssVar } from '../../theme/cssVars'

interface ChannelAnalysisProps {
  channel: ChannelResponse
}

export default function ChannelAnalysis({ channel }: ChannelAnalysisProps) {
  const { left_spectrum, right_spectrum, channel_balance_db, stereo_width, is_mono, phase_correlation } = channel
  const text = cssVar('--text', '#edf3fb')
  const muted = cssVar('--text-muted', '#98a6b8')
  const border = cssVar('--border', '#2a3545')
  const grid = cssVar('--chart-grid', '#223044')
  const tooltip = cssVar('--chart-tooltip', '#151d28')
  const accent = cssVar('--accent', '#4f8cff')
  const orange = cssVar('--orange', '#ed8f38')

  // L/R spectrum overlay
  const lrOption = {
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
      data: ['左声道', '右声道'],
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
        name: '左声道',
        type: 'line',
        data: left_spectrum.frequencies.map((f, i) => [f, left_spectrum.magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: accent, width: 2 },
      },
      {
        name: '右声道',
        type: 'line',
        data: right_spectrum.frequencies.map((f, i) => [f, right_spectrum.magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: orange, width: 2 },
      },
    ],
  }

  // Balance indicator bar
  const balancePercent = Math.min(Math.max((channel_balance_db + 6) / 12, 0), 1) * 100

  return (
    <div className="flex flex-col gap-5">
      <div className="surface rounded-lg p-5">
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>声道分析</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          对比左右声道的频率响应。蓝线=左声道，橙线=右声道。两条线越接近说明声道越平衡。
        </p>
        {is_mono && (
          <div className="mb-3 px-3 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--warning)', border: '1px solid var(--border)' }}>
            此文件为单声道
          </div>
        )}
        <ResponsiveChart option={lrOption} height={300} />

        {/* Channel balance indicator */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>左声道</span>
            <span>声道平衡: {channel_balance_db.toFixed(1)} dB</span>
            <span>右声道</span>
          </div>
          <div className="meter-track relative h-2 rounded-full overflow-hidden">
            <div
              className="absolute top-0 h-full rounded-full"
              style={{
                left: `${Math.min(balancePercent, 50)}%`,
                width: `${Math.abs(balancePercent - 50)}%`,
                backgroundColor: 'var(--accent)',
              }}
            />
            <div className="absolute top-0 left-1/2 w-0.5 h-full" style={{ backgroundColor: 'var(--text)', transform: 'translateX(-50%)' }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span className="rounded px-3 py-1" style={{ backgroundColor: 'var(--bg-muted)' }}>立体声宽度: <strong style={{ color: 'var(--text)' }}>{(stereo_width * 100).toFixed(0)}%</strong></span>
          <span className="rounded px-3 py-1" style={{ backgroundColor: 'var(--bg-muted)' }}>相位相关: <strong style={{ color: 'var(--text)' }}>{phase_correlation.toFixed(3)}</strong></span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(330px,0.9fr)_minmax(420px,1.1fr)] items-stretch">
        <div>
          <PhaseCorrelation correlation={phase_correlation} />
        </div>
        <div>
          <MidSideSpectrum mid={channel.mid_spectrum} side={channel.side_spectrum} />
        </div>
      </div>
    </div>
  )
}
