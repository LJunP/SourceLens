import client from './client'
import type { Result } from './client'

export interface LlmConfig {
  id: number
  provider: string
  modelName: string
  apiKey: string
  baseUrl: string
  temperature: number | null
  maxTokens: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LlmConfigRequest {
  provider: string
  modelName: string
  apiKey?: string
  baseUrl: string
  temperature?: number
  maxTokens?: number
}

const PROVIDER_PRESETS: Record<string, { baseUrl: string; models: string[] }> = {
  OPENAI: {
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  ANTHROPIC: {
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  },
  DEEPSEEK: {
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  CUSTOM: {
    baseUrl: '',
    models: [],
  },
}

export { PROVIDER_PRESETS }

export const llmConfigApi = {
  list: () =>
    client.get<Result<LlmConfig[]>>('/llm-configs'),

  getActive: () =>
    client.get<Result<LlmConfig>>('/llm-configs/active'),

  create: (data: LlmConfigRequest) =>
    client.post<Result<LlmConfig>>('/llm-configs', data),

  update: (configId: number, data: LlmConfigRequest) =>
    client.put<Result<LlmConfig>>(`/llm-configs/${configId}`, data),

  activate: (configId: number) =>
    client.post<Result<LlmConfig>>(`/llm-configs/${configId}/activate`),

  delete: (configId: number) =>
    client.delete<Result<void>>(`/llm-configs/${configId}`),
}
