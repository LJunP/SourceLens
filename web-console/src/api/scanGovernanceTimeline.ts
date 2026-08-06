import client from './client'
import type { Result } from './client'
import type { AgentTask } from './agentTask'
import type { AgentToolCall } from './agentToolCall'
import type { ArtifactRecord } from './artifact'
import type { AuditLog } from './audit'
import type { AutoRepair } from './autoRepair'
import type { ExecutionTaskDetail } from './executionTask'

export interface GovernanceSummary {
  status: string
  counts: Record<string, number>
  hasErrors: boolean
  attributionGapCount: number
}

export interface GovernanceLimitInfo {
  limit: number
  total: number
  returned: number
  truncated: boolean
}

export interface GovernanceResourceRef {
  type: string | null
  id: number | null
  projectId: number | null
  repositoryId: number | null
  scanTaskId: number | null
}

export interface GovernanceAttribution {
  mode: string
  confidence: string
  reason: string
}

export interface GovernanceActionTarget {
  type: string
  id: number | null
  url: string | null
}

export interface GovernanceEvent {
  id: string
  eventType: string
  title: string
  detail: string | null
  status: string | null
  tone: string | null
  occurredAt: string | null
  resource: GovernanceResourceRef | null
  source: GovernanceResourceRef | null
  attribution: GovernanceAttribution | null
  errorMessage: string | null
  actionTarget: GovernanceActionTarget | null
  repairEvidenceGate?: 'READY' | 'REVIEW' | 'BLOCKED' | string | null
  repairEvidenceGateReason?: string | null
  repairEvidenceGateSource?: string | null
}

export interface GovernanceAttributionGap {
  resourceType: string
  resourceId: number | null
  reason: string
}

export interface GovernanceResources {
  artifacts: ArtifactRecord[]
  scanExecution: ExecutionTaskDetail | null
  repairExecutions: ExecutionTaskDetail[]
  agentExecutions: ExecutionTaskDetail[]
  autoRepairs: AutoRepair[]
  agentTasks: AgentTask[]
  agentToolCalls: AgentToolCall[]
  auditLogs: AuditLog[]
}

export interface ScanGovernanceTimelineResponse {
  projectId: number
  repositoryId: number
  scanTaskId: number
  scanStatus: string
  generatedAt: string
  summary: GovernanceSummary
  resources: GovernanceResources
  events: GovernanceEvent[]
  limits: Record<string, GovernanceLimitInfo>
  truncated: boolean
  warnings: string[]
  attributionGaps: GovernanceAttributionGap[]
}

export const scanGovernanceTimelineApi = {
  get: (projectId: number, scanTaskId: number) =>
    client.get<Result<ScanGovernanceTimelineResponse>>(
      `/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`,
    ),
}
