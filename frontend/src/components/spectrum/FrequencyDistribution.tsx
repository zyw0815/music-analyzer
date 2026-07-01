import ReactECharts from 'echarts-for-react'
import type { FrequencyDistribution } from '../../types/analysis'

interface FrequencyDistributionProps {
  distribution: FrequencyDistribution
}

const BAND_COLORS = ['#0c1445', '#2563eb', '#58a6ff', '#f59e0b', '#e6edf3']

export default function FrequencyDistributionChart({ distribution }: FrequencyDistributionProps) {
  if (!distribution || !distribution.bands || !distribution.energy_db) {
    console.error('FrequencyDistribution: invalid data', distribution)
    return <div className="rounded-lg p-5" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', color: '#f85149' }}>
      频率分布数据加载失败
    </div>
  }

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#1c2128',
      borderColor: '#30363d',
      textStyle: { color: '#e6edf3', fontSize: 12 },
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
      axisLabel: { color: '#8b949e', fontSize: 11 },
      axisLine: { lineStyle: { color: '#30363d' } },
    },
    yAxis: {
      type: 'value' as const,
      name: '能量 (dB)',
      nameTextStyle: { color: '#8b949e' },
      axisLabel: { color: '#8b949e' },
      axisLine: { lineStyle: { color: '#30363d' } },
      splitLine: { lineStyle: { color: '#21262d' } },
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
          color: '#8b949e',
          fontSize: 11,
          formatter: (p: { value: number }) => `${p.value.toFixed(1)}`,
        },
      },
    ],
  }

  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
      <h3 className="text-base font-semibold mb-3" style={{ color: '#e6edf3' }}>频率分布</h3>
      <ReactECharts option={option} style={{ height: 280 }} />
    </div>
  )
}
