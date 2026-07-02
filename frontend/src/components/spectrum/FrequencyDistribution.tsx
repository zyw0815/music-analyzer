import ResponsiveChart from '../ResponsiveChart'
import type { FrequencyDistribution } from '../../types/analysis'
import { cssVar } from '../../theme/cssVars'

interface FrequencyDistributionProps {
  distribution: FrequencyDistribution
}

const BAND_COLORS = ['#0c1445', '#2563eb', '#58a6ff', '#f59e0b', '#e6edf3']

export default function FrequencyDistributionChart({ distribution }: FrequencyDistributionProps) {
  if (!distribution || !distribution.bands || !distribution.energy_db) {
    console.error('FrequencyDistribution: invalid data', distribution)
    return <div className="surface rounded-lg p-5" style={{ color: 'var(--danger)' }}>
      频率分布数据加载失败
    </div>
  }

  const text = cssVar('--text', '#edf3fb')
  const muted = cssVar('--text-muted', '#98a6b8')
  const border = cssVar('--border', '#2a3545')
  const grid = cssVar('--chart-grid', '#223044')
  const tooltip = cssVar('--chart-tooltip', '#151d28')

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: tooltip,
      borderColor: border,
      textStyle: { color: text, fontSize: 12 },
      formatter: (params: Array<{ name: string; value: number; marker: string }>) => {
        const p = params[0]
        return `${p.marker} ${p.name}<br/>能量: ${p.value.toFixed(1)} dB`
      },
    },
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 40,
    },
    xAxis: {
      type: 'category' as const,
      data: distribution.bands,
      axisLabel: { color: muted, fontSize: 11 },
      axisLine: { lineStyle: { color: border } },
    },
    yAxis: {
      type: 'value' as const,
      name: '能量 (dB)',
      nameTextStyle: { color: muted },
      axisLabel: { color: muted },
      axisLine: { lineStyle: { color: border } },
      splitLine: { lineStyle: { color: grid } },
    },
    series: [
      {
        type: 'bar',
        data: distribution.energy_db.map((val, i) => ({
          value: val,
          itemStyle: { color: BAND_COLORS[i % BAND_COLORS.length] },
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'top' as const,
          color: muted,
          fontSize: 11,
          formatter: (p: { value: number }) => `${p.value.toFixed(1)}`,
        },
      },
    ],
  }

  return (
    <div className="surface rounded-lg p-5">
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>频率分布</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        5 个频段的能量分布：<strong>20-60Hz</strong> 超低音（震感）、<strong>60-250Hz</strong> 低音（贝斯/鼓）、<strong>250-2kHz</strong> 中音（人声/乐器）、<strong>2k-6kHz</strong> 中高音（清晰度）、<strong>6k-20kHz</strong> 高音（空气感/细节）。
      </p>
      <ResponsiveChart option={option} height={280} />
    </div>
  )
}
