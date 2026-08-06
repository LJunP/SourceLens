import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type ApiCounters = Record<string, number>

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const rawActiveApiKeySecret = 'sk-model-config-raw-active-secret-20260709'
const rawInactiveApiKeySecret = 'sk-model-config-raw-inactive-secret-20260709'
const rawCreatedApiKeySecret = 'sk-model-config-raw-created-secret-20260709'
const forbiddenApiKeySecrets = [rawActiveApiKeySecret, rawInactiveApiKeySecret, rawCreatedApiKeySecret]
const providerQualityOverclaimPhrases = ['模型质量已验证', '供应商质量已验证', '供应商 SLA 已验证']
const llmFactOverclaimPhrases = ['LLM 事实正确已验证', '回答正确性已验证', '可保证正确']

const activeConfig = {
  id: 1001,
  provider: 'OPENAI',
  modelName: 'gpt-4o-mini',
  apiKey: rawActiveApiKeySecret,
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.2,
  maxTokens: 4096,
  isActive: true,
  createdAt: '2026-07-01T10:00:00Z',
  updatedAt: '2026-07-01T10:00:00Z',
}

const inactiveConfig = {
  id: 1002,
  provider: 'DEEPSEEK',
  modelName: 'deepseek-chat',
  apiKey: rawInactiveApiKeySecret,
  baseUrl: 'https://proxy.sourcelens.local/deepseek/v1',
  temperature: 0.1,
  maxTokens: 4096,
  isActive: false,
  createdAt: '2026-07-01T10:05:00Z',
  updatedAt: '2026-07-01T10:05:00Z',
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

async function installModelConfigMocks(page: Page) {
  const counters: ApiCounters = {}
  const controls = {
    failList: 0,
    failCreate: 0,
    failActivate: 0,
    failDelete: 0,
  }
  const unhandledApiRequests: string[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'model-config-recoverable-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'model_config_smoke', email: 'model-config@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/llm-configs') {
      count(counters, 'list')
      if (controls.failList > 0) {
        controls.failList -= 1
        await fulfillFailure(route, '模型配置服务暂不可用')
        return
      }
      await fulfillJson(route, result([activeConfig, inactiveConfig]))
      return
    }

    if (method === 'POST' && path === '/api/llm-configs') {
      count(counters, 'create')
      if (controls.failCreate > 0) {
        controls.failCreate -= 1
        await fulfillFailure(route, '模型密钥未通过安全策略校验')
        return
      }
      await fulfillJson(route, result({
        id: 1003,
        provider: 'OPENAI',
        modelName: 'gpt-4o',
        apiKey: rawCreatedApiKeySecret,
        baseUrl: 'https://api.openai.com/v1',
        temperature: 0.7,
        maxTokens: 4096,
        isActive: false,
        createdAt: '2026-07-01T10:10:00Z',
        updatedAt: '2026-07-01T10:10:00Z',
      }))
      return
    }

    if (method === 'POST' && path === `/api/llm-configs/${inactiveConfig.id}/activate`) {
      count(counters, 'activate')
      if (controls.failActivate > 0) {
        controls.failActivate -= 1
        await fulfillFailure(route, '模型激活被策略拦截')
        return
      }
      await fulfillJson(route, result({ ...inactiveConfig, isActive: true }))
      return
    }

    if (method === 'DELETE' && path === `/api/llm-configs/${inactiveConfig.id}`) {
      count(counters, 'delete')
      if (controls.failDelete > 0) {
        controls.failDelete -= 1
        await fulfillFailure(route, '模型配置仍被任务引用')
        return
      }
      await fulfillJson(route, result(null))
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

async function expectContainedInViewport(page: Page, selector: string, label: string) {
  const locator = page.locator(selector).first()
  await expect(locator, `${label} must be visible`).toBeVisible()
  await locator.scrollIntoViewIfNeeded()
  const layout = await locator.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return {
      x: rect.x,
      width: rect.width,
      innerWidth: window.innerWidth,
    }
  })
  expect(layout.x, `${label} must not overflow left`).toBeGreaterThanOrEqual(-1)
  expect(layout.x + layout.width, `${label} must not overflow right: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.innerWidth + 1)
}

async function expectReadableCriticalText(locator: Locator, label: string) {
  await expect(locator, `${label} must be visible`).toBeVisible()
  const metrics = await locator.evaluate(element => {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    return {
      width: rect.width,
      height: rect.height,
      lineHeight: Number.parseFloat(style.lineHeight),
      overflowWrap: style.overflowWrap,
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
    }
  })
  expect(metrics.width, `${label} must have measurable width`).toBeGreaterThan(24)
  expect(metrics.height, `${label} must have measurable height`).toBeGreaterThan(8)
  expect(['anywhere', 'break-word'].includes(metrics.overflowWrap), `${label} must wrap long text safely`).toBe(true)
  expect(metrics.whiteSpace, `${label} must not force single-line clipping`).not.toBe('nowrap')
  expect(metrics.textOverflow, `${label} must not hide text behind ellipsis`).toBe('clip')
}

async function expectModelProviderTableScrollerContained(page: Page, label: string) {
  await expectContainedInViewport(page, '.sl-model-provider-table', `${label}:provider-table`)
  const tableContent = page.locator('.sl-model-provider-table .ant-table-content').first()
  await expect(tableContent, `${label}:provider-table-scroller`).toBeVisible()
  const overflowX = await tableContent.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}: provider table content must own horizontal overflow, got ${overflowX}`).toBe(true)
  await expectNoHorizontalOverflow(page, `${label}:provider-table-scroller`)
}

async function assertModelConfigDisplayBoundaries(page: Page, label: string) {
  const bodyText = await page.locator('body').innerText()
  for (const secret of forbiddenApiKeySecrets) {
    expect(bodyText, `${label}: raw API key must not be rendered: ${secret}`).not.toContain(secret)
  }
  const providerQualityOverclaimAbsent = providerQualityOverclaimPhrases.every(phrase => !bodyText.includes(phrase))
  const llmFactOverclaimAbsent = llmFactOverclaimPhrases.every(phrase => !bodyText.includes(phrase))
  expect(providerQualityOverclaimAbsent, `${label}: provider quality overclaims must be absent`).toBe(true)
  expect(llmFactOverclaimAbsent, `${label}: LLM fact overclaims must be absent`).toBe(true)
  return {
    rawApiKeysHidden: true,
    providerQualityOverclaimAbsent,
    llmFactOverclaimAbsent,
  }
}

async function assertModelProviderGovernanceLoop(page: Page, label: string, expectedColumns: number) {
  const region = page.getByRole('region', { name: '模型供应商治理闭环' })
  await expect(region, `${label}:provider-governance-loop`).toBeVisible()
  await region.scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, -96))
  await expect(region).toContainText('模型供应商治理闭环')
  await expect(region).toContainText('激活门禁')
  await expect(region).toContainText('密钥边界')
  await expect(region).toContainText('Endpoint 风险')
  await expect(region).toContainText('下游能力')
  await expect(region).toContainText('1 个需复核')
  await expect(region.locator('.sl-model-provider-governance-step')).toHaveCount(4)
  await expect(region.locator('.sl-action-button-label')).toHaveCount(4)

  const gridColumns = await region.locator('.sl-model-provider-governance-grid').evaluate(element => {
    const columns = window.getComputedStyle(element).gridTemplateColumns
    return columns.split(' ').filter(Boolean).length
  })
  expect(gridColumns, `${label}: provider governance loop responsive columns`).toBe(expectedColumns)

  const readableCopy = region.locator('.sl-model-provider-governance-step-copy span, .sl-model-provider-governance-step-copy strong, .sl-model-provider-governance-step p')
  const copyCount = await readableCopy.count()
  expect(copyCount, `${label}: provider governance loop copy count`).toBeGreaterThanOrEqual(12)
  for (let index = 0; index < copyCount; index += 1) {
    await expectReadableCriticalText(readableCopy.nth(index), `${label}:provider-governance-copy:${index}`)
  }

  await expectContainedInViewport(page, '.sl-model-provider-governance', `${label}:provider-governance-loop`)
  await expectNoHorizontalOverflow(page, `${label}:provider-governance-loop`)

  const text = await region.innerText()
  return {
    visible: true,
    stepCount: 4,
    gridColumns,
    activationGateVisible: text.includes('激活门禁'),
    secretBoundaryVisible: text.includes('密钥边界'),
    endpointRiskVisible: text.includes('Endpoint 风险'),
    downstreamCapabilityVisible: text.includes('下游能力'),
    noHorizontalOverflow: true,
  }
}

test('ModelConfig surfaces recoverable provider config failures without losing the table context', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installModelConfigMocks(page)
  const visitedViewports: string[] = []
  const modelGovernanceProofs: Array<{
    viewport: string
    expectedColumns: number
    visible: boolean
    stepCount: number
    gridColumns: number
    activationGateVisible: boolean
    secretBoundaryVisible: boolean
    endpointRiskVisible: boolean
    downstreamCapabilityVisible: boolean
    noHorizontalOverflow: boolean
  }> = []
  const displayBoundaryProofs: Array<{
    viewport: string
    rawApiKeysHidden: boolean
    providerQualityOverclaimAbsent: boolean
    llmFactOverclaimAbsent: boolean
  }> = []

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    visitedViewports.push(`${viewport.width}x${viewport.height}`)

    network.controls.failList = 20
    await page.goto('/model-config')
    await expect(page.getByRole('heading', { name: '模型配置与密钥边界' })).toBeVisible()
    await expect(page.getByText('模型配置加载失败')).toBeVisible()
    await expect(page.locator('.sl-state-block-error').getByText('模型配置服务暂不可用')).toBeVisible()

    network.controls.failList = 0
    await page.getByRole('button', { name: '重新加载配置' }).click()
    await expect(page.getByRole('row', { name: new RegExp(activeConfig.modelName) })).toBeVisible()
    await expect(page.getByRole('row', { name: new RegExp(inactiveConfig.modelName) })).toBeVisible()
    const expectedGovernanceColumns = viewport.width <= 720 ? 1 : viewport.width <= 1200 ? 2 : 4
    modelGovernanceProofs.push({
      viewport: viewport.name,
      expectedColumns: expectedGovernanceColumns,
      ...(await assertModelProviderGovernanceLoop(page, `model-config:${viewport.name}:provider-governance-loop`, expectedGovernanceColumns)),
    })
    displayBoundaryProofs.push({
      viewport: viewport.name,
      ...(await assertModelConfigDisplayBoundaries(page, `model-config:${viewport.name}:display-boundaries`)),
    })
    await expectModelProviderTableScrollerContained(page, `model-config:${viewport.name}:loaded`)

    network.controls.failList = 20
    await page.getByRole('button', { name: '刷新' }).click()
    await expect(page.getByText('模型配置刷新失败，已保留上次成功数据')).toBeVisible()
    await expect(page.locator('.sl-state-block-error').getByText('模型配置服务暂不可用')).toBeVisible()
    await expect(page.getByRole('row', { name: new RegExp(activeConfig.modelName) })).toBeVisible()
    await expectModelProviderTableScrollerContained(page, `model-config:${viewport.name}:cached-refresh-error`)
    network.controls.failList = 0

    network.controls.failActivate = 1
    await page.getByRole('button', { name: '激活' }).click()
    await expect(page.getByText('模型激活失败')).toBeVisible()
    await expect(page.locator('.sl-state-block-error').getByText('模型激活被策略拦截')).toBeVisible()

    network.controls.failCreate = 1
    await page.getByRole('button', { name: '添加配置' }).click()
    await page.locator('#modelName').fill('gpt-4o')
    await page.locator('#apiKey').fill('sk-model-config-smoke')
    await page.locator('#baseUrl').fill('https://api.openai.com/v1')
    await page.locator('.ant-modal-footer .ant-btn-primary').click()
    const modal = page.locator('.ant-modal').filter({ hasText: '添加模型配置' })
    await expect(modal.getByText('模型配置创建失败')).toBeVisible()
    await expect(modal.getByText('模型密钥未通过安全策略校验')).toBeVisible()
    await page.keyboard.press('Escape')

    network.controls.failDelete = 1
    await page.getByRole('button', { name: `删除模型配置 ${inactiveConfig.modelName}` }).click()
    await page.locator('.ant-popover .ant-btn-primary').click()
    await expect(page.getByText('模型配置删除失败')).toBeVisible()
    await expect(page.locator('.sl-state-block-error').getByText('模型配置仍被任务引用')).toBeVisible()

    await expectNoHorizontalOverflow(page, `model-config:${viewport.name}`)
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in model config smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('MODEL_CONFIG_RECOVERABLE_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: visitedViewports,
    assertions: [
      'initial-load-error-state',
      'retry-recovers-provider-table',
      'cached-refresh-error-preserves-table',
      'provider-table-scroller-contained',
      'provider-governance-loop-readable',
      'activate-failure-governance-state',
      'create-failure-inline-modal-state',
      'delete-failure-governance-state',
      'no-horizontal-overflow',
    ],
    tableScroller: {
      providerTableContained: true,
      overflowXAuto: true,
    },
    providerGovernanceLoop: {
      scope: 'MODEL_CONFIG_PROVIDER_GOVERNANCE_LOOP_READABILITY',
      surface: 'ACTIVATION_SECRET_ENDPOINT_DOWNSTREAM_GATE',
      visible: modelGovernanceProofs.every(proof => proof.visible),
      stepCount: modelGovernanceProofs.every(proof => proof.stepCount === 4) ? 4 : 0,
      expectedColumnsHonored: modelGovernanceProofs.every(proof => proof.gridColumns === proof.expectedColumns),
      desktopColumns: modelGovernanceProofs.some(proof => proof.viewport === 'desktop' && proof.gridColumns === 4),
      mobileColumns: modelGovernanceProofs
        .filter(proof => proof.viewport === 'mobile' || proof.viewport === 'narrow')
        .every(proof => proof.gridColumns === 1),
      activationGateVisible: modelGovernanceProofs.every(proof => proof.activationGateVisible),
      secretBoundaryVisible: modelGovernanceProofs.every(proof => proof.secretBoundaryVisible),
      endpointRiskVisible: modelGovernanceProofs.every(proof => proof.endpointRiskVisible),
      downstreamCapabilityVisible: modelGovernanceProofs.every(proof => proof.downstreamCapabilityVisible),
      apiKeyPlaintextRendered: displayBoundaryProofs.some(proof => !proof.rawApiKeysHidden),
      providerQualityClaim: displayBoundaryProofs.some(proof => !proof.providerQualityOverclaimAbsent),
      llmFactClaim: displayBoundaryProofs.some(proof => !proof.llmFactOverclaimAbsent),
      noHorizontalOverflow: modelGovernanceProofs.every(proof => proof.noHorizontalOverflow),
    },
    displayBoundaries: {
      rawApiKeysHidden: displayBoundaryProofs.every(proof => proof.rawApiKeysHidden),
      providerQualityOverclaimAbsent: displayBoundaryProofs.every(proof => proof.providerQualityOverclaimAbsent),
      llmFactOverclaimAbsent: displayBoundaryProofs.every(proof => proof.llmFactOverclaimAbsent),
    },
    counters: network.counters,
  }))
})
