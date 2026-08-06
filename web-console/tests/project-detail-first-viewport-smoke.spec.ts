import { expect, test, type Page, type Route } from '@playwright/test'

type RuntimeIssue = { type: string; message: string }
type CoreSource = 'project' | 'repos' | 'scans'
type MockMode = 'initial' | 'fatal' | 'ready'
type WorkspaceScenario = 'no-repo' | 'no-scan' | 'running' | 'failed' | 'evidence-gap' | 'ready'

type MockControls = {
  failAllCore?: boolean
  fatalSource?: CoreSource
  mode: MockMode
  scenario: WorkspaceScenario
}

type RaceDelayKind = 'none' | 'core' | 'code-chunks' | 'previews'
type DelayedApiResponse = { data: unknown; label: string; route: Route }

const projectId = 1
const repositoryId = 11
const scanTaskId = 501

const viewportMatrix = [
  { name: 'wide-desktop', width: 1440, height: 900 },
  { name: 'compact-desktop', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow-mobile', width: 320, height: 740 },
] as const

const workspaceScenarios: Array<{
  actionKey: string
  primaryLabel: string
  scenario: WorkspaceScenario
}> = [
  { scenario: 'no-repo', actionKey: 'ADD_REPOSITORY', primaryLabel: '添加仓库' },
  { scenario: 'no-scan', actionKey: 'START_SCAN', primaryLabel: '触发扫描' },
  { scenario: 'running', actionKey: 'WATCH_SCAN', primaryLabel: '查看扫描进度' },
  { scenario: 'failed', actionKey: 'REVIEW_FAILED_SCAN', primaryLabel: '打开失败详情' },
  { scenario: 'evidence-gap', actionKey: 'OPEN_ARTIFACTS', primaryLabel: '打开产物证据' },
  { scenario: 'ready', actionKey: 'OPEN_QA', primaryLabel: '进入代码问答' },
]

const project = {
  id: projectId,
  name: 'First Viewport Project',
  description: 'Focused ProjectDetail first viewport smoke fixture',
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
  owner: 'SourceLens',
  name: 'first-viewport-fixture',
  url: 'https://github.com/SourceLens/first-viewport-fixture.git',
  defaultBranch: 'main',
  visibility: 'PUBLIC',
  authType: 'NONE',
  status: 'ACTIVE',
  createdAt: '2026-07-01T10:00:00Z',
}

const successfulScan = {
  id: scanTaskId,
  projectId,
  repositoryId,
  branch: 'main',
  commitSha: 'abc1234viewport',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:05:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:30Z',
}

const executionTask = {
  id: 701,
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

const artifactTypes = [
  'ARCHITECTURE_REPORT',
  'ARCHITECTURE_OVERVIEW',
  'RAW_SCAN_RESULT',
  'API_CATALOG',
  'DB_SCHEMA',
  'CODE_METRICS',
  'DEPENDENCY_GRAPH',
]

const coreArtifacts = artifactTypes.map((artifactType, index) => ({
  id: 801 + index,
  projectId,
  repositoryId,
  ownerType: 'SCAN_TASK',
  ownerId: scanTaskId,
  artifactType,
  contentType: 'application/json',
  sizeBytes: 4096,
  checksumSha256: 'b'.repeat(64),
  metadataJson: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:06:00Z',
}))

const reportData = {
  reportQuality: {
    readiness: 'READY',
    confidence: 88,
    summary: 'First viewport evidence is ready',
    gaps: [],
    nextActions: ['Review cited code evidence.'],
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

function buildRaceFixture(id: number, marker: 'A' | 'B') {
  const repoId = id * 10 + 1
  const raceScanTaskId = id * 100 + 1
  const chunkTotal = marker === 'A' ? 1101 : 2202
  const embeddedChunks = marker === 'A' ? 901 : 2002
  const language = `Race-${marker}-Language`
  const raceProject = {
    id,
    name: `Race ${marker} Project`,
    description: `Delayed response fixture ${marker}`,
    primaryLanguage: language,
    framework: `Race ${marker} Framework`,
    status: 'ACTIVE',
    healthScore: marker === 'A' ? 71 : 92,
    createdBy: 1,
    createdAt: '2026-07-01T10:00:00Z',
  }
  const raceRepository = {
    id: repoId,
    projectId: id,
    provider: 'GITHUB',
    owner: `Race${marker}`,
    name: `repo-${marker.toLowerCase()}-${repoId}`,
    url: `https://github.com/Race${marker}/repo-${marker.toLowerCase()}-${repoId}.git`,
    defaultBranch: 'main',
    visibility: 'PUBLIC',
    authType: 'NONE',
    status: 'ACTIVE',
    createdAt: '2026-07-01T10:00:00Z',
  }
  const raceScan = {
    id: raceScanTaskId,
    projectId: id,
    repositoryId: repoId,
    branch: 'main',
    commitSha: `race-${marker.toLowerCase()}-${raceScanTaskId}`,
    status: 'SUCCESS',
    triggerType: 'MANUAL',
    startedAt: '2026-07-01T10:01:00Z',
    finishedAt: '2026-07-01T10:05:00Z',
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T10:00:30Z',
  }
  const raceExecution = {
    ...executionTask,
    id: id * 100 + 2,
    projectId: id,
    repositoryId: repoId,
    sourceId: raceScanTaskId,
  }
  const artifacts = artifactTypes.map((artifactType, index) => ({
    id: id * 1000 + 801 + index,
    projectId: id,
    repositoryId: repoId,
    ownerType: 'SCAN_TASK',
    ownerId: raceScanTaskId,
    artifactType,
    contentType: 'application/json',
    sizeBytes: 4096,
    checksumSha256: marker.toLowerCase().repeat(64),
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-07-01T10:06:00Z',
  }))
  const raceReportData = {
    reportQuality: {
      readiness: 'READY',
      confidence: marker === 'A' ? 81 : 93,
      summary: `Race ${marker} report ready`,
      gaps: [],
      nextActions: [`Review Race ${marker} evidence.`],
      evidenceChecks: [],
    },
  }
  const raceOverviewData = {
    ...overviewData,
    languages: [{ name: language, file_count: marker === 'A' ? 11 : 22, line_count: marker === 'A' ? 1101 : 2202 }],
    framework: { name: `Race ${marker} Framework`, version: marker === 'A' ? '1.0' : '2.0' },
    totalFiles: marker === 'A' ? 111 : 222,
    totalLines: marker === 'A' ? 1101 : 2202,
  }
  const raceCodeKnowledge = {
    scanTaskId: raceScanTaskId,
    query: '',
    limit: 1,
    total: 1,
    resultCount: 1,
    totalChunks: chunkTotal,
    embeddedChunks,
    truncated: false,
    retrievalMode: 'HYBRID',
    evidenceProfile: {
      readiness: 'READY',
      confidence: marker === 'A' ? 82 : 94,
      summary: `Race ${marker} code evidence ready`,
      nextAction: `Use Race ${marker} code QA`,
      details: [],
      uniqueFiles: 1,
      embeddedEvidenceCount: 1,
      lowConfidenceCount: 0,
      topScore: 92,
      averageScore: 92,
      lineSpan: 24,
      dominantEvidenceType: 'SERVICE',
      evidenceTypeStats: [{ type: 'SERVICE', count: 1 }],
      fileStats: [{ filePath: `src/race-${marker.toLowerCase()}/Service.java`, count: 1, bestScore: 92 }],
    },
    items: [],
  }

  return {
    artifacts,
    chunkTotal,
    codeKnowledge: raceCodeKnowledge,
    execution: raceExecution,
    language,
    overviewData: raceOverviewData,
    project: raceProject,
    reportData: raceReportData,
    repoLabel: `${raceRepository.owner}/${raceRepository.name}`,
    repository: raceRepository,
    scan: raceScan,
  }
}

const raceA = buildRaceFixture(101, 'A')
const raceB = buildRaceFixture(202, 'B')

function codeKnowledge(ready: boolean) {
  return {
    scanTaskId,
    query: '',
    limit: 1,
    total: ready ? 1 : 0,
    resultCount: ready ? 1 : 0,
    totalChunks: ready ? 128 : 0,
    embeddedChunks: ready ? 96 : 0,
    truncated: false,
    retrievalMode: 'HYBRID',
    evidenceProfile: {
      readiness: ready ? 'READY' : 'GAP',
      confidence: ready ? 86 : 0,
      summary: ready ? 'Code evidence ready' : 'Code evidence is missing',
      nextAction: ready ? 'Use code QA' : 'Re-run chunk_code.',
      details: [],
      uniqueFiles: ready ? 1 : 0,
      embeddedEvidenceCount: ready ? 1 : 0,
      lowConfidenceCount: 0,
      topScore: ready ? 92 : 0,
      averageScore: ready ? 92 : 0,
      lineSpan: ready ? 24 : 0,
      dominantEvidenceType: ready ? 'SERVICE' : 'UNKNOWN',
      evidenceTypeStats: ready ? [{ type: 'SERVICE', count: 1 }] : [],
      fileStats: ready ? [{ filePath: 'src/main/java/com/example/Service.java', count: 1, bestScore: 92 }] : [],
    },
    items: ready
      ? [{
          id: 1001,
          scanTaskId,
          filePath: 'src/main/java/com/example/Service.java',
          startLine: 12,
          endLine: 36,
          content: 'class Service {}',
          contentPreview: 'class Service {}',
          hasEmbedding: true,
          matchedTerms: ['Service'],
          relevanceScore: 92,
          evidenceType: 'SERVICE',
          evidenceReason: 'Focused smoke evidence.',
          contextRole: 'PRIMARY',
          contextDistance: 0,
        }]
      : [],
  }
}

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

async function fulfillFailure(route: Route, message: string, status = 503) {
  await fulfillJson(route, { code: 'INTERNAL_ERROR', message, data: null }, status)
}

function scanForScenario(scenario: WorkspaceScenario) {
  if (scenario === 'no-repo' || scenario === 'no-scan') return null
  if (scenario === 'running') {
    return { ...successfulScan, id: scanTaskId + 1, status: 'RUNNING', finishedAt: null }
  }
  if (scenario === 'failed') {
    return { ...successfulScan, id: scanTaskId + 2, status: 'FAILED', errorMessage: 'Scan failed before report generation' }
  }
  return successfulScan
}

function executionForScenario(scenario: WorkspaceScenario) {
  const scan = scanForScenario(scenario)
  if (!scan) return null
  if (scenario === 'running') {
    return { ...executionTask, sourceId: scan.id, status: 'RUNNING', currentStep: 'chunk_code', progress: 45, finishedAt: null }
  }
  if (scenario === 'failed') {
    return { ...executionTask, sourceId: scan.id, status: 'FAILED', progress: 100, errorMessage: scan.errorMessage }
  }
  return executionTask
}

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []
  const ignoredConsolePatterns = [
    /React Router Future Flag Warning/,
    /findDOMNode/,
    /Static function can not consume context like dynamic theme/,
    /Instance created by `useForm` is not connected to any Form element/,
    /Failed to load resource: the server responded with a status of 503 \(Service Unavailable\)/,
  ]

  page.on('console', message => {
    if (!['error', 'warning'].includes(message.type())) return
    const text = message.text()
    if (!ignoredConsolePatterns.some(pattern => pattern.test(text))) {
      issues.push({ type: message.type(), message: text })
    }
  })
  page.on('pageerror', error => issues.push({ type: 'pageerror', message: error.message }))
  return issues
}

async function installMocks(page: Page, controls: MockControls) {
  const unhandledApiRequests: string[] = []
  const requestCounts: Record<string, number> = {}
  const count = (key: string) => {
    requestCounts[key] = (requestCounts[key] || 0) + 1
  }

  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'project-detail-first-viewport-smoke-token')
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
      count('auth')
      await fulfillJson(route, result({ id: 1, username: 'viewport_qa', email: 'viewport@local.test', status: 'ACTIVE' }))
      return
    }

    const coreSource: CoreSource | null = path === `/api/projects/${projectId}`
      ? 'project'
      : path === `/api/projects/${projectId}/repositories`
        ? 'repos'
        : path === `/api/projects/${projectId}/scan-tasks`
          ? 'scans'
          : null

    if (method === 'GET' && coreSource) {
      count(coreSource)
      if (controls.mode === 'initial') return
      if (controls.mode === 'fatal' && (controls.failAllCore || controls.fatalSource === coreSource)) {
        await fulfillFailure(route, `${coreSource} core source unavailable`)
        return
      }
      if (coreSource === 'project') {
        await fulfillJson(route, result(project))
        return
      }
      if (coreSource === 'repos') {
        await fulfillJson(route, result(controls.scenario === 'no-repo' ? [] : [repository]))
        return
      }
      const scan = scanForScenario(controls.scenario)
      const items = scan ? [scan] : []
      await fulfillJson(route, result({ items, page: 1, pageSize: 20, total: items.length }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      count('execution-tasks')
      const execution = controls.mode === 'ready' ? executionForScenario(controls.scenario) : null
      const items = execution ? [execution] : []
      await fulfillJson(route, result({ items, page: 1, pageSize: 100, total: items.length }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      count('artifacts')
      const artifacts = controls.scenario === 'ready' ? coreArtifacts : []
      await fulfillJson(route, result(artifacts))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/code-chunks/status`) {
      count('code-chunks')
      await fulfillJson(route, result(codeKnowledge(controls.scenario === 'ready')))
      return
    }

    const artifact = coreArtifacts.find(item => path === `/api/projects/${projectId}/artifacts/${item.id}/preview`)
    if (method === 'GET' && artifact) {
      count(`preview:${artifact.artifactType}`)
      const text = artifact.artifactType === 'ARCHITECTURE_REPORT'
        ? JSON.stringify(reportData)
        : artifact.artifactType === 'ARCHITECTURE_OVERVIEW'
          ? JSON.stringify(overviewData)
          : JSON.stringify({ artifactType: artifact.artifactType, status: 'READY' })
      await fulfillJson(route, result({ record: artifact, text, truncated: false, previewBytes: text.length }))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await fulfillFailure(route, `Unhandled API request: ${method} ${path}`, 599)
  })

  return { requestCounts, unhandledApiRequests }
}

async function installRaceMocks(page: Page, controls: { delayKind: RaceDelayKind }) {
  const delayed: Record<'core' | 'codeChunks' | 'previews', DelayedApiResponse[]> = {
    core: [],
    codeChunks: [],
    previews: [],
  }
  const unhandledApiRequests: string[] = []
  const fixtures = new Map([
    [raceA.project.id, raceA],
    [raceB.project.id, raceB],
  ])

  const hold = (kind: keyof typeof delayed, route: Route, data: unknown, label: string) => {
    delayed[kind].push({ data, label, route })
  }

  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'project-detail-route-race-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'route_race_qa', email: 'route-race@local.test', status: 'ACTIVE' }))
      return
    }

    const projectMatch = path.match(/^\/api\/projects\/(\d+)$/)
    const reposMatch = path.match(/^\/api\/projects\/(\d+)\/repositories$/)
    const scansMatch = path.match(/^\/api\/projects\/(\d+)\/scan-tasks$/)
    const executionsMatch = path.match(/^\/api\/projects\/(\d+)\/execution-tasks$/)
    const artifactsMatch = path.match(/^\/api\/projects\/(\d+)\/artifacts$/)
    const codeChunksMatch = path.match(/^\/api\/projects\/(\d+)\/code-chunks\/status$/)
    const previewMatch = path.match(/^\/api\/projects\/(\d+)\/artifacts\/(\d+)\/preview$/)

    const match = projectMatch || reposMatch || scansMatch || executionsMatch || artifactsMatch || codeChunksMatch || previewMatch
    const fixture = match ? fixtures.get(Number(match[1])) : undefined
    const delayA = fixture === raceA

    if (method === 'GET' && fixture && projectMatch) {
      const data = result(fixture.project)
      if (delayA && controls.delayKind === 'core') hold('core', route, data, 'project')
      else await fulfillJson(route, data)
      return
    }
    if (method === 'GET' && fixture && reposMatch) {
      const data = result([fixture.repository])
      if (delayA && controls.delayKind === 'core') hold('core', route, data, 'repos')
      else await fulfillJson(route, data)
      return
    }
    if (method === 'GET' && fixture && scansMatch) {
      const data = result({ items: [fixture.scan], page: 1, pageSize: 20, total: 1 })
      if (delayA && controls.delayKind === 'core') hold('core', route, data, 'scans')
      else await fulfillJson(route, data)
      return
    }
    if (method === 'GET' && fixture && executionsMatch) {
      await fulfillJson(route, result({ items: [fixture.execution], page: 1, pageSize: 100, total: 1 }))
      return
    }
    if (method === 'GET' && fixture && artifactsMatch) {
      await fulfillJson(route, result(fixture.artifacts))
      return
    }
    if (method === 'GET' && fixture && codeChunksMatch) {
      const data = result(fixture.codeKnowledge)
      if (delayA && controls.delayKind === 'code-chunks') hold('codeChunks', route, data, 'code-chunks')
      else await fulfillJson(route, data)
      return
    }
    if (method === 'GET' && fixture && previewMatch) {
      const artifactId = Number(previewMatch[2])
      const artifact = fixture.artifacts.find(item => item.id === artifactId)
      if (artifact) {
        const text = artifact.artifactType === 'ARCHITECTURE_REPORT'
          ? JSON.stringify(fixture.reportData)
          : artifact.artifactType === 'ARCHITECTURE_OVERVIEW'
            ? JSON.stringify(fixture.overviewData)
            : JSON.stringify({ artifactType: artifact.artifactType, projectId: fixture.project.id })
        const data = result({ record: artifact, text, truncated: false, previewBytes: text.length })
        if (delayA && controls.delayKind === 'previews') hold('previews', route, data, artifact.artifactType)
        else await fulfillJson(route, data)
        return
      }
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await fulfillFailure(route, `Unhandled route-race API request: ${method} ${path}`, 599)
  })

  const release = async (kind: keyof typeof delayed) => {
    const pending = delayed[kind].splice(0)
    await Promise.all(pending.map(item => fulfillJson(item.route, item.data)))
    return pending.length
  }

  return { delayed, release, unhandledApiRequests }
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  const overflow = Math.max(layout.scrollWidth, layout.bodyScrollWidth) - layout.innerWidth
  expect(overflow, `${label} has horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(1)
}

async function expectButtonInsideViewport(
  page: Page,
  button: ReturnType<Page['getByRole']>,
  viewport: { width: number; height: number },
  label: string,
) {
  const box = await button.boundingBox()
  expect(box, `${label} must have a rendered box`).not.toBeNull()
  expect(box!.x, `${label} must not be clipped on the left`).toBeGreaterThanOrEqual(0)
  expect(box!.y, `${label} must not be clipped above the viewport`).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width, `${label} must not be clipped on the right`).toBeLessThanOrEqual(viewport.width)
  expect(box!.y + box!.height, `${label} must be fully visible in the first viewport`).toBeLessThanOrEqual(viewport.height)
}

async function expectInitialLoadingContract(page: Page, viewportLabel: string) {
  await expect(page.locator('[data-sl-project-state="INITIAL_LOADING"]')).toHaveCount(1)
  await expect(page.getByText('正在确认项目工作区')).toBeVisible()
  await expect(page.locator('.sl-project-cockpit')).toHaveCount(0)
  await expect(page.getByLabel('项目主链路状态')).toHaveCount(0)
  await expect(page.getByLabel('项目可信工程闭环')).toHaveCount(0)
  await expect(page.getByLabel('项目下一步行动')).toHaveCount(0)
  await expect(page.locator('.sl-page-inner button.ant-btn-primary:visible')).toHaveCount(0)
  expect(await page.evaluate(() => window.scrollY), `${viewportLabel}: INITIAL_LOADING scrollY`).toBe(0)
}

async function expectFatalContract(
  page: Page,
  viewport: { width: number; height: number },
  label: string,
) {
  await expect(page.locator('[data-sl-project-state="FATAL_LOAD"]')).toHaveCount(1)
  await expect(page.locator('.sl-project-cockpit')).toHaveCount(0)
  await expect(page.getByLabel('项目下一步行动')).toHaveCount(0)
  const primaryButtons = page.locator('.sl-page-inner button.ant-btn-primary:visible')
  await expect(primaryButtons, `${label}: unique primary`).toHaveCount(1)
  const reload = page.getByRole('button', { name: '重新加载项目工作区' })
  await expect(reload).toBeVisible()
  await expectButtonInsideViewport(page, reload, viewport, `${label}: reload`)
  expect(await page.evaluate(() => window.scrollY), `${label}: scrollY`).toBe(0)
  await expectNoHorizontalOverflow(page, label)
}

async function expectReadyContract(
  page: Page,
  viewport: { width: number; height: number },
  scenario: (typeof workspaceScenarios)[number],
) {
  const label = `${scenario.scenario}:${viewport.width}x${viewport.height}`
  await expect(page.locator('[data-sl-project-state="READY"]')).toHaveCount(1)
  await expect(page.locator('.sl-project-cockpit')).toBeVisible()
  await expect(page.getByLabel('项目主链路状态')).toBeVisible()
  await expect(page.getByLabel('项目可信工程闭环')).toBeVisible()
  const nextAction = page.getByLabel('项目下一步行动')
  await expect(nextAction).toBeVisible()
  await expect(nextAction).toHaveAttribute('data-sl-action-key', scenario.actionKey)
  await expect(nextAction).toHaveAttribute('data-sl-primary-count', '1')
  const primaryButtons = page.locator('.sl-page-inner button.ant-btn-primary:visible')
  await expect(primaryButtons, `${label}: unique primary`).toHaveCount(1)
  const primaryButton = nextAction.getByRole('button', { name: scenario.primaryLabel })
  await expect(primaryButton).toBeVisible()
  await expectButtonInsideViewport(page, primaryButton, viewport, `${label}: primary`)
  expect(await page.evaluate(() => window.scrollY), `${label}: scrollY`).toBe(0)
  await expectNoHorizontalOverflow(page, label)
}

async function expectStaleRefreshContract(
  page: Page,
  viewport: { width: number; height: number },
  label: string,
) {
  const root = page.locator(`[data-sl-project-state="STALE_REFRESH"][data-sl-project-id="${projectId}"]`)
  await expect(root).toHaveCount(1)
  await expect(page.getByRole('heading', { name: project.name })).toBeVisible()
  await expect(page.locator('.sl-project-cockpit')).toBeVisible()
  const nextAction = page.getByLabel('项目下一步行动')
  await expect(nextAction).toHaveAttribute('data-sl-action-key', 'STALE_REFRESH')
  await expect(nextAction).toHaveAttribute('data-sl-primary-count', '1')
  const primaryButtons = page.locator('.sl-page-inner button.ant-btn-primary:visible')
  await expect(primaryButtons, `${label}: unique stale primary`).toHaveCount(1)
  const resync = nextAction.getByRole('button', { name: '重新同步' })
  await expect(resync).toBeVisible()
  await expectButtonInsideViewport(page, resync, viewport, `${label}: resync`)
  expect(await page.evaluate(() => window.scrollY), `${label}: scrollY`).toBe(0)
  await expectNoHorizontalOverflow(page, label)
}

async function navigateClientSide(page: Page, nextProjectId: number) {
  await page.evaluate((id) => {
    const currentState = window.history.state || {}
    window.history.pushState({
      ...currentState,
      idx: Number(currentState.idx || 0) + 1,
      key: `route-race-${id}-${Date.now()}`,
    }, '', `/projects/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
  }, nextProjectId)
}

async function expectRaceProjectBOnly(page: Page, label: string) {
  const root = page.locator(`[data-sl-project-state="READY"][data-sl-project-id="${raceB.project.id}"]`)
  await expect(root, `${label}: B root`).toHaveCount(1)
  await expect(page.locator(`[data-sl-project-id="${raceA.project.id}"]`), `${label}: no A root`).toHaveCount(0)
  await expect(page.getByRole('heading', { name: raceB.project.name })).toBeVisible()

  const evidenceChecks = page.getByLabel('项目下一步证据检查')
  const repoText = evidenceChecks.getByText(raceB.repoLabel, { exact: true })
  await expect(repoText, `${label}: unique B repository in evidence checks`).toHaveCount(1)
  await expect(repoText).toBeVisible()

  const cockpitStatus = page.locator('.sl-project-cockpit-status')
  const scanText = cockpitStatus.getByText(`knowledge source #${raceB.scan.id}`, { exact: true })
  await expect(scanText, `${label}: unique B scan in cockpit status`).toHaveCount(1)
  await expect(scanText).toBeVisible()

  const activeOverviewLanguage = page.locator('.ant-tabs-tabpane-active .sl-language-meta')
    .getByText(raceB.language, { exact: true })
  await expect(activeOverviewLanguage, `${label}: unique B language in active overview`).toHaveCount(1)
  await expect(activeOverviewLanguage).toBeVisible()

  const projectFlow = page.getByLabel('项目主链路状态')
  const flowText = await projectFlow.innerText()
  expect(flowText, `${label}: B code detail`).toContain(raceB.chunkTotal.toLocaleString())
  expect(flowText, `${label}: no A code detail`).not.toContain(raceA.chunkTotal.toLocaleString())

  const pageText = await page.locator('.sl-page-inner').innerText()
  expect(pageText, `${label}: B project text`).toContain(raceB.project.name)
  expect(pageText, `${label}: B repository text`).toContain(raceB.repoLabel)
  expect(pageText, `${label}: B scan id`).toContain(`#${raceB.scan.id}`)
  expect(pageText, `${label}: B preview detail`).toContain(raceB.language)
  expect(pageText, `${label}: no A project text`).not.toContain(raceA.project.name)
  expect(pageText, `${label}: no A repository text`).not.toContain(raceA.repoLabel)
  expect(pageText, `${label}: no A scan id`).not.toContain(`#${raceA.scan.id}`)
  expect(pageText, `${label}: no A preview detail`).not.toContain(raceA.language)
}

async function settleReleasedResponses(page: Page) {
  await page.waitForTimeout(100)
}

const checked = { initial: 0, fatal: 0, sixState: 0, stale: 0, routeRace: 0 }
let hadTestFailure = false

test.afterEach(({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    hadTestFailure = true
  }
})

test.afterAll(() => {
  const fullMatrixComplete = checked.initial === viewportMatrix.length
    && checked.fatal === viewportMatrix.length * 3
    && checked.sixState === viewportMatrix.length * workspaceScenarios.length
    && checked.stale === viewportMatrix.length
    && checked.routeRace === 1
  if (hadTestFailure || !fullMatrixComplete) return

  console.log('PROJECT_DETAIL_FIRST_VIEWPORT_STATE_SMOKE_OK', JSON.stringify({
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    initialChecked: checked.initial,
    fatalChecked: checked.fatal,
    sixStateChecked: checked.sixState,
    staleChecked: checked.stale,
    routeRaceChecked: checked.routeRace,
    realApi: false,
    db: false,
    overclaim: false,
  }))
})

for (const viewport of viewportMatrix) {
  test(`ProjectDetail first viewport state truth on ${viewport.name}`, async ({ context }) => {
    const viewportLabel = `${viewport.width}x${viewport.height}`

    const initialPage = await context.newPage()
    await initialPage.setViewportSize(viewport)
    const initialIssues = installRuntimeGuards(initialPage)
    const initialNetwork = await installMocks(initialPage, { mode: 'initial', scenario: 'ready' })
    await initialPage.goto(`/projects/${projectId}`)
    await expectInitialLoadingContract(initialPage, viewportLabel)
    expect(initialNetwork.unhandledApiRequests).toEqual([])
    expect(initialIssues).toEqual([])
    checked.initial += 1
    await initialPage.close()

    for (const fatalSource of ['project', 'repos', 'scans'] as const) {
      const fatalPage = await context.newPage()
      await fatalPage.setViewportSize(viewport)
      const fatalIssues = installRuntimeGuards(fatalPage)
      const fatalNetwork = await installMocks(fatalPage, { mode: 'fatal', fatalSource, scenario: 'ready' })
      await fatalPage.goto(`/projects/${projectId}?fatal=${fatalSource}`)
      await expectFatalContract(fatalPage, viewport, `${fatalSource}:${viewportLabel}`)
      expect(fatalNetwork.requestCounts[fatalSource], `${fatalSource}:${viewportLabel} must exercise the failed source`).toBeGreaterThan(0)
      expect(fatalNetwork.unhandledApiRequests).toEqual([])
      expect(fatalIssues).toEqual([])
      checked.fatal += 1
      await fatalPage.close()
    }

    const readyPage = await context.newPage()
    await readyPage.setViewportSize(viewport)
    const readyIssues = installRuntimeGuards(readyPage)
    const controls: MockControls = { mode: 'ready', scenario: 'no-repo' }
    const readyNetwork = await installMocks(readyPage, controls)

    for (const scenario of workspaceScenarios) {
      controls.scenario = scenario.scenario
      await readyPage.goto(`/projects/${projectId}?workspace=${scenario.scenario}`)
      await expectReadyContract(readyPage, viewport, scenario)
      expect(readyNetwork.unhandledApiRequests, `${scenario.scenario}:${viewportLabel} unhandled API`).toEqual([])
      expect(readyIssues, `${scenario.scenario}:${viewportLabel} runtime issues`).toEqual([])
      checked.sixState += 1
    }
    await readyPage.close()
  })

  test(`ProjectDetail stale refresh preserves trusted first viewport on ${viewport.name}`, async ({ page }) => {
    const viewportLabel = `${viewport.width}x${viewport.height}`
    await page.setViewportSize(viewport)
    const issues = installRuntimeGuards(page)
    const controls: MockControls = { mode: 'ready', scenario: 'ready' }
    const network = await installMocks(page, controls)

    await page.goto(`/projects/${projectId}?stale=${viewport.name}`)
    await expect(page.locator(`[data-sl-project-state="READY"][data-sl-project-id="${projectId}"]`)).toHaveCount(1)
    await expect(page.getByRole('heading', { name: project.name })).toBeVisible()
    await expect(page.getByLabel('项目下一步行动')).toHaveAttribute('data-sl-action-key', 'OPEN_QA')

    const coreCountsBefore = Object.fromEntries(
      (['project', 'repos', 'scans'] as const).map(source => [source, network.requestCounts[source] || 0]),
    ) as Record<CoreSource, number>
    controls.mode = 'fatal'
    controls.failAllCore = true
    const refreshAll = page.getByRole('button', { name: '刷新项目、仓库、扫描和总览数据' })
    await expect(refreshAll).toBeVisible()
    await refreshAll.evaluate(element => (element as HTMLButtonElement).click())

    await expectStaleRefreshContract(page, viewport, `stale-refresh:${viewportLabel}`)
    for (const source of ['project', 'repos', 'scans'] as const) {
      expect(network.requestCounts[source], `${source}:${viewportLabel} stale refresh request`).toBeGreaterThan(coreCountsBefore[source])
    }
    expect(network.unhandledApiRequests, `${viewportLabel}: stale unhandled API`).toEqual([])
    expect(issues, `${viewportLabel}: stale runtime issues`).toEqual([])
    checked.stale += 1
  })
}

test('ProjectDetail ignores delayed A core and detail responses after client-side switch to B', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const issues = installRuntimeGuards(page)
  const controls: { delayKind: RaceDelayKind } = { delayKind: 'core' }
  const network = await installRaceMocks(page, controls)

  await page.goto(`/projects/${raceA.project.id}`)
  await expect.poll(
    () => new Set(network.delayed.core.map(item => item.label)).size,
    { message: 'A project/repos/scans core responses must all be delayed' },
  ).toBe(3)

  await navigateClientSide(page, raceB.project.id)
  await expectRaceProjectBOnly(page, 'core-race:before-release')
  expect(await network.release('core'), 'core-race: released A responses').toBeGreaterThanOrEqual(3)
  await settleReleasedResponses(page)
  await expectRaceProjectBOnly(page, 'core-race:after-release')

  controls.delayKind = 'code-chunks'
  await navigateClientSide(page, raceA.project.id)
  await expect(page.locator(`[data-sl-project-state="READY"][data-sl-project-id="${raceA.project.id}"]`)).toHaveCount(1)
  await expect(page.getByRole('heading', { name: raceA.project.name })).toBeVisible()
  await expect.poll(
    () => network.delayed.codeChunks.length,
    { message: 'A code-chunks response must be delayed' },
  ).toBeGreaterThanOrEqual(1)

  await navigateClientSide(page, raceB.project.id)
  await expectRaceProjectBOnly(page, 'code-chunks-race:before-release')
  expect(await network.release('codeChunks'), 'code-chunks-race: released A responses').toBeGreaterThanOrEqual(1)
  await settleReleasedResponses(page)
  await expectRaceProjectBOnly(page, 'code-chunks-race:after-release')

  controls.delayKind = 'previews'
  await navigateClientSide(page, raceA.project.id)
  await expect(page.locator(`[data-sl-project-state="READY"][data-sl-project-id="${raceA.project.id}"]`)).toHaveCount(1)
  await expect(page.getByRole('heading', { name: raceA.project.name })).toBeVisible()
  await expect.poll(
    () => new Set(network.delayed.previews.map(item => item.label)).size,
    { message: 'A report and overview artifact previews must both be delayed' },
  ).toBe(2)

  await navigateClientSide(page, raceB.project.id)
  await expectRaceProjectBOnly(page, 'preview-race:before-release')
  expect(await network.release('previews'), 'preview-race: released A responses').toBeGreaterThanOrEqual(2)
  await settleReleasedResponses(page)
  await expectRaceProjectBOnly(page, 'preview-race:after-release')

  expect(network.delayed.core).toEqual([])
  expect(network.delayed.codeChunks).toEqual([])
  expect(network.delayed.previews).toEqual([])
  expect(network.unhandledApiRequests).toEqual([])
  expect(issues).toEqual([])
  checked.routeRace += 1
})
