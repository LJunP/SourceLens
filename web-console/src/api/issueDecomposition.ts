import client from './client'
import type { Result } from './client'

export interface IssueDecomposition {
  id: number
  projectId: number
  scanTaskId: number | null
  title: string
  description: string
  businessContext: string | null
  priority: string
  relatedModules: string | null
  status: string
  understanding: string | null
  impactModules: string | null
  impactApis: string | null
  impactDb: string | null
  risks: string | null
  dependencies: string | null
  acceptance: string | null
  suggestedBranch: string | null
  suggestedCommit: string | null
  outputJson: string | null
  errorMessage: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface IssueTask {
  id: number
  decompositionId: number
  taskOrder: number
  category: string
  title: string
  description: string | null
  impactFiles: string | null
  riskLevel: string | null
  testSuggestions: string | null
  estimatedHours: number | null
  status: string
  createdAt: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const issueApi = {
  create: (data: {
    projectId: number
    scanTaskId?: number
    title: string
    description: string
    businessContext?: string
    priority?: string
    relatedModules?: string
  }) => client.post<Result<IssueDecomposition>>('/issue-decompositions', data),

  listByProject: (projectId: number, page = 1, pageSize = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (status) params.set('status', status)
    return client.get<Result<PageResult<IssueDecomposition>>>(`/projects/${projectId}/issue-decompositions?${params}`)
  },

  detail: (id: number) =>
    client.get<Result<IssueDecomposition>>(`/issue-decompositions/${id}`),

  listTasks: (id: number) =>
    client.get<Result<IssueTask[]>>(`/issue-decompositions/${id}/tasks`),

  updateTaskStatus: (taskId: number, status: string) =>
    client.patch<Result<IssueTask>>(`/issue-tasks/${taskId}?status=${status}`),

  exportMarkdown: (id: number) =>
    client.get<Result<string>>(`/issue-decompositions/${id}/export/markdown`),
}