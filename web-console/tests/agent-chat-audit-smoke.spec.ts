import { expect, test, type Page, type Route } from '@playwright/test'

const projectId = 1
const conversationId = 77
const scanTaskId = 501
const toolCallId = 901

const project = {
  id: projectId,
  name: 'AgentChat Audit Smoke',
  description: 'Mocked project for AgentChat audit smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 88,
  createdBy: 1,
  createdAt: '2026-06-30T09:00:00Z',
}

const conversation = {
  id: conversationId,
  projectId,
  agentTaskId: null,
  title: '审计证据对话',
  systemPrompt: null,
  status: 'ACTIVE',
  createdBy: 1,
  createdAt: '2026-06-30T09:00:00Z',
  updatedAt: '2026-06-30T09:03:00Z',
}

const assistantMessage = {
  id: 7001,
  conversationId,
  role: 'ASSISTANT',
  content: '已经读取 Controller 并定位到主要入口。',
  toolCallsJson: JSON.stringify([
    {
      id: 'call_read_1',
      function: {
        name: 'read_file',
        arguments: JSON.stringify({ path: 'src/main/java/demo/ChatController.java' }),
      },
    },
  ]),
  toolResultsJson: JSON.stringify([
    {
      tool_call_id: 'call_read_1',
      content: 'class ChatController { /* mocked */ }',
      success: true,
    },
  ]),
  modelName: 'mock',
  tokensUsed: 120,
  durationMs: 320,
  status: 'COMPLETED',
  errorMessage: null,
  createdAt: '2026-06-30T09:03:00Z',
}

const toolCall = {
  id: toolCallId,
  conversationId,
  projectId,
  scanTaskId,
  toolName: 'read_file',
  permissionLevel: 'READ_ONLY',
  argumentsJson: JSON.stringify({ path: 'src/main/java/demo/ChatController.java' }),
  resultSummary: '读取了 ChatController.java',
  success: true,
  errorMessage: null,
  durationMs: 18,
  createdBy: 1,
  createdAt: '2026-06-30T09:02:59Z',
}

function result<T>(data: T) {
  return {
    code: 'SUCCESS',
    message: 'OK',
    data,
  }
}

async function fulfillJson(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(data),
  })
}

async function installAgentChatAuditMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const toolQueries: string[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'agent-chat-audit-smoke-token')
  })

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    if (!path.startsWith('/api/')) {
      await route.continue()
      return
    }

    if (method === 'GET' && path === '/api/auth/me') {
      await fulfillJson(route, result({ id: 1, username: 'agent_chat_smoke', email: 'smoke@local.test', status: 'ACTIVE' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/conversations`) {
      await fulfillJson(route, result({ items: [conversation], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${conversationId}`) {
      await fulfillJson(route, result({ conversation, messages: [assistantMessage] }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/audit-logs`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/agent-tool-calls`) {
      toolQueries.push(url.search)
      await fulfillJson(route, result({ items: [toolCall], page: 1, pageSize: 20, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/github-webhook-deliveries`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(result(null)),
    })
  })

  return {
    toolQueries,
    unhandledApiRequests,
  }
}

test('AgentChat tool evidence deep-links to AuditLogs by conversationId', async ({ page }) => {
  const network = await installAgentChatAuditMocks(page)
  await page.goto(`/agent-chat/${conversationId}`)
  const baseURLHost = new URL(page.url()).hostname

  await expect(page.getByText('本轮证据')).toBeVisible()
  await expect(page.getByText('读取 1 个文件，工具 1 次，0 个失败')).toBeVisible()
  await page.getByRole('button', { name: '查看审计' }).click()

  await expect(page).toHaveURL(new RegExp(`/audit-logs\\?projectId=${projectId}&conversationId=${conversationId}$`))
  await expect(page.getByRole('tab', { name: 'Agent 工具调用' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('对话 ID')).toHaveValue(String(conversationId))
  await expect(page.getByText('read_file').first()).toBeVisible()

  const latestToolQuery = network.toolQueries.at(-1) || ''
  expect(latestToolQuery, 'Agent tool-call query did not include conversationId.').toContain(`conversationId=${conversationId}`)
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in AgentChat audit smoke.').toEqual([])

  console.log('AGENT_CHAT_AUDIT_SMOKE_OK', JSON.stringify({
    projectId,
    conversationId,
    toolCallId,
    deepLink: true,
    conversationFilter: true,
    unhandledApiRequests: network.unhandledApiRequests.length,
    mockedApiOnly: true,
    baseURLHost,
    spec: 'agent-chat-audit-smoke.spec.ts',
  }))
})
