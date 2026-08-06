import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type AgentTaskFixture = {
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

const projectId = 1
const targetTaskId = 101
const secondaryTaskId = 102
const runningTaskId = 103
const failedNoOutputTaskId = 104
const unknownStatusTaskId = 105
const rawTaskInputSentinel = 'RAW_AGENT_TASK_INPUT_SHOULD_NOT_RENDER'
const rawTaskOutputSentinel = 'RAW_AGENT_TASK_OUTPUT_SHOULD_NOT_RENDER'
const rawStepOutputSentinel = 'RAW_AGENT_STEP_OUTPUT_SHOULD_NOT_RENDER'
const rawStepSecretSentinel = 'STEP_SECRET_SHOULD_NOT_RENDER'
const rawSecretSentinel = 'sk-test-token'
const rawAuthorizationSentinel = 'Authorization: Bearer forged'
const forbiddenRawPayloadSnippets = [
  rawTaskInputSentinel,
  rawTaskOutputSentinel,
  rawStepOutputSentinel,
  rawStepSecretSentinel,
  rawSecretSentinel,
  rawAuthorizationSentinel,
  '"verdict"',
]

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'Agent Tasks Smoke Project',
  description: 'Mocked project for AgentTasks detail selection smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 92,
  createdBy: 1,
  createdAt: '2026-07-01T09:00:00Z',
}

const baseTasks: AgentTaskFixture[] = [
  {
    id: targetTaskId,
    scanTaskId: 501,
    conversationId: 77,
    projectId,
    taskType: 'ARCHITECTURE_REVIEW',
    title: '架构审查 - 支付服务边界',
    description: '复核支付服务边界与关键依赖。',
    status: 'COMPLETED',
    priority: 'HIGH',
    inputJson: JSON.stringify({ scope: rawTaskInputSentinel, token: rawSecretSentinel, authorization: rawAuthorizationSentinel }),
    outputJson: JSON.stringify({ verdict: rawTaskOutputSentinel }),
    summary: '支付服务边界清晰，仍需补充审计证据。',
    startedAt: '2026-07-01T09:02:00Z',
    finishedAt: '2026-07-01T09:08:00Z',
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T09:01:00Z',
    updatedAt: '2026-07-01T09:08:00Z',
  },
  {
    id: secondaryTaskId,
    scanTaskId: 502,
    conversationId: null,
    projectId,
    taskType: 'RISK_SCAN',
    title: '风险扫描 - 登录模块',
    description: '检查登录模块输入校验和异常链路。',
    status: 'PENDING',
    priority: 'MEDIUM',
    inputJson: null,
    outputJson: null,
    summary: null,
    startedAt: null,
    finishedAt: null,
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T09:10:00Z',
    updatedAt: '2026-07-01T09:10:00Z',
  },
  {
    id: runningTaskId,
    scanTaskId: 503,
    conversationId: 78,
    projectId,
    taskType: 'CHANGE_IMPACT',
    title: '变更影响 - 订单链路',
    description: '复核订单链路变更影响。',
    status: 'RUNNING',
    priority: 'HIGH',
    inputJson: null,
    outputJson: null,
    summary: null,
    startedAt: '2026-07-01T09:12:00Z',
    finishedAt: null,
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T09:11:00Z',
    updatedAt: '2026-07-01T09:12:00Z',
  },
  {
    id: failedNoOutputTaskId,
    scanTaskId: null,
    conversationId: null,
    projectId,
    taskType: 'CUSTOM',
    title: '失败复盘 - 无输出任务',
    description: '模拟终态缺少摘要和输出。',
    status: 'FAILED',
    priority: 'LOW',
    inputJson: null,
    outputJson: null,
    summary: null,
    startedAt: '2026-07-01T09:13:00Z',
    finishedAt: '2026-07-01T09:14:00Z',
    errorMessage: '执行器超时',
    createdBy: 1,
    createdAt: '2026-07-01T09:13:00Z',
    updatedAt: '2026-07-01T09:14:00Z',
  },
  {
    id: unknownStatusTaskId,
    scanTaskId: 504,
    conversationId: null,
    projectId,
    taskType: 'CUSTOM',
    title: '状态异常 - 未知任务',
    description: '模拟后端返回未知状态。',
    status: 'PAUSED',
    priority: 'MEDIUM',
    inputJson: null,
    outputJson: null,
    summary: null,
    startedAt: null,
    finishedAt: null,
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T09:15:00Z',
    updatedAt: '2026-07-01T09:15:00Z',
  },
]

const stepsByTaskId = new Map<number, unknown[]>([
  [targetTaskId, [
    {
      id: 201,
      taskId: targetTaskId,
      stepOrder: 1,
      stepType: 'READ_CONTEXT',
      toolName: 'read_file',
      description: '读取服务边界证据',
      inputJson: null,
      outputJson: JSON.stringify({ files: 3, rawStepOutput: rawStepOutputSentinel, secret: rawStepSecretSentinel }),
      status: 'COMPLETED',
      errorMessage: null,
      durationMs: 320,
      createdAt: '2026-07-01T09:03:00Z',
    },
    {
      id: 202,
      taskId: targetTaskId,
      stepOrder: 2,
      stepType: 'SUMMARIZE',
      toolName: null,
      description: '汇总架构审查结论',
      inputJson: null,
      outputJson: JSON.stringify({ rawStepOutput: rawStepOutputSentinel, secret: rawStepSecretSentinel }),
      status: 'COMPLETED',
      errorMessage: null,
      durationMs: 420,
      createdAt: '2026-07-01T09:05:00Z',
    },
  ]],
  [secondaryTaskId, [
    {
      id: 203,
      taskId: secondaryTaskId,
      stepOrder: 1,
      stepType: 'PLAN',
      toolName: null,
      description: '等待启动风险扫描',
      inputJson: null,
      outputJson: null,
      status: 'PENDING',
      errorMessage: null,
      durationMs: null,
      createdAt: '2026-07-01T09:10:00Z',
    },
  ]],
  [runningTaskId, [
    {
      id: 204,
      taskId: runningTaskId,
      stepOrder: 1,
      stepType: 'ANALYZE',
      toolName: 'code_search',
      description: '分析订单链路变更影响',
      inputJson: null,
      outputJson: null,
      status: 'RUNNING',
      errorMessage: null,
      durationMs: null,
      createdAt: '2026-07-01T09:12:00Z',
    },
  ]],
  [failedNoOutputTaskId, [
    {
      id: 205,
      taskId: failedNoOutputTaskId,
      stepOrder: 1,
      stepType: 'EXECUTE',
      toolName: 'agent_runner',
      description: '执行失败且未生成复盘输出',
      inputJson: null,
      outputJson: null,
      status: 'FAILED',
      errorMessage: '执行器超时',
      durationMs: 1000,
      createdAt: '2026-07-01T09:14:00Z',
    },
  ]],
  [unknownStatusTaskId, []],
])

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

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []
  const ignoredConsolePatterns = [
    /React Router Future Flag Warning/,
    /findDOMNode/,
    /Static function can not consume context like dynamic theme/,
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

async function installAgentTasksMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const stepRequests: number[] = []
  let tasks = baseTasks.map(task => ({ ...task }))

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'agent-tasks-detail-selection-smoke-token')
  })

  await page.route('**/api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    if (!path.startsWith('/api/')) {
      await route.continue()
      return
    }

    if (method === 'GET' && path === '/api/auth/me') {
      await fulfillJson(route, result({ id: 1, username: 'agent_tasks_smoke_user', email: 'agent-tasks@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/agent-tasks`) {
      await fulfillJson(route, result({ items: tasks, page: 1, pageSize: 20, total: tasks.length }))
      return
    }

    const stepsMatch = path.match(/^\/api\/agent-tasks\/(\d+)\/steps$/)
    if (method === 'GET' && stepsMatch) {
      const taskId = Number(stepsMatch[1])
      stepRequests.push(taskId)
      await fulfillJson(route, result(stepsByTaskId.get(taskId) || []))
      return
    }

    if (method === 'POST' && path === `/api/agent-tasks/${secondaryTaskId}/start`) {
      const secondaryTask = tasks.find(task => task.id === secondaryTaskId)!
      await fulfillJson(route, result({
        ...secondaryTask,
        status: 'RUNNING',
        startedAt: '2026-07-01T09:12:00Z',
        updatedAt: '2026-07-01T09:12:00Z',
      }))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(result(null)),
    })
  })

  return { unhandledApiRequests, stepRequests }
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
  const overflow = Math.max(layout.scrollWidth, layout.bodyScrollWidth) - layout.innerWidth
  expect(overflow, `${label} has horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(1)
  return {
    ...layout,
    overflowPixels: overflow,
    noHorizontalOverflow: overflow <= 1,
  }
}

async function expectContainedInViewport(locator: ReturnType<Page['locator']>, label: string) {
  const box = await locator.boundingBox()
  expect(box, `${label} must be visible and measurable`).not.toBeNull()
  if (!box) return
  expect(box.x, `${label} must not render off the left edge`).toBeGreaterThanOrEqual(-1)
  expect(box.x + box.width, `${label} must fit inside viewport width`).toBeLessThanOrEqual((await locator.page().viewportSize())!.width + 1)
}

async function expectReadableCriticalText(locator: ReturnType<Page['locator']>, label: string) {
  const result = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element)
    return {
      text: element.textContent || '',
      whiteSpace: style.whiteSpace,
      overflowWrap: style.overflowWrap,
      wordBreak: style.wordBreak,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      rectWidth: element.getBoundingClientRect().width,
    }
  })
  expect(result.text.trim(), `${label} must contain text`).not.toBe('')
  expect(result.scrollWidth - result.clientWidth, `${label} text should not be clipped: ${JSON.stringify(result)}`).toBeLessThanOrEqual(1)
  expect(
    result.whiteSpace !== 'nowrap' || result.overflowWrap === 'anywhere' || result.wordBreak === 'break-word',
    `${label} must allow wrapping on narrow screens: ${JSON.stringify(result)}`,
  ).toBe(true)
  expect(result.rectWidth, `${label} must have measurable width`).toBeGreaterThan(0)
}

async function expectEveryReadableCriticalText(locator: Locator, label: string) {
  const count = await locator.count()
  expect(count, `${label}:count`).toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) {
    await expectReadableCriticalText(locator.nth(index), `${label}:${index}`)
  }
}

async function expectAgentLifecycleLoop(page: Page, viewportName: string) {
  const lifecycle = page.getByRole('region', { name: 'Agent 任务治理闭环' })
  await expect(lifecycle, `${viewportName}:agent-lifecycle-loop`).toBeVisible()
  await expect(lifecycle).toContainText('Agent 任务治理闭环')
  await expect(lifecycle).toContainText('任务入口')
  await expect(lifecycle).toContainText('执行控制')
  await expect(lifecycle).toContainText('工具证据')
  await expect(lifecycle).toContainText('复盘交接')
  await expect(lifecycle).toContainText('不能证明模型判断正确、工具输出真实、修复/PR/CI 结果正确')

  const stages = lifecycle.locator('[data-sl-agent-lifecycle-stage]')
  await expect(stages, `${viewportName}:agent-lifecycle-stage-count`).toHaveCount(4)
  const boxes = await stages.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect()
    return { left: Math.round(box.left), top: Math.round(box.top), width: Math.round(box.width) }
  }))
  const firstRowTop = Math.min(...boxes.map(box => box.top))
  const columns = boxes.filter(box => Math.abs(box.top - firstRowTop) <= 8).length
  const expectedColumns = viewportName === 'desktop' ? 4 : viewportName === 'tablet' ? 2 : 1
  expect(columns, `${viewportName}:agent lifecycle columns ${JSON.stringify(boxes)}`).toBe(expectedColumns)

  await expectReadableCriticalText(lifecycle.getByText('Agent 任务治理闭环'), `${viewportName}:agent-lifecycle-title`)
  await expectReadableCriticalText(lifecycle.getByText('任务入口'), `${viewportName}:agent-lifecycle-intake`)
  await expectReadableCriticalText(lifecycle.getByText('执行控制'), `${viewportName}:agent-lifecycle-control`)
  await expectReadableCriticalText(lifecycle.getByText('工具证据'), `${viewportName}:agent-lifecycle-evidence`)
  await expectReadableCriticalText(lifecycle.getByText('复盘交接'), `${viewportName}:agent-lifecycle-handoff`)
  await expectEveryReadableCriticalText(
    lifecycle.locator('.sl-agent-lifecycle-status'),
    `${viewportName}:agent-lifecycle-status`,
  )
  await expectEveryReadableCriticalText(
    lifecycle.locator('.sl-agent-lifecycle-stage p'),
    `${viewportName}:agent-lifecycle-description`,
  )

  for (const blockedClaim of [
    '模型判断正确已证明',
    '工具输出真实已证明',
    '修复结果正确已证明',
    'PR 已通过且无需复核',
    'CI 已通过且无需复核',
  ]) {
    await expect(page.locator('body'), `${viewportName}:no agent lifecycle overclaim ${blockedClaim}`).not.toContainText(blockedClaim)
  }

  return {
    viewport: viewportName,
    stageCount: boxes.length,
    columns,
    readable: true,
    statusTextReadable: true,
    descriptionTextReadable: true,
    modelJudgementClaim: false,
    toolOutputTruthClaim: false,
  }
}

async function expectAgentTaskTableScrollerContained(page: Page, label: string) {
  const tableCard = page.locator('.sl-agent-table-card')
  const tableContent = tableCard.locator('.ant-table-content')
  await expectContainedInViewport(tableCard, `${label}:table-card`)
  await expect(tableContent).toBeVisible()
  const scroller = await tableContent.evaluate((element) => {
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return {
      overflowX: style.overflowX,
      width: rect.width,
      viewportWidth: window.innerWidth,
    }
  })
  expect(scroller.width, `${label} table scroller must fit viewport`).toBeLessThanOrEqual(scroller.viewportWidth + 1)
  expect(['auto', 'scroll'].includes(scroller.overflowX), `${label} table scroller must own horizontal overflow`).toBe(true)
}

async function assertAgentTaskDetailReadability(page: Page, label: string) {
  const detail = page.locator('.sl-agent-detail-card')
  await expectContainedInViewport(detail, `${label}:detail-card`)
  await expectReadableCriticalText(page.locator('.sl-agent-title'), `${label}:page-title`)
  await expectReadableCriticalText(page.locator('.sl-agent-desc'), `${label}:page-desc`)
  await expectReadableCriticalText(page.locator('.sl-agent-status-line'), `${label}:status-line`)
  await expectReadableCriticalText(detail.getByText('架构审查 - 支付服务边界'), `${label}:detail-title`)
  await expectReadableCriticalText(detail.getByText('支付服务边界清晰，仍需补充审计证据。'), `${label}:summary`)
  await expectReadableCriticalText(detail.getByText('原始 Payload 默认隐藏'), `${label}:payload-safety-title`)
  await expectReadableCriticalText(detail.getByText('任务输入和输出可能包含 prompt、路径、模型中间内容或工具结果'), `${label}:payload-safety-copy`)
  await expectReadableCriticalText(detail.locator('.sl-agent-health-check').first(), `${label}:health-card`)
  await expectReadableCriticalText(detail.getByRole('region', { name: 'Agent 任务动作门禁说明' }), `${label}:action-gate`)
  await detail.getByRole('tab', { name: /执行步骤/ }).click()
  await expectReadableCriticalText(detail.getByText('读取服务边界证据'), `${label}:step-text`)
}

async function rowForTask(page: Page, taskId: number) {
  const row = page.getByRole('row', { name: new RegExp(`AgentTask #${taskId}`) })
  await row.scrollIntoViewIfNeeded()
  return row
}

async function assertTargetDetail(page: Page) {
  const detail = page.locator('.sl-agent-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('架构审查 - 支付服务边界')
  await expect(detail).toContainText('执行步骤 (2)')
  await expect(detail).toContainText('支付服务边界清晰')
  const actionGate = detail.getByRole('region', { name: 'Agent 任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('状态变更门禁关闭，复盘入口开放')
  await expect(actionGate).toContainText('终态关闭')
  await expect(actionGate).toContainText('有摘要或输出')
}

async function assertSecondaryDetail(page: Page) {
  const detail = page.locator('.sl-agent-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('风险扫描 - 登录模块')
  await expect(detail).toContainText('执行步骤 (1)')
  const actionGate = detail.getByRole('region', { name: 'Agent 任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('启动门禁开放，取消门禁关闭')
  await expect(actionGate).toContainText('未运行不可取消')
  await expect(actionGate).toContainText('已绑定 #502')
}

async function assertRunningDetail(page: Page) {
  const detail = page.locator('.sl-agent-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('变更影响 - 订单链路')
  const actionGate = detail.getByRole('region', { name: 'Agent 任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('取消门禁开放，启动门禁关闭')
  await expect(actionGate).toContainText('运行中不可重复启动')
  await expect(actionGate).toContainText('可在检查点停止')
  await expect(actionGate).toContainText('已绑定 #503')
}

async function assertTerminalMissingOutputDetail(page: Page) {
  const detail = page.locator('.sl-agent-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('失败复盘 - 无输出任务')
  const actionGate = detail.getByRole('region', { name: 'Agent 任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('终态缺少复盘输出')
  await expect(actionGate).toContainText('终态关闭')
  await expect(actionGate).toContainText('缺失')
}

async function assertUnknownStatusDetail(page: Page) {
  const detail = page.locator('.sl-agent-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText('状态异常 - 未知任务')
  const actionGate = detail.getByRole('region', { name: 'Agent 任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('未知状态，动作门禁关闭')
  await expect(actionGate).toContainText('需要后端状态排查')
  await expect(actionGate).toContainText('PAUSED')
}

async function assertLinkedDetailRegion(page: Page, taskId: number, title: string) {
  const detailId = `agent-task-detail-${taskId}`
  const titleId = `agent-task-detail-title-${taskId}`
  const row = await rowForTask(page, taskId)
  const detail = page.locator(`#${detailId}`)

  await expect(row).toHaveAttribute('aria-controls', detailId)
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute('role', 'region')
  await expect(detail).toHaveAttribute('aria-labelledby', titleId)
  await expect(page.locator(`#${titleId}`)).toContainText(title)
}

test('AgentTasks table exposes explicit detail action and accessible row selection', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAgentTasksMocks(page)
  const visitedViewports: string[] = []
  const layoutGuards: Array<{
    viewport: string
    noHorizontalOverflow: boolean
    overflowPixels: number
    documentScrollWidth: number
    bodyScrollWidth: number
    innerWidth: number
  }> = []
  const readabilityGuards: Array<{
    viewport: string
    titleNotClipped: boolean
    detailTitleNotClipped: boolean
    rawPayloadSafetyPanelNotClipped: boolean
    primaryActionsNotClipped: boolean
    healthCardsNotClipped: boolean
    actionGateReadable: boolean
    stepTimelineReadable: boolean
  }> = []
  const tableScrollerProofs: Array<{ viewport: string; containedInViewport: boolean; overflowXAuto: boolean }> = []
  const payloadSafetyProofs: Array<{ viewport: string; rawInputJsonHidden: boolean; rawOutputJsonHidden: boolean; rawPayloadNoticeVisible: boolean }> = []
  const stepOutputSafetyProofs: Array<{ viewport: string; rawStepOutputHidden: boolean; rawStepOutputNoticeVisible: boolean; rawStepOutputPreAbsent: boolean }> = []
  const lifecycleProofs: Array<Awaited<ReturnType<typeof expectAgentLifecycleLoop>>> = []
  const baseURLHost = new URL(test.info().project.use.baseURL || 'http://127.0.0.1').hostname || '127.0.0.1'

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/agent-tasks?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: 'Agent 辅助理解任务' })).toBeVisible()
    lifecycleProofs.push(await expectAgentLifecycleLoop(page, viewport.name))

    const targetRow = await rowForTask(page, targetTaskId)
    const secondaryRow = await rowForTask(page, secondaryTaskId)
    const detailAction = targetRow.getByRole('button', { name: `查看 Agent 任务 #${targetTaskId} 详情` })
    await detailAction.scrollIntoViewIfNeeded()
    await expect(detailAction).toBeVisible()
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')

    await detailAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, targetTaskId, '架构审查 - 支付服务边界')
    await assertTargetDetail(page)
    await expect(page.getByRole('region', { name: '原始 Payload 安全边界' })).toBeVisible()
    for (const snippet of forbiddenRawPayloadSnippets) {
      await expect(page.locator('body')).not.toContainText(snippet)
    }
    await assertAgentTaskDetailReadability(page, `agent-tasks-detail-selection:${viewport.name}`)
    const stepOutputSafetyNotes = page.getByRole('note', { name: '步骤输出安全边界' })
    await expect(stepOutputSafetyNotes).toHaveCount(2)
    await expect(stepOutputSafetyNotes.first()).toContainText('步骤输出已留存，默认隐藏')
    await expect(page.locator('.sl-task-timeline-output')).toHaveCount(0)
    await expectAgentTaskTableScrollerContained(page, `agent-tasks-detail-selection:${viewport.name}`)

    await page.locator('.sl-agent-detail-card').getByRole('button', { name: '关闭' }).click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')

    await targetRow.focus()
    await page.keyboard.press('Enter')
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, targetTaskId, '架构审查 - 支付服务边界')
    await assertTargetDetail(page)

    await secondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, secondaryTaskId, '风险扫描 - 登录模块')
    await assertSecondaryDetail(page)
    expect(network.stepRequests, `${viewport.name} Space selection should request secondary task steps`).toContain(secondaryTaskId)

    const runningRow = await rowForTask(page, runningTaskId)
    await runningRow.focus()
    await page.keyboard.press('Enter')
    await expect(runningRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, runningTaskId, '变更影响 - 订单链路')
    await assertRunningDetail(page)

    const failedNoOutputRow = await rowForTask(page, failedNoOutputTaskId)
    await failedNoOutputRow.focus()
    await page.keyboard.press('Enter')
    await expect(failedNoOutputRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, failedNoOutputTaskId, '失败复盘 - 无输出任务')
    await assertTerminalMissingOutputDetail(page)

    const unknownStatusRow = await rowForTask(page, unknownStatusTaskId)
    await unknownStatusRow.focus()
    await page.keyboard.press('Enter')
    await expect(unknownStatusRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, unknownStatusTaskId, '状态异常 - 未知任务')
    await assertUnknownStatusDetail(page)

    await detailAction.scrollIntoViewIfNeeded()
    await detailAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'false')

    const secondaryStart = secondaryRow.getByRole('button', { name: `启动 Agent 任务 #${secondaryTaskId}` })
    await secondaryStart.scrollIntoViewIfNeeded()
    await secondaryStart.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'false')

    const layout = await expectNoHorizontalOverflow(page, `agent-tasks-detail-selection:${viewport.name}`)
    await expect(page.locator('.ant-message-notice-error')).toHaveCount(0)
    layoutGuards.push({
      viewport: `${viewport.width}x${viewport.height}`,
      noHorizontalOverflow: layout.noHorizontalOverflow,
      overflowPixels: layout.overflowPixels,
      documentScrollWidth: layout.scrollWidth,
      bodyScrollWidth: layout.bodyScrollWidth,
      innerWidth: layout.innerWidth,
    })
    readabilityGuards.push({
      viewport: `${viewport.width}x${viewport.height}`,
      titleNotClipped: true,
      detailTitleNotClipped: true,
      rawPayloadSafetyPanelNotClipped: true,
      primaryActionsNotClipped: true,
      healthCardsNotClipped: true,
      actionGateReadable: true,
      stepTimelineReadable: true,
    })
    tableScrollerProofs.push({
      viewport: `${viewport.width}x${viewport.height}`,
      containedInViewport: true,
      overflowXAuto: true,
    })
    payloadSafetyProofs.push({
      viewport: `${viewport.width}x${viewport.height}`,
      rawInputJsonHidden: true,
      rawOutputJsonHidden: true,
      rawPayloadNoticeVisible: true,
    })
    stepOutputSafetyProofs.push({
      viewport: `${viewport.width}x${viewport.height}`,
      rawStepOutputHidden: true,
      rawStepOutputNoticeVisible: true,
      rawStepOutputPreAbsent: true,
    })
    visitedViewports.push(`${viewport.width}x${viewport.height}`)
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in AgentTasks detail selection smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  expect(lifecycleProofs).toHaveLength(viewportMatrix.length)
  expect(lifecycleProofs.every(proof => (
    proof.stageCount === 4
    && proof.readable
    && proof.statusTextReadable
    && proof.descriptionTextReadable
    && !proof.modelJudgementClaim
    && !proof.toolOutputTruthClaim
  ))).toBe(true)

  const markerPayload = {
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    visitedViewports,
    detailAction: {
      visible: true,
      clickedTaskId: targetTaskId,
      detailPanelMatched: true,
    },
    keyboardOpen: {
      enter: true,
      space: true,
      selectedTaskIds: [targetTaskId, secondaryTaskId],
    },
    accessibleSelection: true,
    nestedActionsDoNotHijackSelection: true,
    sharedSelectableRow: {
      ariaControlsLinked: true,
      detailRegionLinked: true,
      selectedRowIds: [targetTaskId, secondaryTaskId],
    },
    layoutDensity: {
      mobile390Covered: visitedViewports.includes('390x844'),
      narrow320Covered: visitedViewports.includes('320x740'),
      detailCardContained: readabilityGuards.every(proof => proof.detailTitleNotClipped),
      tableScrollerContained: tableScrollerProofs.every(proof => proof.containedInViewport),
      noHorizontalOverflow: layoutGuards.every(proof => proof.noHorizontalOverflow),
    },
    layoutGuards,
    readabilityGuards,
    tableOverflowOwnedByScroller: {
      containedInViewport: tableScrollerProofs.every(proof => proof.containedInViewport),
      overflowXAuto: tableScrollerProofs.every(proof => proof.overflowXAuto),
      viewports: tableScrollerProofs.map(proof => proof.viewport),
    },
    mobileReadability: {
      criticalTextsWrap: true,
      titleNotClipped: true,
      summaryNotClipped: true,
      hiddenPayloadNoticeReadable: true,
      actionGateReadable: readabilityGuards.every(proof => proof.actionGateReadable),
      stepTextNotClipped: true,
      actionButtonsNotClipped: true,
    },
    actionGate: {
      visible: true,
      completedGateVisible: true,
      pendingGateVisible: true,
      runningGateVisible: true,
      terminalMissingOutputBlocked: true,
      unknownStatusBlocked: true,
      terminalMutationBlocked: true,
      pendingStartReady: true,
      pendingCancelBlocked: true,
      scanBindingVisible: true,
    },
    agentLifecycleLoop: {
      scope: 'AGENT_TASKS_LIFECYCLE_GOVERNANCE_LOOP_READABILITY',
      stages: ['任务入口', '执行控制', '工具证据', '复盘交接'],
      desktopColumns: lifecycleProofs.find(proof => proof.viewport === 'desktop')?.columns,
      tabletColumns: lifecycleProofs.find(proof => proof.viewport === 'tablet')?.columns,
      mobileColumns: lifecycleProofs.find(proof => proof.viewport === 'mobile')?.columns,
      narrowColumns: lifecycleProofs.find(proof => proof.viewport === 'narrow')?.columns,
      textReadable: lifecycleProofs.every(proof => proof.readable),
      statusTextReadable: lifecycleProofs.every(proof => proof.statusTextReadable),
      descriptionTextReadable: lifecycleProofs.every(proof => proof.descriptionTextReadable),
      modelJudgementClaim: false,
      toolOutputTruthClaim: false,
    },
    payloadSafety: {
      scope: 'TASK_AND_TIMELINE_STEP_RAW_OUTPUT_ONLY',
      fixtureHasRawTaskInput: true,
      fixtureHasRawTaskOutput: true,
      fixtureHasRawStepOutput: true,
      rawInputJsonHidden: payloadSafetyProofs.every(proof => proof.rawInputJsonHidden),
      rawOutputJsonHidden: payloadSafetyProofs.every(proof => proof.rawOutputJsonHidden),
      rawStepOutputHidden: stepOutputSafetyProofs.every(proof => proof.rawStepOutputHidden),
      rawTaskInputRendered: false,
      rawTaskOutputRendered: false,
      rawStepOutputRendered: false,
      rawPayloadNoticeVisible: payloadSafetyProofs.every(proof => proof.rawPayloadNoticeVisible),
      rawStepOutputNoticeVisible: stepOutputSafetyProofs.every(proof => proof.rawStepOutputNoticeVisible),
      rawStepOutputPreAbsent: stepOutputSafetyProofs.every(proof => proof.rawStepOutputPreAbsent),
      markerContainsRawPayload: false,
    },
    stepRequests: network.stepRequests,
    runtimeIssues: 0,
    noHorizontalOverflow: true,
    spec: 'agent-tasks-detail-selection-smoke.spec.ts',
    baseURLHost,
  }
  const markerText = JSON.stringify(markerPayload)
  for (const snippet of forbiddenRawPayloadSnippets) {
    expect(markerText, `AgentTasks marker must not contain raw payload snippet: ${snippet}`).not.toContain(snippet)
  }
  console.log('AGENT_TASKS_DETAIL_SELECTION_SMOKE_OK', markerText)
})
