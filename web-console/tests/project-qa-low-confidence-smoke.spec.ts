import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

const projectId = 1
const repositoryId = 11
const scanTaskId = 501
const targetFile = 'src/main/java/demo/PaymentService.java'
const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile390', width: 390, height: 844 },
  { name: 'narrow320', width: 320, height: 740 },
]

type RuntimeIssue = {
  type: string
  message: string
}

const project = {
  id: projectId,
  name: 'Project QA Low Confidence Smoke',
  description: 'Mocked project for QA evidence downgrade visibility',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 76,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const repository = {
  id: repositoryId,
  projectId,
  provider: 'GITHUB',
  owner: 'demo',
  name: 'project-qa-low-confidence',
  url: 'https://github.com/demo/project-qa-low-confidence.git',
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
  commitSha: 'abcdef1234567890',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:02:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:30Z',
}

const executionTask = {
  id: 701,
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
  id: 301,
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
  id: 302,
  artifactType: 'ARCHITECTURE_REPORT',
  checksumSha256: 'report-checksum',
}

const overviewData = {
  languages: [{ name: 'Java', file_count: 32, line_count: 4200 }],
  framework: { name: 'Spring Boot', version: '3.3' },
  totalFiles: 32,
  totalDirs: 9,
  totalLines: 4200,
  controllers: 3,
  services: 8,
  repositories: 2,
  entities: 4,
}

const candidateChunks = [
  {
    id: 9001,
    scanTaskId,
    filePath: targetFile,
    startLine: 44,
    endLine: 70,
    content: 'class PaymentService { PaymentResult charge(PaymentRequest request) { return gateway.charge(request); } }',
    contentPreview: 'class PaymentService {\n  PaymentResult charge(PaymentRequest request) {\n    return gateway.charge(request);\n  }\n}',
    hasEmbedding: true,
    matchedTerms: ['PaymentService', 'charge', 'gateway'],
    relevanceScore: 42,
    evidenceType: 'SERVICE',
    evidenceReason: '候选证据只命中了相邻服务逻辑，缺少完整调用链。',
    contextRole: 'PRIMARY',
    contextDistance: 0,
    sourceLabel: 'C1',
    citationId: 'chunk-9001',
  },
  {
    id: 9002,
    scanTaskId,
    filePath: 'src/main/java/demo/PaymentController.java',
    startLine: 18,
    endLine: 32,
    content: 'class PaymentController { ResponseEntity<?> charge(Request request) { return paymentService.charge(request); } }',
    contentPreview: 'class PaymentController {\n  ResponseEntity<?> charge(Request request) {\n    return paymentService.charge(request);\n  }\n}',
    hasEmbedding: false,
    matchedTerms: ['PaymentController', 'charge'],
    relevanceScore: 36,
    evidenceType: 'CONTROLLER',
    evidenceReason: '上下文候选证据，分数不足，需要人工确认。',
    contextRole: 'ADJACENT_CONTEXT',
    contextDistance: 1,
    sourceLabel: 'C2',
    citationId: 'chunk-9002',
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

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.text().includes('findDOMNode is deprecated')) return
    if (message.text().includes('findDOMNode') && message.text().includes('deprecated in StrictMode')) return
    issues.push({ type: 'console.error', message: message.text() })
  })
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', message: error.message })
  })
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.pathname.startsWith('/api/') && response.status() >= 500) {
      issues.push({ type: 'api.5xx', message: `${response.request().method()} ${url.pathname}${url.search}: ${response.status()}` })
    }
  })

  return issues
}

function qaFixtureFor(question: string, attempt = 1) {
  if (question.includes('RETRY_VERIFIED') && attempt > 1) {
    return {
      answer: '重试后已绑定 PaymentService 直接证据。[C1]',
      scanTaskId,
      question,
      matchedChunks: candidateChunks.length,
      resultCount: candidateChunks.length,
      retrievalMode: 'STABLE_FALLBACK',
      totalChunks: 128,
      embeddedChunks: 24,
      truncated: false,
      evidenceProfile: {
        readiness: 'READY',
        confidence: 88,
        summary: 'Retry recovered verified answer citation.',
        nextAction: '可以基于已验证引用继续追问。',
        details: ['retry recovered', 'verified citation'],
        uniqueFiles: 2,
        embeddedEvidenceCount: 1,
        lowConfidenceCount: 0,
        topScore: 88,
        averageScore: 72,
        lineSpan: 42,
        dominantEvidenceType: 'SERVICE',
        evidenceTypeStats: [{ type: 'SERVICE', count: 1 }, { type: 'CONTROLLER', count: 1 }],
        fileStats: [{ filePath: targetFile, count: 1, bestScore: 88 }],
      },
      groundingStatus: 'VERIFIED',
      citationEnforcementStatus: 'DIRECT_VERIFIED',
      citationEnforcementReason: 'DIRECT_VERIFIED',
      citationEnforcementNote: 'Answer contains a direct verified citation after retry.',
      answerCitations: candidateChunks.map((chunk, index) => ({
        citationId: chunk.citationId,
        sourceLabel: `C${index + 1}`,
        chunkId: chunk.id,
        scanTaskId,
        filePath: chunk.filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        evidenceType: chunk.evidenceType,
        evidenceReason: chunk.evidenceReason,
        relevanceScore: index === 0 ? 88 : chunk.relevanceScore,
        contextRole: chunk.contextRole,
        contextDistance: chunk.contextDistance,
        citedByAnswer: index === 0,
      })),
      retrievedChunks: candidateChunks,
    }
  }

  if (question.includes('NO_EVIDENCE')) {
    return {
      answer: '没有找到可以支撑该结论的代码证据。请更换问题关键词，或重新扫描后再复核。',
      scanTaskId,
      question,
      matchedChunks: 0,
      resultCount: 0,
      retrievalMode: 'STABLE_FALLBACK',
      totalChunks: 128,
      embeddedChunks: 24,
      truncated: false,
      evidenceProfile: {
        readiness: 'GAP',
        confidence: 0,
        summary: 'No evidence matched the question.',
        nextAction: '重新扫描或换问题。',
        details: ['NO_EVIDENCE'],
        uniqueFiles: 0,
        embeddedEvidenceCount: 0,
        lowConfidenceCount: 0,
        topScore: 0,
        averageScore: 0,
        lineSpan: 0,
        dominantEvidenceType: 'OTHER',
        evidenceTypeStats: [],
        fileStats: [],
      },
      groundingStatus: 'NO_EVIDENCE',
      citationEnforcementStatus: 'NO_EVIDENCE',
      citationEnforcementReason: 'NO_EVIDENCE',
      citationEnforcementNote: 'No retrieved chunk was available for citation.',
      answerCitations: [],
      retrievedChunks: [],
    }
  }

  const status = question.includes('UNVERIFIED') ? 'UNVERIFIED' : 'PARTIAL'
  return {
    answer: status === 'UNVERIFIED'
      ? '回答没有可靠引用标记，仅能作为待复核线索。'
      : '当前结论只能部分对应候选证据，仍需要人工复核。',
    scanTaskId,
    question,
    matchedChunks: candidateChunks.length,
    resultCount: candidateChunks.length,
    retrievalMode: 'STABLE_FALLBACK',
    totalChunks: 128,
    embeddedChunks: 24,
    truncated: false,
    evidenceProfile: {
      readiness: 'REVIEW',
      confidence: status === 'UNVERIFIED' ? 18 : 35,
      summary: 'Candidate evidence is weak and needs review.',
      nextAction: '换一个更具体的问题，或重新扫描后复核。',
      details: ['low confidence', status],
      uniqueFiles: 2,
      embeddedEvidenceCount: 1,
      lowConfidenceCount: 2,
      topScore: 42,
      averageScore: 39,
      lineSpan: 42,
      dominantEvidenceType: 'SERVICE',
      evidenceTypeStats: [{ type: 'SERVICE', count: 1 }, { type: 'CONTROLLER', count: 1 }],
      fileStats: [{ filePath: targetFile, count: 1, bestScore: 42 }],
    },
    groundingStatus: status,
    citationEnforcementStatus: status === 'UNVERIFIED' ? 'UNVERIFIED' : 'RETRY_FAILED',
    citationEnforcementReason: status === 'UNVERIFIED' ? 'NO_VALID_CITATION_LABEL' : 'UNCITED_REQUIRED_CLAIM',
    citationEnforcementNote: status === 'UNVERIFIED'
      ? 'Answer did not produce a trustworthy citation marker.'
      : 'Only part of the answer could be matched to candidate evidence.',
    answerCitations: candidateChunks.map((chunk, index) => ({
      citationId: chunk.citationId,
      sourceLabel: `C${index + 1}`,
      chunkId: chunk.id,
      scanTaskId,
      filePath: chunk.filePath,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      evidenceType: chunk.evidenceType,
      evidenceReason: chunk.evidenceReason,
      relevanceScore: chunk.relevanceScore,
      contextRole: chunk.contextRole,
      contextDistance: chunk.contextDistance,
      citedByAnswer: false,
    })),
    retrievedChunks: candidateChunks,
  }
}

async function installProjectQaMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const qaRequests: any[] = []
  const qaAttemptsByQuestion = new Map<string, number>()

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'project-qa-low-confidence-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'project_qa_smoke', email: 'smoke@local.test', status: 'ACTIVE' }))
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
      await fulfillJson(route, result({ record: overviewArtifact, text: JSON.stringify(overviewData), truncated: false, previewBytes: 512 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${reportArtifact.id}/preview`) {
      await fulfillJson(route, result({
        record: reportArtifact,
        text: JSON.stringify({
          reportQuality: {
            readiness: 'GAP',
            confidence: 58,
            summary: '报告证据存在缺口，需要 QA 复核。',
            gaps: ['部分服务链路缺少直接证据'],
            nextActions: ['进入代码问答复核低置信度结论'],
            evidenceChecks: [],
          },
        }),
        truncated: false,
        previewBytes: 512,
      }))
      return
    }

    if (method === 'GET' && (path === `/api/projects/${projectId}/code-chunks/search` || path === `/api/projects/${projectId}/code-chunks/status`)) {
      const query = url.searchParams.get('query') || ''
      await fulfillJson(route, result({
        scanTaskId,
        query,
        limit: Number(url.searchParams.get('limit') || 8),
        total: query.includes('NO_EVIDENCE') ? 0 : candidateChunks.length,
        resultCount: query.includes('NO_EVIDENCE') ? 0 : candidateChunks.length,
        totalChunks: 128,
        embeddedChunks: 24,
        truncated: false,
        retrievalMode: 'STABLE_FALLBACK',
        evidenceProfile: {
          readiness: 'REVIEW',
          confidence: 35,
          summary: 'Search returned weak candidate evidence.',
          nextAction: '换问题或重新扫描。',
          details: ['low confidence'],
          uniqueFiles: 2,
          embeddedEvidenceCount: 1,
          lowConfidenceCount: 2,
          topScore: 42,
          averageScore: 39,
          lineSpan: 42,
          dominantEvidenceType: 'SERVICE',
          evidenceTypeStats: [{ type: 'SERVICE', count: 1 }, { type: 'CONTROLLER', count: 1 }],
          fileStats: [{ filePath: targetFile, count: 1, bestScore: 42 }],
        },
        items: query.includes('NO_EVIDENCE') ? [] : candidateChunks,
      }))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/qa`) {
      const payload = JSON.parse(request.postData() || '{}')
      const question = String(payload.question || '')
      const attempt = (qaAttemptsByQuestion.get(question) || 0) + 1
      qaAttemptsByQuestion.set(question, attempt)
      qaRequests.push(payload)
      await fulfillJson(route, result(qaFixtureFor(question, attempt)))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(result(null)),
    })
  })

  return { qaRequests, unhandledApiRequests }
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
  await expect(locator, `${label}:visible`).toBeVisible()
  await locator.scrollIntoViewIfNeeded()
  await expect.poll(async () => {
    const viewportWidth = await locator.page().evaluate(() => window.innerWidth)
    return locator.evaluate((element, width) => {
      const box = element.getBoundingClientRect()
      return Math.max(-box.x, box.x + box.width - width)
    }, viewportWidth)
  }, { message: `${label} must stay inside the visual viewport horizontally` }).toBeLessThanOrEqual(1)
}

async function expectLocatorTextNotClipped(locator: Locator, label: string, options: { mustWrap?: boolean, allowEllipsisStyle?: boolean } = {}) {
  await expect(locator, `${label}:text`).toBeVisible()
  const metrics = await locator.evaluate(element => {
    const style = window.getComputedStyle(element)
    return {
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      whiteSpace: style.whiteSpace,
      overflowWrap: style.overflowWrap,
      wordBreak: style.wordBreak,
      textOverflow: style.textOverflow,
    }
  })
  if (options.mustWrap) {
    expect(metrics.whiteSpace, `${label} must not force single-line evidence text: ${JSON.stringify(metrics)}`).not.toBe('nowrap')
    expect(
      metrics.overflowWrap === 'anywhere' || metrics.wordBreak === 'break-word' || metrics.wordBreak === 'break-all',
      `${label} must allow long evidence text to wrap: ${JSON.stringify(metrics)}`,
    ).toBe(true)
  }
  if (!options.allowEllipsisStyle) {
    expect(metrics.textOverflow, `${label} must not hide critical text with ellipsis: ${JSON.stringify(metrics)}`).not.toBe('ellipsis')
  }
  expect(metrics.scrollWidth - metrics.clientWidth, `${label} is horizontally clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(2)
  expect(metrics.scrollHeight - metrics.clientHeight, `${label} is vertically clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(2)
}

async function assertActionButtonsReadability(scope: Locator, viewportName: string, label: string, buttonNames: Array<string | RegExp>) {
  await expectContainedInViewport(scope, `${viewportName}:${label}:actions-scope-contained`)
  for (const buttonName of buttonNames) {
    const button = scope.getByRole('button', { name: buttonName }).first()
    await expectContainedInViewport(button, `${viewportName}:${label}:button-contained:${String(buttonName)}`)
    await expectLocatorTextNotClipped(button, `${viewportName}:${label}:button-text:${String(buttonName)}`, { allowEllipsisStyle: true })
  }
}

async function assertLowConfidencePanelReadability(page: Page, panel: Locator, viewportName: string, status: 'PARTIAL' | 'UNVERIFIED' | 'NO_EVIDENCE') {
  await expectContainedInViewport(panel, `${viewportName}:${status}:low-confidence-panel`)
  await expectLocatorTextNotClipped(panel.getByText('低置信度'), `${viewportName}:${status}:low-confidence-tag`)
  await expectLocatorTextNotClipped(panel.getByText('下一步：重试此问题'), `${viewportName}:${status}:low-confidence-next-step`)
  await assertActionButtonsReadability(panel, viewportName, `${status}:low-confidence-panel`, ['重试此问题', '换问题', '重新检索证据'])
  await expectNoHorizontalOverflow(page, `${viewportName}:${status}:low-confidence-panel-readable`)
}

async function assertCandidateEvidenceReadability(page: Page, viewportName: string) {
  const citationRegion = page.getByLabel('回答引用证据').last()
  await expectContainedInViewport(citationRegion, `${viewportName}:candidate-answer-citations`)
  await expectLocatorTextNotClipped(citationRegion.getByText('候选证据 / 引用复核'), `${viewportName}:candidate-citation-title`)
  await expectLocatorTextNotClipped(citationRegion.getByText(targetFile).first(), `${viewportName}:candidate-citation-file`, { mustWrap: true })
  await expectLocatorTextNotClipped(citationRegion.getByText('候选证据').first(), `${viewportName}:candidate-citation-status`)
  const candidateCard = citationRegion.getByLabel('引用证据卡片 C1').first()
  await expectContainedInViewport(candidateCard, `${viewportName}:candidate-citation-card`)
  await expectLocatorTextNotClipped(candidateCard.locator('.sl-answer-citation-line'), `${viewportName}:candidate-citation-line`, { mustWrap: true })
  await expectLocatorTextNotClipped(candidateCard.locator('.sl-answer-citation-reason p'), `${viewportName}:candidate-citation-reason`, { mustWrap: true })
  await assertActionButtonsReadability(candidateCard, viewportName, 'candidate-citation-card', ['复制引用'])

  const chunkTitle = page.getByText('候选代码切片').last()
  await expectLocatorTextNotClipped(chunkTitle, `${viewportName}:candidate-code-chunk-title`)
  const chunkCards = page.getByLabel(/代码切片证据 C\d/)
  if (await chunkCards.count()) {
    const chunkCard = chunkCards.first()
    await expectContainedInViewport(chunkCard, `${viewportName}:candidate-code-chunk-card`)
    await expectLocatorTextNotClipped(chunkCard.locator('.sl-evidence-chip-ref'), `${viewportName}:candidate-code-chunk-ref`, { mustWrap: true })
    await expectLocatorTextNotClipped(chunkCard.locator('.sl-evidence-chip-reason'), `${viewportName}:candidate-code-chunk-reason`, { mustWrap: true })
    await assertActionButtonsReadability(chunkCard, viewportName, 'candidate-code-chunk-card', ['定位', '追问', '复制引用', '链接'])
  }
  await expectNoHorizontalOverflow(page, `${viewportName}:candidate-evidence-readable`)
}

async function assertNoEvidenceReadability(page: Page, panel: Locator, viewportName: string) {
  await expectContainedInViewport(panel, `${viewportName}:no-evidence-panel`)
  await expectLocatorTextNotClipped(panel.getByText('没有可用代码证据'), `${viewportName}:no-evidence-title`)
  await expectLocatorTextNotClipped(panel.getByText('无证据'), `${viewportName}:no-evidence-tag`)
  await assertActionButtonsReadability(panel, viewportName, 'no-evidence-panel', ['重试此问题', '换问题', '重新检索证据'])
  await expectNoHorizontalOverflow(page, `${viewportName}:no-evidence-readable`)
}

async function assertRetryRecoveryReadability(page: Page, viewportName: string) {
  const citationRegion = page.getByLabel('回答引用证据').last()
  await expectContainedInViewport(citationRegion, `${viewportName}:retry-recovery-citation-region`)
  await expectLocatorTextNotClipped(page.getByText('引用已验证').last(), `${viewportName}:retry-recovery-verified-tag`)
  await expectLocatorTextNotClipped(page.getByText('首次引用已验证').last(), `${viewportName}:retry-recovery-first-verified-tag`)
  await expectLocatorTextNotClipped(citationRegion.getByText(targetFile).first(), `${viewportName}:retry-recovery-citation-file`, { mustWrap: true })
  await expectLocatorTextNotClipped(citationRegion.getByText('回答已引用').first(), `${viewportName}:retry-recovery-cited-label`)
  await assertActionButtonsReadability(citationRegion, viewportName, 'retry-recovery-citation-region', ['复制引用'])
  await expectNoHorizontalOverflow(page, `${viewportName}:retry-recovery-readable`)
}

async function submitQaCase(page: Page, viewportName: string, status: 'PARTIAL' | 'UNVERIFIED' | 'NO_EVIDENCE') {
  const verifiedLabel = page.getByText(/引用已验证|首次引用已验证|回答已引用/)
  const verifiedCountBefore = await verifiedLabel.count()
  await page.getByPlaceholder(/输入问题/).fill(`PROJECT_QA_${status} 请复核支付链路证据`)
  const qaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 15_000 })

  await page.getByRole('button', { name: '发送' }).click()
  const qaResponse = await qaResponsePromise
  const qaData = (await qaResponse.json())?.data || {}
  const latestPanel = page.getByLabel('QA 低置信度证据状态').last()

  expect(qaData.groundingStatus, `${viewportName}: expected QA grounding status`).toBe(status)
  await expect(latestPanel, `${viewportName}: ${status} downgrade panel must be visible`).toBeVisible()
  await expect(latestPanel.getByText('低置信度')).toBeVisible()
  await expect(latestPanel.getByText('下一步：重试此问题')).toBeVisible()
  await expect(latestPanel.getByRole('button', { name: '重试此问题' })).toBeVisible()
  await expect(latestPanel.getByRole('button', { name: '换问题' })).toBeVisible()
  await expect(latestPanel.getByRole('button', { name: '重新检索证据' })).toBeVisible()
  await assertLowConfidencePanelReadability(page, latestPanel, viewportName, status)

  if (status === 'NO_EVIDENCE') {
    await expect(latestPanel.getByText('没有可用代码证据')).toBeVisible()
    await expect(latestPanel.getByText('无证据')).toBeVisible()
    await assertNoEvidenceReadability(page, latestPanel, viewportName)
  } else {
    await expect(latestPanel.getByText(status === 'PARTIAL' ? '引用需要复核' : '回答未绑定证据')).toBeVisible()
    await expect(page.getByText('候选证据 / 引用复核').last()).toBeVisible()
    await expect(page.getByText(targetFile).last()).toBeVisible()
    await expect(page.getByText('候选证据').last()).toBeVisible()
    await expect(page.getByText('候选代码切片').last()).toBeVisible()
    await assertCandidateEvidenceReadability(page, viewportName)
  }

  await expect(verifiedLabel).toHaveCount(verifiedCountBefore)
  await expectNoHorizontalOverflow(page, `${viewportName}:${status}`)

  return {
    viewportName,
    groundingStatus: String(qaData.groundingStatus || ''),
    citationEnforcementStatus: String(qaData.citationEnforcementStatus || ''),
    citationEnforcementReason: String(qaData.citationEnforcementReason || ''),
    candidateEvidenceVisible: status === 'NO_EVIDENCE' ? true : (await page.getByText(targetFile).last().isVisible()),
    noEvidenceVisible: status !== 'NO_EVIDENCE' ? true : (await latestPanel.getByText('无证据').isVisible()),
    noVerifiedMislabel: await verifiedLabel.count() === verifiedCountBefore,
    layoutDensity: {
      lowConfidencePanelContained: true,
      candidateEvidenceContained: status !== 'NO_EVIDENCE',
      noEvidenceStateContained: status === 'NO_EVIDENCE',
      actionButtonsContained: true,
      noHorizontalOverflow: true,
    },
    mobileReadability: {
      lowConfidenceTextNotClipped: true,
      candidateEvidenceTextNotClipped: status !== 'NO_EVIDENCE',
      noEvidenceTextNotClipped: status === 'NO_EVIDENCE',
      actionButtonsNotClipped: true,
    },
  }
}

async function submitRetryRecoveryCase(page: Page, viewportName: string) {
  const question = `PROJECT_QA_RETRY_VERIFIED_${viewportName} 请复核支付链路证据`
  await page.getByPlaceholder(/输入问题/).fill(question)
  const firstQaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 15_000 })

  await page.getByRole('button', { name: '发送' }).click()
  const firstQaResponse = await firstQaResponsePromise
  const firstQaData = (await firstQaResponse.json())?.data || {}
  const latestPanel = page.getByLabel('QA 低置信度证据状态').last()

  expect(firstQaData.groundingStatus, `${viewportName}: retry seed must start as PARTIAL`).toBe('PARTIAL')
  expect(firstQaData.citationEnforcementStatus, `${viewportName}: retry seed must start as RETRY_FAILED`).toBe('RETRY_FAILED')
  expect(firstQaData.citationEnforcementReason, `${viewportName}: retry seed must carry machine-readable failure reason`).toBe('UNCITED_REQUIRED_CLAIM')
  expect(firstQaData.scanTaskId, `${viewportName}: first retry seed response must stay scan-bound`).toBe(scanTaskId)
  await expect(latestPanel, `${viewportName}: retry seed downgrade panel must be visible`).toBeVisible()
  await expect(latestPanel.getByRole('button', { name: '重试此问题' })).toBeVisible()
  await expect(latestPanel.getByText('候选证据需复核')).toBeVisible()

  const retryQaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 15_000 })
  await latestPanel.getByRole('button', { name: '重试此问题' }).click()
  const retryQaResponse = await retryQaResponsePromise
  const retryQaData = (await retryQaResponse.json())?.data || {}

  expect(retryQaData.question, `${viewportName}: retry must submit the same question`).toBe(question)
  expect(retryQaData.scanTaskId, `${viewportName}: retry response must stay scan-bound`).toBe(scanTaskId)
  expect(retryQaData.groundingStatus, `${viewportName}: retry must recover to VERIFIED`).toBe('VERIFIED')
  expect(retryQaData.citationEnforcementStatus, `${viewportName}: retry must recover direct citation enforcement`).toBe('DIRECT_VERIFIED')
  expect(retryQaData.citationEnforcementReason, `${viewportName}: retry must carry machine-readable verified reason`).toBe('DIRECT_VERIFIED')
  expect(retryQaData.answerCitations?.some((citation: any) => citation.citedByAnswer === true && citation.scanTaskId === scanTaskId && citation.filePath === targetFile), `${viewportName}: retry answer must cite target evidence`).toBe(true)
  await expect(page.getByText('引用已验证').last()).toBeVisible()
  await expect(page.getByText('首次引用已验证').last()).toBeVisible()
  await expect(page.getByLabel('回答引用证据').last()).toContainText(targetFile)
  await expect(page.getByLabel('回答引用证据').last()).toContainText('回答已引用')
  await assertRetryRecoveryReadability(page, viewportName)
  await expectNoHorizontalOverflow(page, `${viewportName}:retry-recovery`)

  return {
    viewportName,
    firstGroundingStatus: String(firstQaData.groundingStatus || ''),
    firstCitationEnforcementStatus: String(firstQaData.citationEnforcementStatus || ''),
    firstCitationEnforcementReason: String(firstQaData.citationEnforcementReason || ''),
    retryGroundingStatus: String(retryQaData.groundingStatus || ''),
    retryCitationEnforcementStatus: String(retryQaData.citationEnforcementStatus || ''),
    retryCitationEnforcementReason: String(retryQaData.citationEnforcementReason || ''),
    verifiedAfterRetry: retryQaData.groundingStatus === 'VERIFIED',
    scanTaskIdBound: retryQaData.scanTaskId === scanTaskId,
    citationVisible: await page.getByLabel('回答引用证据').last().isVisible(),
    citedByAnswer: retryQaData.answerCitations?.some((citation: any) => citation.citedByAnswer === true) === true,
    layoutDensity: {
      retryRecoveryContained: true,
      actionButtonsContained: true,
      noHorizontalOverflow: true,
    },
    mobileReadability: {
      retryRecoveryTextNotClipped: true,
      actionButtonsNotClipped: true,
    },
  }
}

test('ProjectDetail QA makes low-confidence and no-evidence results explicit', async ({ page }) => {
  const network = await installProjectQaMocks(page)
  const issues = installRuntimeGuards(page)
  const proofs: Array<Awaited<ReturnType<typeof submitQaCase>>> = []
  const retryProofs: Array<Awaited<ReturnType<typeof submitRetryRecoveryCase>>> = []

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/projects/${projectId}?tab=qa&scanTaskId=${scanTaskId}`)
    await expect(page.getByRole('heading', { name: '代码问答与证据检索' })).toBeVisible()
    await expect(page.getByText('QA Playbook')).toBeVisible()

    retryProofs.push(await submitRetryRecoveryCase(page, viewport.name))
    proofs.push(await submitQaCase(page, viewport.name, 'PARTIAL'))
    proofs.push(await submitQaCase(page, viewport.name, 'UNVERIFIED'))
    proofs.push(await submitQaCase(page, viewport.name, 'NO_EVIDENCE'))
  }

  const groundingStatuses = Array.from(new Set([
    ...proofs.map(proof => proof.groundingStatus),
    ...retryProofs.flatMap(proof => [proof.firstGroundingStatus, proof.retryGroundingStatus]),
  ])).sort()
  const citationEnforcementStatuses = Array.from(new Set([
    ...proofs.map(proof => proof.citationEnforcementStatus),
    ...retryProofs.flatMap(proof => [proof.firstCitationEnforcementStatus, proof.retryCitationEnforcementStatus]),
  ])).sort()
  const citationEnforcementReasons = Array.from(new Set([
    ...proofs.map(proof => proof.citationEnforcementReason),
    ...retryProofs.flatMap(proof => [proof.firstCitationEnforcementReason, proof.retryCitationEnforcementReason]),
  ])).sort()
  const lowConfidenceVisible = proofs.filter(proof => proof.groundingStatus !== 'NO_EVIDENCE').every(proof => proof.candidateEvidenceVisible)
  const noEvidenceVisible = proofs.filter(proof => proof.groundingStatus === 'NO_EVIDENCE').every(proof => proof.noEvidenceVisible)
  const noVerifiedMislabel = proofs.every(proof => proof.noVerifiedMislabel)
  const retryRecovery = {
    retriedRequestCount: retryProofs.length,
    verifiedAfterRetry: retryProofs.every(proof => proof.verifiedAfterRetry),
    scanTaskIdBound: retryProofs.every(proof => proof.scanTaskIdBound),
    citationVisible: retryProofs.every(proof => proof.citationVisible),
    citedByAnswer: retryProofs.every(proof => proof.citedByAnswer),
  }
  const viewportNames = viewportMatrix.map(viewport => viewport.name)
  const mobileProofs = proofs.filter(proof => ['mobile390', 'narrow320'].includes(proof.viewportName || ''))
  const layoutDensity = {
    desktopCovered: viewportNames.includes('desktop'),
    mobile390Covered: viewportNames.includes('mobile390'),
    narrow320Covered: viewportNames.includes('narrow320'),
    lowConfidencePanelContained: proofs.every(proof => proof.layoutDensity.lowConfidencePanelContained),
    candidateEvidenceContained: proofs.filter(proof => proof.groundingStatus !== 'NO_EVIDENCE').every(proof => proof.layoutDensity.candidateEvidenceContained),
    noEvidenceStateContained: proofs.filter(proof => proof.groundingStatus === 'NO_EVIDENCE').every(proof => proof.layoutDensity.noEvidenceStateContained),
    retryRecoveryContained: retryProofs.every(proof => proof.layoutDensity.retryRecoveryContained),
    actionButtonsContained: proofs.every(proof => proof.layoutDensity.actionButtonsContained) && retryProofs.every(proof => proof.layoutDensity.actionButtonsContained),
    noHorizontalOverflow: proofs.every(proof => proof.layoutDensity.noHorizontalOverflow) && retryProofs.every(proof => proof.layoutDensity.noHorizontalOverflow),
  }
  const mobileReadability = {
    mobile390Covered: viewportNames.includes('mobile390') && mobileProofs.some(proof => proof.viewportName === 'mobile390'),
    narrow320Covered: viewportNames.includes('narrow320') && mobileProofs.some(proof => proof.viewportName === 'narrow320'),
    lowConfidenceTextNotClipped: mobileProofs.every(proof => proof.mobileReadability.lowConfidenceTextNotClipped),
    candidateEvidenceTextNotClipped: mobileProofs.filter(proof => proof.groundingStatus !== 'NO_EVIDENCE').every(proof => proof.mobileReadability.candidateEvidenceTextNotClipped),
    noEvidenceTextNotClipped: mobileProofs.filter(proof => proof.groundingStatus === 'NO_EVIDENCE').every(proof => proof.mobileReadability.noEvidenceTextNotClipped),
    retryRecoveryTextNotClipped: retryProofs.filter(proof => ['mobile390', 'narrow320'].includes(proof.viewportName || '')).every(proof => proof.mobileReadability.retryRecoveryTextNotClipped),
    actionButtonsNotClipped: mobileProofs.every(proof => proof.mobileReadability.actionButtonsNotClipped) && retryProofs.filter(proof => ['mobile390', 'narrow320'].includes(proof.viewportName || '')).every(proof => proof.mobileReadability.actionButtonsNotClipped),
  }
  const viewportProofs = viewportMatrix.map(viewport => {
    const viewportDowngrades = proofs.filter(proof => proof.viewportName === viewport.name)
    const viewportRetry = retryProofs.find(proof => proof.viewportName === viewport.name)
    return {
      viewportName: viewport.name,
      size: `${viewport.width}x${viewport.height}`,
      partialCovered: viewportDowngrades.some(proof => proof.groundingStatus === 'PARTIAL' && proof.citationEnforcementStatus === 'RETRY_FAILED'),
      unverifiedCovered: viewportDowngrades.some(proof => proof.groundingStatus === 'UNVERIFIED' && proof.citationEnforcementStatus === 'UNVERIFIED'),
      noEvidenceCovered: viewportDowngrades.some(proof => proof.groundingStatus === 'NO_EVIDENCE' && proof.citationEnforcementStatus === 'NO_EVIDENCE'),
      reasonCodesCovered: viewportDowngrades.some(proof => proof.citationEnforcementReason === 'UNCITED_REQUIRED_CLAIM')
        && viewportDowngrades.some(proof => proof.citationEnforcementReason === 'NO_VALID_CITATION_LABEL')
        && viewportDowngrades.some(proof => proof.citationEnforcementReason === 'NO_EVIDENCE')
        && viewportRetry?.retryCitationEnforcementReason === 'DIRECT_VERIFIED',
      retryRecovered: viewportRetry?.verifiedAfterRetry === true && viewportRetry.retryCitationEnforcementStatus === 'DIRECT_VERIFIED',
      noVerifiedMislabel: viewportDowngrades.every(proof => proof.noVerifiedMislabel),
    }
  })
  const statusProofs = {
    partial: proofs.filter(proof => proof.groundingStatus === 'PARTIAL').length,
    unverified: proofs.filter(proof => proof.groundingStatus === 'UNVERIFIED').length,
    noEvidence: proofs.filter(proof => proof.groundingStatus === 'NO_EVIDENCE').length,
    verifiedRetry: retryProofs.filter(proof => proof.retryGroundingStatus === 'VERIFIED').length,
  }

  expect(network.qaRequests.length, 'QA smoke should submit one retry recovery pair and three downgrade questions per viewport.').toBe(viewportMatrix.length * 5)
  expect(groundingStatuses).toEqual(['NO_EVIDENCE', 'PARTIAL', 'UNVERIFIED', 'VERIFIED'])
  expect(citationEnforcementStatuses).toEqual(['DIRECT_VERIFIED', 'NO_EVIDENCE', 'RETRY_FAILED', 'UNVERIFIED'])
  expect(citationEnforcementReasons).toEqual(['DIRECT_VERIFIED', 'NO_EVIDENCE', 'NO_VALID_CITATION_LABEL', 'UNCITED_REQUIRED_CLAIM'])
  expect(lowConfidenceVisible).toBe(true)
  expect(noEvidenceVisible).toBe(true)
  expect(noVerifiedMislabel).toBe(true)
  expect(retryRecovery).toEqual({
    retriedRequestCount: viewportMatrix.length,
    verifiedAfterRetry: true,
    scanTaskIdBound: true,
    citationVisible: true,
    citedByAnswer: true,
  })
  expect(layoutDensity).toEqual({
    desktopCovered: true,
    mobile390Covered: true,
    narrow320Covered: true,
    lowConfidencePanelContained: true,
    candidateEvidenceContained: true,
    noEvidenceStateContained: true,
    retryRecoveryContained: true,
    actionButtonsContained: true,
    noHorizontalOverflow: true,
  })
  expect(mobileReadability).toEqual({
    mobile390Covered: true,
    narrow320Covered: true,
    lowConfidenceTextNotClipped: true,
    candidateEvidenceTextNotClipped: true,
    noEvidenceTextNotClipped: true,
    retryRecoveryTextNotClipped: true,
    actionButtonsNotClipped: true,
  })
  expect(viewportProofs.every(proof => proof.partialCovered && proof.unverifiedCovered && proof.noEvidenceCovered && proof.reasonCodesCovered && proof.retryRecovered && proof.noVerifiedMislabel)).toBe(true)
  expect(statusProofs).toEqual({
    partial: viewportMatrix.length,
    unverified: viewportMatrix.length,
    noEvidence: viewportMatrix.length,
    verifiedRetry: viewportMatrix.length,
  })
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in Project QA low-confidence smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  console.log('PROJECT_QA_LOW_CONFIDENCE_SMOKE_OK', JSON.stringify({
    markerVersion: 2,
    projectId,
    repositoryId,
    scanTaskId,
    qaRequestCount: network.qaRequests.length,
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    groundingStatuses,
    citationEnforcementStatuses,
    citationEnforcementReasons,
    lowConfidenceVisible,
    noEvidenceVisible,
    noVerifiedMislabel,
    retryRecovery,
    layoutDensity,
    mobileReadability,
    viewportProofs,
    statusProofs,
    runtimeIssues: issues.length,
    candidateEvidenceFile: targetFile,
    spec: 'project-qa-low-confidence-smoke.spec.ts',
  }))
})
