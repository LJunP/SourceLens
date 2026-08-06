import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type RouteCase = {
  path: string
  topbarTitle: string
  topbarPlane: '前台体验' | '开发者控制台' | '后台治理'
  pageHeading: string | RegExp
  requiresPrimaryButton?: boolean
  selectedMenuKey?: '/projects'
  selectedMenuLabel?: '项目与仓库'
}

type WorkPerspective = 'workbench' | 'governance' | 'admin_security'

type WorkPerspectiveCase = {
  value: WorkPerspective
  label: '开发工作台' | '工程治理' | '平台管理与安全'
  home: '/dashboard' | '/execution-tasks' | '/audit-logs'
  menuItems: string[]
}

type SelectedMenuProof = {
  route: string
  viewport: string
  selectedMenuKey: '/projects'
  selectedMenuLabel: '项目与仓库'
  surface: 'desktopSider' | 'mobileDrawer'
  mobileDrawerSelected: boolean
}

const projectId = 1
const conversationId = 77
const scanTaskId = 901
const workPerspectiveStorageKeyPrefix = 'sourcelens.work-view.v1.user.'
const workPerspectiveBoundary = '仅调整导航与默认首页，不改变访问权限'

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]
const mobileNavigationViewports = viewportMatrix.filter(viewport => viewport.name === 'mobile' || viewport.name === 'narrow')
const compactPlaneViewports = [
  { name: 'compactBoundary', width: 960, height: 800 },
  { name: 'tabletPortrait', width: 768, height: 1024 },
  ...mobileNavigationViewports,
]

const workPerspectiveViewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'desktopCompact', width: 1024, height: 768 },
  { name: 'tabletPortrait', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const workPerspectiveCases: WorkPerspectiveCase[] = [
  {
    value: 'workbench',
    label: '开发工作台',
    home: '/dashboard',
    menuItems: ['工程智能首页', '项目与仓库', '代码问答', 'Issue 拆解', '修复候选'],
  },
  {
    value: 'governance',
    label: '工程治理',
    home: '/execution-tasks',
    menuItems: ['执行任务', '运行产物', 'Agent 任务', 'CI 诊断', 'PR 审查'],
  },
  {
    value: 'admin_security',
    label: '平台管理与安全',
    home: '/audit-logs',
    menuItems: ['审计日志', '模型配置'],
  },
]

const routeCases: RouteCase[] = [
  { path: '/dashboard', topbarTitle: '工程智能首页', topbarPlane: '前台体验', pageHeading: '工程智能首页', requiresPrimaryButton: true },
  { path: '/projects', topbarTitle: '项目与仓库', topbarPlane: '前台体验', pageHeading: '项目与仓库入口', requiresPrimaryButton: true },
  { path: `/projects/${projectId}`, topbarTitle: '项目与仓库', topbarPlane: '前台体验', pageHeading: 'App Shell Smoke Project', requiresPrimaryButton: true },
  { path: `/scan-tasks/${scanTaskId}`, topbarTitle: '扫描报告', topbarPlane: '前台体验', pageHeading: '仓库逆向分析报告', selectedMenuKey: '/projects', selectedMenuLabel: '项目与仓库' },
  { path: `/execution-tasks?projectId=${projectId}`, topbarTitle: '执行任务中心', topbarPlane: '开发者控制台', pageHeading: '执行任务中心' },
  { path: `/artifacts?projectId=${projectId}`, topbarTitle: '运行产物库', topbarPlane: '开发者控制台', pageHeading: '运行产物证据中心' },
  { path: `/agent-tasks?projectId=${projectId}`, topbarTitle: 'Agent 任务', topbarPlane: '开发者控制台', pageHeading: 'Agent 辅助理解任务', requiresPrimaryButton: true },
  { path: '/agent-chat', topbarTitle: '代码问答', topbarPlane: '前台体验', pageHeading: '代码理解会话', requiresPrimaryButton: true },
  { path: `/auto-repairs?projectId=${projectId}`, topbarTitle: '修复候选', topbarPlane: '前台体验', pageHeading: '受控代码补丁生成', requiresPrimaryButton: true },
  { path: `/issue-decomposition?projectId=${projectId}`, topbarTitle: 'Issue 拆解', topbarPlane: '前台体验', pageHeading: 'Issue 拆解与交付计划', requiresPrimaryButton: true },
  { path: `/ci-diagnostics?projectId=${projectId}`, topbarTitle: 'CI 诊断', topbarPlane: '开发者控制台', pageHeading: 'CI 诊断与修复入口', requiresPrimaryButton: true },
  { path: `/pr-reviews?projectId=${projectId}`, topbarTitle: 'PR 审查', topbarPlane: '开发者控制台', pageHeading: 'PR 风险审查与合并决策', requiresPrimaryButton: true },
  { path: `/audit-logs?projectId=${projectId}`, topbarTitle: '审计日志', topbarPlane: '后台治理', pageHeading: '审计日志与安全治理' },
  { path: '/model-config', topbarTitle: '模型配置', topbarPlane: '后台治理', pageHeading: '模型配置与密钥边界', requiresPrimaryButton: true },
]

const pageHeadingSelector = '.sl-page h1, .sl-page .sl-dashboard-title, .sl-page .sl-model-title, .sl-page .sl-audit-title'
const coreStatusLineSelector = [
  '.sl-dashboard-status',
  '.sl-project-cockpit-status',
  '.sl-scan-status-line',
  '.sl-graph-status-line',
  '.sl-execution-status-line',
  '.sl-agent-status-line',
  '.sl-artifact-cockpit-status',
  '.sl-audit-status-line',
  '.sl-ci-status-line',
  '.sl-pr-status-line',
  '.sl-issue-status-line',
  '.sl-autorepair-status-line',
].join(', ')
const readableWhite = 'rgb(255, 255, 255)'
const readableDisabledOnDark = ['rgba(255, 255, 255, 0.68)', 'rgb(226, 232, 240)', 'rgba(226, 232, 240, 1)', 'rgba(226, 232, 240, 0.996)']
const clipTolerancePx = 2

const project = {
  id: projectId,
  name: 'App Shell Smoke Project',
  description: 'Mocked project for app shell UI smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 91,
  createdBy: 1,
  createdAt: '2026-06-30T10:00:00Z',
}

const conversation = {
  id: conversationId,
  projectId,
  agentTaskId: null,
  title: 'App Shell Smoke Conversation',
  systemPrompt: null,
  status: 'ACTIVE',
  createdBy: 1,
  createdAt: '2026-06-30T10:00:00Z',
  updatedAt: '2026-06-30T10:01:00Z',
}

const modelConfig = {
  id: 1001,
  provider: 'OPENAI',
  modelName: 'gpt-4o-mini',
  apiKey: 'sk-***-mocked',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.2,
  maxTokens: 4096,
  isActive: true,
  createdAt: '2026-06-30T10:00:00Z',
  updatedAt: '2026-06-30T10:00:00Z',
}

const recentScan = {
  id: 501,
  projectId,
  projectName: 'App Shell Smoke Project With Long Name For Dashboard Table Containment',
  repositoryId: 301,
  repositoryName: 'source-lens-dashboard-recent-scan-table-long-repository-name',
  branch: 'feature/dashboard-table-scroller-containment-proof',
  commitSha: 'abcdef1234567890',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  createdAt: '2026-06-30T10:00:00Z',
  startedAt: '2026-06-30T10:00:10Z',
  finishedAt: '2026-06-30T10:02:10Z',
  durationMs: 120000,
  errorMessage: null,
}

const repository = {
  id: 301,
  projectId,
  provider: 'GITHUB',
  owner: 'source-lens-app-shell-smoke-owner-with-long-name',
  name: 'project-detail-repository-table-long-repository-name',
  url: 'https://github.com/source-lens-app-shell-smoke-owner-with-long-name/project-detail-repository-table-long-repository-name.git',
  defaultBranch: 'main',
  visibility: 'PUBLIC',
  authType: 'NONE',
  status: 'ACTIVE',
  createdAt: '2026-06-30T10:00:00Z',
}

const scanTask = {
  id: scanTaskId,
  projectId,
  repositoryId: repository.id,
  branch: 'feature/project-detail-workflow-table-scroller-containment-proof',
  commitSha: 'abcdef1234567890',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-06-30T10:00:10Z',
  finishedAt: '2026-06-30T10:02:10Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-06-30T10:00:00Z',
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
    // Ant Design/rc-util still emits findDOMNode warnings under React StrictMode in dev.
    /findDOMNode/,
  ]

  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) {
      const text = message.text()
      if (ignoredConsolePatterns.some(pattern => pattern.test(text))) {
        return
      }
      issues.push({ type: message.type(), message: text })
    }
  })

  page.on('pageerror', error => {
    issues.push({ type: 'pageerror', message: error.message })
  })

  return issues
}

async function installAppShellMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const controls = { userId: 1 }

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'app-shell-ui-smoke-token')
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
      await fulfillJson(route, result({ id: controls.userId, username: `app_shell_ui_smoke_user_${controls.userId}`, email: `smoke-${controls.userId}@local.test` }))
      return
    }

    if (method === 'GET' && path === '/api/dashboard/stats') {
      await fulfillJson(route, result({
        projectCount: 1,
        repositoryCount: 1,
        totalScans: 2,
        successScans: 1,
        failedScans: 0,
        runningScans: 0,
        pendingScans: 0,
        agentTaskCount: 1,
        agentTaskRunning: 0,
        agentTaskCompleted: 1,
        issueCount: 0,
        issueCompleted: 0,
        latestTotalFiles: 128,
        latestTotalLines: 18420,
        latestTotalDirs: 22,
        latestControllers: 8,
        latestServices: 14,
        latestRiskCount: 1,
        latestCodeChunks: 640,
        latestEmbeddedChunks: 512,
        languagesJson: JSON.stringify([{ name: 'Java', file_count: 96, line_count: 15000 }]),
      }))
      return
    }

    if (method === 'GET' && path === '/api/dashboard/recent-scans') {
      await fulfillJson(route, result([recentScan]))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}`) {
      await fulfillJson(route, result(project))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/repositories`) {
      await fulfillJson(route, result([repository]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks`) {
      await fulfillJson(route, result({ items: [scanTask], page: 1, pageSize: 20, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/scan-tasks/${scanTaskId}`) {
      await fulfillJson(route, result(scanTask))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/SCAN_TASK/${scanTaskId}`) {
      await fulfillJson(route, result(null))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`) {
      await fulfillJson(route, result({
        projectId,
        repositoryId: repository.id,
        scanTaskId,
        scanStatus: scanTask.status,
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

    if (method === 'GET' && (path === `/api/projects/${projectId}/code-chunks/search` || path === `/api/projects/${projectId}/code-chunks/status`)) {
      await fulfillJson(route, result({
        scanTaskId: scanTask.id,
        query: url.searchParams.get('query') || '',
        limit: Number(url.searchParams.get('limit') || 1),
        total: 0,
        resultCount: 0,
        totalChunks: 0,
        embeddedChunks: 0,
        truncated: false,
        retrievalMode: 'MOCKED_APP_SHELL_STATUS_PROBE',
        items: [],
      }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/conversations`) {
      await fulfillJson(route, result({ items: [conversation], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/conversations/${conversationId}`) {
      await fulfillJson(route, result({ conversation, messages: [] }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/audit-logs`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/agent-tool-calls`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/github-webhook-deliveries`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      await fulfillJson(route, result([]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/agent-tasks`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs`) {
      await fulfillJson(route, result([]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/issue-decompositions`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/ci-diagnostics`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/pr-reviews`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === '/api/llm-configs') {
      await fulfillJson(route, result([modelConfig]))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(result(null)),
    })
  })

  return { unhandledApiRequests, controls }
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

async function assertExpectedSelectedMenu(page: Page, routeCase: RouteCase, viewportName: string): Promise<SelectedMenuProof | null> {
  if (!routeCase.selectedMenuKey || !routeCase.selectedMenuLabel) return null

  const viewport = page.viewportSize()
  expect(viewport, `${routeCase.path}:${viewportName} must expose a viewport`).not.toBeNull()
  const isMobile = viewport!.width <= 720
  let selectedMenu = page.locator('.sl-sider .ant-menu-item-selected')

  if (isMobile) {
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    const drawer = page.locator('.sl-mobile-nav')
    await expect(drawer, `${routeCase.path}:${viewportName} mobile drawer`).toBeVisible()
    selectedMenu = drawer.locator('.ant-menu-item-selected')
  }

  await expect(selectedMenu, `${routeCase.path}:${viewportName} must expose one selected parent menu item`).toHaveCount(1)
  await expect(selectedMenu, `${routeCase.path}:${viewportName} selected menu must be ${routeCase.selectedMenuKey}`).toContainText(routeCase.selectedMenuLabel)

  if (isMobile) {
    await page.keyboard.press('Escape')
    await expect(page.locator('.sl-mobile-nav')).not.toBeVisible()
  }

  return {
    route: routeCase.path,
    viewport: `${viewport!.width}x${viewport!.height}`,
    selectedMenuKey: routeCase.selectedMenuKey,
    selectedMenuLabel: routeCase.selectedMenuLabel,
    surface: isMobile ? 'mobileDrawer' : 'desktopSider',
    mobileDrawerSelected: isMobile,
  }
}

async function expectTextNotClipped(page: Page, locatorSelector: string, label: string) {
  const locator = page.locator(locatorSelector).first()
  await expect(locator, `${label} must be visible before measuring clipping`).toBeVisible()
  await expectLocatorTextNotClipped(locator, label)
}

async function expectLocatorTextNotClipped(locator: Locator, label: string) {
  const metrics = await locator.evaluate(element => ({
    clientHeight: element.clientHeight,
    clientWidth: element.clientWidth,
    scrollHeight: element.scrollHeight,
    scrollWidth: element.scrollWidth,
    text: element.textContent?.trim() || '',
  }))

  expect(
    metrics.scrollWidth,
    `${label} text must not be horizontally clipped: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.clientWidth + clipTolerancePx)
  expect(
    metrics.scrollHeight,
    `${label} text must not be vertically clipped: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.clientHeight + clipTolerancePx)
}

async function expectBoxInsideViewport(page: Page, locatorSelector: string, label: string) {
  const box = await page.locator(locatorSelector).first().boundingBox()
  expect(box, `${label} must have a visible bounding box`).not.toBeNull()
  const safeBox = box!
  const viewport = page.viewportSize()
  expect(viewport, `${label} must have a viewport`).not.toBeNull()
  expect(safeBox.x, `${label} must not be clipped left`).toBeGreaterThanOrEqual(0)
  expect(safeBox.y, `${label} must not be clipped top`).toBeGreaterThanOrEqual(0)
  expect(safeBox.x + safeBox.width, `${label} must not be clipped right`).toBeLessThanOrEqual(viewport!.width)
  expect(safeBox.y + safeBox.height, `${label} must not be clipped bottom`).toBeLessThanOrEqual(viewport!.height)
}

async function expectBoxInsideContainer(page: Page, childSelector: string, containerSelector: string, label: string) {
  const [childBox, containerBox] = await Promise.all([
    page.locator(childSelector).first().boundingBox(),
    page.locator(containerSelector).first().boundingBox(),
  ])
  expect(childBox, `${label} child must have a visible bounding box`).not.toBeNull()
  expect(containerBox, `${label} container must have a visible bounding box`).not.toBeNull()
  const safeChildBox = childBox!
  const safeContainerBox = containerBox!
  const containerRight = safeContainerBox.x + safeContainerBox.width
  const containerBottom = safeContainerBox.y + safeContainerBox.height
  expect(safeChildBox.x, `${label} child must not escape container left`).toBeGreaterThanOrEqual(safeContainerBox.x)
  expect(safeChildBox.y, `${label} child must not escape container top`).toBeGreaterThanOrEqual(safeContainerBox.y)
  expect(safeChildBox.x + safeChildBox.width, `${label} child must not escape container right`).toBeLessThanOrEqual(containerRight)
  expect(safeChildBox.y + safeChildBox.height, `${label} child must not escape container bottom`).toBeLessThanOrEqual(containerBottom)
}

async function expectTopbarAndPageSeparated(page: Page, label: string) {
  await expectBoxInsideContainer(page, '.sl-topbar-title', '.sl-topbar', `${label}:topbar-title-contained`)
  if (await page.locator('.sl-topbar-desc').first().isVisible()) {
    await expectBoxInsideContainer(page, '.sl-topbar-desc', '.sl-topbar', `${label}:topbar-desc-contained`)
  }
  await expectBoxInsideContainer(page, '.sl-topbar-actions', '.sl-topbar', `${label}:topbar-actions-contained`)
  const topbarActionStyle = await page.locator('.sl-topbar-actions').first().evaluate(element => {
    const style = window.getComputedStyle(element)
    return {
      flexWrap: style.flexWrap,
      overflow: style.overflow,
    }
  })
  expect(topbarActionStyle.flexWrap, `${label} topbar actions must wrap instead of squeezing title text`).toBe('wrap')
  expect(topbarActionStyle.overflow, `${label} topbar actions must not clip actions`).not.toBe('hidden')

  const [topbarBox, pageBox, headingBox] = await Promise.all([
    page.locator('.sl-topbar').first().boundingBox(),
    page.locator('.sl-page').first().boundingBox(),
    page.locator('.sl-page h1, .sl-page .sl-dashboard-title, .sl-page .sl-model-title, .sl-page .sl-audit-title').first().boundingBox(),
  ])
  expect(topbarBox, `${label} topbar must have a visible bounding box`).not.toBeNull()
  expect(pageBox, `${label} page must have a visible bounding box`).not.toBeNull()
  expect(headingBox, `${label} page heading must have a visible bounding box`).not.toBeNull()

  const topbarBottom = topbarBox!.y + topbarBox!.height
  expect(pageBox!.y, `${label} page content must start after the adaptive topbar`).toBeGreaterThanOrEqual(topbarBottom - 1)
  expect(headingBox!.y, `${label} page heading must be visually separated from topbar`).toBeGreaterThanOrEqual(topbarBottom + 4)
}

async function expectPrimaryButtonsReadable(page: Page, label: string) {
  const primaryButtons = page.locator('.sl-page .ant-btn-primary:not([disabled]), .sl-page .ant-btn-color-primary.ant-btn-variant-solid:not([disabled])')
  const count = await primaryButtons.count()
  if (count === 0) {
    return 0
  }

  for (let index = 0; index < count; index += 1) {
    const button = primaryButtons.nth(index)
    const visible = await button.isVisible()
    if (!visible) continue
    await expectPaintWhite(button, `${label} primary button ${index}:root`)
    for (const childSelector of ['.sl-action-button-label', '.ant-btn-icon']) {
      const children = button.locator(childSelector)
      const childCount = await children.count()
      for (let childIndex = 0; childIndex < childCount; childIndex += 1) {
        const child = children.nth(childIndex)
        if (await child.isVisible()) {
          await expectPaintWhite(child, `${label} primary button ${index}:${childSelector}:${childIndex}`)
          if (childSelector === '.sl-action-button-label') {
            await expectLocatorTextNotClipped(child, `${label} primary button ${index}:${childSelector}:${childIndex}:text`)
          }
        }
      }
    }

    const svgPaintNodes = await button.locator('svg, svg *').evaluateAll(elements => {
      const paintTags = new Set(['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'use'])
      return elements
        .map((element, childIndex) => {
          const style = getComputedStyle(element)
          const tagName = element.tagName.toLowerCase()
          return {
            childIndex,
            color: style.color,
            display: style.display,
            fill: style.fill,
            opacity: style.opacity,
            stroke: style.stroke,
            tagName,
            textFillColor: style.webkitTextFillColor,
            visibility: style.visibility,
          }
        })
        .filter(node => {
          if (!paintTags.has(node.tagName)) return false
          if (node.display === 'none' || node.visibility === 'hidden' || node.opacity === '0') return false
          return node.tagName === 'svg' || node.fill !== 'none' || node.stroke !== 'none'
        })
    })
    for (const node of svgPaintNodes) {
      expect(node.color, `${label} primary button ${index}:svg:${node.tagName}:${node.childIndex} must keep readable white color`).toBe(readableWhite)
      expect(node.textFillColor, `${label} primary button ${index}:svg:${node.tagName}:${node.childIndex} must keep readable text fill`).toBe(readableWhite)
    }
  }
  return count
}

async function expectPaintWhite(locator: Locator, label: string) {
  const paint = await locator.evaluate(element => {
    const style = getComputedStyle(element)
    return {
      color: style.color,
      textFillColor: style.webkitTextFillColor,
    }
  })
  expect(paint.color, `${label} must keep readable white color`).toBe(readableWhite)
  expect(paint.textFillColor, `${label} must keep readable white text fill`).toBe(readableWhite)
}

async function expectProjectsTableScrollerContained(page: Page, label: string) {
  const table = page.locator('.sl-project-list-table').first()
  await expect(table, `${label}:project-table`).toBeVisible()
  const [tableBox, viewport] = await Promise.all([
    table.boundingBox(),
    page.viewportSize(),
  ])
  expect(tableBox, `${label}:project-table must have a visible bounding box`).not.toBeNull()
  expect(viewport, `${label}:viewport must be available`).not.toBeNull()
  expect(tableBox!.x, `${label}:project table must not escape viewport left`).toBeGreaterThanOrEqual(0)
  expect(tableBox!.x + tableBox!.width, `${label}:project table must not escape viewport right`).toBeLessThanOrEqual(viewport!.width)
  const tableScroller = page.locator('.sl-project-list-table .ant-table-content').first()
  await expect(tableScroller, `${label}:project-table-scroller`).toBeVisible()
  const overflowX = await tableScroller.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}:project table scroller must own horizontal overflow`).toBe(true)
  await expectNoHorizontalOverflow(page, `${label}:project-table-scroller`)
}

async function expectProjectsPortfolioLoopReadable(page: Page, label: string) {
  const loop = page.locator('.sl-project-portfolio-loop').first()
  await expect(loop, `${label}:projects-portfolio-loop`).toBeVisible()
  await expect(loop.getByRole('heading', { name: '项目组合可信接入闭环' }), `${label}:projects-portfolio-loop-heading`).toBeVisible()
  await expect(loop.locator('.sl-project-portfolio-step'), `${label}:projects-portfolio-step-count`).toHaveCount(4)
  for (const stepName of ['创建项目壳', '接入公开仓库', '生成扫描报告', '代码问答与修复']) {
    await expect(loop.getByText(stepName), `${label}:projects-portfolio-step:${stepName}`).toBeVisible()
  }
  const gridColumnCount = await loop.locator('.sl-project-portfolio-loop-grid').evaluate(element => {
    const columns = getComputedStyle(element).gridTemplateColumns
    if (columns === 'none') return 0
    return columns.split(' ').filter(Boolean).length
  })
  const viewportWidth = page.viewportSize()?.width || 0
  expect(
    gridColumnCount,
    `${label}:projects portfolio loop must use four columns on desktop and collapse to one column on mobile`
  ).toBe(viewportWidth <= 720 ? 1 : viewportWidth <= 1200 ? 2 : 4)
  const stepTitles = loop.locator('.sl-project-portfolio-step-copy strong')
  const stepCount = await stepTitles.count()
  for (let index = 0; index < stepCount; index += 1) {
    await expectLocatorTextNotClipped(stepTitles.nth(index), `${label}:projects-portfolio-title:${index}`)
  }
  await expectNoHorizontalOverflow(page, `${label}:projects-portfolio-loop`)
}

async function expectDashboardRecentTableScrollerContained(page: Page, label: string) {
  const table = page.locator('.sl-dashboard-recent-table').first()
  await expect(table, `${label}:dashboard-recent-table`).toBeVisible()
  await expect(table.getByText(recentScan.repositoryName).first(), `${label}:dashboard recent scan row`).toBeVisible()
  const [tableBox, viewport] = await Promise.all([
    table.boundingBox(),
    page.viewportSize(),
  ])
  expect(tableBox, `${label}:dashboard recent table must have a visible bounding box`).not.toBeNull()
  expect(viewport, `${label}:viewport must be available`).not.toBeNull()
  expect(tableBox!.x, `${label}:dashboard recent table must not escape viewport left`).toBeGreaterThanOrEqual(0)
  expect(tableBox!.x + tableBox!.width, `${label}:dashboard recent table must not escape viewport right`).toBeLessThanOrEqual(viewport!.width)
  const tableScroller = page.locator('.sl-dashboard-recent-table .ant-table-content').first()
  await expect(tableScroller, `${label}:dashboard-recent-table-scroller`).toBeVisible()
  const overflowX = await tableScroller.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}:dashboard recent table scroller must own horizontal overflow`).toBe(true)
  await expectNoHorizontalOverflow(page, `${label}:dashboard-recent-table-scroller`)
}

async function expectProjectDetailWorkflowTableScrollerContained(
  page: Page,
  tableSelector: string,
  expectedText: string,
  label: string,
) {
  const table = page.locator(tableSelector).first()
  await expect(table, `${label}:workflow-table`).toBeVisible()
  await expect(table.getByText(expectedText).first(), `${label}:workflow-row`).toBeVisible()
  const [tableBox, viewport] = await Promise.all([
    table.boundingBox(),
    page.viewportSize(),
  ])
  expect(tableBox, `${label}:workflow table must have a visible bounding box`).not.toBeNull()
  expect(viewport, `${label}:viewport must be available`).not.toBeNull()
  expect(tableBox!.x, `${label}:workflow table must not escape viewport left`).toBeGreaterThanOrEqual(0)
  expect(tableBox!.x + tableBox!.width, `${label}:workflow table must not escape viewport right`).toBeLessThanOrEqual(viewport!.width)
  const tableScroller = table.locator('.ant-table-content').first()
  await expect(tableScroller, `${label}:workflow-table-scroller`).toBeVisible()
  const overflowX = await tableScroller.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}:workflow table scroller must own horizontal overflow`).toBe(true)
  await expectNoHorizontalOverflow(page, `${label}:workflow-table-scroller`)
}

async function expectProjectDetailWorkflowTablesContained(page: Page, label: string) {
  await expectProjectTrustedLoopReadable(page, label)

  await page.getByRole('tab', { name: '仓库管理' }).click()
  await expectProjectDetailWorkflowTableScrollerContained(
    page,
    '.sl-project-repository-table',
    repository.name,
    `${label}:repository-table`,
  )

  await page.getByRole('tab', { name: '扫描任务' }).click()
  await expectProjectDetailWorkflowTableScrollerContained(
    page,
    '.sl-project-scan-table',
    scanTask.branch,
    `${label}:scan-table`,
  )
}

async function expectProjectTrustedLoopReadable(page: Page, label: string) {
  const loop = page.locator('.sl-project-trusted-loop').first()
  await loop.scrollIntoViewIfNeeded()
  await expect(loop, `${label}:project-trusted-loop`).toBeVisible()
  await expect(loop.getByRole('heading', { name: '项目主链路闭环' }), `${label}:project-trusted-loop-heading`).toBeVisible()
  await expect(loop.locator('.sl-project-trusted-loop-step'), `${label}:project-trusted-loop-step-count`).toHaveCount(4)
  for (const stepName of ['首次可信仓库分析', '源码级理解', 'Issue 到修复候选', '安全与审计']) {
    await expect(loop.getByText(stepName), `${label}:project-trusted-loop-step:${stepName}`).toBeVisible()
  }
  const gridColumnCount = await loop.locator('.sl-project-trusted-loop-grid').evaluate(element => {
    const columns = getComputedStyle(element).gridTemplateColumns
    if (columns === 'none') return 0
    return columns.split(' ').filter(Boolean).length
  })
  const viewportWidth = page.viewportSize()?.width || 0
  expect(
    gridColumnCount,
    `${label}:project trusted loop must collapse to one column on mobile and stay bounded on desktop`
  ).toBe(viewportWidth <= 720 ? 1 : viewportWidth <= 1200 ? 2 : 4)
  const stepTitles = loop.locator('.sl-project-trusted-loop-copy strong')
  const stepCount = await stepTitles.count()
  for (let index = 0; index < stepCount; index += 1) {
    await expectLocatorTextNotClipped(stepTitles.nth(index), `${label}:project-trusted-loop-title:${index}`)
  }
  await expectNoHorizontalOverflow(page, `${label}:project-trusted-loop`)
}

async function assertSharedTableCellBoundary(page: Page) {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/projects')
  const nonEllipsisCell = page.locator('.sl-project-list-table .ant-table-tbody td:not(.ant-table-cell-ellipsis)').first()
  await expect(nonEllipsisCell, 'shared table non-ellipsis cell must be visible').toBeVisible()
  await nonEllipsisCell.evaluate(element => {
    element.textContent = 'shared-table-non-ellipsis-cell-long-project-task-audit-artifact-status-token-must-wrap-without-clipping'
  })
  const nonEllipsisStyle = await nonEllipsisCell.evaluate(element => {
    const style = getComputedStyle(element)
    return {
      overflow: style.overflow,
      overflowWrap: style.overflowWrap,
      textOverflow: style.textOverflow,
      whiteSpace: style.whiteSpace,
      wordBreak: style.wordBreak,
    }
  })
  expect(
    ['anywhere', 'break-word'],
    'shared table non-ellipsis cell must allow long-token wrapping'
  ).toContain(nonEllipsisStyle.overflowWrap)
  expect(nonEllipsisStyle.textOverflow, 'shared table non-ellipsis cell must not use ellipsis').toBe('clip')
  expect(nonEllipsisStyle.whiteSpace, 'shared table non-ellipsis cell must wrap').toBe('normal')
  expect(nonEllipsisStyle.wordBreak, 'shared table non-ellipsis cell must break long tokens').toBe('break-word')
  const nonEllipsisWrapMetrics = await nonEllipsisCell.evaluate(element => {
    const style = getComputedStyle(element)
    return {
      clientHeight: element.clientHeight,
      lineHeight: Number.parseFloat(style.lineHeight),
      scrollHeight: element.scrollHeight,
    }
  })
  expect(
    nonEllipsisWrapMetrics.scrollHeight,
    `shared table non-ellipsis cell must actually wrap to multiple lines: ${JSON.stringify(nonEllipsisWrapMetrics)}`
  ).toBeGreaterThan(nonEllipsisWrapMetrics.lineHeight * 1.5)
  await expectLocatorTextNotClipped(nonEllipsisCell, 'shared-table-non-ellipsis-cell')
  await expectNoHorizontalOverflow(page, 'shared-table-non-ellipsis-cell')

  await page.goto('/model-config')
  const endpointCell = page.locator('.sl-model-provider-table .sl-model-endpoint-cell').first()
  await expect(endpointCell, 'shared table endpoint cell must be visible').toBeVisible()
  const ellipsisCell = endpointCell.locator('xpath=ancestor::td[contains(@class, "ant-table-cell-ellipsis")][1]')
  await expect(ellipsisCell, 'shared table ellipsis cell must be visible').toBeVisible()
  const ellipsisCellStyle = await ellipsisCell.evaluate(element => {
    const style = getComputedStyle(element)
    return {
      overflow: style.overflow,
      textOverflow: style.textOverflow,
      whiteSpace: style.whiteSpace,
    }
  })
  expect(ellipsisCellStyle.overflow, 'shared table ellipsis cell must keep overflow hidden').toBe('hidden')
  expect(ellipsisCellStyle.textOverflow, 'shared table ellipsis cell must keep ellipsis signaling').toBe('ellipsis')
  expect(ellipsisCellStyle.whiteSpace, 'shared table ellipsis cell must stay one-line').toBe('nowrap')

  const ellipsisTypography = endpointCell.locator('.ant-typography').first()
  await expect(ellipsisTypography, 'shared table ellipsis typography must be visible').toBeVisible()
  const ellipsisTypographyStyle = await ellipsisTypography.evaluate(element => {
    const style = getComputedStyle(element)
    return {
      overflow: style.overflow,
      textOverflow: style.textOverflow,
      whiteSpace: style.whiteSpace,
    }
  })
  expect(ellipsisTypographyStyle.overflow, 'shared table ellipsis typography must keep overflow hidden').toBe('hidden')
  expect(ellipsisTypographyStyle.textOverflow, 'shared table ellipsis typography must keep ellipsis signaling').toBe('ellipsis')
  expect(ellipsisTypographyStyle.whiteSpace, 'shared table ellipsis typography must stay one-line').toBe('nowrap')
  await expectNoHorizontalOverflow(page, 'shared-table-ellipsis-cell')
}

async function assertCoreStatusLinesReadableOnCurrentPage(page: Page, routeCase: RouteCase, viewportName: string) {
  let guardedStatusLineCount = 0
  const statusLines = page.locator(coreStatusLineSelector)
  const lineCount = await statusLines.count()
  for (let index = 0; index < lineCount; index += 1) {
    const line = statusLines.nth(index)
    if (!await line.isVisible()) continue
    const statusItem = line.locator('span:not(.sl-live-dot)').first()
    if (await statusItem.count() <= 0 || !await statusItem.isVisible()) continue
    await statusItem.evaluate(element => {
      element.textContent = 'core-route-status-line-long-context-token-must-wrap-without-ellipsis-or-horizontal-overflow'
    })
    await expectLocatorTextNotClipped(statusItem, `${routeCase.path}:${viewportName}:core-status-line:${index}`)
    const statusStyle = await statusItem.evaluate(element => {
      const style = getComputedStyle(element)
      return {
        overflow: style.overflow,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
      }
    })
    expect(statusStyle.overflow, `${routeCase.path}:${viewportName}:core status line must not hide overflow`).not.toBe('hidden')
    expect(statusStyle.textOverflow, `${routeCase.path}:${viewportName}:core status line must not use ellipsis`).not.toBe('ellipsis')
    expect(statusStyle.whiteSpace, `${routeCase.path}:${viewportName}:core status line must wrap`).not.toBe('nowrap')
    await expectNoHorizontalOverflow(page, `${routeCase.path}:${viewportName}:core-status-line`)
    guardedStatusLineCount += 1
  }
  return guardedStatusLineCount
}

async function assertAppShellPage(page: Page, routeCase: RouteCase, viewportName: string) {
  await page.goto(routeCase.path)
  await expect(page.locator('.sl-app-shell')).toBeVisible()
  await expect(page.locator('.sl-topbar-title')).toHaveText(routeCase.topbarTitle)
  const planeSelector = (page.viewportSize()?.width || 0) <= 960 ? '.sl-topbar-plane-compact' : '.sl-topbar-plane'
  await expect(page.locator(planeSelector), `${routeCase.path}:${viewportName}:visible-product-plane`).toBeVisible()
  await expect(page.locator(planeSelector)).toHaveText(routeCase.topbarPlane)
  await expect(page.getByRole('heading', { name: routeCase.pageHeading })).toBeVisible()
  await expectBoxInsideViewport(page, '.sl-topbar-title', `${routeCase.path}:${viewportName}:topbar-title`)
  await expectTextNotClipped(page, '.sl-topbar-title', `${routeCase.path}:${viewportName}:topbar-title-text`)
  if (await page.locator('.sl-topbar-desc').first().isVisible()) {
    await expectTextNotClipped(page, '.sl-topbar-desc', `${routeCase.path}:${viewportName}:topbar-desc-text`)
  }
  await expectBoxInsideViewport(page, pageHeadingSelector, `${routeCase.path}:${viewportName}:page-heading`)
  await expectTextNotClipped(page, pageHeadingSelector, `${routeCase.path}:${viewportName}:page-heading-text`)
  const selectedMenuProof = await assertExpectedSelectedMenu(page, routeCase, viewportName)
  await expectTopbarAndPageSeparated(page, `${routeCase.path}:${viewportName}`)
  await expectNoHorizontalOverflow(page, `${routeCase.path}:${viewportName}`)
  if (routeCase.path === '/dashboard') {
    await expectDashboardRecentTableScrollerContained(page, `${routeCase.path}:${viewportName}`)
  }
  if (routeCase.path === '/projects') {
    await expectProjectsPortfolioLoopReadable(page, `${routeCase.path}:${viewportName}`)
    await expectProjectsTableScrollerContained(page, `${routeCase.path}:${viewportName}`)
  }
  if (routeCase.path === `/projects/${projectId}`) {
    await expectProjectDetailWorkflowTablesContained(page, `${routeCase.path}:${viewportName}`)
  }
  const readablePrimaryButtons = await expectPrimaryButtonsReadable(page, `${routeCase.path}:${viewportName}`)
  if (routeCase.requiresPrimaryButton) {
    expect(readablePrimaryButtons, `${routeCase.path}:${viewportName} should expose at least one primary action`).toBeGreaterThan(0)
  }
  await expect(page.locator('.ant-message-notice-error, .ant-notification-notice-error')).toHaveCount(0)
  return {
    guardedStatusLineCount: await assertCoreStatusLinesReadableOnCurrentPage(page, routeCase, viewportName),
    selectedMenuProof,
  }
}

async function assertMobileNavigation(page: Page) {
  for (const viewport of mobileNavigationViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/dashboard')
    const menuButton = page.getByRole('button', { name: '打开导航菜单' })
    await expect(menuButton).toBeVisible()
    await menuButton.click()
    const drawer = page.locator('.sl-mobile-nav')
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('menuitem', { name: /项目与仓库/ })).toBeVisible()
    await expect(drawer.getByRole('menuitem', { name: /审计日志/ })).toHaveCount(0)
    const segmented = drawer.locator('.sl-perspective-segmented')
    await expect(segmented).toBeVisible()
    for (const perspective of workPerspectiveCases) {
      await expect(segmented.locator('.ant-segmented-item').filter({ hasText: perspective.label })).toBeVisible()
    }
    await expect(drawer.getByText(workPerspectiveBoundary, { exact: true })).toBeVisible()
    await expectNoHorizontalOverflow(page, `${viewport.name}-navigation-drawer`)
    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeVisible()
  }
}

function perspectiveStorageKey(userId: number) {
  return `${workPerspectiveStorageKeyPrefix}${userId}`
}

async function openPerspectiveSurface(page: Page, viewport: { width: number; height: number }) {
  if (viewport.width <= 720) {
    const drawer = page.locator('.sl-mobile-nav')
    const menuButton = page.getByRole('button', { name: '打开导航菜单' })
    if (await menuButton.getAttribute('aria-expanded') !== 'true') {
      await menuButton.click()
    }
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await expect(drawer).toBeVisible()
    return drawer
  }
  const sider = page.locator('.sl-sider')
  await expect(sider).toBeVisible()
  return sider
}

async function expectPerspectiveMenu(
  page: Page,
  viewport: { width: number; height: number },
  perspective: WorkPerspectiveCase,
) {
  const surface = await openPerspectiveSurface(page, viewport)
  await expect(surface.getByText(workPerspectiveBoundary, { exact: true })).toBeVisible()
  const segmented = surface.locator('.sl-perspective-segmented')
  await expect(segmented).toBeVisible()
  await expect(segmented.locator('.ant-segmented-item-selected')).toContainText(perspective.label)

  for (const item of perspective.menuItems) {
    await expect(surface.getByRole('menuitem', { name: new RegExp(item) })).toBeVisible()
  }
  const hiddenItems = workPerspectiveCases
    .filter(candidate => candidate.value !== perspective.value)
    .flatMap(candidate => candidate.menuItems)
  for (const item of hiddenItems) {
    await expect(surface.getByRole('menuitem', { name: new RegExp(item) })).toHaveCount(0)
  }
  await expectNoHorizontalOverflow(page, `work-perspective:${viewport.name}:${perspective.value}`)
  return surface
}

async function expectClosedMobilePerspectiveState(page: Page, perspective: WorkPerspectiveCase) {
  const drawer = page.locator('.sl-mobile-nav')
  await expect(drawer).not.toBeVisible()
  const segmented = drawer.locator('.sl-perspective-segmented')
  await expect(segmented.locator('.ant-segmented-item-selected')).toContainText(perspective.label)

  for (const item of perspective.menuItems) {
    await expect(drawer.locator('.ant-menu-item').filter({ hasText: item })).toHaveCount(1)
  }
  const hiddenItems = workPerspectiveCases
    .filter(candidate => candidate.value !== perspective.value)
    .flatMap(candidate => candidate.menuItems)
  for (const item of hiddenItems) {
    await expect(drawer.locator('.ant-menu-item').filter({ hasText: item })).toHaveCount(0)
  }
}

async function switchPerspective(
  page: Page,
  viewport: { width: number; height: number },
  perspective: WorkPerspectiveCase,
  keyboard = false,
) {
  const surface = await openPerspectiveSurface(page, viewport)
  const segmented = surface.locator('.sl-perspective-segmented')
  const item = segmented.locator('.ant-segmented-item').filter({ hasText: perspective.label })
  const radio = item.locator('input[type="radio"]')
  await expect(item).toBeInViewport()
  if (keyboard) {
    await radio.focus()
    await page.keyboard.press('Space')
  } else {
    await item.click()
  }
  await expect(page).toHaveURL(new RegExp(`${perspective.home.replace('/', '\\/')}$`))
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', perspective.value)
  if (viewport.width <= 720) {
    await expectClosedMobilePerspectiveState(page, perspective)
  } else {
    await expectPerspectiveMenu(page, viewport, perspective)
  }
  const stored = await page.evaluate(key => window.localStorage.getItem(key), perspectiveStorageKey(1))
  expect(stored, `${viewport.name}:${perspective.value} explicit switch must persist`).toBe(perspective.value)
}

async function assertWorkPerspectiveContract(
  page: Page,
  controls: { userId: number },
) {
  const viewportProofs: string[] = []
  controls.userId = 1

  for (const viewport of workPerspectiveViewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/dashboard')
    await page.evaluate(key => window.localStorage.removeItem(key), perspectiveStorageKey(1))
    await page.reload()
    await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'workbench')
    await expectPerspectiveMenu(page, viewport, workPerspectiveCases[0])
    if (viewport.width <= 720) await page.keyboard.press('Escape')

    await switchPerspective(page, viewport, workPerspectiveCases[1], viewport.name === 'desktop')
    await switchPerspective(page, viewport, workPerspectiveCases[2])
    await switchPerspective(page, viewport, workPerspectiveCases[0])
    viewportProofs.push(`${viewport.width}x${viewport.height}`)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dashboard')
  const sider = page.locator('.sl-sider')
  await sider.locator('.ant-layout-sider-trigger').click()
  await expect(sider).toHaveClass(/ant-layout-sider-collapsed/)
  await page.locator('.sl-perspective-dropdown-button').click()
  await page.getByRole('menuitem', { name: '工程治理' }).click()
  await expect(page).toHaveURL(/\/execution-tasks$/)
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'governance')
  await expect(sider).toHaveClass(/ant-layout-sider-collapsed/)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '打开导航菜单' }).click()
  await expect(page.locator('.sl-mobile-nav')).toBeVisible()
  await page.setViewportSize({ width: 1024, height: 768 })
  await expect(page.locator('.sl-mobile-nav')).not.toBeVisible()
  await expect(page.locator('.sl-sider')).toBeVisible()
  await expect(page.locator('.sl-sider')).toHaveClass(/ant-layout-sider-collapsed/)
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: perspectiveStorageKey(1), value: 'governance' },
  )
  controls.userId = 1
  await page.goto('/')
  await expect(page).toHaveURL(/\/execution-tasks$/)
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'governance')

  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'workbench')
  expect(await page.evaluate(key => window.localStorage.getItem(key), perspectiveStorageKey(1))).toBe('governance')

  await page.goto('/audit-logs')
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'admin_security')
  expect(await page.evaluate(key => window.localStorage.getItem(key), perspectiveStorageKey(1))).toBe('governance')

  await page.evaluate(key => window.localStorage.setItem(key, 'admin_security'), perspectiveStorageKey(1))
  await page.evaluate(key => window.localStorage.removeItem(key), perspectiveStorageKey(2))
  controls.userId = 2
  await page.goto('/')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'workbench')
  expect(await page.evaluate(key => window.localStorage.getItem(key), perspectiveStorageKey(1))).toBe('admin_security')

  await page.evaluate(key => window.localStorage.setItem(key, 'forged-perspective'), perspectiveStorageKey(2))
  await page.goto('/')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'workbench')
  await expectNoHorizontalOverflow(page, 'work-perspective:user-isolation-invalid-fallback')

  return {
    values: workPerspectiveCases.map(perspective => perspective.value),
    labels: workPerspectiveCases.map(perspective => perspective.label),
    homes: workPerspectiveCases.map(perspective => perspective.home),
    storageKeyPrefix: workPerspectiveStorageKeyPrefix,
    viewports: viewportProofs,
    perUserPreferenceKeyIsolation: true,
    invalidFallback: true,
    deepLinkDoesNotOverwritePreference: true,
    collapsedSider: true,
    mobileDrawer: true,
    breakpointDrawerCleanup: true,
    desktopCollapsePreferenceRestored: true,
    rbacCompleteClaim: false,
  }
}

async function assertLongTopbarCopyWraps(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dashboard')
  await page.locator('.sl-topbar-title').evaluate(element => {
    element.textContent = '运营仪表盘 / SourceLens 公开仓库逆向分析、任务流水线、报告证据、Agent 治理和发布门禁综合控制台'
  })
  await page.locator('.sl-topbar-desc').evaluate(element => {
    element.textContent = '这是一段用于 P9 smoke 的超长顶部说明，必须完整换行显示，不能被省略号隐藏，也不能把页面标题挤到浏览器顶部之外。'
  })
  await expectTextNotClipped(page, '.sl-topbar-title', 'long-topbar-title-text')
  await expectTextNotClipped(page, '.sl-topbar-desc', 'long-topbar-desc-text')
  await expectTopbarAndPageSeparated(page, 'long-topbar-copy')
  await expectNoHorizontalOverflow(page, 'long-topbar-copy')

  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/dashboard')
  await page.locator('.sl-topbar-title').evaluate(element => {
    element.textContent = '运营仪表盘 / SourceLens 超长移动端标题必须换行且不能裁切'
  })
  await expectTextNotClipped(page, '.sl-topbar-title', 'long-mobile-topbar-title-text')
  await expectTopbarAndPageSeparated(page, 'long-mobile-topbar-copy')
  await expectNoHorizontalOverflow(page, 'long-mobile-topbar-copy')
}

async function assertTopbarAuxiliaryResponsiveContract(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dashboard')
  for (const selector of ['.sl-topbar-plane', '.sl-topbar-env', '.sl-topbar-ports', '.sl-user-button']) {
    await expect(page.locator(selector).first(), `desktop ${selector} must be visible`).toBeVisible()
    await expectBoxInsideContainer(page, selector, '.sl-topbar', `desktop:${selector}:contained`)
  }
  await expectTextNotClipped(page, '.sl-topbar-plane', 'desktop-topbar-plane-text')
  await expectTextNotClipped(page, '.sl-topbar-env', 'desktop-topbar-env-text')
  await expectTextNotClipped(page, '.sl-topbar-ports', 'desktop-topbar-ports-text')
  await expectTextNotClipped(page, '.sl-topbar-username', 'desktop-topbar-username-text')
  await expect(page.locator('.sl-topbar-plane-compact'), 'desktop compact plane label must stay collapsed').not.toBeVisible()

  const planeRouteCases = [
    { path: '/dashboard', plane: '前台体验' },
    { path: `/execution-tasks?projectId=${projectId}`, plane: '开发者控制台' },
    { path: `/audit-logs?projectId=${projectId}`, plane: '后台治理' },
  ] as const

  for (const viewport of compactPlaneViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    for (const routeCase of planeRouteCases) {
      await page.goto(routeCase.path)
      const compactPlane = page.locator('.sl-topbar-plane-compact')
      await expect(compactPlane, `${viewport.name}:${routeCase.path}:compact plane must be directly visible`).toBeVisible()
      await expect(compactPlane).toHaveText(routeCase.plane)
      await expectBoxInsideContainer(page, '.sl-topbar-plane-compact', '.sl-topbar', `${viewport.name}:${routeCase.path}:compact-plane-contained`)
      const desktopPlaneDisplay = await page.locator('.sl-topbar-plane').evaluate(element => window.getComputedStyle(element).display)
      expect(desktopPlaneDisplay, `${viewport.name}:${routeCase.path}:desktop plane tag must hand off to compact label`).toBe('none')
      await expectNoHorizontalOverflow(page, `${viewport.name}:${routeCase.path}:compact-plane`)
    }
  }

  for (const viewport of mobileNavigationViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/dashboard')
    for (const selector of ['.sl-topbar-plane', '.sl-topbar-env', '.sl-topbar-ports', '.sl-topbar-username']) {
      const display = await page.locator(selector).first().evaluate(element => window.getComputedStyle(element).display)
      expect(display, `${viewport.name} ${selector} must collapse before it can squeeze the route title`).toBe('none')
    }
    await expect(page.locator('.sl-topbar-plane-compact'), `${viewport.name} compact plane label must remain visible`).toBeVisible()
    await expect(page.locator('.sl-topbar-plane-compact')).toHaveText('前台体验')
    await expect(page.locator('.sl-user-button').first(), `${viewport.name} user button must remain as compact account action`).toBeVisible()
    const userButtonMetrics = await page.locator('.sl-user-button').first().evaluate(element => {
      const box = element.getBoundingClientRect()
      return {
        width: box.width,
        minWidth: window.getComputedStyle(element).minWidth,
      }
    })
    expect(userButtonMetrics.width, `${viewport.name} user button must stay compact: ${JSON.stringify(userButtonMetrics)}`).toBeLessThanOrEqual(36)
    await expectTopbarAndPageSeparated(page, `${viewport.name}-topbar-auxiliary-collapse`)
    await expectNoHorizontalOverflow(page, `${viewport.name}-topbar-auxiliary-collapse`)
  }
}

async function assertNoAppShellProductOverclaim(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dashboard')
  const bodyText = await page.locator('body').innerText()
  const blockedClaims = ['RBAC 已完成', '权限隔离已完成', '完整后台已完成', '多租户已完成', '生产部署已完成']
  for (const claim of blockedClaims) {
    expect(bodyText, `App shell must not overclaim product capability: ${claim}`).not.toContain(claim)
  }
  return {
    rbacCompleteClaim: false,
    adminSystemCompleteClaim: false,
    productionDeploymentClaim: false,
  }
}

async function assertProjectCockpitStatusAndDisabledActionsReadable(page: Page) {
  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/projects/${projectId}`)

    const statusItem = page.locator('.sl-project-cockpit-status span:not(.sl-live-dot)').first()
    await expect(statusItem, `project cockpit status must exist on ${viewport.name}`).toBeVisible()
    await statusItem.evaluate(element => {
      element.textContent = 'knowledge-source-very-long-scan-task-and-repository-context-that-must-wrap-inside-project-cockpit-status'
    })
    await expectLocatorTextNotClipped(statusItem, `project-cockpit-status:${viewport.name}`)
    const statusStyle = await statusItem.evaluate(element => {
      const style = getComputedStyle(element)
      return {
        overflow: style.overflow,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
      }
    })
    expect(statusStyle.overflow, `project cockpit status must not hide overflow on ${viewport.name}`).not.toBe('hidden')
    expect(statusStyle.textOverflow, `project cockpit status must not use ellipsis on ${viewport.name}`).not.toBe('ellipsis')
    expect(statusStyle.whiteSpace, `project cockpit status must wrap on ${viewport.name}`).not.toBe('nowrap')

    const nextActionButton = page.locator('.sl-project-next-action-actions .ant-btn-default').first()
    await expect(nextActionButton, `project next action button must exist on ${viewport.name}`).toBeVisible()
    await nextActionButton.evaluate(element => {
      element.setAttribute('disabled', '')
      element.classList.add('ant-btn-disabled')
    })
    const disabledPaint = await nextActionButton.evaluate(element => {
      const style = getComputedStyle(element)
      return {
        color: style.color,
        textFillColor: style.webkitTextFillColor,
      }
    })
    expect(readableDisabledOnDark, `project next action disabled button color must stay readable on ${viewport.name}`).toContain(disabledPaint.color)
    expect(readableDisabledOnDark, `project next action disabled button text fill must stay readable on ${viewport.name}`).toContain(disabledPaint.textFillColor)
    const disabledLabel = nextActionButton.locator('.sl-action-button-label').first()
    await expectLocatorTextNotClipped(disabledLabel, `project-next-action-disabled-label:${viewport.name}`)
    await expectNoHorizontalOverflow(page, `project-cockpit-status-disabled-actions:${viewport.name}`)
  }
}

test('App shell keeps topbar, page headings and primary actions readable across core routes', async ({ page }) => {
  test.setTimeout(240_000)
  const issues = installRuntimeGuards(page)
  const network = await installAppShellMocks(page)
  const visitedRoutes: string[] = []
  const scanReportSelectedMenuProofs: SelectedMenuProof[] = []
  let guardedStatusLineCount = 0
  const baseURLHost = new URL(test.info().project.use.baseURL || 'http://127.0.0.1').hostname || '127.0.0.1'
  const expectedVisitedRouteCount = viewportMatrix.length * routeCases.length

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    for (const routeCase of routeCases) {
      const routeProof = await assertAppShellPage(page, routeCase, viewport.name)
      guardedStatusLineCount += routeProof.guardedStatusLineCount
      if (routeProof.selectedMenuProof) scanReportSelectedMenuProofs.push(routeProof.selectedMenuProof)
      visitedRoutes.push(`${routeCase.path}:${viewport.width}x${viewport.height}`)
    }
  }

  await assertMobileNavigation(page)
  await assertLongTopbarCopyWraps(page)
  await assertTopbarAuxiliaryResponsiveContract(page)
  const productOverclaim = await assertNoAppShellProductOverclaim(page)
  await assertProjectCockpitStatusAndDisabledActionsReadable(page)
  await assertSharedTableCellBoundary(page)
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in app shell UI smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  expect(visitedRoutes, 'App shell smoke must visit each core route exactly once per viewport.').toHaveLength(expectedVisitedRouteCount)
  expect(guardedStatusLineCount, 'App shell smoke must guard status line readability across multiple core routes.').toBeGreaterThanOrEqual(12)
  expect(scanReportSelectedMenuProofs, 'Scan report must keep its /projects parent menu identity across the full viewport matrix.').toHaveLength(viewportMatrix.length)
  expect(scanReportSelectedMenuProofs.filter(proof => proof.mobileDrawerSelected), 'Scan report parent menu must be selected in both mobile drawers.').toHaveLength(mobileNavigationViewports.length)

  console.log('APP_SHELL_UI_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    routes: routeCases.map(routeCase => routeCase.path),
    productPlanes: ['前台体验', '开发者控制台', '后台治理'],
    routePlanes: routeCases.map(routeCase => `${routeCase.path}:${routeCase.topbarPlane}`),
    scanReportRoutePlane: {
      directLoad: scanReportSelectedMenuProofs,
      topbarTitle: '扫描报告',
      plane: '前台体验',
      pageHeading: '仓库逆向分析报告',
      selectedMenuKey: '/projects',
      mobileDrawerSelected: scanReportSelectedMenuProofs.filter(proof => proof.surface === 'mobileDrawer').every(proof => proof.mobileDrawerSelected),
      viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
      horizontalOverflow: true,
      runtimeIssues: issues.length,
    },
    mobileNavigationViewports: mobileNavigationViewports.map(viewport => `${viewport.width}x${viewport.height}`),
    topbarPlaneCollapseViewports: mobileNavigationViewports.map(viewport => `${viewport.width}x${viewport.height}`),
    productOverclaim,
    expectedVisitedRouteCount,
    actualVisitedRouteCount: visitedRoutes.length,
    guardedStatusLineCount,
    visitedRoutes,
    assertions: [
      'topbar-title-visible-and-unclipped',
      'topbar-title-scroll-size-within-box',
      'topbar-desc-scroll-size-within-box',
      'topbar-actions-wrap-without-clipping',
      'topbar-text-contained-by-adaptive-header',
      'topbar-plane-collapses-on-390-and-320',
      'page-content-separated-from-topbar',
      'page-heading-visible-and-unclipped',
      'page-heading-scroll-size-within-box',
      'primary-button-label-icon-svg-white',
      'primary-button-label-scroll-size-within-box',
      'no-horizontal-overflow',
      'no-product-overclaim',
      'no-error-toast-or-notification',
      'no-runtime-console-or-pageerror',
    ],
    layoutGuards: [
      'topbar-title-contained',
      'topbar-desc-contained-when-visible',
      'topbar-actions-contained',
      'topbar-auxiliary-visible-on-desktop-and-collapsed-on-mobile',
      'mobile-navigation-drawer-available-on-390-and-320',
      'long-topbar-title-desc-wrap-without-clipping',
      'dashboard-recent-table-scroller-contained',
      'projects-portfolio-loop-readable-and-responsive',
      'projects-table-scroller-contained',
      'project-detail-workflow-table-scroller-contained',
      'project-detail-trusted-loop-readable-and-responsive',
      'project-cockpit-status-wraps-without-ellipsis',
      'core-route-status-lines-wrap-without-ellipsis',
      'project-next-action-disabled-buttons-readable-on-dark-surface',
      'shared-table-non-ellipsis-cell-wraps-without-clipping',
      'shared-table-ellipsis-cell-preserves-ellipsis',
      'page-content-starts-after-topbar',
      'page-heading-below-topbar',
    ],
    baseURLHost,
    spec: 'app-shell-ui-smoke.spec.ts',
  }))
})

test('Work perspective persists per user and keeps direct routes accessible', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAppShellMocks(page)
  const workPerspective = await assertWorkPerspectiveContract(page, network.controls)

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in work perspective UI smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('WORK_PERSPECTIVE_UI_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    workPerspective,
    boundary: workPerspectiveBoundary,
    spec: 'app-shell-ui-smoke.spec.ts',
  }))
})

test('Work perspective remains usable when preference storage throws', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAppShellMocks(page)
  await page.addInitScript(prefix => {
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.getItem = function getItem(key: string) {
      if (key.startsWith(prefix)) throw new Error('simulated work perspective storage read failure')
      return originalGetItem.call(this, key)
    }
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (key.startsWith(prefix)) throw new Error('simulated work perspective storage write failure')
      return originalSetItem.call(this, key, value)
    }
  }, workPerspectiveStorageKeyPrefix)

  await page.goto('/')
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'workbench')
  await page.locator('.sl-sider .sl-perspective-segmented .ant-segmented-item').filter({ hasText: '工程治理' }).click()
  await expect(page).toHaveURL(/\/execution-tasks$/)
  await expect(page.locator('.sl-app-shell')).toHaveAttribute('data-work-perspective', 'governance')

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in storage failure smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  console.log('WORK_PERSPECTIVE_STORAGE_FAILURE_SMOKE_OK', JSON.stringify({
    readFailureFallback: 'workbench',
    writeFailureNavigationContinues: true,
    preferenceIsNotAnAuthorizationControl: true,
  }))
})
