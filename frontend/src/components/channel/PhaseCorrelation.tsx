import ResponsiveChart from '../ResponsiveChart'
import { cssVar } from '../../theme/cssVars'
interface PhaseCorrelationProps {
  correlation: number
}

function getPhaseLabel(value: number): string {
  if (value > 0.5) return '正相'
  if (value < 0) return '反相'
  return '不相关'
}

function getPhaseColor(value: number): string {
  if (value > 0.5) return 'var(--success)'
  if (value < 0) return 'var(--danger)'
  return 'var(--warning)'
}

function getPhaseHint(value: number): string {
  if (value > 0.8) return '左右声道高度一致，声音中心稳定。'
  if (value > 0.5) return '立体声关系健康，单声道兼容性较好。'
  if (value >= 0) return '声道差异较大，空间感更宽但中心可能较松。'
  return '存在反相风险，单声道播放时可能抵消。'
}

export default function PhaseCorrelation({ correlation }: PhaseCorrelationProps) {
  const color = getPhaseColor(correlation)
  const chartColor = cssVar(color, '#2fbf71')
  const danger = cssVar('--danger', '#e8564f')
  const warning = cssVar('--warning', '#d49b23')
  const success = cssVar('--success', '#2fbf71')
  const border = cssVar('--border', '#2a3545')
  const muted = cssVar('--text-muted', '#98a6b8')
  const label = getPhaseLabel(correlation)
  const hint = getPhaseHint(correlation)

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: -1,
        max: 1,
        radius: '66%',
        center: ['50%', '68%'],
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 10,
            color: [
              [0.5, danger],
              [0.75, warning],
              [1, success],
            ],
          },
        },
        progress: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: { show: false },
        data: [{ value: 1 }],
      },
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: -1,
        max: 1,
        radius: '88%',
        center: ['50%', '68%'],
        progress: {
          show: true,
          width: 16,
          roundCap: true,
          itemStyle: { color: chartColor },
        },
        axisLine: {
          lineStyle: {
            width: 16,
            color: [[1, 'rgba(128, 142, 162, 0.18)']],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
          fontSize: 24,
          fontWeight: 'bold',
          color: chartColor,
          offsetCenter: [0, '10%'],
          formatter: () => correlation.toFixed(3),
        },
        data: [{ value: correlation }],
      },
    ],
  }

  return (
    <div className="surface h-full rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>相位相关</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            +1=同相，0=差异大，-1=反相。
          </p>
        </div>
        <div className="rounded px-2 py-1 text-xs font-semibold" style={{ color, backgroundColor: 'var(--bg-muted)' }}>
          {label}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(230px,0.9fr)_1fr] lg:grid-cols-1 xl:grid-cols-[minmax(230px,0.9fr)_1fr]">
        <div className="flex flex-col justify-center">
          <ResponsiveChart option={option} height={220} />
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div>
            <div className="text-3xl font-bold" style={{ color }}>{label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</div>
          </div>
          <div className="grid gap-2 text-xs">
            <div className="flex items-center justify-between rounded px-3 py-2" style={{ backgroundColor: 'var(--bg-muted)', border: `1px solid ${border}` }}>
              <span className="flex items-center gap-2" style={{ color: muted }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: danger }} />-1 到 0</span>
              <span style={{ color: 'var(--text)' }}>反相风险</span>
            </div>
            <div className="flex items-center justify-between rounded px-3 py-2" style={{ backgroundColor: 'var(--bg-muted)', border: `1px solid ${border}` }}>
              <span className="flex items-center gap-2" style={{ color: muted }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: warning }} />0 到 0.5</span>
              <span style={{ color: 'var(--text)' }}>相关偏低</span>
            </div>
            <div className="flex items-center justify-between rounded px-3 py-2" style={{ backgroundColor: 'var(--bg-muted)', border: `1px solid ${border}` }}>
              <span className="flex items-center gap-2" style={{ color: muted }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: success }} />0.5 到 1</span>
              <span style={{ color: 'var(--text)' }}>关系健康</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
