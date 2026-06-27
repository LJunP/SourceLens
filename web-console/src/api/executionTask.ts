import client from './client'
import type { Result } from './client'

export interface ExecutionTask {
  id: number
  projectId: number
  repositoryId: number | null
  taskType: string
  sourceType: string | null
  sourceId: number | null
  status: string
  currentStep: string | null
  currentAttemptId: number | null
  progress: number
  errorMessage: string | null
  createdBy: number
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutionStep {
  id: number
  taskId: number
  attemptId: number | null
  stepKey: string
  stepName: string
  status: string
  logSummary: string | null
  errorMessage: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutionAttempt {
  id: number
  taskId: number
  attemptNo: number
  status: string
  currentStep: string | null
  errorMessage: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutionLog {
  id: number
  taskId: number
  attemptId: number | null
  stepKey: string | null
  level: string
  message: string
  createdAt: string
}

export interface ExecutionTaskDetail {
  task: ExecutionTask
  attempts: ExecutionAttempt[]
  steps: ExecutionStep[]
  logs: ExecutionLog[]
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const executionTaskApi = {
  list: (projectId: number, page = 1, pageSize = 20) =>
    client.get<Result<PageResult<ExecutionTask>>>(`/projects/${projectId}/execution-tasks`, {
      params: { page, pageSize },
    }),

  detail: (projectId: number, taskId: number) =>
    client.get<Result<ExecutionTaskDetail>>(`/projects/${projectId}/execution-tasks/${taskId}`),

  detailBySource: (projectId: number, sourceType: string, sourceId: number) =>
    client.get<Result<ExecutionTaskDetail>>(`/projects/${projectId}/execution-tasks/source/${sourceType}/${sourceId}`),

  cancel: (projectId: number, taskId: number) =>
    client.post<Result<ExecutionTaskDetail>>(`/projects/${projectId}/execution-tasks/${taskId}/cancel`),
}
