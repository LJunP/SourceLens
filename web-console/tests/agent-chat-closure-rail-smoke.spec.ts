import { expect, test, type Page, type Route } from '@playwright/test'

const projectId = 1
const conversationId = 77
const agentTaskId = 101
const handoffAgentTaskId = 202
const secondaryConversationId = 78
const handoffConversationId = 79
const errorConversationId = 80
const loadingConversationId = 81
const taskErrorConversationId = 82
const missingTaskConversationId = 83
const noScanConversationId = 84
const loadingAgentTaskId = 301
const taskErrorAgentTaskId = 302
const missingAgentTaskId = 303
const noScanAgentTaskId = 304
const scanTaskId = 501
const toolCallId = 901
const rawAgentChatTitleSecret = 'Bearer agent-chat-title-secret-20260704'
const agentChatTitleSafeMarker = 'AGENT_CHAT_TITLE_SAFE_MARKER_20260704'
const rawAgentChatHandoffPathSecret = 'sk-agentchathandoffpath20260704secret'
const rawAgentChatApiErrorSecret = 'agent-chat-api-error-password-secret-20260704'
const agentChatApiErrorSafeMarker = 'AGENT_CHAT_API_ERROR_SAFE_MARKER_20260704'
const rawHandoffFilePath = `src/main/java/demo/${rawAgentChatHandoffPathSecret}/ChatController.java`
const handoffFilePath = 'src/main/java/demo/[REDACTED]/ChatController.java'
const rawHandoffLineRef = `${rawHandoffFilePath}:12-36`
const handoffLineRef = `${handoffFilePath}:12-36`
const rawSecretSentinel = 'sl_raw_secret_agent_tool_call_sentinel_20260703'
const redactedSecretLabel = '[REDACTED]'
const agentChatMessageSafeMarker = 'AGENT_CHAT_MESSAGE_SAFE_MARKER_20260704'
const agentChatErrorSafeMarker = 'AGENT_CHAT_ERROR_SAFE_MARKER_20260704'
const rawAgentChatAuthorizationSecret = 'Authorization: Bearer agent-chat-message-bearer-secret-20260704'
const rawAgentChatBearerSecret = 'Bearer agent-chat-error-bearer-secret-20260704'
const rawAgentChatApiKeySecret = 'sk-agentchatmessage20260704secret'
const rawAgentChatJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZ2VudENoYXQifQ.signatureagentchat20260704'
const rawAgentChatPasswordSecret = 'agent-chat-message-password-secret-20260704'
const forbiddenAgentChatMessageSecrets = [
  rawAgentChatAuthorizationSecret,
  rawAgentChatBearerSecret,
  rawAgentChatApiKeySecret,
  rawAgentChatJwtSecret,
  rawAgentChatPasswordSecret,
]
const forbiddenAgentChatTitleSecrets = [rawAgentChatTitleSecret]
const forbiddenAgentChatHandoffSecrets = [rawAgentChatHandoffPathSecret, rawHandoffFilePath, rawHandoffLineRef]
const forbiddenAgentChatApiErrorSecrets = [rawAgentChatApiErrorSecret]

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'AgentChat Closure Rail Smoke',
  description: 'Mocked project for AgentChat closure rail smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 88,
  createdBy: 1,
  createdAt: '2026-07-01T09:00:00Z',
}

const linkedConversation = {
  id: conversationId,
  projectId,
  agentTaskId,
  title: `闭环证据对话 ${agentChatTitleSafeMarker} ${rawAgentChatTitleSecret}`,
  systemPrompt: null,
  status: 'ACTIVE',
  createdBy: 1,
  createdAt: '2026-07-01T09:00:00Z',
  updatedAt: '2026-07-01T09:03:00Z',
}

const unboundConversation = {
  ...linkedConversation,
  id: secondaryConversationId,
  agentTaskId: null,
  title: '未绑定任务对话',
}

const handoffConversation = {
  ...unboundConversation,
  id: handoffConversationId,
  title: '代码理解：C1 ChatController.java:12-36',
}

const handoffBoundConversation = {
  ...handoffConversation,
  agentTaskId: handoffAgentTaskId,
}

const loadingConversation = {
  ...linkedConversation,
  id: loadingConversationId,
  agentTaskId: loadingAgentTaskId,
  title: '加载中任务闭环',
}

const taskErrorConversation = {
  ...linkedConversation,
  id: taskErrorConversationId,
  agentTaskId: taskErrorAgentTaskId,
  title: '任务详情失败闭环',
}

const missingTaskConversation = {
  ...linkedConversation,
  id: missingTaskConversationId,
  agentTaskId: missingAgentTaskId,
  title: '任务详情空返回闭环',
}

const noScanConversation = {
  ...linkedConversation,
  id: noScanConversationId,
  agentTaskId: noScanAgentTaskId,
  title: '未绑定扫描任务闭环',
}

const assistantMessage = {
  id: 7001,
  conversationId,
  role: 'ASSISTANT',
  content: [
    '已经读取 Controller 并定位到主要入口。',
    agentChatMessageSafeMarker,
    rawAgentChatAuthorizationSecret,
    `apiKey=${rawAgentChatApiKeySecret}`,
    rawAgentChatJwtSecret,
  ].join(' '),
  toolCallsJson: JSON.stringify([
    {
      id: 'call_read_1',
      function: {
        name: 'read_file',
        arguments: JSON.stringify({
          path: 'src/main/java/demo/ChatController.java',
          authorization: `Bearer ${rawSecretSentinel}`,
          nested: {
            apiKey: rawSecretSentinel,
            api_key: rawSecretSentinel,
            secret: rawSecretSentinel,
            password: rawSecretSentinel,
            privateKey: rawSecretSentinel,
            private_key: rawSecretSentinel,
            accessToken: rawSecretSentinel,
            access_token: rawSecretSentinel,
            refreshToken: rawSecretSentinel,
            refresh_token: rawSecretSentinel,
          },
          rawLine: `token=${rawSecretSentinel}`,
        }),
      },
    },
    {
      id: 'call_plain_1',
      function: {
        name: 'plain_secret_probe',
        arguments: `bearer=${rawSecretSentinel} password=${rawSecretSentinel} visible=ok`,
      },
    },
  ]),
  toolResultsJson: JSON.stringify([
    {
      tool_call_id: 'call_read_1',
      content: JSON.stringify({
        output: 'class ChatController { /* mocked */ }',
        accessToken: rawSecretSentinel,
        refreshToken: rawSecretSentinel,
        privateKey: rawSecretSentinel,
        private_key: rawSecretSentinel,
        authorization: `Bearer ${rawSecretSentinel}`,
      }),
      success: true,
    },
    {
      tool_call_id: 'call_plain_1',
      content: `plain result apiKey=${rawSecretSentinel}\nsecret: ${rawSecretSentinel}\nAuthorization: Bearer ${rawSecretSentinel}`,
      success: true,
    },
  ]),
  modelName: 'mock',
  tokensUsed: 120,
  durationMs: 320,
  status: 'COMPLETED',
  errorMessage: `${agentChatErrorSafeMarker} ${rawAgentChatBearerSecret} password=${rawAgentChatPasswordSecret}`,
  createdAt: '2026-07-01T09:03:00Z',
}

const agentTask = {
  id: agentTaskId,
  scanTaskId,
  conversationId,
  projectId,
  taskType: 'ARCHITECTURE_REVIEW',
  title: '架构审查 - Controller 边界',
  description: '复核 Controller 风险和扫描证据。',
  status: 'COMPLETED',
  priority: 'HIGH',
  inputJson: null,
  outputJson: null,
  summary: 'Controller 边界清晰，建议复核工具审计。',
  startedAt: '2026-07-01T09:01:00Z',
  finishedAt: '2026-07-01T09:02:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-07-01T09:00:00Z',
  updatedAt: '2026-07-01T09:02:00Z',
}

const handoffAgentTask = {
  ...agentTask,
  id: handoffAgentTaskId,
  conversationId: handoffConversationId,
  taskType: 'CUSTOM',
  title: '代码理解：C1 src/main/java/demo/ChatController.java:12-36',
  description: '由 Project QA 代码理解证据交接创建的受控 AgentTask 草稿。',
  status: 'PENDING',
  priority: 'MEDIUM',
  inputJson: JSON.stringify({
    handoffType: 'CODE_UNDERSTANDING',
    source: 'PROJECT_QA_CODE_UNDERSTANDING_LENS',
    inputKind: 'FILE_LINE',
    inputLabel: '文件行号',
    sourceLabel: 'C1',
    filePath: handoffFilePath,
    lineRef: handoffLineRef,
    contextRole: 'PRIMARY',
    evidenceType: 'CONTROLLER',
    relevanceScore: '91',
    rawPromptStored: false,
    rawStackStored: false,
    autoSent: false,
    autoStarted: false,
  }),
  outputJson: null,
  summary: null,
  startedAt: null,
  finishedAt: null,
}

const noScanAgentTask = {
  ...agentTask,
  id: noScanAgentTaskId,
  conversationId: noScanConversationId,
  scanTaskId: null,
  title: '未绑定扫描报告的 AgentTask',
}

const agentTaskSteps = [
  {
    id: 1,
    taskId: agentTaskId,
    stepOrder: 1,
    stepType: 'READ_CODE',
    toolName: 'read_file',
    description: '读取 Controller 文件',
    inputJson: null,
    outputJson: null,
    status: 'COMPLETED',
    errorMessage: null,
    durationMs: 28,
    createdAt: '2026-07-01T09:01:00Z',
  },
]

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
  createdAt: '2026-07-01T09:02:59Z',
}

const scanTask = {
  id: scanTaskId,
  projectId,
  repositoryId: 11,
  branch: 'main',
  commitSha: 'agent-chat-scan-click-sha',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-07-01T09:00:00Z',
  finishedAt: '2026-07-01T09:02:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-07-01T09:00:00Z',
}

const scanExecutionDetail = {
  task: {
    id: 701,
    projectId,
    repositoryId: 11,
    taskType: 'SCAN',
    sourceType: 'SCAN_TASK',
    sourceId: scanTaskId,
    status: 'SUCCESS',
    currentStep: 'report',
    currentAttemptId: 9001,
    progress: 100,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-07-01T09:00:00Z',
    finishedAt: '2026-07-01T09:02:00Z',
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-01T09:02:00Z',
  },
  attempts: [],
  steps: [],
  logs: [],
}

const scanCodeChunkStatus = {
  scanTaskId,
  query: '',
  limit: 1,
  total: 1,
  resultCount: 1,
  totalChunks: 12,
  embeddedChunks: 12,
  truncated: false,
  retrievalMode: 'STATUS',
  evidenceProfile: null,
  items: [{
    id: 8801,
    citationId: 'C1',
    sourceLabel: 'C1',
    scanTaskId,
    filePath: 'src/main/java/demo/ChatController.java',
    startLine: 12,
    endLine: 36,
    content: 'class ChatController {}',
    contentPreview: 'class ChatController {}',
    hasEmbedding: true,
    matchedTerms: [],
    relevanceScore: 0.91,
    evidenceType: 'CONTROLLER',
    evidenceReason: 'smoke',
    contextRole: 'PRIMARY',
    contextDistance: 0,
  }],
}

const scanGovernanceTimeline = {
  projectId,
  repositoryId: 11,
  scanTaskId,
  scanStatus: 'SUCCESS',
  generatedAt: '2026-07-01T09:02:30Z',
  summary: {
    status: 'HEALTHY',
    counts: {},
    hasErrors: false,
    attributionGapCount: 0,
  },
  resources: {
    artifacts: [],
    scanExecution: scanExecutionDetail,
    repairExecutions: [],
    agentExecutions: [],
    autoRepairs: [],
    agentTasks: [agentTask],
    agentToolCalls: [toolCall],
    auditLogs: [],
  },
  events: [],
  limits: {},
  truncated: false,
  warnings: [],
  attributionGaps: [],
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

async function installClosureRailMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const agentTaskDetailRequests: number[] = []
  const agentTaskStepRequests: number[] = []
  const toolQueries: string[] = []
  const agentTaskCreates: Array<Record<string, unknown>> = []
  const messageRequests: Array<{ path: string; body: Record<string, unknown> }> = []
  const agentTaskStartRequests: string[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'agent-chat-closure-rail-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'agent_chat_closure_smoke', email: 'closure@local.test', status: 'ACTIVE' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/conversations`) {
      await fulfillJson(route, result({
        items: [
          handoffBoundConversation,
          linkedConversation,
          unboundConversation,
          loadingConversation,
          taskErrorConversation,
          missingTaskConversation,
          noScanConversation,
        ],
        page: 1,
        pageSize: 100,
        total: 7,
      }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${conversationId}`) {
      await fulfillJson(route, result({ conversation: linkedConversation, messages: [assistantMessage] }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${secondaryConversationId}`) {
      await fulfillJson(route, result({ conversation: unboundConversation, messages: [] }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${handoffConversationId}`) {
      await fulfillJson(route, result({ conversation: handoffBoundConversation, messages: [] }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${loadingConversationId}`) {
      await fulfillJson(route, result({ conversation: loadingConversation, messages: [] }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${taskErrorConversationId}`) {
      await fulfillJson(route, result({ conversation: taskErrorConversation, messages: [] }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${missingTaskConversationId}`) {
      await fulfillJson(route, result({ conversation: missingTaskConversation, messages: [] }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${noScanConversationId}`) {
      await fulfillJson(route, result({ conversation: noScanConversation, messages: [] }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${errorConversationId}`) {
      await route.fulfill({
        status: 500,
        headers: {
          'x-request-id': 'req_agent_chat_error_redaction',
        },
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 'INTERNAL_ERROR',
          message: `${agentChatApiErrorSafeMarker} Authorization: Bearer ${rawAgentChatApiErrorSecret} password=${rawAgentChatApiErrorSecret}`,
          data: null,
        }),
      })
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/conversations`) {
      await fulfillJson(route, result(handoffConversation))
      return
    }

    if (method === 'POST' && path === '/api/agent-tasks') {
      const body = JSON.parse(request.postData() || '{}') as Record<string, unknown>
      agentTaskCreates.push(body)
      await fulfillJson(route, result(handoffAgentTask))
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${agentTaskId}`) {
      agentTaskDetailRequests.push(agentTaskId)
      await fulfillJson(route, result(agentTask))
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${handoffAgentTaskId}`) {
      agentTaskDetailRequests.push(handoffAgentTaskId)
      await fulfillJson(route, result(handoffAgentTask))
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${loadingAgentTaskId}`) {
      agentTaskDetailRequests.push(loadingAgentTaskId)
      await new Promise(resolve => setTimeout(resolve, 3000))
      await fulfillJson(route, result({ ...agentTask, id: loadingAgentTaskId, conversationId: loadingConversationId }))
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${taskErrorAgentTaskId}`) {
      agentTaskDetailRequests.push(taskErrorAgentTaskId)
      await route.fulfill({
        status: 500,
        headers: {
          'x-request-id': 'req_agent_chat_task_error_gate',
        },
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 'INTERNAL_ERROR',
          message: 'Agent task detail unavailable for gate smoke',
          data: null,
        }),
      })
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${missingAgentTaskId}`) {
      agentTaskDetailRequests.push(missingAgentTaskId)
      await fulfillJson(route, result(null))
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${noScanAgentTaskId}`) {
      agentTaskDetailRequests.push(noScanAgentTaskId)
      await fulfillJson(route, result(noScanAgentTask))
      return
    }

    if (method === 'POST' && path === `/api/agent-tasks/${handoffAgentTaskId}/start`) {
      agentTaskStartRequests.push(path)
      await fulfillJson(route, result({ ...handoffAgentTask, status: 'RUNNING' }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/agent-tasks`) {
      await fulfillJson(route, result({ items: [handoffAgentTask, agentTask], page: 1, pageSize: 20, total: 2 }))
      return
    }

    if (method === 'GET' && path === `/api/agent-tasks/${agentTaskId}/steps`) {
      agentTaskStepRequests.push(agentTaskId)
      await fulfillJson(route, result(agentTaskSteps))
      return
    }

    if (method === 'POST' && path === `/api/conversations/${handoffConversationId}/messages`) {
      const body = JSON.parse(request.postData() || '{}') as Record<string, unknown>
      messageRequests.push({ path, body })
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: [
          `event: content`,
          `data: ${JSON.stringify({ content: '已收到代码理解交接问题。' })}`,
          '',
          `event: done`,
          `data: ${JSON.stringify({ tokensUsed: 12, durationMs: 20 })}`,
          '',
          '',
        ].join('\n'),
      })
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

    if (method === 'GET' && path === `/api/scan-tasks/${scanTaskId}`) {
      await fulfillJson(route, result(scanTask))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      await fulfillJson(route, result([]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/SCAN_TASK/${scanTaskId}`) {
      await fulfillJson(route, result(scanExecutionDetail))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/code-chunks/status`) {
      await fulfillJson(route, result(scanCodeChunkStatus))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`) {
      await fulfillJson(route, result(scanGovernanceTimeline))
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
    agentTaskDetailRequests,
    agentTaskStepRequests,
    agentTaskCreates,
    agentTaskStartRequests,
    messageRequests,
    toolQueries,
    unhandledApiRequests,
  }
}

function installRuntimeGuards(page: Page) {
  const issues: Array<{ type: string; message: string }> = []
  const ignoredConsolePatterns = [
    /React Router Future Flag Warning/,
    /findDOMNode/,
    /Static function can not consume context like dynamic theme/,
    /Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)/,
  ]

  page.on('console', message => {
    if (!['error', 'warning'].includes(message.type())) return
    const text = message.text()
    if (ignoredConsolePatterns.some(pattern => pattern.test(text))) return
    issues.push({ type: message.type(), message: text })
  })

  page.on('pageerror', error => {
    issues.push({ type: 'pageerror', message: error.message })
  })

  return issues
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
  const overflow = Math.max(layout.scrollWidth, layout.bodyScrollWidth) - layout.innerWidth
  expect(overflow, `${label} has horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(1)
}

async function assertAgentChatTrustWorkbench(page: Page, label: string, expectedColumns: number) {
  const workbench = page.getByRole('region', { name: 'Agent 会话可信工作台' })
  await expect(workbench).toBeVisible()
  await expect(workbench).toContainText('会话可信工作台')
  await expect(workbench).toContainText('项目上下文')
  await expect(workbench).toContainText('证据输入')
  await expect(workbench).toContainText('工具审计')
  await expect(workbench).toContainText('闭环任务')
  const steps = workbench.locator('.sl-agent-chat-trust-step')
  await expect(steps).toHaveCount(4)
  const gridColumns = await workbench.locator('.sl-agent-chat-trust-loop-grid').evaluate((element) => (
    window.getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
  ))
  expect(gridColumns, `${label} AgentChat trust workbench grid columns`).toBe(expectedColumns)

  return {
    visible: true,
    stepCount: await steps.count(),
    gridColumns,
    projectContextVisible: await workbench.getByText('项目上下文', { exact: true }).isVisible(),
    evidenceInputVisible: await workbench.getByText('证据输入', { exact: true }).isVisible(),
    toolAuditVisible: await workbench.getByText('工具审计', { exact: true }).isVisible(),
    closureTaskVisible: await workbench.getByText('闭环任务', { exact: true }).isVisible(),
  }
}

test('AgentChat closure rail deep-links to audit, AgentTask and scan report', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installClosureRailMocks(page)
  const visitedViewports: string[] = []
  const handoffProofs: Array<{
    rawPromptInUrl: boolean
    handoffVisible: boolean
    draftPrefilled: boolean
    conversationCreatedOrSelected: boolean
    agentTaskCreated: boolean
    agentTaskBound: boolean
    structuredInputOnly: boolean
    autoStarted: boolean
    autoSent: boolean
    manualSendTriggered: boolean
    messageRequestAfterClick: boolean
    agentTaskStillPending: boolean
    writeToolTriggered: boolean
    auditReviewVisible: boolean
    closureRailStillBound: boolean
    rawPromptStored: boolean
    rawStackStored: boolean
    noHorizontalOverflow: boolean
    preConversationUsePromptHidden: boolean
    preConversationPrimaryCtaVisible: boolean
    preConversationCreateDisabled: boolean
    preConversationMissingScanReasonVisible: boolean
  }> = []
  const toolCallRedactionProofs: Array<{
    rawSecretsHidden: boolean
    bodyRawSecretsHidden: boolean
    redactionVisible: boolean
  }> = []
  const missingScanHandoffProofs: Array<{
    usePromptHidden: boolean
    createTaskDisabled: boolean
    disabledReasonVisible: boolean
    noAgentTaskCreated: boolean
    noAutoSent: boolean
  }> = []
  const closureGateProofs: Array<{
    noActiveClosedVisible: boolean
    linkedReadyVisible: boolean
    handoffReadyVisible: boolean
    unboundPartialVisible: boolean
    loadingReviewVisible: boolean
    taskErrorBlockedVisible: boolean
    missingTaskDetailVisible: boolean
    noScanBlockedVisible: boolean
    auditOpenReasonVisible: boolean
    agentTaskOpenReasonVisible: boolean
    scanReportOpenReasonVisible: boolean
    unboundAgentTaskBlocked: boolean
    unboundScanBlocked: boolean
    loadingScanButtonBlocked: boolean
    taskErrorScanButtonBlocked: boolean
    missingTaskScanButtonBlocked: boolean
    noScanButtonBlocked: boolean
  }> = []
  const actionProofs: Array<{
    noActiveFallbackVisible: boolean
    auditVisible: boolean
    agentTaskVisible: boolean
    scanReportVisible: boolean
    unboundConversationFallbackVisible: boolean
  }> = []
  const scanReportClickProofs: Array<{
    clicked: boolean
    reportLoaded: boolean
  }> = []
  const agentChatMessageErrorRedactionProofs: Array<{
    messageRawSecretsHidden: boolean
    errorRawSecretsHidden: boolean
    bodyRawSecretsHidden: boolean
    urlRawSecretsHidden: boolean
    redactionVisible: boolean
    safeMarkersVisible: boolean
  }> = []
  const agentChatTitleRedactionProofs: Array<{
    titleRawSecretsHidden: boolean
    bodyRawSecretsHidden: boolean
    redactionVisible: boolean
    safeMarkerVisible: boolean
  }> = []
  const agentChatHandoffRedactionProofs: Array<{
    handoffRawSecretsHidden: boolean
    composerRawSecretsHidden: boolean
    urlRawSecretsHidden: boolean
    requestTitleRawSecretsHidden: boolean
    requestInputRawSecretsHidden: boolean
    redactionVisible: boolean
  }> = []
  const agentChatApiErrorRedactionProofs: Array<{
    errorStateRawSecretsHidden: boolean
    toastRawSecretsHidden: boolean
    bodyRawSecretsHidden: boolean
    urlRawSecretsHidden: boolean
    redactionVisible: boolean
    safeMarkerVisible: boolean
  }> = []
  const agentChatTrustWorkbenchProofs: Array<{
    visible: boolean
    stepCount: number
    gridColumns: number
    projectContextVisible: boolean
    evidenceInputVisible: boolean
    toolAuditVisible: boolean
    closureTaskVisible: boolean
    noHorizontalOverflow: boolean
  }> = []
  const baseURLHost = new URL(test.info().project.use.baseURL || 'http://127.0.0.1').hostname || '127.0.0.1'

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/agent-chat')
    const trustWorkbenchProof = await assertAgentChatTrustWorkbench(
      page,
      `${viewport.name}:agent-chat-trust-workbench`,
      viewport.width <= 720 ? 1 : 4,
    )
    const noActiveRail = page.getByRole('region', { name: 'Agent 闭环下一步' })
    await expect(noActiveRail).toBeVisible()
    const noActiveGate = noActiveRail.getByRole('region', { name: 'Agent 闭环动作门禁说明' })
    await expect(noActiveGate).toBeVisible()
    await expect(noActiveGate).toContainText('闭环动作门禁关闭')
    await expect(noActiveGate).toContainText('选择对话后开放闭环入口')
    await expect(noActiveGate).toContainText('等待对话')
    await expect(noActiveGate).toContainText('等待绑定')
    await expect(noActiveGate).toContainText('等待扫描')
    await expect(noActiveRail.getByRole('button', { name: '查看工具审计' })).toHaveCount(0)
    await expect(noActiveRail.getByRole('button', { name: '打开 Agent 任务' })).toHaveCount(0)
    await expect(noActiveRail.getByRole('button', { name: '打开扫描报告' })).toHaveCount(0)
    await expectNoHorizontalOverflow(page, `${viewport.name}:no-active-closure-gate`)
    agentChatTrustWorkbenchProofs.push({
      ...trustWorkbenchProof,
      noHorizontalOverflow: true,
    })

    const handoffParams = new URLSearchParams({
      projectId: String(projectId),
      handoff: 'code-understanding',
      source: 'PROJECT_QA_CODE_UNDERSTANDING_LENS',
      inputKind: 'FILE_LINE',
      inputLabel: '文件行号',
      sourceLabel: 'C1',
      filePath: rawHandoffFilePath,
      lineRef: rawHandoffLineRef,
      contextRole: 'PRIMARY',
      evidenceType: 'CONTROLLER',
      relevanceScore: '91',
      scanTaskId: String(scanTaskId),
    })
    await page.goto(`/agent-chat?${handoffParams.toString()}`)
    await expect.poll(() => page.url().includes(rawAgentChatHandoffPathSecret), {
      message: `${viewport.name} handoff URL raw secret must be replaced with redacted query values`,
    }).toBe(false)
    const handoffUrl = new URL(page.url())
    expect(handoffUrl.searchParams.has('prompt'), `${viewport.name} handoff URL must not store raw prompt`).toBe(false)
    for (const secret of forbiddenAgentChatHandoffSecrets) {
      expect(page.url(), `${viewport.name} handoff URL must not expose raw handoff secret: ${secret}`).not.toContain(secret)
    }
    const handoffPanel = page.getByRole('region', { name: '代码理解交接包' })
    await expect(handoffPanel).toBeVisible()
    await expect(handoffPanel).toContainText('PROJECT_QA_CODE_UNDERSTANDING_LENS')
    await expect(handoffPanel).toContainText('文件行号')
    await expect(handoffPanel).toContainText(`Scan #${scanTaskId}`)
    await expect(handoffPanel).toContainText(handoffLineRef)
    await expect(handoffPanel).toContainText(redactedSecretLabel)
    const handoffPanelText = await handoffPanel.innerText()
    for (const secret of forbiddenAgentChatHandoffSecrets) {
      expect(handoffPanelText, `${viewport.name} handoff panel must not expose raw handoff secret: ${secret}`).not.toContain(secret)
    }
    await expect(page.getByLabel('输入给 SourceLens Agent 的问题')).toHaveCount(0)
    await expect(page.getByText('发送第一条问题')).toHaveCount(0)
    await expect(handoffPanel.getByRole('button', { name: '使用交接问题' })).toHaveCount(0)
    await expect(handoffPanel.getByRole('button', { name: '创建绑定任务并进入会话' })).toBeVisible()
    await expect(handoffPanel.getByRole('button', { name: '创建绑定任务并进入会话' })).toBeEnabled()
    const messageRequestsBeforeBinding = network.messageRequests.length
    await handoffPanel.getByRole('button', { name: '创建绑定任务并进入会话' }).click()
    await expect(page).toHaveURL(new RegExp(`/agent-chat/${handoffConversationId}$`))
    const composer = page.getByLabel('输入给 SourceLens Agent 的问题')
    await expect(composer).toHaveValue(new RegExp(`请基于当前扫描证据解释 ${handoffLineRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    await expect(composer).toHaveValue(new RegExp(`证据编号：C1`))
    const composerValue = await composer.inputValue()
    for (const secret of forbiddenAgentChatHandoffSecrets) {
      expect(composerValue, `${viewport.name} composer must not expose raw handoff secret: ${secret}`).not.toContain(secret)
    }
    const createdTaskBody = network.agentTaskCreates.at(-1)
    const createdTaskInput = JSON.parse(String(createdTaskBody?.inputJson || '{}')) as Record<string, unknown>
    expect(createdTaskBody?.projectId, `${viewport.name} handoff AgentTask must bind current project`).toBe(projectId)
    expect(createdTaskBody?.scanTaskId, `${viewport.name} handoff AgentTask must bind current successful scan`).toBe(scanTaskId)
    expect(createdTaskBody?.conversationId, `${viewport.name} handoff should create a conversation before binding AgentTask`).toBe(handoffConversationId)
    expect(createdTaskBody?.taskType, `${viewport.name} handoff AgentTask must stay as a manual custom task`).toBe('CUSTOM')
    expect(handoffUrl.searchParams.has('rawPrompt'), `${viewport.name} handoff URL must not store rawPrompt`).toBe(false)
    expect(handoffUrl.searchParams.has('stack'), `${viewport.name} handoff URL must not store stack`).toBe(false)
    expect(String(createdTaskBody?.inputJson || ''), `${viewport.name} inputJson must not store raw prompt text`).not.toContain('请基于当前扫描证据解释')
    expect(createdTaskInput.source).toBe('PROJECT_QA_CODE_UNDERSTANDING_LENS')
    expect(createdTaskInput.filePath).toBe(handoffFilePath)
    expect(createdTaskInput.lineRef).toBe(handoffLineRef)
    for (const secret of forbiddenAgentChatHandoffSecrets) {
      expect(String(createdTaskBody?.title || ''), `${viewport.name} AgentTask title must not expose raw handoff secret: ${secret}`).not.toContain(secret)
      expect(String(createdTaskBody?.inputJson || ''), `${viewport.name} AgentTask inputJson must not expose raw handoff secret after URL sanitization: ${secret}`).not.toContain(secret)
    }
    expect(createdTaskInput.rawPromptStored).toBe(false)
    expect(createdTaskInput.rawStackStored).toBe(false)
    expect(createdTaskInput.autoSent).toBe(false)
    expect(createdTaskInput.autoStarted).toBe(false)
    const handoffRail = page.getByRole('region', { name: 'Agent 闭环下一步' })
    await expect(handoffRail.getByText(`Conv #${handoffConversationId}`)).toBeVisible()
    await expect(handoffRail.getByText(`AgentTask #${handoffAgentTaskId}`)).toBeVisible()
    await expect(handoffRail.getByText(`Scan #${scanTaskId}`)).toBeVisible()
    const handoffGate = handoffRail.getByRole('region', { name: 'Agent 闭环动作门禁说明' })
    await expect(handoffGate).toBeVisible()
    await expect(handoffGate).toContainText('闭环动作门禁开放')
    await expect(handoffGate).toContainText('工具审计可用')
    await expect(handoffGate).toContainText('AgentTask 可定位')
    await expect(handoffGate).toContainText('扫描报告可回跳')
    const manualProof = page.getByRole('region', { name: '代码理解手动发送闭环' })
    await expect(manualProof).toBeVisible()
    await expect(manualProof).toContainText('等待用户手动发送')
    await expect(manualProof).toContainText('发送前不会启动 AgentTask')
    await expect(manualProof).toContainText('PENDING')
    const messageRequestsBeforeClick = network.messageRequests.length
    expect(messageRequestsBeforeClick, `${viewport.name} handoff must not auto-send a message before user click`).toBe(messageRequestsBeforeBinding)
    expect(network.agentTaskStartRequests, `${viewport.name} handoff must not auto-start AgentTask`).toHaveLength(0)
    await page.getByRole('button', { name: '发送' }).click()
    await expect.poll(() => network.messageRequests.length, {
      message: `${viewport.name} manual click should submit exactly one AgentChat message`,
    }).toBe(messageRequestsBeforeClick + 1)
    const latestMessageRequest = network.messageRequests.at(-1)
    expect(latestMessageRequest?.path, `${viewport.name} manual send should use the bound conversation`).toBe(`/api/conversations/${handoffConversationId}/messages`)
    expect(String(latestMessageRequest?.body.message || ''), `${viewport.name} manual send should submit the prefilled handoff question`).toContain(handoffLineRef)
    expect(String(latestMessageRequest?.body.message || ''), `${viewport.name} manual send should include the response-local source label`).toContain('证据编号：C1')
    for (const secret of forbiddenAgentChatHandoffSecrets) {
      expect(String(latestMessageRequest?.body.message || ''), `${viewport.name} manual message body must not expose raw handoff secret: ${secret}`).not.toContain(secret)
    }
    expect(network.agentTaskStartRequests, `${viewport.name} manual send must not start the bound AgentTask`).toHaveLength(0)
    await expect(handoffRail.getByText(`AgentTask #${handoffAgentTaskId}`)).toBeVisible()
    await expect(handoffRail.getByRole('button', { name: '查看工具审计' })).toBeVisible()
    await expectNoHorizontalOverflow(page, `${viewport.name}:code-understanding-handoff`)
    agentChatHandoffRedactionProofs.push({
      handoffRawSecretsHidden: forbiddenAgentChatHandoffSecrets.every(secret => !handoffPanelText.includes(secret)),
      composerRawSecretsHidden: forbiddenAgentChatHandoffSecrets.every(secret => !composerValue.includes(secret)),
      urlRawSecretsHidden: forbiddenAgentChatHandoffSecrets.every(secret => !page.url().includes(secret)),
      requestTitleRawSecretsHidden: forbiddenAgentChatHandoffSecrets.every(secret => !String(createdTaskBody?.title || '').includes(secret)),
      requestInputRawSecretsHidden: forbiddenAgentChatHandoffSecrets.every(secret => !String(createdTaskBody?.inputJson || '').includes(secret)),
      redactionVisible: handoffPanelText.includes(redactedSecretLabel) && composerValue.includes(redactedSecretLabel),
    })
    handoffProofs.push({
      rawPromptInUrl: false,
      handoffVisible: true,
      draftPrefilled: true,
      conversationCreatedOrSelected: true,
      agentTaskCreated: true,
      agentTaskBound: true,
      structuredInputOnly: true,
      autoStarted: false,
      autoSent: false,
      manualSendTriggered: true,
      messageRequestAfterClick: network.messageRequests.length === messageRequestsBeforeClick + 1,
      agentTaskStillPending: handoffAgentTask.status === 'PENDING',
      writeToolTriggered: false,
      auditReviewVisible: true,
      closureRailStillBound: true,
      rawPromptStored: createdTaskInput.rawPromptStored === true,
      rawStackStored: createdTaskInput.rawStackStored === true,
      noHorizontalOverflow: true,
      preConversationUsePromptHidden: true,
      preConversationPrimaryCtaVisible: true,
      preConversationCreateDisabled: false,
      preConversationMissingScanReasonVisible: false,
    })

    const missingScanParams = new URLSearchParams(handoffParams)
    missingScanParams.delete('scanTaskId')
    await page.goto(`/agent-chat?${missingScanParams.toString()}`)
    const missingScanPanel = page.getByRole('region', { name: '代码理解交接包' })
    await expect(missingScanPanel).toBeVisible()
    await expect(missingScanPanel).toContainText('缺少成功扫描任务，无法创建绑定 AgentTask。')
    await expect(missingScanPanel.getByRole('button', { name: '使用交接问题' })).toHaveCount(0)
    await expect(missingScanPanel.getByRole('button', { name: '创建绑定任务并进入会话' })).toBeDisabled()
    const messageRequestsAfterMissingScan = network.messageRequests.length
    const taskCreatesAfterMissingScan = network.agentTaskCreates.length
    await expectNoHorizontalOverflow(page, `${viewport.name}:missing-scan-code-understanding-handoff`)
    expect(network.messageRequests.length, `${viewport.name} missing scan handoff must not auto-send`).toBe(messageRequestsAfterMissingScan)
    expect(network.agentTaskCreates.length, `${viewport.name} missing scan handoff must not create AgentTask`).toBe(taskCreatesAfterMissingScan)
    missingScanHandoffProofs.push({
      usePromptHidden: true,
      createTaskDisabled: true,
      disabledReasonVisible: true,
      noAgentTaskCreated: network.agentTaskCreates.length === taskCreatesAfterMissingScan,
      noAutoSent: network.messageRequests.length === messageRequestsAfterMissingScan,
    })

    await page.goto(`/agent-chat/${conversationId}`)

    await expect(page.getByRole('heading', { name: new RegExp(agentChatTitleSafeMarker) })).toBeVisible()
    if (viewport.width <= 1200) {
      await page.getByRole('button', { name: '打开会话池' }).click()
    }
    const conversationList = page.locator('.sl-agent-chat-conversation-list')
    await expect(conversationList).toBeVisible()
    await expect(conversationList).toContainText(agentChatTitleSafeMarker)
    await expect(conversationList).toContainText(redactedSecretLabel)
    const titleSurfaceText = [
      await page.getByRole('heading', { name: new RegExp(agentChatTitleSafeMarker) }).innerText(),
      await conversationList.innerText(),
    ].join('\n')
    for (const secret of forbiddenAgentChatTitleSecrets) {
      expect(titleSurfaceText, `${viewport.name} AgentChat title surfaces must not expose raw title secret: ${secret}`).not.toContain(secret)
    }
    if (viewport.width <= 1200) {
      await page.keyboard.press('Escape')
      await expect(conversationList).toBeHidden()
    }

    const messageLog = page.locator('.sl-agent-chat-message-log')
    await expect(messageLog).toContainText(agentChatMessageSafeMarker)
    await expect(messageLog).toContainText(agentChatErrorSafeMarker)
    await expect(messageLog).toContainText(redactedSecretLabel)
    const renderedMessageLogText = await messageLog.innerText()
    const renderedErrorTagText = (await page.locator('.sl-agent-chat-bubble .ant-tag').allTextContents()).join('\n')
    const currentUrl = page.url()
    for (const secret of forbiddenAgentChatMessageSecrets) {
      expect(renderedMessageLogText, `${viewport.name} AgentChat message log must redact raw message/error secret: ${secret}`).not.toContain(secret)
      expect(currentUrl, `${viewport.name} AgentChat URL must not contain raw message/error secret: ${secret}`).not.toContain(secret)
    }
    expect(renderedErrorTagText, `${viewport.name} AgentChat error tag must render a safe marker`).toContain(agentChatErrorSafeMarker)
    expect(renderedErrorTagText, `${viewport.name} AgentChat error tag must render a redaction marker`).toContain(redactedSecretLabel)
    expect(renderedErrorTagText, `${viewport.name} AgentChat error tag must redact bearer secrets`).not.toContain(rawAgentChatBearerSecret)
    expect(renderedErrorTagText, `${viewport.name} AgentChat error tag must redact password secrets`).not.toContain(rawAgentChatPasswordSecret)

    const renderedToolCalls = page.locator('.sl-agent-tool-call')
    await expect(renderedToolCalls).toHaveCount(2)
    await renderedToolCalls.nth(0).getByRole('button').click()
    await renderedToolCalls.nth(1).getByRole('button').click()
    const renderedToolCallText = (await renderedToolCalls.allTextContents()).join('\n')
    expect(renderedToolCallText, `${viewport.name} AgentToolCall must redact raw JSON and plain-text secrets`).not.toContain(rawSecretSentinel)
    expect(renderedToolCallText, `${viewport.name} AgentToolCall must render a redaction marker for sensitive payloads`).toContain(redactedSecretLabel)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText, `${viewport.name} page body must not expose raw AgentToolCall secrets`).not.toContain(rawSecretSentinel)
    for (const secret of forbiddenAgentChatTitleSecrets) {
      expect(bodyText, `${viewport.name} page body must not expose raw AgentChat title secret: ${secret}`).not.toContain(secret)
    }
    for (const secret of forbiddenAgentChatMessageSecrets) {
      expect(bodyText, `${viewport.name} page body must not expose raw AgentChat message/error secret: ${secret}`).not.toContain(secret)
    }
    expect(bodyText, `${viewport.name} page body must expose redaction markers for AgentToolCall secrets`).toContain(redactedSecretLabel)
    agentChatMessageErrorRedactionProofs.push({
      messageRawSecretsHidden: forbiddenAgentChatMessageSecrets.every(secret => !renderedMessageLogText.includes(secret)),
      errorRawSecretsHidden: !renderedErrorTagText.includes(rawAgentChatBearerSecret) && !renderedErrorTagText.includes(rawAgentChatPasswordSecret),
      bodyRawSecretsHidden: forbiddenAgentChatMessageSecrets.every(secret => !bodyText.includes(secret)),
      urlRawSecretsHidden: forbiddenAgentChatMessageSecrets.every(secret => !currentUrl.includes(secret)),
      redactionVisible: renderedMessageLogText.includes(redactedSecretLabel) && renderedErrorTagText.includes(redactedSecretLabel) && bodyText.includes(redactedSecretLabel),
      safeMarkersVisible: renderedMessageLogText.includes(agentChatMessageSafeMarker) && renderedErrorTagText.includes(agentChatErrorSafeMarker),
    })
    toolCallRedactionProofs.push({
      rawSecretsHidden: !renderedToolCallText.includes(rawSecretSentinel),
      bodyRawSecretsHidden: !bodyText.includes(rawSecretSentinel),
      redactionVisible: renderedToolCallText.includes(redactedSecretLabel) && bodyText.includes(redactedSecretLabel),
    })
    agentChatTitleRedactionProofs.push({
      titleRawSecretsHidden: forbiddenAgentChatTitleSecrets.every(secret => !titleSurfaceText.includes(secret)),
      bodyRawSecretsHidden: forbiddenAgentChatTitleSecrets.every(secret => !bodyText.includes(secret)),
      redactionVisible: titleSurfaceText.includes(redactedSecretLabel) && bodyText.includes(redactedSecretLabel),
      safeMarkerVisible: titleSurfaceText.includes(agentChatTitleSafeMarker),
    })

    const rail = page.getByRole('region', { name: 'Agent 闭环下一步' })
    await expect(rail).toBeVisible()
    await expect(rail.getByText(`Conv #${conversationId}`)).toBeVisible()
    await expect(rail.getByText(`AgentTask #${agentTaskId}`)).toBeVisible()
    await expect(rail.getByText(`Scan #${scanTaskId}`)).toBeVisible()
    const closureGate = rail.getByRole('region', { name: 'Agent 闭环动作门禁说明' })
    await expect(closureGate).toBeVisible()
    await expect(closureGate).toContainText('闭环动作门禁开放')
    await expect(closureGate).toContainText('审计、任务和扫描报告证据链完整')
    await expect(closureGate).toContainText('工具审计可用')
    await expect(closureGate).toContainText('AgentTask 可定位')
    await expect(closureGate).toContainText('扫描报告可回跳')
    const closureGateText = await closureGate.innerText()

    const auditAction = rail.getByRole('button', { name: '查看工具审计' })
    const taskAction = rail.getByRole('button', { name: '打开 Agent 任务' })
    const scanAction = rail.getByRole('button', { name: '打开扫描报告' })
    await expect(auditAction).toHaveAttribute('data-sl-target-url', `/audit-logs?projectId=${projectId}&conversationId=${conversationId}`)
    await expect(taskAction).toHaveAttribute('data-sl-target-url', `/agent-tasks?projectId=${projectId}&taskId=${agentTaskId}`)
    await expect(scanAction).toHaveAttribute('data-sl-target-url', `/scan-tasks/${scanTaskId}`)
    const linkedAuditVisible = await auditAction.isVisible()
    const linkedAgentTaskVisible = await taskAction.isVisible()
    const linkedScanReportVisible = await scanAction.isVisible()

    await taskAction.click()
    await expect(page).toHaveURL(new RegExp(`/agent-tasks\\?projectId=${projectId}&taskId=${agentTaskId}$`))
    const row = page.getByRole('row', { name: new RegExp(`AgentTask #${agentTaskId}`) })
    await expect(row).toHaveAttribute('aria-selected', 'true')
    const detail = page.locator(`#agent-task-detail-${agentTaskId}`)
    await expect(detail).toBeVisible()
    await expect(detail).toHaveAttribute('role', 'region')
    await expect(detail).toHaveAttribute('aria-labelledby', `agent-task-detail-title-${agentTaskId}`)
    await expect(detail).toContainText('架构审查 - Controller 边界')
    expect(network.agentTaskStepRequests, `${viewport.name} taskId deep link should request task steps`).toContain(agentTaskId)
    await expectNoHorizontalOverflow(page, `${viewport.name}:agent-task-deep-link`)

    await page.goto(`/agent-chat/${conversationId}`)
    await page.getByRole('region', { name: 'Agent 闭环下一步' }).getByRole('button', { name: '打开扫描报告' }).click()
    await expect(page).toHaveURL(new RegExp(`/scan-tasks/${scanTaskId}$`))
    await expect(page.getByRole('heading', { name: '仓库逆向分析报告' })).toBeVisible()
    await expect(page.getByText(`Scan Task #${scanTaskId}`)).toBeVisible()
    await expectNoHorizontalOverflow(page, `${viewport.name}:scan-report-deep-link`)
    scanReportClickProofs.push({
      clicked: true,
      reportLoaded: true,
    })

    await page.goto(`/agent-chat/${conversationId}`)
    await page.getByRole('region', { name: 'Agent 闭环下一步' }).getByRole('button', { name: '查看工具审计' }).click()
    await expect(page).toHaveURL(new RegExp(`/audit-logs\\?projectId=${projectId}&conversationId=${conversationId}$`))
    await expect(page.getByRole('tab', { name: 'Agent 工具调用' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByLabel('对话 ID')).toHaveValue(String(conversationId))
    await expect(page.getByText('read_file').first()).toBeVisible()
    const latestToolQuery = network.toolQueries.at(-1) || ''
    expect(latestToolQuery, `${viewport.name} Agent tool-call query did not include conversationId.`).toContain(`conversationId=${conversationId}`)
    await expectNoHorizontalOverflow(page, `${viewport.name}:audit-deep-link`)

    await page.goto(`/agent-chat/${secondaryConversationId}`)
    const unboundRail = page.getByRole('region', { name: 'Agent 闭环下一步' })
    await expect(unboundRail).toBeVisible()
    await expect(unboundRail.getByText('Agent 任务').first()).toBeVisible()
    await expect(unboundRail.getByText('未绑定').first()).toBeVisible()
    const unboundGate = unboundRail.getByRole('region', { name: 'Agent 闭环动作门禁说明' })
    await expect(unboundGate).toBeVisible()
    await expect(unboundGate).toContainText('闭环动作门禁部分开放')
    await expect(unboundGate).toContainText('未绑定 AgentTask，任务闭环未形成')
    await expect(unboundGate).toContainText('工具审计可用')
    await expect(unboundGate).toContainText('AgentTask 入口关闭')
    await expect(unboundGate).toContainText('扫描报告入口关闭')
    await expect(unboundRail.getByRole('button', { name: '查看工具审计' })).toBeVisible()
    await expect(unboundRail.getByRole('button', { name: '打开 Agent 任务' })).toHaveCount(0)
    await expect(unboundRail.getByRole('button', { name: '打开扫描报告' })).toHaveCount(0)
    const unboundAuditVisible = await unboundRail.getByRole('button', { name: '查看工具审计' }).isVisible()
    await expectNoHorizontalOverflow(page, `${viewport.name}:unbound-conversation`)
    const unboundGateText = await unboundGate.innerText()
    expect(closureGateText, `${viewport.name} linked closure gate must include AgentTask open reason`).toContain('AgentTask 可定位')
    expect(closureGateText, `${viewport.name} linked closure gate must include scan report open reason`).toContain('扫描报告可回跳')
    expect(unboundGateText, `${viewport.name} unbound closure gate must explain blocked AgentTask`).toContain('AgentTask 入口关闭')
    expect(unboundGateText, `${viewport.name} unbound closure gate must explain blocked scan report`).toContain('扫描报告入口关闭')

    await page.goto(`/agent-chat/${loadingConversationId}`)
    const loadingRail = page.getByRole('region', { name: 'Agent 闭环下一步' })
    const loadingGate = loadingRail.getByRole('region', { name: 'Agent 闭环动作门禁说明' })
    await expect(loadingGate).toContainText('闭环动作门禁复核中', { timeout: 1000 })
    await expect(loadingGate).toContainText('Agent 任务详情加载中', { timeout: 1000 })
    await expect(loadingGate).toContainText('等待任务详情', { timeout: 1000 })
    await expect(loadingRail.getByRole('button', { name: '打开 Agent 任务' })).toBeVisible({ timeout: 1000 })
    await expect(loadingRail.getByRole('button', { name: '打开扫描报告' })).toHaveCount(0, { timeout: 1000 })
    await expectNoHorizontalOverflow(page, `${viewport.name}:loading-closure-gate`)
    const loadingGateText = await loadingGate.innerText()

    await page.goto(`/agent-chat/${taskErrorConversationId}`)
    const taskErrorRail = page.getByRole('region', { name: 'Agent 闭环下一步' })
    const taskErrorGate = taskErrorRail.getByRole('region', { name: 'Agent 闭环动作门禁说明' })
    await expect(taskErrorGate).toContainText('闭环动作门禁部分开放')
    await expect(taskErrorGate).toContainText('Agent 任务闭环加载失败')
    await expect(taskErrorGate).toContainText('扫描报告入口关闭')
    await expect(taskErrorRail.getByRole('button', { name: '打开 Agent 任务' })).toBeVisible()
    await expect(taskErrorRail.getByRole('button', { name: '打开扫描报告' })).toHaveCount(0)
    await expect(taskErrorRail.getByRole('button', { name: '重试加载' })).toBeVisible()
    await expectNoHorizontalOverflow(page, `${viewport.name}:task-error-closure-gate`)
    const taskErrorGateText = await taskErrorGate.innerText()

    await page.goto(`/agent-chat/${missingTaskConversationId}`)
    const missingTaskRail = page.getByRole('region', { name: 'Agent 闭环下一步' })
    const missingTaskGate = missingTaskRail.getByRole('region', { name: 'Agent 闭环动作门禁说明' })
    await expect(missingTaskGate).toContainText('闭环动作门禁部分开放')
    await expect(missingTaskGate).toContainText('Agent 任务详情未返回')
    await expect(missingTaskGate).toContainText('扫描报告入口关闭')
    await expect(missingTaskRail.getByRole('button', { name: '打开 Agent 任务' })).toBeVisible()
    await expect(missingTaskRail.getByRole('button', { name: '打开扫描报告' })).toHaveCount(0)
    await expectNoHorizontalOverflow(page, `${viewport.name}:missing-task-closure-gate`)
    const missingTaskGateText = await missingTaskGate.innerText()

    await page.goto(`/agent-chat/${noScanConversationId}`)
    const noScanRail = page.getByRole('region', { name: 'Agent 闭环下一步' })
    const noScanGate = noScanRail.getByRole('region', { name: 'Agent 闭环动作门禁说明' })
    await expect(noScanGate).toContainText('闭环动作门禁部分开放')
    await expect(noScanGate).toContainText('任务存在但未绑定扫描报告')
    await expect(noScanGate).toContainText('扫描报告入口关闭')
    await expect(noScanRail.getByRole('button', { name: '打开 Agent 任务' })).toBeVisible()
    await expect(noScanRail.getByRole('button', { name: '打开扫描报告' })).toHaveCount(0)
    await expectNoHorizontalOverflow(page, `${viewport.name}:no-scan-closure-gate`)
    const noScanGateText = await noScanGate.innerText()

    closureGateProofs.push({
      noActiveClosedVisible: true,
      linkedReadyVisible: true,
      handoffReadyVisible: true,
      unboundPartialVisible: true,
      loadingReviewVisible: loadingGateText.includes('闭环动作门禁复核中') && loadingGateText.includes('等待任务详情'),
      taskErrorBlockedVisible: taskErrorGateText.includes('Agent 任务闭环加载失败') && taskErrorGateText.includes('扫描报告入口关闭'),
      missingTaskDetailVisible: missingTaskGateText.includes('Agent 任务详情未返回') && missingTaskGateText.includes('扫描报告入口关闭'),
      noScanBlockedVisible: noScanGateText.includes('任务存在但未绑定扫描报告') && noScanGateText.includes('扫描报告入口关闭'),
      auditOpenReasonVisible: closureGateText.includes('工具审计可用') && unboundGateText.includes('工具审计可用'),
      agentTaskOpenReasonVisible: closureGateText.includes('AgentTask 可定位'),
      scanReportOpenReasonVisible: closureGateText.includes('扫描报告可回跳'),
      unboundAgentTaskBlocked: unboundGateText.includes('AgentTask 入口关闭'),
      unboundScanBlocked: unboundGateText.includes('扫描报告入口关闭'),
      loadingScanButtonBlocked: await loadingRail.getByRole('button', { name: '打开扫描报告' }).count() === 0,
      taskErrorScanButtonBlocked: await taskErrorRail.getByRole('button', { name: '打开扫描报告' }).count() === 0,
      missingTaskScanButtonBlocked: await missingTaskRail.getByRole('button', { name: '打开扫描报告' }).count() === 0,
      noScanButtonBlocked: await noScanRail.getByRole('button', { name: '打开扫描报告' }).count() === 0,
    })
    actionProofs.push({
      noActiveFallbackVisible: true,
      auditVisible: linkedAuditVisible,
      agentTaskVisible: linkedAgentTaskVisible,
      scanReportVisible: linkedScanReportVisible,
      unboundConversationFallbackVisible: unboundAuditVisible,
    })

    await page.goto(`/agent-chat/${errorConversationId}`)
    await expect(page.getByText(agentChatApiErrorSafeMarker).first()).toBeVisible()
    await expect(page.locator('.ant-message')).toContainText(agentChatApiErrorSafeMarker)
    await expect(page.locator('.ant-message')).toContainText(redactedSecretLabel)
    const apiErrorBodyText = await page.locator('body').innerText()
    const apiErrorToastText = (await page.locator('.ant-message').allTextContents()).join('\n')
    for (const secret of forbiddenAgentChatApiErrorSecrets) {
      expect(apiErrorBodyText, `${viewport.name} AgentChat API error state must not expose raw secret: ${secret}`).not.toContain(secret)
      expect(apiErrorToastText, `${viewport.name} AgentChat API error toast must not expose raw secret: ${secret}`).not.toContain(secret)
      expect(page.url(), `${viewport.name} AgentChat API error URL must not expose raw secret: ${secret}`).not.toContain(secret)
    }
    agentChatApiErrorRedactionProofs.push({
      errorStateRawSecretsHidden: forbiddenAgentChatApiErrorSecrets.every(secret => !apiErrorBodyText.includes(secret)),
      toastRawSecretsHidden: forbiddenAgentChatApiErrorSecrets.every(secret => !apiErrorToastText.includes(secret)),
      bodyRawSecretsHidden: forbiddenAgentChatApiErrorSecrets.every(secret => !apiErrorBodyText.includes(secret)),
      urlRawSecretsHidden: forbiddenAgentChatApiErrorSecrets.every(secret => !page.url().includes(secret)),
      redactionVisible: apiErrorBodyText.includes(redactedSecretLabel) && apiErrorToastText.includes(redactedSecretLabel),
      safeMarkerVisible: apiErrorBodyText.includes(agentChatApiErrorSafeMarker) && apiErrorToastText.includes(agentChatApiErrorSafeMarker),
    })
    await expectNoHorizontalOverflow(page, `${viewport.name}:api-error-redaction`)

    visitedViewports.push(`${viewport.width}x${viewport.height}`)
  }

  expect(network.unhandledApiRequests, `Unhandled /api requests must be mocked: ${network.unhandledApiRequests.join(', ')}`).toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const markerPayload = {
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    projectId,
    conversationId,
    agentTaskId,
    linkedAgentTaskId: agentTaskId,
    handoffAgentTaskId,
    scanTaskId,
    toolCallId,
    codeUnderstandingHandoff: {
      status: 'OK',
      surface: 'PROJECT_DETAIL_CODE_UNDERSTANDING_AGENT_HANDOFF',
      source: 'PROJECT_QA_CODE_UNDERSTANDING_LENS',
      projectId,
      scanTaskId,
      conversationId: handoffConversationId,
      inputKind: 'FILE_LINE',
      queryShape: 'file:line',
      sourceLabel: 'C1',
      filePath: handoffFilePath,
      lineRef: handoffLineRef,
      contextRole: 'PRIMARY',
      evidenceType: 'CONTROLLER',
      relevanceScore: 91,
      agentTaskBinding: {
        status: 'OK',
        projectId,
        scanTaskId,
        conversationId: handoffConversationId,
        agentTaskId: handoffAgentTaskId,
        taskStatus: 'PENDING',
        taskType: 'CUSTOM',
        sameProjectBound: true,
        sameScanBound: true,
        conversationBound: handoffProofs.every(proof => proof.agentTaskBound),
        boundByBackend: true,
        structuredInputOnly: handoffProofs.every(proof => proof.structuredInputOnly),
        rawPromptStored: false,
        rawStackStored: false,
        autoStarted: handoffProofs.some(proof => proof.autoStarted),
        agentTaskCreated: handoffProofs.every(proof => proof.agentTaskCreated),
      },
      manualSend: {
        status: 'OK',
        triggeredByUser: handoffProofs.every(proof => proof.manualSendTriggered),
        messageRequestAfterClick: handoffProofs.every(proof => proof.messageRequestAfterClick),
        autoSentBeforeClick: handoffProofs.some(proof => proof.autoSent),
        agentTaskStillPending: handoffProofs.every(proof => proof.agentTaskStillPending),
        autoStarted: handoffProofs.some(proof => proof.autoStarted),
        writeToolTriggered: handoffProofs.some(proof => proof.writeToolTriggered),
        closureRailStillBound: handoffProofs.every(proof => proof.closureRailStillBound),
        auditReviewVisible: handoffProofs.every(proof => proof.auditReviewVisible),
        rawPromptStored: handoffProofs.some(proof => proof.rawPromptStored),
        rawStackStored: handoffProofs.some(proof => proof.rawStackStored),
      },
      rawPromptInUrl: handoffProofs.some(proof => proof.rawPromptInUrl),
      rawPromptInUrlBlocked: handoffProofs.every(proof => !proof.rawPromptInUrl),
      handoffVisible: handoffProofs.every(proof => proof.handoffVisible),
      draftPrefilled: handoffProofs.every(proof => proof.draftPrefilled),
      conversationCreatedOrSelected: handoffProofs.every(proof => proof.conversationCreatedOrSelected),
      autoSent: handoffProofs.some(proof => proof.autoSent),
      rawStackStored: false,
      providerQualityClaim: false,
      llmFactClaim: false,
      noHorizontalOverflow: handoffProofs.every(proof => proof.noHorizontalOverflow),
      preConversationState: {
        status: 'OK',
        usePromptHiddenOrDisabled: handoffProofs.every(proof => proof.preConversationUsePromptHidden),
        createBoundTaskPrimaryCta: handoffProofs.every(proof => proof.preConversationPrimaryCtaVisible),
        createTaskDisabledWhenMissingScan: missingScanHandoffProofs.every(proof => proof.createTaskDisabled),
        missingScanTaskCreateBlocked: missingScanHandoffProofs.every(proof => proof.noAgentTaskCreated),
        missingScanReasonVisible: missingScanHandoffProofs.every(proof => proof.disabledReasonVisible),
        noAutoSentWithoutScan: missingScanHandoffProofs.every(proof => proof.noAutoSent),
      },
    },
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    visitedViewports,
    actionBar: {
      visible: actionProofs.every(proof => proof.auditVisible && proof.agentTaskVisible && proof.scanReportVisible),
      noActiveFallbackVisible: actionProofs.every(proof => proof.noActiveFallbackVisible),
      unboundConversationFallbackVisible: actionProofs.every(proof => proof.unboundConversationFallbackVisible),
    },
    closureGate: {
      visible: closureGateProofs.every(proof => (
        proof.noActiveClosedVisible
        && proof.linkedReadyVisible
        && proof.handoffReadyVisible
        && proof.unboundPartialVisible
        && proof.loadingReviewVisible
        && proof.taskErrorBlockedVisible
        && proof.missingTaskDetailVisible
        && proof.noScanBlockedVisible
      )),
      noActiveClosedVisible: closureGateProofs.every(proof => proof.noActiveClosedVisible),
      linkedReadyVisible: closureGateProofs.every(proof => proof.linkedReadyVisible),
      handoffReadyVisible: closureGateProofs.every(proof => proof.handoffReadyVisible),
      unboundPartialVisible: closureGateProofs.every(proof => proof.unboundPartialVisible),
      loadingReviewVisible: closureGateProofs.every(proof => proof.loadingReviewVisible),
      taskErrorBlockedVisible: closureGateProofs.every(proof => proof.taskErrorBlockedVisible),
      missingTaskDetailVisible: closureGateProofs.every(proof => proof.missingTaskDetailVisible),
      noScanBlockedVisible: closureGateProofs.every(proof => proof.noScanBlockedVisible),
      auditOpenReasonVisible: closureGateProofs.every(proof => proof.auditOpenReasonVisible),
      agentTaskOpenReasonVisible: closureGateProofs.every(proof => proof.agentTaskOpenReasonVisible),
      scanReportOpenReasonVisible: closureGateProofs.every(proof => proof.scanReportOpenReasonVisible),
      unboundAgentTaskBlocked: closureGateProofs.every(proof => proof.unboundAgentTaskBlocked),
      unboundScanBlocked: closureGateProofs.every(proof => proof.unboundScanBlocked),
      loadingScanButtonBlocked: closureGateProofs.every(proof => proof.loadingScanButtonBlocked),
      taskErrorScanButtonBlocked: closureGateProofs.every(proof => proof.taskErrorScanButtonBlocked),
      missingTaskScanButtonBlocked: closureGateProofs.every(proof => proof.missingTaskScanButtonBlocked),
      noScanButtonBlocked: closureGateProofs.every(proof => proof.noScanButtonBlocked),
      providerQualityClaim: false,
      llmFactClaim: false,
    },
    actions: {
      audit: {
        visible: actionProofs.every(proof => proof.auditVisible),
        deepLinkBound: true,
        conversationFilterBound: true,
      },
      agentTask: {
        visible: actionProofs.every(proof => proof.agentTaskVisible),
        taskIdDeepLinkBound: true,
        autoSelectedDetail: true,
      },
      scanReport: {
        visible: actionProofs.every(proof => proof.scanReportVisible),
        scanTaskDeepLinkBound: true,
        clicked: scanReportClickProofs.every(proof => proof.clicked),
        reportLoaded: scanReportClickProofs.every(proof => proof.reportLoaded),
      },
    },
    agentTaskDetail: {
      detailRequested: network.agentTaskDetailRequests.includes(agentTaskId),
      stepRequested: network.agentTaskStepRequests.includes(agentTaskId),
    },
    agentToolCallRedaction: {
      scope: 'AGENT_TOOL_CALL_ARGS_RESULT_DISPLAY_REDACTION_ONLY',
      fixtureHasJsonArgsSecret: true,
      fixtureHasPlainTextArgsSecret: true,
      fixtureHasJsonResultSecret: true,
      fixtureHasPlainTextResultSecret: true,
      rawSecretsHidden: toolCallRedactionProofs.every(proof => proof.rawSecretsHidden),
      bodyRawSecretsHidden: toolCallRedactionProofs.every(proof => proof.bodyRawSecretsHidden),
      redactionVisible: toolCallRedactionProofs.every(proof => proof.redactionVisible),
      markerContainsRawSecret: false,
    },
    agentChatMessageErrorRedaction: {
      scope: 'AGENT_CHAT_MESSAGE_ERROR_DISPLAY_REDACTION_ONLY',
      surface: 'AGENT_CHAT_PERSISTED_MESSAGE_AND_ERROR_TAG',
      fixtureHasMessageContentSecret: true,
      fixtureHasErrorMessageSecret: true,
      fixtureHasAuthorizationSecret: true,
      fixtureHasBearerSecret: true,
      fixtureHasApiKeySecret: true,
      fixtureHasPasswordSecret: true,
      fixtureHasJwtSecret: true,
      messageRawSecretsHidden: agentChatMessageErrorRedactionProofs.every(proof => proof.messageRawSecretsHidden),
      errorRawSecretsHidden: agentChatMessageErrorRedactionProofs.every(proof => proof.errorRawSecretsHidden),
      bodyRawSecretsHidden: agentChatMessageErrorRedactionProofs.every(proof => proof.bodyRawSecretsHidden),
      urlRawSecretsHidden: agentChatMessageErrorRedactionProofs.every(proof => proof.urlRawSecretsHidden),
      redactionVisible: agentChatMessageErrorRedactionProofs.every(proof => proof.redactionVisible),
      safeMarkersVisible: agentChatMessageErrorRedactionProofs.every(proof => proof.safeMarkersVisible),
      markerContainsRawSecret: false,
    },
    agentChatConversationTitleRedaction: {
      scope: 'AGENT_CHAT_CONVERSATION_TITLE_DISPLAY_REDACTION_ONLY',
      surface: 'AGENT_CHAT_HEADER_SIDEBAR_AND_DELETE_LABEL',
      fixtureHasTitleSecret: true,
      titleRawSecretsHidden: agentChatTitleRedactionProofs.every(proof => proof.titleRawSecretsHidden),
      bodyRawSecretsHidden: agentChatTitleRedactionProofs.every(proof => proof.bodyRawSecretsHidden),
      redactionVisible: agentChatTitleRedactionProofs.every(proof => proof.redactionVisible),
      safeMarkerVisible: agentChatTitleRedactionProofs.every(proof => proof.safeMarkerVisible),
      markerContainsRawSecret: false,
    },
    agentChatHandoffDisplayRedaction: {
      scope: 'AGENT_CHAT_HANDOFF_TITLE_FILE_PATH_DISPLAY_REDACTION_ONLY',
      surface: 'AGENT_CHAT_HANDOFF_PANEL_URL_COMPOSER_AND_BOUND_TASK_TITLE',
      fixtureHasHandoffFilePathSecret: true,
      handoffRawSecretsHidden: agentChatHandoffRedactionProofs.every(proof => proof.handoffRawSecretsHidden),
      composerRawSecretsHidden: agentChatHandoffRedactionProofs.every(proof => proof.composerRawSecretsHidden),
      urlRawSecretsHidden: agentChatHandoffRedactionProofs.every(proof => proof.urlRawSecretsHidden),
      requestTitleRawSecretsHidden: agentChatHandoffRedactionProofs.every(proof => proof.requestTitleRawSecretsHidden),
      requestInputRawSecretsHidden: agentChatHandoffRedactionProofs.every(proof => proof.requestInputRawSecretsHidden),
      redactionVisible: agentChatHandoffRedactionProofs.every(proof => proof.redactionVisible),
      markerContainsRawSecret: false,
    },
    agentChatApiErrorStateRedaction: {
      scope: 'AGENT_CHAT_API_ERROR_STATE_DISPLAY_REDACTION_ONLY',
      surface: 'AGENT_CHAT_STATEBLOCK_AND_LOCAL_TOAST',
      fixtureHasApiErrorSecret: true,
      errorStateRawSecretsHidden: agentChatApiErrorRedactionProofs.every(proof => proof.errorStateRawSecretsHidden),
      toastRawSecretsHidden: agentChatApiErrorRedactionProofs.every(proof => proof.toastRawSecretsHidden),
      bodyRawSecretsHidden: agentChatApiErrorRedactionProofs.every(proof => proof.bodyRawSecretsHidden),
      urlRawSecretsHidden: agentChatApiErrorRedactionProofs.every(proof => proof.urlRawSecretsHidden),
      redactionVisible: agentChatApiErrorRedactionProofs.every(proof => proof.redactionVisible),
      safeMarkerVisible: agentChatApiErrorRedactionProofs.every(proof => proof.safeMarkerVisible),
      markerContainsRawSecret: false,
    },
    agentChatTrustWorkbench: {
      scope: 'AGENT_CHAT_TRUST_WORKBENCH_READABILITY',
      surface: 'AGENT_CHAT_PROJECT_EVIDENCE_TOOL_TASK_LOOP',
      visible: agentChatTrustWorkbenchProofs.every(proof => proof.visible),
      stepCount: agentChatTrustWorkbenchProofs.every(proof => proof.stepCount === 4) ? 4 : 0,
      desktopColumns: agentChatTrustWorkbenchProofs.find(proof => proof.gridColumns === 4)?.gridColumns || 0,
      mobileColumns: agentChatTrustWorkbenchProofs.find(proof => proof.gridColumns === 1)?.gridColumns || 0,
      projectContextVisible: agentChatTrustWorkbenchProofs.every(proof => proof.projectContextVisible),
      evidenceInputVisible: agentChatTrustWorkbenchProofs.every(proof => proof.evidenceInputVisible),
      toolAuditVisible: agentChatTrustWorkbenchProofs.every(proof => proof.toolAuditVisible),
      closureTaskVisible: agentChatTrustWorkbenchProofs.every(proof => proof.closureTaskVisible),
      noHorizontalOverflow: agentChatTrustWorkbenchProofs.every(proof => proof.noHorizontalOverflow),
      providerQualityClaim: false,
      llmFactClaim: false,
    },
    runtimeIssues: 0,
    noHorizontalOverflow: true,
    spec: 'agent-chat-closure-rail-smoke.spec.ts',
    baseURLHost,
  }
  expect(markerPayload.agentChatTrustWorkbench.visible, 'AgentChat trust workbench marker must prove workbench visibility.').toBe(true)
  expect(markerPayload.agentChatTrustWorkbench.stepCount, 'AgentChat trust workbench marker must prove all four steps.').toBe(4)
  expect(markerPayload.agentChatTrustWorkbench.desktopColumns, 'AgentChat trust workbench marker must prove desktop four-column layout.').toBe(4)
  expect(markerPayload.agentChatTrustWorkbench.mobileColumns, 'AgentChat trust workbench marker must prove mobile single-column layout.').toBe(1)
  expect(markerPayload.agentChatTrustWorkbench.noHorizontalOverflow, 'AgentChat trust workbench marker must prove responsive overflow safety.').toBe(true)
  expect(markerPayload.actionBar.visible, 'AgentChat closure rail marker must prove action bar visibility from locator results.').toBe(true)
  expect(markerPayload.actions.scanReport.clicked, 'AgentChat closure rail marker must prove scan report action click.').toBe(true)
  expect(markerPayload.actions.scanReport.reportLoaded, 'AgentChat closure rail marker must prove scan report page loaded after click.').toBe(true)
  expect(markerPayload.closureGate.visible, 'AgentChat closure rail marker must prove every gate branch.').toBe(true)
  expect(markerPayload.closureGate.noActiveClosedVisible, 'No-active closure gate must be visible and closed.').toBe(true)
  expect(markerPayload.closureGate.loadingReviewVisible, 'Loading closure gate must be visible and in review state.').toBe(true)
  expect(markerPayload.closureGate.taskErrorBlockedVisible, 'Task-error closure gate must be visible and block scan report.').toBe(true)
  expect(markerPayload.closureGate.missingTaskDetailVisible, 'Missing-task-detail closure gate must be visible.').toBe(true)
  expect(markerPayload.closureGate.noScanBlockedVisible, 'No-scan closure gate must be visible and block scan report.').toBe(true)
  expect(markerPayload.closureGate.loadingScanButtonBlocked, 'Loading closure gate must keep scan button blocked.').toBe(true)
  expect(markerPayload.closureGate.taskErrorScanButtonBlocked, 'Task-error closure gate must keep scan button blocked.').toBe(true)
  expect(markerPayload.closureGate.missingTaskScanButtonBlocked, 'Missing task detail must keep scan button blocked.').toBe(true)
  expect(markerPayload.closureGate.noScanButtonBlocked, 'No-scan task must keep scan button blocked.').toBe(true)
  const markerText = JSON.stringify(markerPayload)
  expect(markerText, 'AgentChat closure rail marker must not include raw AgentToolCall secret sentinel.').not.toContain(rawSecretSentinel)
  for (const secret of [
    ...forbiddenAgentChatMessageSecrets,
    ...forbiddenAgentChatTitleSecrets,
    ...forbiddenAgentChatHandoffSecrets,
    ...forbiddenAgentChatApiErrorSecrets,
  ]) {
    expect(markerText, `AgentChat closure rail marker must not include raw AgentChat message/error secret: ${secret}`).not.toContain(secret)
  }
  console.log('AGENT_CHAT_CLOSURE_RAIL_SMOKE_OK', markerText)
})
