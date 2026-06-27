import client from './client'
import type { Result } from './client'
import type { CodeChunkEvidenceProfile, CodeChunkSearchItem } from './codeChunk'

export interface Project {
  id: number
  name: string
  description: string | null
  primaryLanguage: string | null
  framework: string | null
  status: string
  healthScore: number | null
  createdBy: number
  createdAt: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface CodeQaResponse {
  answer: string
  scanTaskId: number | null
  question: string
  matchedChunks: number
  resultCount: number
  retrievalMode?: string
  totalChunks: number
  embeddedChunks: number
  truncated: boolean
  evidenceProfile?: CodeChunkEvidenceProfile
  retrievedChunks: CodeChunkSearchItem[]
}

export const projectApi = {
  list: (page = 1, pageSize = 20) =>
    client.get<Result<PageResult<Project>>>('/projects', { params: { page, pageSize } }),
  create: (data: { name: string; description?: string }) =>
    client.post<Result<Project>>('/projects', data),
  detail: (id: number) =>
    client.get<Result<Project>>(`/projects/${id}`),
  update: (id: number, data: { name?: string; description?: string }) =>
    client.put<Result<Project>>(`/projects/${id}`, data),
  delete: (id: number) =>
    client.delete<Result<void>>(`/projects/${id}`),
  codeQa: (projectId: number, question: string, scanTaskId?: number | null) =>
    client.post<Result<CodeQaResponse>>(`/projects/${projectId}/qa`, {
      question,
      ...(scanTaskId ? { scanTaskId } : {}),
    }),
}
