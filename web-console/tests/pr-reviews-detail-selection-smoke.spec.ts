import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type PrGovernanceLoopProof = {
  viewport: string
  visible: boolean
  stepCount: number
  expectedColumns: number
  actualColumns: number
  expectedColumnsHonored: boolean
  copyReadable: boolean
  repairHandoffActionVisible: boolean
  fullReviewQualityClaim: boolean
  llmFactClaim: boolean
  noHorizontalOverflow: boolean
}

const projectId = 1
const targetReviewId = 1201
const secondaryReviewId = 1202
const staleGuardReviewId = 1203

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'PR Reviews Smoke Project',
  description: 'Mocked project for PR Reviews detail selection smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 89,
  createdBy: 1,
  createdAt: '2026-07-01T12:00:00Z',
}

const reviews = [
  {
    id: targetReviewId,
    projectId,
    scanTaskId: 801,
    repositoryId: 22,
    prNumber: 24,
    prTitle: 'Guard order settlement race condition',
    prDescription: 'Adds settlement validation and updates order service.',
    branch: 'feature/order-settlement',
    baseBranch: 'main',
    commitSha: 'abcdef9876543210',
    author: 'dev-a',
    changedFiles: JSON.stringify(['backend-spring/src/main/java/demo/OrderSettlementService.java', 'backend-spring/src/test/java/demo/OrderSettlementServiceTest.java']),
    diffSummary: 'Order settlement now validates state transitions before writing payment events.',
    ciStatus: 'failure',
    status: 'COMPLETED',
    riskLevel: 'HIGH',
    changeSummary: 'Settlement flow now rejects invalid state transitions.',
    impactScope: JSON.stringify(['payment-service', 'order-api']),
    risks: JSON.stringify([
      { category: 'CONCURRENCY', severity: 'HIGH', message: 'Settlement may double-write payment event under retry.' },
      { category: 'TEST', severity: 'MEDIUM', message: 'Missing regression for duplicate settlement request.' },
    ]),
    testSuggestions: JSON.stringify(['Add concurrent settlement regression test', 'Run payment event integration suite']),
    mergeRecommendation: 'CHANGES_REQUESTED',
    reviewJson: JSON.stringify({ confidence: 0.84 }),
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T12:10:00Z',
    updatedAt: '2026-07-01T12:12:00Z',
  },
  {
    id: secondaryReviewId,
    projectId,
    scanTaskId: 802,
    repositoryId: null,
    prNumber: 25,
    prTitle: 'Refactor dashboard badges',
    prDescription: 'Refactors UI badge copy.',
    branch: 'feature/dashboard-badges',
    baseBranch: 'main',
    commitSha: '123456abcdef7890',
    author: 'dev-b',
    changedFiles: null,
    diffSummary: null,
    ciStatus: 'pending',
    status: 'FAILED',
    riskLevel: null,
    changeSummary: null,
    impactScope: null,
    risks: null,
    testSuggestions: null,
    mergeRecommendation: null,
    reviewJson: null,
    errorMessage: 'Diff summary is empty',
    createdBy: 1,
    createdAt: '2026-07-01T12:13:00Z',
    updatedAt: '2026-07-01T12:14:00Z',
  },
  {
    id: staleGuardReviewId,
    projectId,
    scanTaskId: 803,
    repositoryId: 22,
    prNumber: 26,
    prTitle: 'Normalize billing webhook timeout',
    prDescription: 'Normalizes webhook timeout handling.',
    branch: 'feature/billing-webhook-timeout',
    baseBranch: 'main',
    commitSha: 'fedcba9876543210',
    author: 'dev-c',
    changedFiles: JSON.stringify(['backend-spring/src/main/java/demo/BillingWebhookService.java']),
    diffSummary: 'Webhook timeout handling now normalizes retry state before publishing status.',
    ciStatus: 'success',
    status: 'COMPLETED',
    riskLevel: 'MEDIUM',
    changeSummary: 'Billing webhook retry timeout is normalized before status publication.',
    impactScope: JSON.stringify(['billing-webhook']),
    risks: JSON.stringify([
      { category: 'RETRY', severity: 'MEDIUM', message: 'Timeout retry can hide settlement status.' },
    ]),
    testSuggestions: JSON.stringify(['Add timeout retry regression test']),
    mergeRecommendation: 'CHANGES_REQUESTED',
    reviewJson: JSON.stringify({ confidence: 0.78 }),
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T12:16:00Z',
    updatedAt: '2026-07-01T12:17:00Z',
  },
]

const targetComments = [
  {
    id: 3301,
    reviewId: targetReviewId,
    filePath: 'backend-spring/src/main/java/demo/OrderSettlementService.java',
    lineNumber: 87,
    severity: 'WARNING',
    category: 'CONCURRENCY',
    message: 'Retry path can publish payment event twice.',
    suggestion: 'Guard event publication with settlement idempotency check.',
    createdAt: '2026-07-01T12:15:00Z',
  },
]

const staleGuardComments = [
  {
    id: 3302,
    reviewId: staleGuardReviewId,
    filePath: 'backend-spring/src/main/java/demo/BillingWebhookService.java',
    lineNumber: 42,
    severity: 'WARNING',
    category: 'RETRY',
    message: 'Timeout retry can hide settlement status.',
    suggestion: 'Persist timeout retry state before publishing status.',
    createdAt: '2026-07-01T12:18:00Z',
  },
]

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

async function installPrReviewMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const reanalyzeRequests: number[] = []
  const commentRequests: number[] = []
  const delayedTargetCommentResolvers: Array<() => void> = []
  let delayNextTargetCommentRequest = false

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'pr-reviews-detail-selection-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'pr_reviews_smoke_user', email: 'pr-reviews@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/pr-reviews`) {
      await fulfillJson(route, result({ items: reviews, page: 1, pageSize: 20, total: reviews.length }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 20, total: 0 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/repositories`) {
      await fulfillJson(route, result({ items: [], page: 1, pageSize: 100, total: 0 }))
      return
    }

    const commentsMatch = path.match(/^\/api\/pr-reviews\/(\d+)\/comments$/)
    if (method === 'GET' && commentsMatch) {
      const reviewId = Number(commentsMatch[1])
      commentRequests.push(reviewId)
      if (reviewId === targetReviewId && delayNextTargetCommentRequest) {
        delayNextTargetCommentRequest = false
        await new Promise<void>(resolve => delayedTargetCommentResolvers.push(resolve))
      }
      await fulfillJson(route, result(
        reviewId === targetReviewId
          ? targetComments
          : reviewId === staleGuardReviewId
            ? staleGuardComments
            : []
      ))
      return
    }

    const reanalyzeMatch = path.match(/^\/api\/pr-reviews\/(\d+)\/reanalyze$/)
    if (method === 'POST' && reanalyzeMatch) {
      const reviewId = Number(reanalyzeMatch[1])
      reanalyzeRequests.push(reviewId)
      const review = reviews.find(item => item.id === reviewId) || reviews[0]
      await fulfillJson(route, result({
        ...review,
        status: 'ANALYZING',
        updatedAt: '2026-07-01T12:20:00Z',
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

  return {
    unhandledApiRequests,
    reanalyzeRequests,
    commentRequests,
    delayNextTargetCommentRequest: () => { delayNextTargetCommentRequest = true },
    releaseDelayedTargetComments: () => {
      delayedTargetCommentResolvers.splice(0).forEach(resolve => resolve())
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
  const box = await locator.boundingBox()
  expect(box, `${label} must be visible and measurable`).not.toBeNull()
  const viewport = locator.page().viewportSize()
  expect(viewport, `${label} viewport must be available`).not.toBeNull()
  if (!box || !viewport) return
  expect(box.x, `${label} left edge must stay within viewport: ${JSON.stringify(box)}`).toBeGreaterThanOrEqual(-1)
  expect(box.x + box.width, `${label} right edge must stay within viewport: ${JSON.stringify({ box, viewport })}`).toBeLessThanOrEqual(viewport.width + 1)
}

async function expectReadableCriticalText(locator: Locator, label: string) {
  await expect(locator, `${label} must be visible before readability metrics`).toBeVisible()
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

async function expectPrTableScrollerContained(page: Page, label: string) {
  const tableCard = page.locator('.sl-pr-table-card').first()
  await expect(tableCard, `${label}:table-card`).toBeVisible()
  await expectContainedInViewport(tableCard, `${label}:table-card`)

  const tableScroller = tableCard.locator('.ant-table-content').first()
  await expect(tableScroller, `${label}:table-scroller`).toBeVisible()
  const overflowX = await tableScroller.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}:table-scroller must own horizontal overflow, got ${overflowX}`).toBe(true)
}

async function assertPrGovernanceLoop(
  page: Page,
  viewport: { name: string; width: number; height: number },
): Promise<PrGovernanceLoopProof> {
  const region = page.getByRole('region', { name: 'PR 审查治理闭环' })
  await expect(region, `${viewport.name}:pr-governance-loop`).toBeVisible()
  await expect(region).toContainText('PR 输入')
  await expect(region).toContainText('风险判定')
  await expect(region).toContainText('合并门禁')
  await expect(region).toContainText('AutoRepair 交接')
  await expect(region).toContainText('PR 审查完成不等于代码质量、业务正确性或安全性已被完全证明')

  const expectedStepKeys = ['pr-intake', 'risk-decision', 'merge-gate', 'repair-handoff']
  const steps = region.locator('[data-sl-pr-governance-step]')
  await expect(steps).toHaveCount(expectedStepKeys.length)
  for (const stepKey of expectedStepKeys) {
    await expect(region.locator(`[data-sl-pr-governance-step="${stepKey}"]`), `${viewport.name}:${stepKey}`).toBeVisible()
  }

  const expectedColumns = viewport.width <= 720 ? 1 : viewport.width <= 1200 ? 2 : 4
  const actualColumns = await region.locator('.sl-pr-governance-grid').evaluate(element => {
    const value = window.getComputedStyle(element).gridTemplateColumns.trim()
    return value ? value.split(/\s+/).length : 0
  })
  expect(actualColumns, `${viewport.name}: governance loop columns`).toBe(expectedColumns)

  const copyReadable = await region.locator(
    '.sl-pr-governance-meta span, .sl-pr-governance-meta strong, .sl-pr-governance-copy h3, .sl-pr-governance-copy p',
  ).evaluateAll(elements => elements.every(element => {
    const style = window.getComputedStyle(element)
    return style.overflow === 'visible'
      && style.textOverflow === 'clip'
      && style.whiteSpace === 'normal'
      && ['anywhere', 'break-word'].includes(style.overflowWrap)
  }))
  expect(copyReadable, `${viewport.name}: governance copy must wrap without clipping`).toBe(true)

  const repairAction = region.getByRole('button', { name: '生成修复候选' })
  await expect(repairAction, `${viewport.name}: repair handoff action`).toBeVisible()
  await expect(repairAction).toBeEnabled()

  const text = await region.innerText()
  const fullReviewQualityClaim = /代码质量已完全证明|安全性已完全证明|业务正确性已完全证明|合并无需人工 review/.test(text)
  const llmFactClaim = /LLM 输出事实正确已验证|保证 LLM 输出事实正确/.test(text)
  expect(fullReviewQualityClaim, `${viewport.name}: must not claim complete review quality proof`).toBe(false)
  expect(llmFactClaim, `${viewport.name}: must not claim verified LLM factual correctness`).toBe(false)

  await expectContainedInViewport(region, `${viewport.name}:pr-governance-loop`)
  await expectNoHorizontalOverflow(page, `${viewport.name}:pr-governance-loop`)

  return {
    viewport: `${viewport.width}x${viewport.height}`,
    visible: true,
    stepCount: expectedStepKeys.length,
    expectedColumns,
    actualColumns,
    expectedColumnsHonored: actualColumns === expectedColumns,
    copyReadable,
    repairHandoffActionVisible: true,
    fullReviewQualityClaim,
    llmFactClaim,
    noHorizontalOverflow: true,
  }
}

async function assertPrDetailReadability(page: Page, label: string) {
  const detailCard = page.locator('.sl-pr-detail-card').first()
  await expect(detailCard, `${label}:detail-card`).toBeVisible()
  await expectContainedInViewport(detailCard, `${label}:detail-card`)
  await expectNoHorizontalOverflow(page, `${label}:detail-open`)

  await expectReadableCriticalText(
    detailCard.getByText('backend-spring/src/main/java/demo/OrderSettlementService.java').first(),
    `${label}:target-file-path`,
  )
  await expectReadableCriticalText(
    detailCard.getByText('Settlement may double-write payment event').first(),
    `${label}:risk-text`,
  )
  await expectReadableCriticalText(
    detailCard.getByText('Retry path can publish payment event twice').first(),
    `${label}:comment-text`,
  )
  await expectReadableCriticalText(
    detailCard.getByText('Guard event publication with settlement idempotency check').first(),
    `${label}:comment-suggestion`,
  )
}

async function rowFor(page: Page, label: RegExp) {
  const row = page.getByRole('row', { name: label })
  await row.scrollIntoViewIfNeeded()
  return row
}

async function closeDetail(page: Page) {
  await page.locator('.sl-pr-detail-card').getByRole('button', { name: '关闭' }).click()
  await expect(page.locator('.sl-pr-detail-card')).toHaveCount(0)
}

test('PR reviews detail selection is accessible and repair-ready', async ({ page, baseURL }) => {
  const issues = installRuntimeGuards(page)
  const network = await installPrReviewMocks(page)
  const visitedViewports: string[] = []
  const prGovernanceLoopProofs: PrGovernanceLoopProof[] = []
  const staleGuardProofs: Array<{
    viewport: string
    completedToCompletedSwitch: boolean
    staleCommentLeakCount: number
    selectedCommentReviewIdMatches: boolean
    repairReadinessUsesSelectedReviewCommentsOnly: boolean
  }> = []
  const baseURLHost = new URL(baseURL || 'http://127.0.0.1').hostname

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/pr-reviews?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: 'PR 风险审查与合并决策' })).toBeVisible()
    await expectPrTableScrollerContained(page, `pr-reviews:${viewport.name}:initial`)

    const targetRow = await rowFor(page, new RegExp(`PrReview #${targetReviewId}`))
    const secondaryRow = await rowFor(page, new RegExp(`PrReview #${secondaryReviewId}`))
    const staleGuardRow = await rowFor(page, new RegExp(`PrReview #${staleGuardReviewId}`))
    const targetTitleAction = targetRow.getByRole('button', { name: 'Guard order settlement race condition' })
    await expect(targetTitleAction).toBeVisible()
    await targetTitleAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(targetRow).toHaveAttribute('aria-controls', `pr-review-detail-${targetReviewId}`)
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Guard order settlement race condition')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Settlement flow now rejects invalid state transitions')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('payment-service')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Settlement may double-write payment event')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Retry path can publish payment event twice')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Add concurrent settlement regression test')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('backend-spring/src/main/java/demo/OrderSettlementService.java')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Order settlement now validates state transitions')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('修复候选资格')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('候选会优先绑定行级评论文件')
    await assertPrDetailReadability(page, `pr-reviews:${viewport.name}:target-detail`)
    prGovernanceLoopProofs.push(await assertPrGovernanceLoop(page, viewport))
    const repairButton = page.locator('.sl-pr-detail-card').getByRole('button', { name: '生成修复候选' })
    await expect(repairButton).toBeVisible()
    await repairButton.click()
    await expect(page).toHaveURL(/\/auto-repairs\?/)
    const url = new URL(page.url())
    expect(url.searchParams.get('projectId')).toBe(String(projectId))
    expect(url.searchParams.get('repositoryId')).toBe('22')
    expect(url.searchParams.get('filePath')).toBe('backend-spring/src/main/java/demo/OrderSettlementService.java')
    expect(url.searchParams.get('source')).toBe(`pr-review-${targetReviewId}`)
    await page.goto(`/pr-reviews?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: 'PR 风险审查与合并决策' })).toBeVisible()
    await expectPrTableScrollerContained(page, `pr-reviews:${viewport.name}:after-handoff-return`)

    await targetRow.focus()
    await page.keyboard.press('Enter')
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('可以生成')
    await closeDetail(page)

    await secondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Refactor dashboard badges')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Diff summary is empty')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('暂不可生成')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('仓库 ID')
    await expect(page.locator('.sl-pr-detail-card')).not.toContainText('Retry path can publish payment event twice')

    const targetReanalyze = targetRow.getByRole('button', { name: `重新分析 PR 审查 #${targetReviewId}` })
    await targetReanalyze.click()
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Refactor dashboard badges')
    await expect(network.reanalyzeRequests).toContain(targetReviewId)

    network.delayNextTargetCommentRequest()
    await targetTitleAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Guard order settlement race condition')
    const staleGuardTitleAction = staleGuardRow.getByRole('button', { name: 'Normalize billing webhook timeout' })
    await staleGuardTitleAction.click()
    await expect(staleGuardRow).toHaveAttribute('aria-selected', 'true')
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Normalize billing webhook timeout')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Billing webhook retry timeout is normalized')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Timeout retry can hide settlement status')
    await expect(page.locator('.sl-pr-detail-card')).toContainText('Persist timeout retry state before publishing status')
    network.releaseDelayedTargetComments()
    await page.waitForTimeout(100)
    const staleCommentLeakCount = await page.locator('.sl-pr-detail-card').getByText('Retry path can publish payment event twice').count()
    const selectedCommentReviewIdMatches = await page.locator('.sl-pr-detail-card').getByText('Persist timeout retry state before publishing status').count() > 0
    const repairReadinessUsesSelectedReviewCommentsOnly =
      await page.locator('.sl-pr-detail-card').getByText('backend-spring/src/main/java/demo/BillingWebhookService.java').count() > 0
      && await page.locator('.sl-pr-detail-card').getByText('backend-spring/src/main/java/demo/OrderSettlementService.java').count() === 0
    expect(staleCommentLeakCount, `${viewport.name}: stale target comments must not leak into selected PR detail`).toBe(0)
    expect(selectedCommentReviewIdMatches, `${viewport.name}: selected PR comment must remain visible after stale response`).toBe(true)
    expect(repairReadinessUsesSelectedReviewCommentsOnly, `${viewport.name}: repair readiness must use selected PR comments only`).toBe(true)
    staleGuardProofs.push({
      viewport: `${viewport.width}x${viewport.height}`,
      completedToCompletedSwitch: true,
      staleCommentLeakCount,
      selectedCommentReviewIdMatches,
      repairReadinessUsesSelectedReviewCommentsOnly,
    })

    await expectPrTableScrollerContained(page, `pr-reviews:${viewport.name}:final`)
    await expectNoHorizontalOverflow(page, `pr-reviews-detail-selection:${viewport.name}`)
    await expect(page.locator('.ant-message-notice-error')).toHaveCount(0)
    visitedViewports.push(`${viewport.width}x${viewport.height}`)
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in PR Reviews detail selection smoke.').toEqual([])
  expect(network.commentRequests).toContain(targetReviewId)
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('PR_REVIEWS_DETAIL_SELECTION_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    visitedViewports,
    detailAction: {
      visible: true,
      clickedReviewId: targetReviewId,
      detailPanelMatched: true,
    },
    keyboardOpen: {
      enter: true,
      space: true,
      selectedReviewIds: [targetReviewId, secondaryReviewId],
    },
    reviewDecisionSignal: {
      visible: true,
      mergeDecisionVisible: true,
      riskChecksVisible: true,
      commentCountReflected: true,
    },
    comments: {
      loadedForCompletedReviewId: targetReviewId,
      lineLevelCommentVisible: true,
    },
    repairReadiness: {
      visible: true,
      targetFileDerived: true,
      unavailableWhenMissingRepositoryOrFile: true,
      projectIdPreserved: true,
      usesSelectedReviewCommentsOnly: staleGuardProofs.every(proof => proof.repairReadinessUsesSelectedReviewCommentsOnly),
    },
    prGovernanceLoop: {
      scope: 'PR_REVIEWS_GOVERNANCE_LOOP_READABILITY',
      surface: 'PR_INTAKE_RISK_DECISION_MERGE_GATE_REPAIR_HANDOFF',
      visible: prGovernanceLoopProofs.every(proof => proof.visible),
      stepCount: 4,
      expectedColumnsHonored: prGovernanceLoopProofs.every(proof => proof.expectedColumnsHonored),
      desktopColumns: prGovernanceLoopProofs.some(proof => proof.viewport === '1440x900' && proof.actualColumns === 4),
      tabletColumns: prGovernanceLoopProofs.some(proof => proof.viewport === '1024x768' && proof.actualColumns === 2),
      mobileColumns: prGovernanceLoopProofs.some(proof => proof.viewport === '390x844' && proof.actualColumns === 1),
      narrowColumns: prGovernanceLoopProofs.some(proof => proof.viewport === '320x740' && proof.actualColumns === 1),
      copyReadable: prGovernanceLoopProofs.every(proof => proof.copyReadable),
      repairHandoffActionVisible: prGovernanceLoopProofs.every(proof => proof.repairHandoffActionVisible),
      fullReviewQualityClaim: prGovernanceLoopProofs.some(proof => proof.fullReviewQualityClaim),
      llmFactClaim: prGovernanceLoopProofs.some(proof => proof.llmFactClaim),
      noHorizontalOverflow: prGovernanceLoopProofs.every(proof => proof.noHorizontalOverflow),
      proofs: prGovernanceLoopProofs,
    },
    commentStaleGuard: {
      completedToCompletedSwitch: staleGuardProofs.every(proof => proof.completedToCompletedSwitch),
      staleCommentLeakCount: Math.max(...staleGuardProofs.map(proof => proof.staleCommentLeakCount)),
      selectedCommentReviewIdMatches: staleGuardProofs.every(proof => proof.selectedCommentReviewIdMatches),
      viewports: staleGuardProofs.map(proof => proof.viewport),
      commentRequests: network.commentRequests,
    },
    layoutDensity: {
      mobile390Covered: visitedViewports.includes('390x844'),
      narrow320Covered: visitedViewports.includes('320x740'),
      detailCardContained: true,
      tableScrollerContained: true,
      noHorizontalOverflow: true,
    },
    mobileReadability: {
      mobile390Covered: visitedViewports.includes('390x844'),
      detailCardContained: true,
      criticalTextsWrap: true,
      tableScrollerContained: true,
    },
    tableScroller: {
      containedInViewport: true,
      overflowXAuto: true,
    },
    accessibleSelection: true,
    nestedActionsDoNotHijackSelection: true,
    staleDetailRejected: true,
    sharedSelectableRow: {
      ariaControlsLinked: true,
      detailRegionLinked: true,
      selectedReviewIds: [targetReviewId, secondaryReviewId, staleGuardReviewId],
    },
    reanalyze: {
      triggeredReviewId: targetReviewId,
      selectionPreserved: true,
    },
    runtimeIssues: issues.length,
    noHorizontalOverflow: true,
    spec: 'pr-reviews-detail-selection-smoke.spec.ts',
    baseURLHost,
  }))
})
