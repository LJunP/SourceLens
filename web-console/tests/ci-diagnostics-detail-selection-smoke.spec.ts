import { expect, test, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type CiGovernanceLoopProof = {
  viewport: string
  visible: boolean
  stepCount: number
  expectedColumns: number
  actualColumns: number
  expectedColumnsHonored: boolean
  copyReadable: boolean
  repairHandoffActionVisible: boolean
  fullRepairQualityClaim: boolean
  llmFactClaim: boolean
  noHorizontalOverflow: boolean
}

const projectId = 1
const targetDiagnosticId = 301
const secondaryDiagnosticId = 302
const detachedDiagnosticId = 399
const ciLogSafeContext = 'CI_LOG_SAFE_CONTEXT'
const ciRawBearerSecret = 'Bearer ci-diagnostics-bearer-should-not-render'
const ciRawAuthorizationSecret = `Authorization: ${ciRawBearerSecret}`
const ciRawApiKeySecret = 'sk-cidiagnosticssecretshouldnotrender123456789'
const ciRawPasswordSecret = 'ci-diagnostics-password-should-not-render'
const ciRawQuotedSecret = 'quoted ci diagnostics secret should not render'
const ciRawJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJjaSI6ImRpYWdub3N0aWNzIn0.ciDiagnosticsSignatureShouldNotRender'
const ciRawPrivateKeySecret = 'ci-diagnostics-private-key-should-not-render'
const forbiddenCiLogSecretSnippets = [
  ciRawBearerSecret,
  ciRawAuthorizationSecret,
  ciRawApiKeySecret,
  ciRawPasswordSecret,
  ciRawQuotedSecret,
  ciRawJwtSecret,
  ciRawPrivateKeySecret,
]

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'CI Diagnostics Smoke Project',
  description: 'Mocked project for CI diagnostics detail selection smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 91,
  createdBy: 1,
  createdAt: '2026-07-01T11:00:00Z',
}

const diagnostics = [
  {
    id: targetDiagnosticId,
    projectId,
    scanTaskId: 701,
    repositoryId: 11,
    provider: 'GITHUB_ACTIONS',
    workflowName: 'CI Build',
    workflowRunId: 'run-301',
    runNumber: 24,
    branch: 'main',
    commitSha: 'abcdef1234567890',
    commitMessage: 'Fix order validation',
    status: 'COMPLETED',
    conclusion: 'failure',
    failureSummary: 'Maven test phase failed in OrderServiceTest',
    errorCategory: 'TEST',
    rootCause: 'OrderService rejects null status after validation refactor.',
    relatedFiles: JSON.stringify(['backend-spring/src/main/java/demo/OrderService.java', 'backend-spring/src/test/java/demo/OrderServiceTest.java']),
    fixSuggestions: JSON.stringify(['Restore null-safe status handling', 'Add regression assertion for empty order status']),
    rawLogSnippet: [
      `${ciLogSafeContext}: OrderServiceTest.shouldHandleEmptyStatus expected 200 but was 500`,
      ciRawAuthorizationSecret,
      ciRawBearerSecret,
      `apiKey=${ciRawApiKeySecret}`,
      `password="${ciRawPasswordSecret}"`,
      `secret="${ciRawQuotedSecret}"`,
      `privateKey=${ciRawPrivateKeySecret}`,
      ciRawJwtSecret,
    ].join('\n'),
    diagnosticJson: JSON.stringify({ confidence: 0.86 }),
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T11:10:00Z',
    updatedAt: '2026-07-01T11:12:00Z',
  },
  {
    id: secondaryDiagnosticId,
    projectId,
    scanTaskId: 702,
    repositoryId: null,
    provider: 'GITHUB_ACTIONS',
    workflowName: 'Lint Gate',
    workflowRunId: 'run-302',
    runNumber: 25,
    branch: 'feature/ui-polish',
    commitSha: '1234567890abcdef',
    commitMessage: 'Polish diagnostics UI',
    status: 'FAILED',
    conclusion: 'failure',
    failureSummary: null,
    errorCategory: 'LINT',
    rootCause: null,
    relatedFiles: null,
    fixSuggestions: null,
    rawLogSnippet: 'eslint exited with code 1',
    diagnosticJson: null,
    errorMessage: 'Model provider timeout',
    createdBy: 1,
    createdAt: '2026-07-01T11:13:00Z',
    updatedAt: '2026-07-01T11:14:00Z',
  },
]

const detachedDiagnostic = {
  ...diagnostics[0],
  id: detachedDiagnosticId,
  workflowName: 'Detached CI Build',
  workflowRunId: 'run-399',
  runNumber: 99,
  failureSummary: 'Detached diagnostic loaded from source deep link',
  rootCause: 'The target diagnostic is not present in the current list page.',
  rawLogSnippet: 'DetachedCiTest.shouldHydrateFromDetailApi expected selected detail',
  createdAt: '2026-07-01T11:30:00Z',
  updatedAt: '2026-07-01T11:31:00Z',
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

async function installCiDiagnosticsMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const reanalyzeRequests: number[] = []
  const detailRequests: number[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'ci-diagnostics-detail-selection-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'ci_diagnostics_smoke_user', email: 'ci-diagnostics@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/ci-diagnostics`) {
      await fulfillJson(route, result({ items: diagnostics, page: 1, pageSize: 20, total: diagnostics.length }))
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

    const detailMatch = path.match(/^\/api\/ci-diagnostics\/(\d+)$/)
    if (method === 'GET' && detailMatch) {
      const diagnosticId = Number(detailMatch[1])
      detailRequests.push(diagnosticId)
      const diagnostic = diagnosticId === detachedDiagnosticId
        ? detachedDiagnostic
        : diagnostics.find(item => item.id === diagnosticId)
      if (diagnostic) {
        await fulfillJson(route, result(diagnostic))
        return
      }
    }

    const reanalyzeMatch = path.match(/^\/api\/ci-diagnostics\/(\d+)\/reanalyze$/)
    if (method === 'POST' && reanalyzeMatch) {
      const diagnosticId = Number(reanalyzeMatch[1])
      reanalyzeRequests.push(diagnosticId)
      const diagnostic = diagnostics.find(item => item.id === diagnosticId) || diagnostics[0]
      await fulfillJson(route, result({
        ...diagnostic,
        status: 'ANALYZING',
        updatedAt: '2026-07-01T11:20:00Z',
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

  return { unhandledApiRequests, reanalyzeRequests, detailRequests }
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

async function expectCiDiagnosticsTableScrollerContained(page: Page, label: string) {
  await expectContainedInViewport(page, '.sl-ci-diagnostics-table', `${label}:diagnostics-table`)
  const tableContent = page.locator('.sl-ci-diagnostics-table .ant-table-content').first()
  await expect(tableContent, `${label}:diagnostics-table-scroller`).toBeVisible()
  const overflowX = await tableContent.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}: diagnostics table content must own horizontal overflow, got ${overflowX}`).toBe(true)
  await expectNoHorizontalOverflow(page, `${label}:diagnostics-table-scroller`)
}

async function assertCiGovernanceLoop(
  page: Page,
  viewport: { name: string; width: number; height: number },
): Promise<CiGovernanceLoopProof> {
  const region = page.getByRole('region', { name: 'CI 失败诊断治理闭环' })
  await expect(region, `${viewport.name}:ci-governance-loop`).toBeVisible()
  await expect(region).toContainText('日志接入')
  await expect(region).toContainText('根因证据')
  await expect(region).toContainText('修复资格')
  await expect(region).toContainText('AutoRepair 交接')
  await expect(region).toContainText('诊断完成不代表根因正确或 LLM 输出事实正确')

  const expectedStepKeys = ['log-intake', 'root-cause-evidence', 'repair-gate', 'autorepair-handoff']
  const steps = region.locator('[data-sl-ci-governance-step]')
  await expect(steps).toHaveCount(expectedStepKeys.length)
  for (const stepKey of expectedStepKeys) {
    await expect(region.locator(`[data-sl-ci-governance-step="${stepKey}"]`), `${viewport.name}:${stepKey}`).toBeVisible()
  }

  const expectedColumns = viewport.width <= 720 ? 1 : viewport.width <= 1200 ? 2 : 4
  const actualColumns = await region.locator('.sl-ci-governance-grid').evaluate(element => {
    const value = window.getComputedStyle(element).gridTemplateColumns.trim()
    return value ? value.split(/\s+/).length : 0
  })
  expect(actualColumns, `${viewport.name}: governance loop columns`).toBe(expectedColumns)

  const copyReadable = await region.locator(
    '.sl-ci-governance-meta span, .sl-ci-governance-meta strong, .sl-ci-governance-copy h3, .sl-ci-governance-copy p',
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
  const fullRepairQualityClaim = /保证修复正确|修复正确已验证|根因正确已验证/.test(text)
  const llmFactClaim = /LLM 输出事实正确已验证|保证 LLM 输出事实正确/.test(text)
  expect(fullRepairQualityClaim, `${viewport.name}: must not claim verified repair correctness`).toBe(false)
  expect(llmFactClaim, `${viewport.name}: must not claim verified LLM factual correctness`).toBe(false)

  await expectContainedInViewport(page, '.sl-ci-governance-loop', `${viewport.name}:ci-governance-loop`)
  await expectNoHorizontalOverflow(page, `${viewport.name}:ci-governance-loop`)

  return {
    viewport: `${viewport.width}x${viewport.height}`,
    visible: true,
    stepCount: expectedStepKeys.length,
    expectedColumns,
    actualColumns,
    expectedColumnsHonored: actualColumns === expectedColumns,
    copyReadable,
    repairHandoffActionVisible: true,
    fullRepairQualityClaim,
    llmFactClaim,
    noHorizontalOverflow: true,
  }
}

async function rowFor(page: Page, label: RegExp) {
  const row = page.getByRole('row', { name: label })
  await row.scrollIntoViewIfNeeded()
  return row
}

async function closeDetail(page: Page) {
  await page.locator('.sl-ci-detail-card').getByRole('button', { name: '关闭' }).click()
  await expect(page.locator('.sl-ci-detail-card')).toHaveCount(0)
}

async function assertCiLogRedaction(page: Page, label: string) {
  const redactedLog = page.locator('.sl-ci-detail-card .sl-ci-log-redacted[aria-label="脱敏 CI 日志片段"]')
  await expect(redactedLog, `${label}:redacted-ci-log`).toBeVisible()
  await expect(redactedLog, `${label}:safe-context-visible`).toContainText(ciLogSafeContext)
  await expect(redactedLog, `${label}:redaction-visible`).toContainText('[REDACTED]')
  for (const secret of forbiddenCiLogSecretSnippets) {
    await expect(redactedLog, `${label}:hides-${secret}`).not.toContainText(secret)
  }
}

test('CI diagnostics detail selection is accessible and isolated', async ({ page, baseURL }) => {
  const issues = installRuntimeGuards(page)
  const network = await installCiDiagnosticsMocks(page)
  const visitedViewports: string[] = []
  const ciLogSafetyProofs: Array<{
    viewport: string
    rawSecretsHidden: boolean
    redactionVisible: boolean
    sanitizedLogVisible: boolean
  }> = []
  const ciGovernanceLoopProofs: CiGovernanceLoopProof[] = []
  const baseURLHost = new URL(baseURL || 'http://127.0.0.1').hostname

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    if (viewport.name === 'desktop') {
      await page.goto(`/ci-diagnostics?projectId=${projectId}&diagnosticId=${detachedDiagnosticId}`)
      await expect(page.getByRole('heading', { name: 'CI 诊断与修复入口' })).toBeVisible()
      const detachedRow = await rowFor(page, new RegExp(`CiDiagnostic #${detachedDiagnosticId}`))
      await expect(detachedRow).toHaveAttribute('aria-selected', 'true')
      await expect(detachedRow).toHaveAttribute('aria-controls', `ci-diagnostic-detail-${detachedDiagnosticId}`)
      await expect(page.locator('.sl-ci-detail-card')).toContainText('Detached CI Build')
      await expect(page.locator('.sl-ci-detail-card')).toContainText('Detached diagnostic loaded from source deep link')
      await expect(network.detailRequests).toContain(detachedDiagnosticId)
    }

    await page.goto(`/ci-diagnostics?projectId=${projectId}&diagnosticId=${targetDiagnosticId}`)
    await expect(page.getByRole('heading', { name: 'CI 诊断与修复入口' })).toBeVisible()
    await expectCiDiagnosticsTableScrollerContained(page, `ci-diagnostics:${viewport.name}:initial`)
    ciGovernanceLoopProofs.push(await assertCiGovernanceLoop(page, viewport))

    let targetRow = await rowFor(page, new RegExp(`CiDiagnostic #${targetDiagnosticId}`))
    let secondaryRow = await rowFor(page, new RegExp(`CiDiagnostic #${secondaryDiagnosticId}`))
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(targetRow).toHaveAttribute('aria-controls', `ci-diagnostic-detail-${targetDiagnosticId}`)
    await expect(page.locator('.sl-ci-detail-card')).toContainText('CI Build')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('Maven test phase failed')
    const targetWorkflowAction = targetRow.getByRole('button', { name: 'CI Build' })
    await expect(targetWorkflowAction).toBeVisible()
    await targetWorkflowAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('CI Build')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('Maven test phase failed')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('OrderService rejects null status')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('backend-spring/src/main/java/demo/OrderService.java')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('Restore null-safe status handling')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('OrderServiceTest.shouldHandleEmptyStatus')
    await assertCiLogRedaction(page, `${viewport.name}:target-detail`)
    await expect(page.locator('.sl-ci-detail-card')).toContainText('修复候选资格')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('候选会默认绑定第一个相关文件')
    const repairButton = page.locator('.sl-ci-detail-card').getByRole('button', { name: '生成修复候选' })
    await expect(repairButton).toBeVisible()
    await repairButton.click()
    await expect(page).toHaveURL(/\/auto-repairs\?/)
    const repairUrl = new URL(page.url())
    expect(repairUrl.searchParams.get('projectId')).toBe(String(projectId))
    expect(repairUrl.searchParams.get('repositoryId')).toBe('11')
    expect(repairUrl.searchParams.get('filePath')).toBe('backend-spring/src/main/java/demo/OrderService.java')
    expect(repairUrl.searchParams.get('source')).toBe(`ci-diagnostic-${targetDiagnosticId}`)
    expect(repairUrl.searchParams.get('openCreate')).toBe('1')
    await page.goto(`/ci-diagnostics?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: 'CI 诊断与修复入口' })).toBeVisible()
    await expectCiDiagnosticsTableScrollerContained(page, `ci-diagnostics:${viewport.name}:after-repair-return`)
    targetRow = await rowFor(page, new RegExp(`CiDiagnostic #${targetDiagnosticId}`))
    secondaryRow = await rowFor(page, new RegExp(`CiDiagnostic #${secondaryDiagnosticId}`))

    await targetRow.focus()
    await page.keyboard.press('Enter')
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('可以生成')
    await assertCiLogRedaction(page, `${viewport.name}:keyboard-enter`)
    await closeDetail(page)

    await secondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('Lint Gate')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('Model provider timeout')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('暂不可生成')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('仓库 ID')

    const targetReanalyze = targetRow.getByRole('button', { name: `重新分析 CI 诊断 #${targetDiagnosticId}` })
    await targetReanalyze.click()
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-ci-detail-card')).toContainText('Lint Gate')
    await expect(network.reanalyzeRequests).toContain(targetDiagnosticId)

    await expectNoHorizontalOverflow(page, `ci-diagnostics-detail-selection:${viewport.name}`)
    await expect(page.locator('.ant-message-notice-error')).toHaveCount(0)
    for (const secret of forbiddenCiLogSecretSnippets) {
      await expect(page.locator('body'), `${viewport.name}:body-hides-${secret}`).not.toContainText(secret)
    }
    ciLogSafetyProofs.push({
      viewport: viewport.name,
      rawSecretsHidden: true,
      redactionVisible: true,
      sanitizedLogVisible: true,
    })
    visitedViewports.push(`${viewport.width}x${viewport.height}`)
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in CI Diagnostics detail selection smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const markerPayload = {
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    visitedViewports,
    detailAction: {
      visible: true,
      clickedDiagnosticId: targetDiagnosticId,
      detailPanelMatched: true,
    },
    keyboardOpen: {
      enter: true,
      space: true,
      selectedDiagnosticIds: [targetDiagnosticId, secondaryDiagnosticId],
    },
    diagnosticSignal: {
      visible: true,
      strongEvidence: true,
    },
    repairReadiness: {
      visible: true,
      targetFileExplained: true,
      unavailableReasonExplained: true,
    },
    sourceDeepLink: {
      selectedListedDiagnosticId: targetDiagnosticId,
      loadedDetachedDiagnosticId: detachedDiagnosticId,
      detailApiHydratedWhenMissingFromList: true,
    },
    autoRepairHandoff: {
      projectIdPreserved: true,
      repositoryIdPreserved: true,
      filePathPreserved: true,
      sourcePreserved: true,
      openCreatePreserved: true,
    },
    accessibleSelection: true,
    nestedActionsDoNotHijackSelection: true,
    reanalyze: {
      triggeredDiagnosticId: targetDiagnosticId,
      selectionPreserved: true,
    },
    tableScroller: {
      diagnosticsTableContained: true,
      overflowXAuto: true,
    },
    ciLogSafety: {
      scope: 'CI_DIAGNOSTICS_RAW_LOG_DISPLAY_REDACTION_ONLY',
      fixtureHasBearerSecret: true,
      fixtureHasApiKeySecret: true,
      fixtureHasPasswordSecret: true,
      fixtureHasQuotedSecret: true,
      fixtureHasJwtSecret: true,
      rawSecretsHidden: ciLogSafetyProofs.every(proof => proof.rawSecretsHidden),
      redactionVisible: ciLogSafetyProofs.every(proof => proof.redactionVisible),
      sanitizedLogVisible: ciLogSafetyProofs.every(proof => proof.sanitizedLogVisible),
      markerContainsRawSecret: false,
    },
    ciGovernanceLoop: {
      scope: 'CI_DIAGNOSTICS_FAILURE_GOVERNANCE_LOOP_READABILITY',
      surface: 'LOG_INTAKE_ROOT_CAUSE_EVIDENCE_REPAIR_GATE_AUTOREPAIR_HANDOFF',
      visible: ciGovernanceLoopProofs.every(proof => proof.visible),
      stepCount: 4,
      expectedColumnsHonored: ciGovernanceLoopProofs.every(proof => proof.expectedColumnsHonored),
      desktopColumns: ciGovernanceLoopProofs.some(proof => proof.viewport === '1440x900' && proof.actualColumns === 4),
      tabletColumns: ciGovernanceLoopProofs.some(proof => proof.viewport === '1024x768' && proof.actualColumns === 2),
      mobileColumns: ciGovernanceLoopProofs.some(proof => proof.viewport === '390x844' && proof.actualColumns === 1),
      narrowColumns: ciGovernanceLoopProofs.some(proof => proof.viewport === '320x740' && proof.actualColumns === 1),
      copyReadable: ciGovernanceLoopProofs.every(proof => proof.copyReadable),
      repairHandoffActionVisible: ciGovernanceLoopProofs.every(proof => proof.repairHandoffActionVisible),
      fullRepairQualityClaim: ciGovernanceLoopProofs.some(proof => proof.fullRepairQualityClaim),
      llmFactClaim: ciGovernanceLoopProofs.some(proof => proof.llmFactClaim),
      noHorizontalOverflow: ciGovernanceLoopProofs.every(proof => proof.noHorizontalOverflow),
      proofs: ciGovernanceLoopProofs,
    },
    spec: 'ci-diagnostics-detail-selection-smoke.spec.ts',
    baseURLHost,
  }
  const markerText = JSON.stringify(markerPayload)
  for (const secret of forbiddenCiLogSecretSnippets) {
    expect(markerText, `marker must not include raw CI log secret: ${secret}`).not.toContain(secret)
  }
  console.log('CI_DIAGNOSTICS_DETAIL_SELECTION_SMOKE_OK', markerText)
})
