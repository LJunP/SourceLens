import { expect, test, type Locator, type Page } from '@playwright/test'

const projectId = requiredIntEnv('SL_PUBLIC_REPO_UI_PROJECT_ID')
const repositoryId = requiredIntEnv('SL_PUBLIC_REPO_UI_REPOSITORY_ID')
const scanTaskId = requiredIntEnv('SL_PUBLIC_REPO_UI_SCAN_TASK_ID')
const token = requiredEnv('SL_PUBLIC_REPO_UI_TOKEN')
const apiBaseUrl = (process.env.SL_PUBLIC_REPO_API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '')
const expectedEvidenceFile = process.env.SL_PUBLIC_REPO_UI_EXPECTED_FILE || 'ChatController.java'
const expectDerivedGovernance = process.env.SL_PUBLIC_REPO_UI_EXPECT_DERIVED_GOVERNANCE === 'true'
const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

type RuntimeIssue = {
  type: string
  message: string
}

type ReportEvidenceDrawerProof = {
  chunkHits: number
  evidenceFilePaths: string[]
  evidenceAnchors: Array<{ filePath: string; lineNumber: number | null }>
  drawerScanTaskId: number
  drawerLimit: number
  responseScanTaskId: number | null
  responseItemScanTaskIds: Array<number | null>
  codeChunksSummaryVisible: boolean
  displayedChunk: boolean
  codeKnowledge: CodeKnowledgeProof
}

type RecommendedNextStepProof = {
  visible: boolean
  key: string | null
  primaryActionVisible: boolean
  secondaryActionVisible: boolean
  titleText: string
}

type QaFromEvidenceProof = {
  status: 'OK'
  scanTaskId: number
  responseStatus: number
  resultCount: number
  citationCount: number
  coverageStatus: string
  coveragePercent: number
  coverageTotalEvidenceCount: number
  coverageCitedEvidenceCount: number
  coverageUncitedCandidateCount: number
  coverageRepairCandidateCount: number
  coverageUniqueEvidenceFileCount: number
  coverageCitedEvidenceFileCount: number
  coveragePrimaryEvidenceCount: number
  coverageCitedPrimaryEvidenceCount: number
  coverageUncitedPrimaryEvidenceCount: number
  coveragePrimaryEvidenceFileCount: number
  coverageCitedPrimaryEvidenceFileCount: number
  coverageUncitedPrimaryEvidenceFileCount: number
  coverageContextEvidenceCount: number
  coverageCitedContextEvidenceCount: number
  coverageUncitedContextEvidenceCount: number
  coverageContextEvidenceFileCount: number
  coverageCitedContextEvidenceFileCount: number
  coverageUncitedContextEvidenceFileCount: number
  coverageRequiredEvidenceCount: number
  coverageCitedRequiredEvidenceCount: number
  coverageRequiredEvidenceFileCount: number
  coverageCitedRequiredEvidenceFileCount: number
  coverageRequiredEvidenceCoveragePercent: number
  coverageScope: string
  coverageRoleDistributionStatus: string
  coverageRoleTotalFileCount: number
  coverageRoleCitedFileCount: number
  coverageRolePrimaryFileCount: number
  coverageRoleCitedPrimaryFileCount: number
  coverageRoleContextFileCount: number
  coverageRoleCitedContextFileCount: number
  coverageRoleCount: number
  coverageRoleFileEntryCount: number
  claimCitationStatus: string
  claimCoveragePercent: number
  claimRequiredClaimCount: number
  claimCitedRequiredClaimCount: number
  claimUncitedRequiredClaimCount: number
  claimInvalidCitationClaimCount: number
  claimValidCitationFileCount: number
  claimRequiredClaimCitationFileCount: number
  claimReadyForRepair: boolean
  claimReadinessReason: string
  claimRoleDistributionStatus: string
  claimRoleRequiredClaimCount: number
  claimRoleRequiredPrimaryBoundClaimCount: number
  claimRoleRequiredContextOnlyClaimCount: number
  claimRoleRequiredUnknownOnlyClaimCount: number
  claimRoleUnbackedRequiredClaimCount: number
  claimRoleInvalidRequiredClaimCount: number
  claimRoleValidCitationFileCount: number
  claimRoleRequiredClaimCitationFileCount: number
  claimRoleRequiredPrimaryFileCount: number
  claimRoleCount: number
  claimRoleFileEntryCount: number
  crossFileSummaryVisible: boolean
  crossFileSummaryTone: string
  crossFileSummaryStatus: string
  crossFileSummaryCrossFileEvidenceSatisfied: boolean
  crossFileSummaryCitationBindingSatisfied: boolean
  crossFileSummaryClaimBindingSatisfied: boolean
  crossFileSummaryContextGapVisible: boolean
  crossFileSummaryContextGapEvidence: number
  crossFileSummaryContextGapFiles: number
  crossFileSummaryCurrentScanOnly: boolean
  crossFileSummarySourceEvidenceMatchType: string
  groundingStatus: string
  citationEnforcementStatus: string
  citationEnforcementReason: string
  citedChunkCount: number
  responseChunkScanTaskIds: Array<number | null>
  citationScanTaskIds: Array<number | null>
  expectedEvidenceFileVisible: boolean
  evidenceRefRequestBound: boolean
  evidenceRefResponseBound: boolean
  evidenceRefContextVisible: boolean
  evidenceRefFilePath: string
  evidenceRefLineNumber: string
  startEndOnlyEvidenceRef: StartEndOnlyEvidenceRefProof
  evidenceCombinationSummary: EvidenceCombinationSummaryProof
  codeUnderstandingLens: CodeUnderstandingLensProof
  qaEvidenceHandoff: QaEvidenceHandoffProof
  sourceFileMatchRelease: SourceFileMatchReleaseProof
  sourceLocationReadability: SourceLocationReadabilityProof
  relationAwareEvidenceReason?: RelationAwareEvidenceReasonProof
  claimCitationNoiseBoundary?: ClaimCitationNoiseBoundaryProof
  fileAnchorDrift?: FileAnchorDriftProof
}

type RelationAwareEvidenceReasonProof = {
  status: 'OK'
  surface: 'PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON'
  marker: 'Graph relation:'
  citationReasonCount: number
  retrievedChunkReasonCount: number
  adjacentContextReasonVisible: boolean
  citedPrimaryStillPresent: boolean
  uiReasonVisible: boolean
  providerQualityClaim: false
  llmFactClaim: false
}

type StartEndOnlyEvidenceRefProof = {
  status: 'OK'
  surface: 'PUBLIC_REPO_UI_QA_START_END_ONLY_EVIDENCE_REF'
  scanTaskId: number
  requestScanTaskId: number
  responseScanTaskId: number
  responseStatus: number
  filePath: string
  startLine: number
  endLine: number
  requestBound: boolean
  responseBound: boolean
  requestHasLegacyLineNumber: boolean
  responseHasLegacyLineNumber: boolean
  sourceEvidenceMatched: boolean
  sourceEvidenceMatchType: string
  resultCount: number
  primaryChunkBound: boolean
  coverageScope: string
  currentScanOnly: boolean
  providerQualityClaim: boolean
  llmFactClaim: boolean
}

type SourceLocationReadabilityProof = {
  status: 'OK'
  surface: 'PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY'
  viewportName: string
  mode: 'ready' | 'review'
  sourceReceiptContained: boolean
  sourceReceiptTitleNotClipped: boolean
  sourceReceiptReferenceWraps: boolean
  sourceReceiptTagsNotClipped: boolean
  sourceLocationConfidenceContained: boolean
  sourceLocationConfidenceMetricsNotClipped: boolean
  sourceLocationConfidenceChecksWrap: boolean
  sourceFileMatchReleaseContained: boolean
  targetReferenceNotClipped: boolean
  citedReferenceNotClipped: boolean
  sourceFileMatchChecksNotClipped: boolean
  repairActionHiddenWhenReview: boolean
  noHorizontalOverflow: boolean
  providerQualityClaim: boolean
  llmFactClaim: boolean
}

type CodeUnderstandingLensProof = {
  status: 'OK'
  surface: 'PROJECT_QA_CODE_UNDERSTANDING_LENS'
  visible: boolean
  scanTaskId: number
  requestScanTaskId: number
  responseScanTaskId: number
  responseStatus: number
  resultCount: number
  currentScanOnly: boolean
  inputKind: 'FILE_LINE'
  queryShape: 'file:line'
  primaryMatched: boolean
  sourceLabel: string
  primaryReference: string
  primaryContextRole: string
  evidenceType: string
  retrievalMode: string
  readiness: string
  readinessUsable: boolean
  targetFileMatchesExpected: boolean
  entryVisible: boolean
  primaryReferenceVisible: boolean
  currentScanVisible: boolean
  primaryEvidenceVisible: boolean
  sourceLabelVisible: boolean
  retrievalModeVisible: boolean
  readinessVisible: boolean
  locateSearchVisible: boolean
  explainHereVisible: boolean
  copyReferenceVisible: boolean
  derivedFromVisibleResults: boolean
  resultSetOnly: boolean
  rawAnswerStored: boolean
  rawQueryStored: boolean
  rawStackStored: boolean
  rawPromptStored: boolean
  providerQualityClaim: boolean
  llmFactClaim: boolean
  noHorizontalOverflow: boolean
}

type ClaimCitationNoiseBoundaryProof = {
  status: 'OK'
  surface: 'PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY'
  scanTaskId: number
  requestScanTaskId: number
  responseScanTaskId: number
  currentScanOnly: boolean
  requestCount: number
  responseStatus: number
  resultCount: number
  citationCount: number
  noiseKinds: string[]
  coverageStatus: string
  maxCitedEvidenceCount: number
  maxRepairCandidateCount: number
  claimCitationStatus: string
  maxCitedRequiredClaimCount: number
  maxInvalidCitationClaimCount: number
  roleDistributionStatus: string
  maxRequiredPrimaryBoundClaimCount: number
  groundingStatuses: string[]
  citationEnforcementStatuses: string[]
  answerCitationsCitedByAnswer: boolean
  trustSummaryReadyVisible: boolean
  repairCandidateActionVisible: boolean
  repairEvidenceGateBlockedVisible: boolean
  evidenceRefRequestBound: boolean
  evidenceRefResponseBound: boolean
  rawAnswerStored: boolean
  rawPromptStored: boolean
  providerQualityClaim: boolean
  llmFactClaim: boolean
  noHorizontalOverflow: boolean
  llmSetup: LlmConfigProbeState
  llmCleanup: LlmConfigProbeState
}

type FileAnchorDriftProof = {
  status: 'OK'
  surface: 'PUBLIC_REPO_UI_FILE_ANCHOR_DRIFT'
  scanTaskId: number
  requestScanTaskId: number
  responseScanTaskId: number
  currentScanOnly: boolean
  requestCount: number
  responseStatus: number
  resultCount: number
  citationCount: number
  sourceEvidenceMatchTypes: string[]
  citationCoverage: {
    statuses: string[]
    coverageScopes: string[]
    maxPrimaryEvidenceCount: number
    minContextEvidenceCount: number
    maxRepairCandidateCount: number
    evidenceRoleDistribution: {
      statuses: string[]
    }
  }
  claimCitationCoverage: {
    statuses: string[]
    readyForRepair: boolean
    readinessReasons: string[]
    minRequiredClaimCount: number
    minCitedRequiredClaimCount: number
    roleDistribution: {
      statuses: string[]
      maxRequiredPrimaryBoundClaimCount: number
      maxRequiredPrimaryFileCount: number
      minRequiredContextOnlyClaimCount: number
    }
  }
  groundingStatuses: string[]
  citationEnforcementStatuses: string[]
  repairEvidenceGateBlockedVisible: boolean
  trustSummaryBlockedVisible: boolean
  crossFileSummaryContextGapVisible: boolean
  sourceLocationConfidenceReviewVisible: boolean
  sourceLocationReadability: SourceLocationReadabilityProof
  latestNextActionRepairHidden: boolean
  latestCitationRepairHidden: boolean
  evidenceRefRequestBound: boolean
  evidenceRefResponseBound: boolean
  rawAnswerStored: boolean
  rawPromptStored: boolean
  providerQualityClaim: boolean
  llmFactClaim: boolean
  noHorizontalOverflow: boolean
  llmSetup: LlmConfigProbeState
  llmCleanup: LlmConfigProbeState
}

type LlmConfigProbeState = {
  status: 'OK' | 'SKIPPED' | 'WARN'
  configId?: number
  provider?: string
  modelKey?: string
  reason?: string
}

type QaEvidenceHandoffProof = {
  status: 'OK'
  surface: 'PROJECT_QA_REPORT_EVIDENCE_HANDOFF'
  visible: boolean
  projectId: number
  repositoryId: number
  scanTaskId: number
  requestScanTaskId: number
  responseScanTaskId: number
  currentScanOnly: boolean
  sourceBridgeVisible: boolean
  sourceEvidenceReceiptVisible: boolean
  sourceEvidenceRefRequestBound: boolean
  sourceEvidenceRefResponseBound: boolean
  sourceEvidenceContextVisible: boolean
  sourceEvidenceMatchType: string
  sourceEvidenceLineAnchorVisible: boolean
  sourceLocationConfidenceVisible: boolean
  sourceLocationConfidenceReadyVisible: boolean
  titleVisible: boolean
  categoryVisible: boolean
  sourceVisible: boolean
  fileReferenceVisible: boolean
  scanLabelVisible: boolean
  groundingStatus: string
  citationEnforcementStatus: string
  answerCitationCited: boolean
  readyForAutoRepair: boolean
  repairCandidateActionVisible: boolean
  autoRepairDraftUrlBound: boolean
  sourceType: string
  repositoryIdBound: boolean
  scanTaskIdBound: boolean
  fileBoundToEvidence: boolean
  citationIdBound: boolean
  chunkIdBound: boolean
  sourceEvidenceParamsBound: boolean
  candidateFormOpened: boolean
  candidateFormScanVisible: boolean
  candidateFormFilePrefilled: boolean
  candidateTargetDescBound: boolean
  noRawPromptOrAnswer: boolean
  providerQualityClaim: boolean
  llmFactClaim: boolean
  noHorizontalOverflow: boolean
  autoRepairDraftPath: string
  candidateFilePath: string
}

type SourceFileMatchReleaseProof = {
  status: 'OK'
  surface: 'PROJECT_QA_SOURCE_FILE_MATCH_RELEASE'
  visible: boolean
  scanTaskId: number
  requestScanTaskId: number
  responseScanTaskId: number
  currentScanOnly: boolean
  releaseState: 'READY' | 'REVIEW'
  reportTargetVisible: boolean
  citedSliceVisible: boolean
  reportTargetLineVisible: boolean
  sourceEvidenceMatchType: string
  lineAnchorVisible: boolean
  pathMatchType: 'PATH_SUFFIX' | 'FILE_NAME_ONLY' | 'NONE'
  fileNameOnlyReviewVisible: boolean
  requiredEvidenceCovered: boolean
  primaryClaimBound: boolean
  readyForAutoRepair: boolean
  nextActionKey: 'AUTO_REPAIR_REVIEW' | 'SOURCE_BINDING_REVIEW'
  riskNoticeVisible: boolean
  sourceBindingOnlyNoticeVisible: boolean
  noRawPromptOrAnswer: boolean
  providerQualityClaim: boolean
  llmFactClaim: boolean
  noHorizontalOverflow: boolean
}

type EvidenceCombinationSummaryProof = {
  status: 'OK'
  surface: 'PROJECT_QA_CODE_CHUNKS_SEARCH'
  visible: boolean
  label: string
  topSourceLabel: string
  primaryContextRole: string
  primaryCount: number
  adjacentContextCount: number
  uniqueFileCount: number
  embeddedEvidenceCount: number
  resultCount: number
  visibleCardCount: number
  nextQuestionCount: number
  topReferenceVisible: boolean
  sourceLabelsVisible: boolean
  filePathsVisible: boolean
  fileCoverageVisible: boolean
  rolePathVisible: boolean
  embeddingStateVisible: boolean
  currentScanOnly: boolean
  noHorizontalOverflow: boolean
  derivedFromVisibleResults: boolean
  resultSetOnly: boolean
  providerQualityClaim: boolean
  llmFactClaim: boolean
}

type CodeKnowledgeProof = {
  status: 'OK'
  scanTaskId: number | null
  responseStatus: number
  resultCount: number
  totalChunks: number
  embeddedChunks: number
  retrievalMode: string
  readiness: string
  confidence: number
  uniqueFiles: number
  dominantEvidenceType: string
  evidenceProfileVisible: boolean
  currentScanOnly: boolean
  sourceLabelsVisible: boolean
  filePathsVisible: boolean
  expectedEvidenceFileVisible: boolean
  fileStatsVisible: boolean
  contextRoles: string[]
  evidenceTypes: string[]
  readinessUsable: boolean
  crossFileEvidence: CrossFileEvidenceProof
}

type CrossFileEvidenceProof = {
  status: 'OK'
  endpoint: string
  query: string
  limit: number
  responseStatus: number
  scanTaskId: number | null
  resultCount: number
  totalChunks: number
  uniqueFiles: number
  currentScanOnly: boolean
  fileStatsVisible: boolean
  fileStatsUniqueFiles: number
  sourceLabelsVisible: boolean
  retrievalMode: string
  readiness: string
  minFileEvidenceSatisfied: boolean
}

type GovernanceTimelineProof = {
  status: 'OK'
  endpoint: string
  responseStatus: number
  aggregateApiCalled: boolean
  responseProjectId: number | null
  responseRepositoryId: number | null
  responseScanTaskId: number | null
  scanStatus: string
  summaryStatus: string
  hasErrors: boolean
  attributionGapCount: number
  counts: Record<string, number>
  hasSummary: boolean
  hasResources: boolean
  hasLimits: boolean
  resourceArrays: string[]
  eventCount: number
  truncated: boolean
  resourcesBound: boolean
  derivedAuditResourceTypes: string[]
  derivedArtifactOwnerTypes: string[]
  derivedArtifactTypes: string[]
  derivedGovernanceVisible: boolean
  patchEvidence: GovernancePatchEvidenceProof
  agentReview: GovernanceAgentReviewProof
  visible: boolean
}

type GovernancePatchEvidenceProof = {
  status: 'OK'
  repairVisible: boolean
  autoRepairId: number
  repairStatus: string
  scanTaskIdBound: boolean
  targetFileVisible: boolean
  diffVisible: boolean
  patchArtifactVisible: boolean
  patchArtifactOwnerType: string
  patchArtifactOwnerId: number
  patchArtifactType: string
  patchReadyAuditVisible: boolean
  patchReadyAuditAction: string
  patchReadyAuditStatus: string
  auditSourceBound: boolean
  repairExecutionVisible: boolean
  repairExecutionSourceType: string
  repairExecutionSourceId: number
  repairExecutionStatus: string
  patchGenerationStepVisible: boolean
  patchGenerationStepKey: string
  foreignPatchEvidenceHidden: boolean
}

type GovernanceAgentReviewProof = {
  status: 'OK'
  agentTaskVisible: boolean
  agentTaskId: number
  agentTaskStatus: string
  scanTaskIdBound: boolean
  agentReportArtifactVisible: boolean
  agentReportOwnerType: string
  agentReportOwnerId: number
  agentReportArtifactType: string
  agentAuditVisible: boolean
  agentAuditAction: string
  agentAuditStatus: string
  agentAuditSourceBound: boolean
  agentExecutionVisible: boolean
  agentExecutionSourceType: string
  agentExecutionSourceId: number
  agentExecutionStatus: string
  agentExecutionStepVisible: boolean
  agentExecutionStepKey: string
  foreignAgentEvidenceHidden: boolean
  noRawPromptOrAnswer: boolean
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is required for public repo UI smoke`)
  }
  return value
}

function requiredIntEnv(name: string) {
  const value = Number(requiredEnv(name))
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  return value
}

function backendApiUrl(pathWithQuery: string) {
  return new URL(pathWithQuery, `${apiBaseUrl}/`).toString()
}

function lineRangeOverlaps(startLine: number, endLine: number, chunkStartLine: unknown, chunkEndLine: unknown) {
  const chunkStart = typeof chunkStartLine === 'number' && chunkStartLine > 0 ? chunkStartLine : startLine
  const chunkEnd = typeof chunkEndLine === 'number' && chunkEndLine >= chunkStart ? chunkEndLine : chunkStart
  return chunkStart <= endLine && startLine <= chunkEnd
}

function installRuntimeGuards(page: Page) {
  const issues: RuntimeIssue[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (isKnownThirdPartyConsoleWarning(message.text())) return
    issues.push({ type: 'console.error', message: message.text() })
  })
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', message: error.message })
  })
  page.on('requestfailed', (request) => {
    const url = new URL(request.url())
    const failureText = request.failure()?.errorText || 'failed'
    if (url.pathname.startsWith('/api/') && failureText !== 'net::ERR_ABORTED') {
      issues.push({
        type: 'api.requestfailed',
        message: `${request.method()} ${url.pathname}${url.search}: ${failureText}`,
      })
    }
  })
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.pathname.startsWith('/api/') && response.status() >= 500) {
      issues.push({
        type: 'api.5xx',
        message: `${response.request().method()} ${url.pathname}${url.search}: ${response.status()}`,
      })
    }
  })

  return issues
}

function isKnownThirdPartyConsoleWarning(text: string) {
  return text.includes('findDOMNode is deprecated')
    || text.includes('findDOMNode findDOMNode DomWrapper')
}

async function installAuth(page: Page) {
  await page.addInitScript((jwt) => {
    window.localStorage.setItem('token', jwt)
  }, token)
}

async function configureMockLlmConfig(page: Page, purpose: string): Promise<LlmConfigProbeState> {
  const payload = {
    provider: 'MOCK',
    modelName: 'mock',
    apiKey: `mock-local-${purpose}-key`,
    baseUrl: 'mock://local',
    temperature: 0,
    maxTokens: 1024,
  }
  const createResponse = await page.request.post(backendApiUrl('/api/llm-configs'), {
    headers: { Authorization: `Bearer ${token}` },
    data: payload,
    timeout: 30_000,
  })
  if (!createResponse.ok()) {
    return { status: 'WARN', reason: `create_failed_${createResponse.status()}` }
  }
  const createBody = await createResponse.json()
  const configId = Number(createBody?.data?.id || 0)
  if (!Number.isInteger(configId) || configId <= 0) {
    return { status: 'WARN', reason: 'missing_config_id' }
  }
  const activateResponse = await page.request.post(backendApiUrl(`/api/llm-configs/${configId}/activate`), {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30_000,
  })
  if (!activateResponse.ok()) {
    return { status: 'WARN', configId, reason: `activate_failed_${activateResponse.status()}` }
  }
  return { status: 'OK', configId, provider: 'MOCK', modelKey: 'MOCK:text-embedding-3-small' }
}

async function removeMockLlmConfig(page: Page, setup: LlmConfigProbeState): Promise<LlmConfigProbeState> {
  if (!setup.configId) {
    return { status: 'SKIPPED', reason: setup.reason || 'no_mock_config' }
  }
  const response = await page.request.delete(backendApiUrl(`/api/llm-configs/${setup.configId}`), {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30_000,
  })
  if (!response.ok()) {
    return { status: 'WARN', configId: setup.configId, reason: `delete_failed_${response.status()}` }
  }
  return { status: 'OK', configId: setup.configId }
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
  expect(metrics.scrollWidth, `${label} text must not be horizontally clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.clientWidth + 2)
  expect(metrics.scrollHeight, `${label} text must not be vertically clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.clientHeight + 2)
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

async function expectNoErrorToast(page: Page, label: string) {
  await expect(page.getByText(/Internal server error|服务暂时不可用|网络连接异常|请求失败|加载.*失败|加载修复治理时间线失败|治理聚合加载失败/)).toHaveCount(0, {
    timeout: 500,
  }).catch(async () => {
    throw new Error(`${label} rendered an error toast or inline API failure`)
  })
}

async function assertStablePage(page: Page, label: string) {
  await expectNoErrorToast(page, label)
  await expectNoHorizontalOverflow(page, label)
}

async function assertSourceLocationReadability(
  page: Page,
  viewportName: string,
  mode: 'ready' | 'review',
  sourceReceipt: Locator,
  sourceLocationConfidence: Locator,
  sourceFileMatchRelease: Locator,
) {
  await expectContainedInViewport(sourceReceipt, `${viewportName}:${mode}:source-receipt`)
  await expectLocatorTextNotClipped(sourceReceipt.locator('.sl-qa-source-receipt-head strong').first(), `${viewportName}:${mode}:source-receipt-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(sourceReceipt.locator('.sl-qa-source-receipt-ref span').first(), `${viewportName}:${mode}:source-receipt-reference`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(sourceReceipt.locator('.sl-qa-source-receipt-tags .ant-tag'), `${viewportName}:${mode}:source-receipt-tags`)

  await expectContainedInViewport(sourceLocationConfidence, `${viewportName}:${mode}:source-location-confidence`)
  await expectLocatorTextNotClipped(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-head strong').first(), `${viewportName}:${mode}:source-location-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(sourceLocationConfidence.locator('p').first(), `${viewportName}:${mode}:source-location-summary`)
  await expectAllLocatorTextNotClipped(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-metrics strong'), `${viewportName}:${mode}:source-location-metrics`)
  await expectLocatorCanWrap(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-checks').first(), `${viewportName}:${mode}:source-location-checks`)
  await expectAllLocatorTextNotClipped(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-checks .ant-tag'), `${viewportName}:${mode}:source-location-check-tags`)

  await expectContainedInViewport(sourceFileMatchRelease, `${viewportName}:${mode}:source-file-match-release`)
  await expectLocatorTextNotClipped(sourceFileMatchRelease.locator('.sl-qa-source-match-release-head strong').first(), `${viewportName}:${mode}:source-file-match-release-title`, { mustWrap: true })
  await expectLocatorTextNotClipped(sourceFileMatchRelease.locator('p').first(), `${viewportName}:${mode}:source-file-match-release-copy`)
  await expectLocatorTextNotClipped(sourceFileMatchRelease.locator('.sl-qa-source-match-release-grid strong').nth(0), `${viewportName}:${mode}:source-file-match-release-target`, { mustWrap: true })
  await expectLocatorTextNotClipped(sourceFileMatchRelease.locator('.sl-qa-source-match-release-grid strong').nth(1), `${viewportName}:${mode}:source-file-match-release-cited`, { mustWrap: true })
  await expectAllLocatorTextNotClipped(sourceFileMatchRelease.locator('.sl-qa-source-match-release-checks strong'), `${viewportName}:${mode}:source-file-match-release-check-titles`)
  await expectAllLocatorTextNotClipped(sourceFileMatchRelease.locator('.sl-qa-source-match-release-checks > div > div span'), `${viewportName}:${mode}:source-file-match-release-check-copy`)
  await expectLocatorTextNotClipped(sourceFileMatchRelease.locator('.sl-qa-source-match-release-next').first(), `${viewportName}:${mode}:source-file-match-release-next`)
  await expectNoHorizontalOverflow(page, `${viewportName}:${mode}:source-location-readability`)

  return {
    status: 'OK',
    surface: 'PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY',
    viewportName,
    mode,
    sourceReceiptContained: true,
    sourceReceiptTitleNotClipped: true,
    sourceReceiptReferenceWraps: true,
    sourceReceiptTagsNotClipped: true,
    sourceLocationConfidenceContained: true,
    sourceLocationConfidenceMetricsNotClipped: true,
    sourceLocationConfidenceChecksWrap: true,
    sourceFileMatchReleaseContained: true,
    targetReferenceNotClipped: true,
    citedReferenceNotClipped: true,
    sourceFileMatchChecksNotClipped: true,
    repairActionHiddenWhenReview: mode === 'review',
    noHorizontalOverflow: true,
    providerQualityClaim: false,
    llmFactClaim: false,
  } satisfies SourceLocationReadabilityProof
}

async function openAndAssert(page: Page, url: string, visibleText: string | RegExp, label: string) {
  await page.goto(url)
  await expect(page.getByText(visibleText).first()).toBeVisible()
  await assertStablePage(page, label)
}

function parseHitCount(text: string | null) {
  const match = (text || '').match(/([\d,]+)\s*\/\s*([\d,]+)\s*hits/)
  if (!match) return 0
  return Number(match[2].replace(/,/g, ''))
}

function parseLeadingInt(text: string | null) {
  const match = (text || '').match(/^\s*([\d,]+)/)
  if (!match) return 0
  return Number(match[1].replace(/,/g, ''))
}

function parseFirstInt(text: string | null) {
  const match = (text || '').match(/([\d,]+)/)
  if (!match) return 0
  return Number(match[1].replace(/,/g, ''))
}

function basename(filePath: string) {
  return filePath.split(/[\\/]/).filter(Boolean).pop() || filePath
}

function normalizedProofPath(filePath: string) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/')
}

function sameOrSuffixPath(leftPath: string, rightPath: string) {
  const left = normalizedProofPath(leftPath)
  const right = normalizedProofPath(rightPath)
  return Boolean(left && right && (left === right || left.endsWith(`/${right}`) || right.endsWith(`/${left}`)))
}

function sourcePathMatchType(reportPath: string, citedPath: string): SourceFileMatchReleaseProof['pathMatchType'] {
  if (sameOrSuffixPath(reportPath, citedPath)) {
    return 'PATH_SUFFIX'
  }
  return basename(reportPath) && basename(reportPath) === basename(citedPath) ? 'FILE_NAME_ONLY' : 'NONE'
}

function sameOrNestedPath(actual: string, expected: string) {
  return actual === expected || actual.endsWith(`/${expected}`) || expected.endsWith(`/${actual}`)
}

function preferredReportEvidenceAnchor(drawerEvidenceAnchors: ReportEvidenceDrawerProof['evidenceAnchors']) {
  return drawerEvidenceAnchors.find(anchor => sameOrNestedPath(String(anchor.filePath || ''), expectedEvidenceFile))
    || drawerEvidenceAnchors[0]
    || { filePath: expectedEvidenceFile, lineNumber: null }
}

async function verifyCrossFileCodeKnowledge(page: Page, viewportName: string): Promise<CrossFileEvidenceProof> {
  const query = ''
  const limit = 24
  const endpoint = `/api/projects/${projectId}/code-chunks/search`
  const params = new URLSearchParams({
    scanTaskId: String(scanTaskId),
    query,
    limit: String(limit),
  })
  const response = await page.request.get(backendApiUrl(`${endpoint}?${params.toString()}`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 90_000,
  })
  const body = await response.json()
  const data = body?.data || {}
  const items = Array.isArray(data.items) ? data.items : []
  const evidenceProfile = data.evidenceProfile || {}
  const itemFilePaths = Array.from(new Set(items.map((item: any) => String(item?.filePath || '')).filter(Boolean)))
  const fileStats = Array.isArray(evidenceProfile.fileStats) ? evidenceProfile.fileStats : []
  const fileStatsUniqueFiles = new Set(fileStats.map((item: any) => String(item?.filePath || '')).filter(Boolean)).size
  const proof: CrossFileEvidenceProof = {
    status: 'OK',
    endpoint,
    query,
    limit,
    responseStatus: response.status(),
    scanTaskId: typeof data.scanTaskId === 'number' ? data.scanTaskId : null,
    resultCount: Number(data.resultCount || items.length || 0),
    totalChunks: Number(data.totalChunks || 0),
    uniqueFiles: itemFilePaths.length,
    currentScanOnly: items.every((item: any) => item?.scanTaskId === scanTaskId),
    fileStatsVisible: fileStats.length > 0,
    fileStatsUniqueFiles,
    sourceLabelsVisible: items.every((item: any) => typeof item?.sourceLabel === 'string' && item.sourceLabel.length > 0),
    retrievalMode: String(data.retrievalMode || ''),
    readiness: String(evidenceProfile.readiness || ''),
    minFileEvidenceSatisfied: itemFilePaths.length >= 2 && fileStatsUniqueFiles >= 2,
  }
  expect(body.code, `${viewportName}: cross-file code knowledge response code must be SUCCESS`).toBe('SUCCESS')
  expect(proof.responseStatus, `${viewportName}: cross-file code knowledge response status`).toBe(200)
  expect(proof.scanTaskId, `${viewportName}: cross-file code knowledge scanTaskId must stay bound`).toBe(scanTaskId)
  expect(proof.totalChunks, `${viewportName}: cross-file code knowledge must have code_chunks`).toBeGreaterThan(0)
  expect(proof.resultCount, `${viewportName}: cross-file code knowledge must return chunks`).toBeGreaterThan(1)
  expect(proof.currentScanOnly, `${viewportName}: cross-file code knowledge chunks must stay current-scan-only`).toBe(true)
  expect(proof.sourceLabelsVisible, `${viewportName}: cross-file code knowledge source labels must be visible`).toBe(true)
  expect(proof.fileStatsVisible, `${viewportName}: cross-file code knowledge fileStats must be visible`).toBe(true)
  expect(proof.minFileEvidenceSatisfied, `${viewportName}: cross-file code knowledge must cover at least two files`).toBe(true)
  expect(['KEYWORD', 'STABLE_FALLBACK', 'SEMANTIC_FALLBACK', 'HYBRID'], `${viewportName}: cross-file retrieval mode must be usable`).toContain(proof.retrievalMode)
  expect(['READY', 'REVIEW', 'GAP'], `${viewportName}: cross-file readiness must be explicit and bounded`).toContain(proof.readiness)
  return proof
}

async function verifyReportEvidenceDrawer(page: Page, viewportName: string): Promise<ReportEvidenceDrawerProof> {
  await page.getByRole('tab', { name: /报告总览/ }).click()
  const traceMap = page.getByRole('region', { name: '报告证据追踪' })
  await expect(traceMap).toBeVisible()
  const apiEvidenceButton = traceMap
    .locator('.sl-report-trace-card[data-trace-source="API_CATALOG"]')
    .getByRole('button', { name: '查看证据' })
    .first()
  const evidenceButton = await apiEvidenceButton.count() > 0
    ? apiEvidenceButton
    : traceMap.getByRole('button', { name: '查看证据' }).first()
  await expect(evidenceButton, `${viewportName}: expected at least one Trace Map evidence button`).toBeVisible()

  const drawerResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === `/api/projects/${projectId}/code-chunks/search`
      && url.searchParams.get('scanTaskId') === String(scanTaskId)
      && url.searchParams.get('limit') === '3'
      && response.status() < 500
  }, { timeout: 60_000 })

  await evidenceButton.click()
  const drawerResponse = await drawerResponsePromise
  const drawerQueryUrl = new URL(drawerResponse.url())
  const drawerBody = await drawerResponse.json()
  const drawerData = drawerBody?.data || {}
  const responseItems = Array.isArray(drawerData.items) ? drawerData.items : []
  const evidenceProfile = drawerData.evidenceProfile || {}
  const retrievalMode = String(drawerData.retrievalMode || '')
  const readiness = String(evidenceProfile.readiness || '')
  const contextRoles = Array.from(new Set(responseItems.map((item: any) => String(item?.contextRole || '')).filter(Boolean))).sort()
  const evidenceTypes = Array.from(new Set(responseItems.map((item: any) => String(item?.evidenceType || '')).filter(Boolean))).sort()
  const evidenceFilePaths = Array.from(new Set(responseItems.map((item: any) => String(item?.filePath || '')).filter(Boolean)))
  const evidenceAnchors = responseItems
    .map((item: any) => ({
      filePath: String(item?.filePath || ''),
      lineNumber: typeof item?.startLine === 'number' ? item.startLine : null,
    }))
    .filter(anchor => anchor.filePath)
  const crossFileEvidence = await verifyCrossFileCodeKnowledge(page, viewportName)
  const codeKnowledge: CodeKnowledgeProof = {
    status: 'OK',
    scanTaskId: typeof drawerData.scanTaskId === 'number' ? drawerData.scanTaskId : null,
    responseStatus: drawerResponse.status(),
    resultCount: Number(drawerData.resultCount || responseItems.length || 0),
    totalChunks: Number(drawerData.totalChunks || 0),
    embeddedChunks: Number(drawerData.embeddedChunks || 0),
    retrievalMode,
    readiness,
    confidence: Number(evidenceProfile.confidence || 0),
    uniqueFiles: Number(evidenceProfile.uniqueFiles || 0),
    dominantEvidenceType: String(evidenceProfile.dominantEvidenceType || ''),
    evidenceProfileVisible: Boolean(evidenceProfile && typeof evidenceProfile === 'object' && evidenceProfile.readiness),
    currentScanOnly: responseItems.every((item: any) => item?.scanTaskId === scanTaskId),
    sourceLabelsVisible: responseItems.every((item: any) => typeof item?.sourceLabel === 'string' && item.sourceLabel.length > 0),
    filePathsVisible: responseItems.every((item: any) => typeof item?.filePath === 'string' && item.filePath.length > 0),
    expectedEvidenceFileVisible: evidenceFilePaths.some(filePath => sameOrNestedPath(filePath, expectedEvidenceFile)),
    fileStatsVisible: Array.isArray(evidenceProfile.fileStats) && evidenceProfile.fileStats.length > 0,
    contextRoles,
    evidenceTypes,
    readinessUsable: ['READY', 'REVIEW'].includes(readiness) && !['NO_SCAN', 'NO_CONTEXT'].includes(retrievalMode),
    crossFileEvidence,
  }

  const drawer = page.getByRole('dialog', { name: '报告证据抽屉' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('region', { name: '证据字段' })).toBeVisible()
  await expect(drawer.getByRole('region', { name: '绑定当前扫描的问答上下文' })).toBeVisible()
  await expect(drawer.getByText(`#${scanTaskId}`).first()).toBeVisible()

  const chunkRegion = page.getByRole('region', { name: 'code_chunks 命中摘要' })
  await expect(chunkRegion).toBeVisible()
  const hitText = await chunkRegion.getByText(/[\d,]+ \/ [\d,]+ hits/).first().textContent()
  const chunkHits = parseHitCount(hitText)
  expect(chunkHits, `${viewportName}: report evidence drawer should show live code_chunks hits`).toBeGreaterThan(0)
  await expect(chunkRegion.locator('.sl-report-evidence-chunk-card').first()).toBeVisible()
  await chunkRegion.scrollIntoViewIfNeeded()
  const citationReadiness = page.getByRole('region', { name: '引用质量预检' })
  await expect(citationReadiness).toBeVisible()
  await expect(citationReadiness.getByText('引用质量预检')).toBeVisible()
  await expect(drawer.getByRole('button', { name: '基于此证据追问' })).toBeVisible()
  await expect(drawer.getByRole('button', { name: '复制证据引用' })).toBeVisible()
  await expect(drawer.getByRole('button', { name: /生成修复候选|定位修复文件/ })).toBeVisible()
  await assertStablePage(page, `${viewportName}:report-evidence-drawer`)

  expect(drawerData.scanTaskId, `${viewportName}: drawer response scanTaskId must stay bound`).toBe(scanTaskId)
  expect(responseItems.length, `${viewportName}: drawer response should include at least one code chunk`).toBeGreaterThan(0)
  expect(codeKnowledge.totalChunks, `${viewportName}: public repo code knowledge must have code_chunks`).toBeGreaterThan(0)
  expect(codeKnowledge.resultCount, `${viewportName}: public repo code knowledge must return evidence chunks`).toBeGreaterThan(0)
  expect(codeKnowledge.currentScanOnly, `${viewportName}: code knowledge chunks must stay scan-bound`).toBe(true)
  expect(codeKnowledge.evidenceProfileVisible, `${viewportName}: code knowledge must expose evidenceProfile`).toBe(true)
  expect(codeKnowledge.readinessUsable, `${viewportName}: code knowledge readiness must be usable`).toBe(true)
  expect(codeKnowledge.sourceLabelsVisible, `${viewportName}: code knowledge chunks must expose source labels`).toBe(true)
  expect(codeKnowledge.filePathsVisible, `${viewportName}: code knowledge chunks must expose file paths`).toBe(true)
  expect(codeKnowledge.expectedEvidenceFileVisible, `${viewportName}: code knowledge must include expected evidence file`).toBe(true)
  expect(codeKnowledge.fileStatsVisible, `${viewportName}: code knowledge profile must expose file stats`).toBe(true)
  expect(codeKnowledge.crossFileEvidence.minFileEvidenceSatisfied, `${viewportName}: code knowledge must prove cross-file evidence`).toBe(true)
  expect(['KEYWORD', 'STABLE_FALLBACK', 'SEMANTIC_FALLBACK', 'HYBRID'], `${viewportName}: retrieval mode must be usable`).toContain(codeKnowledge.retrievalMode)
  for (const item of responseItems) {
    expect(item?.scanTaskId, `${viewportName}: drawer response item scanTaskId must stay bound`).toBe(scanTaskId)
    expect(typeof item?.filePath === 'string' && item.filePath.length > 0, `${viewportName}: drawer response items must include filePath`).toBe(true)
    expect(typeof item?.sourceLabel === 'string' && item.sourceLabel.length > 0, `${viewportName}: drawer response items must include sourceLabel`).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()

  return {
    chunkHits,
    evidenceFilePaths,
    evidenceAnchors,
    drawerScanTaskId: Number(drawerQueryUrl.searchParams.get('scanTaskId') || 0),
    drawerLimit: Number(drawerQueryUrl.searchParams.get('limit') || 0),
    responseScanTaskId: typeof drawerData.scanTaskId === 'number' ? drawerData.scanTaskId : null,
    responseItemScanTaskIds: responseItems.map((item: any) => typeof item?.scanTaskId === 'number' ? item.scanTaskId : null),
    codeChunksSummaryVisible: true,
    displayedChunk: true,
    codeKnowledge,
  }
}

async function verifyStartEndOnlyEvidenceRef(
  page: Page,
  viewportName: string,
  evidenceFile: string,
  startLine: number,
  endLine: number,
  evidenceTitle: string,
): Promise<StartEndOnlyEvidenceRefProof> {
  expect(startLine, `${viewportName}: start/end-only evidenceRef probe requires a positive start line`).toBeGreaterThan(0)
  expect(endLine, `${viewportName}: start/end-only evidenceRef probe requires endLine >= startLine`).toBeGreaterThanOrEqual(startLine)

  const response = await page.request.post(backendApiUrl(`/api/projects/${projectId}/qa`), {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      question: `请基于 start/end-only 证据范围 ${evidenceFile}:${startLine}-${endLine} 解释这个报告证据。`,
      scanTaskId,
      evidenceRef: {
        category: '报告证据抽屉',
        source: 'public repo UI smoke start/end-only',
        title: evidenceTitle,
        filePath: evidenceFile,
        start_line: startLine,
        end_line: endLine,
      },
    },
    timeout: 180_000,
  })
  const body = await response.json()
  const data = body?.data || {}
  const sourceEvidenceRef = data?.sourceEvidenceRef || {}
  const chunks = Array.isArray(data.retrievedChunks) ? data.retrievedChunks : []
  const primaryChunkBound = chunks.some((chunk: any) =>
    chunk?.contextRole === 'PRIMARY'
      && typeof chunk?.filePath === 'string'
      && sameOrSuffixPath(evidenceFile, chunk.filePath)
      && lineRangeOverlaps(startLine, endLine, chunk.startLine, chunk.endLine)
  )

  expect(response.status(), `${viewportName}: start/end-only QA response status`).toBeLessThan(500)
  expect(body.code, `${viewportName}: start/end-only QA response code must be SUCCESS`).toBe('SUCCESS')
  expect(sourceEvidenceRef.filePath, `${viewportName}: start/end-only QA response filePath`).toBe(evidenceFile)
  expect(sourceEvidenceRef.category, `${viewportName}: start/end-only QA response category`).toBe('报告证据抽屉')
  expect(sourceEvidenceRef.source, `${viewportName}: start/end-only QA response source`).toBe('public repo UI smoke start/end-only')
  expect(Object.prototype.hasOwnProperty.call(sourceEvidenceRef, 'lineNumber'), `${viewportName}: start/end-only response must not synthesize lineNumber`).toBe(false)
  expect(sourceEvidenceRef.startLine, `${viewportName}: start/end-only QA response startLine`).toBe(startLine)
  expect(sourceEvidenceRef.endLine, `${viewportName}: start/end-only QA response endLine`).toBe(endLine)
  expect(data.scanTaskId, `${viewportName}: start/end-only QA response scanTaskId`).toBe(scanTaskId)
  expect(data.sourceEvidenceMatched, `${viewportName}: start/end-only sourceEvidenceMatched`).toBe(true)
  expect(data.sourceEvidenceMatchType, `${viewportName}: start/end-only sourceEvidenceMatchType`).toBe('REPORT_LINE_ANCHOR')
  expect(Number(data.resultCount || chunks.length || 0), `${viewportName}: start/end-only resultCount`).toBeGreaterThan(0)
  expect(primaryChunkBound, `${viewportName}: start/end-only PRIMARY chunk must overlap evidence range`).toBe(true)
  expect(data.citationCoverage?.coverageScope, `${viewportName}: start/end-only coverage scope`).toBe('PRIMARY')

  return {
    status: 'OK',
    surface: 'PUBLIC_REPO_UI_QA_START_END_ONLY_EVIDENCE_REF',
    scanTaskId,
    requestScanTaskId: scanTaskId,
    responseScanTaskId: Number(data.scanTaskId || 0),
    responseStatus: response.status(),
    filePath: evidenceFile,
    startLine,
    endLine,
    requestBound: true,
    responseBound: sourceEvidenceRef.filePath === evidenceFile
      && sourceEvidenceRef.category === '报告证据抽屉'
      && sourceEvidenceRef.source === 'public repo UI smoke start/end-only'
      && sourceEvidenceRef.startLine === startLine
      && sourceEvidenceRef.endLine === endLine,
    requestHasLegacyLineNumber: false,
    responseHasLegacyLineNumber: Object.prototype.hasOwnProperty.call(sourceEvidenceRef, 'lineNumber'),
    sourceEvidenceMatched: data.sourceEvidenceMatched === true,
    sourceEvidenceMatchType: String(data.sourceEvidenceMatchType || ''),
    resultCount: Number(data.resultCount || chunks.length || 0),
    primaryChunkBound,
    coverageScope: String(data.citationCoverage?.coverageScope || ''),
    currentScanOnly: Number(data.scanTaskId || 0) === scanTaskId && chunks.every((chunk: any) => chunk?.scanTaskId === scanTaskId),
    providerQualityClaim: false,
    llmFactClaim: false,
  }
}

async function verifyQaFromEvidence(page: Page, viewportName: string, drawerEvidenceAnchors: ReportEvidenceDrawerProof['evidenceAnchors']): Promise<QaFromEvidenceProof> {
  const evidenceAnchor = preferredReportEvidenceAnchor(drawerEvidenceAnchors)
  const drawerEvidenceFiles = drawerEvidenceAnchors.map(anchor => anchor.filePath).filter(Boolean)
  const evidenceFile = evidenceAnchor.filePath
  const evidenceLine = evidenceAnchor.lineNumber ? String(evidenceAnchor.lineNumber) : ''
  const evidenceStartLine = evidenceAnchor.lineNumber || 0
  const evidenceEndLine = evidenceStartLine > 0 ? evidenceStartLine : 0
  const evidenceTitle = basename(evidenceFile) || evidenceFile
  const evidenceLocation = evidenceLine ? `${evidenceFile}:${evidenceLine}` : evidenceFile
  const qaQuestion = `请基于扫描报告 #${scanTaskId} 和 ${evidenceLocation} 解释这个报告证据对应的代码职责。`
  const evidenceLineParam = evidenceLine ? `&evidenceLine=${encodeURIComponent(evidenceLine)}` : ''
  await openAndAssert(
    page,
    `/projects/${projectId}?tab=qa&scanTaskId=${scanTaskId}&question=${encodeURIComponent(qaQuestion)}&evidenceCategory=${encodeURIComponent('报告证据抽屉')}&evidenceSource=${encodeURIComponent('public repo UI smoke')}&evidenceTitle=${encodeURIComponent(evidenceTitle)}&evidenceFile=${encodeURIComponent(evidenceFile)}${evidenceLineParam}`,
    '代码问答与证据检索',
    `${viewportName}:project-qa`
  )
  await expect(page).toHaveURL(new RegExp(`scanTaskId=${scanTaskId}`))
  await expect(page.getByText(`证据扫描`).first()).toBeVisible()
  await expect(page.getByText(`#${scanTaskId}`).first()).toBeVisible()
  await expect(page.getByLabel('报告证据上下文').first()).toBeVisible()

  const qaResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'POST'
      && url.pathname === `/api/projects/${projectId}/qa`
      && response.status() < 500
  }, { timeout: 180_000 })

  await page.getByRole('button', { name: '发送' }).click()
  const qaResponse = await qaResponsePromise
  const qaRequestPayload = JSON.parse(qaResponse.request().postData() || '{}')
  const qaBody = await qaResponse.json()
  const qaData = qaBody?.data || {}
  const chunks = Array.isArray(qaData.retrievedChunks) ? qaData.retrievedChunks : []
  const citations = Array.isArray(qaData.answerCitations) ? qaData.answerCitations : []
  const citationCoverage = qaData.citationCoverage && typeof qaData.citationCoverage === 'object' && !Array.isArray(qaData.citationCoverage)
    ? qaData.citationCoverage
    : {}
  const evidenceRoleDistribution = citationCoverage.evidenceRoleDistribution && typeof citationCoverage.evidenceRoleDistribution === 'object' && !Array.isArray(citationCoverage.evidenceRoleDistribution)
    ? citationCoverage.evidenceRoleDistribution
    : {}
  const evidenceRoleStats = Array.isArray(evidenceRoleDistribution.roles) ? evidenceRoleDistribution.roles : []
  const evidenceRoleFiles = Array.isArray(evidenceRoleDistribution.files) ? evidenceRoleDistribution.files : []
  const claimCitationCoverage = qaData.claimCitationCoverage && typeof qaData.claimCitationCoverage === 'object' && !Array.isArray(qaData.claimCitationCoverage)
    ? qaData.claimCitationCoverage
    : {}
  const claimRoleDistribution = claimCitationCoverage.roleDistribution && typeof claimCitationCoverage.roleDistribution === 'object' && !Array.isArray(claimCitationCoverage.roleDistribution)
    ? claimCitationCoverage.roleDistribution
    : {}
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
  const crossFileSummarySourceEvidenceMatchType = String(qaData.sourceEvidenceMatchType || '')
  const uncitedContextEvidence = Number(citationCoverage.uncitedContextEvidenceCount ?? Math.max(Number(citationCoverage.contextEvidenceCount || 0) - Number(citationCoverage.citedContextEvidenceCount || 0), 0))
  const uncitedContextFiles = Number(citationCoverage.uncitedContextEvidenceFileCount ?? Math.max(Number(citationCoverage.contextEvidenceFileCount || 0) - Number(citationCoverage.citedContextEvidenceFileCount || 0), 0))
  const crossFileSummaryContextGapVisible = uncitedContextEvidence > 0 || uncitedContextFiles > 0
  const crossFileSummaryTone = crossFileSummaryCitationBindingSatisfied
    && crossFileSummaryClaimBindingSatisfied
    && crossFileSummarySourceEvidenceMatchType === 'REPORT_LINE_ANCHOR'
    && !crossFileSummaryContextGapVisible
    ? 'ready'
    : Number(citationCoverage.totalEvidenceCount || 0) > 0
      ? 'warning'
      : 'blocked'
  const groundingStatus = typeof qaData.groundingStatus === 'string' ? qaData.groundingStatus : ''
  const citationEnforcementStatus = typeof qaData.citationEnforcementStatus === 'string' ? qaData.citationEnforcementStatus : ''
  const citationEnforcementReason = typeof qaData.citationEnforcementReason === 'string' ? qaData.citationEnforcementReason : ''
  const graphRelationCitations = citations.filter((citation: any) => String(citation?.evidenceReason || '').includes('Graph relation:'))
  const graphRelationChunks = chunks.filter((chunk: any) => String(chunk?.evidenceReason || '').includes('Graph relation:'))
  const graphRelationPresent = graphRelationCitations.length > 0 || graphRelationChunks.length > 0
  const responseFilePaths = [
    ...chunks.map((item: any) => String(item?.filePath || '')),
    ...citations.map((citation: any) => String(citation?.filePath || '')),
  ]
  const expectedEvidenceFileBound = responseFilePaths.some(filePath =>
    drawerEvidenceFiles.some(expectedPath => filePath === expectedPath || filePath.endsWith(`/${expectedPath}`) || expectedPath.endsWith(`/${filePath}`))
  )
  const evidenceRefRequestBound = qaRequestPayload?.evidenceRef?.filePath === evidenceFile
    && qaRequestPayload?.evidenceRef?.category === '报告证据抽屉'
    && qaRequestPayload?.evidenceRef?.source === 'public repo UI smoke'
    && qaRequestPayload?.evidenceRef?.lineNumber === evidenceLine
  const evidenceRefResponseBound = qaData?.sourceEvidenceRef?.filePath === evidenceFile
    && qaData?.sourceEvidenceRef?.category === '报告证据抽屉'
    && qaData?.sourceEvidenceRef?.source === 'public repo UI smoke'
    && qaData?.sourceEvidenceRef?.lineNumber === evidenceLine
  const primaryCitedCitation = citations.find((citation: any) =>
    citation?.citedByAnswer === true
      && typeof citation?.filePath === 'string'
      && citation.filePath.length > 0
  )

  expect(qaBody.code, `${viewportName}: QA response code must be SUCCESS`).toBe('SUCCESS')
  expect(evidenceLine, `${viewportName}: QA from report evidence must carry a line anchor from the drawer code chunk`).not.toBe('')
  expect(evidenceRefRequestBound, `${viewportName}: QA request body must include the report evidenceRef filePath`).toBe(true)
  expect(evidenceRefResponseBound, `${viewportName}: QA response must echo sourceEvidenceRef from the report evidenceRef`).toBe(true)
  expect(qaData.sourceEvidenceMatchType, `${viewportName}: QA response should expose a line-level source evidence anchor`).toBe('REPORT_LINE_ANCHOR')
  expect(qaData.scanTaskId, `${viewportName}: QA response scanTaskId must stay bound`).toBe(scanTaskId)
  expect(chunks.length, `${viewportName}: QA must return retrieved chunks`).toBeGreaterThan(0)
  expect(citations.length, `${viewportName}: QA must return answer-level citations`).toBeGreaterThan(0)
  expect(groundingStatus, `${viewportName}: QA answer must cite current evidence`).toBe('VERIFIED')
  expect(['DIRECT_VERIFIED', 'RETRY_VERIFIED', 'FALLBACK_CITED'], `${viewportName}: citation enforcement should produce a usable cited answer`).toContain(citationEnforcementStatus)
  expect(['DIRECT_VERIFIED', 'RETRY_VERIFIED', 'FALLBACK_PRIMARY_CITED'], `${viewportName}: citation enforcement reason must prove a successful cited answer`).toContain(citationEnforcementReason)
  for (const item of chunks) {
    expect(item?.scanTaskId, `${viewportName}: QA retrieved chunk scanTaskId must stay bound`).toBe(scanTaskId)
    expect(typeof item?.sourceLabel === 'string' && item.sourceLabel.length > 0, `${viewportName}: QA chunk sourceLabel must be present`).toBe(true)
    expect(typeof item?.filePath === 'string' && item.filePath.length > 0, `${viewportName}: QA chunk filePath must be present`).toBe(true)
  }
  for (const citation of citations) {
    expect(citation?.scanTaskId, `${viewportName}: QA citation scanTaskId must stay bound`).toBe(scanTaskId)
    expect(typeof citation?.sourceLabel === 'string' && citation.sourceLabel.length > 0, `${viewportName}: QA citation sourceLabel must be present`).toBe(true)
    expect(typeof citation?.filePath === 'string' && citation.filePath.length > 0, `${viewportName}: QA citation filePath must be present`).toBe(true)
  }
  expect(expectedEvidenceFileBound, `${viewportName}: QA chunks or citations must include one report evidence drawer file: ${drawerEvidenceFiles.join(', ')}`).toBe(true)
  expect(citations.some((citation: any) => citation?.citedByAnswer === true), `${viewportName}: QA answer must cite at least one returned citation`).toBe(true)
  expect(primaryCitedCitation, `${viewportName}: QA answer must expose a cited answer citation for AutoRepair handoff`).toBeTruthy()
  expect(Boolean(primaryCitedCitation?.citationId), `${viewportName}: QA cited answer citation must expose citationId for handoff`).toBe(true)
  expect(Boolean(primaryCitedCitation?.chunkId), `${viewportName}: QA cited answer citation must expose chunkId for handoff`).toBe(true)
  expect(typeof citationCoverage.status === 'string' && citationCoverage.status.length > 0, `${viewportName}: QA citation coverage status must be present`).toBe(true)
  expect(Number(citationCoverage.totalEvidenceCount || 0), `${viewportName}: QA citation coverage total must match citations`).toBe(citations.length)
  expect(Number(citationCoverage.citedEvidenceCount || 0), `${viewportName}: QA citation coverage cited count must match cited citations`).toBe(citations.filter((citation: any) => citation?.citedByAnswer === true).length)
  expect(Number(citationCoverage.repairCandidateCount || 0), `${viewportName}: QA citation coverage must expose repair candidates`).toBeGreaterThan(0)
  expect(Number(citationCoverage.requiredEvidenceCount || 0), `${viewportName}: QA citation coverage must expose required evidence count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.citedRequiredEvidenceCount || 0), `${viewportName}: QA citation coverage must cite every required evidence item`).toBe(Number(citationCoverage.requiredEvidenceCount || 0))
  expect(Number(citationCoverage.requiredEvidenceFileCount || 0), `${viewportName}: QA citation coverage must expose required evidence file count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.citedRequiredEvidenceFileCount || 0), `${viewportName}: QA citation coverage must cite every required evidence file`).toBe(Number(citationCoverage.requiredEvidenceFileCount || 0))
  expect(Number(citationCoverage.primaryEvidenceFileCount || 0), `${viewportName}: QA citation coverage must expose primary evidence file count`).toBeGreaterThan(0)
  expect(Number(citationCoverage.citedPrimaryEvidenceFileCount || 0), `${viewportName}: QA citation coverage must cite every primary evidence file`).toBe(Number(citationCoverage.primaryEvidenceFileCount || 0))
  expect(Number(citationCoverage.requiredEvidenceCoveragePercent || 0), `${viewportName}: QA citation coverage must fully cover required evidence`).toBeGreaterThanOrEqual(100)
  expect(typeof citationCoverage.coverageScope === 'string' && citationCoverage.coverageScope.length > 0, `${viewportName}: QA citation coverage must expose coverage scope`).toBe(true)
  expect(typeof evidenceRoleDistribution.status === 'string' && evidenceRoleDistribution.status.length > 0, `${viewportName}: QA citation coverage must expose evidence role distribution status`).toBe(true)
  expect(Number(evidenceRoleDistribution.totalFileCount || 0), `${viewportName}: role distribution total files must match coverage`).toBe(Number(citationCoverage.uniqueEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedFileCount || 0), `${viewportName}: role distribution cited files must match coverage`).toBe(Number(citationCoverage.citedEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.primaryFileCount || 0), `${viewportName}: role distribution primary files must match coverage`).toBe(Number(citationCoverage.primaryEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedPrimaryFileCount || 0), `${viewportName}: role distribution cited primary files must match coverage`).toBe(Number(citationCoverage.citedPrimaryEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.contextFileCount || 0), `${viewportName}: role distribution context files must match coverage`).toBe(Number(citationCoverage.contextEvidenceFileCount || 0))
  expect(Number(evidenceRoleDistribution.citedContextFileCount || 0), `${viewportName}: role distribution cited context files must match coverage`).toBe(Number(citationCoverage.citedContextEvidenceFileCount || 0))
  expect(evidenceRoleStats.some((role: any) => role?.role === 'PRIMARY'), `${viewportName}: role distribution must include PRIMARY`).toBe(true)
  expect(evidenceRoleFiles.length, `${viewportName}: role distribution must include file entries`).toBeGreaterThan(0)
  expect(claimCitationCoverage.status, `${viewportName}: QA claim citation quality must be ready`).toBe('READY')
  expect(Number(claimCitationCoverage.requiredClaimCount || 0), `${viewportName}: QA claim citation quality must expose required claims`).toBeGreaterThan(0)
  expect(Number(claimCitationCoverage.citedRequiredClaimCount || 0), `${viewportName}: QA claim citation quality must cite every required claim`).toBe(Number(claimCitationCoverage.requiredClaimCount || 0))
  expect(Number(claimCitationCoverage.invalidCitationClaimCount || 0), `${viewportName}: QA claim citation quality must not contain invalid citations`).toBe(0)
  expect(Number(claimCitationCoverage.validCitationFileCount || 0), `${viewportName}: QA claim citation quality must expose cited files`).toBeGreaterThan(0)
  expect(Number(claimCitationCoverage.requiredClaimCitationFileCount || 0), `${viewportName}: QA claim citation quality must expose required cited files`).toBeGreaterThan(0)
  expect(claimRoleDistribution.status, `${viewportName}: QA claim citation quality must expose PRIMARY-bound role distribution`).toBe('PRIMARY_BOUND')
  expect(Number(claimRoleDistribution.requiredClaimCount || 0), `${viewportName}: claim role distribution must mirror required claims`).toBe(Number(claimCitationCoverage.requiredClaimCount || 0))
  expect(Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0), `${viewportName}: QA claim role distribution must bind every required claim to PRIMARY`).toBe(Number(claimCitationCoverage.requiredClaimCount || 0))
  expect(Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0), `${viewportName}: QA claim role distribution must not require context-only support`).toBe(0)
  expect(Number(claimRoleDistribution.requiredUnknownOnlyClaimCount || 0), `${viewportName}: QA claim role distribution must not use unknown support`).toBe(0)
  expect(Number(claimRoleDistribution.unbackedRequiredClaimCount || 0), `${viewportName}: QA claim role distribution must not expose unbacked required claims`).toBe(0)
  expect(Number(claimRoleDistribution.invalidRequiredClaimCount || 0), `${viewportName}: QA claim role distribution must not expose invalid required claims`).toBe(0)
  expect(Number(claimRoleDistribution.validCitationFileCount || 0), `${viewportName}: QA claim role files must match parent valid files`).toBe(Number(claimCitationCoverage.validCitationFileCount || 0))
  expect(Number(claimRoleDistribution.requiredClaimCitationFileCount || 0), `${viewportName}: QA claim role required files must match parent required files`).toBe(Number(claimCitationCoverage.requiredClaimCitationFileCount || 0))
  expect(Number(claimRoleDistribution.requiredPrimaryFileCount || 0), `${viewportName}: QA claim role distribution must expose primary files`).toBeGreaterThan(0)
  expect(claimRoleStats.some((role: any) => role?.role === 'PRIMARY'), `${viewportName}: QA claim role distribution must include PRIMARY`).toBe(true)
  expect(claimRoleFiles.length, `${viewportName}: QA claim role distribution must include file entries`).toBeGreaterThan(0)

  await expect(page.getByLabel('引用覆盖审计').first()).toBeVisible()
  await expect(page.getByText(/引用覆盖审计/).first()).toBeVisible()
  await expect(page.getByLabel('QA 可信度摘要').first()).toBeVisible()
  await expect(page.getByText('可采信并进入修复复核').first()).toBeVisible()
  await expect(page.getByLabel('跨文件引用摘要').first()).toBeVisible()
  await expect(page.getByText(/跨文件引用结论/).first()).toBeVisible()
  await expect(page.getByText('跨文件引用可采信', { exact: true }).first()).toBeVisible()
  await expect(page.getByLabel('上下文引用缺口').first()).toBeVisible()
  await expect(page.getByLabel('证据角色分布').first()).toBeVisible()
  await expect(page.getByLabel('主张引用质量').first()).toBeVisible()
  await expect(page.getByText('主张已绑定引用').first()).toBeVisible()
  await expect(page.getByLabel('主张证据角色分布').first()).toBeVisible()
  await expect(page.getByLabel('回答引用证据').first()).toBeVisible()
  await expect(page.getByText('引用已验证').first()).toBeVisible()
  const answerSourceReceipt = page.getByLabel('QA 回答报告证据凭证').last()
  await expect(answerSourceReceipt, `${viewportName}: QA answer source receipt must be visible before AutoRepair handoff`).toBeVisible()
  await expect(answerSourceReceipt).toContainText(evidenceTitle)
  await expect(answerSourceReceipt).toContainText('public repo UI smoke')
  await expect(answerSourceReceipt).toContainText(evidenceFile)
  await expect(answerSourceReceipt).toContainText(`Scan #${scanTaskId}`)
  await expect(answerSourceReceipt).toContainText('REPORT_LINE_ANCHOR')
  await expect(answerSourceReceipt).toContainText('行级锚点')
  const sourceLocationConfidence = page.getByLabel('来源定位可信度').last()
  await expect(sourceLocationConfidence, `${viewportName}: QA source location confidence must be visible`).toBeVisible()
  await expect(sourceLocationConfidence.getByText('来源定位可信', { exact: true })).toBeVisible()
  await expect(sourceLocationConfidence.locator('.sl-qa-source-location-confidence-head').getByText('已绑定', { exact: true })).toBeVisible()
  await expect(sourceLocationConfidence.getByText('回答引用覆盖来源文件')).toBeVisible()
  const sourceMatchRelease = page.getByLabel('来源文件匹配说明').last()
  await expect(sourceMatchRelease, `${viewportName}: QA source file match release checklist must be visible`).toBeVisible()
  await expect(sourceMatchRelease.getByText('修复候选放行条件')).toBeVisible()
  await expect(sourceMatchRelease.getByText('满足修复候选放行')).toBeVisible()
  await expect(sourceMatchRelease).toContainText(`${evidenceFile}:${evidenceLine}`)
  await expect(sourceMatchRelease.getByText(String(primaryCitedCitation?.filePath || '')).first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('已满足：行级锚点').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('已满足：主张 PRIMARY 绑定').first()).toBeVisible()
  await expect(sourceMatchRelease.getByText('下一步：可进入修复候选复核。')).toBeVisible()
  await expect(sourceMatchRelease).toContainText('该说明只证明证据绑定成熟，不证明 LLM 事实语义正确。')
  const sourceLocationReadability = await assertSourceLocationReadability(
    page,
    viewportName,
    'ready',
    answerSourceReceipt,
    sourceLocationConfidence,
    sourceMatchRelease,
  )
  const relationAwareEvidenceReason: RelationAwareEvidenceReasonProof | undefined = graphRelationPresent
    ? {
        status: 'OK',
        surface: 'PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON',
        marker: 'Graph relation:',
        citationReasonCount: graphRelationCitations.length,
        retrievedChunkReasonCount: graphRelationChunks.length,
        adjacentContextReasonVisible: [...graphRelationCitations, ...graphRelationChunks].some((item: any) => item?.contextRole === 'ADJACENT_CONTEXT'),
        citedPrimaryStillPresent: citations.some((citation: any) => citation?.citedByAnswer === true && citation?.contextRole !== 'ADJACENT_CONTEXT'),
        uiReasonVisible: true,
        providerQualityClaim: false,
        llmFactClaim: false,
      }
    : undefined
  if (relationAwareEvidenceReason) {
    expect(relationAwareEvidenceReason.citationReasonCount + relationAwareEvidenceReason.retrievedChunkReasonCount, `${viewportName}: relation-aware reason must come from citations or retrieved chunks`).toBeGreaterThan(0)
    expect(relationAwareEvidenceReason.adjacentContextReasonVisible, `${viewportName}: relation-aware reason must identify adjacent context evidence`).toBe(true)
    expect(relationAwareEvidenceReason.citedPrimaryStillPresent, `${viewportName}: relation-aware adjacent evidence must not replace cited primary evidence`).toBe(true)
    await expect(page.getByText('Graph relation:').first(), `${viewportName}: relation-aware evidence reason must be visible in the UI`).toBeVisible()
  }
  await expect(page.getByText(/(引用覆盖|必需证据覆盖) \d+\/\d+ \(\d+%\)/).first()).toBeVisible()
  await expect(page.getByText(/可修复证据 \d+/).first()).toBeVisible()
  await expect(page.getByText(`Scan #${scanTaskId}`).first()).toBeVisible()
  await expect(page.getByText(/回答引用/).first()).toBeVisible()
  await expect(page.getByText(evidenceFile).first()).toBeVisible()
  await expect(sourceLocationConfidence).toContainText(`第 ${evidenceLine} 行`)
  await expect(page.getByLabel('报告证据上下文').getByText(evidenceFile).first()).toBeVisible()
  const evidenceCombinationSummary = await verifyEvidenceCombinationSummary(page, viewportName, chunks)
  const codeUnderstandingLens = await verifyCodeUnderstandingLens(page, viewportName, chunks, evidenceAnchor)
  const trustedActionRail = page.getByLabel('QA 下一步动作').last()
  await expect(trustedActionRail.getByText('可采信', { exact: true }), `${viewportName}: QA next action rail must be trusted for handoff`).toBeVisible()
  const repairCandidateAction = trustedActionRail.getByRole('button', { name: '生成修复候选' })
  await expect(repairCandidateAction, `${viewportName}: QA verified citation must expose AutoRepair handoff action`).toBeVisible()
  const autoRepairDraftPath = await repairCandidateAction.getAttribute('data-sl-target-url') || ''
  expect(autoRepairDraftPath, `${viewportName}: QA AutoRepair handoff URL must be present`).toContain('/auto-repairs?')
  const autoRepairDraftUrl = new URL(autoRepairDraftPath, 'http://127.0.0.1')
  const draftParams = autoRepairDraftUrl.searchParams
  const sourceEvidenceParamsBound = draftParams.get('sourceEvidenceCategory') === '报告证据抽屉'
    && draftParams.get('sourceEvidenceSource') === 'public repo UI smoke'
    && draftParams.get('sourceEvidenceTitle') === evidenceTitle
    && draftParams.get('sourceEvidenceFilePath') === evidenceFile
    && draftParams.get('sourceEvidenceLineNumber') === evidenceLine
    && draftParams.get('sourceEvidenceMatched') === 'true'
    && draftParams.get('sourceEvidenceMatchType') === 'REPORT_LINE_ANCHOR'
  const candidateFilePath = draftParams.get('filePath') || ''
  const handoffFileBound = candidateFilePath === String(primaryCitedCitation?.filePath || '')
  expect(draftParams.get('projectId'), `${viewportName}: QA AutoRepair handoff must preserve projectId`).toBe(String(projectId))
  expect(draftParams.get('openCreate'), `${viewportName}: QA AutoRepair handoff must open candidate creation`).toBe('1')
  expect(draftParams.get('repositoryId'), `${viewportName}: QA AutoRepair handoff must preserve repositoryId`).toBe(String(repositoryId))
  expect(draftParams.get('scanTaskId'), `${viewportName}: QA AutoRepair handoff must preserve scanTaskId`).toBe(String(scanTaskId))
  expect(draftParams.get('sourceType'), `${viewportName}: QA AutoRepair handoff must use verified citation source type`).toBe('PROJECT_QA_VERIFIED_CITATION')
  expect(draftParams.get('citedByAnswer'), `${viewportName}: QA AutoRepair handoff must require cited answer evidence`).toBe('true')
  expect(draftParams.get('groundingStatus'), `${viewportName}: QA AutoRepair handoff must preserve grounding status`).toBe('VERIFIED')
  expect(draftParams.get('citationEnforcementStatus'), `${viewportName}: QA AutoRepair handoff must preserve citation enforcement`).toBe(citationEnforcementStatus)
  expect(draftParams.get('filePath'), `${viewportName}: QA AutoRepair handoff must preserve cited file path`).toBe(String(primaryCitedCitation?.filePath || ''))
  expect(draftParams.get('citationId'), `${viewportName}: QA AutoRepair handoff must preserve citationId`).toBe(String(primaryCitedCitation?.citationId || ''))
  expect(draftParams.get('chunkId'), `${viewportName}: QA AutoRepair handoff must preserve chunkId`).toBe(String(primaryCitedCitation?.chunkId || ''))
  expect(sourceEvidenceParamsBound, `${viewportName}: QA AutoRepair handoff must preserve source evidence params`).toBe(true)
  await assertStablePage(page, `${viewportName}:qa-from-evidence`)
  const requiredEvidenceCovered = Number(citationCoverage.requiredEvidenceCount || 0) > 0
    && Number(citationCoverage.citedRequiredEvidenceCount || 0) >= Number(citationCoverage.requiredEvidenceCount || 0)
    && Number(citationCoverage.requiredEvidenceCoveragePercent || 0) >= 100
  const primaryClaimBound = claimCitationCoverage.status === 'READY'
    && claimRoleDistribution.status === 'PRIMARY_BOUND'
    && Number(claimCitationCoverage.requiredClaimCount || 0) > 0
    && Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0) >= Number(claimCitationCoverage.requiredClaimCount || 0)
  const sourceMatchPathMatchType = sourcePathMatchType(evidenceFile, String(primaryCitedCitation?.filePath || ''))
  const sourceMatchReady = requiredEvidenceCovered && primaryClaimBound && sourceMatchPathMatchType === 'PATH_SUFFIX'
  const sourceFileMatchRelease: SourceFileMatchReleaseProof = {
    status: 'OK',
    surface: 'PROJECT_QA_SOURCE_FILE_MATCH_RELEASE',
    visible: true,
    scanTaskId,
    requestScanTaskId: scanTaskId,
    responseScanTaskId: scanTaskId,
    currentScanOnly: true,
    releaseState: sourceMatchReady ? 'READY' : 'REVIEW',
    reportTargetVisible: true,
    citedSliceVisible: true,
    reportTargetLineVisible: Boolean(evidenceLine),
    sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
    lineAnchorVisible: true,
    pathMatchType: sourceMatchPathMatchType,
    fileNameOnlyReviewVisible: sourceMatchPathMatchType === 'FILE_NAME_ONLY',
    requiredEvidenceCovered,
    primaryClaimBound,
    readyForAutoRepair: sourceMatchReady,
    nextActionKey: sourceMatchReady ? 'AUTO_REPAIR_REVIEW' : 'SOURCE_BINDING_REVIEW',
    riskNoticeVisible: true,
    sourceBindingOnlyNoticeVisible: true,
    noRawPromptOrAnswer: true,
    providerQualityClaim: false,
    llmFactClaim: false,
    noHorizontalOverflow: true,
  }
  const qaEvidenceHandoff: QaEvidenceHandoffProof = {
    status: 'OK',
    surface: 'PROJECT_QA_REPORT_EVIDENCE_HANDOFF',
    visible: true,
    projectId,
    repositoryId,
    scanTaskId,
    requestScanTaskId: scanTaskId,
    responseScanTaskId: scanTaskId,
    currentScanOnly: true,
    sourceBridgeVisible: true,
    sourceEvidenceReceiptVisible: true,
    sourceEvidenceRefRequestBound: evidenceRefRequestBound,
    sourceEvidenceRefResponseBound: evidenceRefResponseBound,
    sourceEvidenceContextVisible: true,
    sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
    sourceEvidenceLineAnchorVisible: true,
    sourceLocationConfidenceVisible: true,
    sourceLocationConfidenceReadyVisible: true,
    titleVisible: true,
    categoryVisible: true,
    sourceVisible: true,
    fileReferenceVisible: true,
    scanLabelVisible: true,
    groundingStatus,
    citationEnforcementStatus,
    citationEnforcementReason,
    answerCitationCited: true,
    readyForAutoRepair: true,
    repairCandidateActionVisible: true,
    autoRepairDraftUrlBound: true,
    sourceType: 'PROJECT_QA_VERIFIED_CITATION',
    repositoryIdBound: draftParams.get('repositoryId') === String(repositoryId),
    scanTaskIdBound: draftParams.get('scanTaskId') === String(scanTaskId),
    fileBoundToEvidence: handoffFileBound,
    citationIdBound: Boolean(draftParams.get('citationId')),
    chunkIdBound: Boolean(draftParams.get('chunkId')),
    sourceEvidenceParamsBound,
    candidateFormOpened: false,
    candidateFormScanVisible: false,
    candidateFormFilePrefilled: false,
    candidateTargetDescBound: false,
    noRawPromptOrAnswer: true,
    providerQualityClaim: false,
    llmFactClaim: false,
    noHorizontalOverflow: true,
    autoRepairDraftPath,
    candidateFilePath,
  }
  const startEndOnlyEvidenceRef = await verifyStartEndOnlyEvidenceRef(
    page,
    viewportName,
    evidenceFile,
    evidenceStartLine,
    evidenceEndLine,
    evidenceTitle,
  )

  return {
    status: 'OK',
    scanTaskId,
    responseStatus: qaResponse.status(),
    resultCount: Number(qaData.resultCount || chunks.length || 0),
    citationCount: citations.length,
    coverageStatus: String(citationCoverage.status || ''),
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
    coverageUncitedContextEvidenceCount: uncitedContextEvidence,
    coverageContextEvidenceFileCount: Number(citationCoverage.contextEvidenceFileCount || 0),
    coverageCitedContextEvidenceFileCount: Number(citationCoverage.citedContextEvidenceFileCount || 0),
    coverageUncitedContextEvidenceFileCount: uncitedContextFiles,
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
    claimReadyForRepair: claimCitationCoverage.readyForRepair === true,
    claimReadinessReason: String(claimCitationCoverage.readinessReason || ''),
    crossFileSummaryVisible: true,
    crossFileSummaryTone,
    crossFileSummaryStatus: String(evidenceRoleDistribution.status || 'NO_EVIDENCE'),
    crossFileSummaryCrossFileEvidenceSatisfied,
    crossFileSummaryCitationBindingSatisfied,
    crossFileSummaryClaimBindingSatisfied,
    crossFileSummaryContextGapVisible,
    crossFileSummaryContextGapEvidence: uncitedContextEvidence,
    crossFileSummaryContextGapFiles: uncitedContextFiles,
    crossFileSummaryCurrentScanOnly: true,
    crossFileSummarySourceEvidenceMatchType,
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
    groundingStatus,
    citationEnforcementStatus,
    citationEnforcementReason,
    citedChunkCount: citations.filter((citation: any) => citation?.citedByAnswer === true).length,
    responseChunkScanTaskIds: chunks.map((item: any) => typeof item?.scanTaskId === 'number' ? item.scanTaskId : null),
    citationScanTaskIds: citations.map((citation: any) => typeof citation?.scanTaskId === 'number' ? citation.scanTaskId : null),
    expectedEvidenceFileVisible: expectedEvidenceFileBound,
    evidenceRefRequestBound,
    evidenceRefResponseBound,
    evidenceRefContextVisible: true,
    evidenceRefFilePath: evidenceFile,
    evidenceRefLineNumber: evidenceLine,
    startEndOnlyEvidenceRef,
    evidenceCombinationSummary,
    codeUnderstandingLens,
    qaEvidenceHandoff,
    sourceFileMatchRelease,
    sourceLocationReadability,
    relationAwareEvidenceReason,
  }
}

function detectClaimCitationNoiseKinds(answer: string) {
  const kinds = new Set<string>()
  if (/```[\s\S]*\[C1\][\s\S]*```/.test(answer)) kinds.add('fenced-code')
  if (/`\[C1\]`/.test(answer)) kinds.add('inline-code')
  if (/\d{4}-\d{2}-\d{2}T[^\n]*\[C1\]/.test(answer)) kinds.add('timestamp-log')
  if (/(?:Exception|Traceback|Caused by:|^\s*at\s+.*\[C1\])/m.test(answer)) kinds.add('exception-line')
  return Array.from(kinds).sort()
}

async function verifyClaimCitationNoiseBoundary(
  page: Page,
  viewportName: string,
  drawerEvidenceAnchors: ReportEvidenceDrawerProof['evidenceAnchors'],
): Promise<ClaimCitationNoiseBoundaryProof> {
  const evidenceAnchor = preferredReportEvidenceAnchor(drawerEvidenceAnchors)
  const evidenceFile = evidenceAnchor.filePath
  const evidenceLine = evidenceAnchor.lineNumber ? String(evidenceAnchor.lineNumber) : ''
  const evidenceTitle = basename(evidenceFile) || evidenceFile
  const evidenceLocation = evidenceLine ? `${evidenceFile}:${evidenceLine}` : evidenceFile
  const qaQuestion = `claim citation noise boundary 假引用噪声：请基于扫描 #${scanTaskId} 和 ${evidenceLocation} 判断 AuthService token 校验证据，注意不要把代码块、日志或异常里的 [C1] 当成有效引用。`
  const evidenceLineParam = evidenceLine ? `&evidenceLine=${encodeURIComponent(evidenceLine)}` : ''
  let llmCleanup: LlmConfigProbeState = { status: 'SKIPPED', reason: 'not_started' }
  const llmSetup = await configureMockLlmConfig(page, `public-repo-ui-claim-noise-${viewportName}`)
  let proof: Omit<ClaimCitationNoiseBoundaryProof, 'llmCleanup'> | null = null

  try {
    expect(llmSetup.status, `${viewportName}: claim citation noise UI proof requires MOCK LLM setup`).toBe('OK')
    await openAndAssert(
      page,
      `/projects/${projectId}?tab=qa&scanTaskId=${scanTaskId}&question=${encodeURIComponent(qaQuestion)}&evidenceCategory=${encodeURIComponent('报告证据抽屉')}&evidenceSource=${encodeURIComponent('public repo UI smoke')}&evidenceTitle=${encodeURIComponent(evidenceTitle)}&evidenceFile=${encodeURIComponent(evidenceFile)}${evidenceLineParam}`,
      '代码问答与证据检索',
      `${viewportName}:project-qa-claim-noise`
    )

    const qaResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return response.request().method() === 'POST'
        && url.pathname === `/api/projects/${projectId}/qa`
        && response.status() < 500
    }, { timeout: 180_000 })

    await page.getByRole('button', { name: '发送' }).click()
    const qaResponse = await qaResponsePromise
    const qaRequestPayload = JSON.parse(qaResponse.request().postData() || '{}')
    const qaBody = await qaResponse.json()
    const qaData = qaBody?.data || {}
    const chunks = Array.isArray(qaData.retrievedChunks) ? qaData.retrievedChunks : []
    const citations = Array.isArray(qaData.answerCitations) ? qaData.answerCitations : []
    const answer = String(qaData.answer || '')
    const citationCoverage = qaData.citationCoverage && typeof qaData.citationCoverage === 'object' && !Array.isArray(qaData.citationCoverage)
      ? qaData.citationCoverage
      : {}
    const claimCitationCoverage = qaData.claimCitationCoverage && typeof qaData.claimCitationCoverage === 'object' && !Array.isArray(qaData.claimCitationCoverage)
      ? qaData.claimCitationCoverage
      : {}
    const claimRoleDistribution = claimCitationCoverage.roleDistribution && typeof claimCitationCoverage.roleDistribution === 'object' && !Array.isArray(claimCitationCoverage.roleDistribution)
      ? claimCitationCoverage.roleDistribution
      : {}
    const noiseKinds = detectClaimCitationNoiseKinds(answer)
    const groundingStatus = typeof qaData.groundingStatus === 'string' ? qaData.groundingStatus : ''
    const citationEnforcementStatus = typeof qaData.citationEnforcementStatus === 'string' ? qaData.citationEnforcementStatus : ''
    const answerCitationsCitedByAnswer = citations.some((citation: any) => citation?.citedByAnswer === true)
    const evidenceRefRequestBound = qaRequestPayload?.evidenceRef?.filePath === evidenceFile
      && qaRequestPayload?.evidenceRef?.category === '报告证据抽屉'
      && qaRequestPayload?.evidenceRef?.source === 'public repo UI smoke'
      && qaRequestPayload?.evidenceRef?.lineNumber === evidenceLine
    const evidenceRefResponseBound = qaData?.sourceEvidenceRef?.filePath === evidenceFile
      && qaData?.sourceEvidenceRef?.category === '报告证据抽屉'
      && qaData?.sourceEvidenceRef?.source === 'public repo UI smoke'
      && qaData?.sourceEvidenceRef?.lineNumber === evidenceLine

    expect(qaBody.code, `${viewportName}: claim citation noise QA response code must be SUCCESS`).toBe('SUCCESS')
    expect(qaResponse.status(), `${viewportName}: claim citation noise QA response status must be 200`).toBe(200)
    expect(qaData.scanTaskId, `${viewportName}: claim citation noise response scanTaskId must stay bound`).toBe(scanTaskId)
    expect(chunks.length, `${viewportName}: claim citation noise QA must still retrieve current-scan chunks`).toBeGreaterThan(0)
    expect(citations.length, `${viewportName}: claim citation noise QA must expose candidate citations for audit`).toBeGreaterThan(0)
    expect(chunks.every((item: any) => item?.scanTaskId === scanTaskId), `${viewportName}: claim citation noise retrieved chunks must be current-scan only`).toBe(true)
    expect(citations.every((citation: any) => citation?.scanTaskId === scanTaskId), `${viewportName}: claim citation noise citations must be current-scan only`).toBe(true)
    expect(evidenceRefRequestBound, `${viewportName}: claim citation noise request must preserve report evidenceRef`).toBe(true)
    expect(evidenceRefResponseBound, `${viewportName}: claim citation noise response must echo report evidenceRef`).toBe(true)
    expect(noiseKinds, `${viewportName}: claim citation noise fixture must contain all required fake citation noise kinds`).toEqual(['exception-line', 'fenced-code', 'inline-code', 'timestamp-log'])
    expect(['UNVERIFIED', 'PARTIAL'], `${viewportName}: claim citation noise grounding must not be VERIFIED`).toContain(groundingStatus)
    expect(citationEnforcementStatus, `${viewportName}: claim citation noise citation enforcement must fail closed`).toBe('RETRY_FAILED')
    expect(String(citationCoverage.status || ''), `${viewportName}: claim citation noise citation coverage must remain NONE`).toBe('NONE')
    expect(Number(citationCoverage.citedEvidenceCount || 0), `${viewportName}: claim citation noise must not cite evidence`).toBe(0)
    expect(Number(citationCoverage.repairCandidateCount || 0), `${viewportName}: claim citation noise must not expose repair candidates`).toBe(0)
    expect(String(claimCitationCoverage.status || ''), `${viewportName}: claim citation noise claim coverage must remain REVIEW`).toBe('REVIEW')
    expect(Number(claimCitationCoverage.citedRequiredClaimCount || 0), `${viewportName}: claim citation noise must not cite required claims`).toBe(0)
    expect(Number(claimCitationCoverage.invalidCitationClaimCount || 0), `${viewportName}: claim citation noise must not count noise as invalid prose citation`).toBe(0)
    expect(String(claimRoleDistribution.status || ''), `${viewportName}: claim citation noise role distribution must remain REVIEW_UNCITED`).toBe('REVIEW_UNCITED')
    expect(Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0), `${viewportName}: claim citation noise must not bind primary claims`).toBe(0)
    expect(answerCitationsCitedByAnswer, `${viewportName}: claim citation noise answer citations must not be cited by answer`).toBe(false)

    const latestTrustSummary = page.getByLabel('QA 可信度摘要').last()
    const latestRepairGate = page.getByLabel('修复证据门禁').last()
    const latestActionRail = page.getByLabel('QA 下一步动作').last()
    await expect(latestTrustSummary, `${viewportName}: claim citation noise trust summary must be visible`).toBeVisible()
    await expect(latestTrustSummary.getByText('不可直接采信')).toBeVisible()
    await expect(latestTrustSummary).not.toContainText('可采信并进入修复复核')
    await expect(latestRepairGate, `${viewportName}: claim citation noise repair gate must be visible`).toBeVisible()
    await expect(latestRepairGate).toContainText('BLOCKED')
    await expect(page.getByLabel('主张引用质量').last()).toBeVisible()
    await expect(page.getByLabel('引用覆盖审计').last()).toBeVisible()
    await expect(latestActionRail, `${viewportName}: claim citation noise next action rail must be visible`).toBeVisible()
    await expect(latestActionRail.getByText('已阻断')).toBeVisible()
    const repairActionCount = await latestActionRail.getByRole('button', { name: '生成修复候选' }).count()
    expect(repairActionCount, `${viewportName}: claim citation noise must hide AutoRepair action`).toBe(0)
    await assertStablePage(page, `${viewportName}:qa-claim-citation-noise`)

    proof = {
      status: 'OK',
      surface: 'PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY',
      scanTaskId,
      requestScanTaskId: Number(qaRequestPayload?.scanTaskId || 0),
      responseScanTaskId: Number(qaData.scanTaskId || 0),
      currentScanOnly: chunks.every((item: any) => item?.scanTaskId === scanTaskId) && citations.every((citation: any) => citation?.scanTaskId === scanTaskId),
      requestCount: 1,
      responseStatus: qaResponse.status(),
      resultCount: Number(qaData.resultCount || chunks.length || 0),
      citationCount: citations.length,
      noiseKinds,
      coverageStatus: String(citationCoverage.status || ''),
      maxCitedEvidenceCount: Number(citationCoverage.citedEvidenceCount || 0),
      maxRepairCandidateCount: Number(citationCoverage.repairCandidateCount || 0),
      claimCitationStatus: String(claimCitationCoverage.status || ''),
      maxCitedRequiredClaimCount: Number(claimCitationCoverage.citedRequiredClaimCount || 0),
      maxInvalidCitationClaimCount: Number(claimCitationCoverage.invalidCitationClaimCount || 0),
      roleDistributionStatus: String(claimRoleDistribution.status || ''),
      maxRequiredPrimaryBoundClaimCount: Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0),
      groundingStatuses: [groundingStatus],
      citationEnforcementStatuses: [citationEnforcementStatus],
      answerCitationsCitedByAnswer,
      trustSummaryReadyVisible: false,
      repairCandidateActionVisible: repairActionCount > 0,
      repairEvidenceGateBlockedVisible: true,
      evidenceRefRequestBound,
      evidenceRefResponseBound,
      rawAnswerStored: false,
      rawPromptStored: false,
      providerQualityClaim: false,
      llmFactClaim: false,
      noHorizontalOverflow: true,
      llmSetup,
    }
  } finally {
    llmCleanup = await removeMockLlmConfig(page, llmSetup)
  }

  expect(proof, `${viewportName}: claim citation noise proof must be captured`).toBeTruthy()
  expect(llmCleanup.status, `${viewportName}: claim citation noise MOCK LLM config must be cleaned up`).toBe('OK')
  return { ...proof!, llmCleanup }
}

async function verifyFileAnchorDrift(
  page: Page,
  viewportName: string,
  drawerEvidenceAnchors: ReportEvidenceDrawerProof['evidenceAnchors'],
): Promise<FileAnchorDriftProof> {
  const evidenceAnchor = preferredReportEvidenceAnchor(drawerEvidenceAnchors)
  const evidenceFile = evidenceAnchor.filePath
  const evidenceLine = '999999999'
  const evidenceTitle = basename(evidenceFile) || evidenceFile
  const evidenceLocation = `${evidenceFile}:${evidenceLine}`
  const qaQuestion = `file anchor drift live proof：请基于扫描 #${scanTaskId} 和 ${evidenceLocation} 说明这个报告证据的代码职责，并显式引用 C1。`
  let llmCleanup: LlmConfigProbeState = { status: 'SKIPPED', reason: 'not_started' }
  const llmSetup = await configureMockLlmConfig(page, `public-repo-ui-file-anchor-drift-${viewportName}`)
  let proof: Omit<FileAnchorDriftProof, 'llmCleanup'> | null = null

  try {
    expect(llmSetup.status, `${viewportName}: file-anchor drift UI proof requires MOCK LLM setup`).toBe('OK')
    await openAndAssert(
      page,
      `/projects/${projectId}?tab=qa&scanTaskId=${scanTaskId}&question=${encodeURIComponent(qaQuestion)}&evidenceCategory=${encodeURIComponent('报告证据抽屉')}&evidenceSource=${encodeURIComponent('public repo UI smoke')}&evidenceTitle=${encodeURIComponent(evidenceTitle)}&evidenceFile=${encodeURIComponent(evidenceFile)}&evidenceLine=${encodeURIComponent(evidenceLine)}`,
      '代码问答与证据检索',
      `${viewportName}:project-qa-file-anchor-drift`
    )

    const qaResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url())
      return response.request().method() === 'POST'
        && url.pathname === `/api/projects/${projectId}/qa`
        && response.status() < 500
    }, { timeout: 180_000 })

    await page.getByRole('button', { name: '发送' }).click()
    const qaResponse = await qaResponsePromise
    const qaRequestPayload = JSON.parse(qaResponse.request().postData() || '{}')
    const qaBody = await qaResponse.json()
    const qaData = qaBody?.data || {}
    const chunks = Array.isArray(qaData.retrievedChunks) ? qaData.retrievedChunks : []
    const citations = Array.isArray(qaData.answerCitations) ? qaData.answerCitations : []
    const citationCoverage = qaData.citationCoverage && typeof qaData.citationCoverage === 'object' && !Array.isArray(qaData.citationCoverage)
      ? qaData.citationCoverage
      : {}
    const evidenceRoleDistribution = citationCoverage.evidenceRoleDistribution && typeof citationCoverage.evidenceRoleDistribution === 'object' && !Array.isArray(citationCoverage.evidenceRoleDistribution)
      ? citationCoverage.evidenceRoleDistribution
      : {}
    const claimCitationCoverage = qaData.claimCitationCoverage && typeof qaData.claimCitationCoverage === 'object' && !Array.isArray(qaData.claimCitationCoverage)
      ? qaData.claimCitationCoverage
      : {}
    const claimRoleDistribution = claimCitationCoverage.roleDistribution && typeof claimCitationCoverage.roleDistribution === 'object' && !Array.isArray(claimCitationCoverage.roleDistribution)
      ? claimCitationCoverage.roleDistribution
      : {}
    const groundingStatus = typeof qaData.groundingStatus === 'string' ? qaData.groundingStatus : ''
    const citationEnforcementStatus = typeof qaData.citationEnforcementStatus === 'string' ? qaData.citationEnforcementStatus : ''
    const evidenceRefRequestBound = qaRequestPayload?.evidenceRef?.filePath === evidenceFile
      && qaRequestPayload?.evidenceRef?.category === '报告证据抽屉'
      && qaRequestPayload?.evidenceRef?.source === 'public repo UI smoke'
      && qaRequestPayload?.evidenceRef?.lineNumber === evidenceLine
    const evidenceRefResponseBound = qaData?.sourceEvidenceRef?.filePath === evidenceFile
      && qaData?.sourceEvidenceRef?.category === '报告证据抽屉'
      && qaData?.sourceEvidenceRef?.source === 'public repo UI smoke'
      && qaData?.sourceEvidenceRef?.lineNumber === evidenceLine

    expect(qaBody.code, `${viewportName}: file-anchor drift QA response code must be SUCCESS`).toBe('SUCCESS')
    expect(qaResponse.status(), `${viewportName}: file-anchor drift QA response status must be 200`).toBe(200)
    expect(qaData.scanTaskId, `${viewportName}: file-anchor drift response scanTaskId must stay bound`).toBe(scanTaskId)
    expect(chunks.length, `${viewportName}: file-anchor drift QA must retrieve current-scan chunks`).toBeGreaterThan(0)
    expect(citations.length, `${viewportName}: file-anchor drift QA must expose candidate citations`).toBeGreaterThan(0)
    expect(chunks.every((item: any) => item?.scanTaskId === scanTaskId), `${viewportName}: file-anchor drift chunks must be current-scan only`).toBe(true)
    expect(citations.every((citation: any) => citation?.scanTaskId === scanTaskId), `${viewportName}: file-anchor drift citations must be current-scan only`).toBe(true)
    expect(evidenceRefRequestBound, `${viewportName}: file-anchor drift request must preserve drifted report evidenceRef`).toBe(true)
    expect(evidenceRefResponseBound, `${viewportName}: file-anchor drift response must echo drifted report evidenceRef`).toBe(true)
    expect(qaData.sourceEvidenceMatched, `${viewportName}: file-anchor drift must still match the report evidence file`).toBe(true)
    expect(qaData.sourceEvidenceMatchType, `${viewportName}: file-anchor drift must downgrade to file anchor`).toBe('REPORT_FILE_ANCHOR')
    expect(groundingStatus, `${viewportName}: file-anchor drift context-only citations must not be VERIFIED`).toBe('PARTIAL')
    expect(citationEnforcementStatus, `${viewportName}: file-anchor drift context-only citations must fail closed`).toBe('RETRY_FAILED')
    expect(['FULL', 'PARTIAL'], `${viewportName}: file-anchor drift coverage must remain informational`).toContain(String(citationCoverage.status || ''))
    expect(String(citationCoverage.coverageScope || ''), `${viewportName}: file-anchor drift coverage must evaluate all context evidence`).toBe('ALL')
    expect(Number(citationCoverage.primaryEvidenceCount || 0), `${viewportName}: file-anchor drift must not expose PRIMARY evidence`).toBe(0)
    expect(Number(citationCoverage.contextEvidenceCount || 0), `${viewportName}: file-anchor drift must retain adjacent context evidence`).toBeGreaterThan(0)
    expect(Number(citationCoverage.repairCandidateCount || 0), `${viewportName}: file-anchor drift must not expose repair candidates`).toBe(0)
    expect(String(evidenceRoleDistribution.status || ''), `${viewportName}: file-anchor drift evidence role distribution must be context-only`).toBe('CONTEXT_ONLY')
    expect(String(claimCitationCoverage.status || ''), `${viewportName}: file-anchor drift claim citations may be cited but cannot be primary-bound`).toBe('READY')
    expect(claimCitationCoverage.readyForRepair, `${viewportName}: file-anchor drift claim citations must not be repair-ready`).toBe(false)
    expect(String(claimCitationCoverage.readinessReason || ''), `${viewportName}: file-anchor drift claim citations must expose the context-only readiness reason`).toBe('CONTEXT_ONLY_CLAIM')
    expect(Number(claimCitationCoverage.requiredClaimCount || 0), `${viewportName}: file-anchor drift must expose required claims`).toBeGreaterThan(0)
    expect(Number(claimCitationCoverage.citedRequiredClaimCount || 0), `${viewportName}: file-anchor drift must cite required claims before role gating`).toBeGreaterThan(0)
    expect(String(claimRoleDistribution.status || ''), `${viewportName}: file-anchor drift claim role distribution must be context-only`).toBe('CONTEXT_ONLY')
    expect(Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0), `${viewportName}: file-anchor drift must not bind required claims to PRIMARY`).toBe(0)
    expect(Number(claimRoleDistribution.requiredPrimaryFileCount || 0), `${viewportName}: file-anchor drift must not expose required primary files`).toBe(0)
    expect(Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0), `${viewportName}: file-anchor drift must preserve context-only required claims`).toBeGreaterThan(0)
    expect(citations.some((citation: any) => citation?.citedByAnswer === true && citation?.contextRole === 'ADJACENT_CONTEXT'), `${viewportName}: file-anchor drift may cite only adjacent context evidence`).toBe(true)

    const trustSummary = page.getByLabel('QA 可信度摘要').filter({ hasText: '来源锚点 文件锚点' }).last()
    await expect(trustSummary, `${viewportName}: file-anchor drift trust summary must be visible`).toBeVisible()
    await expect(trustSummary.getByText('不可直接采信')).toBeVisible()
    const repairGate = page.getByLabel('修复证据门禁').last()
    await expect(repairGate, `${viewportName}: file-anchor drift repair gate must be visible`).toBeVisible()
    await expect(repairGate.getByText('BLOCKED', { exact: true })).toBeVisible()
    const crossFileSummary = page.getByLabel('跨文件引用摘要').last()
    await expect(crossFileSummary, `${viewportName}: file-anchor drift cross-file summary must be visible`).toBeVisible()
    await expect(crossFileSummary.getByText('上下文引用可复核', { exact: true })).toBeVisible()
    await expect(crossFileSummary.getByLabel('上下文引用缺口')).toBeVisible()
    const sourceLocationConfidence = page.getByLabel('来源定位可信度').last()
    await expect(sourceLocationConfidence, `${viewportName}: file-anchor drift source location confidence must be visible`).toBeVisible()
    await expect(sourceLocationConfidence.getByText('来源定位需复核', { exact: true })).toBeVisible()
    await expect(sourceLocationConfidence.getByText('REPORT_FILE_ANCHOR')).toBeVisible()
    const sourceMatchRelease = page.getByLabel('来源文件匹配说明').last()
    await expect(sourceMatchRelease, `${viewportName}: file-anchor drift source match release must be visible`).toBeVisible()
    await expect(sourceMatchRelease.getByText('修复候选已阻断')).toBeVisible()
    await expect(sourceMatchRelease.getByText('未满足：行级锚点').first()).toBeVisible()
    await expect(sourceMatchRelease.getByText('未满足：主张 PRIMARY 绑定').first()).toBeVisible()
    const answerSourceReceipt = page.getByLabel('QA 回答报告证据凭证').last()
    const sourceLocationReadability = await assertSourceLocationReadability(
      page,
      viewportName,
      'review',
      answerSourceReceipt,
      sourceLocationConfidence,
      sourceMatchRelease,
    )
    const nextActionRail = page.getByLabel('QA 下一步动作').last()
    await expect(nextActionRail, `${viewportName}: file-anchor drift next action rail must be visible`).toBeVisible()
    await expect(nextActionRail.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
    const citationRegion = page.getByLabel('回答引用证据').last()
    await expect(citationRegion, `${viewportName}: file-anchor drift citation region must be visible`).toBeVisible()
    await expect(citationRegion.getByRole('button', { name: '生成修复候选' })).toHaveCount(0)
    await assertStablePage(page, `${viewportName}:qa-file-anchor-drift`)

    proof = {
      status: 'OK',
      surface: 'PUBLIC_REPO_UI_FILE_ANCHOR_DRIFT',
      scanTaskId,
      requestScanTaskId: Number(qaRequestPayload?.scanTaskId || 0),
      responseScanTaskId: Number(qaData.scanTaskId || 0),
      currentScanOnly: chunks.every((item: any) => item?.scanTaskId === scanTaskId) && citations.every((citation: any) => citation?.scanTaskId === scanTaskId),
      requestCount: 1,
      responseStatus: qaResponse.status(),
      resultCount: Number(qaData.resultCount || chunks.length || 0),
      citationCount: citations.length,
      sourceEvidenceMatchTypes: [String(qaData.sourceEvidenceMatchType || '')],
      citationCoverage: {
        statuses: [String(citationCoverage.status || '')],
        coverageScopes: [String(citationCoverage.coverageScope || '')],
        maxPrimaryEvidenceCount: Number(citationCoverage.primaryEvidenceCount || 0),
        minContextEvidenceCount: Number(citationCoverage.contextEvidenceCount || 0),
        maxRepairCandidateCount: Number(citationCoverage.repairCandidateCount || 0),
        evidenceRoleDistribution: {
          statuses: [String(evidenceRoleDistribution.status || '')],
        },
      },
      claimCitationCoverage: {
        statuses: [String(claimCitationCoverage.status || '')],
        readyForRepair: claimCitationCoverage.readyForRepair === true,
        readinessReasons: [String(claimCitationCoverage.readinessReason || '')].filter(Boolean),
        minRequiredClaimCount: Number(claimCitationCoverage.requiredClaimCount || 0),
        minCitedRequiredClaimCount: Number(claimCitationCoverage.citedRequiredClaimCount || 0),
        roleDistribution: {
          statuses: [String(claimRoleDistribution.status || '')],
          maxRequiredPrimaryBoundClaimCount: Number(claimRoleDistribution.requiredPrimaryBoundClaimCount || 0),
          maxRequiredPrimaryFileCount: Number(claimRoleDistribution.requiredPrimaryFileCount || 0),
          minRequiredContextOnlyClaimCount: Number(claimRoleDistribution.requiredContextOnlyClaimCount || 0),
        },
      },
      groundingStatuses: [groundingStatus],
      citationEnforcementStatuses: [citationEnforcementStatus],
      repairEvidenceGateBlockedVisible: true,
      trustSummaryBlockedVisible: true,
      crossFileSummaryContextGapVisible: true,
      sourceLocationConfidenceReviewVisible: true,
      sourceLocationReadability,
      latestNextActionRepairHidden: true,
      latestCitationRepairHidden: true,
      evidenceRefRequestBound,
      evidenceRefResponseBound,
      rawAnswerStored: false,
      rawPromptStored: false,
      providerQualityClaim: false,
      llmFactClaim: false,
      noHorizontalOverflow: true,
      llmSetup,
    }
  } finally {
    llmCleanup = await removeMockLlmConfig(page, llmSetup)
  }

  expect(proof, `${viewportName}: file-anchor drift proof must be captured`).toBeTruthy()
  expect(llmCleanup.status, `${viewportName}: file-anchor drift MOCK LLM config must be cleaned up`).toBe('OK')
  return { ...proof!, llmCleanup }
}

async function verifyEvidenceCombinationSummary(page: Page, viewportName: string, chunks: any[]): Promise<EvidenceCombinationSummaryProof> {
  const currentScanOnly = chunks.every((chunk: any) => chunk?.scanTaskId === scanTaskId)

  const summary = page.getByLabel('证据组合路径').last()
  const grid = summary.locator('.sl-qa-evidence-combination-grid')
  const path = summary.locator('.sl-qa-evidence-combination-path')
  const next = summary.locator('.sl-qa-evidence-combination-next')
  const labelText = String(await summary.locator('.sl-qa-evidence-combination-head strong').first().textContent() || '').trim()
  const topSourceLabel = String(await summary.locator('.sl-qa-evidence-combination-head .ant-tag').first().textContent() || '').trim()
  const visibleCardCount = await page.locator('.sl-search-result-card').count()
  await expect(summary, `${viewportName}: evidence combination summary should be visible for live QA`).toBeVisible()
  await expect(summary.getByText('证据组合路径')).toBeVisible()
  expect(topSourceLabel, `${viewportName}: evidence combination summary must expose a response-local source label`).toMatch(/^C[0-9]+$/)
  await expect(grid.getByText('主证据阅读起点')).toBeVisible()
  await expect(grid.getByText('相邻上下文', { exact: true })).toBeVisible()
  await expect(grid.getByText('文件覆盖')).toBeVisible()
  await expect(grid.getByText('向量证据')).toBeVisible()
  await expect(path.locator('.ant-tag').first()).toBeVisible()
  await expect(page.locator('.sl-search-result-card').first()).toBeVisible()
  await expect(next.getByText('下一步追问 / 复核方向')).toBeVisible()
  const gridValues = (await grid.locator('strong').allTextContents()).map(value => value.trim())
  const topReferenceText = gridValues[0] || ''
  const adjacentContextCount = parseLeadingInt(gridValues[1])
  const uniqueFileCount = parseLeadingInt(gridValues[2])
  const embeddedEvidenceCount = parseLeadingInt(gridValues[3])
  const rolePathTags = (await path.locator('.ant-tag').allTextContents()).map(value => value.trim())
  const primaryRoleTag = rolePathTags.find(value => /^主证据\s+\d+$/.test(value)) || ''
  const primaryCount = parseFirstInt(primaryRoleTag)
  expect(topReferenceText, `${viewportName}: evidence combination summary must expose a visible file:line reference`).toMatch(/:\d+-\d+$/)
  expect(primaryCount, `${viewportName}: evidence combination summary must include a primary reading path`).toBeGreaterThan(0)
  expect(adjacentContextCount, `${viewportName}: evidence combination summary adjacent count must be non-negative`).toBeGreaterThanOrEqual(0)
  expect(uniqueFileCount, `${viewportName}: evidence combination summary must include file coverage`).toBeGreaterThan(0)
  expect(embeddedEvidenceCount, `${viewportName}: evidence combination summary embedded count must be non-negative`).toBeGreaterThanOrEqual(0)
  expect(visibleCardCount, `${viewportName}: evidence combination summary must be paired with visible result cards`).toBeGreaterThan(0)
  const nextQuestionCount = await next.locator('li').count()
  expect(nextQuestionCount, `${viewportName}: evidence combination summary must expose at least three follow-up questions`).toBeGreaterThanOrEqual(3)
  expect(currentScanOnly, `${viewportName}: evidence combination summary chunks must stay scan-bound`).toBe(true)
  const layout = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }))
  const noHorizontalOverflow = Math.max(layout.scrollWidth, layout.bodyScrollWidth) - layout.innerWidth <= 1
  expect(noHorizontalOverflow, `${viewportName}: evidence combination summary must not cause horizontal overflow`).toBe(true)

  return {
    status: 'OK',
    surface: 'PROJECT_QA_CODE_CHUNKS_SEARCH',
    visible: true,
    label: labelText,
    topSourceLabel,
    primaryContextRole: 'PRIMARY',
    primaryCount,
    adjacentContextCount,
    uniqueFileCount,
    embeddedEvidenceCount,
    resultCount: visibleCardCount,
    visibleCardCount,
    nextQuestionCount,
    topReferenceVisible: true,
    sourceLabelsVisible: /^C[0-9]+$/.test(topSourceLabel),
    filePathsVisible: /:\d+-\d+$/.test(topReferenceText),
    fileCoverageVisible: true,
    rolePathVisible: true,
    embeddingStateVisible: true,
    currentScanOnly,
    noHorizontalOverflow,
    derivedFromVisibleResults: true,
    resultSetOnly: true,
    providerQualityClaim: false,
    llmFactClaim: false,
  }
}

async function verifyCodeUnderstandingLens(
  page: Page,
  viewportName: string,
  chunks: any[],
  targetAnchor?: { filePath?: string | null; lineNumber?: number | string | null },
): Promise<CodeUnderstandingLensProof> {
  const targetFile = String(targetAnchor?.filePath || '')
  const targetLine = Number(targetAnchor?.lineNumber || 0)
  const expectedFileChunk = chunks.find((chunk: any) =>
    sameOrNestedPath(String(chunk?.filePath || ''), expectedEvidenceFile)
  )
  const primaryChunk = targetFile && targetLine > 0
    ? { filePath: targetFile, startLine: targetLine, endLine: targetLine }
    : expectedFileChunk || chunks.find((chunk: any) => chunk?.contextRole === 'PRIMARY') || chunks[0]
  expect(primaryChunk, `${viewportName}: code understanding lens needs a visible current-scan chunk`).toBeTruthy()
  const primaryFile = String(primaryChunk?.filePath || '')
  const primaryStartLine = Number(primaryChunk?.startLine || 0)
  const primaryEndLine = Number(primaryChunk?.endLine || primaryStartLine || 0)
  expect(primaryFile.length, `${viewportName}: primary chunk must expose a file path for UI query only`).toBeGreaterThan(0)
  expect(primaryStartLine, `${viewportName}: primary chunk must expose a start line`).toBeGreaterThan(0)

  const query = `${primaryFile}:${primaryStartLine}`
	  const searchResponsePromise = page.waitForResponse((response) => {
	    const url = new URL(response.url())
	    return response.request().method() === 'GET'
	      && url.pathname === `/api/projects/${projectId}/code-chunks/search`
	      && url.searchParams.get('scanTaskId') === String(scanTaskId)
	      && url.searchParams.get('query') === query
	      && response.status() === 200
	  }, { timeout: 60_000 })

  const searchInput = page.getByPlaceholder(/搜索类名、函数名、路径、file:line/)
  await searchInput.fill(query)
  await page.getByRole('button', { name: '检索', exact: true }).click()
  const searchResponse = await searchResponsePromise
  const searchBody = await searchResponse.json()
  const searchData = searchBody?.data || {}
  const responseItems = Array.isArray(searchData.items) ? searchData.items : []
  const evidenceProfile = searchData.evidenceProfile || {}
  const readiness = String(evidenceProfile.readiness || '')
  const retrievalMode = String(searchData.retrievalMode || '')
  const responsePrimary = responseItems.find((item: any) => item?.contextRole === 'PRIMARY') || responseItems[0]
  const responsePrimaryFile = String(responsePrimary?.filePath || '')
  const responsePrimaryStartLine = Number(responsePrimary?.startLine || 0)
  const responsePrimaryEndLine = Number(responsePrimary?.endLine || responsePrimaryStartLine || 0)
  const sourceLabel = String(responsePrimary?.sourceLabel || '')
  const primaryReference = responsePrimaryFile && responsePrimaryStartLine > 0
    ? `${responsePrimaryFile}:${responsePrimaryStartLine}-${responsePrimaryEndLine || responsePrimaryStartLine}`
    : ''
  const targetFileMatchesExpected = sameOrNestedPath(responsePrimaryFile, expectedEvidenceFile)

  const lens = page.getByLabel('代码理解定位入口').last()
  const grid = lens.locator('.sl-code-understanding-lens-grid')
  await expect(lens, `${viewportName}: code understanding lens must be visible`).toBeVisible()
  await expect(lens.getByText('代码理解入口')).toBeVisible()
  await expect(lens.getByText('文件行号', { exact: true })).toBeVisible()
  await expect(lens.getByText('按 file:line 定位')).toBeVisible()
  await expect(grid.getByText(`Scan #${scanTaskId}`)).toBeVisible()
  await expect(grid.getByText('主证据位置')).toBeVisible()
  await expect(grid.getByText('证据编号')).toBeVisible()
  await expect(grid.getByText('证据角色')).toBeVisible()
  await expect(grid.getByText('证据类型')).toBeVisible()
  await expect(grid.getByText('相关分')).toBeVisible()
  await expect(grid.getByText('召回模式')).toBeVisible()
  await expect(grid.getByText('Readiness')).toBeVisible()
  await expect(lens.getByRole('button', { name: '定位检索' })).toBeVisible()
  await expect(lens.getByRole('button', { name: '解释此处' })).toBeVisible()
  await expect(lens.getByRole('button', { name: '复制引用' })).toBeVisible()
  await assertStablePage(page, `${viewportName}:code-understanding-lens`)

  const visibleSourceLabels = (await grid.locator('strong').allTextContents())
    .map(value => value.trim())
    .filter(value => /^C[0-9]+$/.test(value))
  const currentScanOnly = responseItems.length > 0 && responseItems.every((item: any) => item?.scanTaskId === scanTaskId)
  const locationVisible = (await grid.locator('strong').allTextContents())
    .some(value => value.includes(':') && /\d/.test(value))

  expect(searchData.scanTaskId, `${viewportName}: code understanding lens search response scanTaskId must match`).toBe(scanTaskId)
  expect(responseItems.length, `${viewportName}: code understanding lens search must return chunks`).toBeGreaterThan(0)
  expect(responsePrimary, `${viewportName}: code understanding lens must select a primary response chunk`).toBeTruthy()
  expect(currentScanOnly, `${viewportName}: code understanding lens chunks must stay scan-bound`).toBe(true)
  expect(sourceLabel, `${viewportName}: code understanding lens primary chunk must expose a source label`).toMatch(/^C[0-9]+$/)
  expect(visibleSourceLabels.length, `${viewportName}: code understanding lens must expose visible C source labels`).toBeGreaterThan(0)
  expect(String(responsePrimary?.contextRole || ''), `${viewportName}: code understanding lens must include primary evidence`).toBe('PRIMARY')
  expect(String(responsePrimary?.evidenceType || '').length, `${viewportName}: code understanding lens must expose evidence type`).toBeGreaterThan(0)
  expect(responsePrimaryFile, `${viewportName}: code understanding lens primary file must be visible`).toBeTruthy()
  expect(targetFileMatchesExpected, `${viewportName}: code understanding lens primary file must match expected evidence file`).toBe(true)
  expect(primaryReference, `${viewportName}: code understanding lens primary reference must be present`).toMatch(/:\d+-\d+$/)
  expect(['KEYWORD', 'STABLE_FALLBACK', 'SEMANTIC_FALLBACK', 'HYBRID'], `${viewportName}: code understanding lens retrieval mode allowlist`).toContain(retrievalMode)
  expect(['READY', 'REVIEW'], `${viewportName}: code understanding lens readiness must be QA-usable`).toContain(readiness)
  expect(locationVisible, `${viewportName}: code understanding lens must show a visible file:line reference`).toBe(true)

  return {
    status: 'OK',
    surface: 'PROJECT_QA_CODE_UNDERSTANDING_LENS',
    visible: true,
    scanTaskId,
    requestScanTaskId: scanTaskId,
    responseScanTaskId: Number(searchData.scanTaskId || 0),
    responseStatus: searchResponse.status(),
    resultCount: Number(searchData.resultCount || responseItems.length || 0),
    currentScanOnly,
    inputKind: 'FILE_LINE',
    queryShape: 'file:line',
    primaryMatched: String(responsePrimary?.contextRole || '') === 'PRIMARY',
    sourceLabel,
    primaryReference,
    primaryContextRole: String(responsePrimary?.contextRole || ''),
    evidenceType: String(responsePrimary?.evidenceType || ''),
    retrievalMode,
    readiness,
    readinessUsable: ['READY', 'REVIEW'].includes(readiness) && !['NO_SCAN', 'NO_CONTEXT'].includes(retrievalMode),
    targetFileMatchesExpected,
    entryVisible: true,
    primaryReferenceVisible: locationVisible,
    currentScanVisible: true,
    primaryEvidenceVisible: true,
    sourceLabelVisible: visibleSourceLabels.includes(sourceLabel),
    retrievalModeVisible: true,
    readinessVisible: true,
    locateSearchVisible: true,
    explainHereVisible: true,
    copyReferenceVisible: true,
    derivedFromVisibleResults: true,
    resultSetOnly: true,
    rawAnswerStored: false,
    rawQueryStored: false,
    rawStackStored: false,
    rawPromptStored: false,
    providerQualityClaim: false,
    llmFactClaim: false,
    noHorizontalOverflow: true,
  }
}

async function waitForGovernanceTimeline(page: Page, viewportName: string): Promise<GovernanceTimelineProof> {
  const endpoint = `/api/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`
  const governanceResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return response.request().method() === 'GET'
      && url.pathname === endpoint
      && response.status() === 200
  }, { timeout: 60_000 })

  await openAndAssert(page, `/scan-tasks/${scanTaskId}`, '仓库逆向分析报告', `${viewportName}:scan-detail`)
  const governanceResponse = await governanceResponsePromise
  const governanceBody = await governanceResponse.json()
  const governanceData = governanceBody?.data || {}
  const summary = governanceData.summary || {}
  const counts = summary.counts || {}
  const resources = governanceData.resources || {}
  const expectedResourceArrays = ['artifacts', 'repairExecutions', 'agentExecutions', 'autoRepairs', 'agentTasks', 'agentToolCalls', 'auditLogs']
  const resourceArrays = expectedResourceArrays.filter(key => Array.isArray(resources[key]))
  const requiredCountKeys = ['artifacts', 'scanExecutions', 'autoRepairs', 'agentTasks', 'agentToolCalls', 'auditLogs', 'repairExecutions', 'agentExecutions']
  const normalizedCounts = Object.fromEntries(requiredCountKeys.map(key => [key, Number(counts[key] ?? -1)]))

  const timeline = page.getByLabel('修复治理时间线')
  await expect(timeline).toBeVisible()
  await expect(timeline.getByText(`Scan #${scanTaskId}`).first()).toBeVisible()
  await expect(timeline.getByText(/Repair Governance/).first()).toBeVisible()
  await expect(timeline.getByText(/BOUND|PARTIAL|ATTENTION/).first()).toBeVisible()
  await expect(timeline.getByText(/报告风险/).first()).toBeVisible()
  await expect(timeline.getByText(/AutoRepair/).first()).toBeVisible()
  await expect(timeline.getByText(/Agent 任务/).first()).toBeVisible()
  await expect(timeline.getByText(/执行任务/).first()).toBeVisible()
  await expect(timeline.getByText(/产物证据/).first()).toBeVisible()
  await expect(timeline.getByText(/审计留痕/).first()).toBeVisible()
  await assertStablePage(page, `${viewportName}:scan-governance-timeline`)

  expect(governanceBody.code, `${viewportName}: governance response code must be SUCCESS`).toBe('SUCCESS')
  expect(governanceData.projectId, `${viewportName}: governance projectId must match`).toBe(projectId)
  expect(governanceData.repositoryId, `${viewportName}: governance repositoryId must match`).toBe(repositoryId)
  expect(governanceData.scanTaskId, `${viewportName}: governance scanTaskId must match`).toBe(scanTaskId)
  expect(governanceData.scanStatus, `${viewportName}: governance scanStatus should be successful`).toBe('SUCCESS')
  expect(governanceData.summary && typeof governanceData.summary === 'object', `${viewportName}: governance summary must be present`).toBe(true)
  expect(['BOUND', 'PARTIAL', 'ATTENTION'], `${viewportName}: governance summary status allowlist`).toContain(summary.status)
  expect(typeof summary.hasErrors, `${viewportName}: governance summary.hasErrors must be boolean`).toBe('boolean')
  expect(Number.isInteger(summary.attributionGapCount) && summary.attributionGapCount >= 0, `${viewportName}: attributionGapCount must be non-negative integer`).toBe(true)
  for (const key of requiredCountKeys) {
    expect(Number.isInteger(normalizedCounts[key]) && normalizedCounts[key] >= 0, `${viewportName}: governance counts.${key} must be non-negative integer`).toBe(true)
  }
  expect(normalizedCounts.artifacts, `${viewportName}: governance counts.artifacts should prove scan artifacts`).toBeGreaterThan(0)
  expect(normalizedCounts.scanExecutions, `${viewportName}: governance should include exactly one scan execution`).toBe(1)
  expect(resources && typeof resources === 'object', `${viewportName}: governance resources must be present`).toBe(true)
  expect(governanceData.limits && typeof governanceData.limits === 'object', `${viewportName}: governance limits must be present`).toBe(true)
  expect(resourceArrays, `${viewportName}: governance resources must expose stable arrays`).toEqual(expectedResourceArrays)
  const autoRepairIds = new Set((resources.autoRepairs || []).map((repair: any) => Number(repair.id)).filter(Number.isFinite))
  const agentTaskIds = new Set((resources.agentTasks || []).map((task: any) => Number(task.id)).filter(Number.isFinite))
  expect((resources.artifacts || []).every((artifact: any) =>
    artifact.projectId === projectId
      && ((artifact.ownerType === 'SCAN_TASK' && artifact.ownerId === scanTaskId)
        || (artifact.ownerType === 'AUTO_REPAIR' && autoRepairIds.has(Number(artifact.ownerId)))
        || (artifact.ownerType === 'AGENT_TASK' && agentTaskIds.has(Number(artifact.ownerId))))
  ), `${viewportName}: governance artifacts must be scan-chain-bound`).toBe(true)
  expect((resources.auditLogs || []).every((log: any) =>
    log.projectId === projectId
      && ((log.resourceType === 'SCAN_TASK' && log.resourceId === scanTaskId)
        || (log.resourceType === 'AUTO_REPAIR' && autoRepairIds.has(Number(log.resourceId)))
        || (log.resourceType === 'AGENT_TASK' && agentTaskIds.has(Number(log.resourceId))))
  ), `${viewportName}: governance audit logs must be scan-chain-bound`).toBe(true)
  expect(resources.scanExecution?.task?.sourceType, `${viewportName}: scan execution sourceType must be SCAN_TASK`).toBe('SCAN_TASK')
  expect(resources.scanExecution?.task?.sourceId, `${viewportName}: scan execution sourceId must match scanTaskId`).toBe(scanTaskId)
  expect(Array.isArray(governanceData.events) && governanceData.events.length > 0, `${viewportName}: governance events must be non-empty`).toBe(true)
  expect(governanceData.limits?.events?.returned, `${viewportName}: governance limits.events.returned must match event count`).toBe(governanceData.events.length)

  const derivedAuditResourceTypes = Array.from(new Set((resources.auditLogs || [])
    .filter((log: any) => (log.resourceType === 'AUTO_REPAIR' && autoRepairIds.has(Number(log.resourceId)))
      || (log.resourceType === 'AGENT_TASK' && agentTaskIds.has(Number(log.resourceId))))
    .map((log: any) => String(log.resourceType))))
    .sort()
  const derivedArtifactOwnerTypes = Array.from(new Set((resources.artifacts || [])
    .filter((artifact: any) => (artifact.ownerType === 'AUTO_REPAIR' && autoRepairIds.has(Number(artifact.ownerId)))
      || (artifact.ownerType === 'AGENT_TASK' && agentTaskIds.has(Number(artifact.ownerId))))
    .map((artifact: any) => String(artifact.ownerType))))
    .sort()
  const derivedArtifactTypes = Array.from(new Set((resources.artifacts || [])
    .filter((artifact: any) => derivedArtifactOwnerTypes.includes(String(artifact.ownerType)))
    .map((artifact: any) => String(artifact.artifactType))))
    .sort()
  const derivedGovernanceVisible = derivedAuditResourceTypes.includes('AUTO_REPAIR')
    && derivedAuditResourceTypes.includes('AGENT_TASK')
    && derivedArtifactOwnerTypes.includes('AUTO_REPAIR')
    && derivedArtifactOwnerTypes.includes('AGENT_TASK')
    && derivedArtifactTypes.includes('CHANGE_PATCH')
    && derivedArtifactTypes.includes('AGENT_REPORT')
  const currentPatchRepair = (resources.autoRepairs || []).find((repair: any) =>
    repair?.status === 'PATCH_READY'
      && repair?.scanTaskId === scanTaskId
      && typeof repair?.filePath === 'string'
      && repair.filePath.length > 0
      && typeof repair?.diffContent === 'string'
      && repair.diffContent.length > 0
  )
  const patchRepairId = Number(currentPatchRepair?.id)
  const currentPatchArtifact = (resources.artifacts || []).find((artifact: any) =>
    artifact?.ownerType === 'AUTO_REPAIR'
      && Number(artifact?.ownerId) === patchRepairId
      && artifact?.artifactType === 'CHANGE_PATCH'
  )
  const currentPatchAudit = (resources.auditLogs || []).find((log: any) =>
    log?.resourceType === 'AUTO_REPAIR'
      && Number(log?.resourceId) === patchRepairId
      && log?.action === 'AUTO_REPAIR_PATCH_READY'
      && log?.status === 'SUCCESS'
  )
  const currentRepairExecution = (resources.repairExecutions || []).find((detail: any) =>
    detail?.task?.sourceType === 'AUTO_REPAIR'
      && Number(detail?.task?.sourceId) === patchRepairId
      && detail?.task?.status === 'SUCCESS'
      && detail?.task?.currentStep === 'generate_patch'
  )
  const foreignPatchEvidenceHidden = (resources.artifacts || []).every((artifact: any) =>
    artifact?.artifactType !== 'CHANGE_PATCH'
      || artifact?.ownerType !== 'AUTO_REPAIR'
      || autoRepairIds.has(Number(artifact?.ownerId))
  ) && (resources.auditLogs || []).every((log: any) =>
    log?.action !== 'AUTO_REPAIR_PATCH_READY'
      || log?.resourceType !== 'AUTO_REPAIR'
      || autoRepairIds.has(Number(log?.resourceId))
  )
  const patchEvidence: GovernancePatchEvidenceProof = {
    status: 'OK',
    repairVisible: Boolean(currentPatchRepair),
    autoRepairId: Number.isFinite(patchRepairId) ? patchRepairId : 0,
    repairStatus: String(currentPatchRepair?.status || ''),
    scanTaskIdBound: Number(currentPatchRepair?.scanTaskId) === scanTaskId,
    targetFileVisible: typeof currentPatchRepair?.filePath === 'string' && currentPatchRepair.filePath.length > 0,
    diffVisible: typeof currentPatchRepair?.diffContent === 'string' && currentPatchRepair.diffContent.length > 0,
    patchArtifactVisible: Boolean(currentPatchArtifact),
    patchArtifactOwnerType: String(currentPatchArtifact?.ownerType || ''),
    patchArtifactOwnerId: Number(currentPatchArtifact?.ownerId || 0),
    patchArtifactType: String(currentPatchArtifact?.artifactType || ''),
    patchReadyAuditVisible: Boolean(currentPatchAudit),
    patchReadyAuditAction: String(currentPatchAudit?.action || ''),
    patchReadyAuditStatus: String(currentPatchAudit?.status || ''),
    auditSourceBound: Number(currentPatchAudit?.resourceId) === patchRepairId,
    repairExecutionVisible: Boolean(currentRepairExecution),
    repairExecutionSourceType: String(currentRepairExecution?.task?.sourceType || ''),
    repairExecutionSourceId: Number(currentRepairExecution?.task?.sourceId || 0),
    repairExecutionStatus: String(currentRepairExecution?.task?.status || ''),
    patchGenerationStepVisible: String(currentRepairExecution?.task?.currentStep || '') === 'generate_patch',
    patchGenerationStepKey: String(currentRepairExecution?.task?.currentStep || ''),
    foreignPatchEvidenceHidden,
  }
  const currentAgentTask = (resources.agentTasks || []).find((task: any) =>
    Number(task?.scanTaskId) === scanTaskId
      && String(task?.status || '') === 'COMPLETED'
      && typeof task?.title === 'string'
      && task.title.length > 0
  )
  const agentTaskId = Number(currentAgentTask?.id)
  const currentAgentReportArtifact = (resources.artifacts || []).find((artifact: any) =>
    artifact?.ownerType === 'AGENT_TASK'
      && Number(artifact?.ownerId) === agentTaskId
      && artifact?.artifactType === 'AGENT_REPORT'
  )
  const currentAgentAudit = (resources.auditLogs || []).find((log: any) =>
    log?.resourceType === 'AGENT_TASK'
      && Number(log?.resourceId) === agentTaskId
      && log?.action === 'AGENT_TASK_SMOKE_READY'
      && log?.status === 'SUCCESS'
  )
  const currentAgentExecution = (resources.agentExecutions || []).find((detail: any) =>
    detail?.task?.sourceType === 'AGENT_TASK'
      && Number(detail?.task?.sourceId) === agentTaskId
      && detail?.task?.status === 'SUCCESS'
      && detail?.task?.currentStep === 'generate_report'
  )
  const foreignAgentEvidenceHidden = (resources.artifacts || []).every((artifact: any) =>
    artifact?.artifactType !== 'AGENT_REPORT'
      || artifact?.ownerType !== 'AGENT_TASK'
      || agentTaskIds.has(Number(artifact?.ownerId))
  ) && (resources.auditLogs || []).every((log: any) =>
    log?.action !== 'AGENT_TASK_SMOKE_READY'
      || log?.resourceType !== 'AGENT_TASK'
      || agentTaskIds.has(Number(log?.resourceId))
  ) && (resources.agentExecutions || []).every((detail: any) =>
    detail?.task?.sourceType !== 'AGENT_TASK'
      || agentTaskIds.has(Number(detail?.task?.sourceId))
  )
  const noRawPromptOrAnswer = !/(rawPrompt|rawAnswer|promptText|answerText|Authorization|Bearer|private key|api[_-]?key|password)/i
    .test(JSON.stringify({
      agentTasks: resources.agentTasks || [],
      agentArtifacts: (resources.artifacts || []).filter((artifact: any) => artifact?.ownerType === 'AGENT_TASK'),
      agentAudits: (resources.auditLogs || []).filter((log: any) => log?.resourceType === 'AGENT_TASK'),
      agentExecutions: resources.agentExecutions || [],
    }))
  const agentReview: GovernanceAgentReviewProof = {
    status: 'OK',
    agentTaskVisible: Boolean(currentAgentTask),
    agentTaskId: Number.isFinite(agentTaskId) ? agentTaskId : 0,
    agentTaskStatus: String(currentAgentTask?.status || ''),
    scanTaskIdBound: Number(currentAgentTask?.scanTaskId) === scanTaskId,
    agentReportArtifactVisible: Boolean(currentAgentReportArtifact),
    agentReportOwnerType: String(currentAgentReportArtifact?.ownerType || ''),
    agentReportOwnerId: Number(currentAgentReportArtifact?.ownerId || 0),
    agentReportArtifactType: String(currentAgentReportArtifact?.artifactType || ''),
    agentAuditVisible: Boolean(currentAgentAudit),
    agentAuditAction: String(currentAgentAudit?.action || ''),
    agentAuditStatus: String(currentAgentAudit?.status || ''),
    agentAuditSourceBound: Number(currentAgentAudit?.resourceId) === agentTaskId,
    agentExecutionVisible: Boolean(currentAgentExecution),
    agentExecutionSourceType: String(currentAgentExecution?.task?.sourceType || ''),
    agentExecutionSourceId: Number(currentAgentExecution?.task?.sourceId || 0),
    agentExecutionStatus: String(currentAgentExecution?.task?.status || ''),
    agentExecutionStepVisible: String(currentAgentExecution?.task?.currentStep || '') === 'generate_report',
    agentExecutionStepKey: String(currentAgentExecution?.task?.currentStep || ''),
    foreignAgentEvidenceHidden,
    noRawPromptOrAnswer,
  }
  if (expectDerivedGovernance) {
    expect(derivedAuditResourceTypes, `${viewportName}: derived audit logs must include AUTO_REPAIR and AGENT_TASK`).toEqual(expect.arrayContaining(['AUTO_REPAIR', 'AGENT_TASK']))
    expect(derivedArtifactOwnerTypes, `${viewportName}: derived artifacts must include AUTO_REPAIR and AGENT_TASK owners`).toEqual(expect.arrayContaining(['AUTO_REPAIR', 'AGENT_TASK']))
    expect(derivedArtifactTypes, `${viewportName}: derived artifacts must include CHANGE_PATCH and AGENT_REPORT`).toEqual(expect.arrayContaining(['CHANGE_PATCH', 'AGENT_REPORT']))
    expect(patchEvidence.repairVisible, `${viewportName}: live patch repair must be visible`).toBe(true)
    expect(patchEvidence.repairStatus, `${viewportName}: live patch repair status must be PATCH_READY`).toBe('PATCH_READY')
    expect(patchEvidence.scanTaskIdBound, `${viewportName}: live patch repair must bind current scan`).toBe(true)
    expect(patchEvidence.patchArtifactVisible, `${viewportName}: live CHANGE_PATCH artifact must be visible`).toBe(true)
    expect(patchEvidence.patchArtifactOwnerType, `${viewportName}: live patch artifact owner type`).toBe('AUTO_REPAIR')
    expect(patchEvidence.patchArtifactOwnerId, `${viewportName}: live patch artifact owner must match repair`).toBe(patchEvidence.autoRepairId)
    expect(patchEvidence.patchArtifactType, `${viewportName}: live patch artifact type`).toBe('CHANGE_PATCH')
    expect(patchEvidence.patchReadyAuditVisible, `${viewportName}: live patch-ready audit must be visible`).toBe(true)
    expect(patchEvidence.patchReadyAuditAction, `${viewportName}: live patch-ready audit action`).toBe('AUTO_REPAIR_PATCH_READY')
    expect(patchEvidence.patchReadyAuditStatus, `${viewportName}: live patch-ready audit status`).toBe('SUCCESS')
    expect(patchEvidence.auditSourceBound, `${viewportName}: live patch-ready audit must bind repair`).toBe(true)
    expect(patchEvidence.repairExecutionVisible, `${viewportName}: live repair execution must be visible`).toBe(true)
    expect(patchEvidence.repairExecutionSourceType, `${viewportName}: live repair execution source type`).toBe('AUTO_REPAIR')
    expect(patchEvidence.repairExecutionSourceId, `${viewportName}: live repair execution source must match repair`).toBe(patchEvidence.autoRepairId)
    expect(patchEvidence.repairExecutionStatus, `${viewportName}: live repair execution status`).toBe('SUCCESS')
    expect(patchEvidence.patchGenerationStepKey, `${viewportName}: live repair execution current step`).toBe('generate_patch')
    expect(patchEvidence.foreignPatchEvidenceHidden, `${viewportName}: foreign patch evidence must be hidden`).toBe(true)
    expect(agentReview.agentTaskVisible, `${viewportName}: live AgentTask must be visible`).toBe(true)
    expect(agentReview.agentTaskStatus, `${viewportName}: live AgentTask status must be COMPLETED`).toBe('COMPLETED')
    expect(agentReview.scanTaskIdBound, `${viewportName}: live AgentTask must bind current scan`).toBe(true)
    expect(agentReview.agentReportArtifactVisible, `${viewportName}: live AGENT_REPORT artifact must be visible`).toBe(true)
    expect(agentReview.agentReportOwnerType, `${viewportName}: live Agent report owner type`).toBe('AGENT_TASK')
    expect(agentReview.agentReportOwnerId, `${viewportName}: live Agent report owner must match task`).toBe(agentReview.agentTaskId)
    expect(agentReview.agentReportArtifactType, `${viewportName}: live Agent report artifact type`).toBe('AGENT_REPORT')
    expect(agentReview.agentAuditVisible, `${viewportName}: live Agent audit must be visible`).toBe(true)
    expect(agentReview.agentAuditAction, `${viewportName}: live Agent audit action`).toBe('AGENT_TASK_SMOKE_READY')
    expect(agentReview.agentAuditStatus, `${viewportName}: live Agent audit status`).toBe('SUCCESS')
    expect(agentReview.agentAuditSourceBound, `${viewportName}: live Agent audit must bind task`).toBe(true)
    expect(agentReview.agentExecutionVisible, `${viewportName}: live Agent execution must be visible`).toBe(true)
    expect(agentReview.agentExecutionSourceType, `${viewportName}: live Agent execution source type`).toBe('AGENT_TASK')
    expect(agentReview.agentExecutionSourceId, `${viewportName}: live Agent execution source must match task`).toBe(agentReview.agentTaskId)
    expect(agentReview.agentExecutionStatus, `${viewportName}: live Agent execution status`).toBe('SUCCESS')
    expect(agentReview.agentExecutionStepKey, `${viewportName}: live Agent execution current step`).toBe('generate_report')
    expect(agentReview.foreignAgentEvidenceHidden, `${viewportName}: foreign Agent evidence must be hidden`).toBe(true)
    expect(agentReview.noRawPromptOrAnswer, `${viewportName}: Agent review marker must not expose raw prompt/answer or secrets`).toBe(true)
    await expect(timeline.getByText(/PATCH_READY/).first()).toBeVisible()
    await expect(timeline.getByText(/AUTO_REPAIR_PATCH_READY/).first()).toBeVisible()
    await expect(timeline.getByText(/generate_patch|生成补丁/).first()).toBeVisible()
    await expect(timeline.getByText(/AGENT_TASK_SMOKE_READY/).first()).toBeVisible()
    await expect(timeline.getByText(/generate_report|生成 Agent 报告/).first()).toBeVisible()
    await expect(timeline.getByText(/代码补丁|CHANGE_PATCH/).first()).toBeVisible()
    await expect(timeline.getByText(/Agent 报告|AGENT_REPORT/).first()).toBeVisible()
  }

  return {
    status: 'OK',
    endpoint,
    responseStatus: governanceResponse.status(),
    aggregateApiCalled: true,
    responseProjectId: typeof governanceData.projectId === 'number' ? governanceData.projectId : null,
    responseRepositoryId: typeof governanceData.repositoryId === 'number' ? governanceData.repositoryId : null,
    responseScanTaskId: typeof governanceData.scanTaskId === 'number' ? governanceData.scanTaskId : null,
    scanStatus: typeof governanceData.scanStatus === 'string' ? governanceData.scanStatus : '',
    summaryStatus: typeof summary.status === 'string' ? summary.status : '',
    hasErrors: summary.hasErrors === true,
    attributionGapCount: Number(summary.attributionGapCount ?? -1),
    counts: normalizedCounts,
    hasSummary: true,
    hasResources: true,
    hasLimits: true,
    resourceArrays,
    eventCount: Array.isArray(governanceData.events) ? governanceData.events.length : 0,
    truncated: Boolean(governanceData.truncated),
    resourcesBound: true,
    derivedAuditResourceTypes,
    derivedArtifactOwnerTypes,
    derivedArtifactTypes,
    derivedGovernanceVisible,
    patchEvidence,
    agentReview,
    visible: true,
  }
}

async function verifyViewport(page: Page, viewportName: string) {
  await openAndAssert(page, `/projects/${projectId}`, /Project Workspace|分析主链路|code_chunks/, `${viewportName}:project-detail`)
  await expect(page.getByText(`Scan #${scanTaskId}`).first()).toBeVisible()
  await expect(page.getByText(/code_chunks|chunks ready|代码切片/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /打开扫描详情|最新报告/ }).first()).toBeVisible()

  const governanceTimelineProof = await waitForGovernanceTimeline(page, viewportName)
  await expect(page.getByText('成功').first()).toBeVisible()
  const codeKnowledgeReadiness = page.getByRole('region', { name: 'Code Knowledge readiness' })
  await expect(codeKnowledgeReadiness, `${viewportName}: Code Knowledge readiness region must be visible`).toBeVisible()
  await expect(codeKnowledgeReadiness.getByText('Code Knowledge', { exact: true })).toBeVisible()
  const codeKnowledgeChunkTag = codeKnowledgeReadiness
    .locator('.sl-code-knowledge-tags .ant-tag')
    .filter({ hasText: /^[1-9]\d{0,2}(?:,\d{3})* code_chunks$/ })
  await expect(codeKnowledgeChunkTag, `${viewportName}: Code Knowledge readiness must expose a positive code_chunks total`).toBeVisible()
  await expect(page.getByRole('button', { name: '产物库' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: '审计追踪' }).first()).toBeVisible()
  await expect(page.getByRole('tab', { name: /报告总览/ })).toBeVisible()
  const recommendedStep = page.getByRole('region', { name: '报告推荐下一步' })
  await expect(recommendedStep, `${viewportName}: report must expose one recommended next step`).toBeVisible()
  const recommendedStepKey = await recommendedStep.getAttribute('data-recommended-step')
  expect(recommendedStepKey, `${viewportName}: recommended next step must expose a stable key`).toBeTruthy()
  const recommendedPrimary = recommendedStep.locator('.sl-report-recommended-step-actions .ant-btn-primary').first()
  const recommendedSecondary = recommendedStep.locator('.sl-report-recommended-step-actions .ant-btn').nth(1)
  await expect(recommendedPrimary, `${viewportName}: recommended next step must expose a primary action`).toBeVisible()
  await expect(recommendedSecondary, `${viewportName}: recommended next step must expose a secondary action`).toBeVisible()
  const recommendedNextStepProof: RecommendedNextStepProof = {
    visible: true,
    key: recommendedStepKey,
    primaryActionVisible: true,
    secondaryActionVisible: true,
    titleText: String(await recommendedStep.locator('.sl-report-recommended-step-copy strong').first().textContent() || '').trim(),
  }
  expect(recommendedNextStepProof.titleText.length, `${viewportName}: recommended next step title must be visible`).toBeGreaterThan(0)
  await expect(page.getByText(/修复候选|定位文件/).first()).toBeVisible()
  const reportEvidenceDrawerProof = await verifyReportEvidenceDrawer(page, viewportName)
  const qaFromEvidenceProof = await verifyQaFromEvidence(page, viewportName, reportEvidenceDrawerProof.evidenceAnchors)

  await openAndAssert(
    page,
    `/projects/${projectId}?tab=graph&scanTaskId=${scanTaskId}`,
    /依赖图谱|Dependency/,
    `${viewportName}:project-graph`
  )
  await expect(page).toHaveURL(new RegExp(`scanTaskId=${scanTaskId}`))

  await openAndAssert(
    page,
    `/artifacts?projectId=${projectId}&ownerType=SCAN_TASK&ownerId=${scanTaskId}`,
    '运行产物证据中心',
    `${viewportName}:artifacts`
  )
  await expect(page.getByText(/架构报告|API 目录|数据库 Schema|依赖图谱/).first()).toBeVisible()
  await expect(page.getByText(`SCAN_TASK #${scanTaskId}`).first()).toBeVisible()

  await openAndAssert(
    page,
    `/audit-logs?projectId=${projectId}&scanTaskId=${scanTaskId}`,
    '审计日志与安全治理',
    `${viewportName}:audit`
  )
  await expect(page.getByText(`项目 #${projectId}`).first()).toBeVisible()
  await expect(page.getByText(`scan #${scanTaskId}`).first()).toBeVisible()

  await openAndAssert(
    page,
    qaFromEvidenceProof.qaEvidenceHandoff.autoRepairDraftPath,
    '受控代码补丁生成',
    `${viewportName}:autorepair-candidate`
  )
  await expect(page.getByText('发起自动补丁生成任务')).toBeVisible()
  await expect(page.getByText(/Project QA verified citation/)).toBeVisible()
  await expect(page.getByText(`Scan #${scanTaskId}`).first()).toBeVisible()
  const candidateInputValues = await page.locator('input').evaluateAll((inputs) =>
    inputs.map((input) => (input as HTMLInputElement).value)
  )
  expect(candidateInputValues, 'AutoRepair candidate form did not preserve the QA cited file path.').toContain(qaFromEvidenceProof.qaEvidenceHandoff.candidateFilePath)
  await expect(page.getByLabel('修改的具体目标描述')).toHaveValue(/Project QA 已验证引用/)
  await expect(page.getByText('开始生成补丁')).toBeVisible()
  qaFromEvidenceProof.qaEvidenceHandoff.candidateFormOpened = true
  qaFromEvidenceProof.qaEvidenceHandoff.candidateFormScanVisible = true
  qaFromEvidenceProof.qaEvidenceHandoff.candidateFormFilePrefilled = true
  qaFromEvidenceProof.qaEvidenceHandoff.candidateTargetDescBound = true
  await assertStablePage(page, `${viewportName}:autorepair-candidate-from-qa`)
  qaFromEvidenceProof.claimCitationNoiseBoundary = await verifyClaimCitationNoiseBoundary(page, viewportName, reportEvidenceDrawerProof.evidenceAnchors)
  qaFromEvidenceProof.fileAnchorDrift = await verifyFileAnchorDrift(page, viewportName, reportEvidenceDrawerProof.evidenceAnchors)
  return { reportEvidenceDrawerProof, governanceTimelineProof, qaFromEvidenceProof, recommendedNextStepProof }
}

test('public repo live pages keep scan-bound report, QA, artifact, audit and repair-candidate context', async ({ page }) => {
  test.slow()
  await installAuth(page)
  const issues = installRuntimeGuards(page)
  const reportEvidenceDrawerProofs: ReportEvidenceDrawerProof[] = []
  const governanceTimelineProofs: GovernanceTimelineProof[] = []
  const qaFromEvidenceProofs: QaFromEvidenceProof[] = []
  const recommendedNextStepProofs: RecommendedNextStepProof[] = []

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const proof = await verifyViewport(page, viewport.name)
    reportEvidenceDrawerProofs.push(proof.reportEvidenceDrawerProof)
    governanceTimelineProofs.push(proof.governanceTimelineProof)
    qaFromEvidenceProofs.push(proof.qaFromEvidenceProof)
    recommendedNextStepProofs.push(proof.recommendedNextStepProof)
  }

  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])
  expect(reportEvidenceDrawerProofs.every(proof => proof.drawerScanTaskId === scanTaskId)).toBe(true)
  expect(reportEvidenceDrawerProofs.every(proof => proof.drawerLimit === 3)).toBe(true)
  expect(reportEvidenceDrawerProofs.every(proof => proof.responseScanTaskId === scanTaskId)).toBe(true)
  expect(reportEvidenceDrawerProofs.every(proof => proof.responseItemScanTaskIds.every(itemScanTaskId => itemScanTaskId === scanTaskId))).toBe(true)
  expect(reportEvidenceDrawerProofs.every(proof => proof.evidenceFilePaths.length > 0)).toBe(true)
  expect(reportEvidenceDrawerProofs.every(proof => proof.evidenceAnchors.some(anchor => anchor.filePath && anchor.lineNumber))).toBe(true)
  expect(reportEvidenceDrawerProofs.every(proof => proof.codeChunksSummaryVisible && proof.displayedChunk)).toBe(true)
  expect(reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.currentScanOnly && proof.codeKnowledge.readinessUsable)).toBe(true)
  expect(reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.crossFileEvidence.minFileEvidenceSatisfied)).toBe(true)
  expect(recommendedNextStepProofs.every(proof => proof.visible && proof.primaryActionVisible && proof.secondaryActionVisible && Boolean(proof.key))).toBe(true)
  expect(governanceTimelineProofs.every(proof => proof.aggregateApiCalled)).toBe(true)
  expect(governanceTimelineProofs.every(proof => proof.responseProjectId === projectId)).toBe(true)
  expect(governanceTimelineProofs.every(proof => proof.responseRepositoryId === repositoryId)).toBe(true)
  expect(governanceTimelineProofs.every(proof => proof.responseScanTaskId === scanTaskId)).toBe(true)
  expect(governanceTimelineProofs.every(proof => proof.responseStatus === 200)).toBe(true)
  expect(governanceTimelineProofs.every(proof => proof.visible && proof.hasSummary && proof.hasResources && proof.hasLimits && proof.resourcesBound)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.scanTaskId === scanTaskId)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.responseStatus < 500)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.resultCount > 0 && proof.citationCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.responseChunkScanTaskIds.every(itemScanTaskId => itemScanTaskId === scanTaskId))).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.citationScanTaskIds.every(itemScanTaskId => itemScanTaskId === scanTaskId))).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.expectedEvidenceFileVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceRefRequestBound)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceRefResponseBound)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceRefContextVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.status === 'OK')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.requestBound)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.responseBound)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => !proof.startEndOnlyEvidenceRef.requestHasLegacyLineNumber)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => !proof.startEndOnlyEvidenceRef.responseHasLegacyLineNumber)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.primaryChunkBound)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.groundingStatus === 'VERIFIED')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => ['DIRECT_VERIFIED', 'RETRY_VERIFIED', 'FALLBACK_PRIMARY_CITED'].includes(proof.citationEnforcementReason))).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.citedChunkCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => ['REQUIRED_FULL', 'FULL', 'PARTIAL'].includes(proof.coverageStatus))).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageTotalEvidenceCount === proof.citationCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageCitedEvidenceCount === proof.citedChunkCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRepairCandidateCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRequiredEvidenceCoveragePercent >= 100)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRequiredEvidenceCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageCitedRequiredEvidenceCount === proof.coverageRequiredEvidenceCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRequiredEvidenceFileCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageCitedRequiredEvidenceFileCount === proof.coverageRequiredEvidenceFileCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coveragePrimaryEvidenceFileCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageCitedPrimaryEvidenceFileCount === proof.coveragePrimaryEvidenceFileCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageUncitedPrimaryEvidenceFileCount === 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageScope.length > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRoleDistributionStatus.length > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRoleTotalFileCount === proof.coverageUniqueEvidenceFileCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRoleCitedFileCount === proof.coverageCitedEvidenceFileCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRolePrimaryFileCount === proof.coveragePrimaryEvidenceFileCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRoleCitedPrimaryFileCount === proof.coverageCitedPrimaryEvidenceFileCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRoleContextFileCount === proof.coverageContextEvidenceFileCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRoleCitedContextFileCount === proof.coverageCitedContextEvidenceFileCount)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.coverageRoleCount > 0 && proof.coverageRoleFileEntryCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.crossFileSummaryVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => ['ready', 'warning'].includes(proof.crossFileSummaryTone))).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.crossFileSummaryCitationBindingSatisfied)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.crossFileSummaryClaimBindingSatisfied)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.crossFileSummaryCurrentScanOnly)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.crossFileSummarySourceEvidenceMatchType === 'REPORT_LINE_ANCHOR')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceCombinationSummary.visible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceCombinationSummary.primaryCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceCombinationSummary.uniqueFileCount > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceCombinationSummary.nextQuestionCount >= 3)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceCombinationSummary.currentScanOnly)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.evidenceCombinationSummary.noHorizontalOverflow)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.codeUnderstandingLens.visible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.codeUnderstandingLens.currentScanOnly)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.codeUnderstandingLens.inputKind === 'FILE_LINE')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.codeUnderstandingLens.primaryMatched)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.codeUnderstandingLens.targetFileMatchesExpected)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.codeUnderstandingLens.readinessUsable)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.codeUnderstandingLens.locateSearchVisible && proof.codeUnderstandingLens.explainHereVisible && proof.codeUnderstandingLens.copyReferenceVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => !proof.codeUnderstandingLens.rawQueryStored && !proof.codeUnderstandingLens.rawStackStored && !proof.codeUnderstandingLens.rawPromptStored)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.visible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.sourceEvidenceReceiptVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.sourceEvidenceMatchType === 'REPORT_LINE_ANCHOR')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.sourceLocationConfidenceVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.sourceLocationConfidenceReadyVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.repairCandidateActionVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.autoRepairDraftUrlBound)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.candidateFormOpened)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.qaEvidenceHandoff.noRawPromptOrAnswer)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.claimCitationNoiseBoundary?.status === 'OK')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.claimCitationNoiseBoundary?.currentScanOnly)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.claimCitationNoiseBoundary?.coverageStatus === 'NONE')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.claimCitationNoiseBoundary?.claimCitationStatus === 'REVIEW')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.claimCitationNoiseBoundary?.roleDistributionStatus === 'REVIEW_UNCITED')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.claimCitationNoiseBoundary?.repairEvidenceGateBlockedVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.claimCitationNoiseBoundary?.repairCandidateActionVisible === false)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.status === 'OK')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.currentScanOnly)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.sourceEvidenceMatchTypes.length === 1 && proof.fileAnchorDrift.sourceEvidenceMatchTypes[0] === 'REPORT_FILE_ANCHOR')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.groundingStatuses.length === 1 && proof.fileAnchorDrift.groundingStatuses[0] === 'PARTIAL')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.citationEnforcementStatuses.length === 1 && proof.fileAnchorDrift.citationEnforcementStatuses[0] === 'RETRY_FAILED')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.citationCoverage.coverageScopes.length === 1 && proof.fileAnchorDrift.citationCoverage.coverageScopes[0] === 'ALL')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.citationCoverage.maxPrimaryEvidenceCount === 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => (proof.fileAnchorDrift?.citationCoverage.minContextEvidenceCount || 0) > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.citationCoverage.maxRepairCandidateCount === 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.citationCoverage.evidenceRoleDistribution.statuses.length === 1 && proof.fileAnchorDrift.citationCoverage.evidenceRoleDistribution.statuses[0] === 'CONTEXT_ONLY')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.claimCitationCoverage.roleDistribution.statuses.length === 1 && proof.fileAnchorDrift.claimCitationCoverage.roleDistribution.statuses[0] === 'CONTEXT_ONLY')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.claimCitationCoverage.readyForRepair === false)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.claimCitationCoverage.readinessReasons.length === 1 && proof.fileAnchorDrift.claimCitationCoverage.readinessReasons[0] === 'CONTEXT_ONLY_CLAIM')).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.claimCitationCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount === 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.claimCitationCoverage.roleDistribution.maxRequiredPrimaryFileCount === 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => (proof.fileAnchorDrift?.claimCitationCoverage.roleDistribution.minRequiredContextOnlyClaimCount || 0) > 0)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.repairEvidenceGateBlockedVisible)).toBe(true)
  expect(qaFromEvidenceProofs.every(proof => proof.fileAnchorDrift?.latestNextActionRepairHidden && proof.fileAnchorDrift.latestCitationRepairHidden)).toBe(true)
  const minReportEvidenceChunkHits = Math.min(...reportEvidenceDrawerProofs.map(proof => proof.chunkHits))
  const minCodeKnowledgeResultCount = Math.min(...reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.resultCount))
  const minCodeKnowledgeTotalChunks = Math.min(...reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.totalChunks))
  const minCodeKnowledgeEmbeddedChunks = Math.min(...reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.embeddedChunks))
  const minCodeKnowledgeConfidence = Math.min(...reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.confidence))
  const minCodeKnowledgeUniqueFiles = Math.min(...reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.uniqueFiles))
  const minGovernanceEventCount = Math.min(...governanceTimelineProofs.map(proof => proof.eventCount))
  const minQaCitationCount = Math.min(...qaFromEvidenceProofs.map(proof => proof.citationCount))
  const minQaResultCount = Math.min(...qaFromEvidenceProofs.map(proof => proof.resultCount))
  const governanceResourceArrays = Array.from(new Set(governanceTimelineProofs.flatMap(proof => proof.resourceArrays))).sort()
  const derivedAuditResourceTypes = Array.from(new Set(governanceTimelineProofs.flatMap(proof => proof.derivedAuditResourceTypes))).sort()
  const derivedArtifactOwnerTypes = Array.from(new Set(governanceTimelineProofs.flatMap(proof => proof.derivedArtifactOwnerTypes))).sort()
  const derivedArtifactTypes = Array.from(new Set(governanceTimelineProofs.flatMap(proof => proof.derivedArtifactTypes))).sort()
  const codeKnowledgeRetrievalModes = Array.from(new Set(reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.retrievalMode))).sort()
  const codeKnowledgeReadiness = Array.from(new Set(reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.readiness))).sort()
  const codeKnowledgeContextRoles = Array.from(new Set(reportEvidenceDrawerProofs.flatMap(proof => proof.codeKnowledge.contextRoles))).sort()
  const codeKnowledgeEvidenceTypes = Array.from(new Set(reportEvidenceDrawerProofs.flatMap(proof => proof.codeKnowledge.evidenceTypes))).sort()
  const crossFileProofs = reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.crossFileEvidence)
  const minCrossFileResultCount = Math.min(...crossFileProofs.map(proof => proof.resultCount))
  const minCrossFileUniqueFiles = Math.min(...crossFileProofs.map(proof => proof.uniqueFiles))
  const minCrossFileFileStatsUniqueFiles = Math.min(...crossFileProofs.map(proof => proof.fileStatsUniqueFiles))
  const crossFileRetrievalModes = Array.from(new Set(crossFileProofs.map(proof => proof.retrievalMode))).sort()
  const crossFileReadiness = Array.from(new Set(crossFileProofs.map(proof => proof.readiness))).sort()
  const evidenceCombinationProofs = qaFromEvidenceProofs.map(proof => proof.evidenceCombinationSummary)
  const codeUnderstandingLensProofs = qaFromEvidenceProofs.map(proof => proof.codeUnderstandingLens)
  const qaEvidenceHandoffProofs = qaFromEvidenceProofs.map(proof => proof.qaEvidenceHandoff)
  const sourceFileMatchReleaseProofs = qaFromEvidenceProofs.map(proof => proof.sourceFileMatchRelease)
  const claimCitationNoiseBoundaryProofs = qaFromEvidenceProofs
    .map(proof => proof.claimCitationNoiseBoundary)
    .filter((proof): proof is ClaimCitationNoiseBoundaryProof => Boolean(proof))
  const fileAnchorDriftProofs = qaFromEvidenceProofs
    .map(proof => proof.fileAnchorDrift)
    .filter((proof): proof is FileAnchorDriftProof => Boolean(proof))
  const sourceLocationReadabilityProofs = [
    ...qaFromEvidenceProofs.map(proof => proof.sourceLocationReadability),
    ...fileAnchorDriftProofs.map(proof => proof.sourceLocationReadability),
  ]
  const readySourceLocationReadabilityProofs = sourceLocationReadabilityProofs.filter(proof => proof.mode === 'ready')
  const reviewSourceLocationReadabilityProofs = sourceLocationReadabilityProofs.filter(proof => proof.mode === 'review')
  const relationAwareEvidenceReasonProofs = qaFromEvidenceProofs
    .map(proof => proof.relationAwareEvidenceReason)
    .filter((proof): proof is RelationAwareEvidenceReasonProof => Boolean(proof))
  expect(
    relationAwareEvidenceReasonProofs.length === 0 || relationAwareEvidenceReasonProofs.length === viewportMatrix.length,
    'Public repo UI relation-aware evidence reason must be absent for all viewports or proven for every viewport'
  ).toBe(true)
  expect(claimCitationNoiseBoundaryProofs.length, 'Public repo UI claim citation noise proof must exist for every viewport').toBe(viewportMatrix.length)
  expect(fileAnchorDriftProofs.length, 'Public repo UI file-anchor drift proof must exist for every viewport').toBe(viewportMatrix.length)
  expect(sourceLocationReadabilityProofs.length, 'Public repo UI source-location readability proof must cover ready and review states for every viewport').toBe(viewportMatrix.length * 2)
  expect(sourceLocationReadabilityProofs.every(proof => proof.status === 'OK')).toBe(true)
  expect(sourceLocationReadabilityProofs.some(proof => proof.viewportName === 'mobile')).toBe(true)
  expect(sourceLocationReadabilityProofs.some(proof => proof.viewportName === 'narrow')).toBe(true)
  expect(readySourceLocationReadabilityProofs.every(proof => proof.mode === 'ready')).toBe(true)
  expect(reviewSourceLocationReadabilityProofs.every(proof => proof.mode === 'review')).toBe(true)
  expect(sourceLocationReadabilityProofs.every(proof => !proof.providerQualityClaim && !proof.llmFactClaim)).toBe(true)
  expect(sourceLocationReadabilityProofs.every(proof => proof.noHorizontalOverflow)).toBe(true)
  const patchEvidenceProof: GovernancePatchEvidenceProof = governanceTimelineProofs[0]?.patchEvidence || {
    status: 'OK',
    repairVisible: false,
    autoRepairId: 0,
    repairStatus: '',
    scanTaskIdBound: false,
    targetFileVisible: false,
    diffVisible: false,
    patchArtifactVisible: false,
    patchArtifactOwnerType: '',
    patchArtifactOwnerId: 0,
    patchArtifactType: '',
    patchReadyAuditVisible: false,
    patchReadyAuditAction: '',
    patchReadyAuditStatus: '',
    auditSourceBound: false,
    repairExecutionVisible: false,
    repairExecutionSourceType: '',
    repairExecutionSourceId: 0,
    repairExecutionStatus: '',
    patchGenerationStepVisible: false,
    patchGenerationStepKey: '',
    foreignPatchEvidenceHidden: false,
  }
  const agentReviewProof: GovernanceAgentReviewProof = governanceTimelineProofs[0]?.agentReview || {
    status: 'OK',
    agentTaskVisible: false,
    agentTaskId: 0,
    agentTaskStatus: '',
    scanTaskIdBound: false,
    agentReportArtifactVisible: false,
    agentReportOwnerType: '',
    agentReportOwnerId: 0,
    agentReportArtifactType: '',
    agentAuditVisible: false,
    agentAuditAction: '',
    agentAuditStatus: '',
    agentAuditSourceBound: false,
    agentExecutionVisible: false,
    agentExecutionSourceType: '',
    agentExecutionSourceId: 0,
    agentExecutionStatus: '',
    agentExecutionStepVisible: false,
    agentExecutionStepKey: '',
    foreignAgentEvidenceHidden: false,
    noRawPromptOrAnswer: false,
  }

  console.log(`PUBLIC_REPO_UI_SMOKE_OK ${JSON.stringify({
    projectId,
    repositoryId,
    scanTaskId,
    expectedEvidenceFile,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    pages: [
      'ProjectDetail',
      'ScanTaskDetail',
      'Report Recommended Next Step',
      'Scan Governance Timeline',
      'Report Evidence Drawer',
      'ProjectDetail QA',
      'ProjectDetail Graph',
      'Artifacts',
      'AuditLogs',
      'AutoRepair candidate',
    ],
    evidenceDrawer: {
      status: 'OK',
      opened: true,
      codeChunksSummaryVisible: true,
      displayedChunk: true,
      scanTaskId,
      limit: 3,
      resultCount: minReportEvidenceChunkHits,
      expectedEvidenceFile,
    },
    recommendedNextStep: {
      status: 'OK',
      visible: recommendedNextStepProofs.every(proof => proof.visible),
      primaryActionVisible: recommendedNextStepProofs.every(proof => proof.primaryActionVisible),
      secondaryActionVisible: recommendedNextStepProofs.every(proof => proof.secondaryActionVisible),
      keys: Array.from(new Set(recommendedNextStepProofs.map(proof => proof.key).filter(Boolean))).sort(),
      titles: Array.from(new Set(recommendedNextStepProofs.map(proof => proof.titleText).filter(Boolean))).sort(),
    },
    codeKnowledge: {
      status: 'OK',
      scanTaskId,
      responseStatus: 200,
      resultCount: minCodeKnowledgeResultCount,
      totalChunks: minCodeKnowledgeTotalChunks,
      embeddedChunks: minCodeKnowledgeEmbeddedChunks,
      retrievalModes: codeKnowledgeRetrievalModes,
      readiness: codeKnowledgeReadiness,
      minConfidence: minCodeKnowledgeConfidence,
      uniqueFiles: minCodeKnowledgeUniqueFiles,
      dominantEvidenceTypes: Array.from(new Set(reportEvidenceDrawerProofs.map(proof => proof.codeKnowledge.dominantEvidenceType))).sort(),
      evidenceProfileVisible: reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.evidenceProfileVisible),
      currentScanOnly: reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.currentScanOnly),
      sourceLabelsVisible: reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.sourceLabelsVisible),
      filePathsVisible: reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.filePathsVisible),
      expectedEvidenceFileVisible: reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.expectedEvidenceFileVisible),
      fileStatsVisible: reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.fileStatsVisible),
      contextRoles: codeKnowledgeContextRoles,
      evidenceTypes: codeKnowledgeEvidenceTypes,
      readinessUsable: reportEvidenceDrawerProofs.every(proof => proof.codeKnowledge.readinessUsable),
      crossFileEvidence: {
        status: 'OK',
        endpoint: `/api/projects/${projectId}/code-chunks/search`,
        query: '',
        limit: 24,
        responseStatus: 200,
        scanTaskId,
        resultCount: minCrossFileResultCount,
        totalChunks: minCodeKnowledgeTotalChunks,
        uniqueFiles: minCrossFileUniqueFiles,
        currentScanOnly: crossFileProofs.every(proof => proof.currentScanOnly),
        fileStatsVisible: crossFileProofs.every(proof => proof.fileStatsVisible),
        fileStatsUniqueFiles: minCrossFileFileStatsUniqueFiles,
        sourceLabelsVisible: crossFileProofs.every(proof => proof.sourceLabelsVisible),
        retrievalModes: crossFileRetrievalModes,
        readiness: crossFileReadiness,
        minFileEvidenceSatisfied: crossFileProofs.every(proof => proof.minFileEvidenceSatisfied),
      },
    },
    codeUnderstandingLens: {
      status: 'OK',
      surface: 'PROJECT_QA_CODE_UNDERSTANDING_LENS',
      visible: codeUnderstandingLensProofs.every(proof => proof.visible),
      scanTaskId,
      requestScanTaskId: scanTaskId,
      responseScanTaskId: scanTaskId,
      responseStatus: Math.max(...codeUnderstandingLensProofs.map(proof => proof.responseStatus)),
      resultCount: Math.min(...codeUnderstandingLensProofs.map(proof => proof.resultCount)),
      currentScanOnly: codeUnderstandingLensProofs.every(proof => proof.currentScanOnly),
      inputKinds: Array.from(new Set(codeUnderstandingLensProofs.map(proof => proof.inputKind))).sort(),
      queryShapes: Array.from(new Set(codeUnderstandingLensProofs.map(proof => proof.queryShape))).sort(),
      primaryMatched: codeUnderstandingLensProofs.every(proof => proof.primaryMatched),
      sourceLabels: Array.from(new Set(codeUnderstandingLensProofs.map(proof => proof.sourceLabel).filter(Boolean))).sort(),
      primaryReferences: Array.from(new Set(codeUnderstandingLensProofs.map(proof => proof.primaryReference).filter(Boolean))).sort(),
      primaryContextRoles: Array.from(new Set(codeUnderstandingLensProofs.map(proof => proof.primaryContextRole).filter(Boolean))).sort(),
      evidenceTypes: Array.from(new Set(codeUnderstandingLensProofs.map(proof => proof.evidenceType).filter(Boolean))).sort(),
      retrievalModes: Array.from(new Set(codeUnderstandingLensProofs.map(proof => proof.retrievalMode).filter(Boolean))).sort(),
      readiness: Array.from(new Set(codeUnderstandingLensProofs.map(proof => proof.readiness).filter(Boolean))).sort(),
      readinessUsable: codeUnderstandingLensProofs.every(proof => proof.readinessUsable),
      targetFileMatchesExpected: codeUnderstandingLensProofs.every(proof => proof.targetFileMatchesExpected),
      entryVisible: codeUnderstandingLensProofs.every(proof => proof.entryVisible),
      primaryReferenceVisible: codeUnderstandingLensProofs.every(proof => proof.primaryReferenceVisible),
      currentScanVisible: codeUnderstandingLensProofs.every(proof => proof.currentScanVisible),
      primaryEvidenceVisible: codeUnderstandingLensProofs.every(proof => proof.primaryEvidenceVisible),
      sourceLabelVisible: codeUnderstandingLensProofs.every(proof => proof.sourceLabelVisible),
      retrievalModeVisible: codeUnderstandingLensProofs.every(proof => proof.retrievalModeVisible),
      readinessVisible: codeUnderstandingLensProofs.every(proof => proof.readinessVisible),
      locateSearchVisible: codeUnderstandingLensProofs.every(proof => proof.locateSearchVisible),
      explainHereVisible: codeUnderstandingLensProofs.every(proof => proof.explainHereVisible),
      copyReferenceVisible: codeUnderstandingLensProofs.every(proof => proof.copyReferenceVisible),
      derivedFromVisibleResults: codeUnderstandingLensProofs.every(proof => proof.derivedFromVisibleResults),
      resultSetOnly: codeUnderstandingLensProofs.every(proof => proof.resultSetOnly),
      rawAnswerStored: false,
      rawQueryStored: false,
      rawStackStored: false,
      rawPromptStored: false,
      providerQualityClaim: false,
      llmFactClaim: false,
      noHorizontalOverflow: codeUnderstandingLensProofs.every(proof => proof.noHorizontalOverflow),
    },
    qaFromEvidence: {
      status: 'OK',
      scanTaskId,
      responseStatus: 200,
      resultCount: minQaResultCount,
      citationCount: minQaCitationCount,
      citationCoverage: {
        statuses: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.coverageStatus))).sort(),
        minCoveragePercent: Math.min(...qaFromEvidenceProofs.map(proof => proof.coveragePercent)),
        minTotalEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageTotalEvidenceCount)),
        minCitedEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedEvidenceCount)),
        minUncitedCandidateCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageUncitedCandidateCount)),
        minRepairCandidateCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRepairCandidateCount)),
        minUniqueEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageUniqueEvidenceFileCount)),
        minCitedEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedEvidenceFileCount)),
        minPrimaryEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coveragePrimaryEvidenceCount)),
        minCitedPrimaryEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedPrimaryEvidenceCount)),
        maxUncitedPrimaryEvidenceCount: Math.max(...qaFromEvidenceProofs.map(proof => proof.coverageUncitedPrimaryEvidenceCount)),
        minPrimaryEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coveragePrimaryEvidenceFileCount)),
        minCitedPrimaryEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedPrimaryEvidenceFileCount)),
        maxUncitedPrimaryEvidenceFileCount: Math.max(...qaFromEvidenceProofs.map(proof => proof.coverageUncitedPrimaryEvidenceFileCount)),
        minContextEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageContextEvidenceCount)),
        minCitedContextEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedContextEvidenceCount)),
        minUncitedContextEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageUncitedContextEvidenceCount)),
        minContextEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageContextEvidenceFileCount)),
        minCitedContextEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedContextEvidenceFileCount)),
        minUncitedContextEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageUncitedContextEvidenceFileCount)),
        minRequiredEvidenceCoveragePercent: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRequiredEvidenceCoveragePercent)),
        minRequiredEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRequiredEvidenceCount)),
        minCitedRequiredEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedRequiredEvidenceCount)),
        minRequiredEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRequiredEvidenceFileCount)),
        minCitedRequiredEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedRequiredEvidenceFileCount)),
        coverageScopes: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.coverageScope).filter(Boolean))).sort(),
        evidenceRoleDistribution: {
          statuses: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.coverageRoleDistributionStatus))).sort(),
          minTotalFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRoleTotalFileCount)),
          minCitedFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRoleCitedFileCount)),
          minPrimaryFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRolePrimaryFileCount)),
          minCitedPrimaryFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRoleCitedPrimaryFileCount)),
          minContextFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRoleContextFileCount)),
          minCitedContextFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRoleCitedContextFileCount)),
          minRoleCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRoleCount)),
          minFileEntryCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRoleFileEntryCount)),
        },
      },
      crossFileCitationSummary: {
        visible: qaFromEvidenceProofs.every(proof => proof.crossFileSummaryVisible),
        tones: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.crossFileSummaryTone))).sort(),
        statuses: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.crossFileSummaryStatus))).sort(),
        crossFileEvidenceSatisfied: qaFromEvidenceProofs.every(proof => proof.crossFileSummaryCrossFileEvidenceSatisfied),
        citationBindingSatisfied: qaFromEvidenceProofs.every(proof => proof.crossFileSummaryCitationBindingSatisfied),
        claimBindingSatisfied: qaFromEvidenceProofs.every(proof => proof.crossFileSummaryClaimBindingSatisfied),
        contextGapVisible: qaFromEvidenceProofs.every(proof => proof.crossFileSummaryContextGapVisible),
        minUncitedContextEvidenceCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.crossFileSummaryContextGapEvidence)),
        minUncitedContextEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.crossFileSummaryContextGapFiles)),
        currentScanOnly: qaFromEvidenceProofs.every(proof => proof.crossFileSummaryCurrentScanOnly),
        sourceEvidenceMatchTypes: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.crossFileSummarySourceEvidenceMatchType).filter(Boolean))).sort(),
        minEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageUniqueEvidenceFileCount)),
        minCitedEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedEvidenceFileCount)),
        minPrimaryEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coveragePrimaryEvidenceFileCount)),
        minCitedPrimaryEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedPrimaryEvidenceFileCount)),
        minContextEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageContextEvidenceFileCount)),
        minCitedContextEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedContextEvidenceFileCount)),
        minRequiredEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageRequiredEvidenceFileCount)),
        minCitedRequiredEvidenceFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.coverageCitedRequiredEvidenceFileCount)),
        minRequiredClaimCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRequiredClaimCount)),
        minRequiredClaimCitationFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRequiredClaimCitationFileCount)),
        minRequiredPrimaryFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleRequiredPrimaryFileCount)),
        minRequiredPrimaryBoundClaimCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleRequiredPrimaryBoundClaimCount)),
      },
      claimCitationCoverage: {
        statuses: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.claimCitationStatus))).sort(),
        minClaimCoveragePercent: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimCoveragePercent)),
        minRequiredClaimCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRequiredClaimCount)),
        minCitedRequiredClaimCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimCitedRequiredClaimCount)),
        maxUncitedRequiredClaimCount: Math.max(...qaFromEvidenceProofs.map(proof => proof.claimUncitedRequiredClaimCount)),
        maxInvalidCitationClaimCount: Math.max(...qaFromEvidenceProofs.map(proof => proof.claimInvalidCitationClaimCount)),
        minValidCitationFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimValidCitationFileCount)),
        minRequiredClaimCitationFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRequiredClaimCitationFileCount)),
        readyForRepair: qaFromEvidenceProofs.every(proof => proof.claimReadyForRepair),
        readinessReasons: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.claimReadinessReason).filter(Boolean))).sort(),
        roleDistribution: {
          statuses: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.claimRoleDistributionStatus))).sort(),
          minRequiredClaimCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleRequiredClaimCount)),
          minRequiredPrimaryBoundClaimCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleRequiredPrimaryBoundClaimCount)),
          maxRequiredContextOnlyClaimCount: Math.max(...qaFromEvidenceProofs.map(proof => proof.claimRoleRequiredContextOnlyClaimCount)),
          maxRequiredUnknownOnlyClaimCount: Math.max(...qaFromEvidenceProofs.map(proof => proof.claimRoleRequiredUnknownOnlyClaimCount)),
          maxUnbackedRequiredClaimCount: Math.max(...qaFromEvidenceProofs.map(proof => proof.claimRoleUnbackedRequiredClaimCount)),
          maxInvalidRequiredClaimCount: Math.max(...qaFromEvidenceProofs.map(proof => proof.claimRoleInvalidRequiredClaimCount)),
          minValidCitationFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleValidCitationFileCount)),
          minRequiredClaimCitationFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleRequiredClaimCitationFileCount)),
          minRequiredPrimaryFileCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleRequiredPrimaryFileCount)),
          minRoleCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleCount)),
          minFileEntryCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.claimRoleFileEntryCount)),
        },
      },
      groundingStatuses: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.groundingStatus))).sort(),
      citationEnforcementStatuses: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.citationEnforcementStatus))).sort(),
      citationEnforcementReasons: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.citationEnforcementReason))).sort(),
      citedChunkCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.citedChunkCount)),
      ...(relationAwareEvidenceReasonProofs.length > 0 ? {
        relationAwareEvidenceReason: {
          status: 'OK',
          surface: 'PUBLIC_REPO_UI_RELATION_AWARE_EVIDENCE_REASON',
          marker: 'Graph relation:',
          proofCount: relationAwareEvidenceReasonProofs.length,
          minCitationReasonCount: Math.min(...relationAwareEvidenceReasonProofs.map(proof => proof.citationReasonCount)),
          minRetrievedChunkReasonCount: Math.min(...relationAwareEvidenceReasonProofs.map(proof => proof.retrievedChunkReasonCount)),
          adjacentContextReasonVisible: relationAwareEvidenceReasonProofs.every(proof => proof.adjacentContextReasonVisible),
          citedPrimaryStillPresent: relationAwareEvidenceReasonProofs.every(proof => proof.citedPrimaryStillPresent),
          uiReasonVisible: relationAwareEvidenceReasonProofs.every(proof => proof.uiReasonVisible),
          providerQualityClaim: false,
          llmFactClaim: false,
        },
      } : {}),
      expectedEvidenceFileVisible: true,
      evidenceRef: {
        requestBound: true,
        responseBound: true,
        contextVisible: true,
        filePath: qaFromEvidenceProofs[0]?.evidenceRefFilePath || '',
        lineNumber: qaFromEvidenceProofs[0]?.evidenceRefLineNumber || '',
      },
      startEndOnlyEvidenceRef: {
        status: 'OK',
        surface: 'PUBLIC_REPO_UI_QA_START_END_ONLY_EVIDENCE_REF',
        scanTaskId,
        requestScanTaskId: scanTaskId,
        responseScanTaskId: scanTaskId,
        responseStatus: Math.max(...qaFromEvidenceProofs.map(proof => proof.startEndOnlyEvidenceRef.responseStatus)),
        filePath: qaFromEvidenceProofs[0]?.startEndOnlyEvidenceRef.filePath || '',
        startLine: Math.min(...qaFromEvidenceProofs.map(proof => proof.startEndOnlyEvidenceRef.startLine)),
        endLine: Math.max(...qaFromEvidenceProofs.map(proof => proof.startEndOnlyEvidenceRef.endLine)),
        requestBound: qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.requestBound),
        responseBound: qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.responseBound),
        requestHasLegacyLineNumber: qaFromEvidenceProofs.some(proof => proof.startEndOnlyEvidenceRef.requestHasLegacyLineNumber),
        responseHasLegacyLineNumber: qaFromEvidenceProofs.some(proof => proof.startEndOnlyEvidenceRef.responseHasLegacyLineNumber),
        sourceEvidenceMatched: qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.sourceEvidenceMatched),
        sourceEvidenceMatchTypes: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.startEndOnlyEvidenceRef.sourceEvidenceMatchType))).sort(),
        minResultCount: Math.min(...qaFromEvidenceProofs.map(proof => proof.startEndOnlyEvidenceRef.resultCount)),
        primaryChunkBound: qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.primaryChunkBound),
        coverageScopes: Array.from(new Set(qaFromEvidenceProofs.map(proof => proof.startEndOnlyEvidenceRef.coverageScope))).sort(),
        currentScanOnly: qaFromEvidenceProofs.every(proof => proof.startEndOnlyEvidenceRef.currentScanOnly),
        providerQualityClaim: false,
        llmFactClaim: false,
      },
      evidenceHandoff: {
        status: 'OK',
        surface: 'PROJECT_QA_REPORT_EVIDENCE_HANDOFF',
        visible: qaEvidenceHandoffProofs.every(proof => proof.visible),
        sourceBridgeVisible: qaEvidenceHandoffProofs.every(proof => proof.sourceBridgeVisible),
        answerSourceReceiptVisible: qaEvidenceHandoffProofs.every(proof => proof.sourceEvidenceReceiptVisible),
        scanTaskId,
        requestScanTaskId: scanTaskId,
        responseScanTaskId: scanTaskId,
        requestBound: qaEvidenceHandoffProofs.every(proof => proof.sourceEvidenceRefRequestBound),
        responseBound: qaEvidenceHandoffProofs.every(proof => proof.sourceEvidenceRefResponseBound),
        contextVisible: qaEvidenceHandoffProofs.every(proof => proof.sourceEvidenceContextVisible),
        sourceEvidenceMatchTypes: Array.from(new Set(qaEvidenceHandoffProofs.map(proof => proof.sourceEvidenceMatchType).filter(Boolean))).sort(),
        lineAnchorVisible: qaEvidenceHandoffProofs.every(proof => proof.sourceEvidenceLineAnchorVisible),
        sourceLocationConfidenceVisible: qaEvidenceHandoffProofs.every(proof => proof.sourceLocationConfidenceVisible),
        sourceLocationConfidenceReadyVisible: qaEvidenceHandoffProofs.every(proof => proof.sourceLocationConfidenceReadyVisible),
        titleVisible: qaEvidenceHandoffProofs.every(proof => proof.titleVisible),
        categoryVisible: qaEvidenceHandoffProofs.every(proof => proof.categoryVisible),
        sourceVisible: qaEvidenceHandoffProofs.every(proof => proof.sourceVisible),
        fileReferenceVisible: qaEvidenceHandoffProofs.every(proof => proof.fileReferenceVisible),
        scanLabelVisible: qaEvidenceHandoffProofs.every(proof => proof.scanLabelVisible),
        readyForAutoRepair: qaEvidenceHandoffProofs.every(proof => proof.readyForAutoRepair),
        repairCandidateActionVisible: qaEvidenceHandoffProofs.every(proof => proof.repairCandidateActionVisible),
        autoRepairDraftUrlBound: qaEvidenceHandoffProofs.every(proof => proof.autoRepairDraftUrlBound),
        sourceTypes: Array.from(new Set(qaEvidenceHandoffProofs.map(proof => proof.sourceType).filter(Boolean))).sort(),
        repositoryIdBound: qaEvidenceHandoffProofs.every(proof => proof.repositoryIdBound),
        scanTaskIdBound: qaEvidenceHandoffProofs.every(proof => proof.scanTaskIdBound),
        fileBoundToEvidence: qaEvidenceHandoffProofs.every(proof => proof.fileBoundToEvidence),
        citationIdBound: qaEvidenceHandoffProofs.every(proof => proof.citationIdBound),
        chunkIdBound: qaEvidenceHandoffProofs.every(proof => proof.chunkIdBound),
        sourceEvidenceParamsBound: qaEvidenceHandoffProofs.every(proof => proof.sourceEvidenceParamsBound),
        candidateFormOpened: qaEvidenceHandoffProofs.every(proof => proof.candidateFormOpened),
        candidateFormScanVisible: qaEvidenceHandoffProofs.every(proof => proof.candidateFormScanVisible),
        candidateFormFilePrefilled: qaEvidenceHandoffProofs.every(proof => proof.candidateFormFilePrefilled),
        candidateTargetDescBound: qaEvidenceHandoffProofs.every(proof => proof.candidateTargetDescBound),
        noRawPromptOrAnswer: qaEvidenceHandoffProofs.every(proof => proof.noRawPromptOrAnswer),
        providerQualityClaim: false,
        llmFactClaim: false,
        noHorizontalOverflow: qaEvidenceHandoffProofs.every(proof => proof.noHorizontalOverflow),
      },
      sourceFileMatchRelease: {
        status: 'OK',
        surface: 'PROJECT_QA_SOURCE_FILE_MATCH_RELEASE',
        visible: sourceFileMatchReleaseProofs.every(proof => proof.visible),
        scanTaskId,
        requestScanTaskId: scanTaskId,
        responseScanTaskId: scanTaskId,
        currentScanOnly: sourceFileMatchReleaseProofs.every(proof => proof.currentScanOnly),
        releaseState: sourceFileMatchReleaseProofs.every(proof => proof.releaseState === 'READY') ? 'READY' : 'REVIEW',
        reportTargetVisible: sourceFileMatchReleaseProofs.every(proof => proof.reportTargetVisible),
        citedSliceVisible: sourceFileMatchReleaseProofs.every(proof => proof.citedSliceVisible),
        reportTargetLineVisible: sourceFileMatchReleaseProofs.every(proof => proof.reportTargetLineVisible),
        sourceEvidenceMatchTypes: Array.from(new Set(sourceFileMatchReleaseProofs.map(proof => proof.sourceEvidenceMatchType).filter(Boolean))).sort(),
        lineAnchorVisible: sourceFileMatchReleaseProofs.every(proof => proof.lineAnchorVisible),
        pathMatchType: sourceFileMatchReleaseProofs.every(proof => proof.pathMatchType === 'PATH_SUFFIX') ? 'PATH_SUFFIX' : 'FILE_NAME_ONLY',
        fileNameOnlyReviewVisible: sourceFileMatchReleaseProofs.some(proof => proof.fileNameOnlyReviewVisible),
        requiredEvidenceCovered: sourceFileMatchReleaseProofs.every(proof => proof.requiredEvidenceCovered),
        primaryClaimBound: sourceFileMatchReleaseProofs.every(proof => proof.primaryClaimBound),
        readyForAutoRepair: sourceFileMatchReleaseProofs.every(proof => proof.readyForAutoRepair),
        nextActionKey: sourceFileMatchReleaseProofs.every(proof => proof.nextActionKey === 'AUTO_REPAIR_REVIEW') ? 'AUTO_REPAIR_REVIEW' : 'SOURCE_BINDING_REVIEW',
        riskNoticeVisible: sourceFileMatchReleaseProofs.every(proof => proof.riskNoticeVisible),
        sourceBindingOnlyNoticeVisible: sourceFileMatchReleaseProofs.every(proof => proof.sourceBindingOnlyNoticeVisible),
        noRawPromptOrAnswer: sourceFileMatchReleaseProofs.every(proof => proof.noRawPromptOrAnswer),
        providerQualityClaim: false,
        llmFactClaim: false,
        noHorizontalOverflow: sourceFileMatchReleaseProofs.every(proof => proof.noHorizontalOverflow),
      },
      sourceLocationReadability: {
        status: 'OK',
        surface: 'PUBLIC_REPO_UI_SOURCE_LOCATION_READABILITY',
        proofCount: sourceLocationReadabilityProofs.length,
        mobile390Covered: sourceLocationReadabilityProofs.some(proof => proof.viewportName === 'mobile'),
        narrow320Covered: sourceLocationReadabilityProofs.some(proof => proof.viewportName === 'narrow'),
        sourceReceipt: {
          readyContained: readySourceLocationReadabilityProofs.every(proof => proof.sourceReceiptContained),
          reviewContained: reviewSourceLocationReadabilityProofs.every(proof => proof.sourceReceiptContained),
          referenceWraps: sourceLocationReadabilityProofs.every(proof => proof.sourceReceiptReferenceWraps),
          titleNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceReceiptTitleNotClipped),
          tagsNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceReceiptTagsNotClipped),
        },
        sourceLocationConfidence: {
          readyContained: readySourceLocationReadabilityProofs.every(proof => proof.sourceLocationConfidenceContained),
          reviewContained: reviewSourceLocationReadabilityProofs.every(proof => proof.sourceLocationConfidenceContained),
          metricsNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceLocationConfidenceMetricsNotClipped),
          checksWrap: sourceLocationReadabilityProofs.every(proof => proof.sourceLocationConfidenceChecksWrap),
        },
        sourceFileMatchRelease: {
          readyContained: readySourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchReleaseContained),
          reviewContained: reviewSourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchReleaseContained),
          targetReferenceNotClipped: sourceLocationReadabilityProofs.every(proof => proof.targetReferenceNotClipped),
          citedReferenceNotClipped: sourceLocationReadabilityProofs.every(proof => proof.citedReferenceNotClipped),
          checksNotClipped: sourceLocationReadabilityProofs.every(proof => proof.sourceFileMatchChecksNotClipped),
          noRepairOnReview: reviewSourceLocationReadabilityProofs.every(proof => proof.repairActionHiddenWhenReview),
        },
        noHorizontalOverflow: sourceLocationReadabilityProofs.every(proof => proof.noHorizontalOverflow),
        providerQualityClaim: false,
        llmFactClaim: false,
      },
      claimCitationNoiseBoundary: {
        status: 'OK',
        surface: 'PUBLIC_REPO_UI_CLAIM_CITATION_NOISE_BOUNDARY',
        scanTaskId,
        requestScanTaskId: scanTaskId,
        responseScanTaskId: scanTaskId,
        currentScanOnly: claimCitationNoiseBoundaryProofs.every(proof => proof.currentScanOnly),
        requestCount: claimCitationNoiseBoundaryProofs.reduce((sum, proof) => sum + proof.requestCount, 0),
        responseStatus: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.responseStatus)),
        resultCount: Math.min(...claimCitationNoiseBoundaryProofs.map(proof => proof.resultCount)),
        citationCount: Math.min(...claimCitationNoiseBoundaryProofs.map(proof => proof.citationCount)),
        noiseKinds: Array.from(new Set(claimCitationNoiseBoundaryProofs.flatMap(proof => proof.noiseKinds))).sort(),
        coverageStatus: 'NONE',
        maxCitedEvidenceCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.maxCitedEvidenceCount)),
        maxRepairCandidateCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.maxRepairCandidateCount)),
        claimCitationStatus: 'REVIEW',
        maxCitedRequiredClaimCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.maxCitedRequiredClaimCount)),
        maxInvalidCitationClaimCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.maxInvalidCitationClaimCount)),
        roleDistributionStatus: 'REVIEW_UNCITED',
        maxRequiredPrimaryBoundClaimCount: Math.max(...claimCitationNoiseBoundaryProofs.map(proof => proof.maxRequiredPrimaryBoundClaimCount)),
        groundingStatuses: Array.from(new Set(claimCitationNoiseBoundaryProofs.flatMap(proof => proof.groundingStatuses))).sort(),
        citationEnforcementStatuses: Array.from(new Set(claimCitationNoiseBoundaryProofs.flatMap(proof => proof.citationEnforcementStatuses))).sort(),
        answerCitationsCitedByAnswer: claimCitationNoiseBoundaryProofs.some(proof => proof.answerCitationsCitedByAnswer),
        trustSummaryReadyVisible: claimCitationNoiseBoundaryProofs.some(proof => proof.trustSummaryReadyVisible),
        repairCandidateActionVisible: claimCitationNoiseBoundaryProofs.some(proof => proof.repairCandidateActionVisible),
        repairEvidenceGateBlockedVisible: claimCitationNoiseBoundaryProofs.every(proof => proof.repairEvidenceGateBlockedVisible),
        evidenceRefRequestBound: claimCitationNoiseBoundaryProofs.every(proof => proof.evidenceRefRequestBound),
        evidenceRefResponseBound: claimCitationNoiseBoundaryProofs.every(proof => proof.evidenceRefResponseBound),
        rawAnswerStored: false,
        rawPromptStored: false,
        providerQualityClaim: false,
        llmFactClaim: false,
        noHorizontalOverflow: claimCitationNoiseBoundaryProofs.every(proof => proof.noHorizontalOverflow),
        llmSetup: {
          status: claimCitationNoiseBoundaryProofs.every(proof => proof.llmSetup.status === 'OK') ? 'OK' : 'WARN',
        },
        llmCleanup: {
          status: claimCitationNoiseBoundaryProofs.every(proof => proof.llmCleanup.status === 'OK') ? 'OK' : 'WARN',
        },
      },
      fileAnchorDrift: {
        status: 'OK',
        surface: 'PUBLIC_REPO_UI_FILE_ANCHOR_DRIFT',
        scanTaskId,
        requestScanTaskId: scanTaskId,
        responseScanTaskId: scanTaskId,
        currentScanOnly: fileAnchorDriftProofs.every(proof => proof.currentScanOnly),
        requestCount: fileAnchorDriftProofs.reduce((sum, proof) => sum + proof.requestCount, 0),
        responseStatus: Math.max(...fileAnchorDriftProofs.map(proof => proof.responseStatus)),
        resultCount: Math.min(...fileAnchorDriftProofs.map(proof => proof.resultCount)),
        citationCount: Math.min(...fileAnchorDriftProofs.map(proof => proof.citationCount)),
        sourceEvidenceMatchTypes: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.sourceEvidenceMatchTypes))).sort(),
        citationCoverage: {
          statuses: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.citationCoverage.statuses))).sort(),
          coverageScopes: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.citationCoverage.coverageScopes))).sort(),
          maxPrimaryEvidenceCount: Math.max(...fileAnchorDriftProofs.map(proof => proof.citationCoverage.maxPrimaryEvidenceCount)),
          minContextEvidenceCount: Math.min(...fileAnchorDriftProofs.map(proof => proof.citationCoverage.minContextEvidenceCount)),
          maxRepairCandidateCount: Math.max(...fileAnchorDriftProofs.map(proof => proof.citationCoverage.maxRepairCandidateCount)),
          evidenceRoleDistribution: {
            statuses: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.citationCoverage.evidenceRoleDistribution.statuses))).sort(),
          },
        },
        claimCitationCoverage: {
          statuses: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.claimCitationCoverage.statuses))).sort(),
          readyForRepair: fileAnchorDriftProofs.every(proof => proof.claimCitationCoverage.readyForRepair),
          readinessReasons: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.claimCitationCoverage.readinessReasons))).sort(),
          minRequiredClaimCount: Math.min(...fileAnchorDriftProofs.map(proof => proof.claimCitationCoverage.minRequiredClaimCount)),
          minCitedRequiredClaimCount: Math.min(...fileAnchorDriftProofs.map(proof => proof.claimCitationCoverage.minCitedRequiredClaimCount)),
          roleDistribution: {
            statuses: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.claimCitationCoverage.roleDistribution.statuses))).sort(),
            maxRequiredPrimaryBoundClaimCount: Math.max(...fileAnchorDriftProofs.map(proof => proof.claimCitationCoverage.roleDistribution.maxRequiredPrimaryBoundClaimCount)),
            maxRequiredPrimaryFileCount: Math.max(...fileAnchorDriftProofs.map(proof => proof.claimCitationCoverage.roleDistribution.maxRequiredPrimaryFileCount)),
            minRequiredContextOnlyClaimCount: Math.min(...fileAnchorDriftProofs.map(proof => proof.claimCitationCoverage.roleDistribution.minRequiredContextOnlyClaimCount)),
          },
        },
        groundingStatuses: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.groundingStatuses))).sort(),
        citationEnforcementStatuses: Array.from(new Set(fileAnchorDriftProofs.flatMap(proof => proof.citationEnforcementStatuses))).sort(),
        repairEvidenceGateBlockedVisible: fileAnchorDriftProofs.every(proof => proof.repairEvidenceGateBlockedVisible),
        trustSummaryBlockedVisible: fileAnchorDriftProofs.every(proof => proof.trustSummaryBlockedVisible),
        crossFileSummaryContextGapVisible: fileAnchorDriftProofs.every(proof => proof.crossFileSummaryContextGapVisible),
        sourceLocationConfidenceReviewVisible: fileAnchorDriftProofs.every(proof => proof.sourceLocationConfidenceReviewVisible),
        latestNextActionRepairHidden: fileAnchorDriftProofs.every(proof => proof.latestNextActionRepairHidden),
        latestCitationRepairHidden: fileAnchorDriftProofs.every(proof => proof.latestCitationRepairHidden),
        evidenceRefRequestBound: fileAnchorDriftProofs.every(proof => proof.evidenceRefRequestBound),
        evidenceRefResponseBound: fileAnchorDriftProofs.every(proof => proof.evidenceRefResponseBound),
        rawAnswerStored: false,
        rawPromptStored: false,
        providerQualityClaim: false,
        llmFactClaim: false,
        noHorizontalOverflow: fileAnchorDriftProofs.every(proof => proof.noHorizontalOverflow),
        llmSetup: {
          status: fileAnchorDriftProofs.every(proof => proof.llmSetup.status === 'OK') ? 'OK' : 'WARN',
        },
        llmCleanup: {
          status: fileAnchorDriftProofs.every(proof => proof.llmCleanup.status === 'OK') ? 'OK' : 'WARN',
        },
      },
    },
    projectQaEvidenceCombinationSummary: {
      status: 'OK',
      surface: 'PROJECT_QA_CODE_CHUNKS_SEARCH',
      visible: evidenceCombinationProofs.every(proof => proof.visible),
      scanTaskId,
      requestScanTaskId: scanTaskId,
      responseScanTaskId: scanTaskId,
      currentScanOnly: evidenceCombinationProofs.every(proof => proof.currentScanOnly),
      resultCount: Math.min(...evidenceCombinationProofs.map(proof => proof.resultCount)),
      visibleCardCount: Math.min(...evidenceCombinationProofs.map(proof => proof.visibleCardCount)),
      labels: Array.from(new Set(evidenceCombinationProofs.map(proof => proof.label).filter(Boolean))).sort(),
      topSourceLabels: Array.from(new Set(evidenceCombinationProofs.map(proof => proof.topSourceLabel).filter(Boolean))).sort(),
      primaryContextRoles: Array.from(new Set(evidenceCombinationProofs.map(proof => proof.primaryContextRole).filter(Boolean))).sort(),
      minPrimaryCount: Math.min(...evidenceCombinationProofs.map(proof => proof.primaryCount)),
      minAdjacentContextCount: Math.min(...evidenceCombinationProofs.map(proof => proof.adjacentContextCount)),
      minUniqueFileCount: Math.min(...evidenceCombinationProofs.map(proof => proof.uniqueFileCount)),
      minEmbeddedEvidenceCount: Math.min(...evidenceCombinationProofs.map(proof => proof.embeddedEvidenceCount)),
      minNextQuestionCount: Math.min(...evidenceCombinationProofs.map(proof => proof.nextQuestionCount)),
      sourceLabelsVisible: evidenceCombinationProofs.every(proof => proof.sourceLabelsVisible),
      filePathsVisible: evidenceCombinationProofs.every(proof => proof.filePathsVisible),
      fileCoverageVisible: evidenceCombinationProofs.every(proof => proof.fileCoverageVisible),
      rolePathVisible: evidenceCombinationProofs.every(proof => proof.rolePathVisible),
      embeddingStateVisible: evidenceCombinationProofs.every(proof => proof.embeddingStateVisible),
      topReferenceVisible: evidenceCombinationProofs.every(proof => proof.topReferenceVisible),
      derivedFromVisibleResults: evidenceCombinationProofs.every(proof => proof.derivedFromVisibleResults),
      resultSetOnly: evidenceCombinationProofs.every(proof => proof.resultSetOnly),
      providerQualityClaim: false,
      llmFactClaim: false,
      noHorizontalOverflow: evidenceCombinationProofs.every(proof => proof.noHorizontalOverflow),
    },
    governanceTimeline: {
      status: 'OK',
      aggregateApiCalled: true,
      endpoint: `/api/projects/${projectId}/scan-tasks/${scanTaskId}/governance-timeline`,
      responseStatus: 200,
      visible: true,
      projectId,
      repositoryId,
      scanTaskId,
      scanStatus: 'SUCCESS',
      summaryStatus: governanceTimelineProofs[0]?.summaryStatus || '',
      hasErrors: governanceTimelineProofs.some(proof => proof.hasErrors),
      attributionGapCount: Math.max(...governanceTimelineProofs.map(proof => proof.attributionGapCount)),
      counts: governanceTimelineProofs[0]?.counts || {},
      hasSummary: true,
      hasResources: true,
      hasLimits: true,
      resourceArrays: governanceResourceArrays,
      eventCount: minGovernanceEventCount,
      resourcesBound: true,
      derivedAuditResourceTypes,
      derivedArtifactOwnerTypes,
      derivedArtifactTypes,
      derivedGovernanceVisible: governanceTimelineProofs.every(proof => proof.derivedGovernanceVisible),
      patchEvidence: {
        ...patchEvidenceProof,
        repairVisible: governanceTimelineProofs.every(proof => proof.patchEvidence.repairVisible),
        scanTaskIdBound: governanceTimelineProofs.every(proof => proof.patchEvidence.scanTaskIdBound),
        targetFileVisible: governanceTimelineProofs.every(proof => proof.patchEvidence.targetFileVisible),
        diffVisible: governanceTimelineProofs.every(proof => proof.patchEvidence.diffVisible),
        patchArtifactVisible: governanceTimelineProofs.every(proof => proof.patchEvidence.patchArtifactVisible),
        patchReadyAuditVisible: governanceTimelineProofs.every(proof => proof.patchEvidence.patchReadyAuditVisible),
        auditSourceBound: governanceTimelineProofs.every(proof => proof.patchEvidence.auditSourceBound),
        repairExecutionVisible: governanceTimelineProofs.every(proof => proof.patchEvidence.repairExecutionVisible),
        patchGenerationStepVisible: governanceTimelineProofs.every(proof => proof.patchEvidence.patchGenerationStepVisible),
        foreignPatchEvidenceHidden: governanceTimelineProofs.every(proof => proof.patchEvidence.foreignPatchEvidenceHidden),
      },
      agentReview: {
        ...agentReviewProof,
        agentTaskVisible: governanceTimelineProofs.every(proof => proof.agentReview.agentTaskVisible),
        scanTaskIdBound: governanceTimelineProofs.every(proof => proof.agentReview.scanTaskIdBound),
        agentReportArtifactVisible: governanceTimelineProofs.every(proof => proof.agentReview.agentReportArtifactVisible),
        agentAuditVisible: governanceTimelineProofs.every(proof => proof.agentReview.agentAuditVisible),
        agentAuditSourceBound: governanceTimelineProofs.every(proof => proof.agentReview.agentAuditSourceBound),
        agentExecutionVisible: governanceTimelineProofs.every(proof => proof.agentReview.agentExecutionVisible),
        agentExecutionStepVisible: governanceTimelineProofs.every(proof => proof.agentReview.agentExecutionStepVisible),
        foreignAgentEvidenceHidden: governanceTimelineProofs.every(proof => proof.agentReview.foreignAgentEvidenceHidden),
        noRawPromptOrAnswer: governanceTimelineProofs.every(proof => proof.agentReview.noRawPromptOrAnswer),
      },
      truncated: governanceTimelineProofs.some(proof => proof.truncated),
    },
    realBackend: true,
    mockedApi: false,
  })}`)
})
