import { lazy, Suspense } from 'react'
import type { ActiveModule, FullAnalysisResponse } from '../../types/analysis'
import AudioInfo from '../audioinfo/AudioInfo'
import ErrorBoundary from '../ErrorBoundary'

const QualityDetection = lazy(() => import('../quality/QualityDetection'))
const SpectrumAnalyzer = lazy(() => import('../spectrum/SpectrumAnalyzer'))
const SpectrogramHeatmap = lazy(() => import('../spectrum/SpectrogramHeatmap'))
const FrequencyDistributionChart = lazy(() => import('../spectrum/FrequencyDistribution'))
const WaveformDisplay = lazy(() => import('../waveform/WaveformDisplay'))
const ChannelAnalysis = lazy(() => import('../channel/ChannelAnalysis'))

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

function ModuleLoading() {
  return (
    <div className="surface rounded-lg p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
      加载分析视图...
    </div>
  )
}

export default function MainContent({ activeModule, analysisData }: MainContentProps) {
  const ph = placeholders[activeModule]

  if (!analysisData) {
    return (
      <main
        className="flex-1 overflow-auto p-5"
      >
        <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
          <div className="text-5xl mb-4">{ph.icon}</div>
          <div className="text-lg mb-1" style={{ color: 'var(--text)' }}>{ph.title}</div>
          <div className="text-sm">请上传音频文件开始分析</div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-auto p-5">
      {activeModule === 'quality' && (
        <ErrorBoundary moduleName="质量检测">
          <Suspense fallback={<ModuleLoading />}>
            <QualityDetection quality={analysisData.quality} />
          </Suspense>
        </ErrorBoundary>
      )}

      {activeModule === 'spectrum' && analysisData.spectrum && (
        <ErrorBoundary moduleName="频谱分析">
          <Suspense fallback={<ModuleLoading />}>
            <div className="flex flex-col gap-5">
              <SpectrumAnalyzer spectrum={analysisData.spectrum.spectrum} />
              <SpectrogramHeatmap spectrogram={analysisData.spectrum.spectrogram} />
              <FrequencyDistributionChart distribution={analysisData.spectrum.frequency_distribution} />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}

      {activeModule === 'spectrum' && !analysisData.spectrum && (
        <div className="surface rounded-lg p-5" style={{ color: 'var(--danger)' }}>
          频谱数据未加载
        </div>
      )}

      {activeModule === 'waveform' && analysisData.waveform && (
        <ErrorBoundary moduleName="波形显示">
          <Suspense fallback={<ModuleLoading />}>
            <WaveformDisplay waveform={analysisData.waveform} />
          </Suspense>
        </ErrorBoundary>
      )}

      {activeModule === 'channel' && analysisData.channel && (
        <ErrorBoundary moduleName="声道分析">
          <Suspense fallback={<ModuleLoading />}>
            <ChannelAnalysis channel={analysisData.channel} />
          </Suspense>
        </ErrorBoundary>
      )}

      {activeModule === 'info' && (
        <ErrorBoundary moduleName="音频信息">
          <AudioInfo basicInfo={analysisData.basic_info} />
        </ErrorBoundary>
      )}

      {activeModule === 'player' && (
        <div
          className="surface rounded-lg p-6 flex flex-col items-center justify-center"
          style={{ minHeight: 300 }}
        >
          <div className="text-5xl mb-4" style={{ color: 'var(--accent)' }}>♫</div>
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
            {analysisData.basic_info.file.name}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            使用顶栏播放器控制播放
          </div>
        </div>
      )}
    </main>
  )
}
