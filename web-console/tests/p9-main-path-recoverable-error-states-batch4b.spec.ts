import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type ApiCounters = Record<string, number>

const projectId = 1
const repositoryId = 11
const scanTaskId = 501

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'Batch4B Graph Project',
  description: 'Mocked project for DependencyGraph recoverable state',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 92,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const repository = {
  id: repositoryId,
  projectId,
  provider: 'GITHUB',
  owner: 'LJunP',
  name: 'Batch4B-Graph-Repo',
  url: 'https://github.com/LJunP/Batch4B-Graph-Repo.git',
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
  commitSha: 'abc1234batch4b',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:05:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:30Z',
}

const codeChunkResult = {
  scanTaskId,
  query: '',
  limit: 1,
  total: 1,
  resultCount: 1,
  totalChunks: 64,
  embeddedChunks: 48,
  truncated: false,
  retrievalMode: 'HYBRID',
  items: [],
}

const dependencyGraph = {
  nodes: [
    {
      id: 'com.example.Batch4BController',
      label: 'Batch4BController',
      kind: 'CLASS',
      filePath: 'src/main/java/com/example/Batch4BController.java',
      package: 'com.example',
      lineNumber: 12,
    },
    {
      id: 'com.example.Batch4BService',
      label: 'Batch4BService',
      kind: 'CLASS',
      filePath: 'src/main/java/com/example/Batch4BService.java',
      package: 'com.example',
      lineNumber: 28,
    },
    {
      id: 'com.example.Batch4BRepository',
      label: 'Batch4BRepository',
      kind: 'INTERFACE',
      filePath: 'src/main/java/com/example/Batch4BRepository.java',
      package: 'com.example',
      lineNumber: 8,
    },
  ],
  edges: [
    {
      source: 'com.example.Batch4BController',
      target: 'com.example.Batch4BService',
      relationType: 'DEPENDS_ON',
    },
    {
      source: 'com.example.Batch4BService',
      target: 'com.example.Batch4BRepository',
      relationType: 'CALLS',
    },
  ],
  summary: {
    totalNodes: 3,
    totalEdges: 2,
    byKind: {
      CLASS: 2,
      INTERFACE: 1,
    },
    byRelation: {
      DEPENDS_ON: 1,
      CALLS: 1,
    },
  },
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

async function installBatch4BMocks(page: Page) {
  const counters: ApiCounters = {}
  const controls = {
    failGraph: 0,
  }
  const unhandledApiRequests: string[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'p9-batch4b-recoverable-error-states-token')
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
      await fulfillJson(route, result({ id: 1, username: 'p9_batch4b_user', email: 'p9-batch4b@local.test' }))
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

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 100, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      await fulfillJson(route, result([]))
      return
    }

    if (method === 'GET' && (path === `/api/projects/${projectId}/code-chunks/search` || path === `/api/projects/${projectId}/code-chunks/status`)) {
      await fulfillJson(route, result(codeChunkResult))
      return
    }

    if (method === 'GET' && path === `/api/scan-tasks/${scanTaskId}/graph`) {
      count(counters, 'dependencyGraph')
      if (controls.failGraph > 0) {
        controls.failGraph -= 1
        await fulfillFailure(route, '依赖图谱临时不可用')
        return
      }
      await fulfillJson(route, result(dependencyGraph))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await fulfillJson(route, result(null), 599)
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

async function expectLocatorTextNotClipped(locator: Locator, label: string) {
  const metrics = await locator.evaluate(element => {
    const style = window.getComputedStyle(element)
    return {
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      whiteSpace: style.whiteSpace,
      overflow: style.overflow,
      overflowWrap: style.overflowWrap,
      textOverflow: style.textOverflow,
      wordBreak: style.wordBreak,
    }
  })

  expect(metrics.width, `${label} must have visible width: ${JSON.stringify(metrics)}`).toBeGreaterThan(0)
  expect(metrics.height, `${label} must have visible height: ${JSON.stringify(metrics)}`).toBeGreaterThan(0)
  expect(metrics.whiteSpace, `${label} must allow multiline radio labels: ${JSON.stringify(metrics)}`).toBe('normal')
  expect(metrics.overflow, `${label} must not clip radio labels: ${JSON.stringify(metrics)}`).toBe('visible')
  expect(metrics.textOverflow, `${label} must not ellipsize radio labels: ${JSON.stringify(metrics)}`).toBe('clip')
  expect(
    metrics.overflowWrap === 'anywhere' || metrics.wordBreak === 'break-word',
    `${label} must break long radio labels: ${JSON.stringify(metrics)}`
  ).toBe(true)
  expect(metrics.scrollWidth - metrics.clientWidth, `${label} is horizontally clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(2)
}

async function assertGraphRadioReadable(page: Page, label: string) {
  const radioGroup = page.locator('.sl-graph-actions .ant-radio-group').first()
  await expect(radioGroup).toBeVisible()

  const graphRadio = radioGroup.locator('.ant-radio-button-wrapper').first()
  await expect(graphRadio).toBeVisible()
  await graphRadio.evaluate(element => {
    const labelSpan = element.querySelector('span:not(.ant-radio-button)')
    if (labelSpan) {
      labelSpan.textContent = 'dependency-graph-radio-view-mode-long-label-must-wrap-without-clipping'
    }
  })

  await expectLocatorTextNotClipped(graphRadio, `${label}:radio-button`)
  await expectNoHorizontalOverflow(page, `${label}:radio-group`)
}

for (const viewport of viewportMatrix) {
  test(`DependencyGraph failure is retryable on ${viewport.name}`, async ({ page }) => {
    const issues = installRuntimeGuards(page)
    const network = await installBatch4BMocks(page)
    network.controls.failGraph = 6

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/projects/${projectId}?tab=graph&scanTaskId=${scanTaskId}`)
    await expect(page.getByRole('heading', { name: 'Batch4B Graph Project' })).toBeVisible()
    const graphError = page.locator('.sl-state-block-error').filter({ hasText: '依赖图谱加载失败' }).first()
    await expect(graphError).toBeVisible()
    await expect(graphError).toContainText('依赖图谱临时不可用')

    await graphError.getByRole('button', { name: '重新加载图谱' }).click()
    await expect(page.locator('.sl-graph-workbench')).toBeVisible()
    await expect(page.getByRole('heading', { name: '依赖图谱与架构洞察' })).toBeVisible()
    await expect(page.getByText('Batch4BController').first()).toBeVisible()
    await expect(page.getByText('符号节点')).toBeVisible()
    await expect(page.getByText('依赖关系')).toBeVisible()
    await expect(page.locator('.sl-state-block-error').filter({ hasText: '依赖图谱加载失败' })).toHaveCount(0)
    await assertGraphRadioReadable(page, `dependency-graph-radio:${viewport.name}`)
    await expectNoHorizontalOverflow(page, `dependency-graph-batch4b:${viewport.name}`)

    expect(network.counters.dependencyGraph).toBeGreaterThanOrEqual(7)
    expect(network.unhandledApiRequests).toEqual([])
    expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  })
}

test.afterAll(() => {
  console.log('P9_MAIN_PATH_RECOVERABLE_ERROR_STATES_BATCH4B_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    pages: ['DependencyGraph'],
    retryableStates: {
      dependencyGraph: ['依赖图谱加载失败', '重新加载图谱', '依赖图谱与架构洞察'],
    },
    layoutReadability: {
      graphRadioLabelWrapsWithoutClipping: true,
      graphRadioGroupContained: true,
    },
    spec: 'p9-main-path-recoverable-error-states-batch4b.spec.ts',
  }))
})
