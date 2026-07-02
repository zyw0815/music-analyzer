import ReactECharts from 'echarts-for-react'

interface ResponsiveChartProps {
  option: Record<string, unknown>
  height?: number
  width?: number | string
}

export default function ResponsiveChart({ option, height = 350, width = '100%' }: ResponsiveChartProps) {
  return (
    <ReactECharts
      option={option}
      style={{ width, height }}
      onChartReady={(chart) => {
        setTimeout(() => chart.resize(), 0)
      }}
    />
  )
}
