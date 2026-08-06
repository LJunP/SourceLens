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
  retrievalPlan?: CodeQaRetrievalPlan
  evidenceProfile?: CodeChunkEvidenceProfile
  groundingStatus?: 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED' | 'NO_EVIDENCE' | string
  citationEnforcementStatus?: string
  citationEnforcementReason?: string
  citationEnforcementNote?: string
  citationCoverage?: CodeQaCitationCoverage
  claimCitationCoverage?: CodeQaClaimCitationCoverage
  sourceEvidenceRef?: CodeQaEvidenceRef | null
  sourceEvidenceMatched?: boolean
  sourceEvidenceMatchType?: 'REPORT_LINE_ANCHOR' | 'REPORT_FILE_ANCHOR' | 'NONE' | string
  answerCitations?: CodeQaCitation[]
  retrievedChunks: CodeChunkSearchItem[]
}

export interface CodeQaRetrievalPlan {
  tokens?: string[]
  queryStrategy?: 'NO_SCAN' | 'NO_CONTEXT' | 'SOURCE_LOCATION_ANCHOR' | 'ENDPOINT_ROUTE_LOOKUP' | 'FRONTEND_BACKEND_BRIDGE' | 'BACKEND_FLOW_ROLE_EXPANSION' | 'SEMANTIC_FALLBACK' | 'SEMANTIC_HYBRID' | 'ROLE_INTENT_FALLBACK' | 'KEYWORD' | 'STABLE_FALLBACK' | string
  roleIntents?: string[]
  fallbackRolePriority?: string[]
  auxiliaryHintsPresent?: boolean
  questionEmbeddingAvailable?: boolean
  embeddingCoveragePercent?: number
  embeddingCoverageStatus?: 'NONE' | 'LOW' | 'PARTIAL' | 'READY' | string
  semanticPoolAttempted?: boolean
  semanticPoolStrategy?: 'NOT_ATTEMPTED' | 'HEAD_ONLY' | 'HEAD_DISTRIBUTED_WINDOWS' | string
  semanticPoolLoadedCount?: number
  semanticPoolLimit?: number
  semanticPoolTruncated?: boolean
  semanticPoolCoveragePercent?: number
  semanticPlanReason?: 'NO_SCAN' | 'NO_CONTEXT' | 'NO_ACTIVE_LLM' | 'QUESTION_EMBEDDING_FAILED' | 'QUESTION_EMBEDDING_UNAVAILABLE' | 'NO_MODEL_EMBEDDINGS' | 'LOW_EMBEDDING_COVERAGE' | 'SEMANTIC_POOL_READY' | 'SEMANTIC_POOL_EMPTY' | 'KEYWORD_ONLY' | string
  semanticReadinessStatus?: 'NOT_APPLICABLE' | 'DISABLED' | 'UNAVAILABLE' | 'DEGRADED' | 'READY' | string
  semanticReadinessReason?: 'NO_SCAN' | 'NO_CONTEXT' | 'NO_ACTIVE_LLM' | 'QUESTION_EMBEDDING_FAILED' | 'QUESTION_EMBEDDING_UNAVAILABLE' | 'NO_MODEL_EMBEDDINGS' | 'LOW_EMBEDDING_COVERAGE' | 'PARTIAL_EMBEDDING_COVERAGE' | 'SEMANTIC_POOL_EMPTY' | 'SEMANTIC_POOL_TRUNCATED' | 'SEMANTIC_READY' | string
  crossFileIntentPresent?: boolean
  crossFileEvidenceSatisfied?: boolean
  crossFilePrimaryFileCount?: number
  crossFileEvidenceStatus?: 'NOT_APPLICABLE' | 'SATISFIED' | 'SINGLE_PRIMARY_FILE' | 'NO_PRIMARY_EVIDENCE' | string
  graphRelationEvidencePresent?: boolean
  graphRelationPrimaryLabels?: string[]
  graphRelationEvidenceCount?: number
  fallbackReason?: 'NO_SCAN' | 'NO_CONTEXT' | 'NO_KEYWORD_NO_EMBEDDING_INTENT_ROLE_FALLBACK' | 'NO_KEYWORD_NO_EMBEDDING_DEFAULT_FALLBACK' | 'NO_KEYWORD_SEMANTIC_OR_STABLE_FALLBACK' | 'KEYWORD_WITH_ROLE_HINTS' | 'KEYWORD' | string
}

export interface CodeQaCitationCoverage {
  totalEvidenceCount?: number
  citedEvidenceCount?: number
  uncitedCandidateCount?: number
  repairCandidateCount?: number
  coveragePercent?: number
  uniqueEvidenceFileCount?: number
  citedEvidenceFileCount?: number
  primaryEvidenceCount?: number
  citedPrimaryEvidenceCount?: number
  uncitedPrimaryEvidenceCount?: number
  primaryEvidenceFileCount?: number
  citedPrimaryEvidenceFileCount?: number
  uncitedPrimaryEvidenceFileCount?: number
  contextEvidenceCount?: number
  citedContextEvidenceCount?: number
  uncitedContextEvidenceCount?: number
  contextEvidenceFileCount?: number
  citedContextEvidenceFileCount?: number
  uncitedContextEvidenceFileCount?: number
  requiredEvidenceCount?: number
  citedRequiredEvidenceCount?: number
  requiredEvidenceFileCount?: number
  citedRequiredEvidenceFileCount?: number
  requiredEvidenceCoveragePercent?: number
  coverageScope?: 'PRIMARY' | 'ALL' | string
  evidenceRoleDistribution?: CodeQaEvidenceRoleDistribution
  status?: 'FULL' | 'REQUIRED_FULL' | 'PARTIAL' | 'NONE' | 'NO_EVIDENCE' | string
}

export interface CodeQaEvidenceRoleDistribution {
  status?: 'NO_EVIDENCE' | 'PRIMARY_SINGLE_FILE' | 'PRIMARY_CROSS_FILE' | 'MIXED_PRIMARY_CONTEXT' | 'CONTEXT_ONLY' | 'UNKNOWN_ROLE_PRESENT' | string
  totalFileCount?: number
  citedFileCount?: number
  primaryFileCount?: number
  citedPrimaryFileCount?: number
  contextFileCount?: number
  citedContextFileCount?: number
  roles?: CodeQaEvidenceRoleStat[]
  files?: CodeQaEvidenceFileStat[]
}

export interface CodeQaEvidenceRoleStat {
  role?: 'PRIMARY' | 'ADJACENT_CONTEXT' | 'UNKNOWN' | string
  evidenceCount?: number
  citedEvidenceCount?: number
  fileCount?: number
  citedFileCount?: number
}

export interface CodeQaEvidenceFileStat {
  filePath?: string
  primaryEvidenceCount?: number
  citedPrimaryEvidenceCount?: number
  contextEvidenceCount?: number
  citedContextEvidenceCount?: number
}

export interface CodeQaClaimCitationCoverage {
  totalClaimCount?: number
  requiredClaimCount?: number
  citedRequiredClaimCount?: number
  uncitedRequiredClaimCount?: number
  invalidCitationClaimCount?: number
  claimCoveragePercent?: number
  validCitationFileCount?: number
  requiredClaimCitationFileCount?: number
  status?: 'READY' | 'REVIEW' | 'BLOCKED' | string
  readyForRepair?: boolean
  readinessReason?: string
  readinessNote?: string
  validCitationFiles?: string[]
  requiredClaimCitationFiles?: string[]
  roleDistribution?: CodeQaClaimRoleDistribution
  claims?: CodeQaClaimCitation[]
}

export interface CodeQaClaimCitation {
  claimId?: string
  claimTextPreview?: string
  required?: boolean
  sourceLabels?: string[]
  validSourceLabels?: string[]
  invalidSourceLabels?: string[]
  validSourceFiles?: string[]
  validSourceRoles?: string[]
  primarySourceFiles?: string[]
  contextSourceFiles?: string[]
  status?: 'CITED' | 'UNCITED' | 'INVALID' | 'OPTIONAL' | string
}

export interface CodeQaClaimRoleDistribution {
  status?: 'PRIMARY_BOUND' | 'MIXED_CONTEXT' | 'CONTEXT_ONLY' | 'UNKNOWN_ROLE_PRESENT' | 'REVIEW_UNCITED' | 'BLOCKED_INVALID' | 'NO_REQUIRED_CLAIMS' | string
  requiredClaimCount?: number
  requiredPrimaryBoundClaimCount?: number
  requiredContextOnlyClaimCount?: number
  requiredUnknownOnlyClaimCount?: number
  unbackedRequiredClaimCount?: number
  invalidRequiredClaimCount?: number
  validCitationFileCount?: number
  requiredClaimCitationFileCount?: number
  primaryFileCount?: number
  requiredPrimaryFileCount?: number
  contextFileCount?: number
  requiredContextFileCount?: number
  unknownFileCount?: number
  requiredUnknownFileCount?: number
  roles?: CodeQaClaimRoleStat[]
  files?: CodeQaClaimFileStat[]
}

export interface CodeQaClaimRoleStat {
  role?: 'PRIMARY' | 'ADJACENT_CONTEXT' | 'UNKNOWN' | string
  claimCount?: number
  requiredClaimCount?: number
  fileCount?: number
  requiredFileCount?: number
}

export interface CodeQaClaimFileStat {
  filePath?: string
  primaryClaimCount?: number
  requiredPrimaryClaimCount?: number
  contextClaimCount?: number
  requiredContextClaimCount?: number
  unknownClaimCount?: number
  requiredUnknownClaimCount?: number
  requiredClaimCount?: number
}

export interface CodeQaCitation {
  citationId?: string
  sourceLabel?: string
  chunkId?: number | null
  scanTaskId?: number | null
  filePath?: string | null
  startLine?: number | null
  endLine?: number | null
  evidenceType?: string | null
  evidenceReason?: string | null
  relevanceScore?: number | null
  contextRole?: string | null
  contextDistance?: number | null
  citedByAnswer?: boolean | null
}

export interface CodeQaEvidenceRef {
  category?: string
  source?: string
  title?: string
  summary?: string
  filePath?: string
  lineNumber?: string
  startLine?: number | null
  endLine?: number | null
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
  codeQa: (projectId: number, question: string, scanTaskId?: number | null, evidenceRef?: CodeQaEvidenceRef | null) =>
    client.post<Result<CodeQaResponse>>(`/projects/${projectId}/qa`, {
      question,
      ...(scanTaskId ? { scanTaskId } : {}),
      ...(evidenceRef ? { evidenceRef } : {}),
    }, { timeout: 300_000 }),
}
