import client from './client'
import type { Result } from './client'

export interface Repository {
  id: number
  projectId: number
  provider: string
  owner: string
  name: string
  url: string
  defaultBranch: string
  visibility: string
  authType: string
  status: string
  createdAt: string
}

export interface GitHubAppInstallation {
  id: number
  projectId: number
  repositoryId: number
  installationId: number
  accountLogin: string
  accountType?: string
  repositorySelection?: string
  permissionsJson?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface BindGitHubAppInstallationRequest {
  installationId: number
  accountLogin: string
  accountType?: string
  repositorySelection?: string
  permissionsJson?: string
}

export const repositoryApi = {
  list: (projectId: number) =>
    client.get<Result<Repository[]>>(`/projects/${projectId}/repositories`),
  add: (projectId: number, data: { url: string; defaultBranch?: string; token?: string }) =>
    client.post<Result<Repository>>(`/projects/${projectId}/repositories`, data),
  detail: (id: number) =>
    client.get<Result<Repository>>(`/repositories/${id}`),
  update: (id: number, data: { url?: string; defaultBranch?: string; token?: string }) =>
    client.put<Result<Repository>>(`/repositories/${id}`, data),
  delete: (id: number) =>
    client.delete<Result<void>>(`/repositories/${id}`),
  getGitHubAppInstallation: (id: number) =>
    client.get<Result<GitHubAppInstallation>>(`/repositories/${id}/github-app-installation`),
  bindGitHubAppInstallation: (id: number, data: BindGitHubAppInstallationRequest) =>
    client.put<Result<GitHubAppInstallation>>(`/repositories/${id}/github-app-installation`, data),
  disableGitHubAppInstallation: (id: number) =>
    client.delete<Result<void>>(`/repositories/${id}/github-app-installation`),
}
