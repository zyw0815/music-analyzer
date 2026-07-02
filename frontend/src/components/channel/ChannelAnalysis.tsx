import ResponsiveChart from '../ResponsiveChart'
import type { ChannelResponse } from '../../types/analysis'
import PhaseCorrelation from './PhaseCorrelation'
import MidSideSpectrum from './MidSideSpectrum'

interface ChannelAnalysisProps {
  channel: ChannelResponse
}

export default function ChannelAnalysis({ channel }: ChannelAnalysisProps) {
  const { left_spectrum, right_spectrum, channel_balance_db, stereo_width, is_mono, phase_correlation } = channel

  // L/R spectrum overlay
  const lrOption = {
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
      data: ['左声道', '右声道'],
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
        name: '左声道',
        type: 'line',
        data: left_spectrum.frequencies.map((f, i) => [f, left_spectrum.magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#58a6ff', width: 2 },
      },
      {
        name: '右声道',
        type: 'line',
        data: right_spectrum.frequencies.map((f, i) => [f, right_spectrum.magnitude_db[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#f0883e', width: 2 },
      },
    ],
  }

  // Balance indicator bar
  const balancePercent = Math.min(Math.max((channel_balance_db + 6) / 12, 0), 1) * 100

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg p-5" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
        <h3 className="text-base font-semibold mb-3" style={{ color: '#e6edf3' }}>声道分析</h3>
        {is_mono && (
          <div className="mb-3 px-3 py-2 rounded text-sm" style={{ backgroundColor: '#0d1117', color: '#d29922', border: '1px solid #30363d' }}>
            此文件为单声道
          </div>
        )}
        <ResponsiveChart option={lrOption} height={300} />

        {/* Channel balance indicator */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#8b949e' }}>
            <span>左声道</span>
            <span>声道平衡: {channel_balance_db.toFixed(1)} dB</span>
            <span>右声道</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#30363d' }}>
            <div
              className="absolute top-0 h-full rounded-full"
              style={{
                left: `${Math.min(balancePercent, 50)}%`,
                width: `${Math.abs(balancePercent - 50)}%`,
                backgroundColor: '#58a6ff',
              }}
            />
            <div className="absolute top-0 left-1/2 w-0.5 h-full" style={{ backgroundColor: '#e6edf3', transform: 'translateX(-50%)' }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-4 text-sm" style={{ color: '#8b949e' }}>
          <span>立体声宽度: <strong style={{ color: '#e6edf3' }}>{(stereo_width * 100).toFixed(0)}%</strong></span>
          <span>相位相关: <strong style={{ color: '#e6edf3' }}>{phase_correlation.toFixed(3)}</strong></span>
        </div>
      </div>

      <div className="flex gap-5 flex-col lg:flex-row">
        <div className="flex-1">
          <PhaseCorrelation correlation={phase_correlation} />
        </div>
        <div className="flex-1">
          <MidSideSpectrum mid={channel.mid_spectrum} side={channel.side_spectrum} />
        </div>
      </div>
    </div>
  )
}
