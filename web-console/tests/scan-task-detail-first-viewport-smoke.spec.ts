import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type FatalMode =
  | 'none'
  | 'task-transport'
  | 'task-null'
  | 'task-foreign-id'
  | 'task-invalid-project'
  | 'artifacts-transport'
  | 'artifacts-malformed-list'
  | 'artifact-null-record'
  | 'artifact-foreign-project'
  | 'artifact-foreign-owner-type'
  | 'artifact-foreign-owner-id'
  | 'preview-missing-record'
  | 'preview-foreign-id'
  | 'preview-foreign-project'
  | 'preview-foreign-owner-type'
  | 'preview-foreign-owner-id'
type ReportMode = 'none' | 'confirmed-empty' | 'invalid-json' | 'missing-code-quality' | 'missing-risks' | 'non-array-risks'
type RaceStage = 'task-detail' | 'artifact-list' | 'artifact-preview' | 'execution-detail' | 'code-status'
type ScanStatus = 'SUCCESS' | 'RUNNING'

type DelayedApiResponse = {
  stage: RaceStage
  taskId: number
  route: Route
  data: unknown
}

const projectId = 41
const scanTaskId = 701
const reportArtifactId = 9101

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const fatalScenariosByViewport: Record<string, FatalMode[]> = {
  desktop: ['task-transport', 'task-null', 'task-foreign-id'],
  laptop: ['task-invalid-project', 'artifacts-transport', 'artifacts-malformed-list'],
  tablet: ['artifact-null-record', 'artifact-foreign-project', 'artifact-foreign-owner-type'],
  mobile: ['artifact-foreign-owner-id', 'preview-missing-record', 'preview-foreign-id'],
  narrow: ['preview-foreign-project', 'preview-foreign-owner-type', 'preview-foreign-owner-id'],
}

const fatalReasonByMode: Record<Exclude<FatalMode, 'none'>, string> = {
  'task-transport': '扫描任务详情临时不可用',
  'task-null': '扫描任务响应归属不匹配',
  'task-foreign-id': '扫描任务响应归属不匹配',
  'task-invalid-project': '扫描任务响应归属不匹配',
  'artifacts-transport': '扫描产物列表临时不可用',
  'artifacts-malformed-list': '扫描产物列表响应格式无效',
  'artifact-null-record': '扫描产物响应归属不匹配',
  'artifact-foreign-project': '扫描产物响应归属不匹配',
  'artifact-foreign-owner-type': '扫描产物响应归属不匹配',
  'artifact-foreign-owner-id': '扫描产物响应归属不匹配',
  'preview-missing-record': '扫描产物响应归属不匹配',
  'preview-foreign-id': '扫描产物响应归属不匹配',
  'preview-foreign-project': '扫描产物响应归属不匹配',
  'preview-foreign-owner-type': '扫描产物响应归属不匹配',
  'preview-foreign-owner-id': '扫描产物响应归属不匹配',
}

const fallbackReportModeByViewport: Record<string, ReportMode> = {
  desktop: 'none',
  laptop: 'invalid-json',
  tablet: 'missing-code-quality',
  mobile: 'missing-risks',
  narrow: 'non-array-risks',
}

const proof = {
  initialChecked: [] as string[],
  fatalChecked: [] as string[],
  staleChecked: [] as string[],
  confirmedEmptyRiskChecked: [] as string[],
  riskFallbackChecked: [] as string[],
  visualEvidenceChecked: [] as string[],
  raceStagesChecked: [] as RaceStage[],
  routeRaceChecked: 0,
  pollingRaceChecked: 0,
}
let hadTestFailure = false

test.afterEach(({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) hadTestFailure = true
})

function result<T>(data: T) {
  return { code: 'SUCCESS', message: 'OK', data }
}

async function fulfillJson(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(data),
  })
}

async function fulfillFailure(route: Route, message: string) {
  await fulfillJson(route, { code: 'INTERNAL_ERROR', message, data: null }, 500)
}

function scanTask(id: number, ownedProjectId = projectId, status: ScanStatus = 'SUCCESS') {
  return {
    id,
    projectId: ownedProjectId,
    repositoryId: 411,
    branch: `branch-${id}`,
    commitSha: `commit-${id}-abcdef`,
    status,
    triggerType: 'MANUAL',
    startedAt: '2026-07-10T06:00:00Z',
    finishedAt: status === 'SUCCESS' ? '2026-07-10T06:03:00Z' : null,
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-10T05:59:00Z',
  }
}

function reportArtifact(id: number, ownerId: number, ownedProjectId = projectId) {
  return {
    id,
    projectId: ownedProjectId,
    repositoryId: 411,
    ownerType: 'SCAN_TASK',
    ownerId,
    artifactType: 'ARCHITECTURE_REPORT',
    contentType: 'application/json',
    sizeBytes: 2048,
    checksumSha256: 'a'.repeat(64),
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-07-10T06:04:00Z',
  }
}

const confirmedEmptyRiskReport = {
  overview: { totalFiles: 27, totalLines: 1880, totalDirs: 9 },
  modules: { controllers: 3, services: 5, repositories: 4, entities: 6 },
  codeQuality: { risks: [] },
  technicalDebt: [],
  suggestions: [],
  apiRoutes: [],
  dbEntities: [],
  reportQuality: {
    readiness: 'READY',
    confidence: 92,
    summary: '当前扫描报告已确认',
    gaps: [],
    nextActions: [],
    evidenceChecks: [],
  },
}

function reportForTask(taskId: number) {
  return {
    ...confirmedEmptyRiskReport,
    reportQuality: {
      ...confirmedEmptyRiskReport.reportQuality,
      summary: `扫描 #${taskId} 报告已确认`,
    },
  }
}

function reportTextForMode(mode: ReportMode, taskId: number) {
  if (mode === 'invalid-json') return '{"overview":'
  if (mode === 'missing-code-quality') {
    const report: Record<string, unknown> = { ...reportForTask(taskId) }
    delete report.codeQuality
    return JSON.stringify(report)
  }
  if (mode === 'missing-risks') {
    return JSON.stringify({ ...reportForTask(taskId), codeQuality: {} })
  }
  if (mode === 'non-array-risks') {
    return JSON.stringify({ ...reportForTask(taskId), codeQuality: { risks: 'not-confirmed' } })
  }
  return JSON.stringify(reportForTask(taskId))
}

function codeKnowledge(taskId: number, totalChunks = 0) {
  const ready = totalChunks > 0
  return {
    scanTaskId: taskId,
    query: '',
    limit: 1,
    total: ready ? 1 : 0,
    resultCount: ready ? 1 : 0,
    totalChunks,
    embeddedChunks: ready ? totalChunks - 1 : 0,
    truncated: false,
    retrievalMode: ready ? 'HYBRID' : 'LEXICAL',
    items: ready
      ? [{
          id: taskId * 10,
          scanTaskId: taskId,
          filePath: `src/task-${taskId}.ts`,
          startLine: 1,
          endLine: 3,
          content: `export const taskId = ${taskId}`,
          contentPreview: `export const taskId = ${taskId}`,
          hasEmbedding: true,
          matchedTerms: ['taskId'],
          relevanceScore: 95,
          evidenceType: 'SOURCE',
          evidenceReason: 'Polling race evidence.',
          contextRole: 'PRIMARY',
          contextDistance: 0,
        }]
      : [],
  }
}

async function installMocks(page: Page) {
  const controls: {
    fatalMode: FatalMode
    reportMode: ReportMode
    previewTransportFailure: boolean
    delayStage: RaceStage | null
    delayTaskId: number | null
    delayed: DelayedApiResponse[]
    taskStatuses: Map<number, ScanStatus>
    codeKnowledgeByTaskId: Map<number, ReturnType<typeof codeKnowledge>>
    codeStatusFailuresRemaining: Map<number, number>
    taskDetailRequests: Map<number, number>
    codeStatusRequests: Map<number, number>
    unhandled: string[]
    releaseDelayed: (stage?: RaceStage, taskId?: number) => Promise<number>
  } = {
    fatalMode: 'none',
    reportMode: 'none',
    previewTransportFailure: false,
    delayStage: null,
    delayTaskId: null,
    delayed: [],
    taskStatuses: new Map(),
    codeKnowledgeByTaskId: new Map(),
    codeStatusFailuresRemaining: new Map(),
    taskDetailRequests: new Map(),
    codeStatusRequests: new Map(),
    unhandled: [],
    releaseDelayed: async () => 0,
  }
  const artifactOwners = new Map<number, { ownerId: number; projectId: number }>()

  const maybeHold = (stage: RaceStage, taskId: number, route: Route, data: unknown) => {
    if (controls.delayStage !== stage || controls.delayTaskId !== taskId) return false
    controls.delayed.push({ stage, taskId, route, data })
    return true
  }

  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'scan-task-detail-first-viewport-token')
  })
  await page.unroute('**/api/**').catch(() => {})
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
      await fulfillJson(route, result({ id: 1, username: 'scan_report_qa', email: 'scan-report-qa@local.test' }))
      return
    }

    const taskMatch = path.match(/^\/api\/scan-tasks\/(\d+)$/)
    if (method === 'GET' && taskMatch) {
      const requestedTaskId = Number(taskMatch[1])
      controls.taskDetailRequests.set(requestedTaskId, (controls.taskDetailRequests.get(requestedTaskId) || 0) + 1)
      if (controls.fatalMode === 'task-transport') {
        await fulfillFailure(route, '扫描任务详情临时不可用')
        return
      }
      const taskResponse = controls.fatalMode === 'task-null'
        ? null
        : scanTask(
            controls.fatalMode === 'task-foreign-id' ? requestedTaskId + 99 : requestedTaskId,
            controls.fatalMode === 'task-invalid-project' ? 0 : projectId,
            controls.taskStatuses.get(requestedTaskId) || 'SUCCESS',
          )
      const data = result(taskResponse)
      if (!maybeHold('task-detail', requestedTaskId, route, data)) await fulfillJson(route, data)
      return
    }

    const artifactListMatch = path.match(/^\/api\/projects\/(\d+)\/artifacts$/)
    if (method === 'GET' && artifactListMatch) {
      const requestedProjectId = Number(artifactListMatch[1])
      const ownerId = Number(url.searchParams.get('ownerId'))
      if (controls.fatalMode === 'artifacts-transport') {
        await fulfillFailure(route, '扫描产物列表临时不可用')
        return
      }
      if (controls.fatalMode === 'artifacts-malformed-list') {
        await fulfillJson(route, result({ items: [] }))
        return
      }
      if (controls.fatalMode === 'artifact-null-record') {
        await fulfillJson(route, result([null]))
        return
      }
      if (controls.fatalMode === 'artifact-foreign-project') {
        await fulfillJson(route, result([reportArtifact(reportArtifactId, ownerId, requestedProjectId + 99)]))
        return
      }
      if (controls.fatalMode === 'artifact-foreign-owner-type') {
        await fulfillJson(route, result([{ ...reportArtifact(reportArtifactId, ownerId, requestedProjectId), ownerType: 'AGENT_TASK' }]))
        return
      }
      if (controls.fatalMode === 'artifact-foreign-owner-id') {
        await fulfillJson(route, result([reportArtifact(reportArtifactId, ownerId + 99, requestedProjectId)]))
        return
      }
      const artifactId = reportArtifactId + ownerId
      const needsArtifact = controls.reportMode !== 'none' || controls.fatalMode.startsWith('preview-')
      const artifacts = needsArtifact
        ? [reportArtifact(artifactId, ownerId, requestedProjectId)]
        : []
      if (needsArtifact) artifactOwners.set(artifactId, { ownerId, projectId: requestedProjectId })
      const data = result(artifacts)
      if (!maybeHold('artifact-list', ownerId, route, data)) await fulfillJson(route, data)
      return
    }

    const previewMatch = path.match(/^\/api\/projects\/(\d+)\/artifacts\/(\d+)\/preview$/)
    if (method === 'GET' && previewMatch) {
      const requestedProjectId = Number(previewMatch[1])
      const requestedArtifactId = Number(previewMatch[2])
      const owner = artifactOwners.get(requestedArtifactId)
      if (!owner || owner.projectId !== requestedProjectId) {
        controls.unhandled.push(`${method} ${path}${url.search}`)
        await fulfillFailure(route, `Unknown artifact preview owner: ${requestedArtifactId}`)
        return
      }
      if (controls.previewTransportFailure) {
        await fulfillFailure(route, '报告预览临时不可用')
        return
      }
      const baseRecord = reportArtifact(requestedArtifactId, owner.ownerId, requestedProjectId)
      const previewRecord = controls.fatalMode === 'preview-missing-record'
        ? null
        : {
            ...baseRecord,
            ...(controls.fatalMode === 'preview-foreign-id' ? { id: requestedArtifactId + 99 } : {}),
            ...(controls.fatalMode === 'preview-foreign-project' ? { projectId: requestedProjectId + 99 } : {}),
            ...(controls.fatalMode === 'preview-foreign-owner-type' ? { ownerType: 'AGENT_TASK' } : {}),
            ...(controls.fatalMode === 'preview-foreign-owner-id' ? { ownerId: owner.ownerId + 99 } : {}),
          }
      const data = result({
        record: previewRecord,
        text: reportTextForMode(controls.reportMode, owner.ownerId),
        truncated: false,
        previewBytes: 1024,
      })
      if (!maybeHold('artifact-preview', owner.ownerId, route, data)) await fulfillJson(route, data)
      return
    }

    const executionMatch = path.match(/^\/api\/projects\/(\d+)\/execution-tasks\/source\/SCAN_TASK\/(\d+)$/)
    if (method === 'GET' && executionMatch) {
      const requestedTaskId = Number(executionMatch[2])
      const data = result(null)
      if (!maybeHold('execution-detail', requestedTaskId, route, data)) await fulfillJson(route, data)
      return
    }

    const codeChunkMatch = path.match(/^\/api\/projects\/(\d+)\/code-chunks\/(status|search)$/)
    if (method === 'GET' && codeChunkMatch) {
      const requestedTaskId = Number(url.searchParams.get('scanTaskId'))
      controls.codeStatusRequests.set(requestedTaskId, (controls.codeStatusRequests.get(requestedTaskId) || 0) + 1)
      const failuresRemaining = controls.codeStatusFailuresRemaining.get(requestedTaskId) || 0
      if (failuresRemaining > 0) {
        controls.codeStatusFailuresRemaining.set(requestedTaskId, failuresRemaining - 1)
        await fulfillFailure(route, 'code_chunks 初始状态临时不可用')
        return
      }
      const data = result(controls.codeKnowledgeByTaskId.get(requestedTaskId) || codeKnowledge(requestedTaskId))
      if (!maybeHold('code-status', requestedTaskId, route, data)) await fulfillJson(route, data)
      return
    }

    const governanceMatch = path.match(/^\/api\/projects\/(\d+)\/scan-tasks\/(\d+)\/governance-timeline$/)
    if (method === 'GET' && governanceMatch) {
      const requestedProjectId = Number(governanceMatch[1])
      const requestedTaskId = Number(governanceMatch[2])
      await fulfillJson(route, result({
        projectId: requestedProjectId,
        repositoryId: 411,
        scanTaskId: requestedTaskId,
        scanStatus: 'SUCCESS',
        generatedAt: '2026-07-10T06:05:00Z',
        summary: { status: 'HEALTHY', counts: {}, hasErrors: false, attributionGapCount: 0 },
        resources: {
          artifacts: [],
          scanExecution: null,
          repairExecutions: [],
          agentExecutions: [],
          autoRepairs: [],
          agentTasks: [],
          agentToolCalls: [],
          auditLogs: [],
        },
        events: [],
        limits: {},
        truncated: false,
        warnings: [],
        attributionGaps: [],
      }))
      return
    }

    controls.unhandled.push(`${method} ${path}${url.search}`)
    await fulfillFailure(route, `Unhandled mocked API: ${method} ${path}`)
  })

  controls.releaseDelayed = async (stage?: RaceStage, taskId?: number) => {
    const releasing = controls.delayed.filter(item => (
      (stage === undefined || item.stage === stage)
      && (taskId === undefined || item.taskId === taskId)
    ))
    if (
      (stage === undefined || controls.delayStage === stage)
      && (taskId === undefined || controls.delayTaskId === taskId)
    ) {
      controls.delayStage = null
      controls.delayTaskId = null
    }
    controls.delayed = controls.delayed.filter(item => !releasing.includes(item))
    await Promise.all(releasing.map(item => fulfillJson(item.route, item.data)))
    return releasing.length
  }

  return controls
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const result = await page.evaluate(() => ({
    scrollY: window.scrollY,
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  expect(result.scrollY, `${label} must be checked at scrollY=0`).toBe(0)
  expect(result.documentWidth, `${label} must not overflow horizontally`).toBeLessThanOrEqual(result.viewportWidth + 1)
}

async function expectInFirstViewport(page: Page, locator: Locator, label: string) {
  await expect(locator, `${label} must be visible`).toBeVisible()
  const box = await locator.boundingBox()
  expect(box, `${label} must expose a bounding box`).not.toBeNull()
  expect(box!.x, `${label} must not start left of the viewport`).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width, `${label} must fit viewport width`).toBeLessThanOrEqual((await page.viewportSize())!.width + 1)
  expect(box!.y, `${label} must not start above the viewport`).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height, `${label} must fit the first viewport`).toBeLessThanOrEqual((await page.viewportSize())!.height + 1)
}

async function expectReadableReason(page: Page, locator: Locator, expectedText: string, label: string) {
  await expect(locator).toContainText(expectedText)
  await expectInFirstViewport(page, locator, label)
  const metrics = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element)
    return {
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      color: style.color,
      opacity: Number(style.opacity || 1),
      fontSize: Number.parseFloat(style.fontSize),
      whiteSpace: style.whiteSpace,
    }
  })
  expect(metrics.scrollWidth, `${label} must not clip horizontally`).toBeLessThanOrEqual(metrics.clientWidth + 1)
  expect(metrics.scrollHeight, `${label} must not clip vertically`).toBeLessThanOrEqual(metrics.clientHeight + 1)
  expect(metrics.color, `${label} must not be transparent`).not.toBe('rgba(0, 0, 0, 0)')
  expect(metrics.opacity, `${label} must remain visible`).toBeGreaterThan(0)
  expect(metrics.fontSize, `${label} must remain readable`).toBeGreaterThanOrEqual(12)
  expect(['normal', 'pre-wrap', 'break-spaces'], `${label} must allow wrapping`).toContain(metrics.whiteSpace)
}

async function expectFatalState(page: Page, viewportLabel: string, source: FatalMode) {
  const state = page.locator(`[data-sl-scan-state="FATAL_LOAD"][data-sl-scan-id="${scanTaskId}"]`)
  await expect(state).toBeVisible()
  await expect(state).toHaveAttribute('data-sl-primary-count', '1')
  await expect(state.getByText('扫描报告加载失败')).toBeVisible()
  const reason = state.locator('.sl-state-block-copy p')
  await expectReadableReason(
    page,
    reason,
    fatalReasonByMode[source as Exclude<FatalMode, 'none'>],
    `${viewportLabel}:${source}:fatal reason`,
  )
  const retry = state.getByRole('button', { name: '重新加载扫描报告' })
  await expectInFirstViewport(page, retry, `${viewportLabel}:${source}:fatal retry`)
  await expect(page.locator('.sl-scan-cockpit')).toHaveCount(0)
  await expect(page.locator('.sl-scan-step-grid')).toHaveCount(0)
  await expect(page.getByText('风险状态不可用')).toHaveCount(0)
  await expect(page.getByText('未识别到显著风险')).toHaveCount(0)
  await expect(page.getByText(/\b0 artifacts\b/)).toHaveCount(0)
  await expect(state.locator('button.ant-btn-primary:visible')).toHaveCount(1)
  await expectNoHorizontalOverflow(page, `${viewportLabel}:${source}:fatal`)
  proof.fatalChecked.push(`${viewportLabel}:${source}`)
}

async function navigateClientSide(page: Page, nextTaskId: number) {
  await page.evaluate((id) => {
    const currentState = window.history.state || {}
    window.history.pushState({
      ...currentState,
      idx: Number(currentState.idx || 0) + 1,
      key: `scan-route-race-${id}-${Date.now()}`,
    }, '', `/scan-tasks/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
  }, nextTaskId)
}

async function expectTaskBOnly(page: Page, firstTaskId: number, secondTaskId: number, label: string) {
  await expect(
    page.locator(`[data-sl-scan-state="READY"][data-sl-scan-id="${secondTaskId}"]`),
    `${label}: B READY root`,
  ).toHaveCount(1)
  await expect(page.locator(`[data-sl-scan-id="${firstTaskId}"]`), `${label}: no A root`).toHaveCount(0)
  await expect(page.getByText(`Scan Task #${secondTaskId}`, { exact: true }), `${label}: B id`).toBeVisible()
  await expect(page.getByText(`branch-${secondTaskId}`, { exact: true }), `${label}: B branch`).toBeVisible()
  await expect(page.getByText(`commit-${secondTaskId}-abcdef`.substring(0, 12), { exact: true }), `${label}: B commit`).toBeVisible()
  await expect(page.getByRole('heading', { name: `扫描 #${secondTaskId} 报告已确认` }).first(), `${label}: B report`).toBeVisible()
  await expect(page.getByText(`branch-${firstTaskId}`, { exact: true }), `${label}: no A branch`).toHaveCount(0)
  await expect(page.getByText(`commit-${firstTaskId}-abcdef`.substring(0, 12), { exact: true }), `${label}: no A commit`).toHaveCount(0)
  await expect(page.getByRole('heading', { name: `扫描 #${firstTaskId} 报告已确认` }), `${label}: no A report`).toHaveCount(0)
  expect(await page.evaluate(() => window.scrollY), `${label}: scrollY`).toBe(0)
}

for (const viewport of viewportMatrix) {
  test(`ScanTaskDetail first-viewport truth on ${viewport.name}`, async ({ page }, testInfo) => {
    const controls = await installMocks(page)
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    controls.delayStage = 'task-detail'
    controls.delayTaskId = scanTaskId
    await page.goto(`/scan-tasks/${scanTaskId}`)
    await expect.poll(() => controls.delayed.length, { message: `${viewport.name}: initial task request entered hold` }).toBeGreaterThanOrEqual(1)
    const initial = page.locator(`[data-sl-scan-state="INITIAL_LOADING"][data-sl-scan-id="${scanTaskId}"]`)
    await expect(initial).toBeVisible()
    await expect(initial).toHaveAttribute('data-sl-primary-count', '0')
    await expect(initial.locator('button.ant-btn-primary:visible')).toHaveCount(0)
    await expect(page.locator('.sl-scan-cockpit')).toHaveCount(0)
    await expectInFirstViewport(page, initial.getByText('正在加载扫描报告'), `${viewport.name}:initial`)
    await expectNoHorizontalOverflow(page, `${viewport.name}:initial`)
    proof.initialChecked.push(`${viewport.width}x${viewport.height}`)

    expect(await controls.releaseDelayed('task-detail', scanTaskId)).toBeGreaterThanOrEqual(1)
    await expect(page.locator(`[data-sl-scan-state="READY"][data-sl-scan-id="${scanTaskId}"]`)).toBeVisible()
    await expect(page.getByText('执行步骤证据未提供', { exact: true })).toBeVisible()
    await expect(page.getByText('页面不会把预期流程伪装成已排队或已执行状态。')).toBeVisible()
    await expect(page.locator('.sl-scan-step-grid')).toHaveCount(0)
    await expect(page.getByText('等待执行', { exact: true })).toHaveCount(0)
    await expect(page.getByText('风险状态不可用')).toBeVisible()
    await expect(page.getByText('未识别到显著风险')).toHaveCount(0)
    await expect(page.locator('.sl-scan-evidence-metric').getByText('-', { exact: true })).toHaveCount(4)

    controls.reportMode = 'confirmed-empty'
    await page.getByRole('button', { name: `刷新扫描 #${scanTaskId} 报告` }).evaluate((button: HTMLButtonElement) => button.click())
    await expect(page.getByText('未识别到显著风险', { exact: true })).toBeVisible()
    await expect(page.getByText('风险状态不可用')).toHaveCount(0)
    await expectNoHorizontalOverflow(page, `${viewport.name}:confirmed-empty-risk`)
    proof.confirmedEmptyRiskChecked.push(`${viewport.width}x${viewport.height}`)

    if (viewport.name === 'desktop' || viewport.name === 'narrow') {
      await page.waitForTimeout(100)
      const readyScreenshotPath = testInfo.outputPath(`scan-task-detail-${viewport.name}-ready.png`)
      await page.screenshot({ path: readyScreenshotPath, fullPage: false, animations: 'disabled' })
      await testInfo.attach(`scan-task-detail-${viewport.name}-ready`, {
        path: readyScreenshotPath,
        contentType: 'image/png',
      })
      proof.visualEvidenceChecked.push(`${viewport.name}:READY`)
    }

    const fallbackReportMode = fallbackReportModeByViewport[viewport.name]
    controls.reportMode = fallbackReportMode
    await page.getByRole('button', { name: `刷新扫描 #${scanTaskId} 报告` }).evaluate((button: HTMLButtonElement) => button.click())
    await expect(page.getByText('风险状态不可用', { exact: true })).toBeVisible()
    await expect(page.getByText('未识别到显著风险')).toHaveCount(0)
    await expectNoHorizontalOverflow(page, `${viewport.name}:${fallbackReportMode}`)
    proof.riskFallbackChecked.push(`${viewport.name}:${fallbackReportMode}`)

    for (const source of fatalScenariosByViewport[viewport.name]) {
      controls.fatalMode = source
      controls.reportMode = 'none'
      await page.reload()
      await expectFatalState(page, viewport.name, source)
    }

    controls.fatalMode = 'none'
    controls.reportMode = 'confirmed-empty'
    await page.reload()
    await expect(page.locator(`[data-sl-scan-state="READY"][data-sl-scan-id="${scanTaskId}"]`)).toBeVisible()
    controls.previewTransportFailure = true
    await page.getByRole('button', { name: `刷新扫描 #${scanTaskId} 报告` }).evaluate((button: HTMLButtonElement) => button.click())

    const stale = page.locator(`[data-sl-scan-state="STALE_REFRESH"][data-sl-scan-id="${scanTaskId}"]`)
    await expect(stale).toBeVisible()
    await expect(stale).toHaveAttribute('data-sl-primary-count', '1')
    await expect(stale.getByText('当前显示上次可信快照')).toBeVisible()
    await expectReadableReason(
      page,
      stale.locator('.sl-state-block-copy p'),
      '报告预览临时不可用',
      `${viewport.name}:stale reason`,
    )
    const resync = stale.getByRole('button', { name: '重新同步' })
    await expectInFirstViewport(page, resync, `${viewport.name}:stale resync`)
    await expect(stale.locator('button.ant-btn-primary:visible')).toHaveCount(1)
    await expect(page.locator('.sl-scan-evidence-panel')).toHaveCount(0)
    await expect(page.locator('.sl-scan-step-grid')).toHaveCount(0)
    await expect(page.locator('.sl-code-knowledge-panel')).toHaveCount(0)
    await expect(page.locator('.sl-report-panel')).toHaveCount(0)
    await expectNoHorizontalOverflow(page, `${viewport.name}:stale`)
    proof.staleChecked.push(`${viewport.width}x${viewport.height}`)

    if (viewport.name === 'desktop' || viewport.name === 'narrow') {
      await page.waitForTimeout(100)
      const staleScreenshotPath = testInfo.outputPath(`scan-task-detail-${viewport.name}-stale.png`)
      await page.screenshot({ path: staleScreenshotPath, fullPage: false, animations: 'disabled' })
      await testInfo.attach(`scan-task-detail-${viewport.name}-stale`, {
        path: staleScreenshotPath,
        contentType: 'image/png',
      })
      proof.visualEvidenceChecked.push(`${viewport.name}:STALE_REFRESH`)
    }

    controls.previewTransportFailure = false
    await resync.evaluate((button: HTMLButtonElement) => button.click())
    await expect(page.locator(`[data-sl-scan-state="READY"][data-sl-scan-id="${scanTaskId}"]`)).toBeVisible()
    await expect(page.getByText('未识别到显著风险', { exact: true })).toBeVisible()

    expect(controls.unhandled).toEqual([])
  })
}

test('ScanTaskDetail rejects a late A response after navigating to B', async ({ page }) => {
  const controls = await installMocks(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  controls.reportMode = 'confirmed-empty'

  const raceStages: RaceStage[] = ['task-detail', 'artifact-list', 'artifact-preview', 'execution-detail', 'code-status']
  for (const [index, stage] of raceStages.entries()) {
    const firstTaskId = 801 + index * 2
    const secondTaskId = firstTaskId + 1
    controls.delayStage = stage
    controls.delayTaskId = firstTaskId

    await page.goto(`/scan-tasks/${firstTaskId}`)
    await expect.poll(
      () => controls.delayed.filter(item => item.stage === stage && item.taskId === firstTaskId).length,
      { message: `${stage}: A request must enter hold` },
    ).toBeGreaterThanOrEqual(1)

    await navigateClientSide(page, secondTaskId)
    await expectTaskBOnly(page, firstTaskId, secondTaskId, `${stage}:before-release`)
    expect(await controls.releaseDelayed(stage, firstTaskId), `${stage}: released A response`).toBeGreaterThanOrEqual(1)
    await page.waitForTimeout(100)
    await expectTaskBOnly(page, firstTaskId, secondTaskId, `${stage}:after-release`)
    proof.raceStagesChecked.push(stage)
  }

  expect(controls.delayed).toEqual([])
  expect(controls.unhandled).toEqual([])
  proof.routeRaceChecked += 1
})

test('ScanTaskDetail keeps recovered code knowledge across a late RUNNING poll and restarts polling', async ({ page }) => {
  const controls = await installMocks(page)
  const runningTaskId = 901
  const recoveredChunks = 7
  controls.taskStatuses.set(runningTaskId, 'RUNNING')
  controls.codeKnowledgeByTaskId.set(runningTaskId, codeKnowledge(runningTaskId, recoveredChunks))
  controls.codeStatusFailuresRemaining.set(runningTaskId, 3)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`/scan-tasks/${runningTaskId}`)
  await expect(page.locator(`[data-sl-scan-state="READY"][data-sl-scan-id="${runningTaskId}"]`)).toBeVisible()
  await expect(page.getByText('code_chunks 初始状态临时不可用')).toBeVisible()

  controls.delayStage = 'task-detail'
  controls.delayTaskId = runningTaskId
  await expect.poll(
    () => controls.delayed.filter(item => item.stage === 'task-detail' && item.taskId === runningTaskId).length,
    { timeout: 7_000, message: 'the next real 3s RUNNING poll must enter hold' },
  ).toBeGreaterThanOrEqual(1)
  controls.delayStage = null
  controls.delayTaskId = null

  await page.getByRole('button', { name: '重新读取 code_chunks' }).evaluate((button: HTMLButtonElement) => button.click())
  const codePanel = page.getByLabel('Code Knowledge readiness')
  await expect(codePanel.getByText(`${recoveredChunks} code_chunks`, { exact: true })).toBeVisible()
  await expect(codePanel.getByText('切片总量').locator('..').getByText(String(recoveredChunks), { exact: true })).toBeVisible()

  const fullRefreshTaskCount = controls.taskDetailRequests.get(runningTaskId) || 0
  const fullRefreshCodeCount = controls.codeStatusRequests.get(runningTaskId) || 0
  await page.getByRole('button', { name: `刷新扫描 #${runningTaskId} 报告` }).evaluate((button: HTMLButtonElement) => button.click())
  await expect.poll(() => controls.taskDetailRequests.get(runningTaskId) || 0).toBeGreaterThan(fullRefreshTaskCount)
  await expect.poll(() => controls.codeStatusRequests.get(runningTaskId) || 0).toBeGreaterThan(fullRefreshCodeCount)
  await expect(page.locator(`[data-sl-scan-state="READY"][data-sl-scan-id="${runningTaskId}"]`)).toBeVisible()
  await expect(page.getByText('运行中', { exact: true })).toBeVisible()
  await expect(codePanel.getByText(`${recoveredChunks} code_chunks`, { exact: true })).toBeVisible()

  const countAfterFullRefresh = controls.taskDetailRequests.get(runningTaskId) || 0
  expect(await controls.releaseDelayed('task-detail', runningTaskId), 'released stale poll snapshot').toBe(1)
  await page.waitForTimeout(100)
  await expect(codePanel.getByText(`${recoveredChunks} code_chunks`, { exact: true })).toBeVisible()
  await expect(codePanel.getByText('0 code_chunks', { exact: true })).toHaveCount(0)
  await expect.poll(
    () => controls.taskDetailRequests.get(runningTaskId) || 0,
    { timeout: 7_000, message: 'RUNNING polling must restart after full refresh supersedes the old poll' },
  ).toBeGreaterThan(countAfterFullRefresh)

  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect(controls.unhandled).toEqual([])
  proof.pollingRaceChecked += 1
})

test.afterAll(() => {
  if (process.env.SL_SCAN_TASK_DETAIL_PARTIAL === '1' || hadTestFailure) return
  expect(proof.initialChecked).toHaveLength(5)
  expect(proof.fatalChecked).toHaveLength(15)
  expect(new Set(proof.fatalChecked.map(item => item.split(':').slice(1).join(':'))).size).toBe(15)
  expect(proof.staleChecked).toHaveLength(5)
  expect(proof.confirmedEmptyRiskChecked).toHaveLength(5)
  expect(proof.riskFallbackChecked).toEqual([
    'desktop:none',
    'laptop:invalid-json',
    'tablet:missing-code-quality',
    'mobile:missing-risks',
    'narrow:non-array-risks',
  ])
  expect(proof.visualEvidenceChecked).toEqual([
    'desktop:READY',
    'desktop:STALE_REFRESH',
    'narrow:READY',
    'narrow:STALE_REFRESH',
  ])
  expect(proof.raceStagesChecked).toEqual(['task-detail', 'artifact-list', 'artifact-preview', 'execution-detail', 'code-status'])
  expect(proof.routeRaceChecked).toBe(1)
  expect(proof.pollingRaceChecked).toBe(1)
  console.log('SCAN_TASK_DETAIL_FIRST_VIEWPORT_SMOKE_OK', JSON.stringify({
    ...proof,
    fatalScenarioCount: new Set(proof.fatalChecked.map(item => item.split(':').slice(1).join(':'))).size,
    successfulVisualAttachmentCount: proof.visualEvidenceChecked.length,
    mockedApiOnly: true,
    realApi: false,
    db: false,
    scrollIntoViewIfNeeded: false,
    spec: 'scan-task-detail-first-viewport-smoke.spec.ts',
  }))
})
