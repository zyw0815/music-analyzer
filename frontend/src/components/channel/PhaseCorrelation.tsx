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
  const label = getPhaseLabel(correlation)
  const hint = getPhaseHint(correlation)
  const normalized = Math.round(((correlation + 1) / 2) * 100)

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
          itemStyle: { color: chartColor },
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.5, cssVar('--danger', '#e8564f')],
              [0.75, cssVar('--warning', '#d49b23')],
              [1, cssVar('--success', '#2fbf71')],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: {
          show: true,
          length: 8,
          lineStyle: { color: cssVar('--border', '#2a3545'), width: 2 },
          distance: 12,
        },
        axisLabel: {
          color: cssVar('--text-muted', '#98a6b8'),
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
          color: chartColor,
          offsetCenter: [0, '20%'],
          formatter: () => label,
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

      <div className="grid gap-4 md:grid-cols-[1fr_0.85fr] lg:grid-cols-1 xl:grid-cols-[1fr_0.85fr]">
        <div>
          <ResponsiveChart option={option} height={176} />
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-soft)' }}>
            <span>-1</span>
            <span>0</span>
            <span>+1</span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div>
            <div className="text-3xl font-bold tabular-nums" style={{ color }}>{correlation.toFixed(3)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</div>
          </div>
          <div className="flex h-16 items-end gap-1 rounded p-2" style={{ backgroundColor: 'var(--bg-muted)' }}>
            {Array.from({ length: 18 }, (_, index) => {
              const distance = Math.abs(index - normalized / 100 * 17)
              const height = Math.max(16, 58 - distance * 8)
              return (
                <span
                  key={index}
                  className="phase-bar flex-1 rounded-sm"
                  style={{
                    height,
                    backgroundColor: color,
                    animationDelay: `${index * 45}ms`,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
