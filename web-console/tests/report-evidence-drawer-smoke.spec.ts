import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

const projectId = 1
const repositoryId = 11
const scanTaskId = 501
const executionTaskId = 701
const reportArtifactId = 301
const targetFile = 'src/main/java/demo/report/evidence/readability/ChatControllerWithVeryLongBoundaryEvidencePath.java'
const gapEvidenceFile = 'src/main/java/demo/report/evidence/readability/MissingBoundaryEvidenceWithVeryLongPath.java'
const longApiRoutePath = '/api/chat/evidence/readability/with/a/very/long/controller-boundary/route/that/must-wrap-inside-the-report-table'
const longApiControllerName = 'demo.report.evidence.readability.ChatControllerWithVeryLongBoundaryEvidencePath'
const longDbEntityFile = 'src/main/java/demo/report/evidence/readability/domain/ChatMessageEntityWithVeryLongPersistenceEvidencePath.java'
const longGovernanceEventTitle = 'AutoRepair candidate receipt with long report evidence boundary and governance gate context'
const longGovernanceEventDetail = 'Candidate receipt binds report risk, QA citation readiness, code_chunks evidence and scan-scoped audit trail into one governance event that must remain readable on narrow report screens.'
const longGovernanceGateReason = 'PRIMARY evidence is ready, but PR creation remains gated until human review confirms the long controller boundary and artifact provenance.'
const evidenceTitle = 'Controller boundary'
const evidenceCategory = '质量风险'
const evidenceSource = 'ARCHITECTURE_REPORT / RISK_REPORT'
const reportEvidenceSafeMarker = 'REPORT_EVIDENCE_SAFE_MARKER'
const reportEvidenceRawBearerSecret = 'sl-report-evidence-bearer-secret-raw'
const reportEvidenceRawApiKeySecret = 'sk-reportevidencesecretshouldnotrender123456789'
const reportEvidenceRawPasswordSecret = 'report-evidence-password-raw'
const reportEvidenceRawJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJyZXBvcnRFdmlkZW5jZSI6InJhdyJ9.reportEvidenceRawSecret'
const forbiddenReportEvidenceSecretSnippets = [
  reportEvidenceRawBearerSecret,
  reportEvidenceRawApiKeySecret,
  reportEvidenceRawPasswordSecret,
  reportEvidenceRawJwtSecret,
]
const evidenceSummary = [
  'Chat endpoint mixes validation and orchestration logic; the report evidence drawer must keep the long source path, handoff summary, citation readiness and next action rail readable on mobile viewports.',
  reportEvidenceSafeMarker,
  `Authorization: Bearer ${reportEvidenceRawBearerSecret}`,
  `apiKey=${reportEvidenceRawApiKeySecret}`,
  `password=${reportEvidenceRawPasswordSecret}`,
  `jwt=${reportEvidenceRawJwtSecret}`,
].join(' ')
const evidenceStartLine = 24
const evidenceEndLine = 42
const evidenceLineRange = `${evidenceStartLine}-${evidenceEndLine}`
const codeChunkRawSecretSentinel = 'SL_CODE_CHUNK_RAW_SECRET_SHOULD_NOT_RENDER'
const codeChunkBearerSecret = 'sl-code-chunk-bearer-secret-raw'
const codeChunkApiKeySecret = 'sk-codechunkrawsecret1234567890'
const codeChunkJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJzbF9jb2RlX2NodW5rIjoicmF3In0.signatureRawSecret123'
const forbiddenCodeChunkSecretSnippets = [
  codeChunkRawSecretSentinel,
  codeChunkBearerSecret,
  codeChunkApiKeySecret,
  codeChunkJwtSecret,
]
const artifactFallbackSafeMarker = 'ARTIFACT_FALLBACK_SAFE_MARKER'
const artifactFallbackBearerSecret = 'sl-artifact-fallback-bearer-secret-raw'
const artifactFallbackApiKeySecret = 'sk-artifactfallbacksecretshouldnotrender123456789'
const artifactFallbackQuotedSecret = 'quoted artifact fallback secret should not render'
const artifactFallbackPasswordSecret = 'artifact-fallback-password-raw'
const artifactFallbackPlainApiKeySecret = 'sk-artifactfallbackplaintextsecret123456789'
const artifactFallbackJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJhcnRpZmFjdEZhbGxiYWNrIjoicmF3In0.artifactFallbackRawSecret'
const forbiddenArtifactFallbackSecretSnippets = [
  artifactFallbackBearerSecret,
  artifactFallbackApiKeySecret,
  artifactFallbackQuotedSecret,
  artifactFallbackPasswordSecret,
  artifactFallbackPlainApiKeySecret,
  artifactFallbackJwtSecret,
]
const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

type RuntimeIssue = {
  type: string
  message: string
}

const project = {
  id: projectId,
  name: 'Report Evidence Drawer Smoke',
  description: 'Mocked project for report evidence drawer smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 92,
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
        message: evidenceSummary,
        file_path: targetFile,
        start_line: evidenceStartLine,
        end_line: evidenceEndLine,
        impact: `请求边界和服务职责不清晰 ${reportEvidenceSafeMarker} Authorization: Bearer ${reportEvidenceRawBearerSecret}`,
        suggestion: `Move orchestration into ChatService and keep controller thin. apiKey=${reportEvidenceRawApiKeySecret}`,
      },
      {
        severity: 'MEDIUM',
        category: 'Missing code evidence',
        message: 'Report references a boundary file that is not available in code_chunks.',
        file_path: gapEvidenceFile,
        line_number: 99,
        impact: '报告结论暂时缺少可复核代码证据',
        suggestion: 'Re-run scan or use QA to localize the nearest repairable file.',
      },
    ],
  },
  technicalDebt: [],
  suggestions: ['拆分 Controller 职责并补充边界测试'],
  apiRoutes: [
    {
      method: 'POST',
      path: longApiRoutePath,
      handler_class: longApiControllerName,
      handler_method: 'chat',
      start_line: evidenceStartLine,
      end_line: evidenceEndLine,
      file_path: targetFile,
    },
  ],
  dbEntities: [
    {
      class_name: 'ChatMessage',
      table_name: 'chat_message',
      field_count: 8,
      file_path: longDbEntityFile,
    },
  ],
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
    reportCitationQuality: {
      status: 'OK',
      artifactType: 'ARCHITECTURE_REPORT',
      scanTaskId,
      requiredCheckCount: 6,
      boundCheckCount: 6,
      evidenceCheckKeys: ['api_data_surface', 'fingerprint', 'module_map', 'risk_signal', 'scan_scope', 'test_signal'],
      sectionBindings: [
        { key: 'scan_scope', sourceSection: 'overview', status: 'READY' },
        { key: 'test_signal', sourceSection: 'overview', status: 'READY' },
        { key: 'module_map', sourceSection: 'modules', status: 'READY' },
        { key: 'api_data_surface', sourceSection: 'apiRoutes/dbEntities', status: 'READY' },
        { key: 'fingerprint', sourceSection: 'scanFingerprint', status: 'READY' },
        { key: 'risk_signal', sourceSection: 'codeQuality.risks', status: 'RISK' },
      ],
      overviewBound: true,
      moduleMapBound: true,
      apiDataSurfaceBound: true,
      fingerprintBound: true,
      riskSignalBound: true,
      nextActionsBound: true,
      narrativeBindingStatus: 'ALL_BOUND',
      requiredNarrativeBindingCount: 6,
      narrativeBindingCount: 6,
      narrativeBindings: [
        { key: 'summary_risk_posture', sourceSection: 'reportQuality.summary/codeQuality.risks', sourceMetric: 'highRiskCount', reportedCount: 1, actualCount: 1, status: 'BOUND' },
        { key: 'high_risk_count', sourceSection: 'codeQuality.risks', sourceMetric: 'severity=HIGH', reportedCount: 1, actualCount: 1, status: 'BOUND' },
        { key: 'medium_risk_count', sourceSection: 'codeQuality.risks', sourceMetric: 'severity=MEDIUM', reportedCount: 1, actualCount: 1, status: 'BOUND' },
        { key: 'technical_debt_count', sourceSection: 'technicalDebt', sourceMetric: 'array.length', reportedCount: 0, actualCount: 0, status: 'BOUND' },
        { key: 'suggestion_count', sourceSection: 'suggestions', sourceMetric: 'array.length', reportedCount: 1, actualCount: 1, status: 'BOUND' },
        { key: 'next_actions_risk_priority', sourceSection: 'reportQuality.nextActions/codeQuality.risks', sourceMetric: 'risk-priority-action', reportedCount: 1, actualCount: 1, status: 'BOUND' },
      ],
      noRawPromptOrAnswer: true,
      providerQualityClaim: false,
      llmFactClaim: false,
    },
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
  {
    id: 302,
    projectId,
    repositoryId,
    ownerType: 'SCAN_TASK',
    ownerId: scanTaskId,
    artifactType: 'DEPENDENCY_GRAPH',
    contentType: 'application/json',
    sizeBytes: 2048,
    checksumSha256: 'graph-checksum',
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-06-30T10:02:00Z',
  },
  {
    id: 303,
    projectId,
    repositoryId,
    ownerType: 'SCAN_TASK',
    ownerId: scanTaskId,
    artifactType: 'CODE_METRICS',
    contentType: 'application/json',
    sizeBytes: 1024,
    checksumSha256: 'metrics-checksum',
    metadataJson: null,
    createdBy: 1,
    createdAt: '2026-06-30T10:02:00Z',
  },
  {
    id: 304,
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
  events: [
    {
      id: 'governance-long-candidate-receipt',
      eventType: 'AUTO_REPAIR_CANDIDATE_RECEIPT',
      title: longGovernanceEventTitle,
      detail: longGovernanceEventDetail,
      status: 'SUCCESS',
      tone: 'WARNING',
      occurredAt: '2026-06-30T10:03:00Z',
      resource: { type: 'AUTO_REPAIR', id: 8801, projectId, repositoryId, scanTaskId },
      source: { type: 'SCAN_TASK', id: scanTaskId, projectId, repositoryId, scanTaskId },
      attribution: {
        mode: 'REPORT_EVIDENCE',
        confidence: 'HIGH',
        reason: 'scan-bound report evidence source',
      },
      errorMessage: null,
      actionTarget: { type: 'AUTO_REPAIR', id: 8801, url: `/auto-repairs/${8801}` },
      repairEvidenceGate: 'READY',
      repairEvidenceGateReason: longGovernanceGateReason,
      repairEvidenceGateSource: 'PROJECT_QA_VERIFIED_CITATION',
    },
  ],
  limits: {},
  truncated: false,
  warnings: [],
  attributionGaps: [],
}

const drawerChunks = [
  {
    id: 9001,
    scanTaskId,
    filePath: targetFile,
    startLine: 24,
    endLine: 42,
    content: `class ChatController { Response chat(Request request) { String token = "${codeChunkRawSecretSentinel}"; return chatService.chat(request); } }`,
    contentPreview: 'class ChatController {\n  Response chat(Request request) {\n    return chatService.chat(request);\n  }\n}',
    hasEmbedding: true,
    matchedTerms: ['ChatController', 'chat', 'validation', 'orchestration'],
    relevanceScore: 91,
    evidenceType: 'CONTROLLER',
    evidenceReason: 'Controller handler matches the reported endpoint and risk file.',
    contextRole: 'PRIMARY',
    contextDistance: 0,
  },
  {
    id: 9002,
    scanTaskId,
    filePath: 'src/main/java/demo/service/ChatService.java',
    startLine: 12,
    endLine: 32,
    content: `class ChatService { ChatResponse chat(ChatRequest request) { String authorization = "Bearer ${codeChunkBearerSecret}"; return model.ask(request); } }`,
    contentPreview: `class ChatService {
  ChatResponse chat(ChatRequest request) {
    String authorization = "Bearer ${codeChunkBearerSecret}";
    String apiKey = "${codeChunkApiKeySecret}";
    String jwt = "${codeChunkJwtSecret}";
    return model.ask(request);
  }
}`,
    hasEmbedding: false,
    matchedTerms: ['ChatService', 'chat', 'orchestration'],
    relevanceScore: 58,
    evidenceType: 'SERVICE',
    evidenceReason: 'Adjacent service context explains where orchestration should move. Graph relation: ChatController CALLS ChatService.',
    contextRole: 'ADJACENT_CONTEXT',
    contextDistance: 1,
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
  await locator.scrollIntoViewIfNeeded()
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

async function assertReportEvidenceDrawerReadability(page: Page, drawer: Locator, viewportName: string, expectedFile: string) {
  await expectContainedInViewport(drawer, `${viewportName}:report-evidence-drawer-content`)
  await expectLocatorTextNotClipped(drawer.locator('.sl-report-evidence-drawer-signal strong').first(), `${viewportName}:drawer-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(drawer.locator('.sl-report-evidence-drawer-signal p').first(), `${viewportName}:drawer-summary`, { mustWrap: true })
  await expectLocatorTextNotClipped(drawer.getByText(expectedFile).first(), `${viewportName}:drawer-target-file`, { mustWrap: true })

  const chunkRegion = drawer.getByRole('region', { name: 'code_chunks 命中摘要' })
  await expectContainedInViewport(chunkRegion, `${viewportName}:drawer-code-chunks`)
  const chunkCard = chunkRegion.locator('.sl-report-evidence-chunk-card').first()
  if (await chunkCard.count()) {
    await expectLocatorTextNotClipped(chunkCard.locator('.sl-report-evidence-chunk-meta strong').first(), `${viewportName}:drawer-chunk-file`, { mustWrap: true })
    await expectLocatorTextNotClipped(chunkCard.locator('p').first(), `${viewportName}:drawer-chunk-reason`, { mustWrap: true })
  }

  const readiness = drawer.getByRole('region', { name: '引用质量预检' })
  await expectContainedInViewport(readiness, `${viewportName}:drawer-citation-readiness`)
  await expectLocatorTextNotClipped(readiness.locator('.sl-report-citation-readiness-head strong').first(), `${viewportName}:drawer-readiness-title`, { mustWrap: true })

  const decisionSummary = drawer.getByRole('region', { name: '报告证据决策摘要' })
  await expectContainedInViewport(decisionSummary, `${viewportName}:drawer-decision-summary`)
  const decisionItems = decisionSummary.locator('.sl-report-evidence-decision-item')
  await expect(decisionItems, `${viewportName}:drawer-decision-item-count`).toHaveCount(3)
  for (const [index, key] of ['citation', 'code-chunks', 'repair'].entries()) {
    const item = decisionItems.nth(index)
    await expectLocatorTextNotClipped(item.locator('span').first(), `${viewportName}:drawer-decision-${key}-label`)
    await expectLocatorTextNotClipped(item.locator('strong').first(), `${viewportName}:drawer-decision-${key}-value`, { mustWrap: true })
    await expectLocatorTextNotClipped(item.locator('small').first(), `${viewportName}:drawer-decision-${key}-detail`, { mustWrap: true })
  }

  const handoffSummary = drawer.getByRole('region', { name: '报告证据交接包' })
  await expectContainedInViewport(handoffSummary, `${viewportName}:drawer-handoff-summary`)
  await expectLocatorTextNotClipped(handoffSummary.locator('.sl-report-evidence-handoff-copy strong').first(), `${viewportName}:drawer-handoff-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(handoffSummary.getByText(expectedFile).first(), `${viewportName}:drawer-handoff-target-file`, { mustWrap: true })

  const actionRail = drawer.getByRole('region', { name: '报告证据下一步动作' })
  await expectContainedInViewport(actionRail, `${viewportName}:drawer-action-rail`)
  await expectLocatorTextNotClipped(actionRail.locator('.sl-report-evidence-action-rail-copy strong').first(), `${viewportName}:drawer-action-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(actionRail.locator('.sl-report-evidence-action-rail-copy p').first(), `${viewportName}:drawer-action-copy`, { mustWrap: true })
  await expectLocatorTextNotClipped(actionRail.getByRole('button', { name: '基于此证据追问' }), `${viewportName}:drawer-qa-button`)
  await expectLocatorTextNotClipped(actionRail.getByRole('button', { name: '复制证据引用' }), `${viewportName}:drawer-copy-button`)
  const repairButton = actionRail.getByRole('button', { name: /生成修复候选|定位修复文件/ })
  await expectLocatorTextNotClipped(repairButton, `${viewportName}:drawer-repair-button`)
  const repairGate = actionRail.getByLabel('报告证据修复门禁说明')
  await expect(repairGate, `${viewportName}:drawer-repair-gate`).toBeVisible()
  await expectLocatorTextNotClipped(repairGate.locator('span').first(), `${viewportName}:drawer-repair-gate-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(repairGate.locator('strong').first(), `${viewportName}:drawer-repair-gate-detail`, { mustWrap: true })
  await expectNoHorizontalOverflow(page, `${viewportName}:report-evidence-drawer-readable`)
}

async function assertPriorityRailAndOpenFirstEvidence(page: Page, viewportName: string) {
  const priorityRail = page.getByLabel('报告证据优先阅读')
  await expectContainedInViewport(priorityRail, `${viewportName}:report-priority-rail`)
  await expect(priorityRail.getByText('先看这 3 个证据入口')).toBeVisible()

  const riskCard = priorityRail.locator('[data-priority-key="risk-evidence"]')
  const citationCard = priorityRail.locator('[data-priority-key="citation-readiness"]')
  const governanceCard = priorityRail.locator('[data-priority-key="governance-blocker"]')
  await expect(riskCard).toBeVisible()
  await expect(citationCard).toBeVisible()
  await expect(governanceCard).toBeVisible()
  await expectLocatorTextNotClipped(riskCard.locator('strong').first(), `${viewportName}:priority-risk-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(riskCard.locator('p').first(), `${viewportName}:priority-risk-summary`, { mustWrap: true })
  await expectLocatorTextNotClipped(riskCard.locator('.sl-report-priority-meta').first(), `${viewportName}:priority-risk-meta`, { mustWrap: true })
  await expect(riskCard.getByText('可进入修复候选')).toBeVisible()
  const riskRepairGate = riskCard.getByLabel('首要风险证据 修复门禁说明')
  const citationRepairGate = citationCard.getByLabel('引用预检 修复门禁说明')
  const governanceRepairGate = governanceCard.getByLabel('治理闭环 修复门禁说明')
  await expect(riskRepairGate.getByText('修复门禁已开放')).toBeVisible()
  await expect(riskRepairGate.getByText('文件级风险已绑定到当前扫描证据，可进入受控修复候选；仍需先复核引用和审计链路。')).toBeVisible()
  await expect(citationCard.getByRole('button', { name: '打开代码问答' })).toBeVisible()
  await expect(citationCard.getByText('不直接生成修复', { exact: true })).toBeVisible()
  await expect(governanceCard.getByText('不直接生成修复', { exact: true })).toBeVisible()
  await expect(citationRepairGate.getByText('修复门禁未开放')).toBeVisible()
  await expect(citationRepairGate.getByText('引用预检只证明 QA citation 和 code_chunks 状态，不等同于文件级修复证据；不直接生成修复候选。')).toBeVisible()
  await expect(governanceRepairGate.getByText('修复门禁未开放')).toBeVisible()
  await expect(governanceRepairGate.getByText('治理闭环用于复核修复事件和审计责任链，不替代文件级风险证据。')).toBeVisible()
  await expectAllLocatorTextNotClipped(priorityRail.locator('.sl-report-priority-repair-gate span'), `${viewportName}:priority-repair-gate-title`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(priorityRail.locator('.sl-report-priority-repair-gate strong'), `${viewportName}:priority-repair-gate-detail`, { mustWrap: true })
  await expectNoHorizontalOverflow(page, `${viewportName}:report-priority-rail`)

  await riskCard.getByRole('button', { name: '查看证据' }).click()
  const drawer = page.getByRole('dialog', { name: '报告证据抽屉' })
  await expect(drawer).toBeVisible()
  return {
    viewportName,
    visible: true,
    firstEvidenceOpensDrawer: true,
    readyActionVisible: await citationCard.getByRole('button', { name: '打开代码问答' }).isVisible(),
    repairActionVisibleOnlyForFileBoundRisk: await riskCard.getByText('可进入修复候选').isVisible(),
    nonRepairActionsMarked: await citationCard.getByText('不直接生成修复', { exact: true }).isVisible()
      && await governanceCard.getByText('不直接生成修复', { exact: true }).isVisible(),
    repairGateReadyVisible: await riskRepairGate.getByText('修复门禁已开放').isVisible(),
    repairGateBlockedVisible: await citationRepairGate.getByText('修复门禁未开放').isVisible()
      && await governanceRepairGate.getByText('修复门禁未开放').isVisible(),
    repairGateReasonVisible: await riskRepairGate.getByText('文件级风险已绑定到当前扫描证据，可进入受控修复候选；仍需先复核引用和审计链路。').isVisible()
      && await citationRepairGate.getByText('引用预检只证明 QA citation 和 code_chunks 状态，不等同于文件级修复证据；不直接生成修复候选。').isVisible()
      && await governanceRepairGate.getByText('治理闭环用于复核修复事件和审计责任链，不替代文件级风险证据。').isVisible(),
    noHorizontalOverflow: true,
  }
}

async function assertReportEvidenceProfileAndTraceMapReadability(page: Page, viewportName: string) {
  const profile = page.locator('.sl-report-evidence-profile').first()
  await expectContainedInViewport(profile, `${viewportName}:report-evidence-profile`)
  await expect(profile.getByText('证据契约')).toBeVisible()
  await expectLocatorTextNotClipped(profile.locator('.sl-report-evidence-head h3'), `${viewportName}:report-evidence-profile-summary`, { mustWrap: true })

  const profileItems = profile.locator('.sl-report-evidence-item')
  await expect(profileItems, `${viewportName}:report-evidence-profile-item-count`).toHaveCount(6)
  await expectAllLocatorTextNotClipped(profileItems.locator('span'), `${viewportName}:report-evidence-profile-labels`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(profileItems.locator('strong'), `${viewportName}:report-evidence-profile-values`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(profileItems.locator('p'), `${viewportName}:report-evidence-profile-details`, { mustWrap: true })

  const traceMap = page.getByRole('region', { name: '报告证据追踪' })
  await expectContainedInViewport(traceMap, `${viewportName}:report-trace-map`)
  await expect(traceMap.getByText('报告章节追踪')).toBeVisible()
  const traceCards = traceMap.locator('.sl-report-trace-card')
  await expect(traceCards, `${viewportName}:report-trace-card-count`).toHaveCount(5)
  const traceGateLabels = ['质量风险', 'API 表面', '数据模型', '依赖图谱', '产物证据']
  await expectAllLocatorTextNotClipped(traceCards.locator('.sl-report-trace-card-head span'), `${viewportName}:report-trace-card-labels`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(traceCards.locator('.sl-report-trace-card-head strong'), `${viewportName}:report-trace-card-values`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(traceCards.locator('.sl-report-trace-source'), `${viewportName}:report-trace-card-sources`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(traceCards.locator('p'), `${viewportName}:report-trace-card-details`, { mustWrap: true })
  const traceGates = traceCards.locator('.sl-report-trace-gate')
  await expect(traceGates, `${viewportName}:report-trace-gate-count`).toHaveCount(5)

  const traceGateProofs: Array<{
    label: string
    visible: boolean
    reasonVisible: boolean
    styleSafe: boolean
    buttonCount: number
  }> = []
  for (let index = 0; index < traceGateLabels.length; index += 1) {
    const label = traceGateLabels[index]
    const card = traceCards.nth(index)
    const gate = card.getByLabel(`${label} 追踪动作门禁说明`)
    await expect(gate, `${viewportName}:${label}:trace-gate`).toBeVisible()
    await expect(gate.getByText(/追踪动作门禁已开放|追踪动作门禁未开放/), `${viewportName}:${label}:trace-gate-title`).toBeVisible()
    await expect(gate.locator('strong'), `${viewportName}:${label}:trace-gate-reason`).toBeVisible()
    await expectLocatorTextNotClipped(gate.locator('span'), `${viewportName}:${label}:trace-gate-title-wrap`, { mustWrap: true })
    await expectLocatorTextNotClipped(gate.locator('strong'), `${viewportName}:${label}:trace-gate-detail-wrap`, { mustWrap: true })
    const traceGateStyles = await gate.locator('strong').evaluate(node => {
      const styles = window.getComputedStyle(node)
      return {
        overflow: styles.overflow,
        overflowWrap: styles.overflowWrap,
        textOverflow: styles.textOverflow,
        whiteSpace: styles.whiteSpace,
      }
    })
    expect(traceGateStyles.overflow).toBe('visible')
    expect(traceGateStyles.overflowWrap).toBe('anywhere')
    expect(traceGateStyles.textOverflow).toBe('clip')
    expect(traceGateStyles.whiteSpace).toBe('normal')
    const buttons = card.getByRole('button')
    await expect(buttons, `${viewportName}:${label}:trace-card-action-count`).toHaveCount(4)
    await expect(card.getByRole('button', { name: '查看证据' })).toBeVisible()
    await expect(card.getByRole('button', { name: '追问代码' })).toBeVisible()
    await expect(card.getByRole('button', { name: '复制问答链接' })).toBeVisible()
    traceGateProofs.push({
      label,
      visible: await gate.isVisible(),
      reasonVisible: await gate.locator('strong').isVisible(),
      styleSafe: true,
      buttonCount: await buttons.count(),
    })
  }
  const traceGateReasonTexts = await traceGates.locator('strong').evaluateAll(nodes => nodes.map(node => (node.textContent || '').trim()))
  expect(traceGateReasonTexts.join(' ')).toMatch(/当前扫描|当前扫描产物|依赖图谱|核心风险报告/)
  await expectAllLocatorTextNotClipped(traceGates.locator('span'), `${viewportName}:report-trace-gate-title`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(traceGates.locator('strong'), `${viewportName}:report-trace-gate-detail`, { mustWrap: true })
  await expectNoHorizontalOverflow(page, `${viewportName}:report-evidence-profile-and-trace-map`)

  return {
    viewportName,
    profileVisible: await profile.isVisible(),
    profileItemCount: await profileItems.count(),
    traceVisible: await traceMap.isVisible(),
    traceCardCount: await traceCards.count(),
    traceGateCount: await traceGates.count(),
    traceGateProofs,
    traceGateVisible: traceGateProofs.every(proof => proof.visible),
    traceGateReasonVisible: traceGateProofs.every(proof => proof.reasonVisible),
    traceGateReasonStyleSafe: traceGateProofs.every(proof => proof.styleSafe),
    traceCardMinButtonCount: Math.min(...traceGateProofs.map(proof => proof.buttonCount)),
    textNotClipped: true,
    noHorizontalOverflow: true,
  }
}

async function assertReportApiDbTableReadability(page: Page, viewportName: string) {
  await page.getByRole('tab', { name: /API/ }).click()
  const apiPath = page.locator('.sl-report-api-path-cell .sl-report-table-evidence-text').filter({ hasText: longApiRoutePath }).first()
  const apiController = page.locator('.sl-report-api-controller-cell .sl-report-table-evidence-text').filter({ hasText: longApiControllerName }).first()
  await expectLocatorTextNotClipped(apiPath, `${viewportName}:report-api-route-path`, { mustWrap: true })
  await expectLocatorTextNotClipped(apiController, `${viewportName}:report-api-controller`, { mustWrap: true })
  await expect(page.getByRole('button', { name: '查看证据' }).first()).toBeVisible()
  const apiPathVisible = await apiPath.isVisible()
  const apiControllerVisible = await apiController.isVisible()
  await expectNoHorizontalOverflow(page, `${viewportName}:report-api-table-readability`)

  await page.getByRole('tab', { name: /数据库/ }).click()
  const dbFile = page.locator('.sl-report-db-file-cell .sl-report-table-evidence-text').filter({ hasText: longDbEntityFile }).first()
  await expectLocatorTextNotClipped(dbFile, `${viewportName}:report-db-file`, { mustWrap: true })
  await expect(page.getByRole('button', { name: '查看证据' }).first()).toBeVisible()
  const dbFileVisible = await dbFile.isVisible()
  await expectNoHorizontalOverflow(page, `${viewportName}:report-db-table-readability`)

  await page.getByRole('tab', { name: /报告总览/ }).click()
  await expect(page.getByRole('region', { name: '报告引用质量' })).toBeVisible()

  return {
    viewportName,
    apiPathVisible,
    apiControllerVisible,
    dbFileVisible,
    textNotClipped: true,
    noHorizontalOverflow: true,
  }
}

async function assertReportGovernanceTimelineReadability(page: Page, viewportName: string) {
  const governance = page.getByRole('region', { name: '修复治理时间线' })
  await expectContainedInViewport(governance, `${viewportName}:report-governance-timeline`)
  await expect(governance.getByText('修复治理时间线')).toBeVisible()
  await expectLocatorTextNotClipped(governance.locator('.sl-report-governance-head h3'), `${viewportName}:report-governance-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(governance.locator('.sl-report-governance-head p'), `${viewportName}:report-governance-summary`, { mustWrap: true })

  const cards = governance.locator('.sl-report-governance-card')
  await expect(cards, `${viewportName}:report-governance-card-count`).toHaveCount(6)
  await expectAllLocatorTextNotClipped(cards.locator('span'), `${viewportName}:report-governance-card-labels`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(cards.locator('strong'), `${viewportName}:report-governance-card-values`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(cards.locator('p'), `${viewportName}:report-governance-card-details`, { mustWrap: true })

  const stageRail = governance.getByLabel('修复治理阶段轨道')
  await expectContainedInViewport(stageRail, `${viewportName}:report-governance-stage-rail`)
  const stages = stageRail.locator('.sl-report-governance-stage')
  await expect(stages, `${viewportName}:report-governance-stage-count`).toHaveCount(5)
  await expectAllLocatorTextNotClipped(stages.locator('.sl-report-governance-stage-meta span'), `${viewportName}:report-governance-stage-labels`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(stages.locator('.sl-report-governance-stage-copy p'), `${viewportName}:report-governance-stage-reasons`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(stages.locator('.ant-btn'), `${viewportName}:report-governance-stage-actions`)

  const event = governance.locator('.sl-report-governance-event').filter({ hasText: longGovernanceEventTitle }).first()
  await expectContainedInViewport(event, `${viewportName}:report-governance-event`)
  await expectLocatorTextNotClipped(event.locator('.sl-report-governance-event-meta').first(), `${viewportName}:report-governance-event-meta`, { mustWrap: true })
  await expectLocatorTextNotClipped(event.locator('strong').filter({ hasText: longGovernanceEventTitle }).first(), `${viewportName}:report-governance-event-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(event.locator('p').filter({ hasText: longGovernanceEventDetail }).first(), `${viewportName}:report-governance-event-detail`, { mustWrap: true })
  await expectLocatorTextNotClipped(event.locator('.sl-report-governance-event-reason').filter({ hasText: longGovernanceGateReason }).first(), `${viewportName}:report-governance-event-gate-reason`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(event.locator('.sl-report-governance-event-action .ant-btn'), `${viewportName}:report-governance-event-actions`)
  await expectNoHorizontalOverflow(page, `${viewportName}:report-governance-timeline`)

  return {
    viewportName,
    visible: await governance.isVisible(),
    cardCount: await cards.count(),
    stageCount: await stages.count(),
    eventVisible: await event.isVisible(),
    gateReasonVisible: await event.locator('.sl-report-governance-event-reason').filter({ hasText: longGovernanceGateReason }).first().isVisible(),
    textNotClipped: true,
    noHorizontalOverflow: true,
  }
}

async function assertReportCitationQualityPanel(page: Page, viewportName: string) {
  const panel = page.getByRole('region', { name: '报告引用质量' })
  await expectContainedInViewport(panel, `${viewportName}:report-citation-quality`)
  await expect(panel.getByText('Report Citation Quality')).toBeVisible()
  await expect(panel.getByText('报告引用链已绑定扫描产物')).toBeVisible()
  await expect(panel.getByText('Citation quality', { exact: true })).toBeVisible()
  await expect(panel.getByText('Source diversity', { exact: true })).toBeVisible()
  await expect(panel.getByText('Narrative binding', { exact: true }).first()).toBeVisible()
  await expect(panel.getByText('6/6').first()).toBeVisible()
  const sourceCoverage = panel.getByRole('group', { name: '报告引用来源覆盖' })
  await expect(sourceCoverage).toBeVisible()
  await expect(sourceCoverage.getByText('Source coverage')).toBeVisible()
  await expect(sourceCoverage.getByText('5 sections')).toBeVisible()
  await expect(sourceCoverage.getByText('overview')).toBeVisible()
  await expect(sourceCoverage.getByText('modules')).toBeVisible()
  await expect(sourceCoverage.getByText('apiRoutes/dbEntities')).toBeVisible()
  await expect(sourceCoverage.getByText('scanFingerprint')).toBeVisible()
  await expect(sourceCoverage.getByText('codeQuality.risks')).toBeVisible()
  await expect(sourceCoverage.getByText('API/数据面')).toBeVisible()
  await expect(sourceCoverage.getByText('风险信号')).toBeVisible()
  await expect(sourceCoverage.getByText('模块图')).toBeVisible()
  await expect(sourceCoverage.getByText('扫描范围')).toBeVisible()
  await expect(sourceCoverage.getByText('扫描指纹')).toBeVisible()
  const sourceCoverageTags = await sourceCoverage.locator('.ant-tag').allTextContents()
  expect(sourceCoverageTags).toEqual([
    'overview · 扫描范围',
    'modules · 模块图',
    'apiRoutes/dbEntities · API/数据面',
    'scanFingerprint · 扫描指纹',
    'codeQuality.risks · 风险信号',
  ])
  const verdict = panel.getByRole('group', { name: '报告引用质量裁决依据' })
  await expect(verdict).toBeVisible()
  await expect(verdict.getByText('合同')).toBeVisible()
  await expect(verdict.getByText('结构绑定')).toBeVisible()
  await expect(verdict.getByText('叙事绑定')).toBeVisible()
  await expect(verdict.getByText('边界')).toBeVisible()
  await expect(verdict.getByText('No overclaim')).toBeVisible()
  const details = panel.locator('details.sl-report-citation-quality-details')
  await expect(details).toBeVisible()
  await expect(details.locator('summary')).toContainText('Binding details')
  await expect(details.locator('summary')).toContainText('12 checks')
  const detailInitiallyOpen = await details.evaluate(node => (node as HTMLDetailsElement).open)
  expect(detailInitiallyOpen).toBe(false)
  await details.locator('summary').click()
  await expect(details).toHaveAttribute('open', '')
  await expect(panel.getByText('Section bindings')).toBeVisible()
  await expect(panel.getByText('Narrative binding').last()).toBeVisible()
  const sectionBindings = panel.getByLabel('报告结构证据绑定')
  await expect(sectionBindings.getByText('扫描范围')).toBeVisible()
  await expect(sectionBindings.getByText('风险信号')).toBeVisible()
  await expect(panel.getByText('风险优先动作')).toBeVisible()
  await expect(panel.getByText('只证明报告字段和扫描产物绑定，不证明 LLM 事实正确。')).toBeVisible()
  await expectLocatorTextNotClipped(panel.locator('.sl-report-citation-quality-head h3'), `${viewportName}:report-citation-quality-title`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(panel.locator('.sl-report-citation-quality-metric strong'), `${viewportName}:report-citation-quality-metrics`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(panel.locator('.sl-report-citation-quality-source-coverage strong'), `${viewportName}:report-citation-quality-source-coverage`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(panel.locator('.sl-report-citation-quality-verdict-item strong'), `${viewportName}:report-citation-quality-verdict`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(panel.locator('.sl-report-citation-quality-list strong'), `${viewportName}:report-citation-quality-list-labels`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(panel.locator('.sl-report-citation-quality-list small'), `${viewportName}:report-citation-quality-list-sources`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(panel.locator('.sl-report-citation-quality-footer span'), `${viewportName}:report-citation-quality-footer`, { mustWrap: true })
  await expectNoHorizontalOverflow(page, `${viewportName}:report-citation-quality`)

  return {
    viewportName,
    visible: true,
    citationQuality: '6/6',
    sourceDiversityVisible: true,
    sourceCoverageVisible: await sourceCoverage.isVisible(),
    sourceSectionCount: await sourceCoverage.locator('.ant-tag').count(),
    sourceSections: ['apiRoutes/dbEntities', 'codeQuality.risks', 'modules', 'overview', 'scanFingerprint'],
    sourceSectionLabels: ['API/数据面', '风险信号', '模块图', '扫描范围', '扫描指纹'],
    sourceSectionOrder: sourceCoverageTags.map(tag => tag.split(' · ')[0]),
    sourceSectionLabelOrder: sourceCoverageTags.map(tag => tag.split(' · ')[1]),
    narrativeBinding: '6/6',
    detailToggleVisible: await details.locator('summary').isVisible(),
    detailDefaultCollapsed: !detailInitiallyOpen,
    detailOpens: await details.evaluate(node => (node as HTMLDetailsElement).open),
    verdictVisible: await verdict.isVisible(),
    verdictItems: await verdict.locator('.sl-report-citation-quality-verdict-item').count(),
    verdictBoundary: await verdict.getByText('No overclaim').isVisible(),
    boundaryVisible: true,
    noOverclaim: true,
    noHorizontalOverflow: true,
  }
}

async function assertReportMainPathGuide(page: Page, viewportName: string) {
  const guide = page.getByRole('region', { name: '报告主链路导览' })
  await expectContainedInViewport(guide, `${viewportName}:report-main-path-guide`)
  await expect(guide.getByText('Execution Path')).toBeVisible()
  await expect(guide.getByText('按这个顺序推进报告复核')).toBeVisible()
  await expect(guide.getByText('3 steps')).toBeVisible()

  const steps = guide.locator('[data-main-path-step]')
  await expect(steps).toHaveCount(3)
  await expect(steps.nth(0)).toHaveAttribute('data-main-path-step', 'recommended-action')
  await expect(steps.nth(1)).toHaveAttribute('data-main-path-step', 'citation-quality')
  await expect(steps.nth(2)).toHaveAttribute('data-main-path-step', 'evidence-priority')
  await expect(steps.nth(0).getByText('01', { exact: true })).toBeVisible()
  await expect(steps.nth(1).getByText('02', { exact: true })).toBeVisible()
  await expect(steps.nth(2).getByText('03', { exact: true })).toBeVisible()
  await expect(steps.nth(0).locator('strong')).toHaveText(/检查 code_chunks 生成状态|生成文件级修复候选|优先生成最高风险修复候选|基于报告进入 QA 复核|补齐报告证据包|定位项目级风险/)
  await expect(steps.nth(1).getByText('报告引用链已绑定扫描产物')).toBeVisible()
  await expect(steps.nth(2).getByText('按优先级打开证据入口')).toBeVisible()
  await expect(steps.nth(2).getByText('非文件级证据不直接生成修复')).toBeVisible()
  await expectAllLocatorTextNotClipped(guide.locator('.sl-report-main-path-step strong'), `${viewportName}:report-main-path-step-title`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(guide.locator('.sl-report-main-path-step p'), `${viewportName}:report-main-path-step-detail`, { mustWrap: true })
  await expectNoHorizontalOverflow(page, `${viewportName}:report-main-path-guide`)

  const order = await steps.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.mainPathStep || ''))
  return {
    viewportName,
    visible: await guide.isVisible(),
    stepCount: await steps.count(),
    order,
    labels: ['01', '02', '03'],
    noHorizontalOverflow: true,
  }
}

async function assertReportTrustedLoop(page: Page, viewportName: string) {
  const loop = page.getByRole('region', { name: '扫描报告可信闭环' })
  await expectContainedInViewport(loop, `${viewportName}:report-trusted-loop`)
  await expect(loop.getByRole('heading', { name: '扫描报告可信闭环' })).toBeVisible()
  await expect(loop.getByText('Trusted Report Loop')).toBeVisible()
  const steps = loop.locator('.sl-report-trusted-loop-step')
  await expect(steps, `${viewportName}:report-trusted-loop-step-count`).toHaveCount(5)
  const expectedStepNames = ['报告结论可信度', '证据与引用质量', 'Code Knowledge 可用性', '修复候选入口', '审计与治理留痕']
  for (const stepName of expectedStepNames) {
    await expect(loop.getByText(stepName), `${viewportName}:report-trusted-loop-step:${stepName}`).toBeVisible()
  }
  const gridColumnCount = await loop.locator('.sl-report-trusted-loop-grid').evaluate(element => {
    const columns = getComputedStyle(element).gridTemplateColumns
    if (columns === 'none') return 0
    return columns.split(' ').filter(Boolean).length
  })
  const viewportWidth = page.viewportSize()?.width || 0
  expect(
    gridColumnCount,
    `${viewportName}: report trusted loop must collapse to one column on mobile`
  ).toBe(viewportWidth <= 720 ? 1 : viewportWidth <= 1200 ? 2 : 5)
  await expectAllLocatorTextNotClipped(loop.locator('.sl-report-trusted-loop-title strong'), `${viewportName}:report-trusted-loop-title`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(loop.locator('.sl-report-trusted-loop-copy p'), `${viewportName}:report-trusted-loop-detail`, { mustWrap: true })
  await expectNoHorizontalOverflow(page, `${viewportName}:report-trusted-loop`)
  return {
    viewportName,
    visible: await loop.isVisible(),
    stepCount: await steps.count(),
    expectedStepNames,
    gridColumnCount,
    noHorizontalOverflow: true,
  }
}

async function assertReportRecommendedNextStep(page: Page, viewportName: string) {
  const recommended = page.getByRole('region', { name: '报告推荐下一步' })
  await expectContainedInViewport(recommended, `${viewportName}:report-recommended-next-step`)
  await expect(recommended).toHaveAttribute('data-recommended-step', /recover-failed-scan|watch-running-scan|repair-high-risk-file|locate-project-risk|complete-evidence-bundle|inspect-code-chunks|repair-file-bound-risk|qa-review-ready-report/)
  await expect(recommended.getByText(/Execution Recovery|Execution Watch|File-bound Risk|Risk Localization|Evidence Gap|Code Knowledge Gap|Repair Candidate|Review Ready/)).toBeVisible()
  await expect(recommended.getByRole('button').first()).toBeVisible()

  const gate = recommended.getByLabel('报告推荐动作门禁说明')
  await expect(gate).toBeVisible()
  await expect(gate.getByText(/推荐动作门禁已开放|推荐动作门禁未开放/)).toBeVisible()
  await expect(gate.locator('strong')).toContainText(/失败扫描|扫描未完成|文件级高风险|项目级风险|核心报告产物|code_chunks 不可用|文件级风险证据|报告和 code_chunks/)
  await expectAllLocatorTextNotClipped(gate.locator('span'), `${viewportName}:recommended-step-gate-title`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(gate.locator('strong'), `${viewportName}:recommended-step-gate-detail`, { mustWrap: true })
  const gateStyles = await gate.locator('strong').evaluate(node => {
    const styles = window.getComputedStyle(node)
    return {
      overflow: styles.overflow,
      overflowWrap: styles.overflowWrap,
      textOverflow: styles.textOverflow,
      whiteSpace: styles.whiteSpace,
    }
  })
  expect(gateStyles.overflow).toBe('visible')
  expect(gateStyles.overflowWrap).toBe('anywhere')
  expect(gateStyles.textOverflow).toBe('clip')
  expect(gateStyles.whiteSpace).toBe('normal')
  await expectNoHorizontalOverflow(page, `${viewportName}:report-recommended-next-step`)

  return {
    viewportName,
    visible: await recommended.isVisible(),
    stepKey: await recommended.getAttribute('data-recommended-step'),
    gateVisible: await gate.isVisible(),
    gateReadyVisible: await gate.getByText('推荐动作门禁已开放').isVisible().catch(() => false),
    gateBlockedVisible: await gate.getByText('推荐动作门禁未开放').isVisible().catch(() => false),
    gateReasonVisible: await gate.locator('strong').isVisible(),
    gateReasonStyleSafe: true,
    noHorizontalOverflow: true,
  }
}

async function assertReportActionBoard(page: Page, viewportName: string) {
  const board = page.getByRole('region', { name: '报告后续行动' })
  await expectContainedInViewport(board, `${viewportName}:report-action-board`)
  await expect(board.getByText('Action Routing')).toBeVisible()
  await expect(board.getByText('后续行动分流')).toBeVisible()
  await expect(board.getByText('6 actions')).toBeVisible()

  const cards = board.locator('[data-action-key]')
  await expect(cards).toHaveCount(6)
  const actionKeys = await cards.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.actionKey || ''))
  expect(actionKeys).toEqual([
    'risk-review',
    'code-qa',
    'agent-review',
    'audit-trace',
    'dependency-review',
    'repair-candidate',
  ])
  await expect(board.locator('[data-action-key="code-qa"]').getByRole('button', { name: '进入问答' })).toBeVisible()
  await expect(board.locator('[data-action-key="code-qa"]').getByRole('button', { name: '复制链接' })).toBeVisible()
  await expect(board.locator('[data-action-key="repair-candidate"]').getByRole('button', { name: /生成候选|定位文件|无需修复/ })).toBeVisible()
  await expectAllLocatorTextNotClipped(board.locator('.sl-report-action-head strong'), `${viewportName}:report-action-board-values`, { mustWrap: true })
  await expectLocatorTextNotClipped(board.locator('[data-action-key="code-qa"]').getByRole('button', { name: '复制链接' }), `${viewportName}:report-action-board-copy-link`, { mustWrap: true })
  await expectLocatorTextNotClipped(board.locator('[data-action-key="repair-candidate"]').getByRole('button', { name: /生成候选|定位文件|无需修复/ }), `${viewportName}:report-action-board-repair-action`, { mustWrap: true })
  await expectNoHorizontalOverflow(page, `${viewportName}:report-action-board`)

  return {
    viewportName,
    visible: await board.isVisible(),
    actionCount: await cards.count(),
    actionKeys,
    codeQaLinkVisible: await board.locator('[data-action-key="code-qa"]').getByRole('button', { name: '复制链接' }).isVisible(),
    repairCandidateVisible: await board.locator('[data-action-key="repair-candidate"]').isVisible(),
    noHorizontalOverflow: true,
  }
}

async function assertReportReviewGate(page: Page, viewportName: string) {
  const gate = page.getByRole('region', { name: '报告复核门禁' })
  await expectContainedInViewport(gate, `${viewportName}:report-review-gate`)
  await expect(gate.getByText('报告复核门禁')).toBeVisible()
  await expect(gate.getByText('报告进入治理前检查')).toBeVisible()
  await expect(gate.locator('.ant-tag')).toContainText(/Ready/)

  const cards = gate.locator('[data-review-gate-key]')
  await expect(cards).toHaveCount(6)
  const gateKeys = await cards.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.reviewGateKey || ''))
  expect(gateKeys).toEqual([
    'report-readiness',
    'evidence-bundle',
    'code-knowledge',
    'repair-readiness',
    'audit-trace',
    'governance-timeline',
  ])
  await expect(gate.getByText('报告可信度')).toBeVisible()
  await expect(gate.getByText('证据包')).toBeVisible()
  await expect(gate.getByText('代码知识库')).toBeVisible()
  await expect(gate.getByText('修复入口')).toBeVisible()
  await expect(gate.getByText('审计追踪')).toBeVisible()
  await expect(gate.getByText('治理时间线')).toBeVisible()
  await expectAllLocatorTextNotClipped(gate.locator('.sl-report-review-gate-item span'), `${viewportName}:report-review-gate-label`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(gate.locator('.sl-report-review-gate-item strong'), `${viewportName}:report-review-gate-value`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(gate.locator('.sl-report-review-gate-item p'), `${viewportName}:report-review-gate-detail`, { mustWrap: true })
  await expectNoHorizontalOverflow(page, `${viewportName}:report-review-gate`)

  const readyBadgeText = await gate.locator('.ant-tag').first().innerText()
  const readyMatch = readyBadgeText.match(/(\d+)\/6/)
  return {
    viewportName,
    visible: await gate.isVisible(),
    gateCount: await cards.count(),
    gateKeys,
    readyCount: readyMatch ? Number(readyMatch[1]) : -1,
    textNotClipped: true,
    noHorizontalOverflow: true,
  }
}

async function assertCodeChunkPreviewRedaction(page: Page, chunkRegion: Locator, viewportName: string) {
  const redactedPreviews = chunkRegion.getByLabel('脱敏 code chunk 预览')
  const rawChunkPayloads = drawerChunks.map(chunk => `${chunk.content || ''}\n${chunk.contentPreview || ''}`)
  await expect(redactedPreviews, `${viewportName}:redacted-code-chunk-previews`).toHaveCount(2)
  await expect(redactedPreviews.nth(1), `${viewportName}:redacted-code-chunk-preview-visible`).toContainText('[REDACTED]')
  for (const secret of forbiddenCodeChunkSecretSnippets) {
    await expect(chunkRegion, `${viewportName}:chunk-region-hides-${secret}`).not.toContainText(secret)
    await expect(page.locator('body'), `${viewportName}:body-hides-${secret}`).not.toContainText(secret)
  }
  return {
    viewportName,
    scope: 'REPORT_EVIDENCE_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY',
    fixtureHasRawSecretSentinel: rawChunkPayloads.some(payload => payload.includes(codeChunkRawSecretSentinel)),
    fixtureHasBearerSecret: rawChunkPayloads.some(payload => payload.includes(codeChunkBearerSecret)),
    fixtureHasApiKeySecret: rawChunkPayloads.some(payload => payload.includes(codeChunkApiKeySecret)),
    fixtureHasJwtSecret: rawChunkPayloads.some(payload => payload.includes(codeChunkJwtSecret)),
    redactedPreviewCount: await redactedPreviews.count(),
    rawSecretsHidden: true,
    bodyHidden: true,
    redactionVisible: true,
  }
}

async function assertReportEvidenceQuestionReferenceRedaction(page: Page, drawer: Locator, viewportName: string) {
  const questionPreview = drawer.getByLabel('脱敏报告证据问题')
  await expect(questionPreview, `${viewportName}:redacted-report-evidence-question-visible`).toBeVisible()
  await expect(questionPreview, `${viewportName}:safe-marker-visible-in-question`).toContainText(reportEvidenceSafeMarker)
  await expect(questionPreview, `${viewportName}:redaction-visible-in-question`).toContainText('[REDACTED]')

  for (const secret of forbiddenReportEvidenceSecretSnippets) {
    await expect(questionPreview, `${viewportName}:question-hides-${secret}`).not.toContainText(secret)
    await expect(drawer, `${viewportName}:drawer-hides-report-evidence-${secret}`).not.toContainText(secret)
    await expect(page.locator('body'), `${viewportName}:body-hides-report-evidence-${secret}`).not.toContainText(secret)
  }

  const actionRail = drawer.getByRole('region', { name: '报告证据下一步动作' })
  await actionRail.getByRole('button', { name: '复制证据引用' }).click()
  const copiedText = await page.evaluate(() => {
    const writes = (window as any).__reportEvidenceClipboardWrites || []
    return String(writes[writes.length - 1] || '')
  })
  expect(copiedText, `${viewportName}: copied reference must retain safe marker`).toContain(reportEvidenceSafeMarker)
  expect(copiedText, `${viewportName}: copied reference must include redaction marker`).toContain('[REDACTED]')
  expect(copiedText, `${viewportName}: copied reference must keep scan binding`).toContain(`scanTaskId: ${scanTaskId}`)
  for (const secret of forbiddenReportEvidenceSecretSnippets) {
    expect(copiedText, `${viewportName}: copied reference must hide ${secret}`).not.toContain(secret)
  }

  await page.evaluate(() => {
    ;(window as any).__reportEvidenceClipboardShouldFail = true
  })
  await actionRail.getByRole('button', { name: '复制证据引用' }).click()
  const manualCopyDialog = page.getByRole('dialog', { name: '手动复制证据引用' })
  await expect(manualCopyDialog, `${viewportName}: manual copy dialog must open`).toBeVisible()
  const manualCopyText = await manualCopyDialog.locator('textarea').inputValue()
  expect(manualCopyText, `${viewportName}: manual copy text must retain safe marker`).toContain(reportEvidenceSafeMarker)
  expect(manualCopyText, `${viewportName}: manual copy text must include redaction marker`).toContain('[REDACTED]')
  for (const secret of forbiddenReportEvidenceSecretSnippets) {
    expect(manualCopyText, `${viewportName}: manual copy text must hide ${secret}`).not.toContain(secret)
  }
  await manualCopyDialog.getByRole('button', { name: '关闭' }).click()
  await expect(manualCopyDialog, `${viewportName}: manual copy dialog must close`).toBeHidden()
  await page.evaluate(() => {
    ;(window as any).__reportEvidenceClipboardShouldFail = false
  })

  return {
    viewportName,
    scope: 'SCAN_TASK_DETAIL_REPORT_EVIDENCE_DRAWER_QUESTION_REFERENCE_DEEPLINK_DISPLAY_REDACTION_ONLY',
    fixtureHasRawSecret: forbiddenReportEvidenceSecretSnippets.every(secret => evidenceSummary.includes(secret)),
    safeMarkerVisible: true,
    questionRawSecretsHidden: true,
    drawerRawSecretsHidden: true,
    bodyRawSecretsHidden: true,
    clipboardRawSecretsHidden: true,
    manualCopyRawSecretsHidden: true,
    redactionVisible: true,
  }
}

async function expectAllLocatorTextNotClipped(locator: Locator, label: string, options: { mustWrap?: boolean } = {}) {
  const count = await locator.count()
  expect(count, `${label} must have at least one readable item`).toBeGreaterThan(0)
  for (let index = 0; index < count; index += 1) {
    await expectLocatorTextNotClipped(locator.nth(index), `${label}:${index}`, options)
  }
}

async function assertQaDeepEvidenceCardReadability(page: Page, viewportName: string, mode: 'ready' | 'review') {
  const sourceReceipt = page
    .locator('.sl-qa-source-receipt')
    .filter({ hasText: mode === 'ready' ? 'REPORT_LINE_ANCHOR' : 'REPORT_FILE_ANCHOR' })
    .first()
  await expectContainedInViewport(sourceReceipt, `${viewportName}:${mode}:qa-source-receipt`)
  await expect(sourceReceipt).toContainText('回答来源凭证')
  await expect(sourceReceipt).toContainText(evidenceTitle)
  await expect(sourceReceipt).toContainText(`Scan #${scanTaskId}`)
  await expect(sourceReceipt).toContainText(targetFile)
  await expect(sourceReceipt).toContainText(`${targetFile}:${evidenceLineRange}`)
  await expectLocatorTextNotClipped(sourceReceipt.locator('.sl-qa-source-receipt-head strong').first(), `${viewportName}:${mode}:source-receipt-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(sourceReceipt.locator('.sl-qa-source-receipt-ref span').first(), `${viewportName}:${mode}:source-receipt-ref`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(sourceReceipt.locator('.sl-qa-source-receipt-tags .ant-tag'), `${viewportName}:${mode}:source-receipt-tags`)

  const sourceLocationConfidence = sourceReceipt.getByLabel('来源定位可信度')
  await expectContainedInViewport(sourceLocationConfidence, `${viewportName}:${mode}:source-location-confidence`)
  await expect(sourceLocationConfidence.getByText('来源定位可信度')).toBeVisible()
  await expectLocatorTextNotClipped(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-head strong').first(), `${viewportName}:${mode}:source-location-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(sourceLocationConfidence.locator('p').first(), `${viewportName}:${mode}:source-location-summary`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-metrics strong'), `${viewportName}:${mode}:source-location-metrics`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-checks .ant-tag'), `${viewportName}:${mode}:source-location-checks`)
  await expect(sourceLocationConfidence.getByText('定位不证明事实正确')).toBeVisible()

  const sourceMatchRelease = page
    .locator('.sl-qa-source-match-release')
    .filter({ hasText: mode === 'ready' ? '满足修复候选放行' : '来源锚点仍是文件锚点' })
    .first()
  await expectContainedInViewport(sourceMatchRelease, `${viewportName}:${mode}:source-file-match-release`)
  await expect(sourceMatchRelease.getByText('修复候选放行条件')).toBeVisible()
  await expectLocatorTextNotClipped(sourceMatchRelease.locator('.sl-qa-source-match-release-head strong').first(), `${viewportName}:${mode}:source-match-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(sourceMatchRelease.locator('p').first(), `${viewportName}:${mode}:source-match-summary`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(sourceMatchRelease.locator('.sl-qa-source-match-release-grid strong'), `${viewportName}:${mode}:source-match-grid`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(sourceMatchRelease.locator('.sl-qa-source-match-release-checks strong'), `${viewportName}:${mode}:source-match-check-title`, { mustWrap: true })
  await expectContainedInViewport(sourceMatchRelease.locator('.sl-qa-source-match-release-checks').first(), `${viewportName}:${mode}:source-match-checks`)
  await expectLocatorTextNotClipped(sourceMatchRelease.locator('.sl-qa-source-match-release-next').first(), `${viewportName}:${mode}:source-match-next-action`, { mustWrap: true })

  if (mode === 'ready') {
    await expect(sourceReceipt.getByText('REPORT_LINE_ANCHOR').first()).toBeVisible()
    await expect(sourceReceipt.getByText('行级锚点').first()).toBeVisible()
    await expect(sourceReceipt.getByText(`范围 ${evidenceLineRange}`).first()).toBeVisible()
    await expect(sourceLocationConfidence.getByText('来源定位可信', { exact: true })).toBeVisible()
    await expect(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-head').getByText('已绑定', { exact: true })).toBeVisible()
    await expect(sourceLocationConfidence.getByText('行范围').first()).toBeVisible()
    await expect(sourceLocationConfidence.getByText(`第 ${evidenceLineRange} 行`).first()).toBeVisible()
    await expect(sourceMatchRelease.getByText('满足修复候选放行')).toBeVisible()
    await expect(sourceMatchRelease.getByText('已满足：行级锚点').first()).toBeVisible()
    await expect(sourceMatchRelease.getByText('已满足：主张 PRIMARY 绑定').first()).toBeVisible()
  } else {
    await expect(sourceReceipt.getByText('REPORT_FILE_ANCHOR').first()).toBeVisible()
    await expect(sourceLocationConfidence.getByText('来源定位需复核', { exact: true })).toBeVisible()
    await expect(sourceLocationConfidence.getByText('需复核', { exact: true })).toBeVisible()
    await expect(sourceMatchRelease.getByText('修复候选已阻断')).toBeVisible()
    await expect(sourceMatchRelease.getByText('未满足：行级锚点').first()).toBeVisible()
    await expect(sourceMatchRelease.getByText('未满足：主张 PRIMARY 绑定').first()).toBeVisible()
    await expect(sourceMatchRelease.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  }

  await expectNoHorizontalOverflow(page, `${viewportName}:${mode}:qa-deep-evidence-card-readable`)

  return {
    viewportName,
    mode,
    mobileViewport: viewportName === 'mobile' || viewportName === 'narrow',
    sourceReceipt: {
      visible: true,
      contained: true,
      referenceWraps: true,
      titleNotClipped: true,
      tagsNotClipped: true,
      structuredRangeVisible: mode === 'ready',
    },
    sourceLocationConfidence: {
      contained: true,
      metricsNotClipped: true,
      checksWrap: true,
      modeVisible: true,
      llmFactBoundaryVisible: true,
    },
    sourceFileMatchRelease: {
      contained: true,
      targetReferenceNotClipped: true,
      citedReferenceNotClipped: true,
      checksNotClipped: true,
      noRepairOnReview: mode === 'review',
    },
    noHorizontalOverflow: true,
  }
}

async function installReportEvidenceDrawerMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const chunkQueries: string[] = []
  const qaRequests: any[] = []

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'report-evidence-drawer-smoke-token')
    ;(window as any).__reportEvidenceClipboardWrites = []
    ;(window as any).__reportEvidenceClipboardShouldFail = false
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          if ((window as any).__reportEvidenceClipboardShouldFail) {
            throw new Error('forced clipboard failure')
          }
          ;(window as any).__reportEvidenceClipboardWrites.push(text)
        },
      },
    })
    const originalExecCommand = document.execCommand?.bind(document)
    document.execCommand = (commandId: string, showUI?: boolean, value?: string) => {
      if ((window as any).__reportEvidenceClipboardShouldFail && commandId === 'copy') {
        return false
      }
      return originalExecCommand ? originalExecCommand(commandId, showUI, value) : false
    }
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
      await fulfillJson(route, result({ id: 1, username: 'report_evidence_smoke', email: 'smoke@local.test', status: 'ACTIVE' }))
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
      await fulfillJson(route, result([{
        id: repositoryId,
        projectId,
        provider: 'GITHUB',
        owner: 'demo',
        name: 'report-evidence-drawer-smoke',
        url: 'https://github.com/demo/report-evidence-drawer-smoke.git',
        defaultBranch: 'main',
        visibility: 'PUBLIC',
        authType: 'NONE',
        status: 'ACTIVE',
        createdAt: '2026-06-30T10:00:00Z',
      }]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/scan-tasks`) {
      await fulfillJson(route, result({ items: [scanTask], page: 1, pageSize: 20, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks`) {
      await fulfillJson(route, result({ items: [executionDetail.task], page: 1, pageSize: 100, total: 1 }))
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

    if (method === 'GET' && path.startsWith(`/api/projects/${projectId}/artifacts/`) && path.endsWith('/preview')) {
      await fulfillJson(route, result({ record: artifacts[1], text: '{}', truncated: false, previewBytes: 2 }))
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
      const query = url.searchParams.get('query') || ''
      chunkQueries.push(url.search)
      const isDrawerQuery = url.searchParams.get('limit') === '3'
      const isGapQuery = query.includes(gapEvidenceFile)
      if (isDrawerQuery && isGapQuery) {
        await fulfillJson(route, result({
          scanTaskId,
          query,
          limit: 3,
          total: 0,
          resultCount: 0,
          totalChunks: 128,
          embeddedChunks: 96,
          truncated: false,
          retrievalMode: 'HYBRID',
          evidenceProfile: {
            readiness: 'GAP',
            confidence: 0,
            summary: 'No code_chunks matched the report evidence.',
            nextAction: 'Use QA to localize a concrete file before repair.',
            details: ['missing-report-evidence'],
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
          items: [],
        }))
        return
      }
      await fulfillJson(route, result({
        scanTaskId,
        query,
        limit: Number(url.searchParams.get('limit') || 1),
        total: isDrawerQuery ? drawerChunks.length : 1,
        resultCount: isDrawerQuery ? drawerChunks.length : 1,
        totalChunks: 128,
        embeddedChunks: 96,
        truncated: false,
        retrievalMode: isDrawerQuery ? 'HYBRID' : 'STABLE_FALLBACK',
        evidenceProfile: {
          readiness: 'READY',
          confidence: 91,
          summary: 'Controller evidence is strongly matched.',
          nextAction: 'Review controller boundary',
          details: [],
          uniqueFiles: isDrawerQuery ? 2 : 1,
          embeddedEvidenceCount: 1,
          lowConfidenceCount: 0,
          topScore: 91,
          averageScore: 74,
          lineSpan: 38,
          dominantEvidenceType: 'CONTROLLER',
          evidenceTypeStats: [{ type: 'CONTROLLER', count: 1 }, { type: 'SERVICE', count: 1 }],
          fileStats: [{ filePath: targetFile, count: 1, bestScore: 91 }],
        },
        items: isDrawerQuery ? drawerChunks : [drawerChunks[0]],
      }))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/qa`) {
      const payload = JSON.parse(request.postData() || '{}')
      qaRequests.push(payload)
      const wantsUnverifiedCitation = String(payload.question || '').includes('未验证态')
      const wantsClaimCitationNoiseBoundary = String(payload.question || '').includes('假引用噪声')
      const wantsReviewCitation = wantsUnverifiedCitation || wantsClaimCitationNoiseBoundary
      const wantsFileAnchorDrift = String(payload.question || '').includes('文件锚点漂移')
      const wantsContextOnlyReview = wantsReviewCitation || wantsFileAnchorDrift
      const wantsClaimRoleDistributionMissing = String(payload.question || '').includes('主张角色分布缺失')
      const wantsClaimRoleDistributionMismatch = String(payload.question || '').includes('主张角色计数矛盾')
      await fulfillJson(route, result({
        answer: wantsClaimCitationNoiseBoundary
          ? `AuthService validates token before issuing auth state.
\`\`\`java
// fake citation marker in code must be ignored [C1]
boolean ok = authService.validateToken(token);
\`\`\`
2026-07-03T10:00:00 ERROR AuthService failed token validation [C1]
java.lang.IllegalStateException: AuthService failed token validation [C1]
The literal citation example is \`[C1]\`.`
          : wantsUnverifiedCitation
          ? `需要人工复核 ${targetFile} 的 Controller 边界。当前回答故意不写入引用标记，用于验证未验证态 UI。`
          : wantsFileAnchorDrift
            ? `已基于 [C1] 复核 ${targetFile} 的 Controller 边界，但报告来源只回显到文件级锚点，需要人工复核。`
            : wantsClaimRoleDistributionMissing
              ? `已基于 [C1] 复核 ${targetFile} 的 Controller 边界，但缺少主张证据角色分布，必须人工复核。`
              : wantsClaimRoleDistributionMismatch
                ? `已基于 [C1] 复核 ${targetFile} 的 Controller 边界，但主张角色计数字段互相矛盾，必须人工复核。`
                : `已基于 [C1] 复核 ${targetFile} 的 Controller 边界。建议把编排逻辑下沉到 ChatService，并保留请求校验在 Controller。`,
        scanTaskId,
        question: payload.question || '',
        matchedChunks: drawerChunks.length,
        resultCount: drawerChunks.length,
        retrievalMode: 'HYBRID',
        totalChunks: 128,
        embeddedChunks: 96,
        truncated: false,
        evidenceProfile: {
          readiness: 'READY',
          confidence: 91,
          summary: 'Controller evidence is strongly cited by the answer.',
          nextAction: 'Review controller boundary',
          details: [],
          uniqueFiles: 2,
          embeddedEvidenceCount: 1,
          lowConfidenceCount: 0,
          topScore: 91,
          averageScore: 74,
          lineSpan: 38,
          dominantEvidenceType: 'CONTROLLER',
          evidenceTypeStats: [{ type: 'CONTROLLER', count: 1 }, { type: 'SERVICE', count: 1 }],
          fileStats: [{ filePath: targetFile, count: 1, bestScore: 91 }],
        },
        groundingStatus: wantsContextOnlyReview ? 'PARTIAL' : 'VERIFIED',
        citationEnforcementStatus: wantsContextOnlyReview ? 'RETRY_FAILED' : 'DIRECT_VERIFIED',
        citationEnforcementReason: wantsFileAnchorDrift
          ? 'CONTEXT_ONLY_CLAIM'
          : wantsClaimCitationNoiseBoundary
            ? 'NO_VALID_CITATION_LABEL'
            : wantsUnverifiedCitation
              ? 'UNCITED_REQUIRED_CLAIM'
              : 'DIRECT_VERIFIED',
        citationEnforcementNote: wantsContextOnlyReview
          ? 'Answer did not include an auditable prose citation after retry; human review is required.'
          : 'Answer cited the retrieved report evidence on the first pass.',
        citationCoverage: {
          totalEvidenceCount: 2,
          citedEvidenceCount: wantsReviewCitation ? 0 : 1,
          uncitedCandidateCount: wantsReviewCitation ? 2 : 1,
          repairCandidateCount: wantsContextOnlyReview ? 0 : 1,
          coveragePercent: wantsReviewCitation ? 0 : wantsFileAnchorDrift ? 50 : 50,
          uniqueEvidenceFileCount: 2,
          citedEvidenceFileCount: wantsReviewCitation ? 0 : 1,
          primaryEvidenceCount: wantsFileAnchorDrift ? 0 : 1,
          citedPrimaryEvidenceCount: wantsContextOnlyReview ? 0 : 1,
          uncitedPrimaryEvidenceCount: wantsFileAnchorDrift ? 0 : wantsContextOnlyReview ? 1 : 0,
          primaryEvidenceFileCount: wantsFileAnchorDrift ? 0 : 1,
          citedPrimaryEvidenceFileCount: wantsContextOnlyReview ? 0 : 1,
          uncitedPrimaryEvidenceFileCount: wantsFileAnchorDrift ? 0 : wantsContextOnlyReview ? 1 : 0,
          contextEvidenceCount: wantsFileAnchorDrift ? 2 : 1,
          citedContextEvidenceCount: wantsFileAnchorDrift ? 1 : 0,
          uncitedContextEvidenceCount: wantsFileAnchorDrift ? 1 : 1,
          contextEvidenceFileCount: wantsFileAnchorDrift ? 2 : 1,
          citedContextEvidenceFileCount: wantsFileAnchorDrift ? 1 : 0,
          uncitedContextEvidenceFileCount: wantsFileAnchorDrift ? 1 : 1,
          requiredEvidenceCount: wantsFileAnchorDrift ? 2 : 1,
          citedRequiredEvidenceCount: wantsReviewCitation ? 0 : 1,
          requiredEvidenceFileCount: wantsFileAnchorDrift ? 2 : 1,
          citedRequiredEvidenceFileCount: wantsReviewCitation ? 0 : 1,
          requiredEvidenceCoveragePercent: wantsReviewCitation ? 0 : wantsFileAnchorDrift ? 50 : 100,
          coverageScope: wantsFileAnchorDrift ? 'ALL' : 'PRIMARY',
          status: wantsReviewCitation ? 'NONE' : 'PARTIAL',
          evidenceRoleDistribution: {
            status: wantsFileAnchorDrift ? 'CONTEXT_ONLY' : 'MIXED_PRIMARY_CONTEXT',
            totalFileCount: 2,
            citedFileCount: wantsReviewCitation ? 0 : 1,
            primaryFileCount: wantsFileAnchorDrift ? 0 : 1,
            citedPrimaryFileCount: wantsContextOnlyReview ? 0 : 1,
            contextFileCount: wantsFileAnchorDrift ? 2 : 1,
            citedContextFileCount: wantsFileAnchorDrift ? 1 : 0,
            roles: [
              {
                role: wantsFileAnchorDrift ? 'ADJACENT_CONTEXT' : 'PRIMARY',
                evidenceCount: 1,
                citedEvidenceCount: wantsReviewCitation ? 0 : 1,
                fileCount: 1,
                citedFileCount: wantsReviewCitation ? 0 : 1,
              },
              {
                role: 'ADJACENT_CONTEXT',
                evidenceCount: 1,
                citedEvidenceCount: 0,
                fileCount: 1,
                citedFileCount: 0,
              },
            ],
            files: [
              {
                filePath: targetFile,
                primaryEvidenceCount: wantsFileAnchorDrift ? 0 : 1,
                citedPrimaryEvidenceCount: wantsContextOnlyReview ? 0 : 1,
                contextEvidenceCount: wantsFileAnchorDrift ? 1 : 0,
                citedContextEvidenceCount: wantsFileAnchorDrift ? 1 : 0,
              },
              {
                filePath: 'src/main/java/demo/service/ChatService.java',
                primaryEvidenceCount: 0,
                citedPrimaryEvidenceCount: 0,
                contextEvidenceCount: 1,
                citedContextEvidenceCount: 0,
              },
            ],
          },
        },
        claimCitationCoverage: {
          totalClaimCount: 1,
          requiredClaimCount: 1,
          citedRequiredClaimCount: wantsContextOnlyReview ? 0 : 1,
          uncitedRequiredClaimCount: wantsContextOnlyReview ? 1 : 0,
          invalidCitationClaimCount: 0,
          claimCoveragePercent: wantsContextOnlyReview ? 0 : 100,
          validCitationFileCount: wantsContextOnlyReview ? 0 : 1,
          requiredClaimCitationFileCount: wantsContextOnlyReview ? 0 : 1,
          status: wantsContextOnlyReview ? 'REVIEW' : 'READY',
          readyForRepair: !wantsContextOnlyReview,
          readinessReason: wantsContextOnlyReview
            ? (wantsFileAnchorDrift ? 'CONTEXT_ONLY_CLAIM' : 'UNCITED_REQUIRED_CLAIM')
            : 'PRIMARY_BOUND_READY',
          validCitationFiles: wantsContextOnlyReview ? [] : [targetFile],
          requiredClaimCitationFiles: wantsContextOnlyReview ? [] : [targetFile],
          ...(wantsClaimRoleDistributionMissing ? {} : {
            roleDistribution: wantsClaimRoleDistributionMismatch ? {
              status: 'PRIMARY_BOUND',
              requiredClaimCount: 2,
              requiredPrimaryBoundClaimCount: 2,
              requiredContextOnlyClaimCount: 1,
              requiredUnknownOnlyClaimCount: 0,
              unbackedRequiredClaimCount: 1,
              invalidRequiredClaimCount: 1,
              validCitationFileCount: 2,
              requiredClaimCitationFileCount: 0,
              primaryFileCount: 1,
              requiredPrimaryFileCount: 1,
              contextFileCount: 1,
              requiredContextFileCount: 1,
              unknownFileCount: 0,
              requiredUnknownFileCount: 0,
              roles: [
                { role: 'PRIMARY', claimCount: 2, requiredClaimCount: 2, fileCount: 1, requiredFileCount: 1 },
                { role: 'ADJACENT_CONTEXT', claimCount: 1, requiredClaimCount: 1, fileCount: 1, requiredFileCount: 1 },
              ],
              files: [
                { filePath: targetFile, primaryClaimCount: 2, requiredPrimaryClaimCount: 2, contextClaimCount: 1, requiredContextClaimCount: 1, unknownClaimCount: 0, requiredUnknownClaimCount: 0, requiredClaimCount: 2 },
              ],
            } : {
              status: wantsFileAnchorDrift ? 'CONTEXT_ONLY' : wantsReviewCitation ? 'REVIEW_UNCITED' : 'PRIMARY_BOUND',
              requiredClaimCount: 1,
              requiredPrimaryBoundClaimCount: wantsContextOnlyReview ? 0 : 1,
              requiredContextOnlyClaimCount: wantsFileAnchorDrift ? 1 : 0,
              requiredUnknownOnlyClaimCount: 0,
              unbackedRequiredClaimCount: wantsContextOnlyReview ? 1 : 0,
              invalidRequiredClaimCount: 0,
              validCitationFileCount: wantsContextOnlyReview ? 0 : 1,
              requiredClaimCitationFileCount: wantsContextOnlyReview ? 0 : 1,
              primaryFileCount: wantsContextOnlyReview ? 0 : 1,
              requiredPrimaryFileCount: wantsContextOnlyReview ? 0 : 1,
              contextFileCount: wantsFileAnchorDrift ? 1 : 0,
              requiredContextFileCount: wantsFileAnchorDrift ? 1 : 0,
              unknownFileCount: 0,
              requiredUnknownFileCount: 0,
              roles: wantsReviewCitation
                ? []
                : wantsFileAnchorDrift
                  ? [{ role: 'ADJACENT_CONTEXT', claimCount: 1, requiredClaimCount: 1, fileCount: 1, requiredFileCount: 1 }]
                  : [{ role: 'PRIMARY', claimCount: 1, requiredClaimCount: 1, fileCount: 1, requiredFileCount: 1 }],
              files: wantsReviewCitation
                ? []
                : wantsFileAnchorDrift
                  ? [{ filePath: targetFile, primaryClaimCount: 0, requiredPrimaryClaimCount: 0, contextClaimCount: 1, requiredContextClaimCount: 1, unknownClaimCount: 0, requiredUnknownClaimCount: 0, requiredClaimCount: 1 }]
                  : [{ filePath: targetFile, primaryClaimCount: 1, requiredPrimaryClaimCount: 1, contextClaimCount: 0, requiredContextClaimCount: 0, unknownClaimCount: 0, requiredUnknownClaimCount: 0, requiredClaimCount: 1 }],
            },
          }),
          claims: [
            {
              claimId: 'Q1',
              claimTextPreview: wantsReviewCitation
                ? `AuthService validates token before issuing auth state.`
                : `已基于 [C1] 复核 ${targetFile} 的 Controller 边界。`,
              required: true,
              sourceLabels: wantsContextOnlyReview ? [] : ['C1'],
              validSourceLabels: wantsContextOnlyReview ? [] : ['C1'],
              invalidSourceLabels: [],
              validSourceFiles: wantsContextOnlyReview ? [] : [targetFile],
              validSourceRoles: wantsFileAnchorDrift ? ['ADJACENT_CONTEXT'] : wantsReviewCitation ? [] : ['PRIMARY'],
              primarySourceFiles: wantsContextOnlyReview ? [] : [targetFile],
              contextSourceFiles: wantsFileAnchorDrift ? [targetFile] : [],
              status: wantsContextOnlyReview ? 'REVIEW' : 'CITED',
            },
          ],
        },
        sourceEvidenceRef: payload.evidenceRef || null,
        sourceEvidenceMatched: true,
        sourceEvidenceMatchType: wantsFileAnchorDrift ? 'REPORT_FILE_ANCHOR' : 'REPORT_LINE_ANCHOR',
        answerCitations: [
          {
            citationId: 'chunk-9001',
            sourceLabel: 'C1',
            chunkId: 9001,
            scanTaskId,
            filePath: targetFile,
            startLine: 24,
            endLine: 42,
            evidenceType: 'CONTROLLER',
            evidenceReason: 'Controller handler matches the reported endpoint and risk file.',
            relevanceScore: 91,
            contextRole: wantsFileAnchorDrift ? 'ADJACENT_CONTEXT' : 'PRIMARY',
            contextDistance: wantsFileAnchorDrift ? 1 : 0,
            citedByAnswer: !wantsReviewCitation,
          },
          {
            citationId: 'chunk-9002',
            sourceLabel: 'C2',
            chunkId: 9002,
            scanTaskId,
            filePath: 'src/main/java/demo/service/ChatService.java',
            startLine: 12,
            endLine: 32,
            evidenceType: 'SERVICE',
            evidenceReason: 'Adjacent service context explains where orchestration should move. Graph relation: ChatController CALLS ChatService.',
            relevanceScore: 58,
            contextRole: 'ADJACENT_CONTEXT',
            contextDistance: 1,
            citedByAnswer: false,
          },
        ],
        retrievedChunks: drawerChunks.map((chunk, index) => ({
          ...chunk,
          citationId: `chunk-${chunk.id}`,
          sourceLabel: `C${index + 1}`,
          contextRole: wantsFileAnchorDrift ? 'ADJACENT_CONTEXT' : chunk.contextRole,
          contextDistance: wantsFileAnchorDrift ? 1 : chunk.contextDistance,
        })),
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
    chunkQueries,
    qaRequests,
    unhandledApiRequests,
  }
}

async function installArtifactFallbackMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const fallbackSummary = {
    marker: artifactFallbackSafeMarker,
    authorization: `Bearer ${artifactFallbackBearerSecret}`,
    apiKey: artifactFallbackApiKeySecret,
    secret: artifactFallbackQuotedSecret,
    notes: `password=${artifactFallbackPasswordSecret} api_key=${artifactFallbackPlainApiKeySecret}`,
    jwt: artifactFallbackJwtSecret,
  }
  const fallbackArtifacts = [
    {
      ...artifacts[0],
      summaryJson: null,
    },
    {
      ...artifacts[3],
      id: 399,
      artifactType: 'ARCHITECTURE_OVERVIEW',
      checksumSha256: 'fallback-overview-checksum',
      summaryJson: JSON.stringify(fallbackSummary),
    },
  ]

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'artifact-fallback-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'artifact_fallback_smoke', email: 'smoke@local.test', status: 'ACTIVE' }))
      return
    }

    if (method === 'GET' && path === `/api/scan-tasks/${scanTaskId}`) {
      await fulfillJson(route, result(scanTask))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts`) {
      await fulfillJson(route, result(fallbackArtifacts))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/${reportArtifactId}/preview`) {
      await fulfillJson(route, result({ record: artifacts[0], text: 'not-json-report-preview', truncated: false, previewBytes: 23 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/artifacts/399/preview`) {
      await fulfillJson(route, result({ record: fallbackArtifacts[1], text: JSON.stringify(fallbackSummary), truncated: false, previewBytes: 512 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/SCAN_TASK/${scanTaskId}`) {
      await fulfillJson(route, result(executionDetail))
      return
    }

    if (method === 'GET' && (path === `/api/projects/${projectId}/code-chunks/search` || path === `/api/projects/${projectId}/code-chunks/status`)) {
      await fulfillJson(route, result({
        scanTaskId,
        query: '',
        limit: 1,
        total: 0,
        resultCount: 0,
        totalChunks: 0,
        embeddedChunks: 0,
        truncated: false,
        retrievalMode: 'NO_CONTEXT',
        evidenceProfile: { readiness: 'GAP', confidence: 0, summary: 'No chunks in fallback smoke.' },
        items: [],
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
    fallbackSummary,
    unhandledApiRequests,
  }
}

async function openEvidenceDrawerAndAssert(page: Page, viewportName: string) {
  await page.goto(`/scan-tasks/${scanTaskId}`)
  await expect(page.getByRole('heading', { name: '报告证据链完整，可进入代码证据复核。' }).first()).toBeVisible()
  await expect(page.getByRole('tab', { name: /报告总览/ })).toBeVisible()
  const trustedLoop = await assertReportTrustedLoop(page, viewportName)
  const reportCitationQuality = await assertReportCitationQualityPanel(page, viewportName)
  const recommendedStep = await assertReportRecommendedNextStep(page, viewportName)
  const mainPathGuide = await assertReportMainPathGuide(page, viewportName)
  const actionBoard = await assertReportActionBoard(page, viewportName)
  const reviewGate = await assertReportReviewGate(page, viewportName)
  const evidenceProfileTraceMap = await assertReportEvidenceProfileAndTraceMapReadability(page, viewportName)
  const governanceTimelineReadability = await assertReportGovernanceTimelineReadability(page, viewportName)
  const apiDbTableReadability = await assertReportApiDbTableReadability(page, viewportName)
  const priorityRail = await assertPriorityRailAndOpenFirstEvidence(page, viewportName)

  const drawer = page.getByRole('dialog', { name: '报告证据抽屉' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText('Controller boundary').first()).toBeVisible()
  const chunkRegion = page.getByRole('region', { name: 'code_chunks 命中摘要' })
  await expect(chunkRegion).toBeVisible()
  await expect(chunkRegion.getByText('2 / 2 hits')).toBeVisible()
  await expect(chunkRegion.getByText('混合召回')).toBeVisible()
  await expect(chunkRegion.getByText('可信度 91%')).toBeVisible()
  await expect(chunkRegion.getByText(targetFile).first()).toBeVisible()
  await expect(chunkRegion.getByText('24-42').first()).toBeVisible()
  await expect(chunkRegion.getByText('主证据')).toBeVisible()
  await expect(chunkRegion.getByText('CONTROLLER', { exact: true })).toBeVisible()
  await expect(chunkRegion.getByText('Score 91')).toBeVisible()
  await expect(chunkRegion.getByText('语义证据')).toBeVisible()
  await expect(chunkRegion.getByText('关键词证据')).toBeVisible()
  await expect(chunkRegion.getByText('需复核')).toBeVisible()
  await expect(chunkRegion.getByText('Controller handler matches the reported endpoint and risk file.')).toBeVisible()
  const codeChunkPreviewRedaction = await assertCodeChunkPreviewRedaction(page, chunkRegion, viewportName)
  const citationReadiness = page.getByRole('region', { name: '引用质量预检' })
  await expect(citationReadiness).toBeVisible()
  await expect(citationReadiness.getByText('引用质量预检')).toBeVisible()
  await expect(citationReadiness.getByText('READY', { exact: true }).first()).toBeVisible()
  await expect(citationReadiness.getByText('Readiness').first()).toBeVisible()
  await expect(citationReadiness.getByText('Hits').first()).toBeVisible()
  await expect(citationReadiness.getByText('Score').first()).toBeVisible()
  const handoffSummary = drawer.getByRole('region', { name: '报告证据交接包' })
  await expect(handoffSummary).toBeVisible()
  await expect(handoffSummary.getByText('报告证据交接包')).toBeVisible()
  await expect(handoffSummary.getByText(`Scan #${scanTaskId}`)).toBeVisible()
  await expect(handoffSummary.getByText('Controller boundary')).toBeVisible()
  await expect(handoffSummary.getByText(targetFile)).toBeVisible()
  await expect(handoffSummary.getByText(evidenceLineRange, { exact: true })).toBeVisible()
  await expect(handoffSummary.getByText('READY', { exact: true })).toBeVisible()
  await expect(handoffSummary.getByText('2 hits')).toBeVisible()
  await expect(handoffSummary.getByText('可信度')).toBeVisible()
  await expect(handoffSummary.getByText('91%')).toBeVisible()
  await expect(handoffSummary.getByText('PRIMARY 主证据已命中')).toBeVisible()
  await expect(handoffSummary.getByText('可进入 QA 复核并开放修复候选')).toBeVisible()
  const actionRail = drawer.getByRole('region', { name: '报告证据下一步动作' })
  await expect(actionRail).toBeVisible()
  await expect(actionRail.getByText('READY', { exact: true })).toBeVisible()
  await expect(actionRail.getByText('证据已就绪，先复核引用后进入修复')).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '基于此证据追问' })).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '复制证据引用' })).toBeVisible()
  const readyRepairAction = actionRail.getByRole('button', { name: '生成修复候选' })
  await expect(readyRepairAction).toBeVisible()
  await expect(readyRepairAction).toBeEnabled()
  const readyRepairGate = actionRail.getByLabel('报告证据修复门禁说明')
  await expect(readyRepairGate.getByText('修复门禁已开放')).toBeVisible()
  await expect(readyRepairGate.getByText('READY 证据和文件级风险同时成立，允许生成受控修复候选。')).toBeVisible()
  await assertReportEvidenceDrawerReadability(page, drawer, viewportName, targetFile)
  await expectNoHorizontalOverflow(page, `${viewportName}:report-evidence-drawer`)
  const reportEvidenceRedaction = await assertReportEvidenceQuestionReferenceRedaction(page, drawer, viewportName)
  return {
    trustedLoop,
    reportCitationQuality,
    recommendedStep,
    mainPathGuide,
    actionBoard,
    reviewGate,
    evidenceProfileTraceMap,
    governanceTimelineReadability,
    apiDbTableReadability,
    priorityRail,
    codeChunkPreviewRedaction,
    reportEvidenceRedaction,
  }
}

async function openGapEvidenceDrawerAndAssert(page: Page, viewportName: string) {
  await page.goto(`/scan-tasks/${scanTaskId}`)
  await page.getByRole('tab', { name: /质量风险/ }).click()
  await page.getByRole('button', { name: '查看证据' }).nth(1).click()

  const drawer = page.getByRole('dialog', { name: '报告证据抽屉' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText('Missing code evidence').first()).toBeVisible()
  const chunkRegion = page.getByRole('region', { name: 'code_chunks 命中摘要' })
  await expect(chunkRegion).toBeVisible()
  await expect(chunkRegion.getByText('0 / 0 hits')).toBeVisible()
  await expect(chunkRegion.getByText('暂无代码片段命中')).toBeVisible()
  const citationReadiness = page.getByRole('region', { name: '引用质量预检' })
  await expect(citationReadiness).toBeVisible()
  await expect(citationReadiness.getByText('GAP', { exact: true }).first()).toBeVisible()
  await expect(citationReadiness.getByText('引用质量存在缺口')).toBeVisible()
  const handoffSummary = drawer.getByRole('region', { name: '报告证据交接包' })
  await expect(handoffSummary).toBeVisible()
  await expect(handoffSummary.getByText(`Scan #${scanTaskId}`)).toBeVisible()
  await expect(handoffSummary.getByText('Missing code evidence')).toBeVisible()
  await expect(handoffSummary.getByText(gapEvidenceFile)).toBeVisible()
  await expect(handoffSummary.getByText('99', { exact: true })).toBeVisible()
  await expect(handoffSummary.getByText('GAP', { exact: true })).toBeVisible()
  await expect(handoffSummary.getByText('0 hits')).toBeVisible()
  await expect(handoffSummary.getByText('0%')).toBeVisible()
  await expect(handoffSummary.getByText('PRIMARY 主证据缺失')).toBeVisible()
  await expect(handoffSummary.getByText('只能追问/复制，修复候选不放行')).toBeVisible()
  const actionRail = drawer.getByRole('region', { name: '报告证据下一步动作' })
  await expect(actionRail).toBeVisible()
  await expect(actionRail.getByText('GAP', { exact: true })).toBeVisible()
  await expect(actionRail.getByText('先补证据，不直接生成修复候选')).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '基于此证据追问' })).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '复制证据引用' })).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  await expect(actionRail.getByRole('button', { name: '定位修复文件' })).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '定位修复文件' })).toBeDisabled()
  const gapRepairGate = actionRail.getByLabel('报告证据修复门禁说明')
  await expect(gapRepairGate.getByText('修复门禁未开放')).toBeVisible()
  await expect(gapRepairGate.getByText('缺少可用 code_chunks 主证据，暂不允许直接生成修复候选。')).toBeVisible()
  await assertReportEvidenceDrawerReadability(page, drawer, viewportName, gapEvidenceFile)
  await expectNoHorizontalOverflow(page, `${viewportName}:report-evidence-gap-action-rail`)
  return {
    viewportName,
    gapRepairHiddenOrDisabled: await actionRail.getByRole('button', { name: '生成修复候选' }).count() === 0
      && await actionRail.getByRole('button', { name: '定位修复文件' }).isDisabled(),
    repairGateBlockedReasonVisible: await gapRepairGate.getByText('缺少可用 code_chunks 主证据，暂不允许直接生成修复候选。').isVisible(),
    noHorizontalOverflow: true,
  }
}

async function openQaFromEvidenceAndAssert(page: Page, viewportName: string) {
  await page.getByRole('button', { name: '基于此证据追问' }).click()
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}.*tab=qa`))
  await expect(page).toHaveURL(new RegExp(`scanTaskId=${scanTaskId}`))
  const decodedUrl = decodeURIComponent(page.url())
  expect(decodedUrl, `${viewportName}: QA URL should retain safe report evidence marker`).toContain(reportEvidenceSafeMarker)
  expect(decodedUrl, `${viewportName}: QA URL should include redaction marker`).toContain('[REDACTED]')
  for (const secret of forbiddenReportEvidenceSecretSnippets) {
    expect(decodedUrl, `${viewportName}: QA URL must hide raw report evidence secret ${secret}`).not.toContain(secret)
  }
  await expect(page.getByRole('heading', { name: '代码问答与证据检索' })).toBeVisible()
  const evidenceContext = page.getByLabel('报告证据上下文')
  await expect(evidenceContext).toBeVisible()
  await expect(evidenceContext.getByText('报告证据来源桥')).toBeVisible()
  await expect(evidenceContext.getByText(`Scan #${scanTaskId}`)).toBeVisible()
  await expect(evidenceContext.getByText(evidenceTitle)).toBeVisible()
  await expect(evidenceContext.getByText(targetFile)).toBeVisible()
  await expect(evidenceContext.getByText(evidenceCategory)).toBeVisible()
  await expect(evidenceContext.getByText(evidenceSource)).toBeVisible()
  await expect(evidenceContext.getByText(`范围 ${evidenceLineRange}`).first()).toBeVisible()
  await expect(evidenceContext.getByText(reportEvidenceSafeMarker)).toBeVisible()
  await expect(evidenceContext.getByText('[REDACTED]')).toBeVisible()
  for (const secret of forbiddenReportEvidenceSecretSnippets) {
    await expect(evidenceContext, `${viewportName}: QA evidence bridge must hide ${secret}`).not.toContainText(secret)
    await expect(page.locator('body'), `${viewportName}: QA body must hide ${secret}`).not.toContainText(secret)
  }
  await expect(evidenceContext, `${viewportName}: QA evidence bridge should use structured range label instead of legacy Line text`).not.toContainText(`Line ${evidenceLineRange}`)
  await expect(evidenceContext.getByRole('button', { name: '回到扫描报告' })).toBeVisible()
  await expect(evidenceContext.getByRole('button', { name: '重新检索证据' })).toBeVisible()
  await expect(evidenceContext.getByRole('button', { name: '复制证据引用' })).toBeVisible()

  const qaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 15_000 })

  await page.getByRole('button', { name: '发送' }).click()
  const qaResponse = await qaResponsePromise
  const qaRequestPayload = JSON.parse(qaResponse.request().postData() || '{}')
  const qaBody = await qaResponse.json()
  const qaData = qaBody?.data || {}
  const citations = Array.isArray(qaData.answerCitations) ? qaData.answerCitations : []
  const chunks = Array.isArray(qaData.retrievedChunks) ? qaData.retrievedChunks : []
  const graphRelationCitationCount = citations.filter((citation: any) => String(citation?.evidenceReason || '').includes('Graph relation:')).length
  const graphRelationChunkCount = chunks.filter((chunk: any) => String(chunk?.evidenceReason || '').includes('Graph relation:')).length
  const citationCoverage = qaData.citationCoverage || {}
  const evidenceRoleDistribution = citationCoverage.evidenceRoleDistribution || {}
  const evidenceRoleStats = Array.isArray(evidenceRoleDistribution.roles) ? evidenceRoleDistribution.roles : []
  const evidenceRoleFiles = Array.isArray(evidenceRoleDistribution.files) ? evidenceRoleDistribution.files : []
  const claimCitationCoverage = qaData.claimCitationCoverage || {}
  const claimRoleDistribution = claimCitationCoverage.roleDistribution || {}
  const claimRoleStats = Array.isArray(claimRoleDistribution.roles) ? claimRoleDistribution.roles : []
  const claimRoleFiles = Array.isArray(claimRoleDistribution.files) ? claimRoleDistribution.files : []
  const crossFileSummaryCrossFileEvidenceSatisfied = Number(citationCoverage.uniqueEvidenceFileCount || 0) >= 2
  const crossFileSummaryCitationBindingSatisfied = Number(citationCoverage.requiredEvidenceFileCount || 0) > 0
    && Number(citationCoverage.citedRequiredEvidenceFileCount || 0) >= Number(citationCoverage.requiredEvidenceFileCount || 0)
    && Number(citationCoverage.primaryEvidenceFileCount || 0) > 0
    && Number(citationCoverage.citedPrimaryEvidenceFileCount || 0) >= Number(citationCoverage.primaryEvidenceFileCount || 0)
  const crossFileSummaryClaimBindingSatisfied = claimCitationCoverage.status === 'READY'
    && claimRoleDistribution.status === 'PRIMARY_BOUND'
    && Number(claimCitationCoverage.requiredClaimCount || 0) > 0
    && Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0) >= Number(claimCitationCoverage.requiredClaimCount || 0)

  expect(qaBody.code, `${viewportName}: QA response code must be SUCCESS`).toBe('SUCCESS')
  expect(qaRequestPayload.scanTaskId, `${viewportName}: QA request must stay scan-bound`).toBe(scanTaskId)
  expect(qaRequestPayload.evidenceRef?.filePath, `${viewportName}: QA request must include evidenceRef.filePath`).toBe(targetFile)
  expect(qaRequestPayload.evidenceRef?.category, `${viewportName}: QA request must preserve evidence category`).toBe(evidenceCategory)
  expect(qaRequestPayload.evidenceRef?.source, `${viewportName}: QA request must preserve evidence source`).toBe(evidenceSource)
  expect(qaRequestPayload.evidenceRef?.title, `${viewportName}: QA request must preserve evidence title`).toBe(evidenceTitle)
  expect(qaRequestPayload.evidenceRef?.lineNumber, `${viewportName}: QA request must not synthesize legacy lineNumber for start/end-only report evidence`).toBeUndefined()
  expect(qaRequestPayload.evidenceRef?.startLine, `${viewportName}: QA request must preserve evidence startLine`).toBe(evidenceStartLine)
  expect(qaRequestPayload.evidenceRef?.endLine, `${viewportName}: QA request must preserve evidence endLine`).toBe(evidenceEndLine)
  expect(qaData.scanTaskId, `${viewportName}: QA response must stay scan-bound`).toBe(scanTaskId)
  expect(qaData.sourceEvidenceRef?.filePath, `${viewportName}: QA response must echo sourceEvidenceRef.filePath`).toBe(targetFile)
  expect(qaData.sourceEvidenceRef?.category, `${viewportName}: QA response must echo sourceEvidenceRef.category`).toBe(evidenceCategory)
  expect(qaData.sourceEvidenceRef?.title, `${viewportName}: QA response must echo sourceEvidenceRef.title`).toBe(evidenceTitle)
  expect(qaData.sourceEvidenceRef?.lineNumber, `${viewportName}: QA response must keep start/end-only evidence without synthetic lineNumber`).toBeUndefined()
  expect(qaData.sourceEvidenceRef?.startLine, `${viewportName}: QA response must echo sourceEvidenceRef.startLine`).toBe(evidenceStartLine)
  expect(qaData.sourceEvidenceRef?.endLine, `${viewportName}: QA response must echo sourceEvidenceRef.endLine`).toBe(evidenceEndLine)
  expect(qaData.sourceEvidenceMatched, `${viewportName}: QA response must expose sourceEvidenceMatched`).toBe(true)
  expect(qaData.sourceEvidenceMatchType, `${viewportName}: QA response must expose source evidence anchor`).toBe('REPORT_LINE_ANCHOR')
  expect(citations.length, `${viewportName}: answer-level citations must be returned`).toBeGreaterThan(0)
  expect(chunks.length, `${viewportName}: retrieved chunks must be returned`).toBeGreaterThan(0)
  expect(qaData.groundingStatus, `${viewportName}: grounding status must prove verification`).toBe('VERIFIED')
  expect(['DIRECT_VERIFIED', 'RETRY_VERIFIED', 'FALLBACK_CITED'], `${viewportName}: citation enforcement must prove usable citation`).toContain(qaData.citationEnforcementStatus)
  expect(['DIRECT_VERIFIED', 'RETRY_VERIFIED', 'FALLBACK_PRIMARY_CITED'], `${viewportName}: citation enforcement reason must prove usable cited answer`).toContain(qaData.citationEnforcementReason)
  expect(citations.some((citation: any) => citation?.citedByAnswer === true), `${viewportName}: at least one citation must be cited by answer`).toBe(true)
  expect(citationCoverage.status, `${viewportName}: verified QA should expose partial citation coverage when not every candidate is cited`).toBe('PARTIAL')
  expect(citationCoverage.totalEvidenceCount, `${viewportName}: citation coverage total should match answer citations`).toBe(citations.length)
  expect(citationCoverage.citedEvidenceCount, `${viewportName}: citation coverage cited count should match cited citations`).toBe(1)
  expect(citationCoverage.uncitedCandidateCount, `${viewportName}: citation coverage should count uncited candidates`).toBe(1)
  expect(citationCoverage.repairCandidateCount, `${viewportName}: citation coverage should expose repair candidates`).toBe(1)
  expect(Number(citationCoverage.requiredEvidenceCount || 0), `${viewportName}: verified QA must expose required evidence count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.citedRequiredEvidenceCount || 0), `${viewportName}: verified QA must cite every required evidence item`).toBe(Number(citationCoverage.requiredEvidenceCount || 0))
  expect(Number(citationCoverage.requiredEvidenceFileCount || 0), `${viewportName}: verified QA must expose required evidence file count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.citedRequiredEvidenceFileCount || 0), `${viewportName}: verified QA must cite every required evidence file`).toBe(Number(citationCoverage.requiredEvidenceFileCount || 0))
  expect(Number(citationCoverage.primaryEvidenceFileCount || 0), `${viewportName}: verified QA must expose primary evidence file count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.citedPrimaryEvidenceFileCount || 0), `${viewportName}: verified QA must cite every primary evidence file`).toBe(Number(citationCoverage.primaryEvidenceFileCount || 0))
  expect(Number(citationCoverage.uncitedPrimaryEvidenceFileCount || 0), `${viewportName}: verified QA must not leave primary evidence files uncited`).toBe(0)
  expect(Number(citationCoverage.contextEvidenceFileCount || 0), `${viewportName}: verified QA must expose adjacent context file count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.uncitedContextEvidenceCount || 0), `${viewportName}: verified QA must expose uncited adjacent context evidence gap`).toBeGreaterThan(0)
  expect(Number(citationCoverage.uncitedContextEvidenceFileCount || 0), `${viewportName}: verified QA must expose uncited adjacent context file gap`).toBeGreaterThan(0)
  expect(Number(citationCoverage.requiredEvidenceCoveragePercent || 0), `${viewportName}: verified QA must fully cover required evidence`).toBeGreaterThanOrEqual(100)
  expect(typeof citationCoverage.coverageScope === 'string' && citationCoverage.coverageScope.length > 0, `${viewportName}: verified QA must expose required coverage scope`).toBe(true)
  expect(evidenceRoleDistribution.status, `${viewportName}: verified QA must expose evidence role distribution status`).toBe('MIXED_PRIMARY_CONTEXT')
  expect(Number(evidenceRoleDistribution.totalFileCount || 0), `${viewportName}: role distribution total files must match coverage`).toBe(Number(citationCoverage.uniqueEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedFileCount || 0), `${viewportName}: role distribution cited files must match coverage`).toBe(Number(citationCoverage.citedEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.primaryFileCount || 0), `${viewportName}: role distribution primary files must match coverage`).toBe(Number(citationCoverage.primaryEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedPrimaryFileCount || 0), `${viewportName}: role distribution cited primary files must match coverage`).toBe(Number(citationCoverage.citedPrimaryEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.contextFileCount || 0), `${viewportName}: role distribution context files must match coverage`).toBe(Number(citationCoverage.contextEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedContextFileCount || 0), `${viewportName}: role distribution cited context files must match coverage`).toBe(Number(citationCoverage.citedContextEvidenceFileCount || 0))
  expect(evidenceRoleStats.some((role: any) => role?.role === 'PRIMARY'), `${viewportName}: role distribution must include PRIMARY`).toBe(true)
  expect(evidenceRoleStats.some((role: any) => role?.role === 'ADJACENT_CONTEXT'), `${viewportName}: role distribution must include ADJACENT_CONTEXT`).toBe(true)
  expect(evidenceRoleFiles.some((file: any) => file?.filePath === targetFile), `${viewportName}: role distribution must include target file`).toBe(true)
  expect(claimCitationCoverage.status, `${viewportName}: verified QA must expose ready claim citation quality`).toBe('READY')
  expect(claimCitationCoverage.readyForRepair, `${viewportName}: verified QA must expose explicit repair readiness`).toBe(true)
  expect(claimCitationCoverage.readinessReason, `${viewportName}: verified QA must expose the primary-bound readiness reason`).toBe('PRIMARY_BOUND_READY')
  expect(Number(claimCitationCoverage.requiredClaimCount || 0), `${viewportName}: verified QA must expose required claims`).toBeGreaterThan(0)
  expect(Number(claimCitationCoverage.citedRequiredClaimCount || 0), `${viewportName}: verified QA must cite every required claim`).toBe(Number(claimCitationCoverage.requiredClaimCount || 0))
  expect(Number(claimCitationCoverage.invalidCitationClaimCount || 0), `${viewportName}: verified QA must not contain invalid citation labels`).toBe(0)
  expect(Number(claimCitationCoverage.validCitationFileCount || 0), `${viewportName}: verified QA must expose cited claim file coverage`).toBeGreaterThan(0)
  expect(Number(claimCitationCoverage.requiredClaimCitationFileCount || 0), `${viewportName}: verified QA must expose required claim file coverage`).toBeGreaterThan(0)
  expect(claimRoleDistribution.status, `${viewportName}: verified QA must expose primary-bound claim role distribution`).toBe('PRIMARY_BOUND')
  expect(Number(claimRoleDistribution.requiredClaimCount || 0), `${viewportName}: claim role distribution must mirror required claims`).toBe(Number(claimCitationCoverage.requiredClaimCount || 0))
  expect(Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0), `${viewportName}: verified QA must bind every required claim to PRIMARY`).toBe(Number(claimCitationCoverage.requiredClaimCount || 0))
  expect(Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0), `${viewportName}: verified QA must not rely on context-only claims`).toBe(0)
  expect(Number(claimRoleDistribution.requiredUnknownOnlyClaimCount || 0), `${viewportName}: verified QA must not rely on unknown role claims`).toBe(0)
  expect(Number(claimRoleDistribution.unbackedRequiredClaimCount || 0), `${viewportName}: verified QA must not have unbacked required claims`).toBe(0)
  expect(Number(claimRoleDistribution.invalidRequiredClaimCount || 0), `${viewportName}: verified QA must not have invalid required claims`).toBe(0)
  expect(Number(claimRoleDistribution.validCitationFileCount || 0), `${viewportName}: claim role files must match valid claim files`).toBe(Number(claimCitationCoverage.validCitationFileCount || 0))
  expect(Number(claimRoleDistribution.requiredClaimCitationFileCount || 0), `${viewportName}: claim role required files must match parent`).toBe(Number(claimCitationCoverage.requiredClaimCitationFileCount || 0))
  expect(Number(claimRoleDistribution.requiredPrimaryFileCount || 0), `${viewportName}: verified QA must expose primary claim files`).toBeGreaterThan(0)
  expect(claimRoleStats.some((role: any) => role?.role === 'PRIMARY'), `${viewportName}: claim role distribution must include PRIMARY`).toBe(true)
  expect(claimRoleFiles.some((file: any) => file?.filePath === targetFile), `${viewportName}: claim role distribution must include target file`).toBe(true)
  expect(citations.every((citation: any) => citation?.scanTaskId === scanTaskId), `${viewportName}: citations must stay scan-bound`).toBe(true)
  expect(chunks.every((chunk: any) => chunk?.scanTaskId === scanTaskId), `${viewportName}: retrieved chunks must stay scan-bound`).toBe(true)
  expect(citations.some((citation: any) => citation?.filePath === targetFile), `${viewportName}: expected report evidence file must be cited`).toBe(true)
  expect(graphRelationCitationCount, `${viewportName}: relation-aware citation evidence reason must be present`).toBeGreaterThan(0)
  expect(graphRelationChunkCount, `${viewportName}: relation-aware retrieved chunk evidence reason must be present`).toBeGreaterThan(0)
  expect(citations.some((citation: any) => citation?.contextRole === 'ADJACENT_CONTEXT' && String(citation?.evidenceReason || '').includes('Graph relation:')), `${viewportName}: graph relation reason must stay on adjacent context evidence`).toBe(true)

  await expect(page.getByText('引用已验证').first()).toBeVisible()
  await expect(page.getByText('首次引用已验证').first()).toBeVisible()
  await expect(page.getByText('必需证据覆盖 1/1 (100%)').first()).toBeVisible()
  await expect(page.getByLabel('QA 可信度摘要').first()).toBeVisible()
  await expect(page.getByText('可采信并进入修复复核').first()).toBeVisible()
  await expect(page.getByText('可信度结论').first()).toBeVisible()
  const sourceLocationConfidence = page.getByLabel('来源定位可信度').first()
  await expect(sourceLocationConfidence, `${viewportName}: source location confidence must be visible for verified QA`).toBeVisible()
  await expect(sourceLocationConfidence.getByText('来源定位可信度')).toBeVisible()
  await expect(sourceLocationConfidence.getByText('来源定位可信', { exact: true })).toBeVisible()
  await expect(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-head').getByText('已绑定', { exact: true })).toBeVisible()
  await expect(sourceLocationConfidence.getByText(`第 ${evidenceLineRange} 行`)).toBeVisible()
  await expect(sourceLocationConfidence.getByText('回答引用覆盖来源文件')).toBeVisible()
  await expect(sourceLocationConfidence.getByText('引用文件')).toBeVisible()
  await expect(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-metrics').getByText('已绑定', { exact: true })).toBeVisible()
  const sourceMatchRelease = page.getByLabel('来源文件匹配说明').first()
  await expect(sourceMatchRelease, `${viewportName}: source file match release checklist must be visible`).toBeVisible()
  await expect(sourceMatchRelease.getByText('修复候选放行条件')).toBeVisible()
  await expect(sourceMatchRelease.getByText('满足修复候选放行')).toBeVisible()
  await expect(sourceMatchRelease.getByText(`${targetFile}:${evidenceLineRange}`).first()).toBeVisible()
  await expect(sourceMatchRelease.getByText(`${targetFile}:24-42`).first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('行级锚点').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('已满足：行级锚点').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('已满足：主张 PRIMARY 绑定').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('下一步：可进入修复候选复核。')).toBeVisible()
  await expect(page.getByLabel('跨文件引用摘要').first()).toBeVisible()
  await expect(page.getByText('跨文件引用结论').first()).toBeVisible()
  await expect(page.getByText('跨文件引用可采信').first()).toBeVisible()
  await expect(page.getByText('上下文缺口 1 条 / 1 文件').first()).toBeVisible()
  await expect(page.getByLabel('上下文引用缺口').first()).toBeVisible()
  await expect(page.getByLabel('主张引用质量').first()).toBeVisible()
  await expect(page.getByLabel('主张证据角色分布').first()).toBeVisible()
  await expect(page.getByLabel('证据角色分布').first()).toBeVisible()
  await expect(page.getByText('证据角色分布').first()).toBeVisible()
  await expect(page.getByText('主张已绑定引用').first()).toBeVisible()
  await expect(page.getByText('可修复证据 1').first()).toBeVisible()
  await expect(page.getByLabel('修复证据门禁').first().getByText('READY', { exact: true })).toBeVisible()
  await expect(page.getByLabel('修复证据门禁').first().getByText('来源锚点 行级锚点')).toBeVisible()
  await expect(page.getByText(`Scan #${scanTaskId}`).first()).toBeVisible()
  const citationRegion = page.getByLabel('回答引用证据').first()
  await expect(citationRegion).toBeVisible()
  await expect(citationRegion.getByText('C1')).toBeVisible()
  await expect(citationRegion.getByText(`${targetFile}:24-42`)).toBeVisible()
  await expect(citationRegion.getByText('回答已引用')).toBeVisible()
  await expect(citationRegion.getByText('主证据')).toBeVisible()
  await expect(citationRegion.getByText('CONTROLLER', { exact: true })).toBeVisible()
  await expect(citationRegion.getByText('相关分 91')).toBeVisible()
  await expect(citationRegion.getByLabel('引用证据卡片 C1').getByText('证据说明')).toBeVisible()
  await expect(citationRegion.getByText('Controller handler matches the reported endpoint and risk file.')).toBeVisible()
  await expect(citationRegion.getByText('Graph relation: ChatController CALLS ChatService.')).toBeVisible()
  await expect(citationRegion.getByRole('button', { name: '复制引用' }).first()).toBeVisible()
  const deepEvidenceReadability = await assertQaDeepEvidenceCardReadability(page, viewportName, 'ready')
  await expectNoHorizontalOverflow(page, `${viewportName}:report-evidence-qa-citation`)

  return {
    responseStatus: qaResponse.status(),
    resultCount: Number(qaData.resultCount || chunks.length || 0),
    citationCount: citations.length,
    coverageStatus: citationCoverage.status || '',
    coveragePercent: Number(citationCoverage.coveragePercent || 0),
    coverageTotalEvidenceCount: Number(citationCoverage.totalEvidenceCount || 0),
    coverageCitedEvidenceCount: Number(citationCoverage.citedEvidenceCount || 0),
    coverageUncitedCandidateCount: Number(citationCoverage.uncitedCandidateCount || 0),
    coverageRepairCandidateCount: Number(citationCoverage.repairCandidateCount || 0),
    coverageUniqueEvidenceFileCount: Number(citationCoverage.uniqueEvidenceFileCount || 0),
    coverageCitedEvidenceFileCount: Number(citationCoverage.citedEvidenceFileCount || 0),
    coveragePrimaryEvidenceCount: Number(citationCoverage.primaryEvidenceCount || 0),
    coverageCitedPrimaryEvidenceCount: Number(citationCoverage.citedPrimaryEvidenceCount || 0),
    coverageUncitedPrimaryEvidenceCount: Number(citationCoverage.uncitedPrimaryEvidenceCount || 0),
    coveragePrimaryEvidenceFileCount: Number(citationCoverage.primaryEvidenceFileCount || 0),
    coverageCitedPrimaryEvidenceFileCount: Number(citationCoverage.citedPrimaryEvidenceFileCount || 0),
    coverageUncitedPrimaryEvidenceFileCount: Number(citationCoverage.uncitedPrimaryEvidenceFileCount || 0),
    coverageContextEvidenceCount: Number(citationCoverage.contextEvidenceCount || 0),
    coverageCitedContextEvidenceCount: Number(citationCoverage.citedContextEvidenceCount || 0),
    coverageUncitedContextEvidenceCount: Number(citationCoverage.uncitedContextEvidenceCount || 0),
    coverageContextEvidenceFileCount: Number(citationCoverage.contextEvidenceFileCount || 0),
    coverageCitedContextEvidenceFileCount: Number(citationCoverage.citedContextEvidenceFileCount || 0),
    coverageUncitedContextEvidenceFileCount: Number(citationCoverage.uncitedContextEvidenceFileCount || 0),
    coverageRequiredEvidenceCount: Number(citationCoverage.requiredEvidenceCount || 0),
    coverageCitedRequiredEvidenceCount: Number(citationCoverage.citedRequiredEvidenceCount || 0),
    coverageRequiredEvidenceFileCount: Number(citationCoverage.requiredEvidenceFileCount || 0),
    coverageCitedRequiredEvidenceFileCount: Number(citationCoverage.citedRequiredEvidenceFileCount || 0),
    coverageRequiredEvidenceCoveragePercent: Number(citationCoverage.requiredEvidenceCoveragePercent || 0),
    coverageScope: String(citationCoverage.coverageScope || ''),
    coverageRoleDistributionStatus: String(evidenceRoleDistribution.status || ''),
    coverageRoleTotalFileCount: Number(evidenceRoleDistribution.totalFileCount || 0),
    coverageRoleCitedFileCount: Number(evidenceRoleDistribution.citedFileCount || 0),
    coverageRolePrimaryFileCount: Number(evidenceRoleDistribution.primaryFileCount || 0),
    coverageRoleCitedPrimaryFileCount: Number(evidenceRoleDistribution.citedPrimaryFileCount || 0),
    coverageRoleContextFileCount: Number(evidenceRoleDistribution.contextFileCount || 0),
    coverageRoleCitedContextFileCount: Number(evidenceRoleDistribution.citedContextFileCount || 0),
    coverageRoleCount: evidenceRoleStats.length,
    coverageRoleFileEntryCount: evidenceRoleFiles.length,
    claimCitationStatus: String(claimCitationCoverage.status || ''),
    claimReadyForRepair: claimCitationCoverage.readyForRepair === true,
    claimReadinessReason: String(claimCitationCoverage.readinessReason || ''),
    claimCoveragePercent: Number(claimCitationCoverage.claimCoveragePercent || 0),
    claimRequiredClaimCount: Number(claimCitationCoverage.requiredClaimCount || 0),
    claimCitedRequiredClaimCount: Number(claimCitationCoverage.citedRequiredClaimCount || 0),
    claimUncitedRequiredClaimCount: Number(claimCitationCoverage.uncitedRequiredClaimCount || 0),
    claimInvalidCitationClaimCount: Number(claimCitationCoverage.invalidCitationClaimCount || 0),
    claimValidCitationFileCount: Number(claimCitationCoverage.validCitationFileCount || 0),
    claimRequiredClaimCitationFileCount: Number(claimCitationCoverage.requiredClaimCitationFileCount || 0),
    crossFileSummaryVisible: true,
    crossFileSummaryTone: 'warning',
    crossFileSummaryStatus: String(evidenceRoleDistribution.status || 'NO_EVIDENCE'),
    crossFileSummaryContextGapVisible: true,
    crossFileSummaryContextGapEvidence: Number(citationCoverage.uncitedContextEvidenceCount || 0),
    crossFileSummaryContextGapFiles: Number(citationCoverage.uncitedContextEvidenceFileCount || 0),
    crossFileSummaryCrossFileEvidenceSatisfied,
    crossFileSummaryCitationBindingSatisfied,
    crossFileSummaryClaimBindingSatisfied,
    crossFileSummaryCurrentScanOnly: true,
    crossFileSummarySourceEvidenceMatchType: String(qaData.sourceEvidenceMatchType || ''),
    claimRoleDistributionStatus: String(claimRoleDistribution.status || ''),
    claimRoleRequiredClaimCount: Number(claimRoleDistribution.requiredClaimCount || 0),
    claimRoleRequiredPrimaryBoundClaimCount: Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0),
    claimRoleRequiredContextOnlyClaimCount: Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0),
    claimRoleRequiredUnknownOnlyClaimCount: Number(claimRoleDistribution.requiredUnknownOnlyClaimCount || 0),
    claimRoleUnbackedRequiredClaimCount: Number(claimRoleDistribution.unbackedRequiredClaimCount || 0),
    claimRoleInvalidRequiredClaimCount: Number(claimRoleDistribution.invalidRequiredClaimCount || 0),
    claimRoleValidCitationFileCount: Number(claimRoleDistribution.validCitationFileCount || 0),
    claimRoleRequiredClaimCitationFileCount: Number(claimRoleDistribution.requiredClaimCitationFileCount || 0),
    claimRoleRequiredPrimaryFileCount: Number(claimRoleDistribution.requiredPrimaryFileCount || 0),
    claimRoleCount: claimRoleStats.length,
    claimRoleFileEntryCount: claimRoleFiles.length,
    groundingStatus: qaData.groundingStatus || '',
    citationEnforcementStatus: qaData.citationEnforcementStatus || '',
    citationEnforcementReason: qaData.citationEnforcementReason || '',
    graphRelationEvidenceReasonCitationCount: graphRelationCitationCount,
    graphRelationEvidenceReasonChunkCount: graphRelationChunkCount,
    graphRelationEvidenceReasonAdjacentContext: citations.some((citation: any) => citation?.contextRole === 'ADJACENT_CONTEXT' && String(citation?.evidenceReason || '').includes('Graph relation:')),
    graphRelationEvidenceReasonVisible: true,
    citedChunkCount: citations.filter((citation: any) => citation?.citedByAnswer === true).length,
    expectedEvidenceFileVisible: citations.some((citation: any) => citation?.filePath === targetFile),
    evidenceRefRequestBound: qaRequestPayload.evidenceRef?.filePath === targetFile,
    evidenceRefResponseBound: qaData.sourceEvidenceRef?.filePath === targetFile,
    evidenceRefTitleBound: qaRequestPayload.evidenceRef?.title === evidenceTitle && qaData.sourceEvidenceRef?.title === evidenceTitle,
    evidenceRefLineBound: qaRequestPayload.evidenceRef?.lineNumber === undefined
      && qaData.sourceEvidenceRef?.lineNumber === undefined
      && qaRequestPayload.evidenceRef?.startLine === evidenceStartLine
      && qaRequestPayload.evidenceRef?.endLine === evidenceEndLine
      && qaData.sourceEvidenceRef?.startLine === evidenceStartLine
      && qaData.sourceEvidenceRef?.endLine === evidenceEndLine,
    sourceLocationConfidenceReadyVisible: true,
    repairEvidenceGateReadyVisible: true,
    evidenceRefContextVisible: true,
    deepEvidenceReadability,
  }
}

async function assertQaEvidenceLineRangeConflictPriority(page: Page, viewportName: string) {
  const params = new URLSearchParams({
    tab: 'qa',
    scanTaskId: String(scanTaskId),
    question: '验证报告证据结构化行范围优先级',
    evidenceCategory,
    evidenceSource,
    evidenceTitle,
    evidenceSummary: 'conflict priority smoke',
    evidenceFile: targetFile,
    evidenceLine: '999',
    evidenceStartLine: String(evidenceStartLine),
    evidenceEndLine: String(evidenceEndLine),
  })
  await page.goto(`/projects/${projectId}?${params.toString()}`)
  await expect(page.getByRole('heading', { name: '代码问答与证据检索' })).toBeVisible()
  const evidenceContext = page.getByLabel('报告证据上下文')
  await expect(evidenceContext, `${viewportName}: QA evidence bridge must render conflict-priority context`).toBeVisible()
  await expect(evidenceContext.getByText(`范围 ${evidenceLineRange}`).first(), `${viewportName}: structured start/end range must win over legacy evidenceLine`).toBeVisible()
  await expect(evidenceContext, `${viewportName}: legacy evidenceLine must not be rendered when structured start/end exists`).not.toContainText('999')
  await expect(evidenceContext).toContainText(targetFile)
  await expectNoHorizontalOverflow(page, `${viewportName}:qa-evidence-line-range-conflict-priority`)

  return {
    viewportName,
    status: 'OK',
    legacyLineNumber: '999',
    visibleRange: evidenceLineRange,
    structuredRangePriority: true,
    legacyLineHidden: true,
    noHorizontalOverflow: true,
  }
}

async function submitUnverifiedQaAndAssert(page: Page, viewportName: string, mode: 'uncited' | 'fake-noise' = 'uncited') {
  await page.getByPlaceholder(/输入问题/).fill(mode === 'fake-noise'
    ? '请模拟假引用噪声，确认代码块日志堆栈里的 [C1] 不得计入引用'
    : '请模拟未验证态回归，确认引用状态需要人工复核')
  const qaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 15_000 })

  await page.getByRole('button', { name: '发送' }).click()
  const qaResponse = await qaResponsePromise
  const qaRequestPayload = JSON.parse(qaResponse.request().postData() || '{}')
  const qaBody = await qaResponse.json()
  const qaData = qaBody?.data || {}
  const citations = Array.isArray(qaData.answerCitations) ? qaData.answerCitations : []
  const chunks = Array.isArray(qaData.retrievedChunks) ? qaData.retrievedChunks : []
  const citationCoverage = qaData.citationCoverage || {}
  const evidenceRoleDistribution = citationCoverage.evidenceRoleDistribution || {}
  const evidenceRoleStats = Array.isArray(evidenceRoleDistribution.roles) ? evidenceRoleDistribution.roles : []
  const evidenceRoleFiles = Array.isArray(evidenceRoleDistribution.files) ? evidenceRoleDistribution.files : []
  const claimCitationCoverage = qaData.claimCitationCoverage || {}
  const claimRoleDistribution = claimCitationCoverage.roleDistribution || {}
  const claimRoleStats = Array.isArray(claimRoleDistribution.roles) ? claimRoleDistribution.roles : []
  const claimRoleFiles = Array.isArray(claimRoleDistribution.files) ? claimRoleDistribution.files : []
  const crossFileSummaryCrossFileEvidenceSatisfied = Number(citationCoverage.uniqueEvidenceFileCount || 0) >= 2
  const crossFileSummaryCitationBindingSatisfied = Number(citationCoverage.requiredEvidenceFileCount || 0) > 0
    && Number(citationCoverage.citedRequiredEvidenceFileCount || 0) >= Number(citationCoverage.requiredEvidenceFileCount || 0)
    && Number(citationCoverage.primaryEvidenceFileCount || 0) > 0
    && Number(citationCoverage.citedPrimaryEvidenceFileCount || 0) >= Number(citationCoverage.primaryEvidenceFileCount || 0)
  const crossFileSummaryClaimBindingSatisfied = claimCitationCoverage.status === 'READY'
    && claimRoleDistribution.status === 'PRIMARY_BOUND'
    && Number(claimCitationCoverage.requiredClaimCount || 0) > 0
    && Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0) >= Number(claimCitationCoverage.requiredClaimCount || 0)

  expect(qaBody.code, `${viewportName}: unverified QA response code must be SUCCESS`).toBe('SUCCESS')
  if (mode === 'fake-noise') {
    expect(String(qaData.answer || ''), `${viewportName}: fake citation noise answer must include fenced code noise`).toContain('fake citation marker in code must be ignored [C1]')
    expect(String(qaData.answer || ''), `${viewportName}: fake citation noise answer must include log noise`).toContain('ERROR AuthService failed token validation [C1]')
    expect(String(qaData.answer || ''), `${viewportName}: fake citation noise answer must include exception noise`).toContain('IllegalStateException')
    expect(String(qaData.answer || ''), `${viewportName}: fake citation noise answer must include inline literal noise`).toContain('`[C1]`')
  }
  expect(qaRequestPayload.scanTaskId, `${viewportName}: unverified QA request must stay scan-bound`).toBe(scanTaskId)
  expect(qaRequestPayload.evidenceRef?.filePath, `${viewportName}: unverified QA request must keep evidenceRef.filePath`).toBe(targetFile)
  expect(qaData.scanTaskId, `${viewportName}: unverified QA response must stay scan-bound`).toBe(scanTaskId)
  expect(qaData.groundingStatus, `${viewportName}: unverified QA must expose partial grounding`).toBe('PARTIAL')
  expect(qaData.citationEnforcementStatus, `${viewportName}: unverified QA must expose retry failure`).toBe('RETRY_FAILED')
  expect(qaData.citationEnforcementReason, `${viewportName}: unverified QA must expose machine-readable retry failure reason`).toBe(mode === 'fake-noise' ? 'NO_VALID_CITATION_LABEL' : 'UNCITED_REQUIRED_CLAIM')
  expect(qaData.sourceEvidenceRef?.filePath, `${viewportName}: unverified QA response must echo sourceEvidenceRef.filePath`).toBe(targetFile)
  expect(citations.length, `${viewportName}: unverified QA must still return candidate citations`).toBeGreaterThan(0)
  expect(chunks.length, `${viewportName}: unverified QA must still return retrieved chunks`).toBeGreaterThan(0)
  expect(citations.every((citation: any) => citation?.scanTaskId === scanTaskId), `${viewportName}: unverified citations must stay scan-bound`).toBe(true)
  expect(chunks.every((chunk: any) => chunk?.scanTaskId === scanTaskId), `${viewportName}: unverified retrieved chunks must stay scan-bound`).toBe(true)
  expect(citations.some((citation: any) => citation?.citedByAnswer === false), `${viewportName}: unverified QA must mark uncited candidate evidence`).toBe(true)
  expect(citationCoverage.status, `${viewportName}: unverified QA should expose no cited coverage`).toBe('NONE')
  expect(citationCoverage.totalEvidenceCount, `${viewportName}: unverified coverage total should match answer citations`).toBe(citations.length)
  expect(citationCoverage.citedEvidenceCount, `${viewportName}: unverified coverage cited count should be zero`).toBe(0)
  expect(citationCoverage.uncitedCandidateCount, `${viewportName}: unverified coverage should count uncited candidates`).toBe(citations.length)
  expect(citationCoverage.repairCandidateCount, `${viewportName}: unverified coverage must not expose repair candidates`).toBe(0)
  expect(Number(citationCoverage.requiredEvidenceCount || 0), `${viewportName}: unverified QA must still expose required evidence count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.citedRequiredEvidenceCount || 0), `${viewportName}: unverified QA must not cite required evidence`).toBe(0)
  expect(Number(citationCoverage.requiredEvidenceFileCount || 0), `${viewportName}: unverified QA must still expose required evidence file count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.citedRequiredEvidenceFileCount || 0), `${viewportName}: unverified QA must not cite required evidence files`).toBe(0)
  expect(Number(citationCoverage.citedPrimaryEvidenceFileCount || 0), `${viewportName}: unverified QA must not cite primary evidence files`).toBe(0)
  expect(Number(citationCoverage.requiredEvidenceCoveragePercent || 0), `${viewportName}: unverified QA required evidence coverage must be zero`).toBe(0)
  expect(typeof citationCoverage.coverageScope === 'string' && citationCoverage.coverageScope.length > 0, `${viewportName}: unverified QA must expose required coverage scope`).toBe(true)
  expect(evidenceRoleDistribution.status, `${viewportName}: unverified QA must still expose evidence role distribution status`).toBe('MIXED_PRIMARY_CONTEXT')
  expect(Number(evidenceRoleDistribution.totalFileCount || 0), `${viewportName}: unverified role distribution total files must match coverage`).toBe(Number(citationCoverage.uniqueEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedFileCount || 0), `${viewportName}: unverified role distribution cited files must stay zero`).toBe(0)
  expect(Number(evidenceRoleDistribution.primaryFileCount || 0), `${viewportName}: unverified role distribution primary files must match coverage`).toBe(Number(citationCoverage.primaryEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedPrimaryFileCount || 0), `${viewportName}: unverified role distribution cited primary files must stay zero`).toBe(0)
  expect(Number(evidenceRoleDistribution.contextFileCount || 0), `${viewportName}: unverified role distribution context files must match coverage`).toBe(Number(citationCoverage.contextEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedContextFileCount || 0), `${viewportName}: unverified role distribution cited context files must stay zero`).toBe(0)
  expect(evidenceRoleStats.every((role: any) => Number(role?.citedEvidenceCount || 0) === 0 && Number(role?.citedFileCount || 0) === 0), `${viewportName}: unverified role distribution must not claim cited roles`).toBe(true)
  expect(evidenceRoleFiles.some((file: any) => file?.filePath === targetFile), `${viewportName}: unverified role distribution must include target file`).toBe(true)
  expect(claimCitationCoverage.status, `${viewportName}: unverified QA must expose review claim citation quality`).toBe('REVIEW')
  expect(Number(claimCitationCoverage.requiredClaimCount || 0), `${viewportName}: unverified QA must expose required claims`).toBeGreaterThan(0)
  expect(Number(claimCitationCoverage.citedRequiredClaimCount || 0), `${viewportName}: unverified QA must not cite required claims`).toBe(0)
  expect(Number(claimCitationCoverage.uncitedRequiredClaimCount || 0), `${viewportName}: unverified QA must count uncited required claims`).toBeGreaterThan(0)
  expect(Number(claimCitationCoverage.validCitationFileCount || 0), `${viewportName}: unverified QA must not claim cited files`).toBe(0)
  expect(Number(claimCitationCoverage.requiredClaimCitationFileCount || 0), `${viewportName}: unverified QA must not claim required cited files`).toBe(0)
  expect(claimRoleDistribution.status, `${viewportName}: unverified QA must expose unbacked claim role distribution`).toBe('REVIEW_UNCITED')
  expect(Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0), `${viewportName}: unverified QA must not claim PRIMARY-bound required claims`).toBe(0)
  expect(Number(claimRoleDistribution.requiredPrimaryFileCount || 0), `${viewportName}: unverified QA must not claim required primary files`).toBe(0)
  expect(Number(claimRoleDistribution.validCitationFileCount || 0), `${viewportName}: unverified claim role distribution must not claim valid files`).toBe(0)
  expect(Number(claimRoleDistribution.requiredClaimCitationFileCount || 0), `${viewportName}: unverified claim role distribution must not claim required cited files`).toBe(0)
  expect(claimRoleStats.length, `${viewportName}: unverified claim role distribution must not expose cited roles`).toBe(0)
  expect(claimRoleFiles.length, `${viewportName}: unverified claim role distribution must not expose cited files`).toBe(0)
  expect(citations.some((citation: any) => citation?.filePath === targetFile), `${viewportName}: unverified QA must keep the expected report evidence file`).toBe(true)

  await expect(page.getByText('引用需复核').last()).toBeVisible()
  await expect(page.getByText('引用需人工复核').last()).toBeVisible()
  await expect(page.getByText('必需证据覆盖 0/1 (0%)').last()).toBeVisible()
  await expect(page.getByLabel('QA 可信度摘要').last()).toBeVisible()
  await expect(page.getByText('不可直接采信').last()).toBeVisible()
  await expect(page.getByLabel('跨文件引用摘要').last()).toBeVisible()
  await expect(page.getByText('跨文件引用结论').last()).toBeVisible()
  await expect(page.getByText('跨文件引用不足').last()).toBeVisible()
  await expect(page.getByLabel('主张引用质量').last()).toBeVisible()
  await expect(page.getByLabel('主张证据角色分布').last()).toBeVisible()
  await expect(page.getByLabel('证据角色分布').last()).toBeVisible()
  await expect(page.getByText('主张引用需要复核').last()).toBeVisible()
  await expect(page.getByText('可修复证据 0').last()).toBeVisible()
  await expect(page.getByLabel('修复证据门禁').last().getByText('BLOCKED', { exact: true })).toBeVisible()
  const citationRegions = page.getByLabel('回答引用证据')
  const citationRegion = citationRegions.nth(await citationRegions.count() - 1)
  await expect(citationRegion).toBeVisible()
  await expect(citationRegion.getByText('C1')).toBeVisible()
  await expect(citationRegion.getByText(`${targetFile}:24-42`)).toBeVisible()
  await expect(citationRegion.getByText('候选证据').first()).toBeVisible()
  await expect(citationRegion.getByText('主证据')).toBeVisible()
  await expect(citationRegion.getByText('CONTROLLER', { exact: true })).toBeVisible()
  await expect(citationRegion.getByText('相关分 91')).toBeVisible()
  await expect(citationRegion.getByRole('button', { name: '复制引用' }).first()).toBeVisible()
  await expectNoHorizontalOverflow(page, `${viewportName}:report-evidence-qa-unverified-citation`)

  return {
    responseStatus: qaResponse.status(),
    resultCount: Number(qaData.resultCount || chunks.length || 0),
    citationCount: citations.length,
    coverageStatus: citationCoverage.status || '',
    coveragePercent: Number(citationCoverage.coveragePercent || 0),
    coverageTotalEvidenceCount: Number(citationCoverage.totalEvidenceCount || 0),
    coverageCitedEvidenceCount: Number(citationCoverage.citedEvidenceCount || 0),
    coverageUncitedCandidateCount: Number(citationCoverage.uncitedCandidateCount || 0),
    coverageRepairCandidateCount: Number(citationCoverage.repairCandidateCount || 0),
    coverageUniqueEvidenceFileCount: Number(citationCoverage.uniqueEvidenceFileCount || 0),
    coverageCitedEvidenceFileCount: Number(citationCoverage.citedEvidenceFileCount || 0),
    coveragePrimaryEvidenceCount: Number(citationCoverage.primaryEvidenceCount || 0),
    coverageCitedPrimaryEvidenceCount: Number(citationCoverage.citedPrimaryEvidenceCount || 0),
    coveragePrimaryEvidenceFileCount: Number(citationCoverage.primaryEvidenceFileCount || 0),
    coverageCitedPrimaryEvidenceFileCount: Number(citationCoverage.citedPrimaryEvidenceFileCount || 0),
    coverageContextEvidenceCount: Number(citationCoverage.contextEvidenceCount || 0),
    coverageCitedContextEvidenceCount: Number(citationCoverage.citedContextEvidenceCount || 0),
    coverageContextEvidenceFileCount: Number(citationCoverage.contextEvidenceFileCount || 0),
    coverageCitedContextEvidenceFileCount: Number(citationCoverage.citedContextEvidenceFileCount || 0),
    coverageRequiredEvidenceCount: Number(citationCoverage.requiredEvidenceCount || 0),
    coverageCitedRequiredEvidenceCount: Number(citationCoverage.citedRequiredEvidenceCount || 0),
    coverageRequiredEvidenceFileCount: Number(citationCoverage.requiredEvidenceFileCount || 0),
    coverageCitedRequiredEvidenceFileCount: Number(citationCoverage.citedRequiredEvidenceFileCount || 0),
    coverageRequiredEvidenceCoveragePercent: Number(citationCoverage.requiredEvidenceCoveragePercent || 0),
    coverageScope: String(citationCoverage.coverageScope || ''),
    coverageRoleDistributionStatus: String(evidenceRoleDistribution.status || ''),
    coverageRoleTotalFileCount: Number(evidenceRoleDistribution.totalFileCount || 0),
    coverageRoleCitedFileCount: Number(evidenceRoleDistribution.citedFileCount || 0),
    coverageRolePrimaryFileCount: Number(evidenceRoleDistribution.primaryFileCount || 0),
    coverageRoleCitedPrimaryFileCount: Number(evidenceRoleDistribution.citedPrimaryFileCount || 0),
    coverageRoleContextFileCount: Number(evidenceRoleDistribution.contextFileCount || 0),
    coverageRoleCitedContextFileCount: Number(evidenceRoleDistribution.citedContextFileCount || 0),
    coverageRoleCount: evidenceRoleStats.length,
    coverageRoleFileEntryCount: evidenceRoleFiles.length,
    claimCitationStatus: String(claimCitationCoverage.status || ''),
    claimCoveragePercent: Number(claimCitationCoverage.claimCoveragePercent || 0),
    claimRequiredClaimCount: Number(claimCitationCoverage.requiredClaimCount || 0),
    claimCitedRequiredClaimCount: Number(claimCitationCoverage.citedRequiredClaimCount || 0),
    claimUncitedRequiredClaimCount: Number(claimCitationCoverage.uncitedRequiredClaimCount || 0),
    claimInvalidCitationClaimCount: Number(claimCitationCoverage.invalidCitationClaimCount || 0),
    claimValidCitationFileCount: Number(claimCitationCoverage.validCitationFileCount || 0),
    claimRequiredClaimCitationFileCount: Number(claimCitationCoverage.requiredClaimCitationFileCount || 0),
    crossFileSummaryVisible: true,
    crossFileSummaryTone: 'blocked',
    crossFileSummaryStatus: String(evidenceRoleDistribution.status || 'NO_EVIDENCE'),
    crossFileSummaryCrossFileEvidenceSatisfied,
    crossFileSummaryCitationBindingSatisfied,
    crossFileSummaryClaimBindingSatisfied,
    crossFileSummaryCurrentScanOnly: true,
    crossFileSummarySourceEvidenceMatchType: String(qaData.sourceEvidenceMatchType || ''),
    claimRoleDistributionStatus: String(claimRoleDistribution.status || ''),
    claimRoleRequiredClaimCount: Number(claimRoleDistribution.requiredClaimCount || 0),
    claimRoleRequiredPrimaryBoundClaimCount: Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0),
    claimRoleRequiredContextOnlyClaimCount: Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0),
    claimRoleRequiredUnknownOnlyClaimCount: Number(claimRoleDistribution.requiredUnknownOnlyClaimCount || 0),
    claimRoleUnbackedRequiredClaimCount: Number(claimRoleDistribution.unbackedRequiredClaimCount || 0),
    claimRoleInvalidRequiredClaimCount: Number(claimRoleDistribution.invalidRequiredClaimCount || 0),
    claimRoleValidCitationFileCount: Number(claimRoleDistribution.validCitationFileCount || 0),
    claimRoleRequiredClaimCitationFileCount: Number(claimRoleDistribution.requiredClaimCitationFileCount || 0),
    claimRoleRequiredPrimaryFileCount: Number(claimRoleDistribution.requiredPrimaryFileCount || 0),
    claimRoleCount: claimRoleStats.length,
    claimRoleFileEntryCount: claimRoleFiles.length,
    groundingStatus: qaData.groundingStatus || '',
    citationEnforcementStatus: qaData.citationEnforcementStatus || '',
    citationEnforcementReason: qaData.citationEnforcementReason || '',
    uncitedCandidateCount: citations.filter((citation: any) => citation?.citedByAnswer === false).length,
    expectedEvidenceFileVisible: citations.some((citation: any) => citation?.filePath === targetFile),
    evidenceRefRequestBound: qaRequestPayload.evidenceRef?.filePath === targetFile,
    evidenceRefResponseBound: qaData.sourceEvidenceRef?.filePath === targetFile,
    repairEvidenceGateBlockedVisible: true,
    claimCitationNoiseBoundaryKinds: mode === 'fake-noise' ? ['fenced-code', 'timestamp-log', 'exception-line', 'inline-code'] : [],
  }
}

async function submitFileAnchorDriftQaAndAssert(page: Page, viewportName: string) {
  await page.getByPlaceholder(/输入问题/).fill('请模拟文件锚点漂移，确认 REPORT_FILE_ANCHOR 必须需要人工复核')
  const qaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 15_000 })

  await page.getByRole('button', { name: '发送' }).click()
  const qaResponse = await qaResponsePromise
  const qaRequestPayload = JSON.parse(qaResponse.request().postData() || '{}')
  const qaBody = await qaResponse.json()
  const qaData = qaBody?.data || {}
  const citations = Array.isArray(qaData.answerCitations) ? qaData.answerCitations : []
  const citationCoverage = qaData.citationCoverage || {}
  const claimCitationCoverage = qaData.claimCitationCoverage || {}
  const claimRoleDistribution = claimCitationCoverage.roleDistribution || {}

  expect(qaBody.code, `${viewportName}: file-anchor QA response code must be SUCCESS`).toBe('SUCCESS')
  expect(qaRequestPayload.scanTaskId, `${viewportName}: file-anchor QA request must stay scan-bound`).toBe(scanTaskId)
  expect(qaRequestPayload.evidenceRef?.filePath, `${viewportName}: file-anchor QA request must keep evidenceRef.filePath`).toBe(targetFile)
  expect(qaData.scanTaskId, `${viewportName}: file-anchor QA response must stay scan-bound`).toBe(scanTaskId)
  expect(qaData.groundingStatus, `${viewportName}: file-anchor QA must not be treated as verified grounding`).toBe('PARTIAL')
  expect(qaData.citationEnforcementStatus, `${viewportName}: file-anchor QA must not be treated as directly verified citations`).toBe('RETRY_FAILED')
  expect(qaData.citationEnforcementReason, `${viewportName}: file-anchor QA must expose context-only failure reason`).toBe('CONTEXT_ONLY_CLAIM')
  expect(qaData.sourceEvidenceMatched, `${viewportName}: file-anchor QA response must keep source evidence matched`).toBe(true)
  expect(qaData.sourceEvidenceMatchType, `${viewportName}: file-anchor QA must expose downgraded source evidence anchor`).toBe('REPORT_FILE_ANCHOR')
  expect(citationCoverage.status, `${viewportName}: file-anchor QA must keep coverage informational only`).toBe('PARTIAL')
  expect(citationCoverage.coverageScope, `${viewportName}: file-anchor QA must evaluate all evidence as context-only`).toBe('ALL')
  expect(Number(citationCoverage.primaryEvidenceCount || 0), `${viewportName}: file-anchor QA must not expose PRIMARY evidence`).toBe(0)
  expect(Number(citationCoverage.contextEvidenceCount || 0), `${viewportName}: file-anchor QA must keep evidence as adjacent context`).toBeGreaterThan(0)
  expect(citationCoverage.evidenceRoleDistribution?.status, `${viewportName}: file-anchor QA evidence role distribution must be context-only`).toBe('CONTEXT_ONLY')
  expect(Number(citationCoverage.repairCandidateCount || 0), `${viewportName}: file-anchor QA must not expose repair candidates`).toBe(0)
  expect(claimCitationCoverage.status, `${viewportName}: file-anchor QA must not keep claim citation READY`).toBe('REVIEW')
  expect(Number(claimCitationCoverage.requiredClaimCount || 0), `${viewportName}: file-anchor QA must expose required claims`).toBeGreaterThan(0)
  expect(Number(claimCitationCoverage.citedRequiredClaimCount || 0), `${viewportName}: file-anchor QA must not cite required claims as repair-ready`).toBe(0)
  expect(claimRoleDistribution.status, `${viewportName}: file-anchor QA must expose context-only claim role distribution`).toBe('CONTEXT_ONLY')
  expect(Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0), `${viewportName}: file-anchor QA must not bind required claims to PRIMARY`).toBe(0)
  expect(Number(claimRoleDistribution.requiredPrimaryFileCount || 0), `${viewportName}: file-anchor QA must not expose required primary files`).toBe(0)
  expect(Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0), `${viewportName}: file-anchor QA must preserve context-only claim count`).toBeGreaterThan(0)
  expect(citations.some((citation: any) => citation?.citedByAnswer === true && citation?.contextRole === 'ADJACENT_CONTEXT'), `${viewportName}: file-anchor QA may cite only adjacent context evidence`).toBe(true)

  const trustSummary = page.getByLabel('QA 可信度摘要').filter({ hasText: '来源锚点 文件锚点' }).last()
  await expect(trustSummary).toBeVisible()
  await expect(trustSummary.getByText('不可直接采信')).toBeVisible()
  const repairGates = page.getByLabel('修复证据门禁')
  const repairGate = repairGates.nth(await repairGates.count() - 1)
  await expect(repairGate).toBeVisible()
  await expect(repairGate.getByText('BLOCKED', { exact: true })).toBeVisible()
  await expect(repairGate.getByText('来源锚点 文件锚点')).toBeVisible()
  const crossFileSummaries = page.getByLabel('跨文件引用摘要')
  const crossFileSummary = crossFileSummaries.nth(await crossFileSummaries.count() - 1)
  await expect(crossFileSummary).toBeVisible()
  await expect(crossFileSummary.getByText('上下文引用可复核')).toBeVisible()
  await expect(crossFileSummary.getByLabel('上下文引用缺口')).toBeVisible()
  const sourceLocationConfidences = page.getByLabel('来源定位可信度')
  const sourceLocationConfidence = sourceLocationConfidences.nth(await sourceLocationConfidences.count() - 1)
  await expect(sourceLocationConfidence, `${viewportName}: file-anchor source location confidence must be visible`).toBeVisible()
  await expect(sourceLocationConfidence.getByText('来源定位需复核', { exact: true })).toBeVisible()
  await expect(sourceLocationConfidence.getByText('需复核', { exact: true })).toBeVisible()
  await expect(sourceLocationConfidence.getByText('REPORT_FILE_ANCHOR')).toBeVisible()
  await expect(sourceLocationConfidence.getByText('同名文件或 source URL 场景仍需人工确认具体行')).toBeVisible()
  const sourceMatchReleases = page.getByLabel('来源文件匹配说明')
  const sourceMatchRelease = sourceMatchReleases.nth(await sourceMatchReleases.count() - 1)
  await expect(sourceMatchRelease, `${viewportName}: file-anchor source match release checklist must be visible`).toBeVisible()
  await expect(sourceMatchRelease.getByText('修复候选已阻断')).toBeVisible()
  await expect(sourceMatchRelease.getByText('路径后缀一致').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('未满足：行级锚点').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('来源锚点仍是文件锚点，需确认具体行号').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('未满足：主张 PRIMARY 绑定').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('下一步：确认报告证据行号后重试此问题。')).toBeVisible()
  const nextActionRails = page.getByLabel('QA 下一步动作')
  const nextActionRail = nextActionRails.nth(await nextActionRails.count() - 1)
  await expect(nextActionRail).toBeVisible()
  await expect(nextActionRail.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  const citationRegions = page.getByLabel('回答引用证据')
  const citationRegion = citationRegions.nth(await citationRegions.count() - 1)
  await expect(citationRegion).toBeVisible()
  await expect(citationRegion.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  const deepEvidenceReadability = await assertQaDeepEvidenceCardReadability(page, viewportName, 'review')
  await expectNoHorizontalOverflow(page, `${viewportName}:report-evidence-qa-file-anchor-drift`)

  return {
    responseStatus: qaResponse.status(),
    groundingStatus: qaData.groundingStatus || '',
    citationEnforcementStatus: qaData.citationEnforcementStatus || '',
    citationEnforcementReason: qaData.citationEnforcementReason || '',
    sourceEvidenceMatchType: String(qaData.sourceEvidenceMatchType || ''),
    coverageStatus: String(citationCoverage.status || ''),
    coverageScope: String(citationCoverage.coverageScope || ''),
    coveragePrimaryEvidenceCount: Number(citationCoverage.primaryEvidenceCount || 0),
    coverageContextEvidenceCount: Number(citationCoverage.contextEvidenceCount || 0),
    coverageRepairCandidateCount: Number(citationCoverage.repairCandidateCount || 0),
    coverageRoleDistributionStatus: String(citationCoverage.evidenceRoleDistribution?.status || ''),
    claimCitationStatus: String(claimCitationCoverage.status || ''),
    claimRequiredClaimCount: Number(claimCitationCoverage.requiredClaimCount || 0),
    claimCitedRequiredClaimCount: Number(claimCitationCoverage.citedRequiredClaimCount || 0),
    claimRoleDistributionStatus: String(claimRoleDistribution.status || ''),
    claimRoleRequiredPrimaryBoundClaimCount: Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0),
    claimRoleRequiredPrimaryFileCount: Number(claimRoleDistribution.requiredPrimaryFileCount || 0),
    claimRoleRequiredContextOnlyClaimCount: Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0),
    repairEvidenceGateBlockedVisible: true,
    trustSummaryBlockedVisible: true,
    crossFileSummaryContextGapVisible: true,
    sourceLocationConfidenceReviewVisible: true,
    latestNextActionRepairHidden: true,
    latestCitationRepairHidden: true,
    deepEvidenceReadability,
  }
}

async function submitClaimRoleDistributionDriftQaAndAssert(page: Page, viewportName: string, mode: 'missing' | 'mismatch') {
  const prompt = mode === 'missing'
    ? '请模拟主张角色分布缺失，确认 READY claimCitationCoverage 必须降级复核'
    : '请模拟主张角色计数矛盾，确认 PRIMARY_BOUND 超量计数必须降级复核'
  await page.getByPlaceholder(/输入问题/).fill(prompt)
  const qaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 15_000 })

  await page.getByRole('button', { name: '发送' }).click()
  const qaResponse = await qaResponsePromise
  const qaRequestPayload = JSON.parse(qaResponse.request().postData() || '{}')
  const qaBody = await qaResponse.json()
  const qaData = qaBody?.data || {}
  const claimCitationCoverage = qaData.claimCitationCoverage || {}
  const claimRoleDistribution = claimCitationCoverage.roleDistribution || null
  const roleDistributionPresent = Boolean(claimRoleDistribution)
  const mismatchFlags = {
    requiredClaimCountMismatch: roleDistributionPresent && Number(claimRoleDistribution.requiredClaimCount || 0) !== Number(claimCitationCoverage.requiredClaimCount || 0),
    requiredPrimaryBoundClaimCountMismatch: roleDistributionPresent && Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0) !== Number(claimCitationCoverage.requiredClaimCount || 0),
    nonZeroContextOnly: roleDistributionPresent && Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0) > 0,
    nonZeroUnbacked: roleDistributionPresent && Number(claimRoleDistribution.unbackedRequiredClaimCount || 0) > 0,
    nonZeroInvalid: roleDistributionPresent && Number(claimRoleDistribution.invalidRequiredClaimCount || 0) > 0,
    validCitationFileCountMismatch: roleDistributionPresent && Number(claimRoleDistribution.validCitationFileCount || 0) !== Number(claimCitationCoverage.validCitationFileCount || 0),
    requiredClaimCitationFileCountMismatch: roleDistributionPresent && Number(claimRoleDistribution.requiredClaimCitationFileCount || 0) !== Number(claimCitationCoverage.requiredClaimCitationFileCount || 0),
  }

  expect(qaBody.code, `${viewportName}: claim role ${mode} QA response code must be SUCCESS`).toBe('SUCCESS')
  expect(qaRequestPayload.scanTaskId, `${viewportName}: claim role ${mode} QA request must stay scan-bound`).toBe(scanTaskId)
  expect(qaRequestPayload.evidenceRef?.filePath, `${viewportName}: claim role ${mode} QA request must keep evidenceRef.filePath`).toBe(targetFile)
  expect(qaData.scanTaskId, `${viewportName}: claim role ${mode} QA response must stay scan-bound`).toBe(scanTaskId)
  expect(qaData.groundingStatus, `${viewportName}: claim role ${mode} QA still simulates verified grounding`).toBe('VERIFIED')
  expect(qaData.citationEnforcementStatus, `${viewportName}: claim role ${mode} QA still simulates direct verified citations`).toBe('DIRECT_VERIFIED')
  expect(qaData.citationEnforcementReason, `${viewportName}: claim role ${mode} QA must keep successful citation reason while isolating role drift`).toBe('DIRECT_VERIFIED')
  expect(qaData.sourceEvidenceMatched, `${viewportName}: claim role ${mode} QA response must keep source evidence matched`).toBe(true)
  expect(qaData.sourceEvidenceMatchType, `${viewportName}: claim role ${mode} QA must keep line-level source evidence anchor`).toBe('REPORT_LINE_ANCHOR')
  expect(claimCitationCoverage.status, `${viewportName}: claim role ${mode} QA must keep parent claim coverage READY to isolate role drift`).toBe('READY')
  expect(Number(claimCitationCoverage.requiredClaimCount || 0), `${viewportName}: claim role ${mode} QA must expose required claims`).toBeGreaterThan(0)
  expect(Number(claimCitationCoverage.citedRequiredClaimCount || 0), `${viewportName}: claim role ${mode} QA must cite every required claim`).toBe(Number(claimCitationCoverage.requiredClaimCount || 0))
  if (mode === 'missing') {
    expect(roleDistributionPresent, `${viewportName}: missing role drift must omit roleDistribution`).toBe(false)
  } else {
    expect(roleDistributionPresent, `${viewportName}: mismatch role drift must include roleDistribution`).toBe(true)
    expect(claimRoleDistribution.status, `${viewportName}: mismatch role drift must keep PRIMARY_BOUND to prove count hardening`).toBe('PRIMARY_BOUND')
    expect(Object.values(mismatchFlags).some(Boolean), `${viewportName}: mismatch role drift must expose at least one parent/child contradiction`).toBe(true)
  }

  const trustSummaries = page.getByLabel('QA 可信度摘要')
  const trustSummary = trustSummaries.nth(await trustSummaries.count() - 1)
  await expect(trustSummary).toBeVisible()
  await expect(trustSummary.getByText('需要人工复核')).toBeVisible()
  await expect(trustSummary.getByText('可采信并进入修复复核')).toHaveCount(0)
  const repairGates = page.getByLabel('修复证据门禁')
  const repairGate = repairGates.nth(await repairGates.count() - 1)
  await expect(repairGate).toBeVisible()
  await expect(repairGate.getByText('REVIEW', { exact: true })).toBeVisible()
  await expect(repairGate.getByText('READY', { exact: true })).toHaveCount(0)
  const claimAudits = page.getByLabel('主张引用质量')
  const claimAudit = claimAudits.nth(await claimAudits.count() - 1)
  await expect(claimAudit).toBeVisible()
  await expect(claimAudit.getByText('主张引用需要复核')).toBeVisible()
  await expect(claimAudit.getByText('主张已绑定引用')).toHaveCount(0)
  const sourceMatchReleases = page.getByLabel('来源文件匹配说明')
  const sourceMatchRelease = sourceMatchReleases.nth(await sourceMatchReleases.count() - 1)
  await expect(sourceMatchRelease, `${viewportName}: claim role ${mode} source match release checklist must be visible`).toBeVisible()
  await expect(sourceMatchRelease.getByText('修复候选需复核')).toBeVisible()
  await expect(sourceMatchRelease.getByText('已满足：行级锚点').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('未满足：主张 PRIMARY 绑定').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText(mode === 'missing' ? '主张角色分布缺失，不能生成修复候选' : /主张 PRIMARY 绑定/).first()).toBeVisible()
  const nextActionRails = page.getByLabel('QA 下一步动作')
  const nextActionRail = nextActionRails.nth(await nextActionRails.count() - 1)
  await expect(nextActionRail).toBeVisible()
  await expect(nextActionRail.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  const citationRegions = page.getByLabel('回答引用证据')
  const citationRegion = citationRegions.nth(await citationRegions.count() - 1)
  await expect(citationRegion).toBeVisible()
  await expect(citationRegion.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
  await expectNoHorizontalOverflow(page, `${viewportName}:report-evidence-qa-claim-role-${mode}`)

  return {
    requestCount: 1,
    responseStatus: qaResponse.status(),
    status: 'OK',
    sourceEvidenceMatchType: String(qaData.sourceEvidenceMatchType || ''),
    claimCitationStatus: String(claimCitationCoverage.status || ''),
    roleDistributionPresent,
    mismatchFlags,
    repairEvidenceGateReviewVisible: true,
    trustSummaryReviewVisible: true,
    latestNextActionRepairHidden: true,
    latestCitationRepairHidden: true,
  }
}

test('ScanTaskDetail artifact fallback summary JSON is display-redacted', async ({ page }) => {
  const network = await installArtifactFallbackMocks(page)
  const issues = installRuntimeGuards(page)
  const fallbackProofs: Array<{
    viewport: string
    fallbackVisible: boolean
    safeMarkerVisible: boolean
    rawSecretsHidden: boolean
    bodyRawSecretsHidden: boolean
    redactionVisible: boolean
  }> = []

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/scan-tasks/${scanTaskId}`)

    const artifactCardTitle = page.locator('.sl-section-card .ant-card-head-title').filter({ hasText: /^分析产物$/ })
    await expect(artifactCardTitle, `${viewport.name}: artifact fallback card must render`).toBeVisible()
    const fallbackPreview = page.getByLabel('脱敏分析产物 JSON').first()
    await expect(fallbackPreview, `${viewport.name}: redacted fallback JSON preview must be visible`).toBeVisible()
    await expect(fallbackPreview, `${viewport.name}: safe marker must remain visible`).toContainText(artifactFallbackSafeMarker)
    await expect(fallbackPreview, `${viewport.name}: redaction marker must be visible`).toContainText('[REDACTED]')

    for (const secret of forbiddenArtifactFallbackSecretSnippets) {
      await expect(fallbackPreview, `${viewport.name}: fallback preview must hide raw artifact secret ${secret}`).not.toContainText(secret)
      await expect(page.locator('body'), `${viewport.name}: page body must hide raw artifact secret ${secret}`).not.toContainText(secret)
    }

    await expectNoHorizontalOverflow(page, `${viewport.name}:artifact-fallback-redaction`)
    fallbackProofs.push({
      viewport: `${viewport.width}x${viewport.height}`,
      fallbackVisible: true,
      safeMarkerVisible: true,
      rawSecretsHidden: true,
      bodyRawSecretsHidden: true,
      redactionVisible: true,
    })
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in artifact fallback smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const fixtureText = JSON.stringify(network.fallbackSummary)
  expect(fixtureText).toContain(artifactFallbackSafeMarker)
  for (const secret of forbiddenArtifactFallbackSecretSnippets) {
    expect(fixtureText, `Fixture must contain raw artifact secret ${secret} so the smoke proves redaction.`).toContain(secret)
  }

  const markerPayload = {
    projectId,
    repositoryId,
    scanTaskId,
    scope: 'SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SUMMARY_JSON_DISPLAY_REDACTION_ONLY',
    surface: 'SCAN_TASK_DETAIL_ARTIFACT_FALLBACK',
    mockedApiOnly: true,
    unhandledApiRequests: network.unhandledApiRequests.length,
    viewports: fallbackProofs.map(proof => proof.viewport),
    fixtureHasRawSecret: forbiddenArtifactFallbackSecretSnippets.every(secret => fixtureText.includes(secret)),
    fixtureHasSafeMarker: fixtureText.includes(artifactFallbackSafeMarker),
    fallbackVisible: fallbackProofs.every(proof => proof.fallbackVisible),
    safeMarkerVisible: fallbackProofs.every(proof => proof.safeMarkerVisible),
    rawSecretsHidden: fallbackProofs.every(proof => proof.rawSecretsHidden),
    bodyRawSecretsHidden: fallbackProofs.every(proof => proof.bodyRawSecretsHidden),
    redactionVisible: fallbackProofs.every(proof => proof.redactionVisible),
    markerContainsRawSecret: false,
    fullReleaseAuthorityRefreshed: false,
    spec: 'report-evidence-drawer-smoke.spec.ts',
  }
  const markerText = JSON.stringify(markerPayload)
  for (const secret of forbiddenArtifactFallbackSecretSnippets) {
    expect(markerText, 'Artifact fallback marker must not contain raw artifact fallback secret.').not.toContain(secret)
  }
  console.log('SCAN_TASK_DETAIL_ARTIFACT_FALLBACK_SMOKE_OK', markerText)
})

test('ScanTaskDetail evidence drawer loads scan-bound code_chunks summary', async ({ page }) => {
  test.setTimeout(300_000)
  const network = await installReportEvidenceDrawerMocks(page)
  const issues = installRuntimeGuards(page)
  const baseURLHost = new URL(test.info().project.use.baseURL || page.url() || 'http://127.0.0.1').hostname || '127.0.0.1'
  const qaProofs: Array<Awaited<ReturnType<typeof openQaFromEvidenceAndAssert>>> = []
  const unverifiedQaProofs: Array<Awaited<ReturnType<typeof submitUnverifiedQaAndAssert>>> = []
  const claimCitationNoiseBoundaryProofs: Array<Awaited<ReturnType<typeof submitUnverifiedQaAndAssert>>> = []
  const fileAnchorDriftQaProofs: Array<Awaited<ReturnType<typeof submitFileAnchorDriftQaAndAssert>>> = []
  const claimRoleDistributionMissingProofs: Array<Awaited<ReturnType<typeof submitClaimRoleDistributionDriftQaAndAssert>>> = []
  const claimRoleDistributionMismatchProofs: Array<Awaited<ReturnType<typeof submitClaimRoleDistributionDriftQaAndAssert>>> = []
  const trustedLoopProofs: Array<Awaited<ReturnType<typeof assertReportTrustedLoop>>> = []
  const reportCitationQualityProofs: Array<Awaited<ReturnType<typeof assertReportCitationQualityPanel>>> = []
  const recommendedStepProofs: Array<Awaited<ReturnType<typeof assertReportRecommendedNextStep>>> = []
  const mainPathGuideProofs: Array<Awaited<ReturnType<typeof assertReportMainPathGuide>>> = []
  const actionBoardProofs: Array<Awaited<ReturnType<typeof assertReportActionBoard>>> = []
  const reviewGateProofs: Array<Awaited<ReturnType<typeof assertReportReviewGate>>> = []
  const evidenceProfileTraceMapProofs: Array<Awaited<ReturnType<typeof assertReportEvidenceProfileAndTraceMapReadability>>> = []
  const governanceTimelineReadabilityProofs: Array<Awaited<ReturnType<typeof assertReportGovernanceTimelineReadability>>> = []
  const apiDbTableReadabilityProofs: Array<Awaited<ReturnType<typeof assertReportApiDbTableReadability>>> = []
  const priorityRailProofs: Array<Awaited<ReturnType<typeof assertPriorityRailAndOpenFirstEvidence>>> = []
  const gapEvidenceProofs: Array<Awaited<ReturnType<typeof openGapEvidenceDrawerAndAssert>>> = []
  const codeChunkPreviewRedactionProofs: Array<Awaited<ReturnType<typeof assertCodeChunkPreviewRedaction>>> = []
  const reportEvidenceRedactionProofs: Array<Awaited<ReturnType<typeof assertReportEvidenceQuestionReferenceRedaction>>> = []
  const qaLineRangeConflictProofs: Array<Awaited<ReturnType<typeof assertQaEvidenceLineRangeConflictPriority>>> = []

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const drawerProof = await openEvidenceDrawerAndAssert(page, viewport.name)
    trustedLoopProofs.push(drawerProof.trustedLoop)
    reportCitationQualityProofs.push(drawerProof.reportCitationQuality)
    recommendedStepProofs.push(drawerProof.recommendedStep)
    mainPathGuideProofs.push(drawerProof.mainPathGuide)
    actionBoardProofs.push(drawerProof.actionBoard)
    reviewGateProofs.push(drawerProof.reviewGate)
    evidenceProfileTraceMapProofs.push(drawerProof.evidenceProfileTraceMap)
    governanceTimelineReadabilityProofs.push(drawerProof.governanceTimelineReadability)
    apiDbTableReadabilityProofs.push(drawerProof.apiDbTableReadability)
    priorityRailProofs.push(drawerProof.priorityRail)
    codeChunkPreviewRedactionProofs.push(drawerProof.codeChunkPreviewRedaction)
    reportEvidenceRedactionProofs.push(drawerProof.reportEvidenceRedaction)
    qaProofs.push(await openQaFromEvidenceAndAssert(page, viewport.name))
    unverifiedQaProofs.push(await submitUnverifiedQaAndAssert(page, viewport.name))
    claimCitationNoiseBoundaryProofs.push(await submitUnverifiedQaAndAssert(page, viewport.name, 'fake-noise'))
    fileAnchorDriftQaProofs.push(await submitFileAnchorDriftQaAndAssert(page, viewport.name))
    claimRoleDistributionMissingProofs.push(await submitClaimRoleDistributionDriftQaAndAssert(page, viewport.name, 'missing'))
    claimRoleDistributionMismatchProofs.push(await submitClaimRoleDistributionDriftQaAndAssert(page, viewport.name, 'mismatch'))
    qaLineRangeConflictProofs.push(await assertQaEvidenceLineRangeConflictPriority(page, viewport.name))
    gapEvidenceProofs.push(await openGapEvidenceDrawerAndAssert(page, viewport.name))
  }

  const drawerQueries = network.chunkQueries.filter(query => query.includes('limit=3'))
  expect(drawerQueries.length, 'The drawer should trigger READY and GAP code_chunks queries per viewport.').toBe(viewportMatrix.length * 2)
  const readyDrawerQueries = drawerQueries.filter(query => decodeURIComponent(query).includes(targetFile))
  const gapDrawerQueries = drawerQueries.filter(query => decodeURIComponent(query).includes(gapEvidenceFile))
  expect(readyDrawerQueries.length, 'The drawer should trigger one READY evidence query per viewport.').toBe(viewportMatrix.length)
  expect(gapDrawerQueries.length, 'The drawer should trigger one GAP evidence query per viewport.').toBe(viewportMatrix.length)
  for (const query of drawerQueries) {
    expect(query).toContain(`scanTaskId=${scanTaskId}`)
    expect(query).toContain('limit=3')
    for (const secret of forbiddenReportEvidenceSecretSnippets) {
      expect(decodeURIComponent(query), `Drawer code_chunks query must not contain raw report evidence secret: ${secret}`).not.toContain(secret)
    }
  }
  for (const query of readyDrawerQueries) {
    expect(decodeURIComponent(query)).toContain(targetFile)
    expect(decodeURIComponent(query)).toContain(`:${evidenceLineRange}`)
    expect(decodeURIComponent(query), 'Ready drawer code_chunks query should preserve redaction marker for sensitive report evidence.').toContain('[REDACTED]')
  }
  for (const query of gapDrawerQueries) {
    expect(decodeURIComponent(query)).toContain(gapEvidenceFile)
    expect(decodeURIComponent(query)).toContain(':99')
  }
  expect(network.qaRequests.length, 'The QA flow should submit success, unverified, fake citation noise, file-anchor drift and claim role drift evidence-bound requests per viewport.').toBe(viewportMatrix.length * 6)
  for (const request of network.qaRequests) {
    expect(request.scanTaskId).toBe(scanTaskId)
    expect(request.evidenceRef?.filePath).toBe(targetFile)
    expect(request.evidenceRef?.category).toBe(evidenceCategory)
    expect(request.evidenceRef?.source).toBe(evidenceSource)
    expect(request.evidenceRef?.title).toBe(evidenceTitle)
    expect(request.evidenceRef?.lineNumber).toBeUndefined()
    expect(request.evidenceRef?.startLine).toBe(evidenceStartLine)
    expect(request.evidenceRef?.endLine).toBe(evidenceEndLine)
  }
  expect(qaProofs.every(proof => proof.responseStatus === 200)).toBe(true)
  expect(qaProofs.every(proof => proof.resultCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.citationCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.citedChunkCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageStatus === 'PARTIAL')).toBe(true)
  expect(qaProofs.every(proof => proof.coverageTotalEvidenceCount === proof.citationCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageCitedEvidenceCount === proof.citedChunkCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRepairCandidateCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRequiredEvidenceCoveragePercent >= 100)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRequiredEvidenceCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageCitedRequiredEvidenceCount === proof.coverageRequiredEvidenceCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRequiredEvidenceFileCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageCitedRequiredEvidenceFileCount === proof.coverageRequiredEvidenceFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coveragePrimaryEvidenceFileCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageCitedPrimaryEvidenceFileCount === proof.coveragePrimaryEvidenceFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageUncitedPrimaryEvidenceFileCount === 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageContextEvidenceFileCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageUncitedContextEvidenceCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageUncitedContextEvidenceFileCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageScope.length > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRoleDistributionStatus === 'MIXED_PRIMARY_CONTEXT')).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRoleTotalFileCount === proof.coverageUniqueEvidenceFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRoleCitedFileCount === proof.coverageCitedEvidenceFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRolePrimaryFileCount === proof.coveragePrimaryEvidenceFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRoleCitedPrimaryFileCount === proof.coverageCitedPrimaryEvidenceFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRoleContextFileCount === proof.coverageContextEvidenceFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRoleCitedContextFileCount === proof.coverageCitedContextEvidenceFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.coverageRoleCount >= 2 && proof.coverageRoleFileEntryCount >= 2)).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummaryVisible)).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummaryTone === 'warning')).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummaryCrossFileEvidenceSatisfied)).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummaryCitationBindingSatisfied)).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummaryClaimBindingSatisfied)).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummaryContextGapVisible)).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummaryContextGapEvidence > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummaryContextGapFiles > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.crossFileSummarySourceEvidenceMatchType === 'REPORT_LINE_ANCHOR')).toBe(true)
  expect(qaProofs.every(proof => proof.sourceLocationConfidenceReadyVisible)).toBe(true)
  expect(qaProofs.every(proof => proof.claimCitationStatus === 'READY')).toBe(true)
  expect(qaProofs.every(proof => proof.claimCoveragePercent >= 100)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRequiredClaimCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.claimCitedRequiredClaimCount === proof.claimRequiredClaimCount)).toBe(true)
  expect(qaProofs.every(proof => proof.claimInvalidCitationClaimCount === 0)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleDistributionStatus === 'PRIMARY_BOUND')).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleRequiredClaimCount === proof.claimRequiredClaimCount)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleRequiredPrimaryBoundClaimCount === proof.claimRequiredClaimCount)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleRequiredContextOnlyClaimCount === 0)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleRequiredUnknownOnlyClaimCount === 0)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleUnbackedRequiredClaimCount === 0)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleInvalidRequiredClaimCount === 0)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleValidCitationFileCount === proof.claimValidCitationFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleRequiredClaimCitationFileCount === proof.claimRequiredClaimCitationFileCount)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleRequiredPrimaryFileCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.claimRoleCount > 0 && proof.claimRoleFileEntryCount > 0)).toBe(true)
  expect(qaProofs.every(proof => proof.groundingStatus === 'VERIFIED')).toBe(true)
  expect(qaProofs.every(proof => ['DIRECT_VERIFIED', 'RETRY_VERIFIED', 'FALLBACK_CITED'].includes(proof.citationEnforcementStatus))).toBe(true)
  expect(qaProofs.every(proof => ['DIRECT_VERIFIED', 'RETRY_VERIFIED', 'FALLBACK_PRIMARY_CITED'].includes(proof.citationEnforcementReason))).toBe(true)
  expect(qaProofs.every(proof => proof.expectedEvidenceFileVisible)).toBe(true)
  expect(qaProofs.every(proof => proof.evidenceRefRequestBound && proof.evidenceRefResponseBound && proof.evidenceRefTitleBound && proof.evidenceRefLineBound && proof.evidenceRefContextVisible && proof.repairEvidenceGateReadyVisible)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.responseStatus === 200)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.resultCount > 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.citationCount > 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.uncitedCandidateCount > 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageStatus === 'NONE')).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageCitedEvidenceCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRepairCandidateCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRequiredEvidenceCount > 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageCitedRequiredEvidenceCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRequiredEvidenceFileCount > 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageCitedRequiredEvidenceFileCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageCitedPrimaryEvidenceFileCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRequiredEvidenceCoveragePercent === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageScope.length > 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRoleDistributionStatus === 'MIXED_PRIMARY_CONTEXT')).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRoleTotalFileCount === proof.coverageUniqueEvidenceFileCount)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRoleCitedFileCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRolePrimaryFileCount === proof.coveragePrimaryEvidenceFileCount)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRoleCitedPrimaryFileCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRoleContextFileCount === proof.coverageContextEvidenceFileCount)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRoleCitedContextFileCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.coverageRoleCount >= 2 && proof.coverageRoleFileEntryCount >= 2)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.crossFileSummaryVisible)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.crossFileSummaryTone === 'blocked')).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.crossFileSummaryCrossFileEvidenceSatisfied)).toBe(true)
  expect(unverifiedQaProofs.every(proof => !proof.crossFileSummaryCitationBindingSatisfied)).toBe(true)
  expect(unverifiedQaProofs.every(proof => !proof.crossFileSummaryClaimBindingSatisfied)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimCitationStatus === 'REVIEW')).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimCoveragePercent === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimRequiredClaimCount > 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimCitedRequiredClaimCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimUncitedRequiredClaimCount > 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimRoleDistributionStatus === 'REVIEW_UNCITED')).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimRoleRequiredPrimaryBoundClaimCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimRoleRequiredPrimaryFileCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimRoleValidCitationFileCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimRoleRequiredClaimCitationFileCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.claimRoleCount === 0 && proof.claimRoleFileEntryCount === 0)).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.groundingStatus === 'PARTIAL')).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.citationEnforcementStatus === 'RETRY_FAILED')).toBe(true)
  expect(unverifiedQaProofs.some(proof => proof.citationEnforcementReason === 'UNCITED_REQUIRED_CLAIM')).toBe(true)
  expect(unverifiedQaProofs.every(proof => proof.expectedEvidenceFileVisible && proof.evidenceRefRequestBound && proof.evidenceRefResponseBound && proof.repairEvidenceGateBlockedVisible)).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.responseStatus === 200)).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.groundingStatus === 'PARTIAL')).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.citationEnforcementStatus === 'RETRY_FAILED')).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.citationEnforcementReason === 'NO_VALID_CITATION_LABEL')).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.coverageStatus === 'NONE')).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.coverageCitedEvidenceCount === 0 && proof.coverageRepairCandidateCount === 0)).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.claimCitationStatus === 'REVIEW')).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.claimCitedRequiredClaimCount === 0 && proof.claimInvalidCitationClaimCount === 0)).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.claimRoleDistributionStatus === 'REVIEW_UNCITED')).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.every(proof => proof.claimCitationNoiseBoundaryKinds.length >= 4)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.responseStatus === 200)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.groundingStatus === 'PARTIAL')).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.citationEnforcementStatus === 'RETRY_FAILED')).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.citationEnforcementReason === 'CONTEXT_ONLY_CLAIM')).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.sourceEvidenceMatchType === 'REPORT_FILE_ANCHOR')).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.coverageScope === 'ALL')).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.coveragePrimaryEvidenceCount === 0)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.coverageContextEvidenceCount > 0)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.coverageRepairCandidateCount === 0)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.coverageRoleDistributionStatus === 'CONTEXT_ONLY')).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.claimCitationStatus === 'REVIEW')).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.claimRequiredClaimCount > 0)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.claimCitedRequiredClaimCount === 0)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.claimRoleDistributionStatus === 'CONTEXT_ONLY')).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.claimRoleRequiredPrimaryBoundClaimCount === 0)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.claimRoleRequiredPrimaryFileCount === 0)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.claimRoleRequiredContextOnlyClaimCount > 0)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.repairEvidenceGateBlockedVisible)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.trustSummaryBlockedVisible)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.crossFileSummaryContextGapVisible)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.sourceLocationConfidenceReviewVisible)).toBe(true)
  expect(fileAnchorDriftQaProofs.every(proof => proof.latestNextActionRepairHidden && proof.latestCitationRepairHidden)).toBe(true)
  expect(claimRoleDistributionMissingProofs.every(proof => proof.requestCount === 1 && proof.status === 'OK' && proof.responseStatus === 200)).toBe(true)
  expect(claimRoleDistributionMissingProofs.every(proof => proof.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR')).toBe(true)
  expect(claimRoleDistributionMissingProofs.every(proof => proof.claimCitationStatus === 'READY')).toBe(true)
  expect(claimRoleDistributionMissingProofs.every(proof => !proof.roleDistributionPresent)).toBe(true)
  expect(claimRoleDistributionMissingProofs.every(proof => proof.repairEvidenceGateReviewVisible && proof.trustSummaryReviewVisible)).toBe(true)
  expect(claimRoleDistributionMissingProofs.every(proof => proof.latestNextActionRepairHidden && proof.latestCitationRepairHidden)).toBe(true)
  expect(claimRoleDistributionMismatchProofs.every(proof => proof.requestCount === 1 && proof.status === 'OK' && proof.responseStatus === 200)).toBe(true)
  expect(claimRoleDistributionMismatchProofs.every(proof => proof.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR')).toBe(true)
  expect(claimRoleDistributionMismatchProofs.every(proof => proof.claimCitationStatus === 'READY')).toBe(true)
  expect(claimRoleDistributionMismatchProofs.every(proof => proof.roleDistributionPresent)).toBe(true)
  expect(claimRoleDistributionMismatchProofs.every(proof => Object.values(proof.mismatchFlags).some(Boolean))).toBe(true)
  expect(claimRoleDistributionMismatchProofs.every(proof => proof.repairEvidenceGateReviewVisible && proof.trustSummaryReviewVisible)).toBe(true)
  expect(claimRoleDistributionMismatchProofs.every(proof => proof.latestNextActionRepairHidden && proof.latestCitationRepairHidden)).toBe(true)
  expect(network.unhandledApiRequests, 'Every /api request must be mocked in report evidence drawer smoke.').toEqual([])
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  expect(trustedLoopProofs.every(proof => proof.visible)).toBe(true)
  expect(trustedLoopProofs.every(proof => proof.stepCount === 5)).toBe(true)
  expect(trustedLoopProofs.some(proof => proof.viewportName === 'mobile' && proof.gridColumnCount === 1)).toBe(true)
  expect(trustedLoopProofs.some(proof => proof.viewportName === 'narrow' && proof.gridColumnCount === 1)).toBe(true)
  expect(trustedLoopProofs.every(proof => proof.noHorizontalOverflow)).toBe(true)
  expect(codeChunkPreviewRedactionProofs).toHaveLength(viewportMatrix.length)
  expect(codeChunkPreviewRedactionProofs.every(proof => proof.fixtureHasRawSecretSentinel)).toBe(true)
  expect(codeChunkPreviewRedactionProofs.every(proof => proof.fixtureHasBearerSecret)).toBe(true)
  expect(codeChunkPreviewRedactionProofs.every(proof => proof.fixtureHasApiKeySecret)).toBe(true)
  expect(codeChunkPreviewRedactionProofs.every(proof => proof.fixtureHasJwtSecret)).toBe(true)
  expect(codeChunkPreviewRedactionProofs.every(proof => proof.rawSecretsHidden && proof.bodyHidden && proof.redactionVisible)).toBe(true)
  expect(reportEvidenceRedactionProofs).toHaveLength(viewportMatrix.length)
  expect(reportEvidenceRedactionProofs.every(proof => proof.fixtureHasRawSecret)).toBe(true)
  expect(reportEvidenceRedactionProofs.every(proof => proof.safeMarkerVisible)).toBe(true)
  expect(reportEvidenceRedactionProofs.every(proof => proof.questionRawSecretsHidden && proof.drawerRawSecretsHidden && proof.bodyRawSecretsHidden)).toBe(true)
  expect(reportEvidenceRedactionProofs.every(proof => proof.clipboardRawSecretsHidden && proof.manualCopyRawSecretsHidden)).toBe(true)
  expect(reportEvidenceRedactionProofs.every(proof => proof.redactionVisible)).toBe(true)

  const verifiedAndUnverifiedQaRequestCount = qaProofs.length + unverifiedQaProofs.length
  const claimCitationNoiseBoundaryQaRequestCount = claimCitationNoiseBoundaryProofs.length
  const fileAnchorDriftQaRequestCount = fileAnchorDriftQaProofs.length
  const claimRoleDistributionMissingQaRequestCount = claimRoleDistributionMissingProofs.length
  const claimRoleDistributionMismatchQaRequestCount = claimRoleDistributionMismatchProofs.length
  const claimRoleDistributionMissingMarker = {
    status: 'OK',
    requestCount: claimRoleDistributionMissingQaRequestCount,
    sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
    claimCitationStatus: 'READY',
    roleDistributionPresent: claimRoleDistributionMissingProofs.every(proof => proof.roleDistributionPresent),
    repairEvidenceGateReviewVisible: claimRoleDistributionMissingProofs.every(proof => proof.repairEvidenceGateReviewVisible),
    trustSummaryReviewVisible: claimRoleDistributionMissingProofs.every(proof => proof.trustSummaryReviewVisible),
    latestNextActionRepairHidden: claimRoleDistributionMissingProofs.every(proof => proof.latestNextActionRepairHidden),
    latestCitationRepairHidden: claimRoleDistributionMissingProofs.every(proof => proof.latestCitationRepairHidden),
  }
  const claimRoleDistributionMismatchMarker = {
    status: 'OK',
    requestCount: claimRoleDistributionMismatchQaRequestCount,
    sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
    claimCitationStatus: 'READY',
    roleDistributionPresent: claimRoleDistributionMismatchProofs.every(proof => proof.roleDistributionPresent),
    mismatchFlags: {
      requiredClaimCountMismatch: claimRoleDistributionMismatchProofs.every(proof => proof.mismatchFlags.requiredClaimCountMismatch),
      requiredPrimaryBoundClaimCountMismatch: claimRoleDistributionMismatchProofs.every(proof => proof.mismatchFlags.requiredPrimaryBoundClaimCountMismatch),
      nonZeroContextOnly: claimRoleDistributionMismatchProofs.every(proof => proof.mismatchFlags.nonZeroContextOnly),
      nonZeroUnbacked: claimRoleDistributionMismatchProofs.every(proof => proof.mismatchFlags.nonZeroUnbacked),
      nonZeroInvalid: claimRoleDistributionMismatchProofs.every(proof => proof.mismatchFlags.nonZeroInvalid),
      validCitationFileCountMismatch: claimRoleDistributionMismatchProofs.every(proof => proof.mismatchFlags.validCitationFileCountMismatch),
      requiredClaimCitationFileCountMismatch: claimRoleDistributionMismatchProofs.every(proof => proof.mismatchFlags.requiredClaimCitationFileCountMismatch),
    },
    repairEvidenceGateReviewVisible: claimRoleDistributionMismatchProofs.every(proof => proof.repairEvidenceGateReviewVisible),
    trustSummaryReviewVisible: claimRoleDistributionMismatchProofs.every(proof => proof.trustSummaryReviewVisible),
    latestNextActionRepairHidden: claimRoleDistributionMismatchProofs.every(proof => proof.latestNextActionRepairHidden),
    latestCitationRepairHidden: claimRoleDistributionMismatchProofs.every(proof => proof.latestCitationRepairHidden),
  }
  const readyDeepEvidenceProofs = qaProofs.map(proof => proof.deepEvidenceReadability)
  const reviewDeepEvidenceProofs = fileAnchorDriftQaProofs.map(proof => proof.deepEvidenceReadability)
  const allDeepEvidenceProofs = [...readyDeepEvidenceProofs, ...reviewDeepEvidenceProofs]
  const mobileDeepEvidenceProofs = allDeepEvidenceProofs.filter(proof => proof.mobileViewport)

  console.log('REPORT_EVIDENCE_QA_CITATION_UI_SMOKE_OK', JSON.stringify({
    projectId,
    repositoryId,
    scanTaskId,
    expectedEvidenceFile: targetFile,
    qaRequestCount: verifiedAndUnverifiedQaRequestCount,
    qaTotalRequestCount: network.qaRequests.length,
    mockedApiOnly: true,
    unhandledApiRequests: network.unhandledApiRequests.length,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    reportCitationQuality: {
      status: 'OK',
      surface: 'SCAN_TASK_DETAIL_REPORT_CITATION_QUALITY_PANEL',
      visibleAcrossViewports: reportCitationQualityProofs.every(proof => proof.visible),
      citationQuality: Array.from(new Set(reportCitationQualityProofs.map(proof => proof.citationQuality))).sort(),
      sourceDiversityVisible: reportCitationQualityProofs.every(proof => proof.sourceDiversityVisible),
      sourceCoverageVisible: reportCitationQualityProofs.every(proof => proof.sourceCoverageVisible),
      sourceSectionCount: Math.min(...reportCitationQualityProofs.map(proof => proof.sourceSectionCount)),
      sourceSections: Array.from(new Set(reportCitationQualityProofs.flatMap(proof => proof.sourceSections))).sort(),
      sourceSectionLabels: Array.from(new Set(reportCitationQualityProofs.flatMap(proof => proof.sourceSectionLabels))).sort(),
      sourceSectionOrder: reportCitationQualityProofs[0]?.sourceSectionOrder || [],
      sourceSectionLabelOrder: reportCitationQualityProofs[0]?.sourceSectionLabelOrder || [],
      narrativeBinding: Array.from(new Set(reportCitationQualityProofs.map(proof => proof.narrativeBinding))).sort(),
      detailToggleVisible: reportCitationQualityProofs.every(proof => proof.detailToggleVisible),
      detailDefaultCollapsed: reportCitationQualityProofs.every(proof => proof.detailDefaultCollapsed),
      detailOpens: reportCitationQualityProofs.every(proof => proof.detailOpens),
      verdictVisible: reportCitationQualityProofs.every(proof => proof.verdictVisible),
      verdictItemCount: Math.min(...reportCitationQualityProofs.map(proof => proof.verdictItems)),
      verdictBoundaryVisible: reportCitationQualityProofs.every(proof => proof.verdictBoundary),
      boundaryVisible: reportCitationQualityProofs.every(proof => proof.boundaryVisible),
      noOverclaim: reportCitationQualityProofs.every(proof => proof.noOverclaim),
      noHorizontalOverflow: reportCitationQualityProofs.every(proof => proof.noHorizontalOverflow),
      providerQualityClaim: false,
      llmFactClaim: false,
    },
    qaFromEvidence: {
      status: 'OK',
      responseStatus: 200,
      resultCount: Math.min(...qaProofs.map(proof => proof.resultCount)),
      citationCount: Math.min(...qaProofs.map(proof => proof.citationCount)),
      citationCoverage: {
        statuses: Array.from(new Set(qaProofs.map(proof => proof.coverageStatus))).sort(),
        minCoveragePercent: Math.min(...qaProofs.map(proof => proof.coveragePercent)),
        minTotalEvidenceCount: Math.min(...qaProofs.map(proof => proof.coverageTotalEvidenceCount)),
        minCitedEvidenceCount: Math.min(...qaProofs.map(proof => proof.coverageCitedEvidenceCount)),
        minUncitedCandidateCount: Math.min(...qaProofs.map(proof => proof.coverageUncitedCandidateCount)),
        minRepairCandidateCount: Math.min(...qaProofs.map(proof => proof.coverageRepairCandidateCount)),
        minUniqueEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageUniqueEvidenceFileCount)),
        minCitedEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageCitedEvidenceFileCount)),
        minPrimaryEvidenceCount: Math.min(...qaProofs.map(proof => proof.coveragePrimaryEvidenceCount)),
        minCitedPrimaryEvidenceCount: Math.min(...qaProofs.map(proof => proof.coverageCitedPrimaryEvidenceCount)),
        maxUncitedPrimaryEvidenceCount: Math.max(...qaProofs.map(proof => proof.coverageUncitedPrimaryEvidenceCount)),
        minPrimaryEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coveragePrimaryEvidenceFileCount)),
        minCitedPrimaryEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageCitedPrimaryEvidenceFileCount)),
        maxUncitedPrimaryEvidenceFileCount: Math.max(...qaProofs.map(proof => proof.coverageUncitedPrimaryEvidenceFileCount)),
        minContextEvidenceCount: Math.min(...qaProofs.map(proof => proof.coverageContextEvidenceCount)),
        minCitedContextEvidenceCount: Math.min(...qaProofs.map(proof => proof.coverageCitedContextEvidenceCount)),
        minUncitedContextEvidenceCount: Math.min(...qaProofs.map(proof => proof.coverageUncitedContextEvidenceCount)),
        minContextEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageContextEvidenceFileCount)),
        minCitedContextEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageCitedContextEvidenceFileCount)),
        minUncitedContextEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageUncitedContextEvidenceFileCount)),
        minRequiredEvidenceCoveragePercent: Math.min(...qaProofs.map(proof => proof.coverageRequiredEvidenceCoveragePercent)),
        minRequiredEvidenceCount: Math.min(...qaProofs.map(proof => proof.coverageRequiredEvidenceCount)),
        minCitedRequiredEvidenceCount: Math.min(...qaProofs.map(proof => proof.coverageCitedRequiredEvidenceCount)),
        minRequiredEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageRequiredEvidenceFileCount)),
        minCitedRequiredEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageCitedRequiredEvidenceFileCount)),
        coverageScopes: Array.from(new Set(qaProofs.map(proof => proof.coverageScope).filter(Boolean))).sort(),
        evidenceRoleDistribution: {
          statuses: Array.from(new Set(qaProofs.map(proof => proof.coverageRoleDistributionStatus))).sort(),
          minTotalFileCount: Math.min(...qaProofs.map(proof => proof.coverageRoleTotalFileCount)),
          minCitedFileCount: Math.min(...qaProofs.map(proof => proof.coverageRoleCitedFileCount)),
          minPrimaryFileCount: Math.min(...qaProofs.map(proof => proof.coverageRolePrimaryFileCount)),
          minCitedPrimaryFileCount: Math.min(...qaProofs.map(proof => proof.coverageRoleCitedPrimaryFileCount)),
          minContextFileCount: Math.min(...qaProofs.map(proof => proof.coverageRoleContextFileCount)),
          minCitedContextFileCount: Math.min(...qaProofs.map(proof => proof.coverageRoleCitedContextFileCount)),
          minRoleCount: Math.min(...qaProofs.map(proof => proof.coverageRoleCount)),
          minFileEntryCount: Math.min(...qaProofs.map(proof => proof.coverageRoleFileEntryCount)),
        },
      },
      crossFileCitationSummary: {
        visible: qaProofs.every(proof => proof.crossFileSummaryVisible),
        tones: Array.from(new Set(qaProofs.map(proof => proof.crossFileSummaryTone))).sort(),
        statuses: Array.from(new Set(qaProofs.map(proof => proof.crossFileSummaryStatus))).sort(),
        crossFileEvidenceSatisfied: qaProofs.every(proof => proof.crossFileSummaryCrossFileEvidenceSatisfied),
        citationBindingSatisfied: qaProofs.every(proof => proof.crossFileSummaryCitationBindingSatisfied),
        claimBindingSatisfied: qaProofs.every(proof => proof.crossFileSummaryClaimBindingSatisfied),
        contextGapVisible: qaProofs.every(proof => proof.crossFileSummaryContextGapVisible),
        minUncitedContextEvidenceCount: Math.min(...qaProofs.map(proof => proof.crossFileSummaryContextGapEvidence)),
        minUncitedContextEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.crossFileSummaryContextGapFiles)),
        currentScanOnly: qaProofs.every(proof => proof.crossFileSummaryCurrentScanOnly),
        sourceEvidenceMatchTypes: Array.from(new Set(qaProofs.map(proof => proof.crossFileSummarySourceEvidenceMatchType).filter(Boolean))).sort(),
        minEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageUniqueEvidenceFileCount)),
        minCitedEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageCitedEvidenceFileCount)),
        minPrimaryEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coveragePrimaryEvidenceFileCount)),
        minCitedPrimaryEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageCitedPrimaryEvidenceFileCount)),
        minContextEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageContextEvidenceFileCount)),
        minCitedContextEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageCitedContextEvidenceFileCount)),
        minRequiredEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageRequiredEvidenceFileCount)),
        minCitedRequiredEvidenceFileCount: Math.min(...qaProofs.map(proof => proof.coverageCitedRequiredEvidenceFileCount)),
        minRequiredClaimCount: Math.min(...qaProofs.map(proof => proof.claimRequiredClaimCount)),
        minRequiredClaimCitationFileCount: Math.min(...qaProofs.map(proof => proof.claimRequiredClaimCitationFileCount)),
        minRequiredPrimaryFileCount: Math.min(...qaProofs.map(proof => proof.claimRoleRequiredPrimaryFileCount)),
        minRequiredPrimaryBoundClaimCount: Math.min(...qaProofs.map(proof => proof.claimRoleRequiredPrimaryBoundClaimCount)),
      },
      claimCitationCoverage: {
        statuses: Array.from(new Set(qaProofs.map(proof => proof.claimCitationStatus))).sort(),
        readyForRepair: qaProofs.every(proof => proof.claimReadyForRepair),
        readinessReasons: Array.from(new Set(qaProofs.map(proof => proof.claimReadinessReason).filter(Boolean))).sort(),
        minClaimCoveragePercent: Math.min(...qaProofs.map(proof => proof.claimCoveragePercent)),
        minRequiredClaimCount: Math.min(...qaProofs.map(proof => proof.claimRequiredClaimCount)),
        minCitedRequiredClaimCount: Math.min(...qaProofs.map(proof => proof.claimCitedRequiredClaimCount)),
        maxUncitedRequiredClaimCount: Math.max(...qaProofs.map(proof => proof.claimUncitedRequiredClaimCount)),
        maxInvalidCitationClaimCount: Math.max(...qaProofs.map(proof => proof.claimInvalidCitationClaimCount)),
        minValidCitationFileCount: Math.min(...qaProofs.map(proof => proof.claimValidCitationFileCount)),
        minRequiredClaimCitationFileCount: Math.min(...qaProofs.map(proof => proof.claimRequiredClaimCitationFileCount)),
        roleDistribution: {
          statuses: Array.from(new Set(qaProofs.map(proof => proof.claimRoleDistributionStatus))).sort(),
          minRequiredClaimCount: Math.min(...qaProofs.map(proof => proof.claimRoleRequiredClaimCount)),
          minRequiredPrimaryBoundClaimCount: Math.min(...qaProofs.map(proof => proof.claimRoleRequiredPrimaryBoundClaimCount)),
          maxRequiredContextOnlyClaimCount: Math.max(...qaProofs.map(proof => proof.claimRoleRequiredContextOnlyClaimCount)),
          maxRequiredUnknownOnlyClaimCount: Math.max(...qaProofs.map(proof => proof.claimRoleRequiredUnknownOnlyClaimCount)),
          maxUnbackedRequiredClaimCount: Math.max(...qaProofs.map(proof => proof.claimRoleUnbackedRequiredClaimCount)),
          maxInvalidRequiredClaimCount: Math.max(...qaProofs.map(proof => proof.claimRoleInvalidRequiredClaimCount)),
          minValidCitationFileCount: Math.min(...qaProofs.map(proof => proof.claimRoleValidCitationFileCount)),
          minRequiredClaimCitationFileCount: Math.min(...qaProofs.map(proof => proof.claimRoleRequiredClaimCitationFileCount)),
          minRequiredPrimaryFileCount: Math.min(...qaProofs.map(proof => proof.claimRoleRequiredPrimaryFileCount)),
          minRoleCount: Math.min(...qaProofs.map(proof => proof.claimRoleCount)),
          minFileEntryCount: Math.min(...qaProofs.map(proof => proof.claimRoleFileEntryCount)),
        },
      },
      groundingStatuses: Array.from(new Set(qaProofs.map(proof => proof.groundingStatus))).sort(),
      citationEnforcementStatuses: Array.from(new Set(qaProofs.map(proof => proof.citationEnforcementStatus))).sort(),
      citationEnforcementReasons: Array.from(new Set(qaProofs.map(proof => proof.citationEnforcementReason))).sort(),
      relationAwareEvidenceReason: {
        status: 'OK',
        marker: 'Graph relation:',
        minCitationReasonCount: Math.min(...qaProofs.map(proof => proof.graphRelationEvidenceReasonCitationCount)),
        minRetrievedChunkReasonCount: Math.min(...qaProofs.map(proof => proof.graphRelationEvidenceReasonChunkCount)),
        adjacentContextReasonVisible: qaProofs.every(proof => proof.graphRelationEvidenceReasonAdjacentContext),
        uiReasonVisible: qaProofs.every(proof => proof.graphRelationEvidenceReasonVisible),
        providerQualityClaim: false,
        llmFactClaim: false,
      },
      citedChunkCount: Math.min(...qaProofs.map(proof => proof.citedChunkCount)),
      expectedEvidenceFileVisible: true,
      evidenceRef: {
        requestBound: true,
        responseBound: true,
        contextVisible: true,
        filePath: targetFile,
        lineNumber: null,
        lineRange: evidenceLineRange,
        startLine: evidenceStartLine,
        endLine: evidenceEndLine,
        category: evidenceCategory,
        source: evidenceSource,
        title: evidenceTitle,
      },
      sourceLocationConfidence: {
        readyVisible: qaProofs.every(proof => proof.sourceLocationConfidenceReadyVisible),
        reviewVisibleForFileAnchorDrift: fileAnchorDriftQaProofs.every(proof => proof.sourceLocationConfidenceReviewVisible),
        lineAnchorType: 'REPORT_LINE_ANCHOR',
        fileAnchorDriftType: 'REPORT_FILE_ANCHOR',
      },
      evidenceLineRangePriority: {
        status: 'OK',
        proofCount: qaLineRangeConflictProofs.length,
        structuredRangePriority: qaLineRangeConflictProofs.every(proof => proof.structuredRangePriority),
        legacyLineHidden: qaLineRangeConflictProofs.every(proof => proof.legacyLineHidden),
        visibleRanges: Array.from(new Set(qaLineRangeConflictProofs.map(proof => proof.visibleRange))).sort(),
        conflictLegacyLineNumbers: Array.from(new Set(qaLineRangeConflictProofs.map(proof => proof.legacyLineNumber))).sort(),
        mobile390Covered: qaLineRangeConflictProofs.some(proof => proof.viewportName === 'mobile'),
        narrow320Covered: qaLineRangeConflictProofs.some(proof => proof.viewportName === 'narrow'),
        noHorizontalOverflow: qaLineRangeConflictProofs.every(proof => proof.noHorizontalOverflow),
      },
      deepEvidenceCardReadability: {
        status: 'OK',
        mobile390Covered: allDeepEvidenceProofs.some(proof => proof.viewportName === 'mobile'),
        narrow320Covered: allDeepEvidenceProofs.some(proof => proof.viewportName === 'narrow'),
        sourceReceipt: {
          readyVisible: readyDeepEvidenceProofs.every(proof => proof.mode === 'ready' && proof.sourceReceipt.visible),
          reviewVisible: reviewDeepEvidenceProofs.every(proof => proof.mode === 'review' && proof.sourceReceipt.visible),
          contained: allDeepEvidenceProofs.every(proof => proof.sourceReceipt.contained),
          referenceWraps: mobileDeepEvidenceProofs.every(proof => proof.sourceReceipt.referenceWraps),
          titleNotClipped: mobileDeepEvidenceProofs.every(proof => proof.sourceReceipt.titleNotClipped),
          tagsNotClipped: mobileDeepEvidenceProofs.every(proof => proof.sourceReceipt.tagsNotClipped),
          structuredRangeVisible: readyDeepEvidenceProofs.every(proof => proof.sourceReceipt.structuredRangeVisible),
        },
        sourceLocationConfidence: {
          readyContained: readyDeepEvidenceProofs.every(proof => proof.sourceLocationConfidence.contained),
          reviewContained: reviewDeepEvidenceProofs.every(proof => proof.sourceLocationConfidence.contained),
          metricsNotClipped: mobileDeepEvidenceProofs.every(proof => proof.sourceLocationConfidence.metricsNotClipped),
          checksWrap: mobileDeepEvidenceProofs.every(proof => proof.sourceLocationConfidence.checksWrap),
          llmFactBoundaryVisible: allDeepEvidenceProofs.every(proof => proof.sourceLocationConfidence.llmFactBoundaryVisible),
        },
        sourceFileMatchRelease: {
          readyContained: readyDeepEvidenceProofs.every(proof => proof.sourceFileMatchRelease.contained),
          reviewContained: reviewDeepEvidenceProofs.every(proof => proof.sourceFileMatchRelease.contained),
          targetReferenceNotClipped: mobileDeepEvidenceProofs.every(proof => proof.sourceFileMatchRelease.targetReferenceNotClipped),
          citedReferenceNotClipped: mobileDeepEvidenceProofs.every(proof => proof.sourceFileMatchRelease.citedReferenceNotClipped),
          checksNotClipped: mobileDeepEvidenceProofs.every(proof => proof.sourceFileMatchRelease.checksNotClipped),
          noRepairOnReview: reviewDeepEvidenceProofs.every(proof => proof.sourceFileMatchRelease.noRepairOnReview),
        },
        noHorizontalOverflow: allDeepEvidenceProofs.every(proof => proof.noHorizontalOverflow),
        providerQualityClaim: false,
        llmFactClaim: false,
      },
      repairEvidenceGate: {
        readyVisible: true,
        sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
      },
      unverifiedCitation: {
        status: 'OK',
        responseStatus: 200,
        resultCount: Math.min(...unverifiedQaProofs.map(proof => proof.resultCount)),
        citationCount: Math.min(...unverifiedQaProofs.map(proof => proof.citationCount)),
        citationCoverage: {
          statuses: Array.from(new Set(unverifiedQaProofs.map(proof => proof.coverageStatus))).sort(),
          minCoveragePercent: Math.min(...unverifiedQaProofs.map(proof => proof.coveragePercent)),
          minTotalEvidenceCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageTotalEvidenceCount)),
          minCitedEvidenceCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageCitedEvidenceCount)),
          minUncitedCandidateCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageUncitedCandidateCount)),
          minRepairCandidateCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRepairCandidateCount)),
          minUniqueEvidenceFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageUniqueEvidenceFileCount)),
          maxCitedEvidenceFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageCitedEvidenceFileCount)),
          minPrimaryEvidenceCount: Math.min(...unverifiedQaProofs.map(proof => proof.coveragePrimaryEvidenceCount)),
          minCitedPrimaryEvidenceCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageCitedPrimaryEvidenceCount)),
          minPrimaryEvidenceFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coveragePrimaryEvidenceFileCount)),
          maxCitedPrimaryEvidenceFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageCitedPrimaryEvidenceFileCount)),
          minContextEvidenceCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageContextEvidenceCount)),
          minCitedContextEvidenceCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageCitedContextEvidenceCount)),
          minContextEvidenceFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageContextEvidenceFileCount)),
          maxCitedContextEvidenceFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageCitedContextEvidenceFileCount)),
          minRequiredEvidenceCoveragePercent: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRequiredEvidenceCoveragePercent)),
          minRequiredEvidenceCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRequiredEvidenceCount)),
          minCitedRequiredEvidenceCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageCitedRequiredEvidenceCount)),
          minRequiredEvidenceFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRequiredEvidenceFileCount)),
          maxCitedRequiredEvidenceFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageCitedRequiredEvidenceFileCount)),
          coverageScopes: Array.from(new Set(unverifiedQaProofs.map(proof => proof.coverageScope).filter(Boolean))).sort(),
          evidenceRoleDistribution: {
            statuses: Array.from(new Set(unverifiedQaProofs.map(proof => proof.coverageRoleDistributionStatus))).sort(),
            minTotalFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRoleTotalFileCount)),
            maxCitedFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageRoleCitedFileCount)),
            minPrimaryFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRolePrimaryFileCount)),
            maxCitedPrimaryFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageRoleCitedPrimaryFileCount)),
            minContextFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRoleContextFileCount)),
            maxCitedContextFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageRoleCitedContextFileCount)),
            minRoleCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRoleCount)),
            minFileEntryCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRoleFileEntryCount)),
          },
        },
        crossFileCitationSummary: {
          visible: unverifiedQaProofs.every(proof => proof.crossFileSummaryVisible),
          tones: Array.from(new Set(unverifiedQaProofs.map(proof => proof.crossFileSummaryTone))).sort(),
          statuses: Array.from(new Set(unverifiedQaProofs.map(proof => proof.crossFileSummaryStatus))).sort(),
          crossFileEvidenceSatisfied: unverifiedQaProofs.every(proof => proof.crossFileSummaryCrossFileEvidenceSatisfied),
          citationBindingSatisfied: unverifiedQaProofs.every(proof => proof.crossFileSummaryCitationBindingSatisfied),
          claimBindingSatisfied: unverifiedQaProofs.every(proof => proof.crossFileSummaryClaimBindingSatisfied),
          currentScanOnly: unverifiedQaProofs.every(proof => proof.crossFileSummaryCurrentScanOnly),
          sourceEvidenceMatchTypes: Array.from(new Set(unverifiedQaProofs.map(proof => proof.crossFileSummarySourceEvidenceMatchType).filter(Boolean))).sort(),
          minEvidenceFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageUniqueEvidenceFileCount)),
          maxCitedEvidenceFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageCitedEvidenceFileCount)),
          minPrimaryEvidenceFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coveragePrimaryEvidenceFileCount)),
          maxCitedPrimaryEvidenceFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageCitedPrimaryEvidenceFileCount)),
          minContextEvidenceFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageContextEvidenceFileCount)),
          maxCitedContextEvidenceFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageCitedContextEvidenceFileCount)),
          minRequiredEvidenceFileCount: Math.min(...unverifiedQaProofs.map(proof => proof.coverageRequiredEvidenceFileCount)),
          maxCitedRequiredEvidenceFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.coverageCitedRequiredEvidenceFileCount)),
          minRequiredClaimCount: Math.min(...unverifiedQaProofs.map(proof => proof.claimRequiredClaimCount)),
          maxRequiredClaimCitationFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRequiredClaimCitationFileCount)),
          maxRequiredPrimaryFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRoleRequiredPrimaryFileCount)),
          maxRequiredPrimaryBoundClaimCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRoleRequiredPrimaryBoundClaimCount)),
        },
        claimCitationCoverage: {
          statuses: Array.from(new Set(unverifiedQaProofs.map(proof => proof.claimCitationStatus))).sort(),
          minClaimCoveragePercent: Math.min(...unverifiedQaProofs.map(proof => proof.claimCoveragePercent)),
          minRequiredClaimCount: Math.min(...unverifiedQaProofs.map(proof => proof.claimRequiredClaimCount)),
          minCitedRequiredClaimCount: Math.min(...unverifiedQaProofs.map(proof => proof.claimCitedRequiredClaimCount)),
          maxUncitedRequiredClaimCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimUncitedRequiredClaimCount)),
          maxInvalidCitationClaimCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimInvalidCitationClaimCount)),
          maxValidCitationFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimValidCitationFileCount)),
          maxRequiredClaimCitationFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRequiredClaimCitationFileCount)),
          roleDistribution: {
            statuses: Array.from(new Set(unverifiedQaProofs.map(proof => proof.claimRoleDistributionStatus))).sort(),
            maxRequiredPrimaryBoundClaimCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRoleRequiredPrimaryBoundClaimCount)),
            maxRequiredPrimaryFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRoleRequiredPrimaryFileCount)),
            maxValidCitationFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRoleValidCitationFileCount)),
            maxRequiredClaimCitationFileCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRoleRequiredClaimCitationFileCount)),
            maxRoleCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRoleCount)),
            maxFileEntryCount: Math.max(...unverifiedQaProofs.map(proof => proof.claimRoleFileEntryCount)),
          },
        },
        groundingStatuses: Array.from(new Set(unverifiedQaProofs.map(proof => proof.groundingStatus))).sort(),
        citationEnforcementStatuses: Array.from(new Set(unverifiedQaProofs.map(proof => proof.citationEnforcementStatus))).sort(),
        uncitedCandidateCount: Math.min(...unverifiedQaProofs.map(proof => proof.uncitedCandidateCount)),
        expectedEvidenceFileVisible: true,
        evidenceRefRequestBound: true,
        evidenceRefResponseBound: true,
        repairEvidenceGateBlockedVisible: true,
      },
      claimCitationNoiseBoundary: {
        status: 'OK',
        requestCount: claimCitationNoiseBoundaryQaRequestCount,
        noiseKinds: Array.from(new Set(claimCitationNoiseBoundaryProofs.flatMap(proof => proof.claimCitationNoiseBoundaryKinds))).sort(),
        coverageStatus: 'NONE',
        maxCitedEvidenceCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.coverageCitedEvidenceCount)),
        maxRepairCandidateCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.coverageRepairCandidateCount)),
        claimCitationStatus: 'REVIEW',
        maxCitedRequiredClaimCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.claimCitedRequiredClaimCount)),
        maxInvalidCitationClaimCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.claimInvalidCitationClaimCount)),
        roleDistributionStatus: 'REVIEW_UNCITED',
        maxRequiredPrimaryBoundClaimCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.claimRoleRequiredPrimaryBoundClaimCount)),
        groundingStatuses: Array.from(new Set(claimCitationNoiseBoundaryProofs.map(proof => proof.groundingStatus))).sort(),
        citationEnforcementStatuses: Array.from(new Set(claimCitationNoiseBoundaryProofs.map(proof => proof.citationEnforcementStatus))).sort(),
        answerCitationsCitedByAnswer: false,
        repairEvidenceGateBlockedVisible: claimCitationNoiseBoundaryProofs.every(proof => proof.repairEvidenceGateBlockedVisible),
        rawAnswerStored: false,
        rawPromptStored: false,
        providerQualityClaim: false,
        llmFactClaim: false,
      },
      fileAnchorDrift: {
        status: 'OK',
        responseStatus: 200,
        requestCount: fileAnchorDriftQaRequestCount,
        sourceEvidenceMatchTypes: Array.from(new Set(fileAnchorDriftQaProofs.map(proof => proof.sourceEvidenceMatchType).filter(Boolean))).sort(),
        citationCoverage: {
          statuses: Array.from(new Set(fileAnchorDriftQaProofs.map(proof => proof.coverageStatus))).sort(),
          coverageScopes: Array.from(new Set(fileAnchorDriftQaProofs.map(proof => proof.coverageScope))).sort(),
          maxPrimaryEvidenceCount: Math.max(...fileAnchorDriftQaProofs.map(proof => proof.coveragePrimaryEvidenceCount)),
          minContextEvidenceCount: Math.min(...fileAnchorDriftQaProofs.map(proof => proof.coverageContextEvidenceCount)),
          maxRepairCandidateCount: Math.max(...fileAnchorDriftQaProofs.map(proof => proof.coverageRepairCandidateCount)),
          evidenceRoleDistribution: {
            statuses: Array.from(new Set(fileAnchorDriftQaProofs.map(proof => proof.coverageRoleDistributionStatus))).sort(),
          },
        },
        claimCitationCoverage: {
          statuses: Array.from(new Set(fileAnchorDriftQaProofs.map(proof => proof.claimCitationStatus))).sort(),
          minRequiredClaimCount: Math.min(...fileAnchorDriftQaProofs.map(proof => proof.claimRequiredClaimCount)),
          minCitedRequiredClaimCount: Math.min(...fileAnchorDriftQaProofs.map(proof => proof.claimCitedRequiredClaimCount)),
          roleDistribution: {
            statuses: Array.from(new Set(fileAnchorDriftQaProofs.map(proof => proof.claimRoleDistributionStatus))).sort(),
            maxRequiredPrimaryBoundClaimCount: Math.max(...fileAnchorDriftQaProofs.map(proof => proof.claimRoleRequiredPrimaryBoundClaimCount)),
            maxRequiredPrimaryFileCount: Math.max(...fileAnchorDriftQaProofs.map(proof => proof.claimRoleRequiredPrimaryFileCount)),
            minRequiredContextOnlyClaimCount: Math.min(...fileAnchorDriftQaProofs.map(proof => proof.claimRoleRequiredContextOnlyClaimCount)),
          },
        },
        groundingStatuses: Array.from(new Set(fileAnchorDriftQaProofs.map(proof => proof.groundingStatus))).sort(),
        citationEnforcementStatuses: Array.from(new Set(fileAnchorDriftQaProofs.map(proof => proof.citationEnforcementStatus))).sort(),
        repairEvidenceGateBlockedVisible: fileAnchorDriftQaProofs.every(proof => proof.repairEvidenceGateBlockedVisible),
        trustSummaryBlockedVisible: fileAnchorDriftQaProofs.every(proof => proof.trustSummaryBlockedVisible),
        crossFileSummaryContextGapVisible: fileAnchorDriftQaProofs.every(proof => proof.crossFileSummaryContextGapVisible),
        latestNextActionRepairHidden: fileAnchorDriftQaProofs.every(proof => proof.latestNextActionRepairHidden),
        latestCitationRepairHidden: fileAnchorDriftQaProofs.every(proof => proof.latestCitationRepairHidden),
      },
      drift: {
        claimRoleDistributionMissing: claimRoleDistributionMissingMarker,
        claimRoleDistributionMismatch: claimRoleDistributionMismatchMarker,
      },
      claimRoleDistributionMissing: {
        ...claimRoleDistributionMissingMarker,
      },
      claimRoleDistributionMismatch: {
        ...claimRoleDistributionMismatchMarker,
      },
    },
    fullReleaseAuthorityRefreshed: false,
    baseURLHost,
    spec: 'report-evidence-drawer-smoke.spec.ts',
  }))

  console.log('REPORT_EVIDENCE_DRAWER_SMOKE_OK', JSON.stringify({
    projectId,
    repositoryId,
    scanTaskId,
    expectedEvidenceFile: targetFile,
    drawerQueryCount: drawerQueries.length,
    readyDrawerQueryCount: readyDrawerQueries.length,
    gapDrawerQueryCount: gapDrawerQueries.length,
    drawerActionRail: {
      readyVisible: true,
      gapVisible: true,
      readyRepairActionVisible: true,
    readyRepairActionEnabled: true,
    gapRepairCreationActionHidden: true,
    gapLocalizationActionVisible: true,
    gapLocalizationActionDisabled: true,
    repairGateReasonVisible: gapEvidenceProofs.every(proof => proof.repairGateBlockedReasonVisible),
    },
    trustedReportLoop: {
      surface: 'SCAN_TASK_DETAIL_TRUSTED_REPORT_LOOP',
      visible: trustedLoopProofs.every(proof => proof.visible),
      stepCount: Math.min(...trustedLoopProofs.map(proof => proof.stepCount)),
      expectedStepNames: trustedLoopProofs[0]?.expectedStepNames || [],
      desktopColumnCount: trustedLoopProofs.find(proof => proof.viewportName === 'desktop')?.gridColumnCount || 0,
      mobile390Covered: trustedLoopProofs.some(proof => proof.viewportName === 'mobile' && proof.gridColumnCount === 1),
      narrow320Covered: trustedLoopProofs.some(proof => proof.viewportName === 'narrow' && proof.gridColumnCount === 1),
      noHorizontalOverflow: trustedLoopProofs.every(proof => proof.noHorizontalOverflow),
    },
    recommendedStep: {
      visible: recommendedStepProofs.every(proof => proof.visible),
      stepKeys: Array.from(new Set(recommendedStepProofs.map(proof => proof.stepKey || ''))),
      gateVisible: recommendedStepProofs.every(proof => proof.gateVisible),
      gateReadyVisible: recommendedStepProofs.some(proof => proof.gateReadyVisible),
      gateBlockedVisible: recommendedStepProofs.some(proof => proof.gateBlockedVisible),
      gateReasonVisible: recommendedStepProofs.every(proof => proof.gateReasonVisible),
      gateReasonStyleSafe: recommendedStepProofs.every(proof => proof.gateReasonStyleSafe),
      mobile390Covered: recommendedStepProofs.some(proof => proof.viewportName === 'mobile'),
      narrow320Covered: recommendedStepProofs.some(proof => proof.viewportName === 'narrow'),
      noHorizontalOverflow: recommendedStepProofs.every(proof => proof.noHorizontalOverflow),
    },
    mainPathGuide: {
      visible: mainPathGuideProofs.every(proof => proof.visible),
      stepCount: Math.min(...mainPathGuideProofs.map(proof => proof.stepCount)),
      order: mainPathGuideProofs[0]?.order || [],
      labels: mainPathGuideProofs[0]?.labels || [],
      mobile390Covered: mainPathGuideProofs.some(proof => proof.viewportName === 'mobile'),
      narrow320Covered: mainPathGuideProofs.some(proof => proof.viewportName === 'narrow'),
      noHorizontalOverflow: mainPathGuideProofs.every(proof => proof.noHorizontalOverflow),
    },
    actionBoard: {
      visible: actionBoardProofs.every(proof => proof.visible),
      actionCount: Math.min(...actionBoardProofs.map(proof => proof.actionCount)),
      actionKeys: actionBoardProofs[0]?.actionKeys || [],
      codeQaLinkVisible: actionBoardProofs.every(proof => proof.codeQaLinkVisible),
      repairCandidateVisible: actionBoardProofs.every(proof => proof.repairCandidateVisible),
      mobile390Covered: actionBoardProofs.some(proof => proof.viewportName === 'mobile'),
      narrow320Covered: actionBoardProofs.some(proof => proof.viewportName === 'narrow'),
      noHorizontalOverflow: actionBoardProofs.every(proof => proof.noHorizontalOverflow),
    },
    reviewGate: {
      visible: reviewGateProofs.every(proof => proof.visible),
      gateCount: Math.min(...reviewGateProofs.map(proof => proof.gateCount)),
      gateKeys: reviewGateProofs[0]?.gateKeys || [],
      minReadyCount: Math.min(...reviewGateProofs.map(proof => proof.readyCount)),
      mobile390Covered: reviewGateProofs.some(proof => proof.viewportName === 'mobile'),
      narrow320Covered: reviewGateProofs.some(proof => proof.viewportName === 'narrow'),
      textNotClipped: reviewGateProofs.every(proof => proof.textNotClipped),
      noHorizontalOverflow: reviewGateProofs.every(proof => proof.noHorizontalOverflow),
    },
    evidenceProfileTraceMapReadability: {
      surface: 'SCAN_TASK_DETAIL_REPORT_EVIDENCE_PROFILE_AND_TRACE_MAP',
      profileVisible: evidenceProfileTraceMapProofs.every(proof => proof.profileVisible),
      profileItemCount: Math.min(...evidenceProfileTraceMapProofs.map(proof => proof.profileItemCount)),
      traceVisible: evidenceProfileTraceMapProofs.every(proof => proof.traceVisible),
      traceCardCount: Math.min(...evidenceProfileTraceMapProofs.map(proof => proof.traceCardCount)),
      traceGateCount: Math.min(...evidenceProfileTraceMapProofs.map(proof => proof.traceGateCount)),
      traceGateProofs: evidenceProfileTraceMapProofs.map(proof => ({
        viewportName: proof.viewportName,
        cards: proof.traceGateProofs,
      })),
      traceGateVisible: evidenceProfileTraceMapProofs.every(proof => proof.traceGateVisible),
      traceGateReasonVisible: evidenceProfileTraceMapProofs.every(proof => proof.traceGateReasonVisible),
      traceGateReasonStyleSafe: evidenceProfileTraceMapProofs.every(proof => proof.traceGateReasonStyleSafe),
      traceCardMinButtonCount: Math.min(...evidenceProfileTraceMapProofs.map(proof => proof.traceCardMinButtonCount)),
      mobile390Covered: evidenceProfileTraceMapProofs.some(proof => proof.viewportName === 'mobile'),
      narrow320Covered: evidenceProfileTraceMapProofs.some(proof => proof.viewportName === 'narrow'),
      textNotClipped: evidenceProfileTraceMapProofs.every(proof => proof.textNotClipped),
      noHorizontalOverflow: evidenceProfileTraceMapProofs.every(proof => proof.noHorizontalOverflow),
    },
    reportGovernanceTimelineReadability: {
      surface: 'SCAN_TASK_DETAIL_REPORT_GOVERNANCE_TIMELINE',
      visible: governanceTimelineReadabilityProofs.every(proof => proof.visible),
      cardCount: Math.min(...governanceTimelineReadabilityProofs.map(proof => proof.cardCount)),
      stageCount: Math.min(...governanceTimelineReadabilityProofs.map(proof => proof.stageCount)),
      eventVisible: governanceTimelineReadabilityProofs.every(proof => proof.eventVisible),
      gateReasonVisible: governanceTimelineReadabilityProofs.every(proof => proof.gateReasonVisible),
      mobile390Covered: governanceTimelineReadabilityProofs.some(proof => proof.viewportName === 'mobile'),
      narrow320Covered: governanceTimelineReadabilityProofs.some(proof => proof.viewportName === 'narrow'),
      textNotClipped: governanceTimelineReadabilityProofs.every(proof => proof.textNotClipped),
      noHorizontalOverflow: governanceTimelineReadabilityProofs.every(proof => proof.noHorizontalOverflow),
    },
    reportApiDbTableReadability: {
      surface: 'SCAN_TASK_DETAIL_REPORT_API_DB_TABLE_EVIDENCE_FIELDS',
      apiPathVisible: apiDbTableReadabilityProofs.every(proof => proof.apiPathVisible),
      apiControllerVisible: apiDbTableReadabilityProofs.every(proof => proof.apiControllerVisible),
      dbFileVisible: apiDbTableReadabilityProofs.every(proof => proof.dbFileVisible),
      mobile390Covered: apiDbTableReadabilityProofs.some(proof => proof.viewportName === 'mobile'),
      narrow320Covered: apiDbTableReadabilityProofs.some(proof => proof.viewportName === 'narrow'),
      textNotClipped: apiDbTableReadabilityProofs.every(proof => proof.textNotClipped),
      noHorizontalOverflow: apiDbTableReadabilityProofs.every(proof => proof.noHorizontalOverflow),
    },
    priorityRail: {
      visible: priorityRailProofs.every(proof => proof.visible),
      firstEvidenceOpensDrawer: priorityRailProofs.every(proof => proof.firstEvidenceOpensDrawer),
      readyActionVisible: priorityRailProofs.every(proof => proof.readyActionVisible),
      repairActionVisibleOnlyForFileBoundRisk: priorityRailProofs.every(proof => proof.repairActionVisibleOnlyForFileBoundRisk),
      nonRepairActionsMarked: priorityRailProofs.every(proof => proof.nonRepairActionsMarked),
      repairGateReadyVisible: priorityRailProofs.every(proof => proof.repairGateReadyVisible),
      repairGateBlockedVisible: priorityRailProofs.every(proof => proof.repairGateBlockedVisible),
      repairGateReasonVisible: priorityRailProofs.every(proof => proof.repairGateReasonVisible),
      gapRepairHiddenOrDisabled: gapEvidenceProofs.every(proof => proof.gapRepairHiddenOrDisabled),
      mobile390Covered: priorityRailProofs.some(proof => proof.viewportName === 'mobile'),
      narrow320Covered: priorityRailProofs.some(proof => proof.viewportName === 'narrow'),
      noHorizontalOverflow: priorityRailProofs.every(proof => proof.noHorizontalOverflow),
    },
    codeChunksSearchRedaction: {
      rawReportSecretsHidden: drawerQueries.every(query => forbiddenReportEvidenceSecretSnippets.every(secret => !decodeURIComponent(query).includes(secret))),
      redactionMarkerVisibleInReadyQuery: readyDrawerQueries.every(query => decodeURIComponent(query).includes('[REDACTED]')),
    },
    layoutDensity: {
      mobile390Covered: viewportMatrix.some(viewport => viewport.width === 390 && viewport.height === 844),
      narrow320Covered: viewportMatrix.some(viewport => viewport.width === 320 && viewport.height === 740),
      drawerContained: true,
      codeChunksContained: true,
      citationReadinessContained: true,
      decisionSummaryContained: true,
      handoffSummaryContained: true,
      actionRailContained: true,
      noHorizontalOverflow: true,
    },
    mobileReadability: {
      criticalTextsWrap: true,
      targetFileNotClipped: true,
      chunkEvidenceNotClipped: true,
      readinessTextNotClipped: true,
      decisionSummaryNotClipped: true,
      handoffTextNotClipped: true,
      actionButtonsNotClipped: true,
    },
    codeChunkPreviewRedaction: {
      scope: 'REPORT_EVIDENCE_CODE_CHUNK_PREVIEW_DISPLAY_REDACTION_ONLY',
      fixtureHasRawSecretSentinel: codeChunkPreviewRedactionProofs.every(proof => proof.fixtureHasRawSecretSentinel),
      fixtureHasBearerSecret: codeChunkPreviewRedactionProofs.every(proof => proof.fixtureHasBearerSecret),
      fixtureHasApiKeySecret: codeChunkPreviewRedactionProofs.every(proof => proof.fixtureHasApiKeySecret),
      fixtureHasJwtSecret: codeChunkPreviewRedactionProofs.every(proof => proof.fixtureHasJwtSecret),
      rawSecretsHidden: codeChunkPreviewRedactionProofs.every(proof => proof.rawSecretsHidden),
      bodyHidden: codeChunkPreviewRedactionProofs.every(proof => proof.bodyHidden),
      redactionVisible: codeChunkPreviewRedactionProofs.every(proof => proof.redactionVisible),
      minRedactedPreviewCount: Math.min(...codeChunkPreviewRedactionProofs.map(proof => proof.redactedPreviewCount)),
      markerContainsRawSecret: false,
    },
    questionReferenceDeeplinkRedaction: {
      scope: 'SCAN_TASK_DETAIL_REPORT_EVIDENCE_DRAWER_QUESTION_REFERENCE_DEEPLINK_DISPLAY_REDACTION_ONLY',
      fixtureHasRawSecret: reportEvidenceRedactionProofs.every(proof => proof.fixtureHasRawSecret),
      safeMarkerVisible: reportEvidenceRedactionProofs.every(proof => proof.safeMarkerVisible),
      questionRawSecretsHidden: reportEvidenceRedactionProofs.every(proof => proof.questionRawSecretsHidden),
      drawerRawSecretsHidden: reportEvidenceRedactionProofs.every(proof => proof.drawerRawSecretsHidden),
      bodyRawSecretsHidden: reportEvidenceRedactionProofs.every(proof => proof.bodyRawSecretsHidden),
      clipboardRawSecretsHidden: reportEvidenceRedactionProofs.every(proof => proof.clipboardRawSecretsHidden),
      manualCopyRawSecretsHidden: reportEvidenceRedactionProofs.every(proof => proof.manualCopyRawSecretsHidden),
      redactionVisible: reportEvidenceRedactionProofs.every(proof => proof.redactionVisible),
      markerContainsRawSecret: false,
    },
    mockedApiOnly: true,
    unhandledApiRequests: network.unhandledApiRequests.length,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    baseURLHost,
    spec: 'report-evidence-drawer-smoke.spec.ts',
  }))
  const markerText = JSON.stringify({
    codeChunkPreviewRedactionProofs,
    reportEvidenceRedactionProofs,
    markerContainsRawSecret: false,
  })
  for (const secret of forbiddenCodeChunkSecretSnippets) {
    expect(markerText, `marker must not include raw code chunk preview secret: ${secret}`).not.toContain(secret)
  }
  for (const secret of forbiddenReportEvidenceSecretSnippets) {
    expect(markerText, `marker must not include raw report evidence secret: ${secret}`).not.toContain(secret)
  }
})
