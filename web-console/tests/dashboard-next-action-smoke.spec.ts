import { expect, test, type Page, type Route } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { inflateSync } from 'node:zlib'

type RuntimeIssue = {
  type: string
  message: string
}

type DashboardCase = {
  key: string
  title: string
  primaryLabel: string
  primaryUrl: RegExp
  secondaryLabel?: string
  secondaryUrl?: RegExp
  blocker?: string
  commandDisabledReasons?: string[]
  stats: Record<string, unknown>
  scans: Record<string, unknown>[]
  failStats?: boolean
  legacyStatsWithoutApiSignals?: boolean
}

type VisualEvidence = {
  caseKey: string
  viewport: string
  screenshot: string
  artifact?: string
  screenshotBytes: number
  screenshotWidth: number
  screenshotHeight: number
  distinctColorCount: number
  panelTop: number
  panelLeft: number
  panelRight: number
  panelBottom: number
  titleTop: number
  titleBottom: number
  primaryButtonTop: number
  primaryButtonBottom: number
  primaryButtonTextColor: string
  scrollY: number
  primaryActionCount: number
}

type DashboardProductPlaneProof = {
  caseKey: string
  viewport: string
  visible: boolean
  planeCount: number
  expectedColumns: number
  actualColumns: number
  expectedColumnsHonored: boolean
  copyReadable: boolean
  actionCount: number
  rbacCompleteClaim: boolean
  productionDeploymentClaim: boolean
}

type DashboardExecutiveBriefingProof = {
  caseKey: string
  viewport: string
  signalCount: number
  expectedColumns: number
  actualColumns: number
  expectedColumnsHonored: boolean
  copyReadable: boolean
  projectActionAbsent: boolean
  p0GatePassedClaim: boolean
  vtsrMeasuredClaim: boolean
  trustedAgentLoopCompleteClaim: boolean
  productionReadyClaim: boolean
}

type ScanReportRoutePlaneProof = {
  source: 'dashboardHandoff' | 'directLoad'
  viewport: string
  topbarTitle: '扫描报告'
  plane: '前台体验'
  pageHeading: '仓库逆向分析报告'
  selectedMenuKey: '/projects'
  selectedMenuLabel: '项目与仓库'
  selectedMenuSurface: 'desktopSider' | 'mobileDrawer'
  mobileDrawerSelected: boolean
  horizontalOverflow: number
}

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'tabletPortrait', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]
const scanReportDirectLoadViewports = viewportMatrix.filter(viewport => ['desktop', 'mobile', 'narrow'].includes(viewport.name))

const baseStats = {
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
  latestTotalFiles: 128,
  latestTotalLines: 18_420,
  latestTotalDirs: 22,
  latestControllers: 8,
  latestServices: 14,
  latestRiskCount: 0,
  latestCodeChunks: 640,
  latestEmbeddedChunks: 512,
  languagesJson: JSON.stringify([{ name: 'Java', file_count: 96, line_count: 15_000 }]),
}

function numericStat(stats: Record<string, unknown>, key: string) {
  const value = stats[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function hasNumericStat(stats: Record<string, unknown>, key: string) {
  const value = stats[key]
  return typeof value === 'number' && Number.isFinite(value)
}

function withDashboardApiSignals(stats: Record<string, unknown>) {
  const activeScans = numericStat(stats, 'runningScans') + numericStat(stats, 'pendingScans')
  const riskCount = numericStat(stats, 'latestRiskCount')
  const repositoryReady = numericStat(stats, 'repositoryCount') > 0
  const scanReady = activeScans === 0 && numericStat(stats, 'successScans') > 0
  const latestAnalysisReady = hasNumericStat(stats, 'latestTotalFiles')
  const latestCodeChunks = numericStat(stats, 'latestCodeChunks')
  const codeKnowledgeReady = latestCodeChunks > 0
  const nextStepReady = codeKnowledgeReady || riskCount > 0
  const readyStages = [repositoryReady, scanReady, codeKnowledgeReady, nextStepReady]
    .filter(Boolean)
    .length
  const trustedLoopCompletionRate = Math.round((readyStages * 100) / 4)
  const trustedLoopStatus = trustedLoopCompletionRate >= 100 && riskCount === 0
    ? 'ready'
    : trustedLoopCompletionRate >= 50
      ? 'warning'
      : 'idle'

  return {
    ...stats,
    trustedLoopCompletionRate,
    trustedLoopStatus,
    trustedLoopStatusLabel: trustedLoopStatus === 'ready' ? '闭环可用' : trustedLoopStatus === 'warning' ? '需要复核' : '等待启动',
    trustedLoopReadyStages: readyStages,
    trustedLoopTotalStages: 4,
    reportEvidenceReady: numericStat(stats, 'successScans') > 0,
    codeQaReadiness: codeKnowledgeReady ? 'READY' : latestAnalysisReady ? 'REVIEW' : 'GAP',
    recoverySignal: activeScans > 0 ? 'RUNNING' : riskCount > 0 ? 'RISK' : 'OK',
    trustedLoopMetricsSource: 'API',
  }
}

function paethPredictor(left: number, up: number, upLeft: number) {
  const estimate = left + up - upLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upLeftDistance = Math.abs(estimate - upLeft)

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
    return left
  }
  if (upDistance <= upLeftDistance) {
    return up
  }
  return upLeft
}

function inspectPngPixels(buffer: Buffer) {
  expect(buffer.subarray(0, 8).toString('hex'), 'screenshot must be a PNG image').toBe('89504e470d0a1a0a')

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idatChunks: Buffer[] = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }
  }

  expect(width, 'screenshot PNG width must be present').toBeGreaterThan(0)
  expect(height, 'screenshot PNG height must be present').toBeGreaterThan(0)
  expect(bitDepth, 'screenshot PNG must use 8-bit channels').toBe(8)
  expect([2, 6], 'screenshot PNG must be RGB or RGBA').toContain(colorType)

  const bytesPerPixel = colorType === 6 ? 4 : 3
  const stride = width * bytesPerPixel
  const inflated = inflateSync(Buffer.concat(idatChunks))
  let inputOffset = 0
  let previous = Buffer.alloc(stride)
  const colors = new Set<string>()

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset]
    inputOffset += 1
    const current = Buffer.alloc(stride)
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[inputOffset]
      inputOffset += 1
      const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0
      const up = previous[x] || 0
      const upLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0
      let value = raw

      if (filter === 1) {
        value = raw + left
      } else if (filter === 2) {
        value = raw + up
      } else if (filter === 3) {
        value = raw + Math.floor((left + up) / 2)
      } else if (filter === 4) {
        value = raw + paethPredictor(left, up, upLeft)
      } else {
        expect(filter, 'screenshot PNG filter must be supported').toBe(0)
      }
      current[x] = value & 0xff
    }
    for (let x = 0; x < stride; x += bytesPerPixel) {
      colors.add(`${current[x]},${current[x + 1]},${current[x + 2]}`)
      if (colors.size >= 64) {
        break
      }
    }
    if (colors.size >= 64) {
      break
    }
    previous = current
  }

  return {
    screenshotWidth: width,
    screenshotHeight: height,
    distinctColorCount: colors.size,
  }
}

async function writeReleaseEvidenceScreenshotArtifact(screenshotName: string, screenshot: Buffer) {
  const artifactDir = process.env.SOURCELENS_DASHBOARD_NEXT_ACTION_UI_ARTIFACT_DIR
  if (!artifactDir) {
    return undefined
  }

  await mkdir(artifactDir, { recursive: true, mode: 0o700 })
  await writeFile(path.join(artifactDir, screenshotName), screenshot, { mode: 0o600 })
  return `dashboard-next-action-ui-smoke/${screenshotName}`
}

const successScan = {
  id: 24,
  projectId: 14,
  projectName: 'Pawnshop Management',
  repositoryId: 7,
  repositoryName: 'Pawnshop-Management-System',
  branch: 'main',
  commitSha: 'abc1234567890',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  createdAt: '2026-06-30T10:00:00Z',
  startedAt: '2026-06-30T10:00:10Z',
  finishedAt: '2026-06-30T10:02:00Z',
  durationMs: 110_000,
  errorMessage: null,
}

const cases: DashboardCase[] = [
  {
    key: 'recover-dashboard',
    title: '恢复仪表盘数据',
    primaryLabel: '重试加载',
    primaryUrl: /\/dashboard$/,
    secondaryLabel: '打开审计',
    secondaryUrl: /\/audit-logs$/,
    blocker: '仪表盘 API 返回异常或网络不可达',
    commandDisabledReasons: [
      '需要先接入可扫描仓库，代码问答才能获得项目和 code_chunks 上下文。',
      '需要先完成一次成功扫描并生成报告，自动修复才能绑定证据和目标文件。',
    ],
    failStats: true,
    stats: baseStats,
    scans: [successScan],
  },
  {
    key: 'connect-repository',
    title: '接入第一个公开仓库',
    primaryLabel: '接入仓库',
    primaryUrl: /\/projects$/,
    blocker: '缺少可扫描仓库',
    commandDisabledReasons: [
      '需要先接入可扫描仓库，代码问答才能获得项目和 code_chunks 上下文。',
      '需要先完成一次成功扫描并生成报告，自动修复才能绑定证据和目标文件。',
    ],
    stats: {
      ...baseStats,
      projectCount: 0,
      repositoryCount: 0,
      totalScans: 0,
      successScans: 0,
      latestTotalFiles: null,
      latestTotalLines: null,
      latestTotalDirs: null,
      latestControllers: null,
      latestServices: null,
      latestRiskCount: null,
      latestCodeChunks: null,
      latestEmbeddedChunks: null,
      languagesJson: null,
    },
    scans: [],
  },
  {
    key: 'watch-running-scan',
    title: '跟踪运行中的扫描任务',
    primaryLabel: '查看任务',
    primaryUrl: /\/execution-tasks$/,
    secondaryLabel: '刷新状态',
    secondaryUrl: /\/dashboard$/,
    blocker: '等待扫描完成后才能复盘报告',
    stats: {
      ...baseStats,
      totalScans: 2,
      successScans: 1,
      runningScans: 1,
    },
    scans: [{ ...successScan, id: 25, status: 'RUNNING', finishedAt: null, durationMs: null }, successScan],
  },
  {
    key: 'start-first-scan',
    title: '触发一次仓库扫描',
    primaryLabel: '打开项目',
    primaryUrl: /\/projects$/,
    blocker: '缺少成功扫描记录',
    commandDisabledReasons: [
      '需要先完成一次成功扫描并生成报告，自动修复才能绑定证据和目标文件。',
    ],
    stats: {
      ...baseStats,
      totalScans: 1,
      successScans: 0,
      failedScans: 1,
      latestTotalFiles: null,
      latestTotalLines: null,
      latestTotalDirs: null,
      latestControllers: null,
      latestServices: null,
      latestRiskCount: null,
      latestCodeChunks: null,
      latestEmbeddedChunks: null,
    },
    scans: [{ ...successScan, id: 26, status: 'FAILED', errorMessage: 'clone failed' }],
  },
  {
    key: 'inspect-code-chunks',
    title: '检查 code_chunks 生成状态',
    primaryLabel: '打开扫描详情',
    primaryUrl: /\/scan-tasks\/24$/,
    secondaryLabel: '查看产物',
    secondaryUrl: /\/artifacts$/,
    blocker: 'code_chunks 为 0，QA 和证据抽屉质量不足',
    stats: {
      ...baseStats,
      latestRiskCount: 0,
      latestCodeChunks: 0,
      latestEmbeddedChunks: 0,
    },
    scans: [successScan],
  },
  {
    key: 'review-risk-report',
    title: '复盘风险证据并生成修复候选',
    primaryLabel: '打开报告',
    primaryUrl: /\/scan-tasks\/24$/,
    secondaryLabel: '生成候选',
    secondaryUrl: /\/auto-repairs\?projectId=14&repositoryId=7&openCreate=1&source=/,
    stats: {
      ...baseStats,
      latestRiskCount: 3,
      latestCodeChunks: 640,
      latestEmbeddedChunks: 512,
    },
    scans: [successScan],
  },
  {
    key: 'ask-code-qa',
    title: '进入代码问答复盘主链路',
    primaryLabel: '进入 QA',
    primaryUrl: /\/agent-chat\?handoff=code-understanding&source=DASHBOARD_CODE_QA_ENTRY&/,
    secondaryLabel: '打开报告',
    secondaryUrl: /\/scan-tasks\/24$/,
    stats: {
      ...baseStats,
      latestRiskCount: 0,
      latestCodeChunks: 640,
      latestEmbeddedChunks: 512,
    },
    scans: [successScan],
  },
]

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

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.text().includes('findDOMNode') && message.text().includes('deprecated')) return
    if (/Failed to load resource: the server responded with a status of (400|403)/.test(message.text())) return
    issues.push({ type: 'console.error', message: message.text() })
  })
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', message: error.message })
  })
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.pathname.startsWith('/api/') && response.status() >= 500 && response.status() !== 599) {
      issues.push({ type: 'api.5xx', message: `${response.request().method()} ${url.pathname}${url.search}: ${response.status()}` })
    }
  })

  return issues
}

const project = {
  id: 14,
  name: 'Pawnshop Management',
  description: 'Mocked dashboard project',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 90,
  createdBy: 1,
  createdAt: '2026-06-30T10:00:00Z',
}

const repository = {
  id: 7,
  projectId: 14,
  provider: 'GITHUB',
  owner: 'LJunP',
  name: 'Pawnshop-Management-System',
  url: 'https://github.com/LJunP/Pawnshop-Management-System.git',
  defaultBranch: 'main',
  visibility: 'PUBLIC',
  authType: 'NONE',
  status: 'ACTIVE',
  createdAt: '2026-06-30T10:00:00Z',
}

const emptyPage = { items: [], page: 1, pageSize: 20, total: 0 }
let dashboardMocksPage: Page | null = null
let activeDashboardCase: DashboardCase | null = null
let activeUnhandledApiRequests: string[] | null = null

test.setTimeout(120_000)

function executionDetail(sourceId = 24) {
  return {
    task: {
      id: 900 + sourceId,
      projectId: 14,
      repositoryId: 7,
      taskType: 'SCAN_REPOSITORY',
      sourceType: 'SCAN_TASK',
      sourceId,
      status: 'SUCCESS',
      currentStep: 'complete',
      currentAttemptId: 1,
      progress: 100,
      errorMessage: null,
      createdBy: 1,
      startedAt: '2026-06-30T10:00:10Z',
      finishedAt: '2026-06-30T10:02:00Z',
      createdAt: '2026-06-30T10:00:00Z',
      updatedAt: '2026-06-30T10:02:00Z',
    },
    attempts: [],
    steps: [],
    logs: [],
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
  return overflow
}

async function assertDashboardVisualContract(
  page: Page,
  dashboardCase: DashboardCase,
  viewport: { width: number; height: number },
) {
  const panel = page.locator('section[aria-label="继承产品运行建议（非项目任务）"]')
  const title = panel.locator('.sl-dashboard-next-title')
  const primaryButton = panel.getByRole('button', { name: dashboardCase.primaryLabel })

  await expect(panel, `${dashboardCase.key}:${viewport.width}x${viewport.height} recommended panel`).toHaveCount(1)
  await expect(panel).toBeVisible()
  await expect(title).toBeVisible()
  await expect(primaryButton).toBeVisible()

  const [scrollY, panelInHero, primaryActionCount] = await Promise.all([
    page.evaluate(() => window.scrollY),
    panel.evaluate(element => element.parentElement?.classList.contains('sl-dashboard-hero-main') === true),
    page.locator('.sl-page .ant-btn-primary').count(),
  ])
  expect(scrollY, `${dashboardCase.key}:${viewport.width}x${viewport.height} must be verified at initial scroll position`).toBe(0)
  expect(panelInHero, `${dashboardCase.key}:${viewport.width}x${viewport.height} recommended panel must live inside the hero`).toBe(true)
  expect(primaryActionCount, `${dashboardCase.key}:${viewport.width}x${viewport.height} must expose exactly one primary action`).toBe(1)
  await expect(page.locator('.sl-page .ant-btn-primary')).toHaveText(dashboardCase.primaryLabel)

  const [panelBox, titleBox, buttonBox, primaryButtonTextColor] = await Promise.all([
    panel.boundingBox(),
    title.boundingBox(),
    primaryButton.boundingBox(),
    primaryButton.evaluate(element => getComputedStyle(element).color),
  ])

  expect(panelBox, `${dashboardCase.key}:${viewport.width}x${viewport.height} panel must have a visible box`).not.toBeNull()
  expect(titleBox, `${dashboardCase.key}:${viewport.width}x${viewport.height} title must have a visible box`).not.toBeNull()
  expect(buttonBox, `${dashboardCase.key}:${viewport.width}x${viewport.height} primary button must have a visible box`).not.toBeNull()

  const safePanelBox = panelBox!
  const safeTitleBox = titleBox!
  const safeButtonBox = buttonBox!

  expect(safePanelBox.y, `${dashboardCase.key}:${viewport.width}x${viewport.height} panel must not be clipped above viewport`).toBeGreaterThanOrEqual(0)
  expect(safeTitleBox.y, `${dashboardCase.key}:${viewport.width}x${viewport.height} title must not be clipped above viewport`).toBeGreaterThanOrEqual(0)
  expect(safeButtonBox.y, `${dashboardCase.key}:${viewport.width}x${viewport.height} primary button must not be clipped above viewport`).toBeGreaterThanOrEqual(0)
  expect(safePanelBox.x, `${dashboardCase.key}:${viewport.width}x${viewport.height} panel must not be clipped left of viewport`).toBeGreaterThanOrEqual(0)
  expect(safePanelBox.x + safePanelBox.width, `${dashboardCase.key}:${viewport.width}x${viewport.height} panel must not be clipped right of viewport`).toBeLessThanOrEqual(viewport.width)
  expect(safeTitleBox.y + safeTitleBox.height, `${dashboardCase.key}:${viewport.width}x${viewport.height} title must be visible in first viewport`).toBeLessThanOrEqual(viewport.height)
  expect(safeButtonBox.y + safeButtonBox.height, `${dashboardCase.key}:${viewport.width}x${viewport.height} primary button must be visible in first viewport`).toBeLessThanOrEqual(viewport.height)
  expect(primaryButtonTextColor, `${dashboardCase.key}:${viewport.width}x${viewport.height} primary button must keep readable white text`).toBe('rgb(255, 255, 255)')

  return {
    panelTop: Math.round(safePanelBox.y),
    panelLeft: Math.round(safePanelBox.x),
    panelRight: Math.round(safePanelBox.x + safePanelBox.width),
    panelBottom: Math.round(safePanelBox.y + safePanelBox.height),
    titleTop: Math.round(safeTitleBox.y),
    titleBottom: Math.round(safeTitleBox.y + safeTitleBox.height),
    primaryButtonTop: Math.round(safeButtonBox.y),
    primaryButtonBottom: Math.round(safeButtonBox.y + safeButtonBox.height),
    primaryButtonTextColor,
    scrollY,
    primaryActionCount,
  }
}

async function captureDashboardVisualEvidence(
  page: Page,
  dashboardCase: DashboardCase,
  viewport: { width: number; height: number },
): Promise<VisualEvidence> {
  const visual = await assertDashboardVisualContract(page, dashboardCase, viewport)
  const viewportLabel = `${viewport.width}x${viewport.height}`
  const screenshotName = `dashboard-next-action-${dashboardCase.key}-${viewportLabel}.png`
  const screenshotPath = test.info().outputPath(screenshotName)
  const screenshot = await page.screenshot({ path: screenshotPath, fullPage: false })

  expect(
    screenshot.length,
    `${dashboardCase.key}:${viewportLabel} screenshot must contain non-trivial visual evidence`,
  ).toBeGreaterThan(viewport.width <= 360 ? 5_000 : 20_000)
  const pixelEvidence = inspectPngPixels(screenshot)
  expect(pixelEvidence.screenshotWidth, `${dashboardCase.key}:${viewportLabel} screenshot width must match viewport`).toBe(viewport.width)
  expect(pixelEvidence.screenshotHeight, `${dashboardCase.key}:${viewportLabel} screenshot height must match viewport`).toBe(viewport.height)
  expect(pixelEvidence.distinctColorCount, `${dashboardCase.key}:${viewportLabel} screenshot must not be blank or near-empty`).toBeGreaterThanOrEqual(16)
  const artifact = await writeReleaseEvidenceScreenshotArtifact(screenshotName, screenshot)

  await test.info().attach(screenshotName, {
    path: screenshotPath,
    contentType: 'image/png',
  })

  return {
    caseKey: dashboardCase.key,
    viewport: viewportLabel,
    screenshot: screenshotName,
    artifact,
    screenshotBytes: screenshot.length,
    ...pixelEvidence,
    ...visual,
  }
}

async function installDashboardMocks(page: Page, dashboardCase: DashboardCase) {
  const unhandledApiRequests: string[] = []
  activeDashboardCase = dashboardCase
  activeUnhandledApiRequests = unhandledApiRequests

  if (dashboardMocksPage === page) {
    return { unhandledApiRequests }
  }

  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'dashboard-next-action-smoke-token')
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

    const currentCase = activeDashboardCase
    if (!currentCase) {
      activeUnhandledApiRequests?.push(`${method} ${path}${url.search}`)
      await route.fulfill({
        status: 599,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(result(null)),
      })
      return
    }

    if (method === 'GET' && path === '/api/auth/me') {
      await fulfillJson(route, result({ id: 1, username: 'dashboard_smoke', email: 'smoke@local.test', status: 'ACTIVE' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({
        items: currentCase.stats.repositoryCount ? [project] : [],
        page: 1,
        pageSize: 100,
        total: currentCase.stats.repositoryCount ? 1 : 0,
      }))
      return
    }

    if (method === 'GET' && path === '/api/dashboard/stats') {
      if (currentCase.failStats) {
        await fulfillJson(route, { code: 'BAD_REQUEST', message: 'mock dashboard failure', data: null }, 400)
        return
      }
      await fulfillJson(route, result(currentCase.legacyStatsWithoutApiSignals
        ? currentCase.stats
        : withDashboardApiSignals(currentCase.stats)))
      return
    }

    if (method === 'GET' && path === '/api/dashboard/recent-scans') {
      await fulfillJson(route, result(currentCase.scans))
      return
    }

    if (method === 'GET' && path === '/api/projects/14') {
      await fulfillJson(route, result(project))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/repositories') {
      await fulfillJson(route, result([repository]))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/scan-tasks') {
      await fulfillJson(route, result({ items: currentCase.scans, page: 1, pageSize: 20, total: currentCase.scans.length }))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/execution-tasks') {
      await fulfillJson(route, result(emptyPage))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/conversations') {
      await fulfillJson(route, result(emptyPage))
      return
    }

    if (method === 'POST' && path === '/api/projects/14/conversations') {
      await fulfillJson(route, result({
        id: 724,
        projectId: 14,
        agentTaskId: null,
        title: 'Dashboard code QA handoff',
        systemPrompt: null,
        status: 'ACTIVE',
        createdBy: 1,
        createdAt: '2026-06-30T10:00:00Z',
        updatedAt: '2026-06-30T10:00:00Z',
      }))
      return
    }

    if (method === 'GET' && path.startsWith('/api/projects/14/execution-tasks/source/SCAN_TASK/')) {
      const sourceId = Number(path.split('/').pop() || 24)
      await fulfillJson(route, result(executionDetail(sourceId)))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/artifacts') {
      await fulfillJson(route, result([]))
      return
    }

    if (method === 'GET' && path.startsWith('/api/scan-tasks/')) {
      const taskId = Number(path.split('/').pop() || 24)
      const scan = currentCase.scans.find(item => item.id === taskId) || successScan
      await fulfillJson(route, result(scan))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/scan-tasks/24/governance-timeline') {
      await fulfillJson(route, result({
        projectId: 14,
        repositoryId: 7,
        scanTaskId: 24,
        scanStatus: 'SUCCESS',
        generatedAt: '2026-06-30T10:03:00Z',
        summary: { status: 'SUCCESS', counts: {}, hasErrors: false, attributionGapCount: 0 },
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

    if (method === 'GET' && path === '/api/projects/14/audit-logs') {
      await fulfillJson(route, result(emptyPage))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/agent-tool-calls') {
      await fulfillJson(route, result(emptyPage))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/github-webhook-deliveries') {
      await fulfillJson(route, result(emptyPage))
      return
    }

    if (method === 'GET' && path === '/api/projects/14/auto-repairs') {
      await fulfillJson(route, result([]))
      return
    }

    if (method === 'GET' && (path === '/api/projects/14/code-chunks/search' || path === '/api/projects/14/code-chunks/status')) {
      await fulfillJson(route, result({
        scanTaskId: Number(url.searchParams.get('scanTaskId') || 24),
        query: url.searchParams.get('query') || '',
        limit: Number(url.searchParams.get('limit') || 1),
        total: 1,
        resultCount: 1,
        totalChunks: 640,
        embeddedChunks: 512,
        truncated: false,
        retrievalMode: 'HYBRID',
        evidenceProfile: {
          readiness: 'READY',
          confidence: 88,
          summary: 'Dashboard smoke QA preview has scan-bound code chunk evidence.',
          nextAction: 'Review QA answer evidence.',
          details: [],
          uniqueFiles: 1,
          embeddedEvidenceCount: 1,
          lowConfidenceCount: 0,
          topScore: 88,
          averageScore: 88,
          lineSpan: 24,
          dominantEvidenceType: 'SERVICE',
          evidenceTypeStats: [{ type: 'SERVICE', count: 1 }],
          fileStats: [{ filePath: 'src/main/java/demo/PawnService.java', count: 1, bestScore: 88 }],
        },
        items: [{
          id: 8801,
          scanTaskId: Number(url.searchParams.get('scanTaskId') || 24),
          filePath: 'src/main/java/demo/PawnService.java',
          startLine: 12,
          endLine: 36,
          content: 'class PawnService { void review() {} }',
          contentPreview: 'class PawnService { void review() {} }',
          hasEmbedding: true,
          matchedTerms: ['PawnService'],
          relevanceScore: 88,
          evidenceType: 'SERVICE',
          evidenceReason: 'Mock scan-bound QA evidence.',
          contextRole: 'PRIMARY',
          contextDistance: 0,
        }],
      }))
      return
    }

    activeUnhandledApiRequests?.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(result(null)),
    })
  })
  dashboardMocksPage = page

  return { unhandledApiRequests }
}

async function assertNextAction(page: Page, dashboardCase: DashboardCase, viewportName: string) {
  await page.goto('/dashboard')
  const northStar = page.locator('.sl-dashboard-north-star')
  await expect(northStar).toBeVisible()
  await expect(northStar).toContainText('Verified Task Success Rate')
  await expect(northStar).toContainText('Not measured')
  await expect(northStar.locator('.sl-dashboard-north-star-step')).toHaveCount(4)
  await expect(northStar.locator('.sl-dashboard-metrics-source')).toHaveText(dashboardCase.failStats ? 'client fallback' : 'API-backed metrics')
  await expect(page.locator('[aria-label="SourceLens 北极星指标和产品信号"]')).toBeVisible()
  await expect(page.locator('.sl-dashboard-product-metric')).toHaveCount(4)
  await expect(page.locator('.sl-dashboard-product-metric').first()).toContainText(dashboardCase.failStats ? 'client fallback' : 'API-backed metrics')
  const productPlaneProof = await assertDashboardProductPlaneMap(page, dashboardCase, viewportName)
  const executiveBriefingProof = await assertDashboardExecutiveBriefing(page, dashboardCase, viewportName)

  const panel = page.locator('section[aria-label="继承产品运行建议（非项目任务）"]')
  await expect(panel).toBeVisible()
  await expect(panel.locator('.sl-dashboard-next-title')).toHaveText(dashboardCase.title)
  await expect(panel.getByRole('button', { name: dashboardCase.primaryLabel })).toBeVisible()
  await expect(panel.locator('[aria-label="主链路证据成熟度"]')).toBeVisible()
  await assertDashboardVisualContract(page, dashboardCase, page.viewportSize()!)

  if (dashboardCase.secondaryLabel) {
    const secondaryButton = panel.getByRole('button', { name: dashboardCase.secondaryLabel })
    await expect(secondaryButton).toBeVisible()
    await expect(secondaryButton).not.toHaveClass(/ant-btn-primary/)
  }

  const evidenceItems = panel.locator('.sl-dashboard-next-evidence-item')
  await expect(evidenceItems).toHaveCount(4)

  if (dashboardCase.blocker) {
    await expect(panel.locator('[aria-label="当前阻塞项"]')).toContainText(dashboardCase.blocker)
  }

  const commandPanel = page.locator('section[aria-label="继承产品操作面板（非项目任务）"]')
  await expect(commandPanel).toBeVisible()
  await expect(commandPanel).toContainText('不生成 AIOS 开发任务')
  await expect(commandPanel).toContainText('不改变 P0-05 的唯一优先级')
  const disabledReasonNotes = commandPanel.locator('.sl-dashboard-command-disabled-reason')
  if (dashboardCase.commandDisabledReasons?.length) {
    await expect(disabledReasonNotes).toHaveCount(dashboardCase.commandDisabledReasons.length)
    for (const reason of dashboardCase.commandDisabledReasons) {
      const reasonNode = disabledReasonNotes.filter({ hasText: reason })
      await expect(reasonNode).toBeVisible()
      const reasonBox = await reasonNode.boundingBox()
      expect(reasonBox, `${dashboardCase.key}:${viewportName} disabled command reason must have layout box`).not.toBeNull()
      expect(reasonBox?.width || 0, `${dashboardCase.key}:${viewportName} disabled command reason width must stay within viewport`).toBeLessThanOrEqual(page.viewportSize()!.width)
      const reasonStyles = await reasonNode.evaluate(element => {
        const styles = getComputedStyle(element)
        return {
          overflow: styles.overflow,
          overflowWrap: styles.overflowWrap,
          textOverflow: styles.textOverflow,
          whiteSpace: styles.whiteSpace,
        }
      })
      expect(reasonStyles.overflow, `${dashboardCase.key}:${viewportName} disabled command reason must not hide overflow`).toBe('visible')
      expect(reasonStyles.overflowWrap, `${dashboardCase.key}:${viewportName} disabled command reason must wrap long evidence text`).toBe('anywhere')
      expect(reasonStyles.textOverflow, `${dashboardCase.key}:${viewportName} disabled command reason must not use ellipsis`).toBe('clip')
      expect(reasonStyles.whiteSpace, `${dashboardCase.key}:${viewportName} disabled command reason must allow wrapping`).toBe('normal')
    }
  } else {
    await expect(disabledReasonNotes).toHaveCount(0)
  }

  const primaryButton = panel.locator('.ant-btn-primary').first()
  await expect(primaryButton).toBeVisible()
  const primaryTextColor = await primaryButton.evaluate(element => getComputedStyle(element).color)
  expect(primaryTextColor, `${dashboardCase.key}:${viewportName} primary button text must remain readable`).toBe('rgb(255, 255, 255)')

  await expectNoHorizontalOverflow(page, `${dashboardCase.key}:${viewportName}`)

  return { productPlaneProof, executiveBriefingProof }
}

async function assertDashboardExecutiveBriefing(
  page: Page,
  dashboardCase: DashboardCase,
  viewportName: string,
): Promise<DashboardExecutiveBriefingProof> {
  const region = page.getByRole('region', { name: '管理层决策简报' })
  await expect(region, `${dashboardCase.key}:${viewportName}:executive-briefing`).toBeVisible()
  await expect(region).toContainText('阶段进度')
  await expect(region).toContainText('继承链路状态')
  await expect(region).toContainText('风险阻塞')
  await expect(region).toContainText('当前项目任务')
  await expect(region).toContainText('P0-05 Baseline Slicing')
  await expect(region).toContainText('P0 Gate: NOT_READY')
  await expect(region).toContainText('不证明 P0 Gate 已通过')
  await expect(region).toContainText('VTSR 已测量')
  await expect(region).toContainText('可信 Agent 闭环已实现')
  await expect(region).toContainText('系统达到生产可用')

  const signals = region.locator('[data-sl-dashboard-executive-signal]')
  await expect(signals).toHaveCount(4)

  const viewport = page.viewportSize()
  const expectedColumns = (viewport?.width || 0) <= 720 ? 1 : (viewport?.width || 0) <= 1200 ? 2 : 4
  const actualColumns = await region.locator('.sl-dashboard-executive-grid').evaluate(element => {
    const value = window.getComputedStyle(element).gridTemplateColumns.trim()
    return value ? value.split(/\s+/).length : 0
  })
  expect(actualColumns, `${dashboardCase.key}:${viewportName}:executive briefing columns`).toBe(expectedColumns)

  const copyReadable = await region.locator(
    '.sl-dashboard-executive-head h2, .sl-dashboard-executive-head p, .sl-dashboard-executive-card span, .sl-dashboard-executive-card strong, .sl-dashboard-executive-card p',
  ).evaluateAll(elements => elements.every(element => {
    const style = window.getComputedStyle(element)
    return style.overflow === 'visible'
      && style.textOverflow === 'clip'
      && style.whiteSpace === 'normal'
      && ['anywhere', 'break-word'].includes(style.overflowWrap)
  }))
  expect(copyReadable, `${dashboardCase.key}:${viewportName}:executive briefing copy must wrap without clipping`).toBe(true)

  await expect(region.getByRole('button'), `${dashboardCase.key}:${viewportName}:executive briefing must not expose inherited product actions`).toHaveCount(0)
  const projectActionAbsent = await region.getByRole('button').count() === 0

  const text = await region.innerText()
  const p0GatePassedClaim = /P0 Gate (?:状态[:：]\s*)?(?:PASS|READY)|P0 Gate 已正式通过/.test(text)
  const vtsrMeasuredClaim = /VTSR[:：]\s*\d|Verified Task Success Rate[:：]\s*\d/.test(text)
  const trustedAgentLoopCompleteClaim = /可信 Agent 闭环已完成|可信软件工程 Agent 已实现/.test(text)
  const productionReadyClaim = /生产可用[:：]\s*(?:是|READY)|已达到生产可用/.test(text)
  expect(p0GatePassedClaim, `${dashboardCase.key}:${viewportName}:must not claim the P0 gate passed`).toBe(false)
  expect(vtsrMeasuredClaim, `${dashboardCase.key}:${viewportName}:must not claim VTSR is measured`).toBe(false)
  expect(trustedAgentLoopCompleteClaim, `${dashboardCase.key}:${viewportName}:must not claim the trusted Agent loop is complete`).toBe(false)
  expect(productionReadyClaim, `${dashboardCase.key}:${viewportName}:must not claim production readiness`).toBe(false)

  return {
    caseKey: dashboardCase.key,
    viewport: `${viewport?.width || 0}x${viewport?.height || 0}`,
    signalCount: 4,
    expectedColumns,
    actualColumns,
    expectedColumnsHonored: actualColumns === expectedColumns,
    copyReadable,
    projectActionAbsent,
    p0GatePassedClaim,
    vtsrMeasuredClaim,
    trustedAgentLoopCompleteClaim,
    productionReadyClaim,
  }
}

async function assertDashboardProductPlaneMap(
  page: Page,
  dashboardCase: DashboardCase,
  viewportName: string,
): Promise<DashboardProductPlaneProof> {
  const region = page.getByRole('region', { name: '继承产品三平面（P0冻结）' })
  await expect(region, `${dashboardCase.key}:${viewportName}:product-plane-map`).toBeVisible()
  await expect(region).toContainText('继承产品界面（P0冻结）')
  await expect(region).toContainText('不定义 AIOS 当前产品路线、开发任务或阶段投入')
  await expect(region).toContainText('前台体验')
  await expect(region).toContainText('开发者控制台')
  await expect(region).toContainText('后台治理')
  await expect(region).toContainText('后台治理不等于 RBAC、多租户或生产部署已完成')

  const expectedKeys = ['front-office', 'developer-console', 'back-office']
  const cards = region.locator('[data-sl-dashboard-plane]')
  await expect(cards).toHaveCount(expectedKeys.length)
  for (const key of expectedKeys) {
    await expect(region.locator(`[data-sl-dashboard-plane="${key}"]`), `${dashboardCase.key}:${viewportName}:${key}`).toBeVisible()
  }

  const viewport = page.viewportSize()
  const expectedColumns = (viewport?.width || 0) <= 720 ? 1 : (viewport?.width || 0) <= 1200 ? 2 : 3
  const actualColumns = await region.locator('.sl-dashboard-product-plane-grid').evaluate(element => {
    const value = window.getComputedStyle(element).gridTemplateColumns.trim()
    return value ? value.split(/\s+/).length : 0
  })
  expect(actualColumns, `${dashboardCase.key}:${viewportName}:product plane columns`).toBe(expectedColumns)

  const copyReadable = await region.locator(
    '.sl-dashboard-product-plane-head h2, .sl-dashboard-product-plane-head p, .sl-dashboard-product-plane-card-head span, .sl-dashboard-product-plane-card-head strong, .sl-dashboard-product-plane-card p, .sl-dashboard-product-plane-pages span',
  ).evaluateAll(elements => elements.every(element => {
    const style = window.getComputedStyle(element)
    return style.overflow === 'visible'
      && style.textOverflow === 'clip'
      && style.whiteSpace === 'normal'
      && ['anywhere', 'break-word'].includes(style.overflowWrap)
  }))
  expect(copyReadable, `${dashboardCase.key}:${viewportName}:product plane copy must wrap without clipping`).toBe(true)

  const actionCount = await region.getByRole('button').count()
  expect(actionCount, `${dashboardCase.key}:${viewportName}:product plane actions`).toBe(3)

  const text = await region.innerText()
  const rbacCompleteClaim = /RBAC 已完成|权限隔离已完成|多租户已完成/.test(text)
  const productionDeploymentClaim = /已完成生产部署|生产部署已完成并可上线|商业化体系已完成|灾备恢复已完成/.test(text)
  expect(rbacCompleteClaim, `${dashboardCase.key}:${viewportName}:must not claim RBAC or multi-tenant completion`).toBe(false)
  expect(productionDeploymentClaim, `${dashboardCase.key}:${viewportName}:must not claim production readiness completion`).toBe(false)

  return {
    caseKey: dashboardCase.key,
    viewport: `${viewport?.width || 0}x${viewport?.height || 0}`,
    visible: true,
    planeCount: expectedKeys.length,
    expectedColumns,
    actualColumns,
    expectedColumnsHonored: actualColumns === expectedColumns,
    copyReadable,
    actionCount,
    rbacCompleteClaim,
    productionDeploymentClaim,
  }
}

async function assertScanReportRoutePlane(
  page: Page,
  source: ScanReportRoutePlaneProof['source'],
  viewportName: string,
): Promise<ScanReportRoutePlaneProof> {
  await expect(page.locator('.sl-topbar-title'), `${source}:${viewportName} topbar title`).toHaveText('扫描报告')
  await expect(page.locator('.sl-topbar-plane'), `${source}:${viewportName} product plane`).toHaveText('前台体验')
  await expect(page.getByRole('heading', { name: '仓库逆向分析报告' }), `${source}:${viewportName} page H1`).toBeVisible()

  const viewport = page.viewportSize()
  expect(viewport, `${source}:${viewportName} must expose a viewport`).not.toBeNull()
  const isMobile = viewport!.width <= 720
  let selectedMenu = page.locator('.sl-sider .ant-menu-item-selected')

  if (isMobile) {
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    const drawer = page.locator('.sl-mobile-nav')
    await expect(drawer, `${source}:${viewportName} mobile drawer`).toBeVisible()
    selectedMenu = drawer.locator('.ant-menu-item-selected')
  }

  await expect(selectedMenu, `${source}:${viewportName} must expose one selected parent menu item`).toHaveCount(1)
  await expect(selectedMenu, `${source}:${viewportName} selected menu key /projects`).toContainText('项目与仓库')
  const horizontalOverflow = await expectNoHorizontalOverflow(page, `${source}:${viewportName}:scan-report-route-plane`)

  if (isMobile) {
    await page.keyboard.press('Escape')
    await expect(page.locator('.sl-mobile-nav')).not.toBeVisible()
  }

  return {
    source,
    viewport: `${viewport!.width}x${viewport!.height}`,
    topbarTitle: '扫描报告',
    plane: '前台体验',
    pageHeading: '仓库逆向分析报告',
    selectedMenuKey: '/projects',
    selectedMenuLabel: '项目与仓库',
    selectedMenuSurface: isMobile ? 'mobileDrawer' : 'desktopSider',
    mobileDrawerSelected: isMobile,
    horizontalOverflow,
  }
}

async function clickNextActionAndAssertUrl(
  page: Page,
  dashboardCase: DashboardCase,
  label: string,
  expectedUrl: RegExp,
  viewportName: string,
): Promise<ScanReportRoutePlaneProof | null> {
  const panel = page.locator('section[aria-label="继承产品运行建议（非项目任务）"]')
  await panel.getByRole('button', { name: label }).click()
  await expect(page).toHaveURL(expectedUrl)
  const scanReportProof = label === '打开报告'
    ? await assertScanReportRoutePlane(page, 'dashboardHandoff', viewportName)
    : null
  await page.goto('/dashboard')
  return scanReportProof
}

async function assertLegacyStatsFallback(page: Page) {
  const legacyCase: DashboardCase = {
    key: 'legacy-stats-without-api-fields',
    title: '进入代码问答复盘主链路',
    primaryLabel: '进入 QA',
    primaryUrl: /\/agent-chat\?handoff=code-understanding&source=DASHBOARD_CODE_QA_ENTRY&/,
    secondaryLabel: '打开报告',
    secondaryUrl: /\/scan-tasks\/24$/,
    stats: baseStats,
    scans: [successScan],
    legacyStatsWithoutApiSignals: true,
  }
  const network = await installDashboardMocks(page, legacyCase)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard')
  const northStar = page.locator('.sl-dashboard-north-star')
  await expect(northStar).toBeVisible()
  await expect(northStar.locator('.sl-dashboard-metrics-source')).toHaveText('client fallback')
  await expect(page.locator('.sl-dashboard-product-metric').first()).toContainText('client fallback')
  await expect(page.locator('section[aria-label="继承产品运行建议（非项目任务）"] .sl-dashboard-next-title')).toHaveText(legacyCase.title)
  await expectNoHorizontalOverflow(page, 'legacy-stats-without-api-fields:390x844')
  expect(network.unhandledApiRequests, 'legacy stats fallback must use mocked API only').toEqual([])
  return legacyCase.key
}

test('Dashboard next action panel maps pipeline states without backend dependencies', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const visitedCases: string[] = []
  const visualEvidence: VisualEvidence[] = []
  const productPlaneProofs: DashboardProductPlaneProof[] = []
  const executiveBriefingProofs: DashboardExecutiveBriefingProof[] = []
  const scanReportDashboardHandoffProofs: ScanReportRoutePlaneProof[] = []
  const scanReportDirectLoadProofs: ScanReportRoutePlaneProof[] = []
  const baseURLHost = new URL(test.info().project.use.baseURL || 'http://127.0.0.1').hostname || '127.0.0.1'

  for (const dashboardCase of cases) {
    const network = await installDashboardMocks(page, dashboardCase)
    for (const viewport of viewportMatrix) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const dashboardProof = await assertNextAction(page, dashboardCase, viewport.name)
      productPlaneProofs.push(dashboardProof.productPlaneProof)
      executiveBriefingProofs.push(dashboardProof.executiveBriefingProof)
      if (dashboardCase.key === 'review-risk-report') {
        visualEvidence.push(await captureDashboardVisualEvidence(page, dashboardCase, viewport))
      }
      const primaryScanReportProof = await clickNextActionAndAssertUrl(page, dashboardCase, dashboardCase.primaryLabel, dashboardCase.primaryUrl, viewport.name)
      if (primaryScanReportProof) scanReportDashboardHandoffProofs.push(primaryScanReportProof)
      if (dashboardCase.secondaryLabel && dashboardCase.secondaryUrl) {
        const secondaryScanReportProof = await clickNextActionAndAssertUrl(page, dashboardCase, dashboardCase.secondaryLabel, dashboardCase.secondaryUrl, viewport.name)
        if (secondaryScanReportProof) scanReportDashboardHandoffProofs.push(secondaryScanReportProof)
      }
      visitedCases.push(`${dashboardCase.key}:${viewport.width}x${viewport.height}`)
    }
    expect(network.unhandledApiRequests, `Every /api request must be mocked for ${dashboardCase.key}.`).toEqual([])
  }

  const routePlaneCase = cases.find(dashboardCase => dashboardCase.key === 'review-risk-report')!
  const routePlaneNetwork = await installDashboardMocks(page, routePlaneCase)
  for (const viewport of scanReportDirectLoadViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/scan-tasks/24')
    scanReportDirectLoadProofs.push(await assertScanReportRoutePlane(page, 'directLoad', viewport.name))
  }
  expect(routePlaneNetwork.unhandledApiRequests, 'Every /api request must be mocked for direct scan report route-plane loads.').toEqual([])

  const legacyStatsFallbackCase = await assertLegacyStatsFallback(page)

  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  expect(visualEvidence).toHaveLength(viewportMatrix.length)
  expect(
    productPlaneProofs.every(proof => proof.actionCount === 3),
    'Every product plane proof must retain exactly three actions.',
  ).toBe(true)
  expect(scanReportDashboardHandoffProofs.length, 'Dashboard 打开报告 must verify the report landing identity across its viewport matrix.').toBeGreaterThanOrEqual(viewportMatrix.length)
  expect(scanReportDirectLoadProofs, 'Direct scan report loads must cover 1440, 390 and 320.').toHaveLength(scanReportDirectLoadViewports.length)

  const scanReportRoutePlaneProofs = [...scanReportDashboardHandoffProofs, ...scanReportDirectLoadProofs]
  console.log('INHERITED_SCAN_REPORT_ROUTE_PLANE_HANDOFF_OK', JSON.stringify({
    dashboardHandoff: scanReportDashboardHandoffProofs,
    directLoad: scanReportDirectLoadProofs,
    topbarTitle: '扫描报告',
    plane: '前台体验',
    selectedMenuKey: '/projects',
    mobileDrawerSelected: scanReportRoutePlaneProofs
      .filter(proof => proof.selectedMenuSurface === 'mobileDrawer')
      .every(proof => proof.mobileDrawerSelected),
    viewports: scanReportDirectLoadViewports.map(viewport => `${viewport.width}x${viewport.height}`),
    runtimeIssues: issues.length,
    horizontalOverflow: scanReportRoutePlaneProofs.every(proof => proof.horizontalOverflow <= 1),
  }))

  console.log('DASHBOARD_NEXT_ACTION_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    cases: cases.map(dashboardCase => dashboardCase.key),
    nextActions: cases.map(dashboardCase => dashboardCase.title),
    commandDisabledReasonCases: cases
      .filter(dashboardCase => dashboardCase.commandDisabledReasons?.length)
      .map(dashboardCase => dashboardCase.key),
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    visitedCases,
    dashboardStatsApiSignals: {
      sourceLabelSelector: '.sl-dashboard-metrics-source',
      apiBackedCases: cases.filter(dashboardCase => !dashboardCase.failStats).map(dashboardCase => dashboardCase.key),
      fallbackCases: cases.filter(dashboardCase => dashboardCase.failStats).map(dashboardCase => dashboardCase.key),
      legacyStatsFallbackCase,
    },
    productPlaneMap: {
      scope: 'DASHBOARD_THREE_PLANE_PRODUCT_STRUCTURE_READABILITY',
      surface: 'FRONT_OFFICE_DEVELOPER_CONSOLE_BACK_OFFICE',
      visible: productPlaneProofs.every(proof => proof.visible),
      planeCount: 3,
      expectedColumnsHonored: productPlaneProofs.every(proof => proof.expectedColumnsHonored),
      desktopColumns: productPlaneProofs.some(proof => proof.viewport === '1440x900' && proof.actualColumns === 3),
      tabletColumns: productPlaneProofs.some(proof => proof.viewport === '1024x768' && proof.actualColumns === 2),
      tabletPortraitColumns: productPlaneProofs.some(proof => proof.viewport === '768x1024' && proof.actualColumns === 2),
      mobileColumns: productPlaneProofs.some(proof => proof.viewport === '390x844' && proof.actualColumns === 1),
      narrowColumns: productPlaneProofs.some(proof => proof.viewport === '320x740' && proof.actualColumns === 1),
      copyReadable: productPlaneProofs.every(proof => proof.copyReadable),
      actionCount: 3,
      rbacCompleteClaim: productPlaneProofs.some(proof => proof.rbacCompleteClaim),
      productionDeploymentClaim: productPlaneProofs.some(proof => proof.productionDeploymentClaim),
      proofs: productPlaneProofs,
    },
    executiveBriefing: {
      scope: 'DASHBOARD_EXECUTIVE_BRIEFING_DECISION_READABILITY',
      signals: ['阶段进度', '继承链路状态', '风险阻塞', '当前项目任务'],
      signalCount: 4,
      expectedColumnsHonored: executiveBriefingProofs.every(proof => proof.expectedColumnsHonored),
      desktopColumns: executiveBriefingProofs.some(proof => proof.viewport === '1440x900' && proof.actualColumns === 4),
      tabletColumns: executiveBriefingProofs.some(proof => proof.viewport === '1024x768' && proof.actualColumns === 2),
      tabletPortraitColumns: executiveBriefingProofs.some(proof => proof.viewport === '768x1024' && proof.actualColumns === 2),
      mobileColumns: executiveBriefingProofs.some(proof => proof.viewport === '390x844' && proof.actualColumns === 1),
      narrowColumns: executiveBriefingProofs.some(proof => proof.viewport === '320x740' && proof.actualColumns === 1),
      copyReadable: executiveBriefingProofs.every(proof => proof.copyReadable),
      projectActionAbsent: executiveBriefingProofs.every(proof => proof.projectActionAbsent),
      p0GatePassedClaim: executiveBriefingProofs.some(proof => proof.p0GatePassedClaim),
      vtsrMeasuredClaim: executiveBriefingProofs.some(proof => proof.vtsrMeasuredClaim),
      trustedAgentLoopCompleteClaim: executiveBriefingProofs.some(proof => proof.trustedAgentLoopCompleteClaim),
      productionReadyClaim: executiveBriefingProofs.some(proof => proof.productionReadyClaim),
      proofs: executiveBriefingProofs,
    },
    visualEvidence,
    baseURLHost,
    spec: 'dashboard-next-action-smoke.spec.ts',
  }))
})
