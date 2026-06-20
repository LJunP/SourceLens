import client from './client'
import type { Result } from './client'

export interface PrReview {
  id: number
  projectId: number
  scanTaskId: number | null
  repositoryId: number | null
  prNumber: number | null
  prTitle: string | null
  prDescription: string | null
  branch: string | null
  baseBranch: string | null
  commitSha: string | null
  author: string | null
  changedFiles: string | null
  diffSummary: string | null
  ciStatus: string | null
  status: string
  riskLevel: string | null
  changeSummary: string | null
  impactScope: string | null
  risks: string | null
  testSuggestions: string | null
  mergeRecommendation: string | null
  reviewJson: string | null
  errorMessage: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface PrReviewComment {
  id: number
  reviewId: number
  filePath: string
  lineNumber: number | null
  severity: string
  category: string
  message: string
  suggestion: string | null
  createdAt: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const prReviewApi = {
  create: (data: {
    projectId: number
    scanTaskId?: number
    repositoryId?: number
    prNumber?: number
    prTitle?: string
    prDescription?: string
    branch?: string
    baseBranch?: string
    commitSha?: string
    author?: string
    changedFiles?: string
    diffSummary?: string
    ciStatus?: string
  }) => client.post<Result<PrReview>>('/pr-reviews', data),

  listByProject: (projectId: number, page = 1, pageSize = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (status) params.set('status', status)
    return client.get<Result<PageResult<PrReview>>>(`/projects/${projectId}/pr-reviews?${params}`)
  },

  detail: (id: number) =>
    client.get<Result<PrReview>>(`/pr-reviews/${id}`),

  listComments: (id: number) =>
    client.get<Result<PrReviewComment[]>>(`/pr-reviews/${id}/comments`),

  reanalyze: (id: number) =>
    client.post<Result<PrReview>>(`/pr-reviews/${id}/reanalyze`),
}