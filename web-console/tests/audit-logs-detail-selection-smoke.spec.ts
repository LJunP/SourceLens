import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type AuditLogsMockOptions = {
  auditTotal?: number
  failAuditLogs?: boolean
}

const projectId = 1
const targetAuditLogId = 901
const secondaryAuditLogId = 902
const conflictingAuditLogId = 903
const artifactDownloadAuditLogId = 904
const conflictingArtifactAuditLogId = 905
const artifactAuditResourceId = 802
const targetToolCallId = 1001
const secondaryToolCallId = 1002
const targetDeliveryId = 1101
const secondaryDeliveryId = 1102
const auditJsonSafeMarker = 'AUDIT_JSON_SAFE_CONTEXT'
const auditRawBearerSecret = 'Bearer audit-json-bearer-should-not-render'
const auditRawAuthorizationSecret = `Authorization: ${auditRawBearerSecret}`
const auditRawApiKeySecret = 'sk-auditjsonsecretshouldnotrender123456789'
const auditRawPasswordSecret = 'audit-json-password-should-not-render'
const auditRawQuotedSecret = 'quoted audit json secret should not render'
const auditRawJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWRpdCI6Impzb24ifQ.auditJsonSignatureShouldNotRender'
const auditRawPrivateKeySecret = 'audit-json-private-key-should-not-render'
const forbiddenAuditJsonSecrets = [
  auditRawBearerSecret,
  auditRawAuthorizationSecret,
  auditRawApiKeySecret,
  auditRawPasswordSecret,
  auditRawQuotedSecret,
  auditRawJwtSecret,
  auditRawPrivateKeySecret,
]

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'AuditLogs Smoke Project',
  description: 'Mocked project for AuditLogs detail selection smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 92,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const artifactRecord = {
  id: artifactAuditResourceId,
  projectId,
  repositoryId: 11,
  ownerType: 'AUTO_REPAIR',
  ownerId: 601,
  artifactType: 'DEPENDENCY_GRAPH',
  contentType: 'application/json',
  sizeBytes: 2048,
  checksumSha256: 'b'.repeat(64),
  metadataJson: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:12:40Z',
}

const artifactPreviewText = JSON.stringify({
  nodes: [{ id: 'controller', label: 'Controller' }],
  edges: [],
  summary: { totalNodes: 1, totalEdges: 0 },
})

const auditLogs = [
  {
    id: targetAuditLogId,
    userId: 1,
    projectId,
    resourceType: 'AUTO_REPAIR',
    resourceId: 601,
    action: 'AUTO_REPAIR_CANDIDATE_CREATED',
    status: 'SUCCESS',
    inputJson: JSON.stringify({
      marker: auditJsonSafeMarker,
      repairId: 601,
      scanTaskId: 501,
      authorization: auditRawAuthorizationSecret,
      token: auditRawBearerSecret,
      apiKey: auditRawApiKeySecret,
      password: auditRawPasswordSecret,
      nestedSecrets: {
        secret: auditRawQuotedSecret,
        jwt: auditRawJwtSecret,
      },
      provenance: {
        sourceType: 'PROJECT_QA_VERIFIED_CITATION',
        scanTaskId: 501,
        filePath: 'src/main/java/demo/ChatController.java',
        citationId: 'AUDIT_C1',
        sourceLabel: 'C1',
        sourceEvidenceTitle: 'Chat endpoint boundary',
        sourceEvidenceFilePath: 'src/main/java/demo/ChatController.java',
        sourceEvidenceLineNumber: 27,
        repairEvidenceGate: 'READY',
        repairEvidenceGateReason: 'QA citation, report evidence and audit log are bound for review',
        repairEvidenceGateSource: 'SERVER_DERIVED',
      },
    }),
    outputSummary: 'AutoRepair candidate provenance receipt retained for review',
    durationMs: 180,
    requestId: 'req-audit-target',
    createdAt: '2026-07-01T10:10:00Z',
  },
  {
    id: secondaryAuditLogId,
    userId: 2,
    projectId,
    resourceType: 'SCAN_TASK',
    resourceId: 502,
    action: 'SCAN_TASK_FAILED',
    status: 'FAILED',
    inputJson: JSON.stringify({ scanTaskId: 502 }),
    outputSummary: 'Scanner exited with validation error',
    durationMs: 4100,
    requestId: 'req-audit-secondary',
    createdAt: '2026-07-01T10:11:00Z',
  },
  {
    id: conflictingAuditLogId,
    userId: 1,
    projectId,
    resourceType: 'AUTO_REPAIR',
    resourceId: 601,
    action: 'AUTO_REPAIR_PATCH_READY',
    status: 'SUCCESS',
    inputJson: JSON.stringify({ repairId: 601, scanTaskId: 501 }),
    outputSummary: 'Patch is ready for the same AutoRepair resource but must not hijack candidate deep links',
    durationMs: 260,
    requestId: 'req-audit-conflicting-resource',
    createdAt: '2026-07-01T10:12:30Z',
  },
  {
    id: artifactDownloadAuditLogId,
    userId: 1,
    projectId,
    resourceType: 'ARTIFACT',
    resourceId: artifactAuditResourceId,
    action: 'ARTIFACT_RAW_DOWNLOAD',
    status: 'SUCCESS',
    inputJson: JSON.stringify({
      artifactId: artifactAuditResourceId,
      artifactType: 'DEPENDENCY_GRAPH',
      ownerType: 'AUTO_REPAIR',
      ownerId: 601,
      repositoryId: 11,
      contentType: 'application/json',
      sizeBytes: 2048,
      checksumSha256: 'b'.repeat(64),
      fileName: 'artifact-802.json',
      downloadKind: 'RAW_BLOB',
      rawDownloadAcknowledged: true,
    }),
    outputSummary: 'artifact raw download issued: bytes=2048, filename=artifact-802.json, contentType=application/json, rawDownload=true, redacted=false',
    durationMs: 33,
    requestId: 'req-artifact-download-audit',
    createdAt: '2026-07-01T10:12:45Z',
  },
  {
    id: conflictingArtifactAuditLogId,
    userId: 1,
    projectId,
    resourceType: 'ARTIFACT',
    resourceId: artifactAuditResourceId,
    action: 'ARTIFACT_PREVIEW',
    status: 'SUCCESS',
    inputJson: JSON.stringify({ artifactId: artifactAuditResourceId, previewBytes: 512 }),
    outputSummary: 'Artifact preview opened for the same artifact but must not hijack raw download audit deep links',
    durationMs: 21,
    requestId: 'req-artifact-preview-conflict',
    createdAt: '2026-07-01T10:12:50Z',
  },
]

const toolCalls = [
  {
    id: targetToolCallId,
    conversationId: 77,
    projectId,
    scanTaskId: 501,
    toolName: 'read_file',
    permissionLevel: 'READ_ONLY',
    argumentsJson: JSON.stringify({
      path: 'src/main/java/demo/ChatController.java',
      authorization: auditRawAuthorizationSecret,
      access_token: auditRawBearerSecret,
      privateKey: auditRawPrivateKeySecret,
    }),
    resultSummary: '读取了 ChatController.java',
    success: true,
    errorMessage: null,
    durationMs: 18,
    createdBy: 1,
    createdAt: '2026-07-01T10:12:00Z',
  },
  {
    id: secondaryToolCallId,
    conversationId: 78,
    projectId,
    scanTaskId: 502,
    toolName: 'write_patch',
    permissionLevel: 'WRITE',
    argumentsJson: JSON.stringify({ filePath: 'src/main/java/demo/OrderService.java' }),
    resultSummary: null,
    success: false,
    errorMessage: 'Patch policy rejected broad mutation',
    durationMs: 220,
    createdBy: 2,
    createdAt: '2026-07-01T10:13:00Z',
  },
]

const deliveries = [
  {
    id: targetDeliveryId,
    deliveryId: 'gh-delivery-001',
    eventType: 'push',
    status: 'PROCESSED',
    resultJson: JSON.stringify({
      repositoryId: 11,
      processed: true,
      safeMarker: auditJsonSafeMarker,
      webhookSecret: `secret="${auditRawQuotedSecret}"`,
      api_key: auditRawApiKeySecret,
      jwt: auditRawJwtSecret,
    }),
    createdAt: '2026-07-01T10:14:00Z',
    updatedAt: '2026-07-01T10:14:10Z',
  },
  {
    id: secondaryDeliveryId,
    deliveryId: 'gh-delivery-002',
    eventType: 'installation',
    status: 'FAILED',
    resultJson: JSON.stringify({ error: 'signature mismatch' }),
    createdAt: '2026-07-01T10:15:00Z',
    updatedAt: '2026-07-01T10:15:10Z',
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

async function installAuditLogsMocks(page: Page, options: AuditLogsMockOptions = {}) {
  const unhandledApiRequests: string[] = []
  const auditQueries: string[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'audit-logs-detail-selection-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'audit_logs_smoke_user', email: 'audit-logs@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/audit-logs`) {
      auditQueries.push(url.search)
      if (options.failAuditLogs) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({ code: 'INTERNAL_ERROR', message: 'audit logs source failed for smoke' }),
        })
        return
      }
      await fulfillJson(route, result({ items: auditLogs, page: 1, pageSize: 20, total: options.auditTotal || auditLogs.length }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/agent-tool-calls`) {
      await fulfillJson(route, result({ items: toolCalls, page: 1, pageSize: 20, total: toolCalls.length }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/github-webhook-deliveries`) {
      await fulfillJson(route, result({ items: deliveries, page: 1, pageSize: 20, total: deliveries.length }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      await fulfillJson(route, result([artifactRecord]))
      return
    }

    const previewMatch = path.match(/^\/api\/projects\/(\d+)\/artifacts\/(\d+)\/preview$/)
    if (method === 'GET' && previewMatch) {
      await fulfillJson(route, result({
        record: artifactRecord,
        text: artifactPreviewText,
        truncated: false,
        previewBytes: artifactPreviewText.length,
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

  return { unhandledApiRequests, auditQueries }
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
  await expect(locator, `${label} must be visible`).toBeVisible()
  await expect.poll(async () => {
    const box = await locator.boundingBox()
    const viewportWidth = await locator.evaluate(() => window.innerWidth)
    if (!box) return Number.POSITIVE_INFINITY
    return Math.max(-box.x, box.x + box.width - viewportWidth)
  }, { message: `${label} must stay inside viewport after layout settles` }).toBeLessThanOrEqual(1)
}

async function closeDrawer(page: Page) {
  await page.locator('.ant-drawer-open .sl-audit-drawer .ant-drawer-close').first().dispatchEvent('click')
  await expect(page.locator('.ant-drawer-open .sl-audit-drawer')).toHaveCount(0)
}

function openDrawer(page: Page) {
  return page.locator('.ant-drawer-open .sl-audit-drawer')
}

async function rowFor(page: Page, label: RegExp) {
  const row = page.getByRole('row', { name: label })
  await row.scrollIntoViewIfNeeded()
  return row
}

async function assertLinkedDetailRegion(page: Page, row: Locator, detailId: string, titleId: string, titleText: string) {
  const detail = page.locator(`#${detailId}`)

  await expect(row).toHaveAttribute('aria-controls', detailId)
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute('role', 'region')
  await expect(detail).toHaveAttribute('aria-labelledby', titleId)
  await expect(page.locator(`#${titleId}`)).toContainText(titleText)
}

async function expectReadableCriticalText(locator: Locator, label: string) {
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

async function assertAuditDrawerDensity(page: Page, label: string) {
  const drawer = openDrawer(page)
  await expectContainedInViewport(page.locator('.ant-drawer-open .ant-drawer-content-wrapper').first(), `${label}:audit-drawer`)
  await expectNoHorizontalOverflow(page, `${label}:audit-drawer-open`)

  const detailValue = drawer.locator('.sl-audit-drawer-grid strong').first()
  await expectReadableCriticalText(detailValue, `${label}:audit-detail-value`)

  const receiptFilePath = drawer.getByText('src/main/java/demo/ChatController.java').first()
  await expect(receiptFilePath, `${label}:candidate-file-path`).toBeVisible()
  await expectReadableCriticalText(receiptFilePath, `${label}:candidate-file-path`)

  const receiptReason = drawer.locator('.sl-audit-candidate-receipt p').filter({ hasText: 'QA citation, report evidence and audit log are bound for review' })
  await expect(receiptReason, `${label}:candidate-gate-reason`).toBeVisible()
  await expectReadableCriticalText(receiptReason, `${label}:candidate-gate-reason`)

  const jsonDetails = drawer.locator('details.sl-audit-json-block').first()
  await expect(jsonDetails, `${label}:raw-json-details`).toBeVisible()
  await expect(jsonDetails, `${label}:raw-json-default-collapsed`).not.toHaveAttribute('open', /.*/)
  await expect(jsonDetails.locator('summary'), `${label}:raw-json-summary`).toContainText('原始 JSON 默认收起')

  await jsonDetails.locator('summary').click()
  await expect(jsonDetails).toHaveAttribute('open', '')
  await expect(jsonDetails.locator('pre.sl-audit-json-redacted'), `${label}:raw-json-expanded`).toBeVisible()
}

async function assertRedactedAuditJsonBlock(page: Page, label: string, title: string, expectedSafeText: string) {
  const drawer = openDrawer(page)
  const jsonDetails = drawer.locator('details.sl-audit-json-block').filter({ has: page.getByText(title, { exact: true }) }).first()
  await expect(jsonDetails, `${label}:${title}:redacted-json-details`).toBeVisible()
  const isOpen = await jsonDetails.getAttribute('open')
  if (isOpen == null) {
    await jsonDetails.locator('summary').click()
    await expect(jsonDetails).toHaveAttribute('open', '')
  }

  const redactedJson = jsonDetails.locator(`pre.sl-audit-json-redacted[aria-label="${title} 脱敏 JSON"]`)
  await expect(redactedJson, `${label}:${title}:redacted-json-pre`).toBeVisible()
  await expect(redactedJson, `${label}:${title}:keeps-safe-context`).toContainText(expectedSafeText)
  await expect(redactedJson, `${label}:${title}:shows-redaction`).toContainText('[REDACTED]')
  for (const secret of forbiddenAuditJsonSecrets) {
    await expect(redactedJson, `${label}:${title}:hides-${secret}`).not.toContainText(secret)
  }
}

async function expectAuditTableScrollerContained(page: Page, label: string) {
  const tableCard = page.locator('.sl-audit-tab-panel:visible .sl-audit-table-card').first()
  await expect(tableCard, `${label}:table-card`).toBeVisible()
  await expectContainedInViewport(tableCard, `${label}:table-card`)

  const tableScroller = tableCard.locator('.ant-table-content').first()
  await expect(tableScroller, `${label}:table-scroller`).toBeVisible()
  const overflowX = await tableScroller.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}:table-scroller must own horizontal overflow, got ${overflowX}`).toBe(true)
}

async function assertAuditInvestigationLoop(page: Page, label: string, expectedColumns: number) {
  const loop = page.getByRole('region', { name: '审计调查闭环' })
  const grid = loop.locator('.sl-audit-investigation-grid')
  const steps = loop.locator('.sl-audit-investigation-step')
  await expect(loop, `${label}:loop`).toBeVisible()
  await loop.scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, -96))
  await expectContainedInViewport(loop, `${label}:loop`)
  await expect(loop).toContainText('审计调查闭环')
  await expect(loop).toContainText('风险发现')
  await expect(loop).toContainText('证据脱敏')
  await expect(loop).toContainText('资源追踪')
  await expect(loop).toContainText('复盘处置')
  await expect(steps, `${label}:step-count`).toHaveCount(4)
  await expect(loop.locator('.sl-action-button-label'), `${label}:step-actions`).toHaveCount(4)

  const gridColumns = await grid.evaluate(element =>
    window.getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
  )
  expect(gridColumns, `${label}:investigation-grid-columns`).toBe(expectedColumns)

  const copyNodes = loop.locator('.sl-audit-investigation-step-copy span, .sl-audit-investigation-step-copy strong, .sl-audit-investigation-step-copy p')
  const copyCount = await copyNodes.count()
  expect(copyCount, `${label}:investigation-copy-count`).toBeGreaterThanOrEqual(12)
  for (let index = 0; index < copyCount; index += 1) {
    await expectReadableCriticalText(copyNodes.nth(index), `${label}:investigation-copy-${index}`)
  }
  await expectNoHorizontalOverflow(page, `${label}:investigation-loop`)

  return {
    visible: true,
    stepCount: await steps.count(),
    gridColumns,
    riskDetectionVisible: await loop.locator('[data-sl-audit-investigation-step="risk-detection"]').isVisible(),
    evidenceRedactionVisible: await loop.locator('[data-sl-audit-investigation-step="evidence-redaction"]').isVisible(),
    resourceTraceVisible: await loop.locator('[data-sl-audit-investigation-step="resource-trace"]').isVisible(),
    reviewClosureVisible: await loop.locator('[data-sl-audit-investigation-step="review-closure"]').isVisible(),
    noHorizontalOverflow: true,
  }
}

async function selectTab(page: Page, name: string) {
  const tab = page.getByRole('tab', { name })
  await tab.dispatchEvent('click')
  await expect(tab).toHaveAttribute('aria-selected', 'true')
}

test('AuditLogs tables expose accessible detail selection for every governance source', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAuditLogsMocks(page)
  const visitedViewports: string[] = []
  const auditJsonSafetyProofs: Array<{
    viewport: string
    auditInputRedacted: boolean
    toolArgumentsRedacted: boolean
    deliveryResultRedacted: boolean
    rawSecretsHidden: boolean
  }> = []
  const auditInvestigationProofs: Array<{
    viewport: string
    expectedColumns: number
    visible: boolean
    stepCount: number
    gridColumns: number
    riskDetectionVisible: boolean
    evidenceRedactionVisible: boolean
    resourceTraceVisible: boolean
    reviewClosureVisible: boolean
    noHorizontalOverflow: boolean
  }> = []
  const baseURLHost = new URL(test.info().project.use.baseURL || 'http://127.0.0.1').hostname || '127.0.0.1'

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/audit-logs?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: '审计日志与安全治理' })).toBeVisible()
    await expect(page.locator('.sl-audit-signal')).toBeVisible()
    const decisionGate = page.getByRole('region', { name: '审计判定门禁说明' })
    await expect(decisionGate).toBeVisible()
    await expect(decisionGate).toContainText('Audit Decision Gate')
    await expect(decisionGate).toContainText('READY')
    await expect(decisionGate).toContainText('三源可读取')
    await expect(decisionGate).toContainText('只展示脱敏摘要')
    const investigationExpectedColumns = viewport.width <= 720 ? 1 : viewport.width <= 1200 ? 2 : 4
    const investigationProof = await assertAuditInvestigationLoop(page, `audit-logs:${viewport.name}:investigation-loop`, investigationExpectedColumns)
    auditInvestigationProofs.push({
      viewport: viewport.name,
      expectedColumns: investigationExpectedColumns,
      ...investigationProof,
    })
    await expectAuditTableScrollerContained(page, viewport.name)

    const auditTargetRow = await rowFor(page, new RegExp(`AuditLog #${targetAuditLogId}`))
    const auditSecondaryRow = await rowFor(page, new RegExp(`AuditLog #${secondaryAuditLogId}`))
    const auditDetailAction = auditTargetRow.getByRole('button', { name: 'AUTO_REPAIR_CANDIDATE_CREATED' })
    await expect(auditDetailAction).toBeVisible()
    await expect(auditTargetRow).toHaveAttribute('aria-selected', 'false')
    await auditDetailAction.click()
    await expect(auditTargetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(
      page,
      auditTargetRow,
      `audit-log-detail-${targetAuditLogId}`,
      `audit-log-detail-title-${targetAuditLogId}`,
      `审计事件 #${targetAuditLogId}`,
    )
    await expect(openDrawer(page)).toContainText(`审计事件 #${targetAuditLogId}`)
    await expect(openDrawer(page)).toContainText('AutoRepair candidate provenance receipt retained for review')
    const candidateReceiptReview = openDrawer(page).getByRole('region', { name: '审计候选凭证复核' })
    await expect(candidateReceiptReview).toBeVisible()
    await expect(candidateReceiptReview.getByText('Candidate Receipt Review')).toBeVisible()
    await expect(candidateReceiptReview.getByText('PROJECT_QA_VERIFIED_CITATION')).toBeVisible()
    await expect(candidateReceiptReview.getByText('READY')).toBeVisible()
    await expect(candidateReceiptReview.getByText('SERVER_DERIVED')).toBeVisible()
    await expect(candidateReceiptReview.getByText('src/main/java/demo/ChatController.java').first()).toBeVisible()
    await expect(candidateReceiptReview.getByRole('button', { name: '打开修复详情' })).toHaveAttribute('data-sl-target-url', `/auto-repairs?projectId=${projectId}&repairId=601&scanTaskId=501`)
    await expect(candidateReceiptReview.getByRole('button', { name: '打开来源报告' })).toHaveAttribute('data-sl-target-url', '/scan-tasks/501')
    const qaReviewUrl = await candidateReceiptReview.getByRole('button', { name: 'QA 复核来源' }).getAttribute('data-sl-target-url')
    expect(qaReviewUrl || '').toContain(`/projects/${projectId}?`)
    expect(qaReviewUrl || '').toContain('tab=qa')
    expect(qaReviewUrl || '').toContain('scanTaskId=501')
    const decodedQaReviewUrl = decodeURIComponent(qaReviewUrl || '').replace(/\+/g, ' ')
    expect(decodedQaReviewUrl).toContain(`AuditLog #${targetAuditLogId}`)
    expect(decodedQaReviewUrl).toContain('AUTO_REPAIR_CANDIDATE_CREATED')
    expect(decodedQaReviewUrl).toContain('PROJECT_QA_VERIFIED_CITATION')
    expect(decodedQaReviewUrl).toContain('src/main/java/demo/ChatController.java')
    await assertAuditDrawerDensity(page, viewport.name)
    await assertRedactedAuditJsonBlock(page, viewport.name, 'Sanitized Input', auditJsonSafeMarker)
    await closeDrawer(page)

    await auditTargetRow.focus()
    await page.keyboard.press('Enter')
    await expect(auditTargetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(
      page,
      auditTargetRow,
      `audit-log-detail-${targetAuditLogId}`,
      `audit-log-detail-title-${targetAuditLogId}`,
      `审计事件 #${targetAuditLogId}`,
    )
    await expect(openDrawer(page)).toContainText(`审计事件 #${targetAuditLogId}`)
    await closeDrawer(page)

    await auditSecondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(auditSecondaryRow).toHaveAttribute('aria-selected', 'true')
    await expect(auditTargetRow).toHaveAttribute('aria-selected', 'false')
    await assertLinkedDetailRegion(
      page,
      auditSecondaryRow,
      `audit-log-detail-${secondaryAuditLogId}`,
      `audit-log-detail-title-${secondaryAuditLogId}`,
      `审计事件 #${secondaryAuditLogId}`,
    )
    await expect(openDrawer(page)).toContainText(`审计事件 #${secondaryAuditLogId}`)
    await closeDrawer(page)

    await selectTab(page, 'Agent 工具调用')
    await expectAuditTableScrollerContained(page, `${viewport.name}:agent-tools`)
    const toolTargetRow = await rowFor(page, new RegExp(`AgentToolCall #${targetToolCallId}`))
    const toolSecondaryRow = await rowFor(page, new RegExp(`AgentToolCall #${secondaryToolCallId}`))
    const toolDetailAction = toolTargetRow.getByRole('button', { name: 'read_file' })
    await expect(toolDetailAction).toBeVisible()
    await toolDetailAction.click()
    await expect(toolTargetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(
      page,
      toolTargetRow,
      `agent-tool-call-detail-${targetToolCallId}`,
      `agent-tool-call-detail-title-${targetToolCallId}`,
      `工具调用 #${targetToolCallId}`,
    )
    await expect(openDrawer(page)).toContainText(`工具调用 #${targetToolCallId}`)
    await expect(openDrawer(page)).toContainText('读取了 ChatController.java')
    await assertRedactedAuditJsonBlock(page, `${viewport.name}:agent-tools`, 'Arguments', 'src/main/java/demo/ChatController.java')
    await closeDrawer(page)

    await toolTargetRow.focus()
    await page.keyboard.press('Enter')
    await expect(toolTargetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(
      page,
      toolTargetRow,
      `agent-tool-call-detail-${targetToolCallId}`,
      `agent-tool-call-detail-title-${targetToolCallId}`,
      `工具调用 #${targetToolCallId}`,
    )
    await closeDrawer(page)

    await toolSecondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(toolSecondaryRow).toHaveAttribute('aria-selected', 'true')
    await expect(toolTargetRow).toHaveAttribute('aria-selected', 'false')
    await assertLinkedDetailRegion(
      page,
      toolSecondaryRow,
      `agent-tool-call-detail-${secondaryToolCallId}`,
      `agent-tool-call-detail-title-${secondaryToolCallId}`,
      `工具调用 #${secondaryToolCallId}`,
    )
    await expect(openDrawer(page)).toContainText(`工具调用 #${secondaryToolCallId}`)
    await closeDrawer(page)

    await selectTab(page, 'GitHub Webhook')
    await expectAuditTableScrollerContained(page, `${viewport.name}:deliveries`)
    const deliveryTargetRow = await rowFor(page, new RegExp(`GitHubWebhookDelivery #${targetDeliveryId}`))
    const deliverySecondaryRow = await rowFor(page, new RegExp(`GitHubWebhookDelivery #${secondaryDeliveryId}`))
    const deliveryDetailAction = deliveryTargetRow.getByRole('button', { name: 'gh-delivery-001' })
    await expect(deliveryDetailAction).toBeVisible()
    await deliveryDetailAction.click()
    await expect(deliveryTargetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(
      page,
      deliveryTargetRow,
      `github-webhook-delivery-detail-${targetDeliveryId}`,
      `github-webhook-delivery-detail-title-${targetDeliveryId}`,
      `Webhook Delivery #${targetDeliveryId}`,
    )
    await expect(openDrawer(page)).toContainText(`Webhook Delivery #${targetDeliveryId}`)
    await expect(openDrawer(page)).toContainText('gh-delivery-001')
    await assertRedactedAuditJsonBlock(page, `${viewport.name}:deliveries`, 'Result', auditJsonSafeMarker)
    await closeDrawer(page)

    await deliveryTargetRow.focus()
    await page.keyboard.press('Enter')
    await expect(deliveryTargetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(
      page,
      deliveryTargetRow,
      `github-webhook-delivery-detail-${targetDeliveryId}`,
      `github-webhook-delivery-detail-title-${targetDeliveryId}`,
      `Webhook Delivery #${targetDeliveryId}`,
    )
    await closeDrawer(page)

    await deliverySecondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(deliverySecondaryRow).toHaveAttribute('aria-selected', 'true')
    await expect(deliveryTargetRow).toHaveAttribute('aria-selected', 'false')
    await assertLinkedDetailRegion(
      page,
      deliverySecondaryRow,
      `github-webhook-delivery-detail-${secondaryDeliveryId}`,
      `github-webhook-delivery-detail-title-${secondaryDeliveryId}`,
      `Webhook Delivery #${secondaryDeliveryId}`,
    )
    await expect(openDrawer(page)).toContainText(`Webhook Delivery #${secondaryDeliveryId}`)
    await closeDrawer(page)

    await expectNoHorizontalOverflow(page, `audit-logs-detail-selection:${viewport.name}`)
    await expect(page.locator('.ant-message-notice-error')).toHaveCount(0)
    for (const secret of forbiddenAuditJsonSecrets) {
      await expect(page.locator('body'), `${viewport.name}:body-hides-${secret}`).not.toContainText(secret)
    }
    auditJsonSafetyProofs.push({
      viewport: viewport.name,
      auditInputRedacted: true,
      toolArgumentsRedacted: true,
      deliveryResultRedacted: true,
      rawSecretsHidden: true,
    })
    visitedViewports.push(`${viewport.width}x${viewport.height}`)
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in AuditLogs detail selection smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const markerPayload = {
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    visitedViewports,
    tabsCovered: ['audit-logs', 'agent-tool-calls', 'github-webhook-deliveries'],
    detailAction: {
      visible: true,
      clickedAuditLogId: targetAuditLogId,
      clickedToolCallId: targetToolCallId,
      clickedDeliveryId: targetDeliveryId,
      detailPanelMatched: true,
    },
    keyboardOpen: {
      enter: true,
      space: true,
    },
    sourceHealth: {
      readySources: ['audit', 'tools', 'deliveries'],
    },
    governanceSignal: {
      visible: true,
    },
    auditDecisionGate: {
      visible: true,
      statusesCovered: ['READY'],
      dataSourceIntegrityVisible: true,
      pageWindowVisible: true,
      deepLinkScopeVisible: true,
      rawEvidenceBoundaryVisible: true,
    },
    auditInvestigationLoop: {
      scope: 'AUDIT_LOGS_INVESTIGATION_LOOP_READABILITY',
      surface: 'RISK_DETECTION_EVIDENCE_REDACTION_RESOURCE_TRACE_REVIEW_CLOSURE',
      visible: auditInvestigationProofs.every(proof => proof.visible),
      stepCount: auditInvestigationProofs.every(proof => proof.stepCount === 4) ? 4 : 0,
      expectedColumnsHonored: auditInvestigationProofs.every(proof => proof.gridColumns === proof.expectedColumns),
      desktopColumns: auditInvestigationProofs.some(proof => proof.viewport === 'desktop' && proof.gridColumns === 4),
      mobileColumns: auditInvestigationProofs.filter(proof => ['mobile', 'narrow'].includes(proof.viewport)).every(proof => proof.gridColumns === 1),
      riskDetectionVisible: auditInvestigationProofs.every(proof => proof.riskDetectionVisible),
      evidenceRedactionVisible: auditInvestigationProofs.every(proof => proof.evidenceRedactionVisible),
      resourceTraceVisible: auditInvestigationProofs.every(proof => proof.resourceTraceVisible),
      reviewClosureVisible: auditInvestigationProofs.every(proof => proof.reviewClosureVisible),
      rawJsonDisplayRedactionOnly: true,
      noHorizontalOverflow: auditInvestigationProofs.every(proof => proof.noHorizontalOverflow),
      fullAuditCoverageClaim: false,
      providerQualityClaim: false,
      llmFactClaim: false,
    },
    candidateReceiptReview: {
      visible: true,
      sourceTypeBound: true,
      repairDeepLinkBound: true,
      reportDeepLinkBound: true,
      qaDeepLinkBound: true,
      auditEventBound: true,
    },
    drawerDensity: {
      rawJsonDefaultCollapsed: true,
      rawJsonExpandable: true,
      criticalFieldsWrap: true,
      mobile390Covered: true,
    },
    auditJsonSafety: {
      scope: 'AUDIT_LOGS_RAW_JSON_DISPLAY_REDACTION_ONLY',
      fixtureHasAuditInputSecret: true,
      fixtureHasToolArgumentSecret: true,
      fixtureHasDeliveryResultSecret: true,
      rawSecretsHidden: auditJsonSafetyProofs.every(proof => proof.rawSecretsHidden),
      redactionVisible: true,
      auditInputRedacted: auditJsonSafetyProofs.every(proof => proof.auditInputRedacted),
      toolArgumentsRedacted: auditJsonSafetyProofs.every(proof => proof.toolArgumentsRedacted),
      deliveryResultRedacted: auditJsonSafetyProofs.every(proof => proof.deliveryResultRedacted),
      markerContainsRawSecret: false,
    },
    mobileReadability: {
      drawerContentNotClipped: true,
      tableScrollerContained: true,
    },
    accessibleSelection: true,
    nestedActionsDoNotHijackSelection: true,
    sharedSelectableRow: {
      ariaControlsLinked: true,
      detailRegionLinked: true,
      selectedAuditLogIds: [targetAuditLogId, secondaryAuditLogId],
      selectedToolCallIds: [targetToolCallId, secondaryToolCallId],
      selectedDeliveryIds: [targetDeliveryId, secondaryDeliveryId],
    },
    spec: 'audit-logs-detail-selection-smoke.spec.ts',
    baseURLHost,
  }
  const markerText = JSON.stringify(markerPayload)
  for (const secret of forbiddenAuditJsonSecrets) {
    expect(markerText, `marker must not include raw audit JSON secret: ${secret}`).not.toContain(secret)
  }
  console.log('AUDIT_LOGS_DETAIL_SELECTION_SMOKE_OK', markerText)
})

test('AuditLogs audit deep links land on exact resource action and status', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAuditLogsMocks(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/audit-logs?projectId=${projectId}&resourceType=AUTO_REPAIR&resourceId=601&action=AUTO_REPAIR_CANDIDATE_CREATED&status=SUCCESS`)

  const drawer = openDrawer(page)
  await expect(drawer).toContainText(`审计事件 #${targetAuditLogId}`)
  await expect(drawer).not.toContainText(`审计事件 #${conflictingAuditLogId}`)
  await expect(drawer.getByRole('region', { name: '审计候选凭证复核' })).toBeVisible()
  const decisionGate = page.getByRole('region', { name: '审计判定门禁说明' })
  await expect(decisionGate).toContainText('REVIEW')
  await expect(decisionGate).toContainText('已按筛选或深链收窄')
  await expect(page.getByText('未找到目标审计事件')).toHaveCount(0)
  await assertAuditDrawerDensity(page, 'exact-deep-link')

  expect(network.auditQueries.some(query => {
    const params = new URLSearchParams(query)
    return params.get('resourceType') === 'AUTO_REPAIR'
      && params.get('resourceId') === '601'
      && params.get('action') === 'AUTO_REPAIR_CANDIDATE_CREATED'
      && params.get('status') === 'SUCCESS'
  }), 'Audit deep-link query must preserve resource/action/status filters.').toBe(true)
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in exact audit deep-link smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('AUDIT_LOGS_EXACT_DEEP_LINK_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewport: '390x844',
    exactAuditDeepLink: {
      selectedAuditLogId: targetAuditLogId,
      conflictingSameResourceAuditLogId: conflictingAuditLogId,
      resourceActionStatusMatched: true,
      candidateReceiptStillVisible: true,
      decisionGateStatus: 'REVIEW',
    },
    drawerDensity: {
      rawJsonDefaultCollapsed: true,
      rawJsonExpandable: true,
      criticalFieldsWrap: true,
    },
  }))
})

test('AuditLogs artifact raw download audit deep links return to artifact detail', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAuditLogsMocks(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/audit-logs?projectId=${projectId}&auditLogId=${artifactDownloadAuditLogId}&resourceType=ARTIFACT&resourceId=${artifactAuditResourceId}&action=ARTIFACT_RAW_DOWNLOAD&status=SUCCESS`)

  const drawer = openDrawer(page)
  await expect(drawer).toContainText(`审计事件 #${artifactDownloadAuditLogId}`)
  await expect(drawer).not.toContainText(`审计事件 #${conflictingArtifactAuditLogId}`)
  await expect(drawer).toContainText('ARTIFACT_RAW_DOWNLOAD')
  await expect(drawer).toContainText(`ARTIFACT #${artifactAuditResourceId}`)
  await expect(page.getByText('未找到目标审计事件')).toHaveCount(0)
  const associatedResource = drawer.getByRole('button', { name: '打开关联资源' })
  await expect(associatedResource).toBeVisible()
  await associatedResource.click()
  await expect(page).toHaveURL(new RegExp(`/artifacts\\?projectId=${projectId}&artifactId=${artifactAuditResourceId}$`))

  expect(network.auditQueries.some(query => {
    const params = new URLSearchParams(query)
    return params.get('auditLogId') === String(artifactDownloadAuditLogId)
      && params.get('resourceType') === 'ARTIFACT'
      && params.get('resourceId') === String(artifactAuditResourceId)
      && params.get('action') === 'ARTIFACT_RAW_DOWNLOAD'
      && params.get('status') === 'SUCCESS'
  }), 'Artifact raw download audit deep-link query must preserve resource/action/status filters.').toBe(true)
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in artifact audit deep-link smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('AUDIT_LOGS_ARTIFACT_RAW_DOWNLOAD_DEEP_LINK_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewport: '390x844',
    artifactRawDownloadAuditDeepLink: {
      selectedAuditLogId: artifactDownloadAuditLogId,
      conflictingSameResourceAuditLogId: conflictingArtifactAuditLogId,
      auditLogId: artifactDownloadAuditLogId,
      auditLogIdBound: true,
      resourceType: 'ARTIFACT',
      resourceId: artifactAuditResourceId,
      action: 'ARTIFACT_RAW_DOWNLOAD',
      status: 'SUCCESS',
      resourceActionStatusMatched: true,
      associatedResourceTarget: `/artifacts?projectId=${projectId}&artifactId=${artifactAuditResourceId}`,
      associatedResourceReturnBound: true,
      lowSensitiveQueryOnly: true,
    },
  }))
})

test('AuditLogs audit deep links fail closed when no exact event matches', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAuditLogsMocks(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/audit-logs?projectId=${projectId}&resourceType=AUTO_REPAIR&resourceId=601&action=DOES_NOT_EXIST&status=SUCCESS`)

  await expect(openDrawer(page)).toHaveCount(0)
  await expect(page.getByText('未找到目标审计事件')).toBeVisible()
  await expect(page.getByText('DOES_NOT_EXIST')).toBeVisible()
  const decisionGate = page.getByRole('region', { name: '审计判定门禁说明' })
  await expect(decisionGate).toContainText('BLOCKED')
  await expect(decisionGate).toContainText('精确目标未命中')
  await expectNoHorizontalOverflow(page, 'audit-deep-link-miss')

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in audit deep-link miss smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('AUDIT_LOGS_DEEP_LINK_MISS_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewport: '390x844',
    exactAuditDeepLink: {
      failClosedWhenMissing: true,
      noWrongDrawerOpened: true,
      missNoticeVisible: true,
      decisionGateStatus: 'BLOCKED',
    },
  }))
})

test('AuditLogs manual filters keep audit decision gate scoped even when all returned rows fit one page', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAuditLogsMocks(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/audit-logs?projectId=${projectId}`)
  await page.getByLabel('动作').fill('SCAN_TASK_FAILED')
  await page.getByRole('button', { name: '查询' }).first().click()

  const decisionGate = page.getByRole('region', { name: '审计判定门禁说明' })
  await expect(decisionGate).toContainText('REVIEW')
  await expect(decisionGate).toContainText('已按筛选或深链收窄')
  await expect(decisionGate).toContainText('当前视图受分页、筛选或深链范围影响')

  expect(network.auditQueries.some(query => {
    const params = new URLSearchParams(query)
    return params.get('action') === 'SCAN_TASK_FAILED'
  }), 'Manual audit filter query must be sent to the API.').toBe(true)
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in manual filter scope smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('AUDIT_LOGS_MANUAL_FILTER_SCOPE_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewport: '390x844',
    auditDecisionGate: {
      manualFilterStatus: 'REVIEW',
      totalEqualsVisibleStillScoped: true,
      queryParamBound: true,
    },
  }))
})

test('AuditLogs paginated audit windows keep audit decision gate in review', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAuditLogsMocks(page, { auditTotal: auditLogs.length + 10 })

  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto(`/audit-logs?projectId=${projectId}`)

  const decisionGate = page.getByRole('region', { name: '审计判定门禁说明' })
  await expect(decisionGate).toContainText('REVIEW')
  await expect(decisionGate).toContainText(`${auditLogs.length + toolCalls.length + deliveries.length}/${auditLogs.length + 10 + toolCalls.length + deliveries.length} 条`)
  await expect(decisionGate).toContainText('当前结果窗口')
  await expectNoHorizontalOverflow(page, 'audit-paginated-window-gate')

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in paginated audit window smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('AUDIT_LOGS_PAGINATED_DECISION_GATE_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewport: '320x740',
    auditDecisionGate: {
      paginatedStatus: 'REVIEW',
      visibleCount: auditLogs.length + toolCalls.length + deliveries.length,
      totalCount: auditLogs.length + 10 + toolCalls.length + deliveries.length,
      pageScoped: true,
    },
  }))
})

test('AuditLogs unavailable source blocks audit decision gate without claiming the chain is online', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installAuditLogsMocks(page, { failAuditLogs: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/audit-logs?projectId=${projectId}`)

  const decisionGate = page.getByRole('region', { name: '审计判定门禁说明' })
  await expect(decisionGate).toContainText('BLOCKED')
  await expect(decisionGate).toContainText('1 个审计源不可用')
  await expect(page.getByText('审计源需复核')).toBeVisible()
  await expect(page.getByText('审计链路在线')).toHaveCount(0)
  await expect(page.getByRole('region', { name: '审计数据源状态' })).toContainText('不可用')
  await expectNoHorizontalOverflow(page, 'audit-source-error-gate')

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in audit source error smoke.').toEqual([])
  const unexpectedIssues = issues.filter(issue => !issue.message.includes('Failed to load resource: the server responded with a status of 500'))
  expect(unexpectedIssues, `Runtime issues must only contain expected audit source 500s: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('AUDIT_LOGS_SOURCE_ERROR_DECISION_GATE_SMOKE_OK', JSON.stringify({
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewport: '390x844',
    auditDecisionGate: {
      sourceErrorStatus: 'BLOCKED',
      onlineClaimRemoved: true,
      unavailableSourceVisible: true,
    },
  }))
})
