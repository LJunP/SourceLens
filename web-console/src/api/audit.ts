import client from './client'
import type { Result } from './client'

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface AuditLog {
  id: number
  userId: number | null
  projectId: number | null
  resourceType: string | null
  resourceId: number | null
  action: string
  status: string
  inputJson: string | null
  outputSummary: string | null
  durationMs: number | null
  requestId: string | null
  createdAt: string
}

export interface AuditLogQuery {
  page?: number
  pageSize?: number
  auditLogId?: number
  resourceType?: string
  resourceId?: number
  action?: string
  status?: string
}

export const auditApi = {
  listProjectLogs: (projectId: number, params?: AuditLogQuery) =>
    client.get<Result<PageResult<AuditLog>>>(`/projects/${projectId}/audit-logs`, { params }),
}
