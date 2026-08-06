import { expect, test, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type ApiCounters = Record<string, number>

const projectId = 1
const repositoryId = 11
const scanTaskId = 501
const executionTaskId = 701
const reportArtifactId = 801
const overviewArtifactId = 802

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 740 },
  { name: 'narrow', width: 320, height: 740 },
]

type ProjectWorkspaceScenario = 'no-repo' | 'no-scan' | 'running' | 'failed' | 'evidence-gap' | 'ready'

const workspaceActionScenarios: Array<{ scenario: ProjectWorkspaceScenario; actionKey: string; title: string; primaryLabel: string; secondaryLabel: string }> = [
  { scenario: 'no-repo', actionKey: 'ADD_REPOSITORY', title: '先接入一个公开仓库', primaryLabel: '添加仓库', secondaryLabel: '查看仓库入口' },
  { scenario: 'no-scan', actionKey: 'START_SCAN', title: '触发第一次仓库扫描', primaryLabel: '触发扫描', secondaryLabel: '查看仓库' },
  { scenario: 'running', actionKey: 'WATCH_SCAN', title: '等待当前扫描完成', primaryLabel: '查看扫描进度', secondaryLabel: '查看扫描列表' },
  { scenario: 'failed', actionKey: 'REVIEW_FAILED_SCAN', title: '先复盘失败扫描', primaryLabel: '打开失败详情', secondaryLabel: '重新扫描' },
  { scenario: 'evidence-gap', actionKey: 'OPEN_ARTIFACTS', title: '补齐报告和代码证据', primaryLabel: '打开产物证据', secondaryLabel: '查看最新报告' },
  { scenario: 'ready', actionKey: 'OPEN_QA', title: '进入代码问答复核', primaryLabel: '进入代码问答', secondaryLabel: '打开最新报告' },
]

const workspaceNextActionOverflowChecks: Array<{ scenario: ProjectWorkspaceScenario; viewport: string; overflow: number }> = []
const scanCodeKnowledgeGateProofs: Array<{
  viewport: string
  blockedVisible: boolean
  readyVisible: boolean
  styleSafe: boolean
  gridStyleSafe: boolean
}> = []

const project = {
  id: projectId,
  name: 'Batch4A Deep Project',
  description: 'Mocked project for P9 batch 4A recoverable states',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 90,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const repository = {
  id: repositoryId,
  projectId,
  provider: 'GITHUB',
  owner: 'LJunP',
  name: 'Batch4A-Repo',
  url: 'https://github.com/LJunP/Batch4A-Repo.git',
  defaultBranch: 'main',
  visibility: 'PUBLIC',
  authType: 'NONE',
  status: 'ACTIVE',
  createdAt: '2026-07-01T10:00:00Z',
}

const scanTask = {
  id: scanTaskId,
  projectId,
  repositoryId,
  branch: 'main',
  commitSha: 'abc1234batch4a',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:05:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:30Z',
}

const executionTask = {
  id: executionTaskId,
  projectId,
  repositoryId,
  taskType: 'SCAN_TASK',
  sourceType: 'SCAN_TASK',
  sourceId: scanTaskId,
  status: 'SUCCESS',
  currentStep: 'finalize_scan',
  currentAttemptId: 901,
  progress: 100,
  errorMessage: null,
  createdBy: 1,
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:05:00Z',
  createdAt: '2026-07-01T10:00:30Z',
  updatedAt: '2026-07-01T10:05:00Z',
}

const artifactReport = {
  id: reportArtifactId,
  projectId,
  repositoryId,
  ownerType: 'SCAN_TASK',
  ownerId: scanTaskId,
  artifactType: 'ARCHITECTURE_REPORT',
  contentType: 'application/json',
  sizeBytes: 4096,
  checksumSha256: 'b'.repeat(64),
  metadataJson: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:06:00Z',
}

const artifactOverview = {
  ...artifactReport,
  id: overviewArtifactId,
  artifactType: 'ARCHITECTURE_OVERVIEW',
}

const coreArtifacts = [
  artifactReport,
  artifactOverview,
  { ...artifactReport, id: overviewArtifactId + 1, artifactType: 'RAW_SCAN_RESULT' },
  { ...artifactReport, id: overviewArtifactId + 2, artifactType: 'API_CATALOG' },
  { ...artifactReport, id: overviewArtifactId + 3, artifactType: 'DB_SCHEMA' },
  { ...artifactReport, id: overviewArtifactId + 4, artifactType: 'CODE_METRICS' },
  { ...artifactReport, id: overviewArtifactId + 5, artifactType: 'DEPENDENCY_GRAPH' },
]

const reportData = {
  overview: {
    totalFiles: 42,
    totalLines: 3200,
    totalDirs: 12,
  },
  modules: {
    controllers: 4,
    services: 8,
    repositories: 5,
    entities: 6,
  },
  codeQuality: {
    risks: [
      { title: 'Batch4A risk', severity: 'MEDIUM', description: 'Recoverable state evidence risk.' },
    ],
    techDebt: [],
    suggestions: ['Keep recoverable states visible.'],
  },
  apiRoutes: [{ method: 'GET', path: '/api/batch4a', handler_class: 'Batch4AController', handler_method: 'get' }],
  dbEntities: [{ class_name: 'Batch4AEntity', table_name: 'batch4a_entity', field_count: 4, file_path: 'src/main/java/Batch4AEntity.java' }],
  reportQuality: {
    readiness: 'READY',
    confidence: 88,
    summary: 'Batch4A report ready',
    gaps: [],
    nextActions: ['Review recoverable state evidence.'],
    evidenceChecks: [],
  },
}

const overviewData = {
  languages: [{ name: 'Java', file_count: 20, line_count: 2400 }],
  framework: { name: 'Spring Boot', version: '3.3' },
  totalFiles: 42,
  totalDirs: 12,
  totalLines: 3200,
  controllers: 4,
  services: 8,
  repositories: 5,
  entities: 6,
  entryPoints: ['src/main/java/com/example/App.java'],
}

const codeChunkResult = {
  scanTaskId,
  query: '',
  limit: 1,
  total: 1,
  resultCount: 1,
  totalChunks: 128,
  embeddedChunks: 96,
  truncated: false,
  retrievalMode: 'HYBRID',
  evidenceProfile: {
    readiness: 'READY',
    confidence: 86,
    summary: 'code_chunks ready after retry',
    nextAction: 'Use code QA',
    details: [],
    uniqueFiles: 1,
    embeddedEvidenceCount: 1,
    lowConfidenceCount: 0,
    topScore: 92,
    averageScore: 92,
    lineSpan: 24,
    dominantEvidenceType: 'SERVICE',
    evidenceTypeStats: [{ type: 'SERVICE', count: 1 }],
    fileStats: [{ filePath: 'src/main/java/com/example/Batch4AService.java', count: 1, bestScore: 92 }],
  },
  items: [
    {
      id: 1001,
      scanTaskId,
      filePath: 'src/main/java/com/example/Batch4AService.java',
      startLine: 12,
      endLine: 36,
      content: 'class Batch4AService {}',
      contentPreview: 'class Batch4AService {}',
      hasEmbedding: true,
      matchedTerms: ['Batch4A'],
      relevanceScore: 92,
      evidenceType: 'SERVICE',
      evidenceReason: 'Batch4A code knowledge recovered.',
      contextRole: 'PRIMARY',
      contextDistance: 0,
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

async function fulfillJson(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(data),
  })
}

async function fulfillFailure(route: Route, message: string) {
  await fulfillJson(route, {
    code: 'INTERNAL_ERROR',
    message,
    data: null,
  }, 500)
}

function count(counters: ApiCounters, key: string) {
  counters[key] = (counters[key] || 0) + 1
  return counters[key]
}

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []
  const ignoredConsolePatterns = [
    /React Router Future Flag Warning/,
    /findDOMNode/,
    /Static function can not consume context like dynamic theme/,
    /Instance created by `useForm` is not connected to any Form element/,
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

async function installBatch4AMocks(page: Page) {
  const counters: ApiCounters = {}
  const controls = {
    failDashboardStats: 0,
    failProjectOverviewPreview: 0,
    failProjectRepos: 0,
    failScanCodeChunks: 0,
    failScanGovernance: 0,
    workspaceScenario: 'ready' as ProjectWorkspaceScenario,
  }
  const unhandledApiRequests: string[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'p9-batch4a-recoverable-error-states-token')
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
      await fulfillJson(route, result({ id: 1, username: 'p9_batch4a_user', email: 'p9-batch4a@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/dashboard/stats') {
      count(counters, 'dashboardStats')
      if (controls.failDashboardStats > 0) {
        controls.failDashboardStats -= 1
        await fulfillFailure(route, '仪表盘统计临时不可用')
        return
      }
      await fulfillJson(route, result({
        projectCount: 1,
        repositoryCount: 1,
        totalScans: 1,
        successScans: 1,
        failedScans: 0,
        runningScans: 0,
        pendingScans: 0,
        agentTaskCount: 0,
        agentTaskRunning: 0,
        agentTaskCompleted: 0,
        issueCount: 0,
        issueCompleted: 0,
        latestTotalFiles: 42,
        latestTotalLines: 3200,
        latestTotalDirs: 12,
        latestControllers: 4,
        latestServices: 8,
        latestRiskCount: 1,
        latestCodeChunks: 128,
        latestEmbeddedChunks: 96,
        languagesJson: JSON.stringify([{ name: 'Java', file_count: 20, line_count: 2400 }]),
      }))
      return
    }

    if (method === 'GET' && path === '/api/dashboard/recent-scans') {
      count(counters, 'dashboardRecentScans')
      await fulfillJson(route, result([{
        ...scanTask,
        projectName: project.name,
        repositoryName: repository.name,
        durationMs: 240000,
      }]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}`) {
      count(counters, 'projectDetail')
      await fulfillJson(route, result(project))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/repositories`) {
      count(counters, 'projectRepos')
      if (controls.failProjectRepos > 0) {
        controls.failProjectRepos -= 1
        await fulfillFailure(route, '仓库列表临时不可用')
        return
      }
      if (controls.workspaceScenario === 'no-repo') {
        await fulfillJson(route, result([]))
        return
      }
      await fulfillJson(route, result([repository]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks`) {
      count(counters, 'projectScanTasks')
      const scenarioScanTask = controls.workspaceScenario === 'running'
        ? { ...scanTask, id: scanTaskId + 1, status: 'RUNNING', finishedAt: null }
        : controls.workspaceScenario === 'failed'
          ? { ...scanTask, id: scanTaskId + 2, status: 'FAILED', errorMessage: 'Batch4A scan failed before report generation' }
          : scanTask
      const items = controls.workspaceScenario === 'no-repo' || controls.workspaceScenario === 'no-scan'
        ? []
        : [scenarioScanTask]
      await fulfillJson(route, result({ items, page: 1, pageSize: 20, total: items.length }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      count(counters, 'projectExecutionTasks')
      if (controls.workspaceScenario === 'no-repo' || controls.workspaceScenario === 'no-scan') {
        await fulfillJson(route, result({ items: [], page: 1, pageSize: 100, total: 0 }))
        return
      }
      const scenarioExecutionTask = controls.workspaceScenario === 'running'
        ? { ...executionTask, sourceId: scanTaskId + 1, status: 'RUNNING', currentStep: 'chunk_code', progress: 45, finishedAt: null }
        : controls.workspaceScenario === 'failed'
          ? { ...executionTask, sourceId: scanTaskId + 2, status: 'FAILED', currentStep: 'analyze_repository', progress: 100, errorMessage: 'Batch4A scan failed before report generation' }
          : executionTask
      await fulfillJson(route, result({ items: [scenarioExecutionTask], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/scan-tasks/${scanTaskId}`) {
      count(counters, 'scanTaskDetail')
      await fulfillJson(route, result(scanTask))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/SCAN_TASK/${scanTaskId}`) {
      count(counters, 'scanExecutionDetail')
      await fulfillJson(route, result({
        task: executionTask,
        attempts: [],
        steps: [
          {
            id: 1,
            taskId: executionTaskId,
            attemptId: 901,
            stepKey: 'finalize_scan',
            stepName: '收尾归档',
            status: 'SUCCESS',
            logSummary: 'Batch4A scan finalized',
            errorMessage: null,
            startedAt: '2026-07-01T10:04:00Z',
            finishedAt: '2026-07-01T10:05:00Z',
            createdAt: '2026-07-01T10:04:00Z',
            updatedAt: '2026-07-01T10:05:00Z',
          },
        ],
        logs: [],
      }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      count(counters, 'artifacts')
      if (
        controls.workspaceScenario === 'no-repo'
        || controls.workspaceScenario === 'no-scan'
        || controls.workspaceScenario === 'running'
        || controls.workspaceScenario === 'failed'
        || controls.workspaceScenario === 'evidence-gap'
      ) {
        await fulfillJson(route, result([]))
        return
      }
      await fulfillJson(route, result(coreArtifacts))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${reportArtifactId}/preview`) {
      count(counters, 'reportPreview')
      await fulfillJson(route, result({
        record: artifactReport,
        text: JSON.stringify(reportData),
        truncated: false,
        previewBytes: 512,
      }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${overviewArtifactId}/preview`) {
      count(counters, 'overviewPreview')
      if (controls.failProjectOverviewPreview > 0) {
        controls.failProjectOverviewPreview -= 1
        await fulfillFailure(route, '架构概览临时不可用')
        return
      }
      await fulfillJson(route, result({
        record: artifactOverview,
        text: JSON.stringify(overviewData),
        truncated: false,
        previewBytes: 512,
      }))
      return
    }

    const extraArtifact = coreArtifacts.find(artifact => path === `/api/projects/${projectId}/artifacts/${artifact.id}/preview`)
    if (method === 'GET' && extraArtifact) {
      count(counters, `artifactPreview:${extraArtifact.artifactType}`)
      await fulfillJson(route, result({
        record: extraArtifact,
        text: JSON.stringify({ artifactType: extraArtifact.artifactType, status: 'READY' }),
        truncated: false,
        previewBytes: 128,
      }))
      return
    }

    if (method === 'GET' && (path === `/api/projects/${projectId}/code-chunks/search` || path === `/api/projects/${projectId}/code-chunks/status`)) {
      count(counters, 'codeChunks')
      if (controls.failScanCodeChunks > 0) {
        controls.failScanCodeChunks -= 1
        await fulfillFailure(route, 'code_chunks 状态临时不可用')
        return
      }
      if (
        controls.workspaceScenario === 'no-repo'
        || controls.workspaceScenario === 'no-scan'
        || controls.workspaceScenario === 'running'
        || controls.workspaceScenario === 'failed'
        || controls.workspaceScenario === 'evidence-gap'
      ) {
        await fulfillJson(route, result({
          ...codeChunkResult,
          total: 0,
          resultCount: 0,
          totalChunks: 0,
          embeddedChunks: 0,
          evidenceProfile: {
            ...codeChunkResult.evidenceProfile,
            readiness: 'GAP',
            confidence: 0,
            summary: 'code_chunks missing in evidence gap scenario',
            nextAction: '重新扫描并检查 chunk_code 步骤。',
          },
          items: [],
        }))
        return
      }
      await fulfillJson(route, result(codeChunkResult))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`) {
      count(counters, 'scanGovernance')
      if (controls.failScanGovernance > 0) {
        controls.failScanGovernance -= 1
        await fulfillFailure(route, '修复治理时间线临时不可用')
        return
      }
      await fulfillJson(route, result({
        projectId,
        repositoryId,
        scanTaskId,
        scanStatus: 'SUCCESS',
        generatedAt: '2026-07-01T10:10:00Z',
        summary: {
          status: 'HEALTHY',
          counts: { autoRepairs: 1, agentTasks: 1, auditLogs: 1 },
          hasErrors: false,
          attributionGapCount: 0,
        },
        resources: {
          artifacts: [artifactReport],
          scanExecution: { task: executionTask, attempts: [], steps: [], logs: [] },
          repairExecutions: [],
          agentExecutions: [],
          autoRepairs: [],
          agentTasks: [],
          agentToolCalls: [],
          auditLogs: [],
        },
        events: [
          {
            id: 'batch4a-governance-event',
            eventType: 'AUDIT',
            title: 'Batch4A governance recovered',
            detail: 'Governance timeline recovered after retry.',
            status: 'SUCCESS',
            tone: 'ready',
            occurredAt: '2026-07-01T10:10:00Z',
            resource: null,
            source: null,
            attribution: { mode: 'DIRECT', confidence: 'HIGH', reason: 'scanTaskId matched' },
            errorMessage: null,
            actionTarget: { type: 'AUDIT_LOG', id: 1, url: '/audit-logs' },
          },
        ],
        limits: {},
        truncated: false,
        warnings: [],
        attributionGaps: [],
      }))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await fulfillJson(route, result(null), 599)
  })

  return { counters, controls, unhandledApiRequests }
}

function stateErrorBlock(page: Page, title: string) {
  return page.locator('.sl-state-block-error, [role="alert"]').filter({ hasText: title }).first()
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
  const overflow = Math.max(layout.scrollWidth, layout.bodyScrollWidth) - layout.innerWidth
  expect(overflow, `${label} has horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(1)
  return overflow
}

async function expectCodeKnowledgeGateReadable(page: Page, label: string) {
  const gate = page.getByLabel('代码知识库操作门禁说明')
  await expect(gate, `${label}:gate-visible`).toBeVisible()
  const metrics = await gate.locator('span, strong').evaluateAll(elements =>
    elements.map((element, index) => {
      const style = getComputedStyle(element)
      return {
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth,
        index,
        overflow: style.overflow,
        overflowWrap: style.overflowWrap,
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
      }
    })
  )
  expect(metrics.length, `${label}:gate text nodes`).toBeGreaterThanOrEqual(2)
  for (const metric of metrics) {
    expect(metric.overflow, `${label}:gate text must not hide overflow: ${JSON.stringify(metric)}`).toBe('visible')
    expect(metric.textOverflow, `${label}:gate text must not ellipsize: ${JSON.stringify(metric)}`).toBe('clip')
    expect(metric.whiteSpace, `${label}:gate text must wrap: ${JSON.stringify(metric)}`).toBe('normal')
    expect(
      metric.overflowWrap === 'anywhere' || metric.wordBreak === 'break-word' || metric.wordBreak === 'break-all',
      `${label}:gate text must allow long tokens to wrap: ${JSON.stringify(metric)}`,
    ).toBe(true)
    expect(metric.scrollWidth - metric.clientWidth, `${label}:gate text is horizontally clipped: ${JSON.stringify(metric)}`).toBeLessThanOrEqual(2)
    expect(metric.scrollHeight - metric.clientHeight, `${label}:gate text is vertically clipped: ${JSON.stringify(metric)}`).toBeLessThanOrEqual(2)
  }
  return true
}

async function expectCodeKnowledgeGridReadable(page: Page, label: string) {
  const metrics = await page.locator('.sl-code-knowledge-grid span, .sl-code-knowledge-grid strong').evaluateAll(elements =>
    elements.map((element, index) => {
      const style = getComputedStyle(element)
      return {
        clientWidth: element.clientWidth,
        index,
        overflow: style.overflow,
        overflowWrap: style.overflowWrap,
        scrollWidth: element.scrollWidth,
        text: element.textContent?.trim() || '',
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
      }
    })
  )
  expect(metrics.length, `${label}:grid text nodes`).toBeGreaterThanOrEqual(8)
  for (const metric of metrics) {
    expect(metric.overflow, `${label}:grid text must not hide overflow: ${JSON.stringify(metric)}`).toBe('visible')
    expect(metric.textOverflow, `${label}:grid text must not ellipsize: ${JSON.stringify(metric)}`).toBe('clip')
    expect(metric.whiteSpace, `${label}:grid text must wrap: ${JSON.stringify(metric)}`).toBe('normal')
    expect(
      metric.overflowWrap === 'anywhere' || metric.wordBreak === 'break-word' || metric.wordBreak === 'break-all',
      `${label}:grid text must allow long tokens to wrap: ${JSON.stringify(metric)}`,
    ).toBe(true)
    expect(metric.scrollWidth - metric.clientWidth, `${label}:grid text is horizontally clipped: ${JSON.stringify(metric)}`).toBeLessThanOrEqual(2)
  }
  return true
}

async function expectProjectNextActionChecksReadable(page: Page, label: string) {
  const metrics = await page.locator('.sl-project-next-action-check span, .sl-project-next-action-check strong').evaluateAll(elements =>
    elements.map((element, index) => {
      const style = getComputedStyle(element)
      return {
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth,
        index,
        overflowWrap: style.overflowWrap,
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        text: element.textContent?.trim() || '',
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
      }
    })
  )
  expect(metrics.length, `${label} must expose next-action check text nodes`).toBeGreaterThan(0)
  for (const metric of metrics) {
    expect(metric.whiteSpace, `${label} check ${metric.index} must not force single-line truncation: ${JSON.stringify(metric)}`).not.toBe('nowrap')
    expect(metric.textOverflow, `${label} check ${metric.index} must not hide text with ellipsis: ${JSON.stringify(metric)}`).not.toBe('ellipsis')
    expect(
      metric.overflowWrap === 'anywhere' || metric.wordBreak === 'break-word',
      `${label} check ${metric.index} must allow long text wrapping: ${JSON.stringify(metric)}`
    ).toBe(true)
    expect(metric.scrollWidth, `${label} check ${metric.index} must not be horizontally clipped: ${JSON.stringify(metric)}`).toBeLessThanOrEqual(metric.clientWidth + 2)
    expect(metric.scrollHeight, `${label} check ${metric.index} must not be vertically clipped: ${JSON.stringify(metric)}`).toBeLessThanOrEqual(metric.clientHeight + 2)
  }
}

for (const viewport of viewportMatrix) {
  test(`Dashboard data failure is retryable on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installBatch4AMocks(page)
    network.controls.failDashboardStats = 6

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: '源码逆向分析控制台' })).toBeVisible()
    const dashboardError = stateErrorBlock(page, '仪表盘数据加载失败')
    await expect(dashboardError).toBeVisible()
    await expect(dashboardError).toContainText('仪表盘统计临时不可用')
    await expect(page.getByText('恢复仪表盘数据')).toBeVisible()

    await dashboardError.getByRole('button', { name: '重试加载' }).click()
    await expect(stateErrorBlock(page, '仪表盘数据加载失败')).toHaveCount(0)
    await expect(page.locator('.sl-dashboard-scan-repo').filter({ hasText: 'Batch4A-Repo' })).toBeVisible()
    await expectNoHorizontalOverflow(page, `dashboard-batch4a:${viewport.name}`)

    expect(network.counters.dashboardStats).toBeGreaterThanOrEqual(7)
    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })

  test(`ProjectDetail local overview retry and stale core refresh preserve trusted workspace on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installBatch4AMocks(page)
    network.controls.failProjectOverviewPreview = 3

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/projects/${projectId}`)
    await expect(page.getByRole('heading', { name: 'Batch4A Deep Project' })).toBeVisible()
    await expect(page.locator(`[data-sl-project-state="READY"][data-sl-project-id="${projectId}"]`)).toHaveCount(1)
    const overviewError = stateErrorBlock(page, '项目总览加载失败')
    await expect(overviewError).toBeVisible()
    await expect(overviewError).toContainText('架构概览临时不可用')

    await overviewError.getByRole('button', { name: '重新加载总览' }).click()
    await expect(page.getByText('文件总数')).toBeVisible()
    await expect(stateErrorBlock(page, '项目总览加载失败')).toHaveCount(0)
    await expect(page.locator(`[data-sl-project-state="READY"][data-sl-project-id="${projectId}"]`)).toHaveCount(1)
    const overviewPreviewAfterLocalRetry = network.counters.overviewPreview || 0
    expect(overviewPreviewAfterLocalRetry).toBeGreaterThanOrEqual(4)

    const projectReposBeforeStaleRefresh = network.counters.projectRepos || 0
    network.controls.failProjectRepos = 3
    await page.getByRole('button', { name: '刷新项目、仓库、扫描和总览数据' }).click()

    await expect(page.getByRole('heading', { name: 'Batch4A Deep Project' })).toBeVisible()
    await expect(page.locator(`[data-sl-project-state="STALE_REFRESH"][data-sl-project-id="${projectId}"]`)).toHaveCount(1)
    const staleAction = page.getByLabel('项目下一步行动')
    await expect(staleAction).toHaveAttribute('data-sl-action-key', 'STALE_REFRESH')
    await expect(page.locator('.sl-page-inner button.ant-btn-primary:visible')).toHaveCount(1)
    const resync = staleAction.getByRole('button', { name: '重新同步' })
    await expect(resync).toBeVisible()
    expect(network.counters.projectRepos - projectReposBeforeStaleRefresh).toBe(3)
    expect(network.controls.failProjectRepos).toBe(0)

    await resync.click()
    await expect(page.locator(`[data-sl-project-state="READY"][data-sl-project-id="${projectId}"]`)).toHaveCount(1)
    await expect(staleAction).toHaveAttribute('data-sl-action-key', 'OPEN_QA')
    expect(network.counters.projectRepos - projectReposBeforeStaleRefresh).toBe(4)
    expect(network.counters.overviewPreview).toBeGreaterThan(overviewPreviewAfterLocalRetry)

    await page.getByRole('tab', { name: '仓库管理' }).click()
    const activeTab = page.locator('.ant-tabs-tabpane-active')
    await expect(activeTab.getByText('LJunP/Batch4A-Repo', { exact: true })).toBeVisible()
    await expect(activeTab.locator('.ant-alert').filter({ hasText: '仓库列表加载失败' })).toHaveCount(0)
    await expectNoHorizontalOverflow(page, `project-detail-batch4a:${viewport.name}`)

    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })

  test(`ProjectDetail workspace next action rail covers six states on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installBatch4AMocks(page)

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    expect(workspaceActionScenarios, 'Project workspace next action smoke must keep exactly six branches.').toHaveLength(6)

    for (const scenario of workspaceActionScenarios) {
      network.controls.workspaceScenario = scenario.scenario
      await page.goto(`/projects/${projectId}?scenario=${scenario.scenario}`)
      await expect(page.getByRole('heading', { name: 'Batch4A Deep Project' })).toBeVisible()
      const nextAction = page.getByLabel('项目下一步行动')
      await expect(nextAction).toBeVisible()
      await expect(nextAction).toHaveAttribute('data-sl-action-key', scenario.actionKey)
      await expect(nextAction.getByRole('heading', { name: scenario.title })).toBeVisible()
      await expect(nextAction.getByRole('button', { name: scenario.primaryLabel })).toBeVisible()
      await expect(nextAction.getByRole('button', { name: scenario.secondaryLabel })).toBeVisible()
      await expect(nextAction.getByLabel('项目下一步证据检查')).toBeVisible()
      await expectProjectNextActionChecksReadable(page, `project-next-action-checks:${scenario.scenario}:${viewport.name}`)
      const overflow = await expectNoHorizontalOverflow(page, `project-next-action:${scenario.scenario}:${viewport.name}`)
      workspaceNextActionOverflowChecks.push({
        scenario: scenario.scenario,
        viewport: `${viewport.width}x${viewport.height}`,
        overflow,
      })
    }

    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })

  test(`ScanTaskDetail code_chunks and governance failures are locally retryable on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installBatch4AMocks(page)
    network.controls.failScanCodeChunks = 3
    network.controls.failScanGovernance = 6

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/scan-tasks/${scanTaskId}`)
    await expect(page.getByRole('heading', { name: '仓库逆向分析报告' })).toBeVisible()
    await expect(page.getByText('code_chunks 状态临时不可用')).toBeVisible()
    await expect(page.getByText('修复治理时间线临时不可用')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Batch4A report ready' }).first()).toBeVisible()
    const codeKnowledgeGate = page.getByLabel('代码知识库操作门禁说明')
    await expect(codeKnowledgeGate.getByText('代码知识库门禁未开放')).toBeVisible()
    await expect(codeKnowledgeGate.getByText('code_chunks 状态读取失败，先重新读取状态；在状态恢复前，代码问答和切片检索入口保持关闭。')).toBeVisible()
    await expectCodeKnowledgeGateReadable(page, `scan-code-knowledge-gate-blocked:${viewport.name}`)

    await page.getByRole('button', { name: '重新读取 code_chunks' }).click()
    await expect(page.getByText('code_chunks 状态临时不可用')).toHaveCount(0)
    await expect(page.getByText('128 code_chunks')).toBeVisible()
    await expect(codeKnowledgeGate.getByText('代码知识库门禁已开放')).toBeVisible()
    await expect(codeKnowledgeGate.getByText('128 个 code_chunks 可用于代码问答和切片检索；当前召回模式 HYBRID，下一步：Use code QA。')).toBeVisible()
    await expectCodeKnowledgeGateReadable(page, `scan-code-knowledge-gate-ready:${viewport.name}`)
    await expectCodeKnowledgeGridReadable(page, `scan-code-knowledge-grid:${viewport.name}`)
    scanCodeKnowledgeGateProofs.push({
      viewport: `${viewport.width}x${viewport.height}`,
      blockedVisible: true,
      readyVisible: true,
      styleSafe: true,
      gridStyleSafe: true,
    })

    await page.getByRole('button', { name: '重新加载治理时间线' }).click()
    await expect(page.getByText('修复治理时间线临时不可用')).toHaveCount(0)
    await expect(page.getByLabel('修复治理时间线').getByText('BOUND')).toBeVisible()
    await expectNoHorizontalOverflow(page, `scan-task-detail-batch4a:${viewport.name}`)

    expect(network.counters.codeChunks).toBeGreaterThanOrEqual(4)
    expect(network.counters.scanGovernance).toBeGreaterThanOrEqual(7)
    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })
}

test.afterAll(() => {
  const expectedWorkspaceNextActionChecks = viewportMatrix.length * workspaceActionScenarios.length
  const workspaceNextActionOverflowFailures = workspaceNextActionOverflowChecks.filter(check => check.overflow > 1)
  console.log('P9_MAIN_PATH_RECOVERABLE_ERROR_STATES_BATCH4A_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    pages: ['Dashboard', 'ProjectDetail', 'ScanTaskDetail'],
    splitOut: {
      dependencyGraph: 'batch4B requires graph retry action before recoverable smoke',
    },
    retryableStates: {
      dashboard: ['仪表盘数据加载失败', '重试加载'],
      projectDetail: ['项目总览加载失败', '重新加载总览', 'STALE_REFRESH', '重新同步'],
      scanTaskDetail: ['code_chunks 状态临时不可用', '重新读取 code_chunks', '修复治理时间线临时不可用', '重新加载治理时间线'],
    },
    scanCodeKnowledgeGate: {
      surface: 'SCAN_TASK_DETAIL_CODE_KNOWLEDGE_GATE',
      proofCount: scanCodeKnowledgeGateProofs.length,
      viewports: scanCodeKnowledgeGateProofs.map(proof => proof.viewport),
      blockedReasonVisible: scanCodeKnowledgeGateProofs.every(proof => proof.blockedVisible),
      readyReasonVisible: scanCodeKnowledgeGateProofs.every(proof => proof.readyVisible),
      textStyleSafe: scanCodeKnowledgeGateProofs.every(proof => proof.styleSafe),
      gridTextStyleSafe: scanCodeKnowledgeGateProofs.every(proof => proof.gridStyleSafe),
    },
    projectWorkspaceNextAction: {
      marker: 'PROJECT_WORKSPACE_NEXT_ACTION_SMOKE_OK',
      branchCount: workspaceActionScenarios.length,
      branches: workspaceActionScenarios.map(scenario => scenario.actionKey),
      primaryCtas: workspaceActionScenarios.map(scenario => scenario.primaryLabel),
      secondaryCtas: workspaceActionScenarios.map(scenario => scenario.secondaryLabel),
      viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
      mockedApiOnly: true,
      unhandledApiRequests: 0,
      checkedCases: workspaceNextActionOverflowChecks.length,
      expectedCheckedCases: expectedWorkspaceNextActionChecks,
      overflowFailures: workspaceNextActionOverflowFailures.length,
      noHorizontalOverflow: true,
      providerQualityClaim: false,
      llmFactClaim: false,
    },
    spec: 'p9-main-path-recoverable-error-states-batch4a.spec.ts',
  }))
  console.log('PROJECT_WORKSPACE_NEXT_ACTION_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    branchCount: workspaceActionScenarios.length,
    branches: workspaceActionScenarios.map(scenario => scenario.actionKey),
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    checkedCases: workspaceNextActionOverflowChecks.length,
    expectedCheckedCases: expectedWorkspaceNextActionChecks,
    overflowFailures: workspaceNextActionOverflowFailures.length,
    noHorizontalOverflow: true,
    providerQualityClaim: false,
    llmFactClaim: false,
    spec: 'p9-main-path-recoverable-error-states-batch4a.spec.ts',
  }))
})
