import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

const projectId = 1
const repositoryId = 11
const scanTaskId = 501
const executionTaskId = 701
const reportArtifactId = 301
const targetFile = 'src/main/java/demo/report/autorepair/readability/ChatControllerWithLongBoundaryRisk.java'
const reportRepairGateReason = '扫描报告风险、目标文件、风险级别和来源扫描已经形成候选闭环；移动视口必须完整展示 Risk Key 和门禁说明，避免误触发不可追溯修复。'
const autoRepairCandidateSafeMarker = 'AUTOREPAIR_CANDIDATE_SAFE_MARKER'
const autoRepairRawBearerSecret = 'Bearer autorepair-candidate-bearer-should-not-render'
const autoRepairRawAuthorizationSecret = `Authorization: ${autoRepairRawBearerSecret}`
const autoRepairRawApiKeySecret = 'sk-autorepaircandidate-secret-should-not-render123456'
const autoRepairRawPasswordSecret = 'autorepair-candidate-password-should-not-render'
const autoRepairRawQuotedSecret = 'quoted autorepair candidate secret should not render'
const autoRepairRawJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJhdXRvUmVwYWlyIjoiY2FuZGlkYXRlIn0.autoRepairCandidateSignatureShouldNotRender'
const forbiddenAutoRepairSecretSnippets = [
  autoRepairRawBearerSecret,
  autoRepairRawAuthorizationSecret,
  autoRepairRawApiKeySecret,
  autoRepairRawPasswordSecret,
  autoRepairRawQuotedSecret,
  autoRepairRawJwtSecret,
]
const reportRepairGateReasonWithSecrets = [
  reportRepairGateReason,
  autoRepairCandidateSafeMarker,
  autoRepairRawAuthorizationSecret,
  `apiKey=${autoRepairRawApiKeySecret}`,
  `password="${autoRepairRawPasswordSecret}"`,
  `secret="${autoRepairRawQuotedSecret}"`,
  autoRepairRawJwtSecret,
].join(' ')
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
  name: 'Report AutoRepair Candidate Smoke',
  description: 'Mocked project for report to AutoRepair candidate smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 92,
  createdBy: 1,
  createdAt: '2026-06-30T10:00:00Z',
}

const repository = {
  id: repositoryId,
  projectId,
  name: 'demo-service',
  url: 'https://github.com/example/demo-service.git',
  defaultBranch: 'main',
  status: 'ACTIVE',
  createdBy: 1,
  createdAt: '2026-06-30T10:00:00Z',
}

const scanTask = {
  id: scanTaskId,
  projectId,
  repositoryId,
  branch: 'main',
  commitSha: 'abc1234567890',
  status: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-06-30T10:01:00Z',
  finishedAt: '2026-06-30T10:02:00Z',
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-06-30T10:00:30Z',
}

const reportData = {
  overview: {
    totalFiles: 42,
    totalLines: 3200,
    totalDirs: 12,
    testFiles: 6,
  },
  techStack: {
    name: 'Spring Boot',
    version: '3.3',
    evidence: ['pom.xml', 'ChatController.java'],
  },
  directories: {
    srcMain: true,
    srcTest: true,
    controllerDirs: ['src/main/java/demo'],
    serviceDirs: ['src/main/java/demo/service'],
    repositoryDirs: ['src/main/java/demo/repository'],
    entityDirs: ['src/main/java/demo/domain'],
  },
  modules: {
    controllers: 1,
    services: 2,
    repositories: 1,
    entities: 1,
  },
  codeQuality: {
    totalClasses: 5,
    totalMethods: 24,
    avgMethodsPerClass: 4.8,
    risks: [
      {
        severity: 'HIGH',
        category: 'Controller boundary',
        message: `Chat endpoint mixes validation and orchestration logic. ${autoRepairCandidateSafeMarker} ${autoRepairRawAuthorizationSecret}`,
        file_path: targetFile,
        line_number: 27,
        impact: `请求边界和服务职责不清晰 apiKey=${autoRepairRawApiKeySecret}`,
        suggestion: `Move orchestration into ChatService and keep controller thin. password="${autoRepairRawPasswordSecret}" ${autoRepairRawJwtSecret}`,
      },
    ],
  },
  technicalDebt: [],
  suggestions: ['拆分 Controller 职责并补充边界测试'],
  apiRoutes: [],
  dbEntities: [],
  scanFingerprint: {
    manifestFiles: 1,
    hashedFiles: 42,
    binaryFiles: 0,
    largeFiles: 0,
    repoContentHash: 'feedfacecafebeef1234567890',
  },
  reportQuality: {
    readiness: 'READY',
    confidence: 88,
    summary: '报告证据链完整，可进入代码证据复核。',
    evidenceChecks: [
      { key: 'scan_scope', label: '扫描范围', status: 'READY', value: '42 files', detail: '扫描范围稳定' },
      { key: 'test_signal', label: '测试信号', status: 'READY', value: '6 tests', detail: '发现测试文件' },
      { key: 'module_map', label: '模块图', status: 'READY', value: '5 modules', detail: '模块识别完整' },
      { key: 'api_data_surface', label: 'API/数据面', status: 'READY', value: '1/1', detail: '接口与实体均识别' },
      { key: 'fingerprint', label: '指纹', status: 'READY', value: 'feedface', detail: '内容哈希可追溯' },
      { key: 'risk_signal', label: '风险信号', status: 'RISK', value: '1 high', detail: '存在高风险项' },
    ],
  },
}

const artifacts = [
  {
    id: reportArtifactId,
    projectId,
    repositoryId,
    ownerType: 'SCAN_TASK',
    ownerId: scanTaskId,
    artifactType: 'ARCHITECTURE_REPORT',
    contentType: 'application/json',
    sizeBytes: 4096,
    checksumSha256: 'report-checksum',
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-06-30T10:02:00Z',
  },
]

const executionDetail = {
  task: {
    id: executionTaskId,
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
    startedAt: '2026-06-30T10:01:00Z',
    finishedAt: '2026-06-30T10:02:00Z',
    createdAt: '2026-06-30T10:00:30Z',
    updatedAt: '2026-06-30T10:02:00Z',
  },
  attempts: [],
  steps: [],
  logs: [],
}

const governanceTimeline = {
  projectId,
  repositoryId,
  scanTaskId,
  scanStatus: 'SUCCESS',
  generatedAt: '2026-06-30T10:02:30Z',
  summary: {
    status: 'HEALTHY',
    counts: {
      artifacts: 0,
      scanExecution: 1,
      repairExecutions: 0,
      agentExecutions: 0,
      autoRepairs: 0,
      agentTasks: 0,
      agentToolCalls: 0,
      auditLogs: 0,
    },
    hasErrors: false,
    attributionGapCount: 0,
  },
  resources: {
    artifacts: [],
    scanExecution: executionDetail,
    repairExecutions: [],
    agentExecutions: [],
    autoRepairs: [],
    agentTasks: [],
    agentToolCalls: [],
    auditLogs: [],
  },
  events: [],
  limits: {},
  truncated: false,
  warnings: [],
  attributionGaps: [],
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
    /\[antd: message\] Static function can not consume context/,
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

async function assertAutoRepairCreateModalReadability(page: Page, dialog: Locator, viewportName: string) {
  await expectContainedInViewport(page.locator('.sl-autorepair-create-modal').last(), `${viewportName}:autorepair-create-modal`)
  const draftReceipt = dialog.locator('.sl-autorepair-draft-receipt')
  await expectContainedInViewport(draftReceipt, `${viewportName}:draft-receipt`)
  await expectLocatorTextNotClipped(draftReceipt.getByText('提交前先核对来源凭证'), `${viewportName}:draft-receipt-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(draftReceipt.getByText(targetFile).first(), `${viewportName}:draft-target-file`, { mustWrap: true })
  await expectLocatorTextNotClipped(draftReceipt.getByText('Controller boundary').first(), `${viewportName}:draft-risk-category`, { mustWrap: true })
  await expectLocatorTextNotClipped(dialog.getByRole('button', { name: '开始生成补丁' }), `${viewportName}:create-primary-button`)
  await expectNoHorizontalOverflow(page, `${viewportName}:autorepair-create-modal-open`)
}

async function assertCandidateReceiptReadability(page: Page, repairDetail: Locator, viewportName: string) {
  const receipt = repairDetail.locator('.sl-autorepair-source-bridge-bound').filter({ hasText: 'Candidate Provenance Receipt' }).first()
  await expectContainedInViewport(receipt, `${viewportName}:candidate-receipt`)
  await expectLocatorTextNotClipped(receipt.getByText(targetFile).first(), `${viewportName}:candidate-receipt-target-file`, { mustWrap: true })
  await expectLocatorTextNotClipped(receipt.getByText(reportRepairGateReason).first(), `${viewportName}:candidate-receipt-gate-summary`, { mustWrap: true })
  await expect(receipt.getByText(autoRepairCandidateSafeMarker).first(), `${viewportName}:candidate-receipt-safe-marker`).toBeVisible()
  await expect(receipt.getByText('[REDACTED]').first(), `${viewportName}:candidate-receipt-redaction-visible`).toBeVisible()
  await expectLocatorTextNotClipped(receipt.getByText(`Controller boundary:${targetFile}:27`).first(), `${viewportName}:candidate-receipt-risk-key`, { mustWrap: true })
  const actionRail = repairDetail.locator('[aria-label="候选凭证复核动作"]')
  await expectContainedInViewport(actionRail, `${viewportName}:candidate-receipt-action-rail`)
  await expectLocatorTextNotClipped(actionRail.getByRole('button', { name: '打开来源报告' }), `${viewportName}:candidate-report-button`)
  await expectLocatorTextNotClipped(actionRail.getByRole('button', { name: 'QA 复核凭证' }), `${viewportName}:candidate-qa-button`)
  await expectLocatorTextNotClipped(actionRail.getByRole('button', { name: '查看候选审计' }), `${viewportName}:candidate-audit-button`)
  await expectNoHorizontalOverflow(page, `${viewportName}:candidate-receipt-readable`)
}

async function assertAutoRepairCandidateRedaction(page: Page, root: Locator, label: string) {
  await expect(root, `${label}:safe-marker-visible`).toContainText(autoRepairCandidateSafeMarker)
  await expect(root, `${label}:redaction-visible`).toContainText('[REDACTED]')
  for (const secret of forbiddenAutoRepairSecretSnippets) {
    await expect(root, `${label}:root-hides-${secret}`).not.toContainText(secret)
  }

  const bodyText = await page.locator('body').innerText()
  for (const secret of forbiddenAutoRepairSecretSnippets) {
    expect(bodyText, `${label}:body must not contain raw secret ${secret}`).not.toContain(secret)
  }

  const targetUrls = await page.locator('[data-sl-target-url]').evaluateAll(elements => (
    elements.map(element => element.getAttribute('data-sl-target-url') || '')
  ))
  expect(targetUrls.length, `${label}:should expose target URLs for handoff actions`).toBeGreaterThan(0)
  const decodedUrls = targetUrls.map(url => decodeURIComponent(url).replace(/\+/g, ' '))
  expect(decodedUrls.join('\n'), `${label}:safe marker should survive redacted QA handoff URL`).toContain(autoRepairCandidateSafeMarker)
  expect(decodedUrls.join('\n'), `${label}:redacted marker should survive redacted QA handoff URL`).toContain('[REDACTED]')
  for (const secret of forbiddenAutoRepairSecretSnippets) {
    expect(decodedUrls.join('\n'), `${label}:data-sl-target-url must not contain raw secret ${secret}`).not.toContain(secret)
  }

  return {
    scope: 'AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY',
    surface: 'AUTOREPAIR_SOURCE_BRIDGE_CANDIDATE_PROVENANCE_RECEIPT',
    fixtureHasBearerSecret: true,
    fixtureHasApiKeySecret: true,
    fixtureHasPasswordSecret: true,
    fixtureHasQuotedSecret: true,
    fixtureHasJwtSecret: true,
    uiRawSecretsHidden: true,
    urlRawSecretsHidden: true,
    bodyRawSecretsHidden: true,
    redactionVisible: true,
    safeMarkerVisible: true,
    markerContainsRawSecret: false,
  }
}

async function installReportAutoRepairCandidateMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const createRequests: CreateRequest[] = []
  const createdRepairs: any[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'report-autorepair-candidate-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'report_autorepair_smoke', email: 'smoke@local.test', status: 'ACTIVE' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/scan-tasks/${scanTaskId}`) {
      await fulfillJson(route, result(scanTask))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      await fulfillJson(route, result(artifacts))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${reportArtifactId}/preview`) {
      await fulfillJson(route, result({ record: artifacts[0], text: JSON.stringify(reportData), truncated: false, previewBytes: 4096 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/SCAN_TASK/${scanTaskId}`) {
      await fulfillJson(route, result(executionDetail))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`) {
      await fulfillJson(route, result(governanceTimeline))
      return
    }

    if (method === 'GET' && (path === `/api/projects/${projectId}/code-chunks/search` || path === `/api/projects/${projectId}/code-chunks/status`)) {
      await fulfillJson(route, result({
        scanTaskId,
        query: url.searchParams.get('query') || '',
        limit: Number(url.searchParams.get('limit') || 3),
        total: 1,
        resultCount: 1,
        totalChunks: 128,
        embeddedChunks: 96,
        truncated: false,
        retrievalMode: 'HYBRID',
        evidenceProfile: {
          readiness: 'READY',
          confidence: 91,
          summary: 'Controller evidence is strongly matched.',
          nextAction: 'Review controller boundary',
          details: [],
          uniqueFiles: 1,
          embeddedEvidenceCount: 1,
          lowConfidenceCount: 0,
          topScore: 91,
          averageScore: 91,
          lineSpan: 18,
          dominantEvidenceType: 'CONTROLLER',
          evidenceTypeStats: [{ type: 'CONTROLLER', count: 1 }],
          fileStats: [{ filePath: targetFile, count: 1, bestScore: 91 }],
        },
        items: [{
          id: 9001,
          scanTaskId,
          filePath: targetFile,
          startLine: 24,
          endLine: 42,
          content: 'class ChatController { Response chat(Request request) { return chatService.chat(request); } }',
          contentPreview: 'class ChatController {\n  Response chat(Request request) {\n    return chatService.chat(request);\n  }\n}',
          hasEmbedding: true,
          matchedTerms: ['ChatController', 'chat', 'validation', 'orchestration'],
          relevanceScore: 91,
          evidenceType: 'CONTROLLER',
          evidenceReason: 'Controller handler matches the reported endpoint and risk file.',
          contextRole: 'PRIMARY',
          contextDistance: 0,
        }],
      }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs`) {
      await fulfillJson(route, result(createdRepairs))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/repositories`) {
      await fulfillJson(route, result([repository]))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/auto-repairs`) {
      const payload = request.postDataJSON() as CreateRequest['payload']
      createRequests.push({ endpoint: path, payload })
      const createdRepair = {
        id: 8801,
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
        createdAt: '2026-06-30T10:03:00Z',
        updatedAt: '2026-06-30T10:03:00Z',
      }
      createdRepairs.splice(0, createdRepairs.length, createdRepair)
      await fulfillJson(route, result(createdRepair))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/AUTO_REPAIR/8801`) {
      await fulfillJson(route, result({
        task: {
          id: 8802,
          projectId,
          repositoryId,
          taskType: 'AUTO_REPAIR',
          sourceType: 'AUTO_REPAIR',
          sourceId: 8801,
          status: 'PENDING',
          currentStep: 'prepare_workspace',
          currentAttemptId: 1,
          progress: 0,
          errorMessage: null,
          createdBy: 1,
          startedAt: null,
          finishedAt: null,
          createdAt: '2026-06-30T10:03:00Z',
          updatedAt: '2026-06-30T10:03:00Z',
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
          id: 6601,
          userId: 1,
          projectId,
          resourceType: 'AUTO_REPAIR',
          resourceId: 8801,
          action: 'AUTO_REPAIR_CANDIDATE_CREATED',
          status: 'SUCCESS',
          inputJson: JSON.stringify({
            repositoryId,
            scanTaskId,
            filePath: targetFile,
            sourceType: 'SCAN_REPORT_RISK',
            rawPrompt: `raw prompt must stay hidden ${autoRepairRawAuthorizationSecret}`,
            rawQuestion: `raw question must stay hidden apiKey=${autoRepairRawApiKeySecret}`,
            rawAnswer: `raw answer must stay hidden password="${autoRepairRawPasswordSecret}"`,
            rawCode: `raw code must stay hidden secret="${autoRepairRawQuotedSecret}"`,
            rawDiff: `raw diff must stay hidden ${autoRepairRawJwtSecret}`,
            debugContext: {
              llmRequest: autoRepairRawAuthorizationSecret,
              llmResponse: autoRepairRawJwtSecret,
            },
            provenance: {
              sourceType: 'SCAN_REPORT_RISK',
              source: `扫描报告 #${scanTaskId}`,
              scanTaskId,
              filePath: targetFile,
              riskKey: `Controller boundary:${targetFile}:27 ${autoRepairCandidateSafeMarker} ${autoRepairRawAuthorizationSecret}`,
              riskCategory: `Controller boundary ${autoRepairCandidateSafeMarker} apiKey=${autoRepairRawApiKeySecret}`,
              riskSeverity: 'HIGH',
              lineNumber: 27,
              sourceEvidenceTitle: `Controller risk evidence ${autoRepairCandidateSafeMarker} password="${autoRepairRawPasswordSecret}"`,
              sourceEvidenceSource: `ARCHITECTURE_REPORT ${autoRepairCandidateSafeMarker} secret="${autoRepairRawQuotedSecret}"`,
              sourceEvidenceFilePath: `${targetFile}?token=${autoRepairRawApiKeySecret}`,
              rawPrompt: `provenance prompt ${autoRepairRawAuthorizationSecret}`,
              rawAnswer: `provenance answer ${autoRepairRawJwtSecret}`,
              rawCode: `provenance code password="${autoRepairRawPasswordSecret}"`,
              rawDiff: `provenance diff secret="${autoRepairRawQuotedSecret}"`,
              debugTrace: autoRepairRawJwtSecret,
              repairEvidenceGate: 'READY',
              repairEvidenceGateReason: reportRepairGateReasonWithSecrets,
              repairEvidenceGateSource: 'SERVER_DERIVED',
            },
          }),
          outputSummary: '自动修复候选已创建',
          durationMs: null,
          requestId: 'req_report_candidate',
          createdAt: '2026-06-30T10:03:00Z',
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
      body: JSON.stringify(result(null)),
    })
  })

  return { createRequests, unhandledApiRequests }
}

async function submitReportAutoRepairCandidate(page: Page, viewportName: string) {
  await page.goto(`/scan-tasks/${scanTaskId}`)
  await expect(page.getByRole('heading', { name: '报告证据链完整，可进入代码证据复核。' }).first()).toBeVisible()
  await page.getByRole('tab', { name: /质量风险/ }).click()
  await page.getByRole('button', { name: '查看证据' }).first().click()

  const drawer = page.getByRole('dialog', { name: '报告证据抽屉' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText(targetFile).first()).toBeVisible()
  await drawer.getByRole('button', { name: '生成修复候选' }).click()

  await expect(page).toHaveURL(new RegExp(`/auto-repairs\\?.*openCreate=1`))
  const parsedUrl = new URL(page.url())
  expect(parsedUrl.searchParams.get('sourceType')).toBe('SCAN_REPORT_RISK')
  expect(parsedUrl.searchParams.get('riskCategory')).toBe('Controller boundary')
  expect(parsedUrl.searchParams.get('riskSeverity')).toBe('HIGH')
  expect(parsedUrl.searchParams.get('lineNumber')).toBe('27')
  expect(parsedUrl.searchParams.get('riskKey') || '').toContain('Controller boundary')
  const dialog = page.getByRole('dialog', { name: '发起自动补丁生成任务' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/Scan #501/)).toBeVisible()
  await expect(dialog.getByText('Candidate Draft Receipt')).toBeVisible()
  await expect(dialog.getByLabel('修复候选草稿凭证')).toContainText('SCAN_REPORT_RISK')
  await expect(dialog.getByLabel('修复候选草稿凭证')).toContainText('Controller boundary')
  await expect(dialog.getByLabel('待修文件相对路径')).toHaveValue(targetFile)
  await expect(dialog.getByLabel('修改的具体目标描述')).toHaveValue(/扫描报告 #501/)
  await expect(dialog.getByLabel('修改的具体目标描述')).toHaveValue(/Controller boundary|Chat endpoint/)
  await expect(dialog.getByLabel('修改的具体目标描述')).toHaveValue(new RegExp(autoRepairCandidateSafeMarker))
  await expect(dialog.getByLabel('修改的具体目标描述')).toHaveValue(/\[REDACTED\]/)
  const draftTargetDesc = await dialog.getByLabel('修改的具体目标描述').inputValue()
  for (const secret of forbiddenAutoRepairSecretSnippets) {
    expect(draftTargetDesc, `${viewportName}:draft targetDesc must not contain raw secret ${secret}`).not.toContain(secret)
  }
  await assertAutoRepairCreateModalReadability(page, dialog, viewportName)
  await dialog.getByRole('button', { name: '开始生成补丁' }).click()
  await expect(dialog).toBeHidden()
  const repairDetail = page.getByRole('region', { name: /任务详情 #8801/ })
  await expect(repairDetail).toBeVisible()
  await expect(repairDetail.getByText('Scan Source Bridge')).toBeVisible()
  await expect(repairDetail.getByText('该修复候选来自扫描报告风险项。')).toBeVisible()
  await expect(repairDetail.getByText('Candidate Provenance Receipt')).toBeVisible()
  await expect(repairDetail.getByText('候选来源凭证')).toBeVisible()
  await expect(repairDetail.getByText('SCAN_REPORT_RISK').first()).toBeVisible()
  await expect(repairDetail.getByText(/Controller boundary/).first()).toBeVisible()
  await expect(repairDetail.getByText(autoRepairCandidateSafeMarker).first()).toBeVisible()
  await expect(repairDetail.getByText('[REDACTED]').first()).toBeVisible()
  await expect(repairDetail.getByText('HIGH', { exact: true }).first()).toBeVisible()
  await expect(repairDetail.getByText('Line 27')).toBeVisible()
  await expect(repairDetail.getByRole('button', { name: 'QA 复核此文件' })).toHaveAttribute('data-sl-target-url', /scanTaskId=501/)
  await expect(repairDetail.getByRole('button', { name: '扫描审计' })).toHaveAttribute('data-sl-target-url', /resourceId=8801/)
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
  expect(decodedReceiptQaUrl).toContain('SCAN_REPORT_RISK')
  expect(decodedReceiptQaUrl).toContain(targetFile)
  expect(decodedReceiptQaUrl).toContain(autoRepairCandidateSafeMarker)
  expect(decodedReceiptQaUrl).toContain('[REDACTED]')
  for (const secret of forbiddenAutoRepairSecretSnippets) {
    expect(decodedReceiptQaUrl, `${viewportName}:receipt QA URL must not contain raw secret ${secret}`).not.toContain(secret)
  }
  await expect(receiptActionRail.getByRole('button', { name: '查看候选审计' })).toHaveAttribute('data-sl-target-url', new RegExp(`/audit-logs\\?.*resourceId=8801`))
  await assertCandidateReceiptReadability(page, repairDetail, viewportName)
  const redactionProof = await assertAutoRepairCandidateRedaction(page, repairDetail, `${viewportName}:candidate-receipt-redaction`)
  await expectNoHorizontalOverflow(page, `${viewportName}:report-autorepair-candidate`)
  return redactionProof
}

test('Report risk evidence opens AutoRepair candidate and preserves create payload binding', async ({ page }) => {
  const network = await installReportAutoRepairCandidateMocks(page)
  const issues = installRuntimeGuards(page)
  const baseURLHost = new URL(test.info().project.use.baseURL || 'http://127.0.0.1').hostname || '127.0.0.1'
  const candidateReceiptRedactionProofs: Array<Awaited<ReturnType<typeof assertAutoRepairCandidateRedaction>>> = []

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    candidateReceiptRedactionProofs.push(await submitReportAutoRepairCandidate(page, viewport.name))
  }

  expect(network.createRequests, 'Each viewport should submit exactly one AutoRepair candidate.').toHaveLength(viewportMatrix.length)
  for (const request of network.createRequests) {
    expect(request.endpoint).toBe(`/api/projects/${projectId}/auto-repairs`)
    expect(request.payload.repositoryId).toBe(repositoryId)
    expect(request.payload.scanTaskId).toBe(scanTaskId)
    expect(request.payload.filePath).toBe(targetFile)
    expect(request.payload.targetDesc || '').toContain(`扫描报告 #${scanTaskId}`)
    expect(request.payload.targetDesc || '').toMatch(/Controller boundary|Chat endpoint/)
    expect(request.payload.targetDesc || '').toContain(autoRepairCandidateSafeMarker)
    expect(request.payload.targetDesc || '').toContain('[REDACTED]')
    for (const secret of forbiddenAutoRepairSecretSnippets) {
      expect(request.payload.targetDesc || '', `create payload targetDesc must not contain raw secret ${secret}`).not.toContain(secret)
    }
    expect(request.payload.provenance?.sourceType).toBe('SCAN_REPORT_RISK')
    expect(request.payload.provenance?.scanTaskId).toBe(scanTaskId)
    expect(request.payload.provenance?.filePath).toBe(targetFile)
    expect(request.payload.provenance?.riskCategory).toBe('Controller boundary')
    expect(request.payload.provenance?.riskSeverity).toBe('HIGH')
    expect(request.payload.provenance?.lineNumber).toBe(27)
  }
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in report AutoRepair candidate smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const markerPayload = {
    projectId,
    repositoryId,
    scanTaskId,
    targetFile,
    createEndpoint: `/api/projects/${projectId}/auto-repairs`,
    createRequestCount: network.createRequests.length,
    createPayloadBound: network.createRequests.every(request =>
      request.payload.repositoryId === repositoryId
      && request.payload.scanTaskId === scanTaskId
      && request.payload.filePath === targetFile
      && (request.payload.targetDesc || '').includes(`扫描报告 #${scanTaskId}`)
    ),
    provenancePayloadBound: network.createRequests.every(request =>
      request.payload.provenance?.sourceType === 'SCAN_REPORT_RISK'
      && request.payload.provenance?.scanTaskId === scanTaskId
      && request.payload.provenance?.filePath === targetFile
      && request.payload.provenance?.riskCategory === 'Controller boundary'
      && request.payload.provenance?.riskSeverity === 'HIGH'
      && request.payload.provenance?.lineNumber === 27
    ),
    candidateReceipt: {
      visible: true,
      auditAction: 'AUTO_REPAIR_CANDIDATE_CREATED',
      sourceTypeBound: true,
      riskKeyBound: true,
      riskSeverityBound: true,
      actionRailVisible: true,
      reportDeepLinkBound: true,
      qaDeepLinkBound: true,
      auditDeepLinkBound: true,
      noRawPromptOrAnswer: true,
    },
    candidateReceiptRedaction: {
      scope: 'AUTOREPAIR_CANDIDATE_PROVENANCE_RECEIPT_DISPLAY_REDACTION_ONLY',
      surface: 'AUTOREPAIR_SOURCE_BRIDGE_CANDIDATE_PROVENANCE_RECEIPT',
      fixtureHasBearerSecret: true,
      fixtureHasApiKeySecret: true,
      fixtureHasPasswordSecret: true,
      fixtureHasQuotedSecret: true,
      fixtureHasJwtSecret: true,
      uiRawSecretsHidden: candidateReceiptRedactionProofs.every(proof => proof.uiRawSecretsHidden),
      urlRawSecretsHidden: candidateReceiptRedactionProofs.every(proof => proof.urlRawSecretsHidden),
      bodyRawSecretsHidden: candidateReceiptRedactionProofs.every(proof => proof.bodyRawSecretsHidden),
      redactionVisible: candidateReceiptRedactionProofs.every(proof => proof.redactionVisible),
      safeMarkerVisible: candidateReceiptRedactionProofs.every(proof => proof.safeMarkerVisible),
      markerContainsRawSecret: false,
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
    sourceScanVisible: true,
    mockedApiOnly: true,
    unhandledApiRequests: network.unhandledApiRequests.length,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    baseURLHost,
    spec: 'report-autorepair-candidate-smoke.spec.ts',
  }
  const markerText = JSON.stringify(markerPayload)
  for (const secret of forbiddenAutoRepairSecretSnippets) {
    expect(markerText, `REPORT_AUTOREPAIR_CANDIDATE marker must not contain raw secret: ${secret}`).not.toContain(secret)
  }
  console.log('REPORT_AUTOREPAIR_CANDIDATE_UI_SMOKE_OK', markerText)
})
