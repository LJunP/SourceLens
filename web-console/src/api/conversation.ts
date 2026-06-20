import client from './client'
import type { Result } from './client'

export interface Conversation {
  id: number
  projectId: number
  agentTaskId: number | null
  title: string
  systemPrompt: string | null
  status: string
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  id: number
  conversationId: number
  role: string // USER / ASSISTANT / SYSTEM / TOOL
  content: string | null
  toolCallsJson: string | null
  toolResultsJson: string | null
  modelName: string | null
  tokensUsed: number | null
  durationMs: number | null
  status: string
  errorMessage: string | null
  createdAt: string
}

export interface ConversationDetail {
  conversation: Conversation
  messages: ConversationMessage[]
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export const conversationApi = {
  create: (projectId: number, data?: { title?: string; systemPrompt?: string }) =>
    client.post<Result<Conversation>>(`/projects/${projectId}/conversations`, data || {}),

  list: (projectId: number, page = 1, pageSize = 20) =>
    client.get<Result<PageResult<Conversation>>>(`/projects/${projectId}/conversations?page=${page}&pageSize=${pageSize}`),

  detail: (id: number) =>
    client.get<Result<ConversationDetail>>(`/conversations/${id}`),

  delete: (id: number) =>
    client.delete<Result<void>>(`/conversations/${id}`),
}

/**
 * 发送消息并建立 SSE 连接。
 * 返回 EventSource 的手动 fetch 版本，支持 POST body。
 * 调用方需要自行处理 SSE 事件流。
 */
export function sendMessageSSE(
  conversationId: number,
  message: string,
  token: string,
  handlers: {
    onContent?: (content: string) => void
    onToolCall?: (data: { id: string; name: string; arguments: Record<string, unknown> }) => void
    onToolResult?: (data: { id: string; name: string; success: boolean; content: string }) => void
    onThinking?: (data: { round: number }) => void
    onDone?: (data: { tokensUsed: number; durationMs: number }) => void
    onError?: (error: string) => void
  }
): AbortController {
  const controller = new AbortController()

  fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
    signal: controller.signal,
  }).then(async (response) => {
    if (!response.ok) {
      const text = await response.text()
      handlers.onError?.(`请求失败: ${response.status} ${text}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      handlers.onError?.('无法读取响应流')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let eventName = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim()
          if (!dataStr) continue
          try {
            const data = JSON.parse(dataStr)
            switch (eventName) {
              case 'content':
                handlers.onContent?.(data.content)
                break
              case 'tool_call':
                handlers.onToolCall?.(data)
                break
              case 'tool_result':
                handlers.onToolResult?.(data)
                break
              case 'thinking':
                handlers.onThinking?.(data)
                break
              case 'done':
                handlers.onDone?.(data)
                break
              case 'error':
                handlers.onError?.(data.error)
                break
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }
    }
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      handlers.onError?.(err.message)
    }
  })

  return controller
}