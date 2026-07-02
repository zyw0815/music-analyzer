import type { BasicInfoResponse } from '../../types/analysis'

interface AudioInfoProps {
  basicInfo: BasicInfoResponse
}

interface InfoRowProps {
  label: string
  value: string | number
  tip?: string
}

function InfoRow({ label, value, tip }: InfoRowProps) {
  return (
    <div className="flex justify-between py-1 text-sm" style={{ borderBottom: '1px solid #21262d' }}>
      <span style={{ color: '#8b949e' }} title={tip}>{label}{tip ? ' ⓘ' : ''}</span>
      <span style={{ color: '#e6edf3' }}>{value}</span>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${String(sec).padStart(2, '0')}`
}

function formatBitrate(kbps: number | undefined): string {
  return kbps !== undefined ? `${kbps} kbps` : 'N/A'
}

function cardStyle(): React.CSSProperties {
  return {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 8,
    padding: 16,
  }
}

function cardTitleStyle(): React.CSSProperties {
  return {
    color: '#e6edf3',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
  }
}

export default function AudioInfo({ basicInfo }: AudioInfoProps) {
  const { file, audio, timing, loudness, tags, dsd } = basicInfo

  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: '#e6edf3' }}>音频信息</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* File Properties */}
        <div style={cardStyle()}>
          <div style={cardTitleStyle()}>文件属性</div>
          <InfoRow label="文件名" value={file.name} />
          <InfoRow label="大小" value={formatFileSize(file.size_bytes)} />
          <InfoRow label="格式" value={file.format} />
          {file.encoder && <InfoRow label="编码器" value={file.encoder} />}
          {file.md5 && (
            <InfoRow label="MD5" value={file.md5.length > 12 ? file.md5.slice(0, 12) + '...' : file.md5} />
          )}
        </div>

        {/* Audio Parameters */}
        <div style={cardStyle()}>
          <div style={cardTitleStyle()}>音频参数</div>
          <InfoRow label="采样率" value={`${audio.sample_rate_hz} Hz`} tip="每秒采集的样本数。CD 标准 44100Hz，越高则能记录的频率范围越广" />
          <InfoRow label="位深" value={`${audio.bit_depth} bit`} tip="每个样本的精度。CD 为 16bit，24bit 为专业级，越高则动态范围越大" />
          <InfoRow label="声道" value={audio.channel_mode} tip="单声道=一个声道，立体声=左右两个声道" />
          <InfoRow label="比特率" value={formatBitrate(audio.bitrate_kbps)} tip="每秒的数据量。越高音质越好，文件也越大。MP3 最高 320kbps，无损约 1000+" />
          <InfoRow label="比特率模式" value={audio.bitrate_mode} tip="CBR=固定码率（稳定），VBR=可变码率（更高效）" />
        </div>

        {/* Timing */}
        <div style={cardStyle()}>
          <div style={cardTitleStyle()}>时间信息</div>
          <InfoRow label="时长" value={formatDuration(timing.duration_seconds)} />
          <InfoRow label="偏移" value={`${timing.start_offset.toFixed(1)} s`} />
        </div>

        {/* Loudness */}
        <div style={cardStyle()}>
          <div style={cardTitleStyle()}>响度信息</div>
          <InfoRow label="峰值" value={`${loudness.peak_db.toFixed(1)} dB`} tip="音频中最响的瞬间。接近 0dB 表示音量已到极限，过度会削波" />
          <InfoRow label="RMS" value={`${loudness.rms_db.toFixed(1)} dB`} tip="平均响度水平。越接近 0 越响，-14dB 左右是流行音乐常见水平" />
          <InfoRow label="动态范围" value={`${loudness.dynamic_range_db.toFixed(1)} dB`} tip="最响和最轻的差距。越大音乐起伏感越强，太小则声音扁平" />
        </div>

        {/* Tags */}
        <div style={cardStyle()}>
          <div style={cardTitleStyle()}>标签信息</div>
          {Object.keys(tags).length > 0 ? (
            Object.entries(tags).map(([key, value]) => (
              <InfoRow key={key} label={key} value={value} />
            ))
          ) : (
            <div className="text-sm" style={{ color: '#8b949e' }}>无标签信息</div>
          )}
        </div>

        {/* DSD Info */}
        {dsd?.is_dsd && (
          <div style={cardStyle()}>
            <div style={cardTitleStyle()}>DSD 信息</div>
            {dsd.dsd_rate !== undefined && (
              <InfoRow label="DSD Rate" value={`DSD${dsd.dsd_rate}`} />
            )}
            {dsd.dsd_channels !== undefined && (
              <InfoRow label="DSD 声道" value={dsd.dsd_channels} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
