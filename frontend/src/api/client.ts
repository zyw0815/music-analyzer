import axios from 'axios'
import type { BasicInfoResponse, FullAnalysisResponse } from '../types/analysis'

const api = axios.create({
  baseURL: '/api',
  timeout: 0,
})

export async function analyzeFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<FullAnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<FullAnalysisResponse>('/analyze', formData, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return response.data
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
