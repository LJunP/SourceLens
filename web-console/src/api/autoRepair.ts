import client from './client'
import type { Result } from './client'

export interface AutoRepair {
  id: number
  projectId: number
  repositoryId: number
  scanTaskId: number | null
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

export interface AutoRepairProvenance {
  sourceType?: 'PROJECT_QA_VERIFIED_CITATION' | 'SCAN_REPORT_RISK' | 'MANUAL_CANDIDATE' | string
  source?: string
  scanTaskId?: number
  filePath?: string
  chunkId?: number
  citationId?: string
  sourceLabel?: string
  startLine?: number
  endLine?: number
  citedByAnswer?: boolean
  groundingStatus?: string
  citationEnforcementStatus?: string
  citationEnforcementReason?: string
  evidenceType?: string
  evidenceReason?: string
  sourceEvidenceCategory?: string
  sourceEvidenceSource?: string
  sourceEvidenceTitle?: string
  sourceEvidenceFilePath?: string
  sourceEvidenceLineNumber?: string
  sourceEvidenceMatched?: boolean
  sourceEvidenceMatchType?: string
  repairEvidenceGate?: 'READY' | 'REVIEW' | 'BLOCKED' | string
  repairEvidenceGateReason?: string
  repairEvidenceGateSource?: string
  artifactId?: number
  artifactType?: string
  riskKey?: string
  riskCategory?: string
  riskSeverity?: string
  lineNumber?: number
}

export const autoRepairApi = {
  create: (projectId: number, data: {
    repositoryId: number
    scanTaskId?: number
    filePath: string
    targetDesc: string
    provenance?: AutoRepairProvenance
  }) => client.post<Result<AutoRepair>>(`/projects/${projectId}/auto-repairs`, data),

  list: (projectId: number, params?: { scanTaskId?: number }) =>
    client.get<Result<AutoRepair[]>>(`/projects/${projectId}/auto-repairs`, { params }),

  detail: (projectId: number, id: number) =>
    client.get<Result<AutoRepair>>(`/projects/${projectId}/auto-repairs/${id}`),

  submitPr: (projectId: number, id: number) =>
    client.post<Result<AutoRepair>>(`/projects/${projectId}/auto-repairs/${id}/submit-pr`),

  cancel: (projectId: number, id: number) =>
    client.post<Result<AutoRepair>>(`/projects/${projectId}/auto-repairs/${id}/cancel`),
}
