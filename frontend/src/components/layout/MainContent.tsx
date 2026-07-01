import type { ActiveModule, FullAnalysisResponse } from '../../types/analysis'
import QualityDetection from '../quality/QualityDetection'
import SpectrumAnalyzer from '../spectrum/SpectrumAnalyzer'
import SpectrogramHeatmap from '../spectrum/SpectrogramHeatmap'
import FrequencyDistributionChart from '../spectrum/FrequencyDistribution'
import WaveformDisplay from '../waveform/WaveformDisplay'
import ChannelAnalysis from '../channel/ChannelAnalysis'
import AudioInfo from '../audioinfo/AudioInfo'

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

  return (
    <main className="flex-1 overflow-auto p-5" style={{ backgroundColor: '#0d1117' }}>
      {activeModule === 'quality' && (
        <QualityDetection quality={analysisData.quality} />
      )}

      {activeModule === 'spectrum' && (
        <div className="flex flex-col gap-5">
          <SpectrumAnalyzer spectrum={analysisData.spectrum.spectrum} />
          <SpectrogramHeatmap spectrogram={analysisData.spectrum.spectrogram} />
          <FrequencyDistributionChart distribution={analysisData.spectrum.frequency_distribution} />
        </div>
      )}

      {activeModule === 'waveform' && (
        <WaveformDisplay waveform={analysisData.waveform} />
      )}

      {activeModule === 'channel' && (
        <ChannelAnalysis channel={analysisData.channel} />
      )}

      {activeModule === 'info' && (
        <AudioInfo basicInfo={analysisData.basic_info} />
      )}

      {activeModule === 'player' && (
        <div
          className="rounded-lg p-6 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#161b22', border: '1px solid #30363d', minHeight: 300 }}
        >
          <div className="text-5xl mb-4">🎵</div>
          <div className="text-lg font-semibold mb-2" style={{ color: '#e6edf3' }}>
            {analysisData.basic_info.file.name}
          </div>
          <div className="text-sm" style={{ color: '#8b949e' }}>
            使用顶栏播放器控制播放
          </div>
        </div>
      )}
    </main>
  )
}
