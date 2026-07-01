import { useState, useRef } from 'react'
import { analyzeFile } from '../../api/client'
import type { FullAnalysisResponse } from '../../types/analysis'

const ACCEPTED = '.mp3,.wav,.flac,.aac,.ogg,.aiff,.wma,.m4a,.ape,.dsf,.dff,.opus'
const MAX_SIZE_MB = 500

interface FileUploadProps {
  onUploadComplete: (data: FullAnalysisResponse) => void
  onError: (msg: string) => void
}

export default function FileUpload({ onUploadComplete, onError }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function validateFile(file: File): string | null {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `文件大小超过限制（最大 ${MAX_SIZE_MB}MB）`
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
    try {
      const data = await analyzeFile(file, setProgress)
      onUploadComplete(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '上传失败，请重试'
      onError(msg)
    } finally {
      setUploading(false)
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
    <div className="flex flex-col items-center justify-center h-full">
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
        className="flex flex-col items-center justify-center w-full max-w-lg cursor-pointer rounded-lg transition-colors"
        style={{
          border: `2px dashed ${dragOver ? '#e94560' : '#30363d'}`,
          backgroundColor: dragOver ? 'rgba(233,69,96,0.05)' : '#161b22',
          padding: '48px 24px',
        }}
      >
        <div className="text-4xl mb-3" style={{ color: dragOver ? '#e94560' : '#8b949e' }}>
          ↑
        </div>
        <div className="text-sm font-medium mb-1" style={{ color: '#e6edf3' }}>
          拖拽音频文件到此处，或点击选择
        </div>
        <div className="text-xs" style={{ color: '#8b949e' }}>
          支持 MP3, WAV, FLAC, AAC, OGG, AIFF 等格式
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 w-full max-w-lg">
          <div className="flex items-center justify-between text-sm mb-2" style={{ color: '#e6edf3' }}>
            <span className="truncate mr-2">{selectedFile.name}</span>
            <span style={{ color: '#8b949e' }}>
              {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
          {uploading && (
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#30363d' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: '#e94560' }}
              />
            </div>
          )}
          {uploading && (
            <div className="text-xs mt-1" style={{ color: '#8b949e' }}>
              分析中... {progress}%
            </div>
          )}
        </div>
      )}
    </div>
  )
}
