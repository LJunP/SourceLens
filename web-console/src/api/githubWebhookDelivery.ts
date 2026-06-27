import client from './client'
import type { Result } from './client'
import type { PageResult } from './audit'

export interface GitHubWebhookDelivery {
  id: number
  deliveryId: string
  eventType: string
  status: string
  resultJson: string | null
  createdAt: string
  updatedAt: string
}

export interface GitHubWebhookDeliveryQuery {
  page?: number
  pageSize?: number
  eventType?: string
  status?: string
}

export const githubWebhookDeliveryApi = {
  listProjectDeliveries: (projectId: number, params?: GitHubWebhookDeliveryQuery) =>
    client.get<Result<PageResult<GitHubWebhookDelivery>>>(
      `/projects/${projectId}/github-webhook-deliveries`,
      { params }
    ),
}
