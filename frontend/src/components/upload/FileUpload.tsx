import { useState, useRef } from 'react'
import { analyzeFile } from '../../api/client'
import type { FullAnalysisResponse } from '../../types/analysis'

const ACCEPTED = '.mp3,.wav,.flac,.aac,.ogg,.aiff,.wma,.m4a,.ape,.dsf,.dff,.opus'
const MAX_SIZE_GB = 5

interface FileUploadProps {
  onUploadComplete: (data: FullAnalysisResponse) => void
  onError: (msg: string) => void
}

export default function FileUpload({ onUploadComplete, onError }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'analyzing'>('idle')
  const [statusText, setStatusText] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function validateFile(file: File): string | null {
    if (file.size > MAX_SIZE_GB * 1024 * 1024 * 1024) {
      return `文件大小超过限制（最大 ${MAX_SIZE_GB}GB）`
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED.split(',').includes(ext)) {
      return '不支持的音频格式'
    }
    return null
  }

  async function handleFile(file: File) {
    const err = validateFile(file)
    if (err) {
      onError(err)
      return
    }
    setSelectedFile(file)
    setUploading(true)
    setProgress(0)
    setPhase('uploading')
    setStatusText('上传中...')
    try {
      const data = await analyzeFile(file, (percent) => {
        setProgress(percent)
        setStatusText(`上传中... ${percent}%`)
      }, (status) => {
        setPhase('analyzing')
        setProgress(status.progress)
        setStatusText(status.message || '后端分析中...')
      })
      onUploadComplete(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '上传失败，请重试'
      onError(msg)
    } finally {
      setUploading(false)
      setPhase('idle')
      setStatusText('')
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={onInputChange}
        className="hidden"
      />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className="surface flex flex-col items-center justify-center w-full max-w-xl cursor-pointer rounded-lg transition-colors"
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent-strong)' : 'var(--border)'}`,
          backgroundColor: dragOver ? 'var(--accent-soft)' : 'var(--bg-panel)',
          padding: '48px 24px',
        }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-4xl mb-4"
          style={{
            color: dragOver ? 'var(--accent-strong)' : 'var(--accent)',
            backgroundColor: 'var(--bg-muted)',
          }}
        >
          ↑
        </div>
        <div className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>
          拖拽音频文件到此处，或点击选择
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          支持 MP3, WAV, FLAC, AAC, OGG, AIFF 等格式
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 w-full max-w-xl">
          <div className="flex items-center justify-between text-sm mb-2" style={{ color: 'var(--text)' }}>
            <span className="truncate mr-2">{selectedFile.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
          {uploading && (
            <div className="meter-track w-full h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(progress, phase === 'uploading' ? 2 : 0)}%`, backgroundColor: 'var(--accent-strong)' }}
              />
            </div>
          )}
          {uploading && (
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {statusText || '处理中...'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
