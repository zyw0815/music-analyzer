import axios from 'axios'
import type { BasicInfoResponse, FullAnalysisResponse } from '../types/analysis'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 min for large files
})

export async function analyzeFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<FullAnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<FullAnalysisResponse>('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
  const response = await api.post<BasicInfoResponse>('/analyze/basic', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export function getStreamUrl(fileId: string): string {
  return `/api/stream/${fileId}`
}
