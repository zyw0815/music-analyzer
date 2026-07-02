import { useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'

interface ResponsiveChartProps {
  option: Record<string, unknown>
  height?: number
  width?: number | string
}

export default function ResponsiveChart({ option, height = 350, width = '100%' }: ResponsiveChartProps) {
  const chartRef = useRef<ReactECharts>(null)

  useEffect(() => {
    const el = chartRef.current?.getEchartsInstance?.()
    if (!el) return
    const container = el.getDom()
    const observer = new ResizeObserver(() => {
      el.resize()
    })
    observer.observe(container)
    el.resize()
    return () => observer.disconnect()
  }, [])

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ width, height }}
      opts={{ renderer: 'canvas' }}
    />
  )
}
