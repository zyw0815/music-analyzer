export interface FileInfo {
  name: string
  size_bytes: number
  format: string
  encoder?: string
  md5?: string
}

export interface AudioInfo {
  codec: string
  sample_rate_hz: number
  bit_depth: number
  channels: number
  channel_mode: string
  bitrate_kbps?: number
  bitrate_mode: string
}

export interface TimingInfo {
  duration_seconds: number
  start_offset: number
}

export interface LoudnessInfo {
  peak_db: number
  rms_db: number
  dynamic_range_db: number
}

export interface DsdInfo {
  dsd_rate?: number
  dsd_channels?: number
  is_dsd: boolean
}

export interface BasicInfoResponse {
  file: FileInfo
  audio: AudioInfo
  timing: TimingInfo
  loudness: LoudnessInfo
  tags: Record<string, string>
  dsd?: DsdInfo
}

export interface SubScores {
  bitrate: number
  integrity: number
  quality_detection: number
  channel: number
  spectral: number
  dynamic_range: number
  distortion: number
}

export interface QualityResponse {
  overall_score: number
  grade: string
  sub_scores: SubScores
  details: Record<string, string>
}

export interface SpectrumData {
  frequencies: number[]
  magnitude_db: number[]
  peak_hold_db?: number[]
}

export interface SpectrogramData {
  frequencies: number[]
  times: number[]
  magnitude_db: number[][]
}

export interface FrequencyDistribution {
  bands: string[]
  energy_db: number[]
}

export interface SpectrumResponse {
  spectrum: SpectrumData
  spectrogram: SpectrogramData
  frequency_distribution: FrequencyDistribution
}

export interface WaveformData {
  samples: number[]
  times: number[]
  sample_rate: number
  downsampled_rate: number
}

export interface RmsEnvelope {
  values: number[]
  times: number[]
}

export interface WaveformResponse {
  waveform: WaveformData
  rms_envelope: RmsEnvelope
  clipping_regions: Array<{ start: number; end: number }>
  silence_regions: Array<{ start: number; end: number }>
}

export interface ChannelSpectrum {
  frequencies: number[]
  magnitude_db: number[]
}

export interface ChannelResponse {
  phase_correlation: number
  channel_balance_db: number
  left_spectrum: ChannelSpectrum
  right_spectrum: ChannelSpectrum
  mid_spectrum: ChannelSpectrum
  side_spectrum: ChannelSpectrum
  stereo_width: number
  is_mono: boolean
}

export interface FullAnalysisResponse {
  file_id: string
  basic_info: BasicInfoResponse
  quality: QualityResponse
  spectrum: SpectrumResponse
  waveform: WaveformResponse
  channel: ChannelResponse
}

export type ActiveModule = 'player' | 'quality' | 'spectrum' | 'waveform' | 'channel' | 'info'
