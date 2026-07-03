import { useEffect, useRef } from 'react'
import type { ECharts } from 'echarts/core'
import * as echarts from 'echarts/core'
import { BarChart, GaugeChart, HeatmapChart, LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
])

interface ResponsiveChartProps {
  option: Record<string, unknown>
  height?: number
  width?: number | string
}

export default function ResponsiveChart({ option, height = 350, width = '100%' }: ResponsiveChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = echarts.init(containerRef.current, null, { renderer: 'canvas' })
    chartRef.current = chart
    const observer = new ResizeObserver(() => {
      chart.resize()
    })
    observer.observe(containerRef.current)
    chart.resize()

    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  return (
    <div ref={containerRef} style={{ width, height }} />
  )
}
