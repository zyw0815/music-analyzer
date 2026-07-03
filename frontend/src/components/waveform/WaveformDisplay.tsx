import ResponsiveChart from '../ResponsiveChart'
import type { WaveformResponse } from '../../types/analysis'
import { cssVar } from '../../theme/cssVars'

interface WaveformDisplayProps {
  waveform: WaveformResponse
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function WaveformDisplay({ waveform }: WaveformDisplayProps) {
  const { waveform: wave, rms_envelope, clipping_regions, silence_regions } = waveform
  const text = cssVar('--text', '#edf3fb')
  const muted = cssVar('--text-muted', '#98a6b8')
  const border = cssVar('--border', '#2a3545')
  const grid = cssVar('--chart-grid', '#223044')
  const tooltip = cssVar('--chart-tooltip', '#151d28')
  const accent = cssVar('--accent', '#4f8cff')
  const danger = cssVar('--danger', '#e8564f')

  // Downsample waveform to max 5000 points to prevent browser crash
  const MAX_POINTS = 5000
  const step = Math.max(1, Math.floor(wave.samples.length / MAX_POINTS))
  const dTimes = wave.times.filter((_, i) => i % step === 0)
  const dSamples = wave.samples.filter((_, i) => i % step === 0)

  // Downsample RMS envelope similarly
  const rmsStep = Math.max(1, Math.floor(rms_envelope.values.length / MAX_POINTS))
  const dRmsTimes = rms_envelope.times.filter((_, i) => i % rmsStep === 0)
  const dRmsValues = rms_envelope.values.filter((_, i) => i % rmsStep === 0)

  // Build markArea data for clipping and silence regions
  const markAreaData: Array<[{ xAxis: number; itemStyle: { color: string } }, { xAxis: number }]> = []

  for (const region of clipping_regions) {
    markAreaData.push([
      { xAxis: region.start, itemStyle: { color: 'rgba(248,81,73,0.15)' } },
      { xAxis: region.end },
    ])
  }
  for (const region of silence_regions) {
    markAreaData.push([
      { xAxis: region.start, itemStyle: { color: 'rgba(139,148,158,0.1)' } },
      { xAxis: region.end },
    ])
  }

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: tooltip,
      borderColor: border,
      textStyle: { color: text, fontSize: 12 },
      formatter: (params: Array<{ seriesName: string; value: [number, number]; marker: string }>) => {
        const time = params[0]?.value[0]
        const timeStr = formatTime(time)
        const lines = params
          .filter((p) => p.value[1] !== undefined)
          .map((p) => `${p.marker} ${p.seriesName}: ${p.value[1].toFixed(3)}`)
          .join('<br/>')
        return `<strong>${timeStr}</strong><br/>${lines}`
      },
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 60,
    },
    xAxis: {
      type: 'value' as const,
      name: '时间',
      nameTextStyle: { color: muted },
      min: 0,
      max: dTimes[dTimes.length - 1] || 0,
      axisLabel: {
        color: muted,
        formatter: (v: number) => formatTime(v),
      },
      axisLine: { lineStyle: { color: border } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      name: '振幅',
      nameTextStyle: { color: muted },
      min: -1,
      max: 1,
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: border } },
      splitLine: { lineStyle: { color: grid } },
    },
    dataZoom: [
      {
        type: 'inside' as const,
        xAxisIndex: 0,
        filterMode: 'none',
      },
      {
        type: 'slider' as const,
        xAxisIndex: 0,
        height: 20,
        bottom: 5,
        borderColor: border,
        backgroundColor: cssVar('--bg-muted', '#0f1620'),
        fillerColor: 'rgba(79,140,255,0.15)',
        handleStyle: { color: accent },
        textStyle: { color: muted },
      },
    ],
    series: [
      {
        name: '波形',
        type: 'line',
        data: dTimes.map((t, i) => [t, dSamples[i]]),
        smooth: false,
        symbol: 'none',
        lineStyle: { color: accent, width: 1 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(88,166,255,0.25)' },
              { offset: 0.5, color: 'rgba(88,166,255,0.05)' },
              { offset: 1, color: 'rgba(88,166,255,0.25)' },
            ],
          },
        },
        ...(markAreaData.length > 0
          ? { markArea: { silent: true, data: markAreaData } }
          : {}),
      },
      {
        name: 'RMS 包络',
        type: 'line',
        data: dRmsTimes.map((t, i) => [t, dRmsValues[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: danger, width: 1 },
      },
      {
        name: 'RMS 包络 (反)',
        type: 'line',
        data: dRmsTimes.map((t, i) => [t, -dRmsValues[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: danger, width: 1 },
      },
    ],
  }

  return (
    <div className="surface rounded-lg p-5">
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>波形显示</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        显示音频信号的振幅随时间的变化。波形越高表示音量越大。红色包络线表示整体音量趋势。<span style={{ color: 'var(--danger)' }}>红色区域</span>是削波（音量过大导致失真），<span style={{ color: 'var(--text-muted)' }}>灰色区域</span>是静音段。
      </p>
      <ResponsiveChart option={option} height={350} />
      <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span><span className="inline-block w-3 h-0.5 mr-1" style={{ backgroundColor: 'var(--accent)' }} />波形</span>
        <span><span className="inline-block w-3 h-0.5 mr-1" style={{ backgroundColor: 'var(--danger)' }} />RMS 包络</span>
        {clipping_regions.length > 0 && (
          <span><span className="inline-block w-3 h-3 mr-1 align-middle" style={{ backgroundColor: 'rgba(248,81,73,0.3)' }} />削波区域</span>
        )}
        {silence_regions.length > 0 && (
          <span><span className="inline-block w-3 h-3 mr-1 align-middle" style={{ backgroundColor: 'rgba(139,148,158,0.2)' }} />静音区域</span>
        )}
      </div>
    </div>
  )
}
