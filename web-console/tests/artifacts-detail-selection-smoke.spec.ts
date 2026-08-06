import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

type ArtifactFixture = {
  id: number
  projectId: number
  repositoryId: number | null
  ownerType: string
  ownerId: number
  artifactType: string
  contentType: string | null
  sizeBytes: number
  checksumSha256: string | null
  metadataJson: string | null
  createdBy: number | null
  createdAt: string
}

const projectId = 1
const targetArtifactId = 801
const secondaryArtifactId = 802
const rawDownloadAuditLogId = 904
const binaryArtifactId = 803
const textArtifactId = 804
const malformedJsonArtifactId = 805
const artifactPreviewSafeMarker = 'ARTIFACT_PREVIEW_SAFE_CONTEXT'
const artifactRawBearerSecret = 'Bearer artifact-preview-bearer-should-not-render'
const artifactRawAuthorizationSecret = `Authorization: ${artifactRawBearerSecret}`
const artifactRawApiKeySecret = 'sk-artifactpreviewsecretshouldnotrender123456789'
const artifactRawPasswordSecret = 'artifact-preview-password-should-not-render'
const artifactRawQuotedSecret = 'quoted artifact preview secret should not render'
const artifactRawJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJhcnRpZmFjdCI6InByZXZpZXcifQ.artifactPreviewSignatureShouldNotRender'
const artifactRawPrivateKeySecret = 'artifact-preview-private-key-should-not-render'
const artifactRawDownloadPayloadSecret = 'artifact-raw-download-payload-is-not-display-redacted'
const forbiddenArtifactPreviewSecrets = [
  artifactRawBearerSecret,
  artifactRawAuthorizationSecret,
  artifactRawApiKeySecret,
  artifactRawPasswordSecret,
  artifactRawQuotedSecret,
  artifactRawJwtSecret,
  artifactRawPrivateKeySecret,
]

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'Artifacts Smoke Project',
  description: 'Mocked project for Artifacts detail selection smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 91,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const artifacts: ArtifactFixture[] = [
  {
    id: targetArtifactId,
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
  },
  {
    id: secondaryArtifactId,
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
    createdAt: '2026-07-01T10:11:00Z',
  },
  {
    id: binaryArtifactId,
    projectId,
    repositoryId: 12,
    ownerType: 'SCAN_TASK',
    ownerId: 502,
    artifactType: 'CHANGE_PATCH',
    contentType: 'application/octet-stream',
    sizeBytes: 1024,
    checksumSha256: 'c'.repeat(64),
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-07-01T10:12:00Z',
  },
  {
    id: textArtifactId,
    projectId,
    repositoryId: 12,
    ownerType: 'SCAN_TASK',
    ownerId: 503,
    artifactType: 'RAW_SCAN_RESULT',
    contentType: 'text/plain',
    sizeBytes: 1536,
    checksumSha256: 'd'.repeat(64),
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-07-01T10:13:00Z',
  },
  {
    id: malformedJsonArtifactId,
    projectId,
    repositoryId: 12,
    ownerType: 'SCAN_TASK',
    ownerId: 504,
    artifactType: 'RAW_SCAN_RESULT',
    contentType: 'application/json',
    sizeBytes: 1536,
    checksumSha256: 'e'.repeat(64),
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-07-01T10:14:00Z',
  },
]

const previews = new Map<number, string>([
  [targetArtifactId, JSON.stringify({
    overview: {
      totalFiles: 42,
      totalLines: 9810,
      totalDirs: 9,
      testFiles: 8,
    },
    techStack: {
      name: 'Spring Boot',
      version: '3.3',
    },
    modules: {
      apiRoutes: 16,
      controllers: 4,
      services: 7,
    },
    codeQuality: {
      risks: [
        { title: 'Long method', severity: 'medium' },
      ],
    },
    technicalDebt: [],
    suggestions: ['Keep artifact evidence linked to scan tasks.'],
    securitySummary: {
      marker: artifactPreviewSafeMarker,
      authorization: artifactRawAuthorizationSecret,
      bearer: artifactRawBearerSecret,
      apiKey: artifactRawApiKeySecret,
      password: artifactRawPasswordSecret,
      privateKey: artifactRawPrivateKeySecret,
      nested: {
        secret: artifactRawQuotedSecret,
        jwt: artifactRawJwtSecret,
      },
    },
    apiRoutes: [],
    dbEntities: [],
    scanFingerprint: {
      repoContentHash: 'architecture-report-hash',
    },
  })],
  [secondaryArtifactId, JSON.stringify({
    nodes: [
      { id: 'controller', label: 'Controller' },
      { id: 'service', label: 'Service' },
    ],
    edges: [
      { source: 'controller', target: 'service' },
    ],
    summary: {
      totalNodes: 2,
      totalEdges: 1,
    },
  })],
  [textArtifactId, [
    artifactPreviewSafeMarker,
    artifactRawAuthorizationSecret,
    `apiKey=${artifactRawApiKeySecret}`,
    `password="${artifactRawPasswordSecret}"`,
    `secret="${artifactRawQuotedSecret}"`,
    artifactRawJwtSecret,
  ].join('\n')],
  [malformedJsonArtifactId, `{ "marker": "${artifactPreviewSafeMarker}", "authorization": "${artifactRawAuthorizationSecret}", "apiKey": "${artifactRawApiKeySecret}", `],
])

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

async function installArtifactsMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const previewRequests: number[] = []
  const downloadRequests: number[] = []
  const downloadBoundaries: Array<{
    artifactId: number
    projectId: number
    auditLogId?: number
    acknowledgementPresent: boolean
    rawDownloadRedactionClaim: boolean
  }> = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'artifacts-detail-selection-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'artifacts_smoke_user', email: 'artifacts@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      await fulfillJson(route, result(artifacts))
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

    const previewMatch = path.match(/^\/api\/projects\/(\d+)\/artifacts\/(\d+)\/preview$/)
    if (method === 'GET' && previewMatch) {
      const artifactId = Number(previewMatch[2])
      previewRequests.push(artifactId)
      await fulfillJson(route, result({
        record: artifacts.find(item => item.id === artifactId),
        text: previews.get(artifactId) || '',
        truncated: false,
        previewBytes: previews.get(artifactId)?.length || 0,
      }))
      return
    }

    const downloadMatch = path.match(/^\/api\/projects\/(\d+)\/artifacts\/(\d+)\/download$/)
    if (method === 'GET' && downloadMatch) {
      const requestedProjectId = Number(downloadMatch[1])
      const artifactId = Number(downloadMatch[2])
      const acknowledgementPresent = url.searchParams.get('rawDownloadAcknowledged') === 'true'
      downloadRequests.push(artifactId)
      downloadBoundaries.push({
        artifactId,
        projectId: requestedProjectId,
        auditLogId: artifactId === binaryArtifactId ? undefined : rawDownloadAuditLogId,
        acknowledgementPresent,
        rawDownloadRedactionClaim: false,
      })
      const headers: Record<string, string> = {
        'content-disposition': `attachment; filename="artifact-${artifactId}.json"`,
      }
      if (artifactId !== binaryArtifactId) {
        headers['x-sourcelens-audit-log-id'] = String(rawDownloadAuditLogId)
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        headers,
        body: `artifact-${artifactId}-download ${artifactRawDownloadPayloadSecret}`,
      })
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(result(null)),
    })
  })

  return { unhandledApiRequests, previewRequests, downloadRequests, downloadBoundaries }
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
  await locator.scrollIntoViewIfNeeded()
  const readLayout = () => locator.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      innerWidth: window.innerWidth,
    }
  })
  let layout = await readLayout()
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const isContained = layout.width > 0
      && layout.height > 0
      && layout.x >= -1
      && layout.y >= -1
      && layout.x + layout.width <= layout.innerWidth + 1
    if (isContained) break
    await locator.evaluate(() => new Promise(resolve => window.setTimeout(resolve, 100)))
    layout = await readLayout()
  }
  expect(layout.width, `${label} should have measurable width`).toBeGreaterThan(0)
  expect(layout.height, `${label} should have measurable height`).toBeGreaterThan(0)
  expect(layout.x, `${label} should not overflow left`).toBeGreaterThanOrEqual(-1)
  expect(layout.y, `${label} should not overflow top`).toBeGreaterThanOrEqual(-1)
  expect(layout.x + layout.width, `${label} should not overflow right: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.innerWidth + 1)
}

async function expectReadableCriticalText(locator: Locator, label: string) {
  await expect(locator).toBeVisible()
  const details = await locator.evaluate(element => {
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return {
      whiteSpace: style.whiteSpace,
      overflowWrap: style.overflowWrap,
      wordBreak: style.wordBreak,
      overflow: style.overflow,
      textOverflow: style.textOverflow,
      rectWidth: rect.width,
      scrollWidth: element.scrollWidth,
    }
  })
  expect(details.whiteSpace, `${label} must not be forced into a single clipped line`).not.toBe('nowrap')
  expect(
    details.overflowWrap === 'anywhere' || details.overflowWrap === 'break-word' || details.wordBreak === 'break-word',
    `${label} must allow long token wrapping: ${JSON.stringify(details)}`,
  ).toBeTruthy()
  expect(details.rectWidth, `${label} should have measurable width`).toBeGreaterThan(0)
}

async function expectArtifactTableScrollerContained(page: Page, label: string) {
  const tableCard = page.locator('.sl-artifact-table-card')
  const tableContent = tableCard.locator('.ant-table-content').first()
  await expect(tableCard).toBeVisible()
  await tableCard.scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, -8))
  await expect(tableContent).toBeVisible()
  await expectContainedInViewport(tableCard, `${label}:table-card`)
  const overflowX = await tableContent.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}: table content must own horizontal overflow, got ${overflowX}`).toBeTruthy()
}

async function assertArtifactFocusCardReadability(page: Page, label: string) {
  const focusCard = page.locator('.sl-artifact-focus-card')
  await expect(focusCard).toBeVisible()
  await expectContainedInViewport(focusCard, `${label}:focus-card`)
  await expectReadableCriticalText(focusCard.locator('.sl-artifact-focus-head strong').first(), `${label}:primary-evidence-title`)

  const metaValues = focusCard.locator('.sl-artifact-focus-meta strong')
  const metaCount = await metaValues.count()
  expect(metaCount, `${label}:focus-meta should expose evidence values`).toBeGreaterThan(0)
  for (let index = 0; index < metaCount; index += 1) {
    await expectReadableCriticalText(metaValues.nth(index), `${label}:focus-meta-${index}`)
  }
}

async function assertArtifactFilterChipReadability(page: Page, label: string) {
  const bundleChips = page.locator('.sl-artifact-bundle-chip')
  const typeChips = page.locator('.sl-artifact-type-chip')
  const bundleCount = await bundleChips.count()
  const typeCount = await typeChips.count()
  expect(bundleCount, `${label}:bundle chips should exist`).toBeGreaterThan(0)
  expect(typeCount, `${label}:type chips should exist`).toBeGreaterThan(0)

  for (let index = 0; index < bundleCount; index += 1) {
    const chip = bundleChips.nth(index)
    await expectContainedInViewport(chip, `${label}:bundle-chip-${index}`)
    await expectReadableCriticalText(chip.locator('span'), `${label}:bundle-owner-${index}`)
    await expectReadableCriticalText(chip.locator('small'), `${label}:bundle-meta-${index}`)
    await expectReadableCriticalText(chip.locator('i'), `${label}:bundle-source-${index}`)
  }

  for (let index = 0; index < typeCount; index += 1) {
    const chip = typeChips.nth(index)
    await expectContainedInViewport(chip, `${label}:type-chip-${index}`)
    await expectReadableCriticalText(chip.locator('span'), `${label}:type-label-${index}`)
    await expectReadableCriticalText(chip.locator('small'), `${label}:type-size-${index}`)
  }
}

async function assertArtifactCustodyChain(page: Page, label: string, expectedColumns: number) {
  const chain = page.getByRole('region', { name: '产物保管责任链' })
  const grid = chain.locator('.sl-artifact-custody-grid')
  const steps = chain.locator('.sl-artifact-custody-step')
  await expect(chain).toBeVisible()
  await chain.scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, -96))
  await expectContainedInViewport(chain, `${label}:chain`)
  await expect(chain).toContainText('产物保管责任链')
  await expect(chain).toContainText('来源绑定')
  await expect(chain).toContainText('显示脱敏')
  await expect(chain).toContainText('Raw Access')
  await expect(chain).toContainText('复盘闭环')
  await expect(steps, `${label}:step-count`).toHaveCount(4)

  const gridColumns = await grid.evaluate(element =>
    window.getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
  )
  expect(gridColumns, `${label}:custody-grid-columns`).toBe(expectedColumns)

  const copyNodes = chain.locator('.sl-artifact-custody-step-copy span, .sl-artifact-custody-step-copy strong, .sl-artifact-custody-step-copy p')
  const copyCount = await copyNodes.count()
  expect(copyCount, `${label}:custody-copy-count`).toBeGreaterThanOrEqual(12)
  for (let index = 0; index < copyCount; index += 1) {
    await expectReadableCriticalText(copyNodes.nth(index), `${label}:custody-copy-${index}`)
  }
  await expectNoHorizontalOverflow(page, `${label}:custody-chain`)

  return {
    visible: true,
    stepCount: await steps.count(),
    gridColumns,
    sourceBindingVisible: await chain.locator('[data-sl-custody-step="source-binding"]').isVisible(),
    displayRedactionVisible: await chain.locator('[data-sl-custody-step="display-redaction"]').isVisible(),
    rawAccessVisible: await chain.locator('[data-sl-custody-step="raw-access-audit"]').isVisible(),
    reviewLoopVisible: await chain.locator('[data-sl-custody-step="review-loop"]').isVisible(),
    noHorizontalOverflow: true,
  }
}

async function assertArtifactTableRowTextReadability(row: Locator, label: string, values: {
  artifactType: string
  contentType: string
  ownerType: string
  repository: string
}) {
  await expectReadableCriticalText(row.getByText(values.artifactType).first(), `${label}:artifact-type`)
  await expectReadableCriticalText(row.getByText(values.contentType).first(), `${label}:content-type`)
  await expectReadableCriticalText(row.getByText(values.ownerType).first(), `${label}:owner-type`)
  await expectReadableCriticalText(row.getByText(values.repository).first(), `${label}:repository`)
}

async function assertArtifactDrawerReadability(page: Page, label: string) {
  const drawer = page.locator('.sl-artifact-drawer')
  const detail = page.locator('.sl-artifact-drawer [role="region"]')
  const drawerActions = drawer.locator('.ant-drawer-extra .sl-action-button-label')
  const statusAlert = drawer.locator('.sl-artifact-drawer-status-alert').first()
  await expect(drawer).toBeVisible()
  await expect(detail).toBeVisible()
  await expectContainedInViewport(drawer, `${label}:drawer`)
  await expectContainedInViewport(detail, `${label}:detail-region`)
  await expectNoHorizontalOverflow(page, `${label}:drawer-open`)
  await expect(drawerActions, `${label}:drawer-actions`).toHaveCount(3)
  const drawerActionCount = await drawerActions.count()
  for (let index = 0; index < drawerActionCount; index += 1) {
    await expectReadableCriticalText(drawerActions.nth(index), `${label}:drawer-action-${index}`)
  }
  await expectReadableCriticalText(page.locator('.sl-artifact-drawer').getByText('ARCHITECTURE_REPORT'), `${label}:artifact-type`)
  await expectReadableCriticalText(page.locator('.sl-artifact-drawer').getByText('SCAN_TASK #501'), `${label}:owner`)
  await expectReadableCriticalText(page.locator('.sl-artifact-drawer').getByText('application/json').first(), `${label}:content-type`)
  await expectReadableCriticalText(page.locator('.sl-artifact-drawer').getByText('a'.repeat(64)), `${label}:checksum`)
  if (await statusAlert.count()) {
    await expectReadableCriticalText(statusAlert.locator('.ant-alert-message'), `${label}:status-message`)
    const statusAction = statusAlert.locator('.sl-action-button-label')
    if (await statusAction.count()) {
      await expectReadableCriticalText(statusAction.first(), `${label}:status-action`)
    }
  }
}

async function assertArtifactPreviewReadability(page: Page, label: string) {
  const preview = page.locator('.sl-artifact-smart-preview')
  const tabs = page.locator('.sl-artifact-preview-tabs')
  const rawJson = page.locator('.sl-artifact-raw-json')
  const previewTiles = preview.locator('.sl-artifact-preview-tile')
  await expect(preview).toBeVisible()
  await expect(tabs).toBeVisible()
  await expect(rawJson).toBeVisible()
  await expectContainedInViewport(preview, `${label}:preview`)
  await expectContainedInViewport(tabs, `${label}:tabs`)
  await expect(previewTiles, `${label}:preview-tiles`).toHaveCount(4)
  const previewTileCount = await previewTiles.count()
  for (let index = 0; index < previewTileCount; index += 1) {
    const tile = previewTiles.nth(index)
    await expectReadableCriticalText(tile.locator('.sl-artifact-preview-tile-label'), `${label}:preview-tile-label-${index}`)
    await expectReadableCriticalText(tile.locator('.sl-artifact-preview-tile-value'), `${label}:preview-tile-value-${index}`)
  }
  await expectReadableCriticalText(preview.locator('code').filter({ hasText: 'architecture-report-hash' }).first(), `${label}:preview-hash`)
  await expect(rawJson).not.toHaveAttribute('open')
  await expectReadableCriticalText(rawJson.locator('summary'), `${label}:raw-json-summary`)
  await rawJson.locator('summary').click()
  await expect(rawJson).toHaveAttribute('open')
  await expectReadableCriticalText(rawJson.locator('.sl-artifact-redacted-raw-json'), `${label}:redacted-raw-json`)
  await expectNoHorizontalOverflow(page, `${label}:raw-json-open`)
  await rawJson.locator('summary').click()
  await expect(rawJson).not.toHaveAttribute('open')
}

async function assertArtifactPreviewRedaction(page: Page, label: string, expectedSafeText: string, options: { rawJson?: boolean } = {}) {
  const preview = page.locator('.sl-artifact-redacted-preview').first()
  await expect(preview, `${label}:redacted-preview`).toBeVisible()
  await expect(preview, `${label}:safe-context-visible`).toContainText(expectedSafeText)
  await expect(preview, `${label}:redaction-visible`).toContainText('[REDACTED]')
  for (const secret of forbiddenArtifactPreviewSecrets) {
    await expect(preview, `${label}:preview-hides-${secret}`).not.toContainText(secret)
  }

  if (options.rawJson) {
    const rawJson = page.locator('.sl-artifact-raw-json').first()
    await expect(rawJson, `${label}:raw-json-details`).toBeVisible()
    await expect(rawJson, `${label}:raw-json-default-collapsed`).not.toHaveAttribute('open')
    await rawJson.locator('summary').click()
    await expect(rawJson).toHaveAttribute('open', '')
    const redactedRawJson = rawJson.locator('.sl-artifact-redacted-raw-json')
    await expect(redactedRawJson, `${label}:redacted-raw-json`).toBeVisible()
    await expect(redactedRawJson, `${label}:raw-json-redaction-visible`).toContainText('[REDACTED]')
    for (const secret of forbiddenArtifactPreviewSecrets) {
      await expect(redactedRawJson, `${label}:raw-json-hides-${secret}`).not.toContainText(secret)
    }
    await rawJson.locator('summary').click()
    await expect(rawJson).not.toHaveAttribute('open')
  }
}

async function assertRawDownloadConfirmReadability(modal: Locator, label: string) {
  await expect(modal).toHaveClass(/sl-artifact-raw-download-confirm/)
  await expectReadableCriticalText(modal.locator('.ant-modal-confirm-title'), `${label}:title`)
  await expectReadableCriticalText(modal.locator('.ant-modal-confirm-content'), `${label}:content`)
  await expectReadableCriticalText(modal.getByRole('button', { name: /取\s*消/ }), `${label}:cancel`)
  await expectReadableCriticalText(modal.getByRole('button', { name: /确认下载/ }), `${label}:confirm`)
}

async function assertRawDownloadAuditReceiptReadability(page: Page, label: string) {
  const receipt = page.locator('.sl-artifact-download-audit-receipt')
  await expect(receipt).toBeVisible()
  await expectContainedInViewport(receipt, `${label}:receipt`)
  await expectReadableCriticalText(receipt.locator('.sl-state-block-copy strong'), `${label}:title`)
  await expectReadableCriticalText(receipt.locator('.sl-state-block-copy p'), `${label}:description`)
  await expectReadableCriticalText(receipt.locator('.sl-action-button-label'), `${label}:action`)
  await expectNoHorizontalOverflow(page, `${label}:receipt-open`)
}

async function rowForArtifact(page: Page, artifactId: number) {
  const row = page.getByRole('row', { name: new RegExp(`Artifact #${artifactId}`) })
  await row.scrollIntoViewIfNeeded()
  return row
}

async function closeArtifactDrawer(page: Page) {
  await page.locator('.sl-artifact-drawer .ant-drawer-close').dispatchEvent('click')
  await expect(page.locator('.sl-artifact-drawer')).toBeHidden()
}

async function assertTargetDrawer(page: Page) {
  const drawer = page.locator('.sl-artifact-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText(`架构报告 #${targetArtifactId}`)
  await expect(drawer).toContainText('SCAN_TASK #501')
  await expect(drawer).toContainText('可跳转')
}

async function assertSecondaryDrawer(page: Page) {
  const drawer = page.locator('.sl-artifact-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText(`依赖图谱 #${secondaryArtifactId}`)
  await expect(drawer).toContainText('AUTO_REPAIR #601')
}

async function assertLinkedDetailRegion(page: Page, artifactId: number) {
  const detailId = `artifact-detail-${artifactId}`
  const titleId = `artifact-detail-title-${artifactId}`
  const row = await rowForArtifact(page, artifactId)
  const detail = page.locator(`#${detailId}`)

  await expect(row).toHaveAttribute('aria-controls', detailId)
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute('role', 'region')
  await expect(detail).toHaveAttribute('aria-labelledby', titleId)
  await expect(page.locator(`#${titleId}`)).toContainText(`#${artifactId}`)
}

test('Artifacts table exposes explicit detail and preview selection accessibly', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const network = await installArtifactsMocks(page)
  const visitedViewports: string[] = []
  const artifactPreviewSafetyProofs: Array<{
    viewport: string
    structuredJsonRedacted: boolean
    rawJsonRedacted: boolean
    textPreviewRedacted: boolean
    malformedJsonRedacted: boolean
    rawSecretsHidden: boolean
  }> = []
  const artifactCustodyProofs: Array<{
    viewport: string
    expectedColumns: number
    visible: boolean
    stepCount: number
    gridColumns: number
    sourceBindingVisible: boolean
    displayRedactionVisible: boolean
    rawAccessVisible: boolean
    reviewLoopVisible: boolean
    noHorizontalOverflow: boolean
  }> = []
  const artifactCustodyAuditProofs: Array<{
    viewport: string
    receiptVisible: boolean
    fallbackVisible: boolean
    receiptUrlLowSensitive: boolean
    fallbackUrlLowSensitive: boolean
  }> = []
  const baseURLHost = new URL(test.info().project.use.baseURL || 'http://127.0.0.1').hostname || '127.0.0.1'

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/artifacts?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: '运行产物证据中心' })).toBeVisible()
    await expectArtifactTableScrollerContained(page, `artifacts:${viewport.name}:initial`)
    await assertArtifactFocusCardReadability(page, `artifacts:${viewport.name}:initial`)
    await assertArtifactFilterChipReadability(page, `artifacts:${viewport.name}:initial`)
    const custodyExpectedColumns = viewport.width <= 720 ? 1 : viewport.width <= 1200 ? 2 : 4
    const custodyProof = await assertArtifactCustodyChain(page, `artifacts:${viewport.name}:custody-chain`, custodyExpectedColumns)
    artifactCustodyProofs.push({
      viewport: viewport.name,
      expectedColumns: custodyExpectedColumns,
      ...custodyProof,
    })

    const targetRow = await rowForArtifact(page, targetArtifactId)
    const secondaryRow = await rowForArtifact(page, secondaryArtifactId)
    const binaryRow = await rowForArtifact(page, binaryArtifactId)
    const textRow = await rowForArtifact(page, textArtifactId)
    const malformedJsonRow = await rowForArtifact(page, malformedJsonArtifactId)
    await assertArtifactTableRowTextReadability(targetRow, `artifacts:${viewport.name}:target-row`, {
      artifactType: 'ARCHITECTURE_REPORT',
      contentType: 'application/json',
      ownerType: 'SCAN_TASK',
      repository: 'Repository #11',
    })
    await assertArtifactTableRowTextReadability(secondaryRow, `artifacts:${viewport.name}:secondary-row`, {
      artifactType: 'DEPENDENCY_GRAPH',
      contentType: 'application/json',
      ownerType: 'AUTO_REPAIR',
      repository: 'Repository #11',
    })
    const detailAction = targetRow.getByRole('button', { name: `查看 架构报告 #${targetArtifactId} 详情` })
    await detailAction.scrollIntoViewIfNeeded()
    await expect(detailAction).toBeVisible()
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')

    await detailAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, targetArtifactId)
    await assertTargetDrawer(page)
    await assertArtifactDrawerReadability(page, `artifacts:${viewport.name}:target-detail`)
    await expect(page.locator('.sl-artifact-preview-tabs')).toHaveCount(0)

    await closeArtifactDrawer(page)
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')

    await targetRow.focus()
    await page.keyboard.press('Enter')
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await assertLinkedDetailRegion(page, targetArtifactId)
    await assertTargetDrawer(page)
    await assertArtifactDrawerReadability(page, `artifacts:${viewport.name}:keyboard-enter-detail`)

    await secondaryRow.focus()
    await page.keyboard.press('Space')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'true')
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')
    await assertLinkedDetailRegion(page, secondaryArtifactId)
    await assertSecondaryDrawer(page)

    await closeArtifactDrawer(page)
    const previewAction = targetRow.getByRole('button', { name: `预览 架构报告 #${targetArtifactId}` })
    await previewAction.scrollIntoViewIfNeeded()
    await previewAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'false')
    await assertLinkedDetailRegion(page, targetArtifactId)
    await assertTargetDrawer(page)
    await expect(page.locator('.sl-artifact-preview-tabs')).toBeVisible()
    await expect(page.locator('.sl-artifact-smart-preview')).toContainText('总览')
    await expect(page.locator('.sl-artifact-smart-preview')).toContainText('文件')
    await expect(page.locator('.sl-artifact-smart-preview')).toContainText('代码行')
    await assertArtifactDrawerReadability(page, `artifacts:${viewport.name}:preview-detail`)
    await assertArtifactPreviewReadability(page, `artifacts:${viewport.name}:preview`)
    await assertArtifactPreviewRedaction(page, `artifacts:${viewport.name}:structured-preview`, artifactPreviewSafeMarker, { rawJson: true })
    expect(network.previewRequests, `${viewport.name} preview should request the selected artifact`).toContain(targetArtifactId)

    const binaryPreview = binaryRow.getByRole('button', { name: `预览 补丁文件 #${binaryArtifactId}` })
    await expect(binaryPreview).toBeDisabled()

    await closeArtifactDrawer(page)
    const textPreview = textRow.getByRole('button', { name: `预览 原始扫描 #${textArtifactId}` })
    await textPreview.scrollIntoViewIfNeeded()
    await textPreview.click()
    await expect(textRow).toHaveAttribute('aria-selected', 'true')
    await assertArtifactPreviewRedaction(page, `artifacts:${viewport.name}:text-preview`, artifactPreviewSafeMarker)
    expect(network.previewRequests, `${viewport.name} text preview should request the selected artifact`).toContain(textArtifactId)
    await closeArtifactDrawer(page)

    const malformedJsonPreview = malformedJsonRow.getByRole('button', { name: `预览 原始扫描 #${malformedJsonArtifactId}` })
    await malformedJsonPreview.scrollIntoViewIfNeeded()
    await malformedJsonPreview.click()
    await expect(malformedJsonRow).toHaveAttribute('aria-selected', 'true')
    await assertArtifactPreviewRedaction(page, `artifacts:${viewport.name}:malformed-json-preview`, artifactPreviewSafeMarker)
    expect(network.previewRequests, `${viewport.name} malformed JSON preview should request the selected artifact`).toContain(malformedJsonArtifactId)
    await closeArtifactDrawer(page)

    const secondaryDownload = secondaryRow.getByRole('button', { name: `下载 依赖图谱 #${secondaryArtifactId}` })
    await secondaryDownload.scrollIntoViewIfNeeded()
    await secondaryDownload.click()
    const rawDownloadConfirm = page.locator('.ant-modal-confirm').last()
    await expect(rawDownloadConfirm.locator('.ant-modal-confirm-title')).toHaveText('确认下载原始产物')
    await expect(rawDownloadConfirm.locator('.ant-modal-confirm-content')).toContainText('未经显示层脱敏处理的原始 artifact')
    await assertRawDownloadConfirmReadability(rawDownloadConfirm, `artifacts:${viewport.name}:raw-download-confirm`)
    await rawDownloadConfirm.getByRole('button', { name: '确认下载' }).click()
    await expect(page.locator('.sl-artifact-drawer')).toBeHidden()
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')
    await expect(secondaryRow).toHaveAttribute('aria-selected', 'false')
    await expect.poll(() => network.downloadRequests, {
      message: `${viewport.name} download should not hijack row selection and should issue a request`,
    }).toContain(secondaryArtifactId)
    const downloadBoundary = network.downloadBoundaries.find(boundary => boundary.artifactId === secondaryArtifactId)
    expect(downloadBoundary, `${viewport.name} raw download should record a request boundary`).toMatchObject({
      artifactId: secondaryArtifactId,
      projectId,
      auditLogId: rawDownloadAuditLogId,
      acknowledgementPresent: true,
      rawDownloadRedactionClaim: false,
    })
    const rawDownloadAuditAction = page.getByRole('button', { name: '查看下载审计' })
    await expect(page.locator('.sl-artifact-download-audit-receipt')).toContainText(`依赖图谱 #${secondaryArtifactId}`)
    await assertRawDownloadAuditReceiptReadability(page, `artifacts:${viewport.name}:raw-download-audit-receipt`)
    await expect(rawDownloadAuditAction).toHaveAttribute(
      'data-sl-target-url',
      `/audit-logs?projectId=${projectId}&resourceType=ARTIFACT&resourceId=${secondaryArtifactId}&action=ARTIFACT_RAW_DOWNLOAD&status=SUCCESS&auditLogId=${rawDownloadAuditLogId}`
    )
    const custodyChainAfterReceipt = page.getByRole('region', { name: '产物保管责任链' })
    const custodyReceiptAuditAction = custodyChainAfterReceipt.getByRole('button', { name: '查看审计' })
    await expect(custodyChainAfterReceipt).toContainText(`receipt #${rawDownloadAuditLogId}`)
    await expect(custodyReceiptAuditAction).toHaveAttribute(
      'data-sl-target-url',
      `/audit-logs?projectId=${projectId}&resourceType=ARTIFACT&resourceId=${secondaryArtifactId}&action=ARTIFACT_RAW_DOWNLOAD&status=SUCCESS&auditLogId=${rawDownloadAuditLogId}`
    )
    const rawDownloadAuditUrl = await rawDownloadAuditAction.getAttribute('data-sl-target-url')
    expect(rawDownloadAuditUrl || '', `${viewport.name}: audit URL must not include raw payload`).not.toContain(artifactRawDownloadPayloadSecret)
    expect(rawDownloadAuditUrl || '', `${viewport.name}: audit URL must not include filename`).not.toContain('artifact-')
    expect(rawDownloadAuditUrl || '', `${viewport.name}: audit URL must not include storage path`).not.toContain('storagePath')
    await rawDownloadAuditAction.click()
    await expect(page).toHaveURL(new RegExp(`/audit-logs\\?projectId=${projectId}&resourceType=ARTIFACT&resourceId=${secondaryArtifactId}&action=ARTIFACT_RAW_DOWNLOAD&status=SUCCESS&auditLogId=${rawDownloadAuditLogId}$`))
    await page.goto(`/artifacts?projectId=${projectId}`)

    const noHeaderDownload = binaryRow.getByRole('button', { name: `下载 补丁文件 #${binaryArtifactId}` })
    await noHeaderDownload.scrollIntoViewIfNeeded()
    await noHeaderDownload.click()
    const noHeaderRawDownloadConfirm = page.locator('.ant-modal-confirm').last()
    await expect(noHeaderRawDownloadConfirm.locator('.ant-modal-confirm-title')).toHaveText('确认下载原始产物')
    await assertRawDownloadConfirmReadability(noHeaderRawDownloadConfirm, `artifacts:${viewport.name}:raw-download-confirm-fallback`)
    await noHeaderRawDownloadConfirm.getByRole('button', { name: '确认下载' }).click()
    await expect.poll(() => network.downloadRequests, {
      message: `${viewport.name} no-header download should issue a request`,
    }).toContain(binaryArtifactId)
    await expect(page.locator('.sl-artifact-download-audit-receipt')).toContainText(`补丁文件 #${binaryArtifactId} 未返回 receipt id`)
    await expect(page.locator('.sl-artifact-download-audit-receipt')).not.toContainText(`receipt #${rawDownloadAuditLogId}`)
    await assertRawDownloadAuditReceiptReadability(page, `artifacts:${viewport.name}:raw-download-audit-receipt-fallback`)
    const noHeaderAuditAction = page.getByRole('button', { name: '查看下载审计' })
    await expect(noHeaderAuditAction).toHaveAttribute(
      'data-sl-target-url',
      `/audit-logs?projectId=${projectId}&resourceType=ARTIFACT&resourceId=${binaryArtifactId}&action=ARTIFACT_RAW_DOWNLOAD&status=SUCCESS`
    )
    const custodyChainAfterFallback = page.getByRole('region', { name: '产物保管责任链' })
    const custodyFallbackAuditAction = custodyChainAfterFallback.getByRole('button', { name: '查看审计' })
    await expect(custodyChainAfterFallback).toContainText('按资源过滤')
    await expect(custodyFallbackAuditAction).toHaveAttribute(
      'data-sl-target-url',
      `/audit-logs?projectId=${projectId}&resourceType=ARTIFACT&resourceId=${binaryArtifactId}&action=ARTIFACT_RAW_DOWNLOAD&status=SUCCESS`
    )
    const noHeaderAuditUrl = await noHeaderAuditAction.getAttribute('data-sl-target-url')
    expect(noHeaderAuditUrl || '', `${viewport.name}: fallback audit URL must not include auditLogId`).not.toContain('auditLogId=')
    expect(noHeaderAuditUrl || '', `${viewport.name}: fallback audit URL must not include raw payload`).not.toContain(artifactRawDownloadPayloadSecret)
    expect(noHeaderAuditUrl || '', `${viewport.name}: fallback audit URL must not include filename`).not.toContain('artifact-')
    const custodyReceiptAuditUrl = await custodyReceiptAuditAction.getAttribute('data-sl-target-url')
    const custodyFallbackAuditUrl = await custodyFallbackAuditAction.getAttribute('data-sl-target-url')
    artifactCustodyAuditProofs.push({
      viewport: viewport.name,
      receiptVisible: true,
      fallbackVisible: true,
      receiptUrlLowSensitive: Boolean(custodyReceiptAuditUrl)
        && !custodyReceiptAuditUrl?.includes(artifactRawDownloadPayloadSecret)
        && !custodyReceiptAuditUrl?.includes('artifact-')
        && !custodyReceiptAuditUrl?.includes('storagePath'),
      fallbackUrlLowSensitive: Boolean(custodyFallbackAuditUrl)
        && !custodyFallbackAuditUrl?.includes(artifactRawDownloadPayloadSecret)
        && !custodyFallbackAuditUrl?.includes('artifact-')
        && !custodyFallbackAuditUrl?.includes('storagePath')
        && !custodyFallbackAuditUrl?.includes('auditLogId='),
    })

    await expectArtifactTableScrollerContained(page, `artifacts:${viewport.name}:final`)
    await expectNoHorizontalOverflow(page, `artifacts-detail-selection:${viewport.name}`)
    await expect(page.locator('.ant-message-notice-error')).toHaveCount(0)
    for (const secret of forbiddenArtifactPreviewSecrets) {
      await expect(page.locator('body'), `${viewport.name}:body-hides-${secret}`).not.toContainText(secret)
    }
    artifactPreviewSafetyProofs.push({
      viewport: viewport.name,
      structuredJsonRedacted: true,
      rawJsonRedacted: true,
      textPreviewRedacted: true,
      malformedJsonRedacted: true,
      rawSecretsHidden: true,
    })
    visitedViewports.push(`${viewport.width}x${viewport.height}`)
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in Artifacts detail selection smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const markerPayload = {
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    visitedViewports,
    detailAction: {
      visible: true,
      clickedArtifactId: targetArtifactId,
      detailPanelMatched: true,
    },
    previewAction: {
      visible: true,
      clickedArtifactId: targetArtifactId,
      previewPanelMatched: true,
    },
    keyboardOpen: {
      enter: true,
      space: true,
      selectedArtifactIds: [targetArtifactId, secondaryArtifactId],
    },
    accessibleSelection: true,
    nestedActionsDoNotHijackSelection: true,
    sharedSelectableRow: {
      ariaControlsLinked: true,
      detailRegionLinked: true,
      selectedArtifactIds: [targetArtifactId, secondaryArtifactId],
    },
    layoutDensity: {
      mobile390Covered: visitedViewports.includes('390x844'),
      narrow320Covered: visitedViewports.includes('320x740'),
      drawerContained: true,
      tableScrollerContained: true,
      noHorizontalOverflow: true,
    },
    mobileReadability: {
      mobile390Covered: visitedViewports.includes('390x844'),
      criticalFieldsWrap: true,
      checksumWraps: true,
      previewContentReadable: true,
      tableScrollerContained: true,
    },
    runtimeIssues: 0,
    noHorizontalOverflow: true,
    drawerReadability: {
      openStateChecked: true,
      criticalTextWraps: true,
      rawJsonDefaultCollapsed: true,
    },
    tableScroller: {
      containedInViewport: true,
      overflowXAuto: true,
    },
    previewReadability: {
      smartPreviewVisible: true,
      tabsContained: true,
      rawJsonExpandable: true,
    },
    artifactPreviewSafety: {
      scope: 'ARTIFACTS_PREVIEW_DISPLAY_REDACTION_ONLY',
      fixtureHasStructuredJsonSecret: true,
      fixtureHasRawJsonSecret: true,
      fixtureHasTextSecret: true,
      fixtureHasMalformedJsonSecret: true,
      rawSecretsHidden: artifactPreviewSafetyProofs.every(proof => proof.rawSecretsHidden),
      redactionVisible: true,
      structuredJsonRedacted: artifactPreviewSafetyProofs.every(proof => proof.structuredJsonRedacted),
      rawJsonRedacted: artifactPreviewSafetyProofs.every(proof => proof.rawJsonRedacted),
      textPreviewRedacted: artifactPreviewSafetyProofs.every(proof => proof.textPreviewRedacted),
      malformedJsonRedacted: artifactPreviewSafetyProofs.every(proof => proof.malformedJsonRedacted),
      markerContainsRawSecret: false,
    },
    artifactCustodyChain: {
      scope: 'ARTIFACTS_CUSTODY_CHAIN_READABILITY',
      surface: 'ARTIFACT_SOURCE_PREVIEW_RAW_ACCESS_REVIEW_LOOP',
      visible: artifactCustodyProofs.every(proof => proof.visible),
      stepCount: artifactCustodyProofs.every(proof => proof.stepCount === 4) ? 4 : 0,
      expectedColumnsHonored: artifactCustodyProofs.every(proof => proof.gridColumns === proof.expectedColumns),
      desktopColumns: artifactCustodyProofs.some(proof => proof.viewport === 'desktop' && proof.gridColumns === 4),
      mobileColumns: artifactCustodyProofs.filter(proof => ['mobile', 'narrow'].includes(proof.viewport)).every(proof => proof.gridColumns === 1),
      sourceBindingVisible: artifactCustodyProofs.every(proof => proof.sourceBindingVisible),
      displayRedactionVisible: artifactCustodyProofs.every(proof => proof.displayRedactionVisible),
      rawAccessVisible: artifactCustodyProofs.every(proof => proof.rawAccessVisible),
      reviewLoopVisible: artifactCustodyProofs.every(proof => proof.reviewLoopVisible),
      rawAccessReceiptVisible: artifactCustodyAuditProofs.every(proof => proof.receiptVisible),
      rawAccessFallbackVisible: artifactCustodyAuditProofs.every(proof => proof.fallbackVisible),
      rawAccessUrlLowSensitive: artifactCustodyAuditProofs.every(proof => proof.receiptUrlLowSensitive && proof.fallbackUrlLowSensitive),
      noHorizontalOverflow: artifactCustodyProofs.every(proof => proof.noHorizontalOverflow),
      providerQualityClaim: false,
      llmFactClaim: false,
    },
    rawDownloadBoundary: {
      scope: 'ARTIFACTS_RAW_DOWNLOAD_ACKNOWLEDGEMENT_AUDIT_BOUNDARY_ONLY',
      requestBound: network.downloadBoundaries.some(boundary => boundary.artifactId === secondaryArtifactId && boundary.projectId === projectId),
      acknowledgementPresent: network.downloadBoundaries.every(boundary => boundary.acknowledgementPresent),
      receiptBoundaryExpected: true,
      artifactIdBound: network.downloadBoundaries.every(boundary => network.downloadRequests.includes(boundary.artifactId)),
      noDrawerHijack: true,
      rawDownloadRedactionClaim: false,
      markerContainsRawContent: false,
    },
    rawDownloadAuditDeepLink: {
      scope: 'ARTIFACTS_RAW_DOWNLOAD_AUDIT_DEEP_LINK_ONLY',
      visible: true,
      projectBound: true,
      auditLogId: rawDownloadAuditLogId,
      auditLogIdBound: true,
      resourceType: 'ARTIFACT',
      resourceId: secondaryArtifactId,
      action: 'ARTIFACT_RAW_DOWNLOAD',
      status: 'SUCCESS',
      successOnly: true,
      navigatesToAuditLogs: true,
      lowSensitiveQueryOnly: true,
      urlHasRawPayload: false,
      urlHasStoragePath: false,
      urlHasFileName: false,
    },
    rawDownloadAuditFallback: {
      scope: 'ARTIFACTS_RAW_DOWNLOAD_AUDIT_FALLBACK_WITHOUT_RECEIPT_ID_ONLY',
      visible: true,
      artifactId: binaryArtifactId,
      receiptIdMissing: network.downloadBoundaries.some(boundary => boundary.artifactId === binaryArtifactId && boundary.auditLogId === undefined),
      fallbackUsesResourceActionStatus: true,
      fallbackUrlHasAuditLogId: false,
      fallbackDoesNotClaimReceiptId: true,
      urlHasRawPayload: false,
      urlHasFileName: false,
    },
    previewRequests: network.previewRequests,
    downloadRequests: network.downloadRequests,
    spec: 'artifacts-detail-selection-smoke.spec.ts',
    baseURLHost,
  }
  const markerText = JSON.stringify(markerPayload)
  for (const secret of forbiddenArtifactPreviewSecrets) {
    expect(markerText, `marker must not include raw artifact preview secret: ${secret}`).not.toContain(secret)
  }
  expect(markerText, 'marker must not include raw artifact download payload').not.toContain(artifactRawDownloadPayloadSecret)
  console.log('ARTIFACTS_DETAIL_SELECTION_SMOKE_OK', markerText)
})
