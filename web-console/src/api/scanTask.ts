import client from './client'
import type { Result } from './client'

export interface ScanTask {
  id: number
  projectId: number
  repositoryId: number
  branch: string
  commitSha: string | null
  status: string
  triggerType: string
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
  createdBy: number
  createdAt: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const scanTaskApi = {
  create: (repositoryId: number, data: { projectId: number; branch?: string }) =>
    client.post<Result<ScanTask>>(`/repositories/${repositoryId}/scan-tasks`, data),
  list: (projectId: number, page = 1, pageSize = 20) =>
    client.get<Result<PageResult<ScanTask>>>(`/projects/${projectId}/scan-tasks`, { params: { page, pageSize } }),
  detail: (id: number) =>
    client.get<Result<ScanTask>>(`/scan-tasks/${id}`),
  cancel: (id: number) =>
    client.post<Result<ScanTask>>(`/scan-tasks/${id}/cancel`),
}
