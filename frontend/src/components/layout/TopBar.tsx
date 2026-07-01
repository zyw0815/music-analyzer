import type { BasicInfoResponse } from '../../types/analysis'

interface TopBarProps {
  basicInfo?: BasicInfoResponse | null
  fileName?: string
}

export default function TopBar({ basicInfo, fileName }: TopBarProps) {
  return (
    <header
      className="flex items-center justify-between px-5 h-12 shrink-0"
      style={{
        backgroundColor: '#161b22',
        borderBottom: '1px solid #30363d',
      }}
    >
      <div className="text-base font-semibold" style={{ color: '#e6edf3' }}>
        🎵 音乐分析器
      </div>
      <div className="text-sm" style={{ color: '#8b949e' }}>
        {basicInfo ? (
          <span>
            {fileName || basicInfo.file.name}
            <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: '#1f2937' }}>
              {basicInfo.audio.codec}
            </span>
            <span className="ml-2">{basicInfo.timing.duration_seconds.toFixed(1)}s</span>
          </span>
        ) : (
          <span>未加载文件</span>
        )}
      </div>
    </header>
  )
}
