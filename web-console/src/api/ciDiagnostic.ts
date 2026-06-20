import client from './client'
import type { Result } from './client'

export interface CiDiagnostic {
  id: number
  projectId: number
  scanTaskId: number | null
  repositoryId: number | null
  provider: string
  workflowName: string | null
  workflowRunId: string | null
  runNumber: number | null
  branch: string | null
  commitSha: string | null
  commitMessage: string | null
  status: string
  conclusion: string | null
  failureSummary: string | null
  errorCategory: string | null
  rootCause: string | null
  relatedFiles: string | null
  fixSuggestions: string | null
  rawLogSnippet: string | null
  diagnosticJson: string | null
  errorMessage: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const ciApi = {
  create: (data: {
    projectId: number
    scanTaskId?: number
    repositoryId?: number
    provider?: string
    workflowName?: string
    workflowRunId?: string
    runNumber?: number
    branch?: string
    commitSha?: string
    commitMessage?: string
    conclusion: string
    rawLogSnippet?: string
  }) => client.post<Result<CiDiagnostic>>('/ci-diagnostics', data),

  listByProject: (projectId: number, page = 1, pageSize = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (status) params.set('status', status)
    return client.get<Result<PageResult<CiDiagnostic>>>(`/projects/${projectId}/ci-diagnostics?${params}`)
  },

  detail: (id: number) =>
    client.get<Result<CiDiagnostic>>(`/ci-diagnostics/${id}`),

  reanalyze: (id: number) =>
    client.post<Result<CiDiagnostic>>(`/ci-diagnostics/${id}/reanalyze`),
}