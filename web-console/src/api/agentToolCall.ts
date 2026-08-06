import client from './client'
import type { Result } from './client'
import type { PageResult } from './audit'

export interface AgentToolCall {
  id: number
  conversationId: number | null
  projectId: number | null
  scanTaskId: number | null
  toolName: string
  permissionLevel: string
  argumentsJson: string | null
  resultSummary: string | null
  success: boolean
  errorMessage: string | null
  durationMs: number | null
  createdBy: number | null
  createdAt: string
}

export interface AgentToolCallQuery {
  page?: number
  pageSize?: number
  toolName?: string
  conversationId?: number
  scanTaskId?: number
  success?: boolean
}

export const agentToolCallApi = {
  listProjectCalls: (projectId: number, params?: AgentToolCallQuery) =>
    client.get<Result<PageResult<AgentToolCall>>>(`/projects/${projectId}/agent-tool-calls`, { params }),
}
