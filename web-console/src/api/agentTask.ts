import client from './client'
import type { Result } from './client'

export interface AgentTask {
  id: number
  scanTaskId: number | null
  conversationId: number | null
  projectId: number
  taskType: string
  title: string
  description: string | null
  status: string
  priority: string
  inputJson: string | null
  outputJson: string | null
  summary: string | null
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface AgentTaskStep {
  id: number
  taskId: number
  stepOrder: number
  stepType: string
  toolName: string | null
  description: string | null
  inputJson: string | null
  outputJson: string | null
  status: string
  errorMessage: string | null
  durationMs: number | null
  createdAt: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const agentTaskApi = {
  create: (data: {
    projectId: number
    scanTaskId?: number
    taskType: string
    title: string
    description?: string
    priority?: string
    inputJson?: string
  }) => client.post<Result<AgentTask>>('/agent-tasks', data),

  listByProject: (projectId: number, page = 1, pageSize = 20, status?: string, scanTaskId?: number) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (status) params.set('status', status)
    if (scanTaskId) params.set('scanTaskId', String(scanTaskId))
    return client.get<Result<PageResult<AgentTask>>>(`/projects/${projectId}/agent-tasks?${params}`)
  },

  detail: (taskId: number) =>
    client.get<Result<AgentTask>>(`/agent-tasks/${taskId}`),

  start: (taskId: number) =>
    client.post<Result<AgentTask>>(`/agent-tasks/${taskId}/start`),

  complete: (taskId: number, data: { outputJson?: string; summary?: string; status?: string }) =>
    client.post<Result<AgentTask>>(`/agent-tasks/${taskId}/complete`, data),

  cancel: (taskId: number) =>
    client.post<Result<AgentTask>>(`/agent-tasks/${taskId}/cancel`),

  listSteps: (taskId: number) =>
    client.get<Result<AgentTaskStep[]>>(`/agent-tasks/${taskId}/steps`),

  addStep: (taskId: number, data: { stepType: string; toolName?: string; description?: string; inputJson?: string }) =>
    client.post<Result<AgentTaskStep>>(`/agent-tasks/${taskId}/steps`, data),

  updateStep: (stepId: number, data: { outputJson?: string; status?: string; errorMessage?: string; durationMs?: number }) =>
    client.patch<Result<AgentTaskStep>>(`/agent-steps/${stepId}`, data),
}
