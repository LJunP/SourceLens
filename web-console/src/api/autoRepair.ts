import client from './client'
import type { Result } from './client'

export interface AutoRepair {
  id: number
  projectId: number
  repositoryId: number
  filePath: string
  targetDesc: string
  status: string
  branchName: string | null
  diffContent: string | null
  patchArtifactPath: string | null
  testLog: string | null
  prUrl: string | null
  errorMessage: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export const autoRepairApi = {
  create: (projectId: number, data: {
    repositoryId: number
    filePath: string
    targetDesc: string
  }) => client.post<Result<AutoRepair>>(`/projects/${projectId}/auto-repairs`, data),

  list: (projectId: number) =>
    client.get<Result<AutoRepair[]>>(`/projects/${projectId}/auto-repairs`),

  detail: (projectId: number, id: number) =>
    client.get<Result<AutoRepair>>(`/projects/${projectId}/auto-repairs/${id}`),

  submitPr: (projectId: number, id: number) =>
    client.post<Result<AutoRepair>>(`/projects/${projectId}/auto-repairs/${id}/submit-pr`),

  cancel: (projectId: number, id: number) =>
    client.post<Result<AutoRepair>>(`/projects/${projectId}/auto-repairs/${id}/cancel`),
}
