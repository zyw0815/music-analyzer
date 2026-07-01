import type { ActiveModule, FullAnalysisResponse } from '../../types/analysis'
import QualityDetection from '../quality/QualityDetection'

interface MainContentProps {
  activeModule: ActiveModule
  analysisData?: FullAnalysisResponse | null
}

const placeholders: Record<ActiveModule, { title: string; icon: string }> = {
  player: { title: '播放器', icon: '🎵' },
  quality: { title: '质量检测', icon: '📊' },
  spectrum: { title: '频谱分析', icon: '📈' },
  waveform: { title: '波形显示', icon: '🔊' },
  channel: { title: '声道分析', icon: '🔀' },
  info: { title: '音频信息', icon: 'ℹ️' },
}

export default function MainContent({ activeModule, analysisData }: MainContentProps) {
  const ph = placeholders[activeModule]

  if (!analysisData) {
    return (
      <main
        className="flex-1 overflow-auto p-5"
        style={{ backgroundColor: '#0d1117' }}
      >
        <div className="flex flex-col items-center justify-center h-full" style={{ color: '#8b949e' }}>
          <div className="text-5xl mb-4">{ph.icon}</div>
          <div className="text-lg mb-1" style={{ color: '#e6edf3' }}>{ph.title}</div>
          <div className="text-sm">请上传音频文件开始分析</div>
        </div>
      </main>
    )
  }

  if (activeModule === 'quality') {
    return (
      <main className="flex-1 overflow-auto p-5" style={{ backgroundColor: '#0d1117' }}>
        <QualityDetection quality={analysisData.quality} />
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-auto p-5" style={{ backgroundColor: '#0d1117' }}>
      <div className="rounded-lg p-6" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#e6edf3' }}>
          {ph.icon} {ph.title}
        </h2>
        <p className="text-sm" style={{ color: '#8b949e' }}>
          数据已加载，可视化组件将在后续任务中实现。
        </p>
      </div>
    </main>
  )
}
