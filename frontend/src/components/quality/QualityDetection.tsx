import { useState } from 'react'
import ResponsiveChart from '../ResponsiveChart'
import type { QualityResponse } from '../../types/analysis'

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
  if (score >= 80) return '#3fb950'
  if (score >= 60) return '#d29922'
  if (score >= 40) return '#db6d28'
  return '#f85149'
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
  const color = gradeColor(quality.overall_score)
  const gradeText = getGradeLabel(quality.overall_score)

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
          itemStyle: { color },
        },
        axisLine: {
          lineStyle: { width: 14, color: [[1, '#30363d']] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
          fontSize: 36,
          fontWeight: 'bold',
          color,
          offsetCenter: [0, '10%'],
          formatter: '{value}',
        },
        data: [{ value: quality.overall_score }],
      },
    ],
  }

  return (
    <div className="rounded-lg p-6" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Left: Overall gauge */}
        <div className="flex flex-col items-center shrink-0" style={{ width: 180 }}>
          <div className="text-xs font-medium mb-2" style={{ color: '#8b949e' }}>综合评分</div>
          <ResponsiveChart option={gaugeOption} width={180} height={150} />
          <div className="text-sm font-semibold mt-1" style={{ color }}>{gradeText}</div>
        </div>

        {/* Right: Sub-score bars */}
        <div className="flex-1 grid gap-3">
          {SUB_SCORE_LABELS.map(({ key, label, tip }) => {
            const value = quality.sub_scores[key]
            const barColor = gradeColor(value)
            return (
              <div key={key} className="flex items-center gap-3 group relative">
                <div className="text-sm w-24 shrink-0 cursor-help" style={{ color: '#8b949e' }} title={tip}>{label} ⓘ</div>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#30363d' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="text-sm font-medium w-8 text-right" style={{ color: '#e6edf3' }}>
                  {value}
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
            style={{ color: '#e94560' }}
          >
            评分明细 {detailsExpanded ? '▾' : '▸'}
          </button>
          {detailsExpanded && (
            <div className="mt-2 rounded p-3" style={{ backgroundColor: '#0d1117' }}>
              {Object.entries(quality.details).map(([k, v]) => (
                <div key={k} className="flex gap-2 py-1 text-sm" style={{ borderBottom: '1px solid #21262d' }}>
                  <span style={{ color: '#8b949e', minWidth: 120 }}>{k}</span>
                  <span style={{ color: '#e6edf3' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
