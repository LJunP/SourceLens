import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type ExecutionTaskFixture = {
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

const projectId = 1
const targetTaskId = 301
const secondaryTaskId = 302
const failedNoEvidenceTaskId = 303
const unknownStatusTaskId = 304
const failedWithEvidenceTaskId = 305
const cancelledTaskId = 306
const targetLongStep = 'publish_report_with_cross_file_evidence_quality_gate_and_long_identifier_20260703'
const secondaryLongStep = 'generate_patch_with_policy_guard_and_recoverable_execution_checkpoint_20260703'
const targetLogSafePrefix = 'Execution report ready after source-location-stability-checkpoint'
const secondaryLogSafePrefix = 'Generating patch with sandbox-policy-evidence-checkpoint'
const rawBearerSecret = 'Bearer raw-log-token-should-not-render'
const rawAuthorizationSecret = `Authorization: ${rawBearerSecret}`
const rawApiKeySecret = 'apiKey=sk-log-secret-should-not-render'
const rawPasswordSecret = 'password=plain-log-password-should-not-render'
const rawJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsb2ctc2VjcmV0In0.signatureShouldNotRender'
const targetLongLog = `${targetLogSafePrefix} ${rawAuthorizationSecret} ${rawApiKeySecret}`
const secondaryLongLog = `${secondaryLogSafePrefix} token=secondary-log-token-should-not-render secret=secondary-log-secret-should-not-render ${rawPasswordSecret} ${rawJwtSecret}`
const staleDetailSentinel = 'STALE_EXECUTION_DETAIL_SHOULD_NOT_RENDER'
const secondaryCancelResponseSentinel = 'CURRENT_CANCEL_RESPONSE_DETAIL_SHOULD_RENDER'
const forbiddenLogSecretSnippets = [
  rawBearerSecret,
  rawAuthorizationSecret,
  rawApiKeySecret,
  rawPasswordSecret,
  rawJwtSecret,
  'secondary-log-token-should-not-render',
  'secondary-log-secret-should-not-render',
  'plain-log-password-should-not-render',
  'sk-log-secret-should-not-render',
  'signatureShouldNotRender',
]

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'Execution Tasks Smoke Project',
  description: 'Mocked project for ExecutionTasks detail selection smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 90,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const baseTasks: ExecutionTaskFixture[] = [
  {
    id: targetTaskId,
    projectId,
    repositoryId: 11,
    taskType: 'SCAN_TASK',
    sourceType: 'SCAN_TASK',
    sourceId: 501,
    status: 'SUCCESS',
    currentStep: targetLongStep,
    currentAttemptId: 401,
    progress: 100,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-07-01T10:01:00Z',
    finishedAt: '2026-07-01T10:09:00Z',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:09:00Z',
  },
  {
    id: secondaryTaskId,
    projectId,
    repositoryId: 12,
    taskType: 'AUTO_REPAIR',
    sourceType: 'AUTO_REPAIR',
    sourceId: 601,
    status: 'RUNNING',
    currentStep: secondaryLongStep,
    currentAttemptId: 402,
    progress: 62,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-07-01T10:12:00Z',
    finishedAt: null,
    createdAt: '2026-07-01T10:10:00Z',
    updatedAt: '2026-07-01T10:13:00Z',
  },
  {
    id: failedNoEvidenceTaskId,
    projectId,
    repositoryId: null,
    taskType: 'CI_DIAGNOSTIC',
    sourceType: null,
    sourceId: null,
    status: 'FAILED',
    currentStep: null,
    currentAttemptId: null,
    progress: 0,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-07-01T10:18:00Z',
    finishedAt: '2026-07-01T10:19:00Z',
    createdAt: '2026-07-01T10:18:00Z',
    updatedAt: '2026-07-01T10:19:00Z',
  },
  {
    id: unknownStatusTaskId,
    projectId,
    repositoryId: 13,
    taskType: 'AGENT_TASK',
    sourceType: 'AGENT_TASK',
    sourceId: 701,
    status: 'PAUSED',
    currentStep: 'paused_for_manual_state_machine_check',
    currentAttemptId: null,
    progress: 41,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-07-01T10:20:00Z',
    finishedAt: null,
    createdAt: '2026-07-01T10:20:00Z',
    updatedAt: '2026-07-01T10:21:00Z',
  },
  {
    id: failedWithEvidenceTaskId,
    projectId,
    repositoryId: 14,
    taskType: 'PR_REVIEW',
    sourceType: 'PR_REVIEW',
    sourceId: 801,
    status: 'FAILED',
    currentStep: 'review_policy_gate_failed_with_log_evidence',
    currentAttemptId: 403,
    progress: 73,
    errorMessage: 'PR review policy gate failed',
    createdBy: 1,
    startedAt: '2026-07-01T10:22:00Z',
    finishedAt: '2026-07-01T10:24:00Z',
    createdAt: '2026-07-01T10:22:00Z',
    updatedAt: '2026-07-01T10:24:00Z',
  },
  {
    id: cancelledTaskId,
    projectId,
    repositoryId: 15,
    taskType: 'ISSUE_DECOMPOSITION',
    sourceType: 'ISSUE_DECOMPOSITION',
    sourceId: 901,
    status: 'CANCELLED',
    currentStep: 'issue_decomposition_cancelled_after_user_checkpoint',
    currentAttemptId: 404,
    progress: 36,
    errorMessage: null,
    createdBy: 1,
    startedAt: '2026-07-01T10:25:00Z',
    finishedAt: '2026-07-01T10:27:00Z',
    createdAt: '2026-07-01T10:25:00Z',
    updatedAt: '2026-07-01T10:27:00Z',
  },
]

const detailsByTaskId = new Map<number, unknown>([
  [targetTaskId, {
    task: baseTasks[0],
    attempts: [
      {
        id: 401,
        taskId: targetTaskId,
        attemptNo: 1,
        status: 'SUCCESS',
        currentStep: targetLongStep,
        errorMessage: null,
        startedAt: '2026-07-01T10:01:00Z',
        finishedAt: '2026-07-01T10:09:00Z',
        createdAt: '2026-07-01T10:00:00Z',
        updatedAt: '2026-07-01T10:09:00Z',
      },
    ],
    steps: [
      {
        id: 501,
        taskId: targetTaskId,
        attemptId: 401,
        stepKey: 'clone_repo',
        stepName: '克隆仓库',
        status: 'SUCCESS',
        logSummary: 'Repository cloned',
        errorMessage: null,
        startedAt: '2026-07-01T10:01:00Z',
        finishedAt: '2026-07-01T10:02:00Z',
        createdAt: '2026-07-01T10:01:00Z',
        updatedAt: '2026-07-01T10:02:00Z',
      },
      {
        id: 502,
        taskId: targetTaskId,
        attemptId: 401,
        stepKey: targetLongStep,
        stepName: '发布报告',
        status: 'SUCCESS',
        logSummary: 'Report published with source-location-stability-checkpoint-and-audit-evidence-token-aaaaaaaaaaaaaaaaaaaaaaaa',
        errorMessage: null,
        startedAt: '2026-07-01T10:08:00Z',
        finishedAt: '2026-07-01T10:09:00Z',
        createdAt: '2026-07-01T10:08:00Z',
        updatedAt: '2026-07-01T10:09:00Z',
      },
    ],
    logs: [
      {
        id: 701,
        taskId: targetTaskId,
        attemptId: 401,
        stepKey: targetLongStep,
        level: 'INFO',
        message: targetLongLog,
        createdAt: '2026-07-01T10:09:00Z',
      },
    ],
  }],
  [secondaryTaskId, {
    task: baseTasks[1],
    attempts: [
      {
        id: 402,
        taskId: secondaryTaskId,
        attemptNo: 1,
        status: 'RUNNING',
        currentStep: secondaryLongStep,
        errorMessage: null,
        startedAt: '2026-07-01T10:12:00Z',
        finishedAt: null,
        createdAt: '2026-07-01T10:10:00Z',
        updatedAt: '2026-07-01T10:13:00Z',
      },
    ],
    steps: [
      {
        id: 503,
        taskId: secondaryTaskId,
        attemptId: 402,
        stepKey: secondaryLongStep,
        stepName: '生成补丁',
        status: 'RUNNING',
        logSummary: 'Patch generation in progress with sandbox-policy-evidence-checkpoint-bbbbbbbbbbbbbbbbbbbbbbbb',
        errorMessage: null,
        startedAt: '2026-07-01T10:12:00Z',
        finishedAt: null,
        createdAt: '2026-07-01T10:12:00Z',
        updatedAt: '2026-07-01T10:13:00Z',
      },
    ],
    logs: [
      {
        id: 702,
        taskId: secondaryTaskId,
        attemptId: 402,
        stepKey: secondaryLongStep,
        level: 'INFO',
        message: secondaryLongLog,
        createdAt: '2026-07-01T10:13:00Z',
      },
    ],
  }],
  [failedNoEvidenceTaskId, {
    task: baseTasks[2],
    attempts: [],
    steps: [],
    logs: [],
  }],
  [unknownStatusTaskId, {
    task: baseTasks[3],
    attempts: [],
    steps: [],
    logs: [],
  }],
  [failedWithEvidenceTaskId, {
    task: baseTasks[4],
    attempts: [
      {
        id: 403,
        taskId: failedWithEvidenceTaskId,
        attemptNo: 1,
        status: 'FAILED',
        currentStep: 'review_policy_gate_failed_with_log_evidence',
        errorMessage: 'PR review policy gate failed',
        startedAt: '2026-07-01T10:22:00Z',
        finishedAt: '2026-07-01T10:24:00Z',
        createdAt: '2026-07-01T10:22:00Z',
        updatedAt: '2026-07-01T10:24:00Z',
      },
    ],
    steps: [
      {
        id: 504,
        taskId: failedWithEvidenceTaskId,
        attemptId: 403,
        stepKey: 'review_policy_gate_failed_with_log_evidence',
        stepName: 'PR 策略门禁',
        status: 'FAILED',
        logSummary: 'PR review failed after protected-branch-policy-evidence-checkpoint',
        errorMessage: 'PR review policy gate failed',
        startedAt: '2026-07-01T10:23:00Z',
        finishedAt: '2026-07-01T10:24:00Z',
        createdAt: '2026-07-01T10:23:00Z',
        updatedAt: '2026-07-01T10:24:00Z',
      },
    ],
    logs: [
      {
        id: 703,
        taskId: failedWithEvidenceTaskId,
        attemptId: 403,
        stepKey: 'review_policy_gate_failed_with_log_evidence',
        level: 'ERROR',
        message: 'PR review failed after protected-branch-policy-evidence-checkpoint',
        createdAt: '2026-07-01T10:24:00Z',
      },
    ],
  }],
  [cancelledTaskId, {
    task: baseTasks[5],
    attempts: [
      {
        id: 404,
        taskId: cancelledTaskId,
        attemptNo: 1,
        status: 'CANCELLED',
        currentStep: 'issue_decomposition_cancelled_after_user_checkpoint',
        errorMessage: null,
        startedAt: '2026-07-01T10:25:00Z',
        finishedAt: '2026-07-01T10:27:00Z',
        createdAt: '2026-07-01T10:25:00Z',
        updatedAt: '2026-07-01T10:27:00Z',
      },
    ],
    steps: [
      {
        id: 505,
        taskId: cancelledTaskId,
        attemptId: 404,
        stepKey: 'issue_decomposition_cancelled_after_user_checkpoint',
        stepName: 'Issue 拆解等待点',
        status: 'CANCELLED',
        logSummary: 'Issue decomposition cancelled after explicit user checkpoint',
        errorMessage: null,
        startedAt: '2026-07-01T10:26:00Z',
        finishedAt: '2026-07-01T10:27:00Z',
        createdAt: '2026-07-01T10:26:00Z',
        updatedAt: '2026-07-01T10:27:00Z',
      },
    ],
    logs: [],
  }],
])

const staleSecondaryDetail = {
  task: {
    ...baseTasks[1],
    currentStep: staleDetailSentinel,
    updatedAt: '2026-07-01T10:13:30Z',
  },
  attempts: [
    {
      id: 492,
      taskId: secondaryTaskId,
      attemptNo: 1,
      status: 'RUNNING',
      currentStep: staleDetailSentinel,
      errorMessage: null,
      startedAt: '2026-07-01T10:12:00Z',
      finishedAt: null,
      createdAt: '2026-07-01T10:10:00Z',
      updatedAt: '2026-07-01T10:13:30Z',
    },
  ],
  steps: [
    {
      id: 592,
      taskId: secondaryTaskId,
      attemptId: 492,
      stepKey: staleDetailSentinel,
      stepName: '旧刷新详情',
      status: 'RUNNING',
      logSummary: staleDetailSentinel,
      errorMessage: null,
      startedAt: '2026-07-01T10:13:00Z',
      finishedAt: null,
      createdAt: '2026-07-01T10:13:00Z',
      updatedAt: '2026-07-01T10:13:30Z',
    },
  ],
  logs: [
    {
      id: 792,
      taskId: secondaryTaskId,
      attemptId: 492,
      stepKey: staleDetailSentinel,
      level: 'INFO',
      message: staleDetailSentinel,
      createdAt: '2026-07-01T10:13:30Z',
    },
  ],
}

const secondaryCancelledTask = {
  ...baseTasks[1],
  status: 'CANCELLED',
  currentStep: secondaryCancelResponseSentinel,
  progress: 64,
  finishedAt: '2026-07-01T10:14:00Z',
  updatedAt: '2026-07-01T10:14:00Z',
}

const secondaryCancelledDetail = {
  task: secondaryCancelledTask,
  attempts: [
    {
      id: 493,
      taskId: secondaryTaskId,
      attemptNo: 1,
      status: 'CANCELLED',
      currentStep: secondaryCancelResponseSentinel,
      errorMessage: null,
      startedAt: '2026-07-01T10:12:00Z',
      finishedAt: '2026-07-01T10:14:00Z',
      createdAt: '2026-07-01T10:10:00Z',
      updatedAt: '2026-07-01T10:14:00Z',
    },
  ],
  steps: [
    {
      id: 593,
      taskId: secondaryTaskId,
      attemptId: 493,
      stepKey: secondaryCancelResponseSentinel,
      stepName: '取消响应检查点',
      status: 'CANCELLED',
      logSummary: secondaryCancelResponseSentinel,
      errorMessage: null,
      startedAt: '2026-07-01T10:13:50Z',
      finishedAt: '2026-07-01T10:14:00Z',
      createdAt: '2026-07-01T10:13:50Z',
      updatedAt: '2026-07-01T10:14:00Z',
    },
  ],
  logs: [
    {
      id: 793,
      taskId: secondaryTaskId,
      attemptId: 493,
      stepKey: secondaryCancelResponseSentinel,
      level: 'INFO',
      message: secondaryCancelResponseSentinel,
      createdAt: '2026-07-01T10:14:00Z',
    },
  ],
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

async function installExecutionTasksMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const detailRequests: number[] = []
  const cancelRequests: number[] = []
  let secondaryCancelled = false
  let delayNextSecondaryDetailRequest = false
  let delayedSecondaryDetailRoute: Route | null = null
  let delayedSecondaryDetailRequests = 0
  let releasedDelayedSecondaryDetailResponses = 0

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'execution-tasks-detail-selection-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'execution_tasks_smoke_user', email: 'execution-tasks@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      const items = secondaryCancelled
        ? baseTasks.map(task => task.id === secondaryTaskId ? secondaryCancelledTask : task)
        : baseTasks
      await fulfillJson(route, result({ items, page: 1, pageSize: 20, total: items.length }))
      return
    }

    const detailMatch = path.match(/^\/api\/projects\/(\d+)\/execution-tasks\/(\d+)$/)
    if (method === 'GET' && detailMatch) {
      const taskId = Number(detailMatch[2])
      detailRequests.push(taskId)
      if (taskId === secondaryTaskId && delayNextSecondaryDetailRequest) {
        delayNextSecondaryDetailRequest = false
        delayedSecondaryDetailRoute = route
        delayedSecondaryDetailRequests += 1
        return
      }
      const detail = secondaryCancelled && taskId === secondaryTaskId
        ? secondaryCancelledDetail
        : detailsByTaskId.get(taskId)
      await fulfillJson(route, result(detail))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/execution-tasks/${secondaryTaskId}/cancel`) {
      cancelRequests.push(secondaryTaskId)
      secondaryCancelled = true
      await fulfillJson(route, result(secondaryCancelledDetail))
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
    unhandledApiRequests,
    detailRequests,
    cancelRequests,
    delayNextSecondaryDetailRequest: () => {
      delayNextSecondaryDetailRequest = true
    },
    releaseDelayedSecondaryDetail: async () => {
      expect(delayedSecondaryDetailRoute, 'Delayed secondary detail route should exist before release.').not.toBeNull()
      const route = delayedSecondaryDetailRoute
      delayedSecondaryDetailRoute = null
      releasedDelayedSecondaryDetailResponses += 1
      await fulfillJson(route!, result(staleSecondaryDetail))
    },
    resetSecondaryCancellation: () => {
      secondaryCancelled = false
      delayNextSecondaryDetailRequest = false
      delayedSecondaryDetailRoute = null
    },
    get delayedSecondaryDetailRequests() {
      return delayedSecondaryDetailRequests
    },
    get releasedDelayedSecondaryDetailResponses() {
      return releasedDelayedSecondaryDetailResponses
    },
  }
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

async function expectContainedInViewport(locator: Locator, label: string) {
  await expect.poll(async () => {
    const viewportWidth = await locator.page().evaluate(() => window.innerWidth)
    return locator.evaluate((element, width) => {
      const box = element.getBoundingClientRect()
      return Math.max(-box.x, box.x + box.width - width)
    }, viewportWidth)
  }, { message: `${label} must stay inside viewport after layout settles` }).toBeLessThanOrEqual(1)
}

async function expectReadableCriticalText(locator: Locator, label: string) {
  await expect(locator, `${label}:text-node`).toBeVisible()
  const metrics = await locator.evaluate(element => {
    const style = window.getComputedStyle(element)
    return {
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      whiteSpace: style.whiteSpace,
      overflowWrap: style.overflowWrap,
      wordBreak: style.wordBreak,
    }
  })

  expect(metrics.whiteSpace, `${label} must not force single-line truncation: ${JSON.stringify(metrics)}`).not.toBe('nowrap')
  expect(
    metrics.overflowWrap === 'anywhere' || metrics.wordBreak === 'break-word' || metrics.wordBreak === 'break-all',
    `${label} must allow long identifiers to wrap: ${JSON.stringify(metrics)}`,
  ).toBe(true)
  expect(metrics.scrollWidth - metrics.clientWidth, `${label} is clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(1)
}

async function expectEveryReadableCriticalText(locator: Locator, label: string) {
  const count = await locator.count()
  expect(count, `${label}:count`).toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) {
    await expectReadableCriticalText(locator.nth(index), `${label}:${index}`)
  }
}

async function waitForAnimationFrames(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
}

async function expectExecutionTableScrollerContained(page: Page, label: string) {
  const tableCard = page.locator('.sl-execution-table-card').first()
  await expect(tableCard, `${label}:table-card`).toBeVisible()
  await expectContainedInViewport(tableCard, `${label}:table-card`)

  const tableScroller = tableCard.locator('.ant-table-content').first()
  await expect(tableScroller, `${label}:table-scroller`).toBeVisible()
  const overflowX = await tableScroller.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}:table-scroller must own horizontal overflow, got ${overflowX}`).toBe(true)
}

async function rowForTask(page: Page, taskId: number) {
  const row = page.getByRole('row', { name: new RegExp(`ExecutionTask #${taskId}`) })
  await row.scrollIntoViewIfNeeded()
  return row
}

async function assertTargetDetail(page: Page) {
  const detail = page.locator('.sl-execution-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText(`任务 #${targetTaskId}`)
  await expect(detail).toContainText('代码扫描')
  await expect(detail).toContainText('执行日志')
  await expect(detail).toContainText(targetLogSafePrefix)
  await expect(detail).toContainText('[REDACTED')
  for (const snippet of forbiddenLogSecretSnippets) {
    await expect(detail).not.toContainText(snippet)
  }
  const actionGate = detail.getByRole('region', { name: '执行任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('状态变更门禁关闭，来源和产物复盘开放')
  await expect(actionGate).toContainText('终态关闭')
  await expect(actionGate).toContainText('可复盘')
}

async function assertSecondaryDetail(page: Page) {
  const detail = page.locator('.sl-execution-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText(`任务 #${secondaryTaskId}`)
  await expect(detail).toContainText('补丁生成')
  await expect(detail).toContainText(secondaryLogSafePrefix)
  await expect(detail).toContainText('[REDACTED')
  for (const snippet of forbiddenLogSecretSnippets) {
    await expect(detail).not.toContainText(snippet)
  }
  await expect(detail).not.toContainText(targetLogSafePrefix)
  const actionGate = detail.getByRole('region', { name: '执行任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('取消门禁开放，来源和证据复核同步开放')
  await expect(actionGate).toContainText('可在检查点停止')
  await expect(actionGate).toContainText('未形成')
}

async function assertFailedNoEvidenceDetail(page: Page) {
  const detail = page.locator('.sl-execution-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText(`任务 #${failedNoEvidenceTaskId}`)
  await expect(detail).toContainText('CI 诊断')
  const actionGate = detail.getByRole('region', { name: '执行任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('失败任务缺少复盘证据')
  await expect(actionGate).toContainText('先补证据')
  await expect(actionGate).toContainText('来源缺失')
}

async function assertUnknownStatusDetail(page: Page) {
  const detail = page.locator('.sl-execution-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText(`任务 #${unknownStatusTaskId}`)
  await expect(detail).toContainText('Agent 分析')
  const actionGate = detail.getByRole('region', { name: '执行任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('未知状态，动作门禁关闭')
  await expect(actionGate).toContainText('需要后端状态排查')
  await expect(actionGate).toContainText('PAUSED')
}

async function assertFailedWithEvidenceDetail(page: Page) {
  const detail = page.locator('.sl-execution-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText(`任务 #${failedWithEvidenceTaskId}`)
  await expect(detail).toContainText('PR 审查')
  const actionGate = detail.getByRole('region', { name: '执行任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('失败复盘开放，状态变更门禁关闭')
  await expect(actionGate).toContainText('失败终态关闭')
  await expect(actionGate).toContainText('先复盘再重跑')
}

async function assertCancelledDetail(page: Page) {
  const detail = page.locator('.sl-execution-detail-card')
  await expect(detail).toBeVisible()
  await expect(detail).toContainText(`任务 #${cancelledTaskId}`)
  await expect(detail).toContainText('Issue 拆解')
  const actionGate = detail.getByRole('region', { name: '执行任务动作门禁说明' })
  await expect(actionGate).toBeVisible()
  await expect(actionGate).toContainText('取消终态冻结，复盘入口开放')
  await expect(actionGate).toContainText('已完成')
  await expect(actionGate).toContainText('回来源发起')
}

async function assertExecutionDetailReadability(page: Page, label: string) {
  const detailCard = page.locator('.sl-execution-detail-card').first()
  await expect(detailCard, `${label}:detail-card`).toBeVisible()
  await expectContainedInViewport(detailCard, `${label}:detail-card`)
  await expectNoHorizontalOverflow(page, `${label}:detail-open`)

  await expectReadableCriticalText(
    detailCard.getByText(targetLongStep).or(detailCard.getByText(secondaryLongStep)).first(),
    `${label}:current-step`,
  )
  await expectReadableCriticalText(
    detailCard.getByText(targetLogSafePrefix).or(detailCard.getByText(secondaryLogSafePrefix)).first(),
    `${label}:log-message`,
  )
  await expect(detailCard.getByLabel('脱敏执行日志').first()).toBeVisible()
  await expectReadableCriticalText(
    detailCard.getByRole('region', { name: '执行任务动作门禁说明' }),
    `${label}:action-gate`,
  )
  await expectReadableCriticalText(
    detailCard
      .getByText('Report published with source-location-stability-checkpoint-and-audit-evidence-token-aaaaaaaaaaaaaaaaaaaaaaaa')
      .or(detailCard.getByText('Patch generation in progress with sandbox-policy-evidence-checkpoint-bbbbbbbbbbbbbbbbbbbbbbbb'))
      .first(),
    `${label}:timeline-description`,
  )
}

async function expectExecutionLifecycleLoop(page: Page, viewportName: string) {
  const lifecycle = page.getByRole('region', { name: '执行生命周期治理闭环' })
  await expect(lifecycle, `${viewportName}:execution-lifecycle-loop`).toBeVisible()
  await expect(lifecycle).toContainText('执行生命周期治理闭环')
  await expect(lifecycle).toContainText('来源接入')
  await expect(lifecycle).toContainText('调度控制')
  await expect(lifecycle).toContainText('证据采集')
  await expect(lifecycle).toContainText('复盘交接')
  await expect(lifecycle).toContainText('不能证明真实执行质量、产物正确、CI/PR/AutoRepair 或 LLM 结果已经正确')

  const stages = lifecycle.locator('[data-sl-execution-lifecycle-stage]')
  await expect(stages, `${viewportName}:execution-lifecycle-stage-count`).toHaveCount(4)
  const boxes = await stages.evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect()
    return { left: Math.round(box.left), top: Math.round(box.top), width: Math.round(box.width) }
  }))
  const firstRowTop = Math.min(...boxes.map(box => box.top))
  const columns = boxes.filter(box => Math.abs(box.top - firstRowTop) <= 8).length
  const expectedColumns = viewportName === 'desktop' ? 4 : viewportName === 'tablet' ? 2 : 1
  expect(columns, `${viewportName}:execution lifecycle columns ${JSON.stringify(boxes)}`).toBe(expectedColumns)

  await expectReadableCriticalText(lifecycle.getByText('执行生命周期治理闭环'), `${viewportName}:execution-lifecycle-title`)
  await expectReadableCriticalText(lifecycle.getByText('来源接入'), `${viewportName}:execution-lifecycle-source`)
  await expectReadableCriticalText(lifecycle.getByText('调度控制'), `${viewportName}:execution-lifecycle-dispatch`)
  await expectReadableCriticalText(lifecycle.getByText('证据采集'), `${viewportName}:execution-lifecycle-evidence`)
  await expectReadableCriticalText(lifecycle.getByText('复盘交接'), `${viewportName}:execution-lifecycle-review`)
  await expectEveryReadableCriticalText(
    lifecycle.locator('.sl-execution-lifecycle-status'),
    `${viewportName}:execution-lifecycle-status`,
  )
  await expectEveryReadableCriticalText(
    lifecycle.locator('.sl-execution-lifecycle-stage p'),
    `${viewportName}:execution-lifecycle-description`,
  )

  for (const blockedClaim of [
    '真实执行质量已证明',
    '产物正确已证明',
    'CI 已通过且无需复核',
    'AutoRepair 修复正确已证明',
    'LLM 判断正确已证明',
  ]) {
    await expect(page.locator('body'), `${viewportName}:no execution lifecycle overclaim ${blockedClaim}`).not.toContainText(blockedClaim)
  }

  return {
    viewport: viewportName,
    stageCount: boxes.length,
    columns,
    readable: true,
    statusTextReadable: true,
    descriptionTextReadable: true,
    executionQualityClaim: false,
    llmFactClaim: false,
  }
}

async function assertDelayedSecondaryRefreshCannotOverwriteCancel(
  page: Page,
  network: Awaited<ReturnType<typeof installExecutionTasksMocks>>,
  label: string,
) {
  const detail = page.locator('.sl-execution-detail-card').first()
  const delayedBefore = network.delayedSecondaryDetailRequests
  const releasedBefore = network.releasedDelayedSecondaryDetailResponses

  network.delayNextSecondaryDetailRequest()
  await page.getByRole('button', { name: '刷新执行任务' }).click()
  await expect.poll(
    () => network.delayedSecondaryDetailRequests,
    { message: `${label}: secondary refresh detail request must be delayed` },
  ).toBeGreaterThan(delayedBefore)

  await detail.getByRole('button', { name: `取消任务 #${secondaryTaskId}` }).click()
  await page.getByRole('button', { name: '取消任务' }).last().click()
  await expect(detail, `${label}:cancel response visible`).toContainText(secondaryCancelResponseSentinel)

  await network.releaseDelayedSecondaryDetail()
  await expect.poll(
    () => network.releasedDelayedSecondaryDetailResponses,
    { message: `${label}: delayed secondary detail response must be released` },
  ).toBeGreaterThan(releasedBefore)
  await waitForAnimationFrames(page)

  await expect(page.locator('body'), `${label}:stale detail sentinel rejected`).not.toContainText(staleDetailSentinel)
  await expect(detail, `${label}:cancel response preserved`).toContainText(secondaryCancelResponseSentinel)

  return {
    viewport: label,
    delayedRefreshObserved: true,
    delayedResponseReleased: true,
    cancelResponsePreserved: true,
    staleDetailRejected: true,
  }
}

async function assertDelayedSecondaryLoadCannotOverwriteCancel(
  page: Page,
  network: Awaited<ReturnType<typeof installExecutionTasksMocks>>,
  secondaryRow: Locator,
  label: string,
) {
  const delayedBefore = network.delayedSecondaryDetailRequests
  const releasedBefore = network.releasedDelayedSecondaryDetailResponses

  network.delayNextSecondaryDetailRequest()
  await secondaryRow.focus()
  await page.keyboard.press('Space')
  await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
  await expect.poll(
    () => network.delayedSecondaryDetailRequests,
    { message: `${label}: explicit secondary detail load must be delayed` },
  ).toBeGreaterThan(delayedBefore)

  const detail = page.locator('.sl-execution-detail-card').first()
  await detail.getByRole('button', { name: `取消任务 #${secondaryTaskId}` }).click()
  await page.getByRole('button', { name: '取消任务' }).last().click()
  await expect(detail, `${label}:cancel response visible`).toContainText(secondaryCancelResponseSentinel)
  await expect(detail.locator('.ant-spin-spinning'), `${label}:detail loading cleared by cancel`).toHaveCount(0)

  await network.releaseDelayedSecondaryDetail()
  await expect.poll(
    () => network.releasedDelayedSecondaryDetailResponses,
    { message: `${label}: delayed explicit secondary detail response must be released` },
  ).toBeGreaterThan(releasedBefore)
  await waitForAnimationFrames(page)

  await expect(page.locator('body'), `${label}:stale explicit detail sentinel rejected`).not.toContainText(staleDetailSentinel)
  await expect(detail, `${label}:cancel response preserved`).toContainText(secondaryCancelResponseSentinel)
  await expect(detail.locator('.ant-spin-spinning'), `${label}:detail loading still cleared`).toHaveCount(0)

  return {
    viewport: label,
    delayedLoadObserved: true,
    delayedResponseReleased: true,
    cancelResponsePreserved: true,
    staleDetailRejected: true,
    detailLoadingCleared: true,
  }
}

async function assertLinkedDetailRegion(page: Page, taskId: number) {
  const detailId = `execution-task-detail-${taskId}`
  const titleId = `execution-task-detail-title-${taskId}`
  const row = await rowForTask(page, taskId)
  const detail = page.locator(`#${detailId}`)

  await expect(row).toHaveAttribute('aria-controls', detailId)
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute('role', 'region')
  await expect(detail).toHaveAttribute('aria-labelledby', titleId)
  await expect(page.locator(`#${titleId}`)).toContainText(`任务 #${taskId}`)
}

test('ExecutionTasks table exposes explicit detail action and accessible row selection', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installExecutionTasksMocks(page)
  const visitedViewports: string[] = []
  const logSafetyProofs: Array<{ viewport: string; rawSecretsHidden: boolean; redactionVisible: boolean; sanitizedLogVisible: boolean }> = []
  const lifecycleProofs: Array<Awaited<ReturnType<typeof expectExecutionLifecycleLoop>>> = []
  const sameTaskStaleDetailProofs: Array<Awaited<ReturnType<typeof assertDelayedSecondaryRefreshCannotOverwriteCancel>>> = []
  const explicitLoadStaleDetailProofs: Array<Awaited<ReturnType<typeof assertDelayedSecondaryLoadCannotOverwriteCancel>>> = []
  const baseURLHost = new URL(test.info().project.use.baseURL || 'http://127.0.0.1').hostname || '127.0.0.1'

  for (const viewport of viewportMatrix) {
    network.resetSecondaryCancellation()
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/execution-tasks?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: '执行任务中心' })).toBeVisible()
    await expectExecutionTableScrollerContained(page, `execution-tasks:${viewport.name}:initial`)

    const targetRow = await rowForTask(page, targetTaskId)
    const secondaryRow = await rowForTask(page, secondaryTaskId)
    const detailAction = targetRow.getByRole('button', { name: `查看执行任务 #${targetTaskId} 详情` })
    await detailAction.scrollIntoViewIfNeeded()
    await expect(detailAction).toBeVisible()
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')
    const failedNoEvidenceRow = await rowForTask(page, failedNoEvidenceTaskId)
    const unknownStatusRow = await rowForTask(page, unknownStatusTaskId)
    const failedWithEvidenceRow = await rowForTask(page, failedWithEvidenceTaskId)
    const cancelledRow = await rowForTask(page, cancelledTaskId)

    await detailAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, targetTaskId)
    await assertTargetDetail(page)
    await assertExecutionDetailReadability(page, `execution-tasks:${viewport.name}:target-detail-action`)
    lifecycleProofs.push(await expectExecutionLifecycleLoop(page, viewport.name))

    await page.getByRole('button', { name: '关闭任务详情' }).click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')

    await targetRow.focus()
    await page.keyboard.press('Enter')
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, targetTaskId)
    await assertTargetDetail(page)
    await assertExecutionDetailReadability(page, `execution-tasks:${viewport.name}:target-enter`)

    await secondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, secondaryTaskId)
    await assertSecondaryDetail(page)
    await assertExecutionDetailReadability(page, `execution-tasks:${viewport.name}:secondary-space`)
    const logViewer = page.getByLabel('脱敏执行日志').first()
    await expect(logViewer).toBeVisible()
    await expect(logViewer).toContainText('[REDACTED')
    for (const snippet of forbiddenLogSecretSnippets) {
      await expect(page.locator('body')).not.toContainText(snippet)
    }
    expect(network.detailRequests, `${viewport.name} Space selection should request secondary execution detail`).toContain(secondaryTaskId)

    await failedNoEvidenceRow.focus()
    await page.keyboard.press('Enter')
    await expect(failedNoEvidenceRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, failedNoEvidenceTaskId)
    await assertFailedNoEvidenceDetail(page)

    await unknownStatusRow.focus()
    await page.keyboard.press('Enter')
    await expect(unknownStatusRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, unknownStatusTaskId)
    await assertUnknownStatusDetail(page)

    await failedWithEvidenceRow.focus()
    await page.keyboard.press('Enter')
    await expect(failedWithEvidenceRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, failedWithEvidenceTaskId)
    await assertFailedWithEvidenceDetail(page)

    await cancelledRow.focus()
    await page.keyboard.press('Enter')
    await expect(cancelledRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, cancelledTaskId)
    await assertCancelledDetail(page)

    await detailAction.scrollIntoViewIfNeeded()
    await detailAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'false')

    const secondaryCancel = secondaryRow.getByRole('button', { name: `取消任务 #${secondaryTaskId}` })
    await secondaryCancel.scrollIntoViewIfNeeded()
    await secondaryCancel.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'false')
    await page.keyboard.press('Escape')

    await secondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, secondaryTaskId)
    await assertSecondaryDetail(page)
    sameTaskStaleDetailProofs.push(await assertDelayedSecondaryRefreshCannotOverwriteCancel(
      page,
      network,
      `execution-tasks:${viewport.name}:same-task-stale-detail`,
    ))

    network.resetSecondaryCancellation()
    await page.getByRole('button', { name: '刷新执行任务' }).click()
    await expect(secondaryRow.getByRole('button', { name: `取消任务 #${secondaryTaskId}` })).toBeVisible()
    explicitLoadStaleDetailProofs.push(await assertDelayedSecondaryLoadCannotOverwriteCancel(
      page,
      network,
      secondaryRow,
      `execution-tasks:${viewport.name}:explicit-load-stale-detail`,
    ))

    await expectExecutionTableScrollerContained(page, `execution-tasks:${viewport.name}:final`)
    await expectNoHorizontalOverflow(page, `execution-tasks-detail-selection:${viewport.name}`)
    await expect(page.locator('.ant-message-notice-error')).toHaveCount(0)
    logSafetyProofs.push({
      viewport: `${viewport.width}x${viewport.height}`,
      rawSecretsHidden: true,
      redactionVisible: true,
      sanitizedLogVisible: true,
    })
    visitedViewports.push(`${viewport.width}x${viewport.height}`)
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in ExecutionTasks detail selection smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  expect(lifecycleProofs).toHaveLength(viewportMatrix.length)
  expect(lifecycleProofs.every(proof => (
    proof.stageCount === 4
    && proof.readable
    && proof.statusTextReadable
    && proof.descriptionTextReadable
    && !proof.executionQualityClaim
    && !proof.llmFactClaim
  ))).toBe(true)
  expect(sameTaskStaleDetailProofs).toHaveLength(viewportMatrix.length)
  expect(sameTaskStaleDetailProofs.every(proof => (
    proof.delayedRefreshObserved
    && proof.delayedResponseReleased
    && proof.cancelResponsePreserved
    && proof.staleDetailRejected
  ))).toBe(true)
  expect(explicitLoadStaleDetailProofs).toHaveLength(viewportMatrix.length)
  expect(explicitLoadStaleDetailProofs.every(proof => (
    proof.delayedLoadObserved
    && proof.delayedResponseReleased
    && proof.cancelResponsePreserved
    && proof.staleDetailRejected
    && proof.detailLoadingCleared
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
      detailCardContained: true,
      tableScrollerContained: true,
      noHorizontalOverflow: true,
    },
    mobileReadability: {
      criticalTextsWrap: true,
      timelineReadable: true,
      logReadable: true,
      actionGateReadable: true,
      tableScrollerContained: true,
    },
    executionLifecycleLoop: {
      scope: 'EXECUTION_TASKS_LIFECYCLE_GOVERNANCE_LOOP_READABILITY',
      stages: ['来源接入', '调度控制', '证据采集', '复盘交接'],
      desktopColumns: lifecycleProofs.find(proof => proof.viewport === 'desktop')?.columns,
      tabletColumns: lifecycleProofs.find(proof => proof.viewport === 'tablet')?.columns,
      mobileColumns: lifecycleProofs.find(proof => proof.viewport === 'mobile')?.columns,
      narrowColumns: lifecycleProofs.find(proof => proof.viewport === 'narrow')?.columns,
      textReadable: lifecycleProofs.every(proof => proof.readable),
      statusTextReadable: lifecycleProofs.every(proof => proof.statusTextReadable),
      descriptionTextReadable: lifecycleProofs.every(proof => proof.descriptionTextReadable),
      executionQualityClaim: false,
      llmFactClaim: false,
    },
    sameTaskStaleDetailGuard: {
      scope: 'EXECUTION_TASKS_SAME_TASK_STALE_DETAIL_GUARD',
      delayedRefreshObserved: sameTaskStaleDetailProofs.every(proof => proof.delayedRefreshObserved),
      delayedResponseReleased: sameTaskStaleDetailProofs.every(proof => proof.delayedResponseReleased),
      cancelResponsePreserved: sameTaskStaleDetailProofs.every(proof => proof.cancelResponsePreserved),
      sameTaskStaleDetailRejected: sameTaskStaleDetailProofs.every(proof => proof.staleDetailRejected),
      delayedSecondaryDetailRequests: network.delayedSecondaryDetailRequests,
      releasedDelayedSecondaryDetailResponses: network.releasedDelayedSecondaryDetailResponses,
    },
    explicitLoadStaleDetailGuard: {
      scope: 'EXECUTION_TASKS_EXPLICIT_LOAD_STALE_DETAIL_GUARD',
      delayedLoadObserved: explicitLoadStaleDetailProofs.every(proof => proof.delayedLoadObserved),
      delayedResponseReleased: explicitLoadStaleDetailProofs.every(proof => proof.delayedResponseReleased),
      cancelResponsePreserved: explicitLoadStaleDetailProofs.every(proof => proof.cancelResponsePreserved),
      staleExplicitLoadRejected: explicitLoadStaleDetailProofs.every(proof => proof.staleDetailRejected),
      detailLoadingCleared: explicitLoadStaleDetailProofs.every(proof => proof.detailLoadingCleared),
    },
    actionGate: {
      visible: true,
      successGateVisible: true,
      runningGateVisible: true,
      failedWithEvidenceReviewVisible: true,
      failedMissingEvidenceBlocked: true,
      cancelledGateVisible: true,
      unknownStatusBlocked: true,
      terminalMutationBlocked: true,
      cancelGateReady: true,
      sourceGateVisible: true,
    },
    tableScroller: {
      containedInViewport: true,
      overflowXAuto: true,
    },
    logSafety: {
      scope: 'LOG_VIEWER_DISPLAY_REDACTION_ONLY',
      fixtureHasBearerSecret: true,
      fixtureHasApiKeySecret: true,
      fixtureHasPasswordSecret: true,
      fixtureHasJwtSecret: true,
      rawSecretsHidden: logSafetyProofs.every(proof => proof.rawSecretsHidden),
      redactionVisible: logSafetyProofs.every(proof => proof.redactionVisible),
      sanitizedLogVisible: logSafetyProofs.every(proof => proof.sanitizedLogVisible),
      markerContainsRawSecret: false,
    },
    runtimeIssues: 0,
    noHorizontalOverflow: true,
    detailRequests: network.detailRequests,
    cancelDialogOpened: true,
    spec: 'execution-tasks-detail-selection-smoke.spec.ts',
    baseURLHost,
  }
  const markerText = JSON.stringify(markerPayload)
  for (const snippet of forbiddenLogSecretSnippets) {
    expect(markerText, `ExecutionTasks marker must not contain raw log secret snippet: ${snippet}`).not.toContain(snippet)
  }
  console.log('EXECUTION_TASKS_DETAIL_SELECTION_SMOKE_OK', markerText)
})
