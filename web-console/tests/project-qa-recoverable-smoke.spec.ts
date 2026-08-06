import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

const projectId = 1
const repositoryId = 11
const scanTaskId = 601
const targetFile = 'src/main/java/demo/OrderService.java'
const projectQaChunkRawSecretSentinel = 'sl_project_qa_chunk_secret_sentinel_20260703'
const projectQaChunkRawSkSecret = 'sk-projectqachunksecretshouldnotrender123456789'
const projectQaChunkRawJwtSecret = 'eyJprojectQaChunkSecretHeader.eyJprojectQaChunkSecretPayload.projectQaChunkSecretSignature'
const projectQaChunkRawQuotedSecret = 'quoted project qa chunk secret should not render'
const projectQaChunkRawPasswordSecret = 'project-qa-chunk-password-should-not-render'
const forbiddenProjectQaChunkSecrets = [
  projectQaChunkRawSecretSentinel,
  projectQaChunkRawSkSecret,
  projectQaChunkRawJwtSecret,
  projectQaChunkRawQuotedSecret,
  projectQaChunkRawPasswordSecret,
]
const redactedSecretLabel = '[REDACTED]'
const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]
const verifiedCitationEnforcementReason = 'DIRECT_VERIFIED'

const codeChunkEvidenceReadableFields = [
  'filePath',
  'lineRange',
  'contextRole',
  'evidenceType',
  'score',
  'embeddingState',
  'matchedTerms',
  'evidenceReason',
  'metaGrid',
  'contentPreview',
  'actions',
]

const evidenceCombinationReadableFields = [
  'topSource',
  'primaryCount',
  'adjacentContextCount',
  'uniqueFileCount',
  'embeddedEvidenceCount',
  'rolePath',
  'nextQuestions',
]

const project = {
  id: projectId,
  name: 'Project QA Recoverable Smoke',
  description: 'Mocked project for QA and code_chunks recoverable failures',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 82,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const repository = {
  id: repositoryId,
  projectId,
  provider: 'GITHUB',
  owner: 'demo',
  name: 'project-qa-recoverable',
  url: 'https://github.com/demo/project-qa-recoverable.git',
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
  commitSha: 'recoverableabcdef',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:02:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:30Z',
}

const executionTask = {
  id: 801,
  projectId,
  repositoryId,
  taskType: 'SCAN_REPOSITORY',
  sourceType: 'SCAN_TASK',
  sourceId: scanTaskId,
  status: 'SUCCESS',
  currentStep: 'finalize_scan',
  currentAttemptId: 1,
  progress: 100,
  errorMessage: null,
  createdBy: 1,
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:02:00Z',
  createdAt: '2026-07-01T10:00:30Z',
  updatedAt: '2026-07-01T10:02:00Z',
}

const overviewArtifact = {
  id: 401,
  projectId,
  repositoryId,
  ownerType: 'SCAN_TASK',
  ownerId: scanTaskId,
  artifactType: 'ARCHITECTURE_OVERVIEW',
  contentType: 'application/json',
  sizeBytes: 1024,
  checksumSha256: 'overview-checksum',
  metadataJson: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:02:00Z',
}

const reportArtifact = {
  ...overviewArtifact,
  id: 402,
  artifactType: 'ARCHITECTURE_REPORT',
  checksumSha256: 'report-checksum',
}

const candidateChunk = {
  id: 9101,
  scanTaskId,
  filePath: targetFile,
  startLine: 51,
  endLine: 89,
  content: `class OrderService { OrderResult createOrder(OrderRequest request) { return orderRepository.save(request); } String token = "${projectQaChunkRawSecretSentinel}"; }`,
  contentPreview: [
    'class OrderService {',
    '  OrderResult createOrder(OrderRequest request) {',
    '    return orderRepository.save(request);',
    '  }',
    `  // Authorization: Bearer ${projectQaChunkRawSecretSentinel}`,
    `  // Bearer ${projectQaChunkRawSecretSentinel}`,
    `  // token=${projectQaChunkRawSecretSentinel}`,
    `  // apiKey=${projectQaChunkRawSkSecret}`,
    `  // api_key=${projectQaChunkRawSecretSentinel}`,
    `  // secret="${projectQaChunkRawQuotedSecret}" password=${projectQaChunkRawPasswordSecret}`,
    `  // privateKey=${projectQaChunkRawSecretSentinel} private_key=${projectQaChunkRawSecretSentinel}`,
    `  // accessToken=${projectQaChunkRawSecretSentinel} access_token=${projectQaChunkRawSecretSentinel}`,
    `  // refreshToken=${projectQaChunkRawSecretSentinel} refresh_token=${projectQaChunkRawSecretSentinel}`,
    `  // jwt=${projectQaChunkRawJwtSecret}`,
    '}',
  ].join('\n'),
  hasEmbedding: true,
  matchedTerms: ['OrderService', 'createOrder'],
  relevanceScore: 86,
  evidenceType: 'SERVICE',
  evidenceReason: '主证据直接命中订单创建服务。',
  contextRole: 'PRIMARY',
  contextDistance: 0,
  sourceLabel: 'C1',
  citationId: 'chunk-9101',
}

const adjacentContextChunk = {
  id: 9102,
  scanTaskId,
  filePath: 'src/main/java/demo/OrderRepository.java',
  startLine: 12,
  endLine: 31,
  content: `interface OrderRepository { OrderResult save(OrderRequest request); String apiKey = "${projectQaChunkRawSkSecret}"; }`,
  contentPreview: [
    'interface OrderRepository {',
    '  OrderResult save(OrderRequest request);',
    `  // apikey=${projectQaChunkRawSecretSentinel}`,
    `  // Authorization: Bearer ${projectQaChunkRawSecretSentinel}`,
    '}',
  ].join('\n'),
  hasEmbedding: true,
  matchedTerms: ['OrderRepository', 'save'],
  relevanceScore: 67,
  evidenceType: 'DATA_ACCESS',
  evidenceReason: '相邻上下文说明订单创建后的持久化边界。',
  contextRole: 'ADJACENT_CONTEXT',
  contextDistance: 1,
  sourceLabel: 'C2',
  citationId: 'chunk-9102',
}

type RuntimeIssue = {
  type: string
  message: string
}

type ProjectQaEvidenceRef = {
  category?: string
  source?: string
  title?: string
  summary?: string
  filePath?: string
  lineNumber?: string
}

function result<T>(data: T, message = 'OK') {
  return {
    code: 'SUCCESS',
    message,
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

function codeChunkPayload(query: string) {
  const items = query.includes('STALE_SCAN_ACTION_GATE')
    ? [{ ...candidateChunk, scanTaskId: scanTaskId + 99, sourceLabel: 'C1' }, adjacentContextChunk]
    : query.includes('CONTEXT_ONLY_ACTION_GATE')
      ? [{ ...adjacentContextChunk, sourceLabel: 'C1', contextRole: 'ADJACENT_CONTEXT', scanTaskId }]
      : [candidateChunk, adjacentContextChunk]
  return {
    scanTaskId,
    query,
    limit: 8,
    total: items.length,
    resultCount: items.length,
    totalChunks: 256,
    embeddedChunks: 144,
    truncated: false,
    retrievalMode: 'HYBRID',
    evidenceProfile: {
      readiness: 'READY',
      confidence: 86,
      summary: 'Recoverable smoke evidence is stable.',
      nextAction: '可以基于此证据继续追问。',
      details: ['recoverable', 'hybrid'],
      uniqueFiles: 2,
      embeddedEvidenceCount: 2,
      lowConfidenceCount: 0,
      topScore: 86,
      averageScore: 77,
      lineSpan: 59,
      dominantEvidenceType: 'SERVICE',
      evidenceTypeStats: [{ type: 'SERVICE', count: 1 }, { type: 'DATA_ACCESS', count: 1 }],
      fileStats: [
        { filePath: targetFile, count: 1, bestScore: 86 },
        { filePath: adjacentContextChunk.filePath, count: 1, bestScore: 67 },
      ],
    },
    items,
  }
}

function sourceLocationQaCitationCoverage(matchType: 'REPORT_LINE_ANCHOR' | 'REPORT_FILE_ANCHOR') {
  const readyForRepair = matchType === 'REPORT_LINE_ANCHOR'
  return {
    status: readyForRepair ? 'FULL' : 'PARTIAL',
    totalEvidenceCount: 1,
    citedEvidenceCount: 1,
    uncitedCandidateCount: 0,
    repairCandidateCount: 1,
    coveragePercent: 100,
    requiredEvidenceCount: 1,
    citedRequiredEvidenceCount: 1,
    requiredEvidenceCoveragePercent: 100,
    uniqueEvidenceFileCount: 1,
    citedEvidenceFileCount: 1,
    primaryEvidenceCount: 1,
    citedPrimaryEvidenceCount: 1,
    primaryEvidenceFileCount: 1,
    citedPrimaryEvidenceFileCount: 1,
    contextEvidenceCount: 0,
    citedContextEvidenceCount: 0,
    contextEvidenceFileCount: 0,
    citedContextEvidenceFileCount: 0,
    requiredEvidenceFileCount: 1,
    citedRequiredEvidenceFileCount: 1,
    coverageScope: 'REQUIRED',
    evidenceRoleDistribution: {
      status: 'PRIMARY_BOUND',
      totalFileCount: 1,
      citedFileCount: 1,
      primaryFileCount: 1,
      citedPrimaryFileCount: 1,
      contextFileCount: 0,
      citedContextFileCount: 0,
      roles: [{
        role: 'PRIMARY',
        evidenceCount: 1,
        citedEvidenceCount: 1,
        fileCount: 1,
        citedFileCount: 1,
      }],
      files: [{
        filePath: targetFile,
        evidenceCount: 1,
        citedEvidenceCount: 1,
        primaryEvidenceCount: 1,
        citedPrimaryEvidenceCount: 1,
        contextEvidenceCount: 0,
        citedContextEvidenceCount: 0,
      }],
    },
  }
}

function sourceLocationQaClaimCoverage() {
  return {
    status: 'READY',
    requiredClaimCount: 1,
    citedRequiredClaimCount: 1,
    claimCoveragePercent: 100,
    invalidCitationClaimCount: 0,
    validCitationFileCount: 1,
    requiredClaimCitationFileCount: 1,
    validCitationFiles: [targetFile],
    requiredClaimCitationFiles: [targetFile],
    roleDistribution: {
      status: 'PRIMARY_BOUND',
      requiredClaimCount: 1,
      requiredPrimaryBoundClaimCount: 1,
      requiredContextOnlyClaimCount: 0,
      requiredUnknownOnlyClaimCount: 0,
      unbackedRequiredClaimCount: 0,
      invalidRequiredClaimCount: 0,
      validCitationFileCount: 1,
      requiredClaimCitationFileCount: 1,
      requiredPrimaryFileCount: 1,
      primaryFileCount: 1,
      requiredContextFileCount: 0,
      contextFileCount: 0,
      roles: [{
        role: 'PRIMARY',
        claimCount: 1,
        requiredClaimCount: 1,
      }],
      files: [{
        filePath: targetFile,
        requiredPrimaryClaimCount: 1,
        requiredContextClaimCount: 0,
        requiredUnknownClaimCount: 0,
      }],
    },
    claims: [{
      claimId: 'claim-create-order',
      status: 'CITED',
      claimTextPreview: 'OrderService#createOrder writes the order through the repository.',
      sourceLabels: ['C1'],
      invalidSourceLabels: [],
    }],
  }
}

function qaPayload(question: string, evidenceRef?: ProjectQaEvidenceRef | null) {
  const sourceEvidenceMatchType = evidenceRef
    ? question.includes('SOURCE_LOCATION_FILE_ANCHOR_DRIFT')
      ? 'REPORT_FILE_ANCHOR'
      : 'REPORT_LINE_ANCHOR'
    : undefined
  return {
    answer: 'OrderService#createOrder 会校验请求后写入订单仓储，并返回订单创建结果。',
    scanTaskId,
    question,
    matchedChunks: 1,
    resultCount: 1,
    retrievalMode: 'HYBRID',
    totalChunks: 256,
    embeddedChunks: 144,
    truncated: false,
    evidenceProfile: codeChunkPayload(question).evidenceProfile,
    groundingStatus: 'VERIFIED',
    citationEnforcementStatus: 'DIRECT_VERIFIED',
    citationEnforcementReason: verifiedCitationEnforcementReason,
    citationEnforcementNote: 'Answer cited PRIMARY evidence and passed claim-level citation enforcement.',
    answerCitations: [{
      citationId: candidateChunk.citationId,
      sourceLabel: 'C1',
      chunkId: candidateChunk.id,
      scanTaskId,
      filePath: candidateChunk.filePath,
      startLine: candidateChunk.startLine,
      endLine: candidateChunk.endLine,
      evidenceType: candidateChunk.evidenceType,
      evidenceReason: candidateChunk.evidenceReason,
      relevanceScore: candidateChunk.relevanceScore,
      contextRole: candidateChunk.contextRole,
      contextDistance: candidateChunk.contextDistance,
      citedByAnswer: true,
    }],
    retrievedChunks: [candidateChunk],
    citationCoverage: sourceLocationQaCitationCoverage(sourceEvidenceMatchType === 'REPORT_FILE_ANCHOR' ? 'REPORT_FILE_ANCHOR' : 'REPORT_LINE_ANCHOR'),
    claimCitationCoverage: sourceLocationQaClaimCoverage(),
    sourceEvidenceRef: evidenceRef || undefined,
    sourceEvidenceMatched: evidenceRef ? true : undefined,
    sourceEvidenceMatchType,
  }
}

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.text().includes('findDOMNode') && message.text().includes('deprecated')) return
    if (message.text().includes('Failed to load resource') && message.text().includes('503')) return
    if (message.text().includes('[antd: message] Static function can not consume context')) return
    issues.push({ type: 'console.error', message: message.text() })
  })
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', message: error.message })
  })

  return issues
}

async function installProjectQaRecoverableMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const qaRequests: any[] = []
  const qaResponses: any[] = []
  const counters = {
    codeChunkSearch: 0,
    qa: 0,
  }
  const failures = {
    codeChunkSearch: 0,
    qa: 0,
  }

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'project-qa-recoverable-smoke-token')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          ;(window as any).__projectQaLastClipboardText = String(text)
        },
      },
    })
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

    if (method === 'GET' && path === '/api/auth/me') {
      await fulfillJson(route, result({ id: 1, username: 'project_qa_recoverable', email: 'smoke@local.test', status: 'ACTIVE' }))
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

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      await fulfillJson(route, result({ items: [executionTask], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      await fulfillJson(route, result([overviewArtifact, reportArtifact]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${overviewArtifact.id}/preview`) {
      await fulfillJson(route, result({
        record: overviewArtifact,
        text: JSON.stringify({
          languages: [{ name: 'Java', file_count: 24, line_count: 3600 }],
          framework: { name: 'Spring Boot', version: '3.3' },
          totalFiles: 24,
          totalDirs: 7,
          totalLines: 3600,
        }),
        truncated: false,
        previewBytes: 512,
      }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${reportArtifact.id}/preview`) {
      await fulfillJson(route, result({
        record: reportArtifact,
        text: JSON.stringify({
          reportQuality: {
            readiness: 'READY',
            confidence: 86,
            summary: '报告证据可用于 QA recoverable smoke。',
            gaps: [],
            nextActions: ['进入代码问答复核主链路'],
            evidenceChecks: [],
          },
        }),
        truncated: false,
        previewBytes: 512,
      }))
      return
    }

    if (method === 'GET' && (path === `/api/projects/${projectId}/code-chunks/search` || path === `/api/projects/${projectId}/code-chunks/status`)) {
      counters.codeChunkSearch += 1
      const query = url.searchParams.get('query') || ''
      if (query.includes('RECOVERABLE_') && failures.codeChunkSearch > 0) {
        failures.codeChunkSearch -= 1
        await fulfillJson(route, { code: 'ERROR', message: 'mock code_chunks search unavailable', data: null }, 503)
        return
      }
      await fulfillJson(route, result(codeChunkPayload(query)))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/qa`) {
      counters.qa += 1
      const payload = JSON.parse(request.postData() || '{}')
      qaRequests.push(payload)
      if (failures.qa > 0) {
        failures.qa -= 1
        await fulfillJson(route, { code: 'ERROR', message: 'mock QA provider unavailable', data: null }, 503)
        return
      }
      const responsePayload = qaPayload(String(payload.question || ''), payload.evidenceRef || null)
      qaResponses.push(responsePayload)
      await fulfillJson(route, result(responsePayload))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ code: 'ERROR', message: 'Unhandled mock route', data: null }),
    })
  })

  return { counters, failures, qaRequests, qaResponses, unhandledApiRequests }
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
  await expect(locator, `${label}: visible`).toBeVisible()
  await expect.poll(async () => {
    const viewportWidth = await locator.page().evaluate(() => window.innerWidth)
    return locator.evaluate((element, width) => {
      const box = element.getBoundingClientRect()
      return Math.max(-box.x, box.x + box.width - width)
    }, viewportWidth)
  }, { message: `${label} must stay inside viewport after layout settles` }).toBeLessThanOrEqual(1)
}

async function expectLocatorTextNotClipped(locator: Locator, label: string, options: { mustWrap?: boolean } = {}) {
  await locator.scrollIntoViewIfNeeded()
  await expect(locator, `${label} should be visible before measuring clipping`).toBeVisible()
  const metrics = await locator.evaluate(element => {
    const style = window.getComputedStyle(element)
    return {
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      textOverflow: style.textOverflow,
      whiteSpace: style.whiteSpace,
      overflowWrap: style.overflowWrap,
      wordBreak: style.wordBreak,
      text: element.textContent?.trim() || '',
    }
  })
  if (options.mustWrap) {
    expect(metrics.whiteSpace, `${label} must not force single-line evidence: ${JSON.stringify(metrics)}`).not.toBe('nowrap')
    expect(
      metrics.overflowWrap === 'anywhere' || metrics.wordBreak === 'break-word' || metrics.wordBreak === 'break-all',
      `${label} must allow long evidence to wrap: ${JSON.stringify(metrics)}`,
    ).toBe(true)
  }
  expect(metrics.textOverflow, `${label} must not hide critical evidence with ellipsis: ${JSON.stringify(metrics)}`).not.toBe('ellipsis')
  expect(
    metrics.scrollWidth,
    `${label} text must not be horizontally clipped: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.clientWidth + 2)
  expect(
    metrics.scrollHeight,
    `${label} text must not be vertically clipped: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.clientHeight + 2)
}

async function expectAllLocatorTextNotClipped(locator: Locator, label: string, options: { mustWrap?: boolean } = {}) {
  const count = await locator.count()
  expect(count, `${label} must have at least one readable item`).toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) {
    await expectLocatorTextNotClipped(locator.nth(index), `${label}:${index}`, options)
  }
}

async function expectLocatorCanWrap(locator: Locator, label: string) {
  await locator.scrollIntoViewIfNeeded()
  await expect(locator, `${label} should be visible before measuring wrapping`).toBeVisible()
  const metrics = await locator.evaluate(element => {
    const style = window.getComputedStyle(element)
    return {
      display: style.display,
      flexWrap: style.flexWrap,
      whiteSpace: style.whiteSpace,
      overflowWrap: style.overflowWrap,
      wordBreak: style.wordBreak,
    }
  })
  expect(
    metrics.flexWrap === 'wrap'
      || metrics.whiteSpace !== 'nowrap'
      || metrics.overflowWrap === 'anywhere'
      || metrics.wordBreak === 'break-word'
      || metrics.wordBreak === 'break-all',
    `${label} must allow evidence content to wrap: ${JSON.stringify(metrics)}`,
  ).toBe(true)
}

async function expectLocatorAbove(upper: Locator, lower: Locator, label: string) {
  const [upperBox, lowerBox] = await Promise.all([
    upper.boundingBox(),
    lower.boundingBox(),
  ])
  expect(upperBox, `${label}: upper locator must have a box`).not.toBeNull()
  expect(lowerBox, `${label}: lower locator must have a box`).not.toBeNull()
  expect(upperBox!.y, `${label}: answer content must render before evidence details`).toBeLessThan(lowerBox!.y)
}

async function assertAnswerFirstAndEvidenceDeduped(page: Page, label: string) {
  const bubble = page.locator('.sl-chat-bubble-assistant').filter({ hasText: 'OrderService#createOrder 会校验请求后写入订单仓储' }).last()
  await expect(bubble, `${label}: assistant answer bubble should be visible`).toBeVisible()
  await expect(bubble.locator('.sl-chat-content')).toContainText('OrderService#createOrder 会校验请求后写入订单仓储')
  await expectLocatorAbove(bubble.locator('.sl-chat-content'), bubble.getByLabel('回答引用证据'), `${label}:answer-before-citations`)
  await expect(bubble.getByLabel('回答证据去重说明')).toContainText('已引用证据 1 条不再重复展示为代码切片卡片')
  await expect(page.getByRole('article', { name: '代码切片证据 C1' })).toHaveCount(0)
}

function projectQaEvidenceUrl(question: string, evidenceLine: string) {
  const params = new URLSearchParams()
  params.set('tab', 'qa')
  params.set('scanTaskId', String(scanTaskId))
  params.set('question', question)
  params.set('evidenceCategory', 'Project QA mocked source evidence')
  params.set('evidenceSource', 'project-qa-recoverable smoke')
  params.set('evidenceTitle', 'OrderService#createOrder source anchor')
  params.set('evidenceFile', targetFile)
  params.set('evidenceLine', evidenceLine)
  return `/projects/${projectId}?${params.toString()}`
}

async function submitEvidenceBoundQa(page: Page, label: string) {
  const qaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  })
  await page.getByRole('button', { name: '发送' }).last().click()
  const qaResponse = await qaResponsePromise
  const requestPayload = JSON.parse(qaResponse.request().postData() || '{}')
  const responseBody = await qaResponse.json()
  expect(responseBody.code, `${label}: evidence-bound QA response must succeed`).toBe('SUCCESS')
  expect(requestPayload.evidenceRef?.filePath, `${label}: QA request must carry source evidence file`).toBe(targetFile)
  expect(String(requestPayload.evidenceRef?.lineNumber || ''), `${label}: QA request must carry source evidence line`).not.toBe('')
  return { requestPayload, responseBody }
}

type SourceLocationReadabilityProof = {
  viewportName: string
  mode: 'ready' | 'review'
  sourceReceipt: {
    contained: true
    referenceWraps: true
    titleNotClipped: true
    tagsNotClipped: true
  }
  sourceLocationConfidence: {
    contained: true
    metricsNotClipped: true
    checksWrap: true
  }
  sourceFileMatchRelease: {
    contained: true
    targetReferenceNotClipped: true
    citedReferenceNotClipped: true
    checksNotClipped: true
    noRepairOnReview: boolean
  }
  noHorizontalOverflow: true
}

async function assertSourceLocationConfidenceReady(page: Page, label: string) {
  const viewportName = label.split(':')[0] || 'unknown'
  const receipt = page.getByLabel('QA 回答报告证据凭证').last()
  await expectContainedInViewport(receipt, `${label}:source-receipt`)
  await expect(receipt, `${label}: source evidence receipt should be visible`).toBeVisible()
  await expect(receipt).toContainText('OrderService#createOrder source anchor')
  await expect(receipt).toContainText('project-qa-recoverable smoke')
  await expect(receipt).toContainText(targetFile)
  await expect(receipt).toContainText('REPORT_LINE_ANCHOR')
  await expect(receipt).toContainText('行级锚点')
  await expectLocatorTextNotClipped(receipt.locator('.sl-qa-source-receipt-head strong').first(), `${label}:source-receipt-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(receipt.locator('.sl-qa-source-receipt-ref span').first(), `${label}:source-receipt-reference`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(receipt.locator('.sl-qa-source-receipt-tags .ant-tag'), `${label}:source-receipt-tags`)

  const confidence = page.getByLabel('来源定位可信度').last()
  await expectContainedInViewport(confidence, `${label}:source-location-confidence`)
  await expect(confidence, `${label}: source location confidence should be visible`).toBeVisible()
  await expect(confidence.getByText('来源定位可信', { exact: true })).toBeVisible()
  await expect(confidence.locator('.sl-qa-source-location-confidence-head').getByText('已绑定', { exact: true })).toBeVisible()
  await expect(confidence.getByText('回答引用覆盖来源文件')).toBeVisible()
  await expectLocatorTextNotClipped(confidence.locator('.sl-qa-source-location-confidence-head strong').first(), `${label}:source-location-confidence-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(confidence.locator('p').first(), `${label}:source-location-confidence-copy`)
  await expectAllLocatorTextNotClipped(confidence.locator('.sl-qa-source-location-confidence-metrics strong'), `${label}:source-location-confidence-metrics`)
  await expectLocatorCanWrap(confidence.locator('.sl-qa-source-location-confidence-checks').first(), `${label}:source-location-confidence-checks`)
  await expectAllLocatorTextNotClipped(confidence.locator('.sl-qa-source-location-confidence-checks .ant-tag'), `${label}:source-location-confidence-check-tags`)

  const release = page.getByLabel('来源文件匹配说明').last()
  await expectContainedInViewport(release, `${label}:source-file-match-release`)
  await expect(release, `${label}: source file match release should be visible`).toBeVisible()
  await expect(release.getByText('满足修复候选放行')).toBeVisible()
  await expect(release.getByText('已满足：行级锚点').first()).toBeVisible()
  await expect(release.getByText('已满足：主张 PRIMARY 绑定').first()).toBeVisible()
  await expect(release).toContainText('不证明 LLM 事实语义正确')
  await expectLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-head strong').first(), `${label}:source-file-match-release-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(release.locator('p').first(), `${label}:source-file-match-release-copy`)
  await expectLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-grid strong').nth(0), `${label}:source-file-match-release-target`, { mustWrap: true })
  await expectLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-grid strong').nth(1), `${label}:source-file-match-release-cited`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-checks strong'), `${label}:source-file-match-release-check-titles`)
  await expectAllLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-checks > div > div span'), `${label}:source-file-match-release-check-copy`)
  await expectLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-next').first(), `${label}:source-file-match-release-next`)

  const actionRail = page.getByLabel('QA 下一步动作').last()
  await expect(actionRail.getByRole('button', { name: '生成修复候选' }), `${label}: ready line anchor should expose repair action`).toBeVisible()
  await expectNoHorizontalOverflow(page, `${label}:source-location-confidence-readability`)

  return {
    viewportName,
    mode: 'ready',
    sourceReceipt: {
      contained: true,
      referenceWraps: true,
      titleNotClipped: true,
      tagsNotClipped: true,
    },
    sourceLocationConfidence: {
      contained: true,
      metricsNotClipped: true,
      checksWrap: true,
    },
    sourceFileMatchRelease: {
      contained: true,
      targetReferenceNotClipped: true,
      citedReferenceNotClipped: true,
      checksNotClipped: true,
      noRepairOnReview: false,
    },
    noHorizontalOverflow: true,
  } satisfies SourceLocationReadabilityProof
}

async function assertSourceLocationConfidenceFileAnchorReview(page: Page, label: string) {
  const viewportName = label.split(':')[0] || 'unknown'
  const receipt = page.getByLabel('QA 回答报告证据凭证').last()
  await expectContainedInViewport(receipt, `${label}:source-receipt`)
  await expect(receipt, `${label}: file-anchor source evidence receipt should be visible`).toBeVisible()
  await expect(receipt).toContainText('REPORT_FILE_ANCHOR')
  await expect(receipt).toContainText('文件锚点')
  await expectLocatorTextNotClipped(receipt.locator('.sl-qa-source-receipt-head strong').first(), `${label}:source-receipt-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(receipt.locator('.sl-qa-source-receipt-ref span').first(), `${label}:source-receipt-reference`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(receipt.locator('.sl-qa-source-receipt-tags .ant-tag'), `${label}:source-receipt-tags`)

  const confidence = page.getByLabel('来源定位可信度').last()
  await expectContainedInViewport(confidence, `${label}:source-location-confidence`)
  await expect(confidence, `${label}: file-anchor source location confidence should be visible`).toBeVisible()
  await expect(confidence.getByText('来源定位需复核', { exact: true })).toBeVisible()
  await expect(confidence.locator('.sl-qa-source-location-confidence-head').getByText('需复核', { exact: true })).toBeVisible()
  await expect(confidence).toContainText('缺少行级锚点')
  await expectLocatorTextNotClipped(confidence.locator('.sl-qa-source-location-confidence-head strong').first(), `${label}:source-location-confidence-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(confidence.locator('p').first(), `${label}:source-location-confidence-copy`)
  await expectAllLocatorTextNotClipped(confidence.locator('.sl-qa-source-location-confidence-metrics strong'), `${label}:source-location-confidence-metrics`)
  await expectLocatorCanWrap(confidence.locator('.sl-qa-source-location-confidence-checks').first(), `${label}:source-location-confidence-checks`)
  await expectAllLocatorTextNotClipped(confidence.locator('.sl-qa-source-location-confidence-checks .ant-tag'), `${label}:source-location-confidence-check-tags`)

  const release = page.getByLabel('来源文件匹配说明').last()
  await expectContainedInViewport(release, `${label}:source-file-match-release`)
  await expect(release, `${label}: file-anchor source file match release should be visible`).toBeVisible()
  await expect(release.getByText('修复候选需复核')).toBeVisible()
  await expect(release).toContainText('来源仍停留在文件锚点')
  await expect(release).toContainText('确认报告证据行号后重试此问题')
  await expectLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-head strong').first(), `${label}:source-file-match-release-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(release.locator('p').first(), `${label}:source-file-match-release-copy`)
  await expectLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-grid strong').nth(0), `${label}:source-file-match-release-target`, { mustWrap: true })
  await expectLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-grid strong').nth(1), `${label}:source-file-match-release-cited`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-checks strong'), `${label}:source-file-match-release-check-titles`)
  await expectAllLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-checks > div > div span'), `${label}:source-file-match-release-check-copy`)
  await expectLocatorTextNotClipped(release.locator('.sl-qa-source-match-release-next').first(), `${label}:source-file-match-release-next`)

  const actionRail = page.getByLabel('QA 下一步动作').last()
  await expect(actionRail.getByRole('button', { name: '生成修复候选' }), `${label}: file anchor drift must not expose repair action`).toHaveCount(0)
  const latestCitationList = page.getByLabel('回答引用证据').last()
  await expect(latestCitationList.getByRole('button', { name: '生成修复候选' }), `${label}: file anchor drift citation card must not expose repair action`).toHaveCount(0)
  await expectNoHorizontalOverflow(page, `${label}:source-location-confidence-readability`)

  return {
    viewportName,
    mode: 'review',
    sourceReceipt: {
      contained: true,
      referenceWraps: true,
      titleNotClipped: true,
      tagsNotClipped: true,
    },
    sourceLocationConfidence: {
      contained: true,
      metricsNotClipped: true,
      checksWrap: true,
    },
    sourceFileMatchRelease: {
      contained: true,
      targetReferenceNotClipped: true,
      citedReferenceNotClipped: true,
      checksNotClipped: true,
      noRepairOnReview: true,
    },
    noHorizontalOverflow: true,
  } satisfies SourceLocationReadabilityProof
}

async function assertCodeChunkEvidenceCard(page: Page, label: string) {
  const card = page.getByRole('article', { name: 'code_chunks 证据卡片 C1' }).last()
  const preview = card.locator('.sl-search-code-preview-redacted')
  await expect(card, `${label}: code chunk evidence card should be visible`).toBeVisible()
  await expect(card.locator('.sl-search-result-source')).toHaveText('C1')
  await expect(card.getByText(targetFile).first()).toBeVisible()
  await expect(card.getByText(`${targetFile}:51-89`)).toBeVisible()
  await expect(card.getByText('第 51-89 行')).toBeVisible()
  await expect(card.getByText('主证据').first()).toBeVisible()
  await expect(card.getByText('Service').first()).toBeVisible()
  await expect(card.getByText('相关分 86')).toBeVisible()
  await expect(card.getByText('已向量化')).toBeVisible()
  await expect(card.getByText('可语义召回')).toBeVisible()
  await expect(card.getByText('主证据直接命中订单创建服务。')).toBeVisible()
  await expect(card.getByText('OrderService').first()).toBeVisible()
  await expect(card.getByText('createOrder').first()).toBeVisible()
  await expect(card.getByText('证据说明')).toBeVisible()
  await expect(card.getByText('命中词')).toBeVisible()
  await expect(card.getByText('证据编号')).toBeVisible()
  await expect(card.getByText('文件路径')).toBeVisible()
  await expect(card.getByText('行号范围')).toBeVisible()
  await expect(card.getByText('证据角色')).toBeVisible()
  await expect(card.getByText('证据类型')).toBeVisible()
  await expect(card.getByText('召回方式')).toBeVisible()
  await expect(card.getByText('OrderResult createOrder')).toBeVisible()
  await expect(preview, `${label}: redacted code chunk preview should be labelled`).toHaveAttribute('aria-label', '脱敏 code chunk 搜索结果预览')
  await expect(preview, `${label}: redacted code chunk preview should show redaction markers`).toContainText(redactedSecretLabel)
  for (const secret of forbiddenProjectQaChunkSecrets) {
    await expect(preview, `${label}: preview must hide raw secret ${secret}`).not.toContainText(secret)
  }
  await expect(card.getByRole('button', { name: '定位检索' })).toBeVisible()
  await expect(card.getByRole('button', { name: '追问此处' })).toBeVisible()
  await expect(card.getByRole('button', { name: '复制引用' })).toBeVisible()
  await expect(card.getByRole('button', { name: '复制链接' })).toBeVisible()
  await expectLocatorTextNotClipped(card.locator('.sl-search-result-path'), `${label}: evidence card file path`)
  await expectLocatorTextNotClipped(card.locator('.sl-search-result-line-ref'), `${label}: evidence card line reference`)
  await expectLocatorTextNotClipped(card.locator('.sl-search-evidence-reason p'), `${label}: evidence reason`)
  await expectLocatorTextNotClipped(card.locator('.sl-search-result-meta-grid strong').nth(2), `${label}: evidence line range metric`)
}

async function assertProjectQaChunkPreviewRedaction(page: Page, label: string) {
  const card = page.getByRole('article', { name: 'code_chunks 证据卡片 C1' }).last()
  const preview = card.locator('.sl-search-code-preview-redacted')
  await expect(preview, `${label}: redacted Project QA chunk preview should be visible`).toBeVisible()
  await expect(preview, `${label}: sanitized preview should preserve useful source context`).toContainText('OrderResult createOrder')
  await expect(preview, `${label}: sanitized preview should expose redaction marker`).toContainText(redactedSecretLabel)
  for (const secret of forbiddenProjectQaChunkSecrets) {
    await expect(card, `${label}: card hides raw secret ${secret}`).not.toContainText(secret)
    await expect(page.locator('body'), `${label}: body hides raw secret ${secret}`).not.toContainText(secret)
  }

  await card.getByRole('button', { name: '复制引用' }).click()
  const copiedText = await page.evaluate(() => String((window as any).__projectQaLastClipboardText || ''))
  expect(copiedText, `${label}: copied citation should keep useful line reference`).toContain(`${targetFile}:51-89`)
  expect(copiedText, `${label}: copied citation should keep redaction marker`).toContain(redactedSecretLabel)
  for (const secret of forbiddenProjectQaChunkSecrets) {
    expect(copiedText, `${label}: copied citation must hide raw secret ${secret}`).not.toContain(secret)
  }
}

async function assertEvidenceCombinationSummary(page: Page, label: string) {
  const summary = page.getByLabel('证据组合路径').last()
  const grid = summary.locator('.sl-qa-evidence-combination-grid')
  const path = summary.locator('.sl-qa-evidence-combination-path')
  const next = summary.locator('.sl-qa-evidence-combination-next')
  await expect(summary, `${label}: evidence combination summary should be visible`).toBeVisible()
  await expect(summary.getByText('证据组合路径')).toBeVisible()
  await expect(summary.getByText('跨文件复核路径')).toBeVisible()
  await expect(summary.getByText('C1', { exact: true })).toBeVisible()
  await expect(grid.getByText(`${targetFile}:51-89`)).toBeVisible()
  await expect(grid.getByText('主证据阅读起点')).toBeVisible()
  await expect(grid.getByText('相邻上下文', { exact: true })).toBeVisible()
  await expect(grid.getByText('1 条')).toBeVisible()
  await expect(grid.getByText('文件覆盖')).toBeVisible()
  await expect(grid.getByText('2 个文件')).toBeVisible()
  await expect(grid.getByText('向量证据')).toBeVisible()
  await expect(grid.getByText('2 条')).toBeVisible()
  await expect(path.getByText('主证据 1')).toBeVisible()
  await expect(path.getByText('上下文 1')).toBeVisible()
  await expect(path.getByText('跨文件 2')).toBeVisible()
  await expect(path.getByText('OrderService.java')).toBeVisible()
  await expect(path.getByText('OrderRepository.java')).toBeVisible()
  await expect(next.getByText('解释 C1 的职责和关键分支')).toBeVisible()
  await expect(next.getByText('把主证据和相邻上下文串成调用链')).toBeVisible()
  await expect(next.getByText('对比跨文件证据是否支持同一个结论')).toBeVisible()
}

async function assertCodeUnderstandingLens(page: Page, label: string) {
  const lens = page.getByLabel('代码理解定位入口').last()
  const grid = lens.locator('.sl-code-understanding-lens-grid')
  const contract = lens.getByLabel('Agent 交接合约')
  const gate = lens.getByLabel('Agent 交接门禁说明')
  await expect(lens, `${label}: code understanding lens should be visible`).toBeVisible()
  await expect(lens.getByText('代码理解入口')).toBeVisible()
  await expect(lens.getByText('方法锚点')).toBeVisible()
  await expect(lens.getByText('按类名与方法名定位')).toBeVisible()
  await expect(grid.getByText(`Scan #${scanTaskId}`)).toBeVisible()
  await expect(grid.getByText(`${targetFile}:51-89`)).toBeVisible()
  await expect(grid.getByText('C1', { exact: true })).toBeVisible()
  await expect(grid.getByText('主证据', { exact: true })).toBeVisible()
  await expect(grid.getByText('Service', { exact: true })).toBeVisible()
  await expect(grid.getByText('86', { exact: true })).toBeVisible()
  await expect(grid.getByText('混合召回')).toBeVisible()
  await expect(grid.getByText('READY')).toBeVisible()
  await expect(lens.getByText('当前扫描已绑定')).toBeVisible()
  await expect(lens.getByText('PRIMARY 主证据', { exact: true })).toBeVisible()
  await expect(lens.getByText('可交给 Agent')).toBeVisible()
  await expect(gate, `${label}: Agent handoff gate reason should be visible`).toBeVisible()
  await expect(gate.getByText('Agent 交接门禁已开放')).toBeVisible()
  await expect(gate.getByText('当前扫描、PRIMARY 主证据和检索状态均满足交接条件。')).toBeVisible()
  const readyGateStyles = await gate.locator('strong').evaluate(element => {
    const styles = getComputedStyle(element)
    return {
      overflow: styles.overflow,
      overflowWrap: styles.overflowWrap,
      textOverflow: styles.textOverflow,
      whiteSpace: styles.whiteSpace,
    }
  })
  expect(readyGateStyles.overflow, `${label}: ready gate reason must not hide overflow`).toBe('visible')
  expect(readyGateStyles.overflowWrap, `${label}: ready gate reason must wrap long text`).toBe('anywhere')
  expect(readyGateStyles.textOverflow, `${label}: ready gate reason must not use ellipsis`).toBe('clip')
  expect(readyGateStyles.whiteSpace, `${label}: ready gate reason must allow wrapping`).toBe('normal')
  await expect(contract, `${label}: Agent handoff contract should be visible before navigation`).toBeVisible()
  await expect(contract.getByText('交接字段')).toBeVisible()
  await expect(contract.getByText('扫描 / 文件 / 行号 / 证据角色')).toBeVisible()
  await expect(contract.getByText('不会携带')).toBeVisible()
  await expect(contract.getByText('源码正文 / raw prompt / stack')).toBeVisible()
  await expect(contract.getByText('进入 AgentChat 后手动发送')).toBeVisible()
  await expect(lens.getByRole('button', { name: '定位检索' })).toBeVisible()
  await expect(lens.getByRole('button', { name: '解释此处' })).toBeVisible()
  await expect(lens.getByRole('button', { name: '解释此处' })).toBeEnabled()
  await expect(lens.getByRole('button', { name: '交给 Agent' })).toBeVisible()
  await expect(lens.getByRole('button', { name: '交给 Agent' })).toBeEnabled()
  await expect(lens.getByRole('button', { name: '复制引用' })).toBeVisible()
  await expectLocatorTextNotClipped(lens.locator('.sl-code-understanding-lens-head strong'), `${label}: lens title`)
  await expectLocatorTextNotClipped(grid.locator('strong').nth(1), `${label}: lens primary location`)
  await expectLocatorTextNotClipped(gate.locator('strong'), `${label}: handoff gate reason`)
  await expectLocatorTextNotClipped(contract.locator('strong').nth(0), `${label}: handoff contract structured fields`)
  await expectLocatorTextNotClipped(contract.locator('strong').nth(1), `${label}: handoff contract raw boundary`)
  await expectLocatorTextNotClipped(contract.locator('strong').nth(2), `${label}: handoff contract manual send`)
}

async function assertCodeUnderstandingActionGate(page: Page, expectedReason: string, label: string) {
  const lens = page.getByLabel('代码理解定位入口').last()
  const checks = lens.locator('.sl-code-understanding-lens-checks')
  const gate = lens.getByLabel('Agent 交接门禁说明')
  await expect(lens, `${label}: code understanding lens should be visible for action gate`).toBeVisible()
  await expect(checks.getByText(expectedReason, { exact: true }), `${label}: disabled reason tag should be visible`).toBeVisible()
  await expect(gate, `${label}: explicit Agent handoff gate note should be visible`).toBeVisible()
  await expect(gate.getByText('Agent 交接门禁未开放')).toBeVisible()
  await expect(gate.getByText(expectedReason)).toBeVisible()
  await expectLocatorTextNotClipped(gate.locator('strong'), `${label}: explicit gate reason`)
  const gateStyles = await gate.locator('strong').evaluate(element => {
    const styles = getComputedStyle(element)
    return {
      overflow: styles.overflow,
      overflowWrap: styles.overflowWrap,
      textOverflow: styles.textOverflow,
      whiteSpace: styles.whiteSpace,
    }
  })
  expect(gateStyles.overflow, `${label}: gate reason must not hide overflow`).toBe('visible')
  expect(gateStyles.overflowWrap, `${label}: gate reason must wrap long text`).toBe('anywhere')
  expect(gateStyles.textOverflow, `${label}: gate reason must not use ellipsis`).toBe('clip')
  expect(gateStyles.whiteSpace, `${label}: gate reason must allow wrapping`).toBe('normal')
  await expect(lens.getByRole('button', { name: '定位检索' }), `${label}: locate should remain available`).toBeEnabled()
  await expect(lens.getByRole('button', { name: '解释此处' }), `${label}: explain should be blocked`).toBeDisabled()
  await expect(lens.getByRole('button', { name: '交给 Agent' }), `${label}: Agent handoff should be blocked`).toBeDisabled()
  await expect(lens.getByRole('button', { name: '复制引用' }), `${label}: copy reference should remain available`).toBeEnabled()
}

test('ProjectDetail QA and code_chunks search failures are recoverable without losing context', async ({ page }) => {
  const network = await installProjectQaRecoverableMocks(page)
  const issues = installRuntimeGuards(page)
  const assertions = new Set<string>()
  const sourceLocationReadabilityProofs: SourceLocationReadabilityProof[] = []

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/projects/${projectId}?tab=qa&scanTaskId=${scanTaskId}`)
    await expect(page.getByRole('heading', { name: '代码问答与证据检索' })).toBeVisible()
    const chunkPanel = page.locator('.sl-chunk-panel')

    network.failures.codeChunkSearch = 20
    const failingSearchQuery = `RECOVERABLE_SEARCH_FAIL_${viewport.name}`
    await chunkPanel.getByPlaceholder(/搜索类名/).fill(failingSearchQuery)
    await expect(chunkPanel.getByPlaceholder(/搜索类名/)).toHaveValue(failingSearchQuery)
    await chunkPanel.getByRole('button', { name: '检索', exact: true }).click()
    await expect(page.locator('.sl-state-block-error').filter({ hasText: '证据检索失败' }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: '重新检索证据' }).last()).toBeVisible()
    assertions.add('initial-code-chunk-search-error-state')

    network.failures.codeChunkSearch = 0
    await page.getByRole('button', { name: '重新检索证据' }).last().click()
    await expect(page.getByText(targetFile).last()).toBeVisible()
    await expect(page.getByText('Score 86').last()).toBeVisible()
    await assertCodeChunkEvidenceCard(page, `${viewport.name}:search-retry`)
    await assertProjectQaChunkPreviewRedaction(page, `${viewport.name}:search-retry`)
    await assertEvidenceCombinationSummary(page, `${viewport.name}:search-retry`)
    assertions.add('code-chunk-search-retry-recovers-results')
    assertions.add('code-chunk-evidence-card-readable')
    assertions.add('code-chunk-evidence-card-localized-labels')
    assertions.add('code-chunk-evidence-card-text-not-clipped')
    assertions.add('code-chunk-preview-redaction-visible')
    assertions.add('code-chunk-preview-raw-secrets-hidden')
    assertions.add('code-chunk-preview-copy-redacted')
    assertions.add('evidence-combination-summary-readable')

    const methodAnchorQuery = 'OrderService#createOrder'
    await chunkPanel.getByPlaceholder(/搜索类名/).fill(methodAnchorQuery)
    await chunkPanel.getByRole('button', { name: '检索', exact: true }).click()
    await assertCodeUnderstandingLens(page, `${viewport.name}:method-anchor`)
    assertions.add('code-understanding-lens-method-anchor-visible')
    assertions.add('code-understanding-lens-current-scan-bound')
    assertions.add('code-understanding-lens-actions-visible')
    assertions.add('code-understanding-lens-text-not-clipped')
    assertions.add('code-understanding-lens-agent-handoff-contract-visible')
    assertions.add('code-understanding-lens-agent-handoff-manual-send-visible')
    assertions.add('code-understanding-lens-agent-handoff-enabled-when-ready')
    assertions.add('code-understanding-lens-agent-handoff-gate-reason-visible')
    assertions.add('code-understanding-lens-agent-handoff-gate-ready-visible')
    assertions.add('code-understanding-lens-agent-handoff-gate-ready-style-safe')

    await chunkPanel.getByPlaceholder(/搜索类名/).fill('STALE_SCAN_ACTION_GATE OrderService#createOrder')
    await chunkPanel.getByRole('button', { name: '检索', exact: true }).click()
    await assertCodeUnderstandingActionGate(page, '请先重新定位当前扫描证据', `${viewport.name}:stale-scan-action-gate`)
    assertions.add('code-understanding-lens-stale-scan-explain-blocked')
    assertions.add('code-understanding-lens-agent-handoff-gate-blocked-visible')
    assertions.add('code-understanding-lens-agent-handoff-gate-reason-style-safe')

    await chunkPanel.getByPlaceholder(/搜索类名/).fill('CONTEXT_ONLY_ACTION_GATE OrderRepository#save')
    await chunkPanel.getByRole('button', { name: '检索', exact: true }).click()
    await assertCodeUnderstandingActionGate(page, '上下文线索不能直接交接', `${viewport.name}:context-only-action-gate`)
    assertions.add('code-understanding-lens-context-only-agent-handoff-blocked')
    assertions.add('code-understanding-lens-agent-handoff-gate-context-only-visible')

    await chunkPanel.getByPlaceholder(/搜索类名/).fill(methodAnchorQuery)
    await chunkPanel.getByRole('button', { name: '检索', exact: true }).click()
    await assertCodeUnderstandingLens(page, `${viewport.name}:method-anchor-restored`)

    network.failures.codeChunkSearch = 20
    const failingRefreshQuery = `RECOVERABLE_SEARCH_REFRESH_${viewport.name}`
    await chunkPanel.getByPlaceholder(/搜索类名/).fill(failingRefreshQuery)
    await expect(chunkPanel.getByPlaceholder(/搜索类名/)).toHaveValue(failingRefreshQuery)
    await chunkPanel.getByRole('button', { name: '检索', exact: true }).click()
    await expect(page.locator('.sl-state-block-error').filter({ hasText: '证据检索刷新失败，已保留上次成功结果' }).last()).toBeVisible()
    await expect(page.getByText(targetFile).last()).toBeVisible()
    await assertCodeChunkEvidenceCard(page, `${viewport.name}:cached-refresh-failure`)
    await assertEvidenceCombinationSummary(page, `${viewport.name}:cached-refresh-failure`)
    assertions.add('cached-code-chunk-refresh-error-preserves-results')
    assertions.add('code-chunk-evidence-card-preserved-after-refresh-failure')
    assertions.add('evidence-combination-summary-preserved-after-refresh-failure')
    network.failures.codeChunkSearch = 0

    network.failures.qa = 1
    await page.getByPlaceholder(/输入问题/).fill(`RECOVERABLE_QA_FAIL_${viewport.name} 请解释订单创建链路`)
    await page.getByRole('button', { name: '发送' }).click()
    await expect(page.locator('.sl-state-block-error').filter({ hasText: '代码问答请求失败' }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: '重试此问题' }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: '恢复到输入框' }).last()).toBeVisible()
    assertions.add('qa-request-error-state')

    await page.getByRole('button', { name: '重试此问题' }).last().click()
    await expect(page.getByLabel('回答引用证据').last()).toContainText(targetFile)
    await expect(page.getByText('引用已验证').last()).toBeVisible()
    await expect(page.getByText(`原因码 ${verifiedCitationEnforcementReason}`).last()).toBeVisible()
    await assertAnswerFirstAndEvidenceDeduped(page, `${viewport.name}:qa-retry`)
    assertions.add('qa-retry-recovers-answer-citation')
    assertions.add('qa-citation-enforcement-reason-direct-verified')
    assertions.add('qa-answer-content-before-evidence-details')
    assertions.add('qa-duplicate-retrieved-chunk-deduped')

    const lineAnchorQuestion = `SOURCE_LOCATION_LINE_ANCHOR_${viewport.name} 请解释 ${targetFile}:51 的订单创建职责`
    await page.goto(projectQaEvidenceUrl(lineAnchorQuestion, '51'))
    await expect(page.getByRole('heading', { name: '代码问答与证据检索' })).toBeVisible()
    await expect(page.getByLabel('报告证据上下文').first()).toBeVisible()
    const lineAnchorQa = await submitEvidenceBoundQa(page, `${viewport.name}:source-location-line-anchor`)
    expect(lineAnchorQa.responseBody.data?.sourceEvidenceMatched, `${viewport.name}: line anchor response must mark source evidence matched`).toBe(true)
    expect(lineAnchorQa.responseBody.data?.sourceEvidenceMatchType, `${viewport.name}: line anchor response must be REPORT_LINE_ANCHOR`).toBe('REPORT_LINE_ANCHOR')
    sourceLocationReadabilityProofs.push(await assertSourceLocationConfidenceReady(page, `${viewport.name}:source-location-line-anchor`))
    assertions.add('source-location-confidence-ready-visible')
    assertions.add('source-location-line-anchor-request-bound')
    assertions.add('source-location-line-anchor-response-bound')
    assertions.add('source-location-line-anchor-repair-action-visible')

    const fileAnchorQuestion = `SOURCE_LOCATION_FILE_ANCHOR_DRIFT_${viewport.name} 请复核 ${targetFile}:999999999 的订单创建职责`
    await page.goto(projectQaEvidenceUrl(fileAnchorQuestion, '999999999'))
    await expect(page.getByRole('heading', { name: '代码问答与证据检索' })).toBeVisible()
    await expect(page.getByLabel('报告证据上下文').first()).toBeVisible()
    const fileAnchorQa = await submitEvidenceBoundQa(page, `${viewport.name}:source-location-file-anchor-drift`)
    expect(fileAnchorQa.responseBody.data?.sourceEvidenceMatched, `${viewport.name}: file anchor response must mark source evidence matched at file scope`).toBe(true)
    expect(fileAnchorQa.responseBody.data?.sourceEvidenceMatchType, `${viewport.name}: file anchor response must be REPORT_FILE_ANCHOR`).toBe('REPORT_FILE_ANCHOR')
    sourceLocationReadabilityProofs.push(await assertSourceLocationConfidenceFileAnchorReview(page, `${viewport.name}:source-location-file-anchor-drift`))
    assertions.add('source-location-confidence-review-visible')
    assertions.add('source-location-file-anchor-request-bound')
    assertions.add('source-location-file-anchor-response-bound')
    assertions.add('source-location-file-anchor-repair-action-hidden')

    await expectNoHorizontalOverflow(page, `project-qa-recoverable:${viewport.name}`)
    if (viewport.width === 390) {
      assertions.add('project-qa-recoverable-mobile-390-covered')
    }
    if (viewport.width === 320) {
      assertions.add('project-qa-recoverable-narrow-320-covered')
    }
    assertions.add('code-chunk-evidence-card-no-horizontal-overflow')
    assertions.add('evidence-combination-summary-no-horizontal-overflow')
    assertions.add('code-understanding-lens-no-horizontal-overflow')
  }

  expect(network.qaRequests.length, 'QA smoke should submit one failed/retry pair and two source-location confidence questions per viewport.').toBe(viewportMatrix.length * 4)
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in Project QA recoverable smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  expect(sourceLocationReadabilityProofs, 'Source-location readability should cover ready and review states in every viewport.').toHaveLength(viewportMatrix.length * 2)
  const citationEnforcementReasons = Array.from(new Set(
    network.qaResponses
      .map(response => response?.citationEnforcementReason)
      .filter((reason): reason is string => typeof reason === 'string' && reason.length > 0),
  )).sort()
  expect(citationEnforcementReasons, 'Project QA recoverable marker must prove successful citation enforcement reason codes.').toContain(verifiedCitationEnforcementReason)

  const readySourceLocationReadabilityProofs = sourceLocationReadabilityProofs.filter(proof => proof.mode === 'ready')
  const reviewSourceLocationReadabilityProofs = sourceLocationReadabilityProofs.filter(proof => proof.mode === 'review')
  const sourceLocationReadability = {
    status: 'OK',
    proofCount: sourceLocationReadabilityProofs.length,
    mobile390Covered: sourceLocationReadabilityProofs.some(proof => proof.viewportName === 'mobile'),
    narrow320Covered: sourceLocationReadabilityProofs.some(proof => proof.viewportName === 'narrow'),
    sourceReceipt: {
      readyContained: readySourceLocationReadabilityProofs.every(proof => proof.sourceReceipt.contained),
      reviewContained: reviewSourceLocationReadabilityProofs.every(proof => proof.sourceReceipt.contained),
      referenceWraps: sourceLocationReadabilityProofs.every(proof => proof.sourceReceipt.referenceWraps),
      titleNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceReceipt.titleNotClipped),
      tagsNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceReceipt.tagsNotClipped),
    },
    sourceLocationConfidence: {
      readyContained: readySourceLocationReadabilityProofs.every(proof => proof.sourceLocationConfidence.contained),
      reviewContained: reviewSourceLocationReadabilityProofs.every(proof => proof.sourceLocationConfidence.contained),
      metricsNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceLocationConfidence.metricsNotClipped),
      checksWrap: sourceLocationReadabilityProofs.every(proof => proof.sourceLocationConfidence.checksWrap),
    },
    sourceFileMatchRelease: {
      readyContained: readySourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchRelease.contained),
      reviewContained: reviewSourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchRelease.contained),
      targetReferenceNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchRelease.targetReferenceNotClipped),
      citedReferenceNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchRelease.citedReferenceNotClipped),
      checksNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchRelease.checksNotClipped),
      noRepairOnReview: reviewSourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchRelease.noRepairOnReview),
    },
    noHorizontalOverflow: sourceLocationReadabilityProofs.every(proof => proof.noHorizontalOverflow),
    providerQualityClaim: false,
    llmFactClaim: false,
  }

  const markerPayload = {
    projectId,
    repositoryId,
    scanTaskId,
    qaRequestCount: network.qaRequests.length,
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    assertions: Array.from(assertions).sort(),
    counters: network.counters,
    candidateEvidenceFile: targetFile,
    codeChunkEvidenceCard: {
      visible: assertions.has('code-chunk-evidence-card-readable'),
      preservedAfterRefreshFailure: assertions.has('code-chunk-evidence-card-preserved-after-refresh-failure'),
      readableFields: codeChunkEvidenceReadableFields,
      localizedLabels: assertions.has('code-chunk-evidence-card-localized-labels'),
      textNotClipped: assertions.has('code-chunk-evidence-card-text-not-clipped'),
      mobile390Covered: assertions.has('project-qa-recoverable-mobile-390-covered'),
      primary: {
        filePath: targetFile,
        lineRange: '51-89',
        contextRole: '主证据',
        evidenceType: 'Service',
        score: 86,
        embeddingState: '已向量化',
        matchedTerms: ['OrderService', 'createOrder'],
        contentPreviewVisible: true,
      },
      redaction: {
        scope: 'PROJECT_QA_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY',
        surface: 'PROJECT_QA_CODE_CHUNKS_SEARCH',
        fixtureHasRawSecretSentinel: candidateChunk.contentPreview.includes(projectQaChunkRawSecretSentinel)
          && adjacentContextChunk.contentPreview.includes(projectQaChunkRawSecretSentinel),
        fixtureHasBearerSecret: candidateChunk.contentPreview.includes(`Bearer ${projectQaChunkRawSecretSentinel}`),
        fixtureHasApiKeySecret: candidateChunk.contentPreview.includes(projectQaChunkRawSkSecret),
        fixtureHasJwtSecret: candidateChunk.contentPreview.includes(projectQaChunkRawJwtSecret),
        rawSecretsHidden: assertions.has('code-chunk-preview-raw-secrets-hidden'),
        bodyRawSecretsHidden: assertions.has('code-chunk-preview-raw-secrets-hidden'),
        redactionVisible: assertions.has('code-chunk-preview-redaction-visible'),
        sanitizedPreviewVisible: assertions.has('code-chunk-evidence-card-readable'),
        copiedCitationRedacted: assertions.has('code-chunk-preview-copy-redacted'),
        markerContainsRawSecret: false,
      },
      noHorizontalOverflow: assertions.has('code-chunk-evidence-card-no-horizontal-overflow'),
    },
    answerReadability: {
      answerContentBeforeEvidenceDetails: assertions.has('qa-answer-content-before-evidence-details'),
      duplicateRetrievedChunkDeduped: assertions.has('qa-duplicate-retrieved-chunk-deduped'),
      citationEnforcementReasons,
      directVerifiedReasonVisible: assertions.has('qa-citation-enforcement-reason-direct-verified'),
    },
    sourceLocationConfidence: {
      status: 'OK',
      surface: 'PROJECT_QA_SOURCE_LOCATION_CONFIDENCE',
      scanTaskId,
      requestCount: network.qaRequests.filter(request => request?.evidenceRef?.filePath === targetFile).length,
      requestFilePathBound: network.qaRequests
        .filter(request => request?.question?.includes('SOURCE_LOCATION_'))
        .every(request => request?.evidenceRef?.filePath === targetFile),
      requestLineNumberBound: network.qaRequests
        .filter(request => request?.question?.includes('SOURCE_LOCATION_'))
        .every(request => String(request?.evidenceRef?.lineNumber || '').length > 0),
      lineAnchor: {
        sourceEvidenceMatched: true,
        sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
        sourceLocationConfidenceReadyVisible: assertions.has('source-location-confidence-ready-visible'),
        repairCandidateActionVisible: assertions.has('source-location-line-anchor-repair-action-visible'),
      },
      fileAnchorDrift: {
        sourceEvidenceMatched: true,
        sourceEvidenceMatchType: 'REPORT_FILE_ANCHOR',
        sourceLocationConfidenceReviewVisible: assertions.has('source-location-confidence-review-visible'),
        repairCandidateActionHidden: assertions.has('source-location-file-anchor-repair-action-hidden'),
      },
      readability: sourceLocationReadability,
      providerQualityClaim: false,
      llmFactClaim: false,
      noHorizontalOverflow: sourceLocationReadability.noHorizontalOverflow,
    },
    evidenceCombinationSummary: {
      visible: assertions.has('evidence-combination-summary-readable'),
      preservedAfterRefreshFailure: assertions.has('evidence-combination-summary-preserved-after-refresh-failure'),
      readableFields: evidenceCombinationReadableFields,
      primarySourceLabel: 'C1',
      adjacentContextCount: 1,
      uniqueFileCount: 2,
      embeddedEvidenceCount: 2,
      nextQuestionCount: 3,
      noHorizontalOverflow: assertions.has('evidence-combination-summary-no-horizontal-overflow'),
    },
    codeUnderstandingLens: {
      visible: assertions.has('code-understanding-lens-method-anchor-visible'),
      inputKind: 'METHOD_ANCHOR',
      currentScanBound: assertions.has('code-understanding-lens-current-scan-bound'),
      sourceLabel: 'C1',
      primaryReference: `${targetFile}:51-89`,
      retrievalMode: 'HYBRID',
      readiness: 'READY',
      actionsVisible: assertions.has('code-understanding-lens-actions-visible'),
      textNotClipped: assertions.has('code-understanding-lens-text-not-clipped'),
      noHorizontalOverflow: assertions.has('code-understanding-lens-no-horizontal-overflow'),
      agentHandoffContract: {
        visible: assertions.has('code-understanding-lens-agent-handoff-contract-visible'),
        structuredFieldsOnly: true,
        fields: ['scanTaskId', 'filePath', 'lineRef', 'contextRole'],
        rawSourceBodyStored: false,
        rawStackStored: false,
        rawPromptStored: false,
        autoSent: false,
        manualSendRequired: assertions.has('code-understanding-lens-agent-handoff-manual-send-visible'),
      },
      actionGate: {
        currentScanPrimaryRequired: true,
        agentHandoffEnabledWhenReady: assertions.has('code-understanding-lens-agent-handoff-enabled-when-ready'),
        explicitGateReasonVisible: assertions.has('code-understanding-lens-agent-handoff-gate-reason-visible'),
        readyGateReasonVisible: assertions.has('code-understanding-lens-agent-handoff-gate-ready-visible'),
        readyGateReasonStyleSafe: assertions.has('code-understanding-lens-agent-handoff-gate-ready-style-safe'),
        blockedGateReasonVisible: assertions.has('code-understanding-lens-agent-handoff-gate-blocked-visible'),
        contextOnlyGateReasonVisible: assertions.has('code-understanding-lens-agent-handoff-gate-context-only-visible'),
        gateReasonStyleSafe: assertions.has('code-understanding-lens-agent-handoff-gate-reason-style-safe'),
        staleScanExplainBlocked: assertions.has('code-understanding-lens-stale-scan-explain-blocked'),
        contextOnlyAgentHandoffBlocked: assertions.has('code-understanding-lens-context-only-agent-handoff-blocked'),
      },
      handoffUrlSafety: {
        sourceSanitizedBeforeNavigation: true,
        rawPromptInUrl: false,
        rawStackInUrl: false,
        rawCodeInUrl: false,
      },
      rawStackStored: false,
      rawPromptStored: false,
      providerQualityClaim: false,
      llmFactClaim: false,
    },
    spec: 'project-qa-recoverable-smoke.spec.ts',
  }
  const fixtureText = JSON.stringify({
    candidateChunk,
    adjacentContextChunk,
  })
  const markerText = JSON.stringify(markerPayload)
  for (const secret of forbiddenProjectQaChunkSecrets) {
    expect(fixtureText, `Fixture sanity check must include raw Project QA chunk secret: ${secret}`).toContain(secret)
    expect(markerText, `Project QA marker must not contain raw Project QA chunk secret: ${secret}`).not.toContain(secret)
  }
  console.log('PROJECT_QA_RECOVERABLE_SMOKE_OK', markerText)
})
