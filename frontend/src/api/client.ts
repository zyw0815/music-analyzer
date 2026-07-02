import axios from 'axios'
import type { BasicInfoResponse, FullAnalysisResponse } from '../types/analysis'

const api = axios.create({
  baseURL: '/api',
  timeout: 0,
})

export async function analyzeFile(
  file: File,
  onProgress?: (percent: number) => void,
  onStatus?: (status: { progress: number; message: string; stage: string }) => void
): Promise<FullAnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<{ job_id: string; progress: number; message: string; stage: string }>('/analyze/jobs', formData, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  onStatus?.({
    progress: response.data.progress,
    message: response.data.message,
    stage: response.data.stage,
  })

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const job = await api.get<{
      status: 'queued' | 'running' | 'done' | 'error'
      progress: number
      message: string
      stage: string
      result?: FullAnalysisResponse
      error?: string
    }>(`/analyze/jobs/${response.data.job_id}`)

    onStatus?.({
      progress: job.data.progress,
      message: job.data.message,
      stage: job.data.stage,
    })

    if (job.data.status === 'done' && job.data.result) {
      return job.data.result
    }
    if (job.data.status === 'error') {
      throw new Error(job.data.error || job.data.message || '分析失败')
    }
  }
}

export async function analyzeBasic(file: File): Promise<BasicInfoResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<BasicInfoResponse>('/analyze/basic', formData)
  return response.data
}

export function getStreamUrl(fileId: string): string {
  return `/api/stream/${fileId}`
}
