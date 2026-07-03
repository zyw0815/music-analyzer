import type { BasicInfoResponse } from '../../types/analysis'
import AudioPlayer from '../player/AudioPlayer'

interface TopBarProps {
  basicInfo?: BasicInfoResponse | null
  fileName?: string
  fileId?: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export default function TopBar({ basicInfo, fileName, fileId, theme, onToggleTheme }: TopBarProps) {
  return (
    <header
      className="flex items-center justify-between gap-4 px-5 h-14 shrink-0"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-panel) 88%, transparent)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-8 w-8 items-center justify-center rounded"
          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          ♫
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold leading-tight" style={{ color: 'var(--text)' }}>
            音乐分析器
          </div>
          <div className="text-xs truncate" style={{ color: 'var(--text-soft)' }}>
            {basicInfo ? fileName || basicInfo.file.name : '等待上传音频文件'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 min-w-0">
        {fileId && <AudioPlayer fileId={fileId} />}
        <button
          onClick={onToggleTheme}
          className="theme-button flex h-9 w-9 items-center justify-center rounded cursor-pointer transition-colors"
          title={theme === 'dark' ? '切换到白天模式' : '切换到夜间模式'}
          aria-label={theme === 'dark' ? '切换到白天模式' : '切换到夜间模式'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <div className="hidden xl:block text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          {basicInfo ? (
            <span>
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text)' }}>
                {basicInfo.audio.codec}
              </span>
              <span className="ml-2">{basicInfo.timing.duration_seconds.toFixed(1)}s</span>
            </span>
          ) : (
            <span>未加载文件</span>
          )}
        </div>
      </div>
    </header>
  )
}
