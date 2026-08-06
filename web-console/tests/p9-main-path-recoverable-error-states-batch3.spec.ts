import { expect, test, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type ApiCounters = Record<string, number>

const projectId = 1
const taskId = 701
const artifactId = 901

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'narrow', width: 320, height: 740 },
]

const projectFirstViewportSupplementMatrix = [
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

const project = {
  id: projectId,
  name: 'Batch3 Recoverable Project',
  description: 'Mocked project for P9 recoverable error states',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 88,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const executionTask = {
  id: taskId,
  projectId,
  repositoryId: 11,
  taskType: 'SCAN_TASK',
  sourceType: 'SCAN_TASK',
  sourceId: 501,
  status: 'SUCCESS',
  currentStep: 'publish_report',
  currentAttemptId: 801,
  progress: 100,
  errorMessage: null,
  createdBy: 1,
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:09:00Z',
  createdAt: '2026-07-01T10:00:00Z',
  updatedAt: '2026-07-01T10:09:00Z',
}

const executionDetail = {
  task: executionTask,
  attempts: [
    {
      id: 801,
      taskId,
      attemptNo: 1,
      status: 'SUCCESS',
      currentStep: 'publish_report',
      errorMessage: null,
      startedAt: '2026-07-01T10:01:00Z',
      finishedAt: '2026-07-01T10:09:00Z',
      createdAt: '2026-07-01T10:00:00Z',
      updatedAt: '2026-07-01T10:09:00Z',
    },
  ],
  steps: [
    {
      id: 901,
      taskId,
      attemptId: 801,
      stepKey: 'publish_report',
      stepName: '发布报告',
      status: 'SUCCESS',
      logSummary: 'Report published',
      errorMessage: null,
      startedAt: '2026-07-01T10:08:00Z',
      finishedAt: '2026-07-01T10:09:00Z',
      createdAt: '2026-07-01T10:08:00Z',
      updatedAt: '2026-07-01T10:09:00Z',
    },
  ],
  logs: [
    {
      id: 1001,
      taskId,
      attemptId: 801,
      stepKey: 'publish_report',
      level: 'INFO',
      message: 'Execution report ready after retry',
      createdAt: '2026-07-01T10:09:00Z',
    },
  ],
}

const artifact = {
  id: artifactId,
  projectId,
  repositoryId: 11,
  ownerType: 'SCAN_TASK',
  ownerId: 501,
  artifactType: 'ARCHITECTURE_REPORT',
  contentType: 'application/json',
  sizeBytes: 4096,
  checksumSha256: 'a'.repeat(64),
  metadataJson: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:10:00Z',
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

async function fulfillFailure(route: Route, message: string) {
  await route.fulfill({
    status: 500,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify({
      code: 'INTERNAL_ERROR',
      message,
      data: null,
    }),
  })
}

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []
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

function count(counters: ApiCounters, key: string) {
  counters[key] = (counters[key] || 0) + 1
  return counters[key]
}

async function installRecoverableMocks(page: Page, mode: 'projects' | 'execution' | 'artifacts') {
  const counters: ApiCounters = {}
  const unhandledApiRequests: string[] = []
  const controls = {
    failProjectRequests: 0,
    emptyProjects: false,
  }

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'p9-batch3-recoverable-error-states-token')
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
      await fulfillJson(route, result({ id: 1, username: 'p9_batch3_user', email: 'p9-batch3@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      const attempt = count(counters, 'projects')
      if (controls.failProjectRequests > 0) {
        controls.failProjectRequests -= 1
        await fulfillFailure(route, '项目列表临时不可用')
        return
      }
      if (controls.emptyProjects) {
        await fulfillJson(route, result({ items: [], page: 1, pageSize: 100, total: 0 }))
        return
      }
      if (mode === 'projects' && attempt <= 6) {
        await fulfillFailure(route, '项目列表临时不可用')
        return
      }
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      const attempt = count(counters, 'executionList')
      if (mode === 'execution' && attempt <= 6) {
        await fulfillFailure(route, '执行任务列表临时不可用')
        return
      }
      await fulfillJson(route, result({ items: [executionTask], page: 1, pageSize: 20, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/${taskId}`) {
      const attempt = count(counters, 'executionDetail')
      if (mode === 'execution' && attempt <= 3) {
        await fulfillFailure(route, '执行任务详情临时不可用')
        return
      }
      await fulfillJson(route, result(executionDetail))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      const attempt = count(counters, 'artifacts')
      if (mode === 'artifacts' && attempt <= 6) {
        await fulfillFailure(route, '运行产物列表临时不可用')
        return
      }
      await fulfillJson(route, result([artifact]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${artifactId}/preview`) {
      const attempt = count(counters, 'artifactPreview')
      if (mode === 'artifacts' && attempt <= 3) {
        await fulfillFailure(route, '运行产物预览临时不可用')
        return
      }
      await fulfillJson(route, result({
        record: artifact,
        text: JSON.stringify({ overview: { totalFiles: 8, totalLines: 1200 }, suggestions: ['Retry path recovered.'] }),
        truncated: false,
        previewBytes: 96,
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

  return { counters, controls, unhandledApiRequests }
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

async function expectProjectsFatalFirstViewportContract(
  page: Page,
  viewport: { width: number; height: number },
  label: string,
) {
  expect(await page.evaluate(() => window.scrollY), `${label} must start at scrollY=0`).toBe(0)
  await expect(page.getByText('项目数据不可用')).toBeVisible()
  await expect(page.locator('.sl-project-summary-grid')).toHaveCount(0)
  await expect(page.locator('.sl-project-portfolio-loop')).toHaveCount(0)
  await expect(page.locator('.sl-project-table-card')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '新建项目' })).toHaveCount(0)

  const primaryButtons = page.locator('.sl-page-inner button.ant-btn-primary:visible')
  await expect(primaryButtons, `${label} must expose exactly one primary action`).toHaveCount(1)
  const retryButton = page.getByRole('button', { name: '重新加载项目' })
  await expect(retryButton).toBeVisible()
  const buttonBox = await retryButton.boundingBox()
  expect(buttonBox, `${label} retry action must have a visible box`).not.toBeNull()
  expect(
    buttonBox!.y + buttonBox!.height,
    `${label} retry action must remain in the initial viewport`,
  ).toBeLessThanOrEqual(viewport.height)
  await expectNoHorizontalOverflow(page, label)
}

function stateErrorBlock(page: Page, title: string) {
  return page.locator('.sl-state-block-error').filter({ hasText: title }).first()
}

for (const viewport of viewportMatrix) {
  test(`Projects query failure shows retryable in-page error state on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installRecoverableMocks(page, 'projects')

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: '项目与仓库入口' })).toBeVisible()
    const projectError = stateErrorBlock(page, '项目列表加载失败')
    await expect(projectError).toBeVisible()
    await expect(projectError).toContainText('项目列表临时不可用')
    await expect(page.getByText('暂无项目')).toHaveCount(0)
    await expectProjectsFatalFirstViewportContract(page, viewport, `projects-fatal-first-viewport:${viewport.name}`)

    await page.getByRole('button', { name: '重新加载项目' }).click()
    await expect(page.getByRole('button', { name: 'Batch3 Recoverable Project', exact: true })).toBeVisible()
    await expect(stateErrorBlock(page, '项目列表加载失败')).toHaveCount(0)
    await expectNoHorizontalOverflow(page, `projects-recoverable-error:${viewport.name}`)

    expect(network.counters.projects).toBeGreaterThanOrEqual(7)
    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })

  test(`Projects refresh failure preserves cached table data on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installRecoverableMocks(page, 'execution')

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: '项目与仓库入口' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Batch3 Recoverable Project', exact: true })).toBeVisible()

    network.controls.failProjectRequests = 4
    await page.getByRole('button', { name: '刷新项目列表' }).click()
    const refreshError = stateErrorBlock(page, '项目刷新失败，已保留上次成功数据')
    await expect(refreshError).toBeVisible()
    await expect(refreshError).toContainText('项目列表临时不可用')
    await expect(page.getByRole('button', { name: 'Batch3 Recoverable Project', exact: true })).toBeVisible()
    expect(await page.evaluate(() => window.scrollY), `${viewport.name} refresh error must start at scrollY=0`).toBe(0)
    await expect(page.locator('.sl-page-inner button.ant-btn-primary:visible')).toHaveCount(1)

    await refreshError.getByRole('button', { name: '重新加载项目' }).click()
    await expect(stateErrorBlock(page, '项目刷新失败，已保留上次成功数据')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Batch3 Recoverable Project', exact: true })).toBeVisible()
    await expectNoHorizontalOverflow(page, `projects-cached-refresh-error:${viewport.name}`)

    expect(network.counters.projects).toBeGreaterThanOrEqual(6)
    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })

  test(`ExecutionTasks list and detail failures show retryable in-page error states on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installRecoverableMocks(page, 'execution')

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/execution-tasks?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: '执行任务中心' })).toBeVisible()
    const executionListError = stateErrorBlock(page, '执行任务加载失败')
    await expect(executionListError).toBeVisible()
    await expect(executionListError).toContainText('执行任务列表临时不可用')
    await expect(page.getByText('暂无执行任务')).toHaveCount(0)

    await page.getByRole('button', { name: '重新加载任务' }).click()
    const row = page.getByRole('row', { name: new RegExp(`ExecutionTask #${taskId}`) })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: `查看执行任务 #${taskId} 详情` }).click()
    const executionDetailError = stateErrorBlock(page, '任务详情加载失败')
    await expect(executionDetailError).toBeVisible()
    await expect(executionDetailError).toContainText('执行任务详情临时不可用')

    await page.getByRole('button', { name: '重新加载任务' }).click()
    await expect(page.locator('.sl-execution-detail-card')).toContainText('Execution report ready after retry')
    await expectNoHorizontalOverflow(page, `execution-recoverable-error:${viewport.name}`)

    expect(network.counters.executionList).toBeGreaterThanOrEqual(7)
    expect(network.counters.executionDetail).toBeGreaterThanOrEqual(4)
    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })

  test(`Artifacts list and preview failures show retryable in-page error states on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installRecoverableMocks(page, 'artifacts')

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/artifacts?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: '运行产物证据中心' })).toBeVisible()
    const artifactListError = page.locator('.sl-artifact-source-error').filter({ hasText: '运行产物加载失败' }).first()
    await expect(artifactListError).toBeVisible()
    await expect(artifactListError).toContainText('运行产物列表临时不可用')
    await expect(page.getByText('暂无运行产物')).toHaveCount(0)

    await artifactListError.getByRole('button', { name: '重新加载产物' }).click()
    const row = page.getByRole('row', { name: new RegExp(`Artifact #${artifactId}`) })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: `预览 架构报告 #${artifactId}` }).click()
    const previewError = stateErrorBlock(page, '智能预览加载失败')
    await expect(previewError).toBeVisible()
    await expect(previewError).toContainText('运行产物预览临时不可用')

    await page.getByRole('button', { name: '重新加载预览' }).click()
    await expect(page.locator('.sl-artifact-smart-preview')).toContainText('总览')
    await expectNoHorizontalOverflow(page, `artifacts-recoverable-error:${viewport.name}`)

    expect(network.counters.artifacts).toBeGreaterThanOrEqual(7)
    expect(network.counters.artifactPreview).toBeGreaterThanOrEqual(4)
    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })
}

for (const viewport of projectFirstViewportSupplementMatrix) {
  test(`Projects fatal action arbitration stays in the first viewport on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installRecoverableMocks(page, 'projects')

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: '项目与仓库入口' })).toBeVisible()
    await expect(stateErrorBlock(page, '项目列表加载失败')).toContainText('项目列表临时不可用')
    await expectProjectsFatalFirstViewportContract(page, viewport, `projects-fatal-first-viewport:${viewport.name}`)

    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })
}

test('Projects confirmed-empty and filtered-empty states each expose one relevant primary action', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installRecoverableMocks(page, 'execution')
  await page.setViewportSize({ width: 390, height: 844 })

  network.controls.emptyProjects = true
  await page.goto('/projects')
  await expect(page.getByText('还没有项目')).toBeVisible()
  await expect(page.locator('.sl-project-summary-grid')).toHaveCount(0)
  await expect(page.locator('.sl-project-portfolio-loop')).toHaveCount(0)
  await expect(page.locator('.sl-project-table-card')).toHaveCount(0)
  await expect(page.locator('.sl-page-inner button.ant-btn-primary:visible')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '新建项目' })).toHaveClass(/ant-btn-primary/)

  network.controls.emptyProjects = false
  await page.reload()
  await expect(page.getByRole('button', { name: 'Batch3 Recoverable Project', exact: true })).toBeVisible()
  await page.getByPlaceholder('搜索项目、语言、框架或状态').fill('no-such-project')
  await expect(page.getByText('没有匹配的项目')).toBeVisible()
  await expect(page.locator('.sl-page-inner button.ant-btn-primary:visible')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '清除项目筛选' })).toHaveClass(/ant-btn-primary/)
  await expect(
    page.getByLabel('项目组合首屏动作').getByRole('button', { name: '新建项目' }),
  ).not.toHaveClass(/ant-btn-primary/)

  await page.getByRole('button', { name: '清除项目筛选' }).click()
  await expect(page.getByRole('button', { name: 'Batch3 Recoverable Project', exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page, 'projects-empty-state-arbitration:mobile')
  expect(network.unhandledApiRequests).toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
})

test.afterAll(() => {
  console.log('P9_MAIN_PATH_RECOVERABLE_ERROR_STATES_BATCH3_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    pages: ['Projects', 'ExecutionTasks', 'Artifacts'],
    retryableStates: {
      projects: ['项目列表加载失败', '重新加载项目'],
      projectsCachedRefresh: ['项目刷新失败，已保留上次成功数据', 'Batch3 Recoverable Project'],
      executionTasks: ['执行任务加载失败', '任务详情加载失败', '重新加载任务'],
      artifacts: ['运行产物加载失败', '智能预览加载失败', '重新加载产物', '重新加载预览'],
    },
    spec: 'p9-main-path-recoverable-error-states-batch3.spec.ts',
  }))
})
