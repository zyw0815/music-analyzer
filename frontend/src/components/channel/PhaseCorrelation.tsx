import ResponsiveChart from '../ResponsiveChart'
interface PhaseCorrelationProps {
  correlation: number
}

function getPhaseLabel(value: number): string {
  if (value > 0.5) return '正相'
  if (value < 0) return '反相'
  return '不相关'
}

function getPhaseColor(value: number): string {
  if (value > 0.5) return '#3fb950'
  if (value < 0) return '#f85149'
  return '#d29922'
}

export default function PhaseCorrelation({ correlation }: PhaseCorrelationProps) {
  const color = getPhaseColor(correlation)
  const label = getPhaseLabel(correlation)

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: -1,
        max: 1,
        radius: '90%',
        progress: {
          show: true,
          width: 12,
          roundCap: true,
          itemStyle: { color },
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.5, '#f85149'],
              [0.75, '#d29922'],
              [1, '#3fb950'],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: {
          show: true,
          length: 8,
          lineStyle: { color: '#30363d', width: 2 },
          distance: 12,
        },
        axisLabel: {
          color: '#8b949e',
          distance: 20,
          fontSize: 11,
          formatter: (v: number) => {
            if (v === -1) return '-1'
            if (v === 0) return '0'
            if (v === 1) return '+1'
            return ''
          },
        },
        pointer: { show: false },
        detail: {
          fontSize: 20,
          fontWeight: 'bold',
          color,
          offsetCenter: [0, '20%'],
          formatter: () => label,
        },
        data: [{ value: correlation }],
      },
    ],
  }

  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#e6edf3' }}>相位相关</h3>
      <ResponsiveChart option={option} height={180} />
      <div className="text-center text-sm" style={{ color: '#8b949e' }}>
        值: {correlation.toFixed(3)}
      </div>
    </div>
  )
}
