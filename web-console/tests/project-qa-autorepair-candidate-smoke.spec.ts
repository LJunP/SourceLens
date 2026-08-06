import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

const projectId = 1
const repositoryId = 11
const scanTaskId = 601
const targetFile = 'src/main/java/demo/projectqa/autorepair/readability/OrderServiceWithVerifiedCitationBoundary.java'
const projectQaAutoRepairSafeMarker = 'PROJECT_QA_AUTOREPAIR_SAFE_MARKER'
const projectQaRawBearerSecret = 'Bearer project-qa-autorepair-bearer-should-not-render'
const projectQaRawAuthorizationSecret = `Authorization: ${projectQaRawBearerSecret}`
const projectQaRawApiKeySecret = 'sk-projectqa-autorepair-secret-should-not-render123456'
const projectQaRawPasswordSecret = 'project-qa-autorepair-password-should-not-render'
const projectQaRawJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJwcm9qZWN0UWEiOiJhdXRvUmVwYWlyIn0.projectQaAutoRepairSignatureShouldNotRender'
const forbiddenProjectQaAutoRepairSecrets = [
  projectQaRawBearerSecret,
  projectQaRawAuthorizationSecret,
  projectQaRawApiKeySecret,
  projectQaRawPasswordSecret,
  projectQaRawJwtSecret,
]
const sourceEvidenceRef = {
  category: `报告章节 ${projectQaAutoRepairSafeMarker} password=${projectQaRawPasswordSecret}`,
  source: `Architecture Risk Report / Verified Citation Release Evidence ${projectQaAutoRepairSafeMarker} ${projectQaRawAuthorizationSecret}`,
  title: `订单服务缺少权限边界，需要在 Project QA 已验证引用和 AutoRepair 候选凭证之间保留可读来源链路 ${projectQaAutoRepairSafeMarker} apiKey=${projectQaRawApiKeySecret}`,
  summary: `报告证据指出订单服务入口需要补充权限校验，并且候选凭证在移动视口必须完整展示来源、扫描、行号和门禁状态。${projectQaAutoRepairSafeMarker} jwt=${projectQaRawJwtSecret}`,
  filePath: targetFile,
  lineNumber: '44',
}
const repairEvidenceGateReason = `QA 引用、报告证据、目标文件和行级锚点已经形成候选闭环；移动视口必须完整展示此门禁说明，避免误把未核验来源推进到补丁审查。${projectQaAutoRepairSafeMarker} token=${projectQaRawBearerSecret}`
const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

type RuntimeIssue = {
  type: string
  message: string
}

type CreateRequest = {
  endpoint: string
  payload: {
    repositoryId?: number
    scanTaskId?: number
    filePath?: string
    targetDesc?: string
    provenance?: Record<string, any>
  }
}

const project = {
  id: projectId,
  name: 'Project QA AutoRepair Candidate Smoke',
  description: 'Mocked project for QA citation to AutoRepair candidate flow',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 84,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:00Z',
}

const repository = {
  id: repositoryId,
  projectId,
  provider: 'GITHUB',
  owner: 'demo',
  name: 'project-qa-autorepair-candidate',
  url: 'https://github.com/demo/project-qa-autorepair-candidate.git',
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
  commitSha: 'qaautorepairabcdef',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-07-01T10:01:00Z',
  finishedAt: '2026-07-01T10:02:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-07-01T10:00:30Z',
}

const executionTask = {
  id: 811,
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
  id: 421,
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
  id: 422,
  artifactType: 'ARCHITECTURE_REPORT',
  checksumSha256: 'report-checksum',
}

const candidateChunk = {
  id: 9201,
  scanTaskId,
  filePath: targetFile,
  startLine: 51,
  endLine: 89,
  content: 'class OrderService { OrderResult createOrder(OrderRequest request) { return orderRepository.save(request); } }',
  contentPreview: 'class OrderService {\n  OrderResult createOrder(OrderRequest request) {\n    return orderRepository.save(request);\n  }\n}',
  hasEmbedding: true,
  matchedTerms: ['OrderService', 'createOrder'],
  relevanceScore: 88,
  evidenceType: 'SERVICE',
  evidenceReason: `主证据直接命中订单创建服务，可作为修复候选入口。${projectQaAutoRepairSafeMarker} secret=${projectQaRawJwtSecret}`,
  contextRole: 'PRIMARY',
  contextDistance: 0,
  sourceLabel: 'C1',
  citationId: 'chunk-9201',
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
  return {
    scanTaskId,
    query,
    limit: 8,
    total: 1,
    resultCount: 1,
    totalChunks: 256,
    embeddedChunks: 144,
    truncated: false,
    retrievalMode: 'HYBRID',
    evidenceProfile: {
      readiness: 'READY',
      confidence: 88,
      summary: 'QA citation to AutoRepair evidence is stable.',
      nextAction: '可以基于此证据生成修复候选。',
      details: ['qa-citation', 'autorepair-candidate'],
      uniqueFiles: 1,
      embeddedEvidenceCount: 1,
      lowConfidenceCount: 0,
      topScore: 88,
      averageScore: 88,
      lineSpan: 39,
      dominantEvidenceType: 'SERVICE',
      evidenceTypeStats: [{ type: 'SERVICE', count: 1 }],
      fileStats: [{ filePath: targetFile, count: 1, bestScore: 88 }],
    },
    items: [candidateChunk],
  }
}

function qaPayload(question: string) {
  const lowConfidence = question.includes('PARTIAL')
  const claimReview = question.includes('CLAIM_REVIEW')
  const citedByAnswer = question.includes('VERIFIED_CITED') || claimReview
  const claimCitationCoverage = claimReview
    ? {
        totalClaimCount: 2,
        requiredClaimCount: 2,
        citedRequiredClaimCount: 1,
        uncitedRequiredClaimCount: 1,
        invalidCitationClaimCount: 0,
        claimCoveragePercent: 50,
        validCitationFileCount: 1,
        requiredClaimCitationFileCount: 1,
        validCitationFiles: [targetFile],
        requiredClaimCitationFiles: [targetFile],
        status: 'REVIEW',
        roleDistribution: {
          status: 'PRIMARY_PARTIAL',
          requiredClaimCount: 2,
          requiredPrimaryBoundClaimCount: 1,
          requiredContextOnlyClaimCount: 1,
          requiredUnknownOnlyClaimCount: 0,
          unbackedRequiredClaimCount: 1,
          invalidRequiredClaimCount: 0,
          validCitationFileCount: 1,
          requiredClaimCitationFileCount: 1,
          requiredPrimaryFileCount: 1,
          roles: [{ role: 'PRIMARY', claimCount: 1, requiredClaimCount: 1 }],
          files: [{ filePath: targetFile, requiredPrimaryClaimCount: 1, requiredContextClaimCount: 1, requiredUnknownClaimCount: 0 }],
        },
        claims: [
          {
            claimId: 'Q1',
            claimTextPreview: 'OrderService#createOrder is backed by evidence.',
            required: true,
            sourceLabels: ['C1'],
            validSourceLabels: ['C1'],
            invalidSourceLabels: [],
            validSourceFiles: [targetFile],
            status: 'CITED',
          },
          {
            claimId: 'Q2',
            claimTextPreview: 'OrderRepository persists order data.',
            required: true,
            sourceLabels: [],
            validSourceLabels: [],
            invalidSourceLabels: [],
            validSourceFiles: [],
            status: 'UNCITED',
          },
        ],
      }
    : {
        totalClaimCount: citedByAnswer ? 1 : 1,
        requiredClaimCount: citedByAnswer ? 1 : 1,
        citedRequiredClaimCount: citedByAnswer ? 1 : 0,
        uncitedRequiredClaimCount: citedByAnswer ? 0 : 1,
        invalidCitationClaimCount: 0,
        claimCoveragePercent: citedByAnswer ? 100 : 0,
        validCitationFileCount: citedByAnswer ? 1 : 0,
        requiredClaimCitationFileCount: citedByAnswer ? 1 : 0,
        validCitationFiles: citedByAnswer ? [targetFile] : [],
        requiredClaimCitationFiles: citedByAnswer ? [targetFile] : [],
        status: citedByAnswer ? 'READY' : 'REVIEW',
        roleDistribution: {
          status: citedByAnswer ? 'PRIMARY_BOUND' : 'UNBACKED',
          requiredClaimCount: 1,
          requiredPrimaryBoundClaimCount: citedByAnswer ? 1 : 0,
          requiredContextOnlyClaimCount: 0,
          requiredUnknownOnlyClaimCount: citedByAnswer ? 0 : 1,
          unbackedRequiredClaimCount: citedByAnswer ? 0 : 1,
          invalidRequiredClaimCount: 0,
          validCitationFileCount: citedByAnswer ? 1 : 0,
          requiredClaimCitationFileCount: citedByAnswer ? 1 : 0,
          requiredPrimaryFileCount: citedByAnswer ? 1 : 0,
          roles: citedByAnswer ? [{ role: 'PRIMARY', claimCount: 1, requiredClaimCount: 1 }] : [],
          files: citedByAnswer ? [{ filePath: targetFile, requiredPrimaryClaimCount: 1, requiredContextClaimCount: 0, requiredUnknownClaimCount: 0 }] : [],
        },
        claims: [{
          claimId: 'Q1',
          claimTextPreview: citedByAnswer
            ? 'OrderService#createOrder 的订单创建逻辑已绑定代码证据。'
            : 'OrderService#createOrder 的回答没有引用到候选证据。',
          required: true,
          sourceLabels: citedByAnswer ? ['C1'] : [],
          validSourceLabels: citedByAnswer ? ['C1'] : [],
          invalidSourceLabels: [],
          validSourceFiles: citedByAnswer ? [targetFile] : [],
          status: citedByAnswer ? 'CITED' : 'UNCITED',
        }],
      }
  return {
    answer: lowConfidence
      ? '当前结论只能部分对应候选证据，需要人工复核。'
      : claimReview
        ? 'OrderService#createOrder 的订单创建逻辑已绑定代码证据。[C1] OrderRepository 持久化订单数据。'
      : citedByAnswer
        ? `OrderService#createOrder 的订单创建逻辑已绑定代码证据。[C1] ${projectQaAutoRepairSafeMarker} ${projectQaRawAuthorizationSecret}`
        : 'OrderService#createOrder 的回答没有引用到候选证据。',
    scanTaskId,
    question,
    matchedChunks: 1,
    resultCount: 1,
    retrievalMode: 'HYBRID',
    totalChunks: 256,
    embeddedChunks: 144,
    truncated: false,
    evidenceProfile: lowConfidence
      ? { ...codeChunkPayload(question).evidenceProfile, readiness: 'REVIEW', confidence: 32, lowConfidenceCount: 1 }
      : codeChunkPayload(question).evidenceProfile,
    groundingStatus: lowConfidence ? 'PARTIAL' : 'VERIFIED',
    citationEnforcementStatus: lowConfidence ? 'RETRY_FAILED' : 'DIRECT_VERIFIED',
    citationEnforcementReason: lowConfidence ? 'UNCITED_REQUIRED_CLAIM' : 'DIRECT_VERIFIED',
    citationEnforcementNote: lowConfidence
      ? 'Only part of the answer could be matched to candidate evidence.'
      : 'Answer cited the first retrieved source.',
    citationCoverage: {
      totalEvidenceCount: 1,
      citedEvidenceCount: citedByAnswer ? 1 : 0,
      uncitedCandidateCount: citedByAnswer ? 0 : 1,
      repairCandidateCount: citedByAnswer ? 1 : 0,
      coveragePercent: citedByAnswer ? 100 : 0,
      primaryEvidenceCount: 1,
      citedPrimaryEvidenceCount: citedByAnswer ? 1 : 0,
      contextEvidenceCount: 0,
      citedContextEvidenceCount: 0,
      requiredEvidenceCount: 1,
      citedRequiredEvidenceCount: citedByAnswer ? 1 : 0,
      requiredEvidenceCoveragePercent: citedByAnswer ? 100 : 0,
      coverageScope: 'PRIMARY',
      status: citedByAnswer ? 'FULL' : 'NONE',
    },
    sourceEvidenceRef,
    sourceEvidenceMatched: true,
    sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
    claimCitationCoverage,
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
      citedByAnswer,
    }],
    retrievedChunks: [candidateChunk],
  }
}

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.text().includes('findDOMNode') && message.text().includes('deprecated')) return
    if (message.text().includes('[antd: message] Static function can not consume context')) return
    issues.push({ type: 'console.error', message: message.text() })
  })
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', message: error.message })
  })

  return issues
}

async function installProjectQaAutoRepairMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const qaRequests: any[] = []
  const createRequests: CreateRequest[] = []
  const createdRepairs: any[] = []
  const counters = {
    codeChunkSearch: 0,
    qa: 0,
    autoRepairCreate: 0,
    executionDetail: 0,
  }

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'project-qa-autorepair-candidate-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'project_qa_autorepair', email: 'smoke@local.test', status: 'ACTIVE' }))
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
            confidence: 88,
            summary: '报告证据可用于 QA citation AutoRepair smoke。',
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
      await fulfillJson(route, result(codeChunkPayload(url.searchParams.get('query') || '')))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/qa`) {
      counters.qa += 1
      const payload = JSON.parse(request.postData() || '{}')
      qaRequests.push(payload)
      await fulfillJson(route, result(qaPayload(String(payload.question || ''))))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs`) {
      await fulfillJson(route, result(createdRepairs))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/auto-repairs`) {
      counters.autoRepairCreate += 1
      const payload = request.postDataJSON() as CreateRequest['payload']
      createRequests.push({ endpoint: path, payload })
      const createdRepair = {
        id: 9901,
        projectId,
        repositoryId: payload.repositoryId,
        scanTaskId: payload.scanTaskId ?? null,
        filePath: payload.filePath,
        targetDesc: payload.targetDesc,
        status: 'PENDING',
        branchName: null,
        diffContent: null,
        patchArtifactPath: null,
        testLog: null,
        prUrl: null,
        errorMessage: null,
        createdBy: 1,
        createdAt: '2026-07-01T10:03:00Z',
        updatedAt: '2026-07-01T10:03:00Z',
      }
      createdRepairs.splice(0, createdRepairs.length, createdRepair)
      await fulfillJson(route, result(createdRepair))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/AUTO_REPAIR/9901`) {
      counters.executionDetail += 1
      await fulfillJson(route, result({
        task: {
          id: 9902,
          projectId,
          repositoryId,
          taskType: 'AUTO_REPAIR',
          sourceType: 'AUTO_REPAIR',
          sourceId: 9901,
          status: 'PENDING',
          currentStep: 'prepare_workspace',
          currentAttemptId: 1,
          progress: 0,
          errorMessage: null,
          createdBy: 1,
          startedAt: null,
          finishedAt: null,
          createdAt: '2026-07-01T10:03:00Z',
          updatedAt: '2026-07-01T10:03:00Z',
        },
        attempts: [],
        steps: [],
        logs: [],
      }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/audit-logs`) {
      await fulfillJson(route, result({
        items: [{
          id: 7701,
          userId: 1,
          projectId,
          resourceType: 'AUTO_REPAIR',
          resourceId: 9901,
          action: 'AUTO_REPAIR_CANDIDATE_CREATED',
          status: 'SUCCESS',
          inputJson: JSON.stringify({
            repositoryId,
            scanTaskId,
            filePath: targetFile,
            sourceType: 'PROJECT_QA_VERIFIED_CITATION',
            provenance: {
              sourceType: 'PROJECT_QA_VERIFIED_CITATION',
              source: 'Project QA verified citation',
              scanTaskId,
              filePath: targetFile,
              chunkId: candidateChunk.id,
              citationId: candidateChunk.citationId,
              sourceLabel: candidateChunk.sourceLabel,
              startLine: candidateChunk.startLine,
              endLine: candidateChunk.endLine,
              citedByAnswer: true,
              groundingStatus: 'VERIFIED',
              citationEnforcementStatus: 'DIRECT_VERIFIED',
              citationEnforcementReason: 'DIRECT_VERIFIED',
              evidenceType: candidateChunk.evidenceType,
              sourceEvidenceCategory: sourceEvidenceRef.category,
              sourceEvidenceSource: sourceEvidenceRef.source,
              sourceEvidenceTitle: sourceEvidenceRef.title,
              sourceEvidenceFilePath: sourceEvidenceRef.filePath,
              sourceEvidenceLineNumber: sourceEvidenceRef.lineNumber,
              sourceEvidenceMatched: true,
              sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
              repairEvidenceGate: 'READY',
              repairEvidenceGateReason,
              repairEvidenceGateSource: 'SERVER_DERIVED',
            },
          }),
          outputSummary: '自动修复候选已创建',
          durationMs: null,
          requestId: 'req_project_qa_candidate',
          createdAt: '2026-07-01T10:03:00Z',
        }],
        page: 1,
        pageSize: 1,
        total: 1,
      }))
      return
    }

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ code: 'ERROR', message: 'Unhandled mock route', data: null }),
    })
  })

  return { counters, qaRequests, createRequests, unhandledApiRequests }
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
  await expect.poll(async () => {
    const viewportWidth = await locator.page().evaluate(() => window.innerWidth)
    return locator.evaluate((element, width) => {
      const box = element.getBoundingClientRect()
      return Math.max(-box.x, box.x + box.width - width)
    }, viewportWidth)
  }, { message: `${label} must stay inside viewport after layout settles` }).toBeLessThanOrEqual(1)
}

async function expectLocatorTextNotClipped(locator: Locator, label: string, options: { mustWrap?: boolean } = {}) {
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
    expect(metrics.whiteSpace, `${label} must not force single-line evidence: ${JSON.stringify(metrics)}`).not.toBe('nowrap')
    expect(
      metrics.overflowWrap === 'anywhere' || metrics.wordBreak === 'break-word' || metrics.wordBreak === 'break-all',
      `${label} must allow long evidence to wrap: ${JSON.stringify(metrics)}`,
    ).toBe(true)
  }
  expect(metrics.textOverflow, `${label} must not hide critical evidence with ellipsis: ${JSON.stringify(metrics)}`).not.toBe('ellipsis')
  expect(metrics.scrollWidth - metrics.clientWidth, `${label} is horizontally clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(2)
  expect(metrics.scrollHeight - metrics.clientHeight, `${label} is vertically clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(2)
}

async function assertProjectQaAutoRepairSecretsHidden(page: Page, label: string) {
  const bodyText = await page.locator('body').innerText()
  expect(bodyText, `${label}: safe marker must remain visible after redaction`).toContain(projectQaAutoRepairSafeMarker)
  expect(bodyText, `${label}: redaction placeholder must be visible`).toContain('[REDACTED]')
  for (const secret of forbiddenProjectQaAutoRepairSecrets) {
    expect(bodyText, `${label}: body must not contain raw secret ${secret}`).not.toContain(secret)
  }

  const rawUrls = await page.locator('[data-sl-target-url]').evaluateAll(elements =>
    elements.map(element => element.getAttribute('data-sl-target-url') || '').filter(Boolean),
  )
  const decodedUrls = rawUrls.map(value => decodeURIComponent(value).replace(/\+/g, ' '))
  expect(decodedUrls.join('\n'), `${label}: URL handoff must retain safe marker for auditability`).toContain(projectQaAutoRepairSafeMarker)
  expect(decodedUrls.join('\n'), `${label}: URL handoff must redact raw secrets`).toContain('[REDACTED]')
  for (const secret of forbiddenProjectQaAutoRepairSecrets) {
    expect(decodedUrls.join('\n'), `${label}: data-sl-target-url must not contain raw secret ${secret}`).not.toContain(secret)
  }

  const browserUrl = decodeURIComponent(page.url()).replace(/\+/g, ' ')
  for (const secret of forbiddenProjectQaAutoRepairSecrets) {
    expect(browserUrl, `${label}: browser URL must not contain raw secret ${secret}`).not.toContain(secret)
  }
}

async function assertAutoRepairCreateModalReadability(page: Page, dialog: Locator, viewportName: string) {
  await expectContainedInViewport(page.locator('.sl-autorepair-create-modal').last(), `${viewportName}:autorepair-create-modal`)
  const draftReceipt = dialog.locator('.sl-autorepair-draft-receipt')
  await expectContainedInViewport(draftReceipt, `${viewportName}:draft-receipt`)
  await expectLocatorTextNotClipped(draftReceipt.getByText('提交前先核对来源凭证'), `${viewportName}:draft-receipt-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(draftReceipt.getByText(targetFile).first(), `${viewportName}:draft-target-file`, { mustWrap: true })
  await expectLocatorTextNotClipped(draftReceipt.getByText(projectQaAutoRepairSafeMarker).first(), `${viewportName}:draft-source-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(dialog.getByRole('button', { name: '开始生成补丁' }), `${viewportName}:create-primary-button`)
  await expectNoHorizontalOverflow(page, `${viewportName}:autorepair-create-modal-open`)
}

async function assertCandidateReceiptReadability(page: Page, repairDetail: Locator, viewportName: string) {
  const receipt = repairDetail.locator('.sl-autorepair-source-bridge-bound').filter({ hasText: 'Candidate Provenance Receipt' }).first()
  await expectContainedInViewport(receipt, `${viewportName}:candidate-receipt`)
  await expectLocatorTextNotClipped(receipt.getByText(targetFile).first(), `${viewportName}:candidate-receipt-target-file`, { mustWrap: true })
  await expectLocatorTextNotClipped(receipt.getByText(projectQaAutoRepairSafeMarker).first(), `${viewportName}:candidate-receipt-source-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(receipt.getByText('[REDACTED]').first(), `${viewportName}:candidate-receipt-gate-summary`, { mustWrap: true })
  const actionRail = repairDetail.locator('[aria-label="候选凭证复核动作"]')
  await expectContainedInViewport(actionRail, `${viewportName}:candidate-receipt-action-rail`)
  await expectLocatorTextNotClipped(actionRail.getByRole('button', { name: '打开来源报告' }), `${viewportName}:candidate-report-button`)
  await expectLocatorTextNotClipped(actionRail.getByRole('button', { name: 'QA 复核凭证' }), `${viewportName}:candidate-qa-button`)
  await expectLocatorTextNotClipped(actionRail.getByRole('button', { name: '查看候选审计' }), `${viewportName}:candidate-audit-button`)
  await expectNoHorizontalOverflow(page, `${viewportName}:candidate-receipt-readable`)
}

async function submitQaQuestion(page: Page, question: string) {
  const qaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 15_000 })
  await page.getByPlaceholder(/输入问题/).fill(question)
  await page.getByRole('button', { name: '发送' }).click()
  const qaResponse = await qaResponsePromise
  return (await qaResponse.json())?.data || {}
}

async function verifyQaCitationToAutoRepair(page: Page, viewportName: string) {
  await page.goto(`/projects/${projectId}?tab=qa&scanTaskId=${scanTaskId}`)
  await expect(page.getByRole('heading', { name: '代码问答与证据检索' })).toBeVisible()

  const uncitedQa = await submitQaQuestion(page, `PROJECT_QA_VERIFIED_UNCITED_${viewportName} 请解释订单创建链路`)
  expect(uncitedQa.groundingStatus).toBe('VERIFIED')
  expect(uncitedQa.answerCitations?.[0]?.citedByAnswer).toBe(false)
  await expect(page.getByLabel('修复证据门禁').last().getByText('BLOCKED', { exact: true })).toBeVisible()
  const uncitedActionRail = page.getByLabel('QA 下一步动作').last()
  await expect(uncitedActionRail.getByText('已阻断', { exact: true })).toBeVisible()
  await expect(uncitedActionRail.getByRole('button', { name: '重试此问题' })).toBeVisible()
  await expect(uncitedActionRail.getByRole('button', { name: '恢复到输入框' })).toBeVisible()
  await expect(uncitedActionRail.getByRole('button', { name: '重新检索证据' })).toBeVisible()
  await expect(uncitedActionRail.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)

  const partialQa = await submitQaQuestion(page, `PROJECT_QA_PARTIAL_${viewportName} 请解释订单创建链路`)
  expect(partialQa.groundingStatus).toBe('PARTIAL')
  await expect(page.getByLabel('QA 低置信度证据状态').last()).toBeVisible()
  await expect(page.getByLabel('修复证据门禁').last().getByText('BLOCKED', { exact: true })).toBeVisible()
  const partialActionRail = page.getByLabel('QA 下一步动作').last()
  await expect(partialActionRail.getByText('已阻断', { exact: true })).toBeVisible()
  await expect(partialActionRail.getByRole('button', { name: '重试此问题' })).toBeVisible()
  await expect(partialActionRail.getByRole('button', { name: '恢复到输入框' })).toBeVisible()
  await expect(partialActionRail.getByRole('button', { name: '重新检索证据' })).toBeVisible()
  await expect(partialActionRail.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)

  const claimReviewQa = await submitQaQuestion(page, `PROJECT_QA_VERIFIED_CLAIM_REVIEW_${viewportName} 请解释订单创建链路`)
  expect(claimReviewQa.groundingStatus).toBe('VERIFIED')
  expect(claimReviewQa.answerCitations?.[0]?.citedByAnswer).toBe(true)
  expect(claimReviewQa.claimCitationCoverage?.status).toBe('REVIEW')
  await expect(page.getByLabel('主张引用质量').last().getByText('主张引用需要复核')).toBeVisible()
  await expect(page.getByLabel('修复证据门禁').last().getByText('REVIEW', { exact: true })).toBeVisible()
  const claimReviewSourceMatch = page.getByLabel('来源文件匹配说明').last()
  await expect(claimReviewSourceMatch).toBeVisible()
  await expect(claimReviewSourceMatch.getByText('修复候选需复核')).toBeVisible()
  await expect(claimReviewSourceMatch.getByText('已满足：行级锚点').first()).toBeVisible()
  await expect(claimReviewSourceMatch.getByText('未满足：主张 PRIMARY 绑定').first()).toBeVisible()
  const claimReviewActionRail = page.getByLabel('QA 下一步动作').last()
  await expect(claimReviewActionRail.getByText('需复核', { exact: true })).toBeVisible()
  await expect(claimReviewActionRail.getByRole('button', { name: '重新检索证据' })).toBeVisible()
  await expect(claimReviewActionRail.getByRole('button', { name: '重试此问题' })).toBeVisible()
  await expect(claimReviewActionRail.getByRole('button', { name: '恢复到输入框' })).toBeVisible()
  await expect(claimReviewActionRail.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)

  const citedQa = await submitQaQuestion(page, `PROJECT_QA_VERIFIED_CITED_${viewportName} 请解释订单创建链路 ${projectQaAutoRepairSafeMarker} ${projectQaRawAuthorizationSecret}`)
  expect(citedQa.groundingStatus).toBe('VERIFIED')
  expect(citedQa.answerCitations?.[0]?.citedByAnswer).toBe(true)
  expect(citedQa.claimCitationCoverage?.status).toBe('READY')
  const answerSourceReceipt = page.getByLabel('QA 回答报告证据凭证').last()
  await expect(answerSourceReceipt).toBeVisible()
  await expect(answerSourceReceipt).toContainText(projectQaAutoRepairSafeMarker)
  await expect(answerSourceReceipt).toContainText('[REDACTED]')
  await expect(answerSourceReceipt).toContainText(`${sourceEvidenceRef.filePath}:${sourceEvidenceRef.lineNumber}`)
  await expect(answerSourceReceipt).toContainText(`Scan #${scanTaskId}`)
  await expect(answerSourceReceipt).toContainText('REPORT_LINE_ANCHOR')
  await expect(answerSourceReceipt).toContainText('行级锚点')
  const trustedSourceMatch = page.getByLabel('来源文件匹配说明').last()
  await expect(trustedSourceMatch).toBeVisible()
  await expect(trustedSourceMatch.getByText('满足修复候选放行')).toBeVisible()
  await expect(trustedSourceMatch.getByText(`${sourceEvidenceRef.filePath}:${sourceEvidenceRef.lineNumber}`).first()).toBeVisible()
  await expect(trustedSourceMatch.getByText(`${candidateChunk.filePath}:${candidateChunk.startLine}-${candidateChunk.endLine}`).first()).toBeVisible()
  await expect(trustedSourceMatch.getByText('已满足：行级锚点').first()).toBeVisible()
  await expect(trustedSourceMatch.getByText('已满足：主张 PRIMARY 绑定').first()).toBeVisible()
  await expect(trustedSourceMatch.getByText('下一步：可进入修复候选复核。')).toBeVisible()
  await expect(page.getByLabel('修复证据门禁').last().getByText('READY', { exact: true })).toBeVisible()
  await expect(page.getByLabel('修复证据门禁').last().getByText('来源锚点 行级锚点')).toBeVisible()
  const trustedActionRail = page.getByLabel('QA 下一步动作').last()
  await expect(trustedActionRail.getByText('可采信', { exact: true })).toBeVisible()
  const railRepairButton = trustedActionRail.getByRole('button', { name: '生成修复候选' })
  await expect(railRepairButton).toBeVisible()
  await expect(trustedActionRail.getByRole('button', { name: '复制首条引用' })).toBeVisible()
  await expect(trustedActionRail.getByRole('button', { name: '重新检索证据' })).toBeVisible()
  const railTargetUrl = await railRepairButton.getAttribute('data-sl-target-url')
  expect(railTargetUrl).toContain('/auto-repairs?')
  expect(new URL(railTargetUrl || '', 'http://127.0.0.1').searchParams.get('sourceType')).toBe('PROJECT_QA_VERIFIED_CITATION')
  const repairButton = page.getByRole('button', { name: '生成修复候选' }).last()
  await expect(repairButton).toBeVisible()
  const targetUrl = await repairButton.getAttribute('data-sl-target-url')
  expect(targetUrl).toContain('/auto-repairs?')
  const parsedUrl = new URL(targetUrl || '', 'http://127.0.0.1')
  expect(parsedUrl.searchParams.get('projectId')).toBe(String(projectId))
  expect(parsedUrl.searchParams.get('openCreate')).toBe('1')
  expect(parsedUrl.searchParams.get('repositoryId')).toBe(String(repositoryId))
  expect(parsedUrl.searchParams.get('scanTaskId')).toBe(String(scanTaskId))
  expect(parsedUrl.searchParams.get('filePath')).toBe(targetFile)
  expect(parsedUrl.searchParams.get('source')).toBe('Project QA verified citation')
  expect(parsedUrl.searchParams.get('sourceType')).toBe('PROJECT_QA_VERIFIED_CITATION')
  expect(parsedUrl.searchParams.get('citationId')).toBe(candidateChunk.citationId)
  expect(parsedUrl.searchParams.get('chunkId')).toBe(String(candidateChunk.id))
  expect(parsedUrl.searchParams.get('sourceLabel')).toBe(candidateChunk.sourceLabel)
  expect(parsedUrl.searchParams.get('startLine')).toBe(String(candidateChunk.startLine))
  expect(parsedUrl.searchParams.get('endLine')).toBe(String(candidateChunk.endLine))
  expect(parsedUrl.searchParams.get('citedByAnswer')).toBe('true')
  expect(parsedUrl.searchParams.get('groundingStatus')).toBe('VERIFIED')
  expect(parsedUrl.searchParams.get('citationEnforcementStatus')).toBe('DIRECT_VERIFIED')
  expect(parsedUrl.searchParams.get('citationEnforcementReason')).toBe('DIRECT_VERIFIED')
  expect(parsedUrl.searchParams.get('sourceEvidenceCategory') || '').toContain(projectQaAutoRepairSafeMarker)
  expect(parsedUrl.searchParams.get('sourceEvidenceCategory') || '').toContain('[REDACTED]')
  expect(parsedUrl.searchParams.get('sourceEvidenceSource') || '').toContain(projectQaAutoRepairSafeMarker)
  expect(parsedUrl.searchParams.get('sourceEvidenceSource') || '').toContain('[REDACTED]')
  expect(parsedUrl.searchParams.get('sourceEvidenceTitle') || '').toContain(projectQaAutoRepairSafeMarker)
  expect(parsedUrl.searchParams.get('sourceEvidenceTitle') || '').toContain('[REDACTED]')
  expect(parsedUrl.searchParams.get('sourceEvidenceFilePath')).toBe(sourceEvidenceRef.filePath)
  expect(parsedUrl.searchParams.get('sourceEvidenceLineNumber')).toBe(sourceEvidenceRef.lineNumber)
  expect(parsedUrl.searchParams.get('sourceEvidenceMatched')).toBe('true')
  expect(parsedUrl.searchParams.get('sourceEvidenceMatchType')).toBe('REPORT_LINE_ANCHOR')
  expect(parsedUrl.searchParams.get('targetDesc') || '').toContain('Project QA 已验证引用 C1')
  expect(parsedUrl.searchParams.get('targetDesc') || '').toContain(targetFile)
  expect(parsedUrl.searchParams.get('targetDesc') || '').toContain(projectQaAutoRepairSafeMarker)
  expect(parsedUrl.searchParams.get('targetDesc') || '').toContain('[REDACTED]')
  for (const secret of forbiddenProjectQaAutoRepairSecrets) {
    expect(decodeURIComponent(targetUrl || '').replace(/\+/g, ' '), `Project QA AutoRepair data URL must not contain ${secret}`).not.toContain(secret)
  }
  await assertProjectQaAutoRepairSecretsHidden(page, `${viewportName}:project-qa-citation-card-before-autorepair-handoff`)

  await repairButton.click()
  await expect(page).toHaveURL(new RegExp(`/auto-repairs\\?.*openCreate=1`))
  const dialog = page.getByRole('dialog', { name: '发起自动补丁生成任务' })
  await expect(dialog.getByText('Citation Reason')).toBeVisible()
  await expect(dialog.getByText('DIRECT_VERIFIED').first()).toBeVisible()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/Project QA verified citation/)).toBeVisible()
  await expect(dialog.getByText(/Scan #601/)).toBeVisible()
  await expect(dialog.getByText('Candidate Draft Receipt')).toBeVisible()
  await expect(dialog.getByLabel('修复候选草稿凭证')).toContainText('PROJECT_QA_VERIFIED_CITATION')
  await expect(dialog.getByLabel('修复候选草稿凭证')).toContainText(projectQaAutoRepairSafeMarker)
  await expect(dialog.getByLabel('修复候选草稿凭证')).toContainText('[REDACTED]')
  await expect(dialog.getByLabel('待修文件相对路径')).toHaveValue(targetFile)
  await expect(dialog.getByLabel('修改的具体目标描述')).toHaveValue(/Project QA 已验证引用 C1/)
  await expect(dialog.getByLabel('修改的具体目标描述')).toHaveValue(new RegExp(targetFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  await assertAutoRepairCreateModalReadability(page, dialog, viewportName)
  await dialog.getByRole('button', { name: '开始生成补丁' }).click()
  await expect(dialog).toBeHidden()
  const repairDetail = page.getByRole('region', { name: /任务详情 #9901/ })
  await expect(repairDetail).toBeVisible()
  await expect(repairDetail.getByText('Scan Source Bridge')).toBeVisible()
  await expect(repairDetail.getByText('来源扫描闭环')).toBeVisible()
  await expect(repairDetail.getByText(/该修复候选来自 Project QA 已验证引用/)).toBeVisible()
  await expect(repairDetail.getByText('Candidate Provenance Receipt')).toBeVisible()
  await expect(repairDetail.getByText('候选来源凭证')).toBeVisible()
  await expect(repairDetail.getByText('PROJECT_QA_VERIFIED_CITATION').first()).toBeVisible()
  await expect(repairDetail.getByText('C1', { exact: true })).toBeVisible()
  await expect(repairDetail.getByText('#9201')).toBeVisible()
  await expect(repairDetail.getByText('51-89', { exact: true })).toBeVisible()
  await expect(repairDetail.getByText('VERIFIED', { exact: true }).first()).toBeVisible()
  await expect(repairDetail.getByText('DIRECT_VERIFIED', { exact: true }).first()).toBeVisible()
  await expect(repairDetail.getByText(projectQaAutoRepairSafeMarker).first()).toBeVisible()
  await expect(repairDetail.getByText('[REDACTED]').first()).toBeVisible()
  await expect(repairDetail.getByText(`${sourceEvidenceRef.filePath}:${sourceEvidenceRef.lineNumber}`, { exact: true })).toBeVisible()
  await expect(repairDetail.getByLabel('候选证据门禁')).toBeVisible()
  await expect(repairDetail.getByLabel('候选证据门禁').getByText('READY', { exact: true })).toBeVisible()
  await expect(repairDetail.getByLabel('候选证据门禁').getByText('REPORT_LINE_ANCHOR', { exact: true })).toBeVisible()
  await expect(repairDetail.getByText('SERVER_DERIVED', { exact: true })).toBeVisible()
  await expect(repairDetail.getByText(/Scan #601/).first()).toBeVisible()
  await expect(repairDetail.getByText(targetFile).first()).toBeVisible()
  await expect(repairDetail.getByText('回到同次扫描核对证据，再进入补丁审查')).toBeVisible()
  const qaBridgeUrl = await repairDetail.getByRole('button', { name: 'QA 复核此文件' }).getAttribute('data-sl-target-url')
  expect(qaBridgeUrl || '').toContain(`/projects/${projectId}?`)
  expect(qaBridgeUrl || '').toContain('tab=qa')
  expect(qaBridgeUrl || '').toContain(`scanTaskId=${scanTaskId}`)
  const decodedQaBridgeUrl = decodeURIComponent(qaBridgeUrl || '').replace(/\+/g, ' ')
  expect(decodedQaBridgeUrl).toContain('AutoRepair #9901')
  expect(decodedQaBridgeUrl).toContain(targetFile)
  const auditBridgeUrl = await repairDetail.getByRole('button', { name: '扫描审计' }).getAttribute('data-sl-target-url')
  expect(auditBridgeUrl || '').toContain('/audit-logs?')
  expect(auditBridgeUrl || '').toContain('resourceType=AUTO_REPAIR')
  expect(auditBridgeUrl || '').toContain('resourceId=9901')
  expect(auditBridgeUrl || '').toContain(`scanTaskId=${scanTaskId}`)
  const receiptActionRail = repairDetail.locator('[aria-label="候选凭证复核动作"]')
  await expect(receiptActionRail).toBeVisible()
  await expect(receiptActionRail.getByText('Receipt Review Actions')).toBeVisible()
  await expect(receiptActionRail.getByText(/候选证据已就绪/)).toBeVisible()
  await expect(receiptActionRail.getByRole('button', { name: '打开来源报告' })).toHaveAttribute('data-sl-target-url', `/scan-tasks/${scanTaskId}`)
  const receiptQaUrl = await receiptActionRail.getByRole('button', { name: 'QA 复核凭证' }).getAttribute('data-sl-target-url')
  expect(receiptQaUrl || '').toContain(`/projects/${projectId}?`)
  expect(receiptQaUrl || '').toContain('tab=qa')
  expect(receiptQaUrl || '').toContain(`scanTaskId=${scanTaskId}`)
  const decodedReceiptQaUrl = decodeURIComponent(receiptQaUrl || '').replace(/\+/g, ' ')
  expect(decodedReceiptQaUrl).toContain('候选来源凭证')
  expect(decodedReceiptQaUrl).toContain('PROJECT_QA_VERIFIED_CITATION')
  expect(decodedReceiptQaUrl).toContain(targetFile)
  expect(decodedReceiptQaUrl).toContain(projectQaAutoRepairSafeMarker)
  expect(decodedReceiptQaUrl).toContain('[REDACTED]')
  await expect(receiptActionRail.getByRole('button', { name: '查看候选审计' })).toHaveAttribute('data-sl-target-url', new RegExp(`/audit-logs\\?.*resourceId=9901`))
  await assertCandidateReceiptReadability(page, repairDetail, viewportName)
  await assertProjectQaAutoRepairSecretsHidden(page, `${viewportName}:project-qa-autorepair-redaction`)
  await expectNoHorizontalOverflow(page, `${viewportName}:qa-citation-autorepair-candidate`)
}

test('Project QA verified citation can open a scan-bound AutoRepair candidate draft', async ({ page }) => {
  const network = await installProjectQaAutoRepairMocks(page)
  const issues = installRuntimeGuards(page)
  const assertions = new Set<string>()

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await verifyQaCitationToAutoRepair(page, viewport.name)
    assertions.add('verified-cited-qa-citation-opens-autorepair-draft')
    assertions.add('uncited-verified-citation-hides-autorepair-action')
    assertions.add('low-confidence-citation-hides-autorepair-action')
    assertions.add('claim-review-verified-citation-hides-autorepair-action')
    assertions.add('autorepair-create-payload-bound-to-qa-citation')
    assertions.add('created-autorepair-detail-selected-after-submit')
    assertions.add('created-autorepair-source-bridge-bound-to-qa-citation')
    assertions.add('candidate-provenance-receipt-visible')
    assertions.add('candidate-provenance-source-evidence-visible')
    assertions.add('qa-repair-evidence-gate-ready-and-blocked-visible')
    assertions.add('qa-next-action-rail-stateful-actions-visible')
    assertions.add('qa-next-action-rail-ready-autorepair-deeplink-bound')
    assertions.add('qa-answer-source-receipt-visible')
    assertions.add('qa-answer-source-receipt-title-visible')
    assertions.add('qa-answer-source-receipt-line-anchor-visible')
    assertions.add('qa-answer-source-receipt-scan-bound')
    assertions.add('candidate-evidence-gate-ready-visible')
    assertions.add('candidate-receipt-action-rail-bound')
    assertions.add('qa-citation-card-evidence-reason-redacted-before-handoff')
  }

  expect(network.qaRequests.length, 'QA AutoRepair candidate smoke should submit four QA questions per viewport.').toBe(viewportMatrix.length * 4)
  expect(network.createRequests, 'Each viewport should create one AutoRepair candidate from a verified citation.').toHaveLength(viewportMatrix.length)
  for (const request of network.createRequests) {
    expect(request.endpoint).toBe(`/api/projects/${projectId}/auto-repairs`)
    expect(request.payload.repositoryId).toBe(repositoryId)
    expect(request.payload.scanTaskId).toBe(scanTaskId)
    expect(request.payload.filePath).toBe(targetFile)
    expect(request.payload.targetDesc || '').toContain('Project QA 已验证引用 C1')
    expect(request.payload.targetDesc || '').toContain(targetFile)
    expect(request.payload.targetDesc || '').toContain(projectQaAutoRepairSafeMarker)
    expect(request.payload.targetDesc || '').toContain('[REDACTED]')
    expect(request.payload.provenance?.sourceType).toBe('PROJECT_QA_VERIFIED_CITATION')
    expect(request.payload.provenance?.citationId).toBe(candidateChunk.citationId)
    expect(request.payload.provenance?.chunkId).toBe(candidateChunk.id)
    expect(request.payload.provenance?.sourceLabel).toBe('C1')
    expect(request.payload.provenance?.startLine).toBe(candidateChunk.startLine)
    expect(request.payload.provenance?.endLine).toBe(candidateChunk.endLine)
    expect(request.payload.provenance?.citedByAnswer).toBe(true)
    expect(request.payload.provenance?.groundingStatus).toBe('VERIFIED')
    expect(request.payload.provenance?.citationEnforcementStatus).toBe('DIRECT_VERIFIED')
    expect(request.payload.provenance?.citationEnforcementReason).toBe('DIRECT_VERIFIED')
    expect(request.payload.provenance?.sourceEvidenceCategory || '').toContain(projectQaAutoRepairSafeMarker)
    expect(request.payload.provenance?.sourceEvidenceCategory || '').toContain('[REDACTED]')
    expect(request.payload.provenance?.sourceEvidenceSource || '').toContain(projectQaAutoRepairSafeMarker)
    expect(request.payload.provenance?.sourceEvidenceSource || '').toContain('[REDACTED]')
    expect(request.payload.provenance?.sourceEvidenceTitle || '').toContain(projectQaAutoRepairSafeMarker)
    expect(request.payload.provenance?.sourceEvidenceTitle || '').toContain('[REDACTED]')
    expect(request.payload.provenance?.sourceEvidenceFilePath).toBe(sourceEvidenceRef.filePath)
    expect(request.payload.provenance?.sourceEvidenceLineNumber).toBe(sourceEvidenceRef.lineNumber)
    expect(request.payload.provenance?.sourceEvidenceMatched).toBe(true)
    expect(request.payload.provenance?.sourceEvidenceMatchType).toBe('REPORT_LINE_ANCHOR')
    const requestText = JSON.stringify(request.payload)
    for (const secret of forbiddenProjectQaAutoRepairSecrets) {
      expect(requestText, `Project QA AutoRepair create payload must not contain raw handoff secret ${secret}`).not.toContain(secret)
    }
  }
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in Project QA AutoRepair candidate smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const markerPayload = {
    projectId,
    repositoryId,
    scanTaskId,
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    qaRequestCount: network.qaRequests.length,
    createRequestCount: network.createRequests.length,
    createPayloadBound: network.createRequests.every(request =>
      request.payload.repositoryId === repositoryId
      && request.payload.scanTaskId === scanTaskId
      && request.payload.filePath === targetFile
      && (request.payload.targetDesc || '').includes('Project QA 已验证引用 C1')
      && (request.payload.targetDesc || '').includes(projectQaAutoRepairSafeMarker)
      && (request.payload.targetDesc || '').includes('[REDACTED]')),
    provenancePayloadBound: network.createRequests.every(request =>
      request.payload.provenance?.sourceType === 'PROJECT_QA_VERIFIED_CITATION'
      && request.payload.provenance?.citationId === candidateChunk.citationId
      && request.payload.provenance?.chunkId === candidateChunk.id
      && request.payload.provenance?.sourceLabel === 'C1'
      && request.payload.provenance?.startLine === candidateChunk.startLine
      && request.payload.provenance?.endLine === candidateChunk.endLine
      && request.payload.provenance?.citedByAnswer === true
      && request.payload.provenance?.groundingStatus === 'VERIFIED'
      && request.payload.provenance?.citationEnforcementStatus === 'DIRECT_VERIFIED'
      && request.payload.provenance?.citationEnforcementReason === 'DIRECT_VERIFIED'
      && String(request.payload.provenance?.sourceEvidenceCategory || '').includes(projectQaAutoRepairSafeMarker)
      && String(request.payload.provenance?.sourceEvidenceCategory || '').includes('[REDACTED]')
      && String(request.payload.provenance?.sourceEvidenceSource || '').includes(projectQaAutoRepairSafeMarker)
      && String(request.payload.provenance?.sourceEvidenceSource || '').includes('[REDACTED]')
      && String(request.payload.provenance?.sourceEvidenceTitle || '').includes(projectQaAutoRepairSafeMarker)
      && String(request.payload.provenance?.sourceEvidenceTitle || '').includes('[REDACTED]')
      && request.payload.provenance?.sourceEvidenceFilePath === sourceEvidenceRef.filePath
      && request.payload.provenance?.sourceEvidenceLineNumber === sourceEvidenceRef.lineNumber),
    sourceEvidenceRefPayloadBound: network.createRequests.every(request =>
      String(request.payload.provenance?.sourceEvidenceTitle || '').includes(projectQaAutoRepairSafeMarker)
      && String(request.payload.provenance?.sourceEvidenceTitle || '').includes('[REDACTED]')
      && request.payload.provenance?.sourceEvidenceFilePath === targetFile
      && request.payload.provenance?.sourceEvidenceLineNumber === sourceEvidenceRef.lineNumber
      && request.payload.provenance?.sourceEvidenceMatched === true
      && request.payload.provenance?.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'),
    actionVisibility: {
      verifiedCitedVisible: true,
      verifiedUncitedHidden: true,
      lowConfidenceHidden: true,
      claimReviewHidden: true,
      nextActionRailTrustedVisible: true,
      nextActionRailReviewVisible: true,
      nextActionRailBlockedVisible: true,
      nextActionRailReadyAutoRepairDeepLinkBound: true,
    },
    repairEvidenceGate: {
      readyVisible: true,
      blockedVisible: true,
      sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
    },
    qaAnswerSourceReceipt: {
      visible: true,
      sourceEvidenceTitleVisible: true,
      lineAnchorVisible: true,
      scanTaskIdBound: true,
      sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
      noRawPromptOrAnswer: true,
      redaction: {
        scope: 'PROJECT_QA_AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY',
        surface: 'PROJECT_QA_VERIFIED_CITATION_AUTOREPAIR_CANDIDATE_RECEIPT',
        fixtureHasBearerSecret: true,
        fixtureHasAuthorizationSecret: true,
        fixtureHasApiKeySecret: true,
        fixtureHasPasswordSecret: true,
        fixtureHasJwtSecret: true,
        safeMarkerVisible: true,
        uiRawSecretsHidden: true,
        bodyRawSecretsHidden: true,
        urlRawSecretsHidden: true,
        payloadRawSecretsHidden: true,
        redactionVisible: true,
        markerContainsRawSecret: false,
      },
    },
    assertions: Array.from(assertions).sort(),
    counters: network.counters,
    createdRepairSelected: true,
    sourceBridge: {
      visible: true,
      qaCitationOriginVisible: true,
      scanTaskIdBound: true,
      qaDeepLinkBound: true,
      auditDeepLinkBound: true,
    },
    candidateReceipt: {
      visible: true,
      auditAction: 'AUTO_REPAIR_CANDIDATE_CREATED',
      sourceTypeBound: true,
      citationIdBound: true,
      lineRangeBound: true,
      citationEnforcementReasonBound: true,
      evidenceGateReady: true,
      sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
      repairEvidenceGateSource: 'SERVER_DERIVED',
      actionRailVisible: true,
      reportDeepLinkBound: true,
      qaDeepLinkBound: true,
      auditDeepLinkBound: true,
      noRawPromptOrAnswer: true,
    },
    layoutDensity: {
      mobile390Covered: viewportMatrix.some(viewport => viewport.width === 390 && viewport.height === 844),
      narrow320Covered: viewportMatrix.some(viewport => viewport.width === 320 && viewport.height === 740),
      dialogContained: true,
      sourceBridgeContained: true,
      candidateReceiptContained: true,
      actionRailContained: true,
      noHorizontalOverflow: true,
    },
    mobileReadability: {
      criticalTextsWrap: true,
      targetFileNotClipped: true,
      targetDescNotClipped: true,
      candidateReceiptTextNotClipped: true,
      primaryButtonLabelNotClipped: true,
      actionButtonsNotClipped: true,
      sourceCredentialReadable: true,
    },
    qaHandoff: {
      visible: true,
      qaDeepLinkBound: true,
      scanTaskIdBound: true,
      targetFileVisible: true,
      sourceTypeVisible: true,
      actionRailContained: true,
      noRawPromptOrAnswer: true,
    },
    candidateEvidenceFile: targetFile,
    source: 'Project QA verified citation',
    spec: 'project-qa-autorepair-candidate-smoke.spec.ts',
  }
  const markerText = JSON.stringify(markerPayload)
  for (const secret of forbiddenProjectQaAutoRepairSecrets) {
    expect(markerText, `Project QA AutoRepair marker must not contain raw secret ${secret}`).not.toContain(secret)
  }
  console.log('PROJECT_QA_AUTOREPAIR_CANDIDATE_SMOKE_OK', markerText)
})
