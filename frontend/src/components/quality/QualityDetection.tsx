import { useState } from 'react'
import ResponsiveChart from '../ResponsiveChart'
import type { QualityResponse } from '../../types/analysis'
import { cssVar } from '../../theme/cssVars'

interface QualityDetectionProps {
  quality: QualityResponse
}

const SUB_SCORE_LABELS: Array<{ key: keyof QualityResponse['sub_scores']; label: string; tip: string }> = [
  { key: 'bitrate', label: '码率评分', tip: '码率越高，音频细节越丰富。320kbps 以上为高品质，128kbps 以下会有明显压缩感' },
  { key: 'integrity', label: '文件完整度', tip: '文件头、索引表、帧数据是否完整。损坏的文件可能出现爆音、卡顿或无法播放' },
  { key: 'quality_detection', label: '质量检测', tip: '检测削波（音量过大导致的失真）和噪声底水平。削波会产生刺耳的杂音' },
  { key: 'channel', label: '声道评分', tip: '左右声道的平衡度和立体声分离度。声道不平衡会导致声音偏向一侧' },
  { key: 'spectral', label: '频谱质量', tip: '高频保留程度。高频丰富则声音明亮通透，高频缺失则声音沉闷模糊' },
  { key: 'dynamic_range', label: '动态范围', tip: '最响和最轻声音的差距。动态范围大则音乐有起伏感，太小则声音扁平无层次' },
  { key: 'distortion', label: '失真程度', tip: '削波和噪声导致的失真程度。失真越低，声音越干净自然' },
]

function gradeColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return 'var(--warning)'
  if (score >= 40) return 'var(--orange)'
  return 'var(--danger)'
}

function getGradeLabel(score: number): string {
  if (score >= 90) return '极佳'
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  return '较差'
}

export default function QualityDetection({ quality }: QualityDetectionProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [activeTip, setActiveTip] = useState<string | null>(null)
  const color = gradeColor(quality.overall_score)
  const gaugeColor = cssVar(color, '#2fbf71')
  const gradeText = getGradeLabel(quality.overall_score)
  const sortedScores = [...SUB_SCORE_LABELS].sort(
    (a, b) => quality.sub_scores[a.key] - quality.sub_scores[b.key]
  )
  const weakest = sortedScores[0]
  const strongest = sortedScores[sortedScores.length - 1]

  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        radius: '90%',
        progress: {
          show: true,
          width: 14,
          roundCap: true,
          itemStyle: { color: gaugeColor },
        },
        axisLine: {
          lineStyle: { width: 14, color: [[1, 'rgba(128, 142, 162, 0.22)']] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
          fontSize: 36,
          fontWeight: 'bold',
          color: gaugeColor,
          offsetCenter: [0, '10%'],
          formatter: '{value}',
        },
        data: [{ value: quality.overall_score }],
      },
    ],
  }

  return (
    <div className="surface rounded-lg p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch">
        <div className="surface-subtle flex flex-col rounded-lg p-5 xl:w-72">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-soft)' }}>Quality Score</div>
              <h3 className="text-lg font-semibold mt-1" style={{ color: 'var(--text)' }}>综合评分</h3>
            </div>
            <span className="rounded px-2 py-1 text-xs font-semibold" style={{ color, backgroundColor: 'var(--bg-muted)' }}>
              {gradeText}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <ResponsiveChart option={gaugeOption} width={210} height={168} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded p-2" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <div style={{ color: 'var(--text-soft)' }}>优势项</div>
              <div className="mt-1 font-semibold truncate" style={{ color: 'var(--text)' }}>{strongest.label}</div>
            </div>
            <div className="rounded p-2" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <div style={{ color: 'var(--text-soft)' }}>待优化</div>
              <div className="mt-1 font-semibold truncate" style={{ color: 'var(--text)' }}>{weakest.label}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 grid gap-3 md:grid-cols-2">
          {SUB_SCORE_LABELS.map(({ key, label, tip }) => {
            const value = quality.sub_scores[key]
            const barColor = gradeColor(value)
            return (
              <div key={key} className="surface-subtle rounded-lg p-3 relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium flex items-center gap-1 min-w-0" style={{ color: 'var(--text)' }}>
                    <span className="truncate">{label}</span>
                    <span
                      className="cursor-help text-xs relative shrink-0"
                      style={{ color: 'var(--accent)' }}
                      onMouseEnter={() => setActiveTip(key)}
                      onMouseLeave={() => setActiveTip(null)}
                    >
                      ⓘ
                      {activeTip === key && (
                        <div
                          className="px-3 py-2 rounded text-xs leading-relaxed"
                          style={{
                            position: 'fixed',
                            zIndex: 9999,
                            backgroundColor: 'var(--chart-tooltip)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            width: 260,
                            marginLeft: 8,
                            marginTop: -8,
                            boxShadow: 'var(--shadow)',
                          }}
                        >
                          {tip}
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums" style={{ color: barColor }}>
                    {value}
                  </div>
                </div>
                <div className="meter-track mt-3 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Details section */}
      {Object.keys(quality.details).length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="text-sm font-medium cursor-pointer bg-transparent border-0 flex items-center gap-1"
            style={{ color: 'var(--accent-strong)' }}
          >
            评分明细 {detailsExpanded ? '▾' : '▸'}
          </button>
          {detailsExpanded && (
            <div className="mt-2 rounded p-3" style={{ backgroundColor: 'var(--bg-muted)' }}>
              {Object.entries(quality.details).map(([k, v]) => (
                <div key={k} className="flex gap-2 py-1 text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 120 }}>{k}</span>
                  <span style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
