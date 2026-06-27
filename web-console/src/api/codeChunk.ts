import client from './client'
import type { Result } from './client'

export interface CodeChunkSearchItem {
  id: number
  scanTaskId: number
  filePath: string
  startLine: number
  endLine: number
  content: string
  contentPreview: string
  hasEmbedding: boolean
  matchedTerms: string[]
  relevanceScore?: number
  evidenceType?: string
  evidenceReason?: string
  contextRole?: 'PRIMARY' | 'ADJACENT_CONTEXT' | string
  contextDistance?: number
}

export interface CodeChunkEvidenceTypeStat {
  type: string
  count: number
}

export interface CodeChunkEvidenceFileStat {
  filePath: string
  count: number
  bestScore: number
}

export interface CodeChunkEvidenceProfile {
  readiness: string
  confidence: number
  summary: string
  nextAction: string
  details: string[]
  uniqueFiles: number
  embeddedEvidenceCount: number
  lowConfidenceCount: number
  topScore: number
  averageScore: number
  lineSpan: number
  dominantEvidenceType: string
  evidenceTypeStats: CodeChunkEvidenceTypeStat[]
  fileStats: CodeChunkEvidenceFileStat[]
}

export interface CodeChunkSearchResponse {
  scanTaskId: number | null
  query: string
  limit: number
  total: number
  resultCount: number
  totalChunks: number
  embeddedChunks: number
  truncated: boolean
  retrievalMode?: string
  evidenceProfile?: CodeChunkEvidenceProfile
  items: CodeChunkSearchItem[]
}

export const codeChunkApi = {
  search: (projectId: number, params?: { query?: string; scanTaskId?: number; limit?: number }) =>
    client.get<Result<CodeChunkSearchResponse>>(`/projects/${projectId}/code-chunks/search`, { params }),
}
