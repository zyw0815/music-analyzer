import { useRef, useState, useEffect, useCallback } from 'react'
import { getStreamUrl } from '../../api/client'

interface AudioPlayerProps {
  fileId: string
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '00:00'
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function AudioPlayer({ fileId }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [seeking, setSeeking] = useState(false)

  const src = getStreamUrl(fileId)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      if (!seeking) setCurrentTime(audio.currentTime)
    }
    const onDurationChange = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [seeking])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }, [playing])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = e.currentTarget
      const rect = bar.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      const time = ratio * duration
      setCurrentTime(time)
      if (audioRef.current) {
        audioRef.current.currentTime = time
      }
    },
    [duration]
  )

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (audioRef.current) {
      audioRef.current.volume = val
    }
  }, [])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="hidden md:flex items-center gap-3 px-3 h-10 shrink-0 rounded" style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-8 h-8 rounded-full border-0 cursor-pointer"
        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        title={playing ? '暂停' : '播放'}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      {/* Progress bar */}
      <div
        className="flex-1 h-1.5 rounded-full cursor-pointer relative"
        style={{ backgroundColor: 'var(--border)', minWidth: 100 }}
        onClick={handleProgressClick}
        onMouseDown={() => setSeeking(true)}
        onMouseUp={() => setSeeking(false)}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${progressPercent}%`, backgroundColor: 'var(--accent)' }}
        />
      </div>

      {/* Time */}
      <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: 'var(--text-muted)', minWidth: 70 }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Volume */}
      <div className="flex items-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text-muted)">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5z" />
        </svg>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
          className="w-16 h-1"
          style={{ cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}
