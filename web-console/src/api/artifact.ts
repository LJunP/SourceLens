import client from './client'
import type { Result } from './client'

export interface ArtifactRecord {
  id: number
  projectId: number | null
  repositoryId: number | null
  ownerType: string
  ownerId: number
  artifactType: string
  contentType: string | null
  sizeBytes: number
  checksumSha256: string | null
  metadataJson: string | null
  createdBy: number | null
  createdAt: string
}

export interface ArtifactPreviewResponse {
  record: ArtifactRecord
  text: string
  truncated: boolean
  previewBytes: number
}

export const artifactApi = {
  list: (projectId: number, params?: {
    repositoryId?: number
    ownerType?: string
    ownerId?: number
  }) => client.get<Result<ArtifactRecord[]>>(`/projects/${projectId}/artifacts`, { params }),
  get: (projectId: number, artifactId: number) =>
    client.get<Result<ArtifactRecord>>(`/projects/${projectId}/artifacts/${artifactId}`),
  preview: (projectId: number, artifactId: number) =>
    client.get<Result<ArtifactPreviewResponse>>(`/projects/${projectId}/artifacts/${artifactId}/preview`),
  download: (projectId: number, artifactId: number) =>
    client.get<Blob>(`/projects/${projectId}/artifacts/${artifactId}/download`, {
      responseType: 'blob',
    }),
}
