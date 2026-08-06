import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

const projectId = 1
const repairId = 101
const listOnlyRepairId = 102
const blockedRepairId = 103
const scanTaskId = 501
const executionTaskId = 701
const blockedExecutionTaskId = 703
const auditLogId = 801
const targetFile = 'src/main/java/demo/autorepair/readability/VeryLargeControllerWithLongNameForPatchReadyReview.java'
const blockedTargetFile = 'src/main/java/demo/autorepair/readability/ManualCandidateWithIncompletePatchEvidence.java'
const patchArtifactPath = 'artifacts/auto-repairs/101/change.patch'
const longTargetDesc = 'Refactor the oversized controller into smaller endpoints while preserving authorization checks and documenting the patch-ready-review-readability-contract-aaaaaaaaaaaaaaaaaaaaaaaa.'
const longPatchEvidenceSummary = 'generate_patch SUCCESS / Patch evidence retained for patch-ready-review-readability-contract-bbbbbbbbbbbbbbbbbbbbbbbb'
const longCandidateGateReason = 'QA citation, report evidence and target file are line-anchored for candidate review with patch-ready-mobile-readability-contract-cccccccccccccccccccc'
const patchReadyLogSafePrefix = 'MOCK patch generated in isolated workspace'
const patchReadyBearerSecret = 'Bearer patch-ready-bearer-should-not-render'
const patchReadyAuthorizationSecret = `Authorization: ${patchReadyBearerSecret}`
const patchReadyTokenSecret = 'token=patch-ready-token-should-not-render'
const patchReadyApiKeySecret = 'api_key=sk-patchreadysecretshouldnotrender123456789'
const patchReadyPasswordSecret = 'password=patch-ready-password-should-not-render'
const patchReadyQuotedSecret = 'secret="quoted patch ready secret should not render"'
const patchReadyJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJwYXRjaCI6InJlYWR5In0.patchReadySignatureShouldNotRender'
const patchReadyRawDiffSecretSentinel = 'patch-ready-diff-secret-should-not-render'
const patchReadyDiffSkSecret = 'sk-patchreadydiffsecretshouldnotrender123456789'
const patchReadyDiffJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJkaWZmIjoicmVhZHkifQ.patchReadyDiffSignatureShouldNotRender'
const patchReadyForbiddenLogSecretSnippets = [
  patchReadyBearerSecret,
  patchReadyAuthorizationSecret,
  patchReadyTokenSecret,
  patchReadyApiKeySecret,
  patchReadyPasswordSecret,
  patchReadyQuotedSecret,
  patchReadyJwtSecret,
  'patch-ready-bearer-should-not-render',
  'patch-ready-token-should-not-render',
  'sk-patchreadysecretshouldnotrender123456789',
  'patch-ready-password-should-not-render',
  'quoted patch ready secret should not render',
  'patchReadySignatureShouldNotRender',
]
const patchReadyForbiddenDiffSecretSnippets = [
  patchReadyRawDiffSecretSentinel,
  patchReadyDiffSkSecret,
  patchReadyDiffJwtSecret,
  'patchReadyDiffSignatureShouldNotRender',
]
const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

type RuntimeIssue = {
  type: string
  message: string
}

type AutoRepairGovernanceLoopProof = {
  viewport: string
  expectedColumns: number
  gridColumns: number
  stepCount: number
  candidateSourceVisible: boolean
  patchGenerationVisible: boolean
  reviewGateVisible: boolean
  prExitVisible: boolean
  noHorizontalOverflow: boolean
  fullRepairQualityClaim: boolean
  llmFactClaim: boolean
}

const project = {
  id: projectId,
  name: 'PATCH_READY UI Smoke',
  description: 'Mocked project for browser smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 91,
  createdBy: 1,
  createdAt: '2026-06-29T09:00:00Z',
}

const repository = {
  id: 11,
  projectId,
  provider: 'LOCAL',
  owner: 'demo',
  name: 'patch-ready-smoke-repo',
  url: 'file:///tmp/sourcelens-patch-ready-smoke',
  defaultBranch: 'main',
  visibility: 'PUBLIC',
  authType: 'NONE',
  status: 'ACTIVE',
  createdAt: '2026-06-29T09:00:00Z',
}

const patchReadyRepair = {
  id: repairId,
  projectId,
  repositoryId: 11,
  scanTaskId,
  filePath: targetFile,
  targetDesc: longTargetDesc,
  status: 'PATCH_READY',
  branchName: null,
  diffContent: [
    `diff --git a/${targetFile} b/${targetFile}`,
    '--- a/src/main/java/demo/LargeController.java',
    '+++ b/src/main/java/demo/LargeController.java',
    '@@ -1,5 +1,6 @@',
    '+// Mock LLM response: split controller responsibility while preserving patch-ready-review-readability-contract-dddddddddddddddddddddd',
    `+// Authorization: Bearer ${patchReadyRawDiffSecretSentinel}`,
    `+String token = "${patchReadyRawDiffSecretSentinel}";`,
    `+String apiKey = "${patchReadyDiffSkSecret}";`,
    `+String apikey = "${patchReadyRawDiffSecretSentinel}";`,
    `+String api_key = "${patchReadyRawDiffSecretSentinel}";`,
    `+String secret = "${patchReadyRawDiffSecretSentinel}";`,
    `+String password = "${patchReadyRawDiffSecretSentinel}";`,
    `+String privateKey = "${patchReadyRawDiffSecretSentinel}";`,
    `+String private_key = "${patchReadyRawDiffSecretSentinel}";`,
    `+String accessToken = "${patchReadyRawDiffSecretSentinel}";`,
    `+String access_token = "${patchReadyRawDiffSecretSentinel}";`,
    `+String refreshToken = "${patchReadyRawDiffSecretSentinel}";`,
    `+String refresh_token = "${patchReadyRawDiffSecretSentinel}";`,
    `+String jwt = "${patchReadyDiffJwtSecret}";`,
  ].join('\n'),
  patchArtifactPath,
  testLog: `${patchReadyLogSafePrefix}. ${patchReadyAuthorizationSecret} ${patchReadyTokenSecret} ${patchReadyApiKeySecret} ${patchReadyPasswordSecret} ${patchReadyQuotedSecret} ${patchReadyJwtSecret}`,
  prUrl: null,
  errorMessage: null,
  createdBy: 1,
  createdAt: '2026-06-29T09:10:00Z',
  updatedAt: '2026-06-29T09:11:00Z',
}

const listOnlyRepair = {
  ...patchReadyRepair,
  id: listOnlyRepairId,
  scanTaskId: null,
  status: 'FAILED',
  filePath: 'src/main/java/demo/OtherController.java',
  targetDesc: 'Intentionally not the deep-linked repair.',
  errorMessage: 'Mock list item should not be selected.',
}

const blockedPatchReadyRepair = {
  ...patchReadyRepair,
  id: blockedRepairId,
  scanTaskId: null,
  filePath: blockedTargetFile,
  targetDesc: 'Manual repair candidate with incomplete PATCH_READY evidence.',
  diffContent: null,
  patchArtifactPath: null,
  testLog: null,
}

const executionDetail = {
  task: {
    id: executionTaskId,
    projectId,
    repositoryId: 11,
    taskType: 'AUTO_REPAIR',
    sourceType: 'AUTO_REPAIR',
    sourceId: repairId,
    status: 'FAILED',
    currentStep: 'create_pull_request',
    currentAttemptId: 2,
    progress: 76,
    errorMessage: 'GitHub Pull Request 创建冲突或校验失败, status=409',
    createdBy: 1,
    startedAt: '2026-06-29T09:10:01Z',
    finishedAt: '2026-06-29T09:11:12Z',
    createdAt: '2026-06-29T09:10:00Z',
    updatedAt: '2026-06-29T09:11:12Z',
  },
  attempts: [
    {
      id: 1,
      taskId: executionTaskId,
      attemptNo: 1,
      status: 'SUCCESS',
      currentStep: 'generate_patch',
      errorMessage: null,
      startedAt: '2026-06-29T09:10:01Z',
      finishedAt: '2026-06-29T09:10:12Z',
      createdAt: '2026-06-29T09:10:00Z',
      updatedAt: '2026-06-29T09:10:12Z',
    },
    {
      id: 2,
      taskId: executionTaskId,
      attemptNo: 2,
      status: 'FAILED',
      currentStep: 'create_pull_request',
      errorMessage: 'GitHub Pull Request 创建冲突或校验失败, status=409',
      startedAt: '2026-06-29T09:11:00Z',
      finishedAt: '2026-06-29T09:11:12Z',
      createdAt: '2026-06-29T09:11:00Z',
      updatedAt: '2026-06-29T09:11:12Z',
    },
  ],
  steps: [
    {
      id: 1,
      taskId: executionTaskId,
      attemptId: 1,
      stepKey: 'prepare_workspace',
      stepName: 'prepare_workspace',
      status: 'SUCCESS',
      logSummary: 'Workspace prepared',
      errorMessage: null,
      startedAt: '2026-06-29T09:10:01Z',
      finishedAt: '2026-06-29T09:10:03Z',
      createdAt: '2026-06-29T09:10:00Z',
      updatedAt: '2026-06-29T09:10:03Z',
    },
    {
      id: 2,
      taskId: executionTaskId,
      attemptId: 1,
      stepKey: 'generate_patch',
      stepName: 'generate_patch',
      status: 'SUCCESS',
      logSummary: longPatchEvidenceSummary,
      errorMessage: null,
      startedAt: '2026-06-29T09:10:03Z',
      finishedAt: '2026-06-29T09:10:12Z',
      createdAt: '2026-06-29T09:10:03Z',
      updatedAt: '2026-06-29T09:10:12Z',
    },
    {
      id: 3,
      taskId: executionTaskId,
      attemptId: 2,
      stepKey: 'create_branch',
      stepName: 'create_branch',
      status: 'SUCCESS',
      logSummary: 'Patch branch created',
      errorMessage: null,
      startedAt: '2026-06-29T09:11:00Z',
      finishedAt: '2026-06-29T09:11:04Z',
      createdAt: '2026-06-29T09:11:00Z',
      updatedAt: '2026-06-29T09:11:04Z',
    },
    {
      id: 4,
      taskId: executionTaskId,
      attemptId: 2,
      stepKey: 'push_branch',
      stepName: 'push_branch',
      status: 'SUCCESS',
      logSummary: 'Patch branch pushed',
      errorMessage: null,
      startedAt: '2026-06-29T09:11:04Z',
      finishedAt: '2026-06-29T09:11:08Z',
      createdAt: '2026-06-29T09:11:04Z',
      updatedAt: '2026-06-29T09:11:08Z',
    },
    {
      id: 5,
      taskId: executionTaskId,
      attemptId: 2,
      stepKey: 'create_pull_request',
      stepName: 'create_pull_request',
      status: 'FAILED',
      logSummary: 'Pull Request was rejected by mock GitHub',
      errorMessage: 'GitHub Pull Request 创建冲突或校验失败, status=409',
      startedAt: '2026-06-29T09:11:08Z',
      finishedAt: '2026-06-29T09:11:12Z',
      createdAt: '2026-06-29T09:11:08Z',
      updatedAt: '2026-06-29T09:11:12Z',
    },
  ],
  logs: [
    {
      id: 1,
      taskId: executionTaskId,
      attemptId: 1,
      stepKey: 'generate_patch',
      level: 'INFO',
      message: longPatchEvidenceSummary,
      createdAt: '2026-06-29T09:10:12Z',
    },
    {
      id: 2,
      taskId: executionTaskId,
      attemptId: 2,
      stepKey: 'create_pull_request',
      level: 'ERROR',
      message: 'GitHub Pull Request 创建冲突或校验失败, status=409',
      createdAt: '2026-06-29T09:11:12Z',
    },
  ],
}

const blockedExecutionDetail = {
  ...executionDetail,
  task: {
    ...executionDetail.task,
    id: blockedExecutionTaskId,
    sourceId: blockedRepairId,
    status: 'SUCCESS',
  },
  attempts: [],
  steps: [],
  logs: [],
}

const patchReadyAudit = {
  id: auditLogId,
  userId: 1,
  projectId,
  resourceType: 'AUTO_REPAIR',
  resourceId: repairId,
  action: 'AUTO_REPAIR_PATCH_READY',
  status: 'SUCCESS',
  inputJson: JSON.stringify({
    scanTaskId,
    patchArtifactPath,
    filePath: targetFile,
  }),
  outputSummary: 'PATCH_READY artifact generated',
  durationMs: 1234,
  requestId: 'req_patch_ready_smoke',
  createdAt: '2026-06-29T09:11:00Z',
}

const candidateReceiptAudit = {
  id: auditLogId + 100,
  userId: 1,
  projectId,
  resourceType: 'AUTO_REPAIR',
  resourceId: repairId,
  action: 'AUTO_REPAIR_CANDIDATE_CREATED',
  status: 'SUCCESS',
  inputJson: JSON.stringify({
    provenance: {
      sourceType: 'PROJECT_QA_VERIFIED_CITATION',
      scanTaskId,
      filePath: targetFile,
      citationId: 'PATCH_READY_CANDIDATE_RECEIPT',
      sourceLabel: 'C1',
      chunkId: 50101,
      startLine: 12,
      endLine: 36,
      citedByAnswer: true,
      groundingStatus: 'VERIFIED',
      citationEnforcementStatus: 'DIRECT_VERIFIED',
      sourceEvidenceTitle: 'Controller risk evidence',
      sourceEvidenceFilePath: targetFile,
      sourceEvidenceLineNumber: '12',
      sourceEvidenceMatched: true,
      sourceEvidenceMatchType: 'REPORT_LINE_ANCHOR',
      repairEvidenceGate: 'READY',
      repairEvidenceGateReason: longCandidateGateReason,
      repairEvidenceGateSource: 'SERVER_DERIVED',
    },
  }),
  outputSummary: 'AutoRepair candidate receipt created',
  durationMs: 98,
  requestId: 'req_candidate_receipt_smoke',
  createdAt: '2026-06-29T09:10:30Z',
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

async function installPatchReadyMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const auditQueries: string[] = []
  let submitPrCount = 0
  let detailFallbackCount = 0

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'patch-ready-ui-smoke-token')
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
      await fulfillJson(route, result({ id: 1, username: 'patch_ready_smoke', email: 'smoke@local.test', status: 'ACTIVE' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs`) {
      await fulfillJson(route, result([listOnlyRepair]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/repositories`) {
      await fulfillJson(route, result([repository]))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs/${repairId}`) {
      detailFallbackCount += 1
      await fulfillJson(route, result(patchReadyRepair))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/auto-repairs/${blockedRepairId}`) {
      await fulfillJson(route, result(blockedPatchReadyRepair))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/AUTO_REPAIR/${repairId}`) {
      await fulfillJson(route, result(executionDetail))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/execution-tasks/source/AUTO_REPAIR/${blockedRepairId}`) {
      await fulfillJson(route, result(blockedExecutionDetail))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/auto-repairs/${repairId}/submit-pr`) {
      submitPrCount += 1
      await fulfillJson(route, result({ ...patchReadyRepair, status: 'PR_RUNNING' }))
      return
    }

    if (method === 'POST' && path === `/api/projects/${projectId}/auto-repairs/${blockedRepairId}/submit-pr`) {
      submitPrCount += 1
      await fulfillJson(route, result({ ...patchReadyRepair, status: 'PR_RUNNING' }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/audit-logs`) {
      auditQueries.push(url.search)
      const requestedResourceId = url.searchParams.get('resourceId')
      const requestedAction = url.searchParams.get('action')
      const items = requestedResourceId === String(repairId)
        ? requestedAction === 'AUTO_REPAIR_CANDIDATE_CREATED'
          ? [candidateReceiptAudit]
          : requestedAction === 'AUTO_REPAIR_PATCH_READY'
            ? [patchReadyAudit]
            : [patchReadyAudit]
        : []
      await fulfillJson(route, result({ items, page: 1, pageSize: 20, total: items.length }))
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

    unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await route.fulfill({
      status: 599,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(result(null)),
    })
  })

  return {
    unhandledApiRequests,
    auditQueries,
    getSubmitPrCount: () => submitPrCount,
    getDetailFallbackCount: () => detailFallbackCount,
  }
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

  return issues
}

function isKnownThirdPartyConsoleWarning(text: string) {
  return text.includes('findDOMNode is deprecated')
    || text.includes('findDOMNode findDOMNode DomWrapper')
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

async function expectLocatorTextNotClipped(locator: Locator, label: string) {
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
  expect(metrics.whiteSpace, `${label} must not force single-line truncation: ${JSON.stringify(metrics)}`).not.toBe('nowrap')
  expect(
    metrics.overflowWrap === 'anywhere' || metrics.wordBreak === 'break-word' || metrics.wordBreak === 'break-all',
    `${label} must allow long repair evidence to wrap: ${JSON.stringify(metrics)}`,
  ).toBe(true)
  expect(metrics.textOverflow, `${label} must not rely on ellipsis for critical evidence: ${JSON.stringify(metrics)}`).not.toBe('ellipsis')
  expect(metrics.scrollWidth - metrics.clientWidth, `${label} is horizontally clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(2)
  expect(metrics.scrollHeight - metrics.clientHeight, `${label} is vertically clipped: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(2)
}

async function expectAutoRepairTableScrollerContained(page: Page, label: string) {
  const tableCard = page.locator('.sl-autorepair-table-card').first()
  await expectContainedInViewport(tableCard, `${label}:table-card`)

  const tableScroller = tableCard.locator('.ant-table-content').first()
  await expect(tableScroller, `${label}:table-scroller`).toBeVisible()
  const metrics = await tableScroller.evaluate(element => {
    const style = window.getComputedStyle(element)
    return {
      overflowX: style.overflowX,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }
  })
  expect(['auto', 'scroll'].includes(metrics.overflowX), `${label}:table scroller must own horizontal overflow: ${JSON.stringify(metrics)}`).toBe(true)
  expect(metrics.scrollWidth, `${label}:table must keep horizontal scroll surface`).toBeGreaterThanOrEqual(metrics.clientWidth)
}

async function expectNoErrorToast(page: Page, label: string) {
  await expect(page.getByText(/Internal server error|服务暂时不可用|网络连接异常|请求失败|加载.*失败/)).toHaveCount(0, {
    timeout: 500,
  }).catch(async () => {
    throw new Error(`${label} rendered an error toast or inline API failure`)
  })
}

async function assertStablePage(page: Page, label: string) {
  await expectNoErrorToast(page, label)
  await expectNoHorizontalOverflow(page, label)
}

async function assertAutoRepairGovernanceLoop(
  page: Page,
  label: string,
  expectedColumns: number,
): Promise<AutoRepairGovernanceLoopProof> {
  const governance = page.getByRole('region', { name: '自动修复候选治理闭环' })
  await expect(governance, `${label}:governance-loop`).toBeVisible()
  await expectContainedInViewport(governance, `${label}:governance-loop`)
  await expect(governance.getByText('AutoRepair Governance Loop')).toBeVisible()
  await expect(governance.getByText('自动修复候选治理闭环')).toBeVisible()
  await expect(governance.getByText('避免把“已生成 patch”误读成“已验证修复”。')).toBeVisible()

  const grid = governance.locator('.sl-autorepair-governance-grid').first()
  const steps = governance.locator('[data-sl-autorepair-governance-step]')
  await expect(steps, `${label}:governance-step-count`).toHaveCount(4)

  const candidateSource = governance.locator('[data-sl-autorepair-governance-step="candidate-source"]').first()
  const patchGeneration = governance.locator('[data-sl-autorepair-governance-step="patch-generation"]').first()
  const reviewGate = governance.locator('[data-sl-autorepair-governance-step="review-gate"]').first()
  const prExit = governance.locator('[data-sl-autorepair-governance-step="pr-exit"]').first()

  await expect(candidateSource).toContainText('候选来源')
  await expect(candidateSource).toContainText('人工候选保留身份，不伪装为扫描来源')
  await expect(patchGeneration).toContainText('补丁生成')
  await expect(patchGeneration).toContainText('已有 PATCH_READY 候选')
  await expect(reviewGate).toContainText('审查门禁')
  await expect(reviewGate).toContainText('允许 PR')
  await expect(prExit).toContainText('PR 出口')
  await expect(prExit).toContainText('失败待复盘')

  await expectLocatorTextNotClipped(candidateSource.locator('.sl-autorepair-governance-copy strong'), `${label}:candidate-source-detail`)
  await expectLocatorTextNotClipped(patchGeneration.locator('.sl-autorepair-governance-copy strong'), `${label}:patch-generation-detail`)
  await expectLocatorTextNotClipped(reviewGate.locator('.sl-autorepair-governance-copy strong'), `${label}:review-gate-detail`)
  await expectLocatorTextNotClipped(prExit.locator('.sl-autorepair-governance-copy strong'), `${label}:pr-exit-detail`)
  await expectNoHorizontalOverflow(page, `${label}:governance-loop`)

  const gridColumns = await grid.evaluate(element => {
    const columns = window.getComputedStyle(element).gridTemplateColumns
    return columns.split(' ').filter(Boolean).length
  })
  expect(gridColumns, `${label}:governance loop columns`).toBe(expectedColumns)

  const text = await governance.innerText()
  const fullRepairQualityClaim = [
    '修复质量已验证',
    '自动修复正确性已验证',
    '可保证合入',
    '已验证修复正确',
  ].some(claim => text.includes(claim))
  const llmFactClaim = [
    'LLM 事实正确已验证',
    '回答正确性已验证',
    '模型输出可信',
  ].some(claim => text.includes(claim))
  expect(fullRepairQualityClaim, `${label}:governance loop must not claim repair correctness`).toBe(false)
  expect(llmFactClaim, `${label}:governance loop must not claim LLM fact correctness`).toBe(false)

  return {
    viewport: label,
    expectedColumns,
    gridColumns,
    stepCount: await steps.count(),
    candidateSourceVisible: await candidateSource.isVisible(),
    patchGenerationVisible: await patchGeneration.isVisible(),
    reviewGateVisible: await reviewGate.isVisible(),
    prExitVisible: await prExit.isVisible(),
    noHorizontalOverflow: true,
    fullRepairQualityClaim,
    llmFactClaim,
  }
}

async function expectPrimaryButtonWhiteText(page: Page, buttonName: RegExp | string, label: string) {
  const button = page.getByRole('button', { name: buttonName }).first()
  const color = await button.locator('.sl-action-button-label').evaluate((node) => {
    const style = window.getComputedStyle(node)
    return {
      color: style.color,
      webkitTextFillColor: style.webkitTextFillColor,
    }
  })
  expect(color.color, `${label} text color`).toBe('rgb(255, 255, 255)')
  expect(color.webkitTextFillColor, `${label} text-fill color`).toBe('rgb(255, 255, 255)')
  const labelMetrics = await button.locator('.sl-action-button-label').evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
  }))
  expect(labelMetrics.scrollWidth - labelMetrics.clientWidth, `${label} primary label is clipped`).toBeLessThanOrEqual(2)
  expect(labelMetrics.scrollHeight - labelMetrics.clientHeight, `${label} primary label is clipped vertically`).toBeLessThanOrEqual(2)
  const iconColor = await button.locator('svg').first().evaluate((node) => {
    const style = window.getComputedStyle(node)
    return {
      color: style.color,
      fill: style.fill,
      stroke: style.stroke,
    }
  })
  expect(iconColor.color, `${label} primary icon color`).toBe('rgb(255, 255, 255)')
  expect([iconColor.fill, iconColor.stroke], `${label} primary icon fill/stroke`).toContain('rgb(255, 255, 255)')
}

async function assertLinkedAutoRepairDetailRegion(page: Page, row: Locator, repairId: number) {
  const detailId = `autorepair-detail-${repairId}`
  const titleId = `autorepair-detail-title-${repairId}`
  const detail = page.locator(`#${detailId}`)

  await expect(row).toHaveAttribute('aria-controls', detailId)
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute('role', 'region')
  await expect(detail).toHaveAttribute('aria-labelledby', titleId)
  await expect(page.locator(`#${titleId}`)).toContainText(`任务详情 #${repairId}`)
}

async function assertAutoRepairDetailReadability(page: Page, label: string) {
  const detail = page.locator('.sl-autorepair-detail-card').first()
  const reviewChecklist = detail.getByRole('region', { name: 'PATCH_READY 补丁审查闭环' })
  const sourceBridge = detail.getByRole('region', { name: '来源扫描闭环' })
  const candidateReceipt = detail.getByRole('region', { name: 'Candidate Provenance Receipt' })

  await expectContainedInViewport(detail, `${label}:detail-card`)
  await expectContainedInViewport(sourceBridge, `${label}:source-bridge`)
  await expectContainedInViewport(reviewChecklist, `${label}:review-checklist`)
  await expectContainedInViewport(candidateReceipt, `${label}:candidate-receipt`)
  await expectAutoRepairTableScrollerContained(page, `${label}:table`)
  await assertStablePage(page, `${label}:detail-open`)

  await expectLocatorTextNotClipped(detail.getByText(targetFile).first(), `${label}:target-file`)
  await expectLocatorTextNotClipped(detail.getByText(longTargetDesc).first(), `${label}:target-desc`)
  await expectLocatorTextNotClipped(detail.getByText(longCandidateGateReason).first(), `${label}:candidate-gate-reason`)
  await expectLocatorTextNotClipped(reviewChecklist.getByText(longPatchEvidenceSummary).first(), `${label}:patch-evidence-summary`)
  await expectLocatorTextNotClipped(reviewChecklist.getByText('AUTO_REPAIR_PATCH_READY SUCCESS').first(), `${label}:patch-ready-audit`)
  await expectContainedInViewport(detail.locator('.sl-autorepair-field pre').first(), `${label}:file-path-pre`)
  await expectContainedInViewport(detail.locator('.sl-autorepair-section-title').filter({ hasText: 'Patch Diff 变动对比' }).first(), `${label}:diff-title`)
  await expectContainedInViewport(detail.locator('.sl-autorepair-section-title').filter({ hasText: 'Patch Diff 变动对比' }).locator('xpath=..').locator('pre').first(), `${label}:diff-pre`)
}

async function assertAutoRepairPrConfirmReadability(page: Page, label: string) {
  const popconfirm = page.locator('.sl-autorepair-pr-popconfirm').first()
  await expectContainedInViewport(popconfirm, `${label}:pr-popconfirm`)
  const summary = popconfirm.locator('.sl-autorepair-pr-confirm').first()
  await expectLocatorTextNotClipped(summary.getByText(targetFile).first(), `${label}:pr-confirm-target-file`)
  await expectLocatorTextNotClipped(summary.getByText(longCandidateGateReason).first(), `${label}:pr-confirm-gate-reason`)
  await expectLocatorTextNotClipped(summary.getByText(longPatchEvidenceSummary).first(), `${label}:pr-confirm-patch-evidence`)
}

async function assertPatchReadyLogSafety(page: Page, label: string) {
  const repairDetail = page.locator('.sl-autorepair-detail-card')
  await repairDetail.getByText('补丁生成日志').click()
  await assertAutoRepairLogCollapseReadability(page, label)
  const logViewer = repairDetail.getByLabel('脱敏执行日志').first()
  await expect(logViewer, `${label}:sanitized-log`).toBeVisible()
  await expect(logViewer).toContainText(patchReadyLogSafePrefix)
  await expect(logViewer).toContainText('[REDACTED')
  for (const snippet of patchReadyForbiddenLogSecretSnippets) {
    await expect(repairDetail, `${label}:raw-log-secret:${snippet}`).not.toContainText(snippet)
  }
}

async function assertAutoRepairLogCollapseReadability(page: Page, label: string) {
  const repairDetail = page.locator('.sl-autorepair-detail-card')
  const collapse = repairDetail.locator('.ant-collapse').first()
  await expect(collapse, `${label}:log-collapse-label-before-mutation`).toContainText('补丁生成日志')
  await expectContainedInViewport(collapse, `${label}:log-collapse`)

  const header = collapse.locator('.ant-collapse-header').first()
  const headerText = collapse.locator('.ant-collapse-header-text').first()
  const contentBox = collapse.locator('.ant-collapse-content-box').first()
  await expect(header, `${label}:log-collapse-header`).toBeVisible()
  await expect(contentBox, `${label}:log-collapse-content`).toBeVisible()

  await headerText.evaluate(element => {
    element.textContent = 'auto-repair-log-collapse-header-long-label-must-wrap-without-clipping-or-horizontal-overflow'
  })

  await expectLocatorTextNotClipped(headerText, `${label}:log-collapse-header-text`)
  await expectContainedInViewport(contentBox, `${label}:log-collapse-content-box`)
  await expectNoHorizontalOverflow(page, `${label}:log-collapse-readable`)
}

async function assertPatchReadyDiffSafety(page: Page, label: string) {
  const repairDetail = page.locator('.sl-autorepair-detail-card')
  const diffViewer = repairDetail.getByLabel('脱敏 diff 内容').first()
  await expect(diffViewer, `${label}:sanitized-diff`).toBeVisible()
  await expect(diffViewer).toContainText('Mock LLM response')
  await expect(diffViewer).toContainText('[REDACTED]')
  for (const snippet of patchReadyForbiddenDiffSecretSnippets) {
    await expect(diffViewer, `${label}:raw-diff-secret:${snippet}`).not.toContainText(snippet)
  }
}

async function verifyPatchReadyFlow(page: Page, viewportName: string, expectedGovernanceColumns: number) {
  const network = await installPatchReadyMocks(page)
  await page.goto(`/auto-repairs?projectId=${projectId}&repairId=${repairId}`)
  await expectAutoRepairTableScrollerContained(page, `${viewportName}:initial`)

  const repairDetail = page.locator('.sl-autorepair-detail-card')
  const sourceBridge = repairDetail.getByRole('region', { name: '来源扫描闭环' })
  const patchReadyAlert = repairDetail.locator('.ant-alert').filter({ hasText: '补丁已生成' }).first()
  const reviewChecklist = repairDetail.getByRole('region', { name: 'PATCH_READY 补丁审查闭环' })

  await expect(page.getByText(`任务详情 #${repairId}`)).toBeVisible()
  await assertStablePage(page, `${viewportName}:autorepair-detail`)
  const governanceLoopProof = await assertAutoRepairGovernanceLoop(page, `${viewportName}:autorepair-governance-loop`, expectedGovernanceColumns)
  const targetRow = page.locator('.sl-autorepair-table-card .ant-table-row').filter({ hasText: targetFile }).first()
  const detailAction = targetRow.getByRole('button', { name: `查看自动修复任务 #${repairId} 详情` })
  await expect(targetRow).toHaveAttribute('aria-selected', 'true')
  await assertLinkedAutoRepairDetailRegion(page, targetRow, repairId)
  await expect(detailAction).toBeVisible()
  await repairDetail.getByRole('button', { name: '关闭' }).click()
  await expect(repairDetail).toBeHidden()
  await expect(targetRow).toHaveAttribute('aria-selected', 'false')
  await detailAction.click()
  await expect(page.getByText(`任务详情 #${repairId}`)).toBeVisible()
  await expect(targetRow).toHaveAttribute('aria-selected', 'true')
  await assertLinkedAutoRepairDetailRegion(page, targetRow, repairId)
  await repairDetail.getByRole('button', { name: '关闭' }).click()
  await expect(repairDetail).toBeHidden()
  await targetRow.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText(`任务详情 #${repairId}`)).toBeVisible()
  await expect(targetRow).toHaveAttribute('aria-selected', 'true')
  await assertLinkedAutoRepairDetailRegion(page, targetRow, repairId)
  await repairDetail.getByRole('button', { name: '关闭' }).click()
  await expect(repairDetail).toBeHidden()
  await targetRow.focus()
  await page.keyboard.press('Space')
  await expect(page.getByText(`任务详情 #${repairId}`)).toBeVisible()
  await expect(targetRow).toHaveAttribute('aria-selected', 'true')
  await assertLinkedAutoRepairDetailRegion(page, targetRow, repairId)
  await expect(patchReadyAlert).toBeVisible()
  await assertAutoRepairDetailReadability(page, `${viewportName}:patch-ready-detail`)
  await expect(sourceBridge).toBeVisible()
  await expect(sourceBridge.getByText('Scan Source Bridge')).toBeVisible()
  await expect(sourceBridge.getByText('来源扫描闭环')).toBeVisible()
  await expect(sourceBridge.getByText(`Scan #${scanTaskId}`).first()).toBeVisible()
  await expect(sourceBridge.getByText(targetFile)).toBeVisible()
  await expect(sourceBridge.getByText('回到同次扫描核对证据，再进入补丁审查')).toBeVisible()
  await expect(sourceBridge.getByRole('button', { name: '打开报告' })).toHaveAttribute('data-sl-target-url', `/scan-tasks/${scanTaskId}`)
  const qaTargetUrl = await sourceBridge.getByRole('button', { name: 'QA 复核此文件' }).getAttribute('data-sl-target-url')
  const agentTargetUrl = await sourceBridge.getByRole('button', { name: '创建 Agent 复核' }).getAttribute('data-sl-target-url')
  const auditTargetUrl = await sourceBridge.getByRole('button', { name: '扫描审计' }).getAttribute('data-sl-target-url')
  expect(qaTargetUrl).toBeTruthy()
  expect(agentTargetUrl).toBeTruthy()
  expect(auditTargetUrl).toBeTruthy()
  const qaUrl = new URL(qaTargetUrl || '', 'http://localhost')
  const agentUrl = new URL(agentTargetUrl || '', 'http://localhost')
  const auditUrl = new URL(auditTargetUrl || '', 'http://localhost')
  expect(qaUrl.pathname).toBe(`/projects/${projectId}`)
  expect(qaUrl.searchParams.get('tab')).toBe('qa')
  expect(qaUrl.searchParams.get('scanTaskId')).toBe(String(scanTaskId))
  expect(qaUrl.searchParams.get('question') || '').toContain(targetFile)
  expect(agentUrl.pathname).toBe('/agent-tasks')
  expect(agentUrl.searchParams.get('projectId')).toBe(String(projectId))
  expect(agentUrl.searchParams.get('openCreate')).toBe('1')
  expect(agentUrl.searchParams.get('scanTaskId')).toBe(String(scanTaskId))
  expect(auditUrl.pathname).toBe('/audit-logs')
  expect(auditUrl.searchParams.get('projectId')).toBe(String(projectId))
  expect(auditUrl.searchParams.get('resourceType')).toBe('AUTO_REPAIR')
  expect(auditUrl.searchParams.get('resourceId')).toBe(String(repairId))
  expect(auditUrl.searchParams.get('scanTaskId')).toBe(String(scanTaskId))
  await expect(reviewChecklist).toBeVisible()
  await expect(reviewChecklist.getByText('Patch review checklist')).toBeVisible()
  await expect(reviewChecklist.getByText('创建 PR 前完成四项证据复核')).toBeVisible()
  await expect(reviewChecklist.getByRole('region', { name: 'PR 前复核门禁' })).toBeVisible()
  await expect(reviewChecklist.getByText('允许创建 PR').first()).toBeVisible()
  await expect(reviewChecklist.getByText(`Scan #${scanTaskId}`).first()).toBeVisible()
  await expect(reviewChecklist.getByText('Diff 已生成')).toBeVisible()
  await expect(reviewChecklist.getByText('CHANGE_PATCH 已归档')).toBeVisible()
  await expect(reviewChecklist.getByText(longPatchEvidenceSummary)).toBeVisible()
  await expect(reviewChecklist.getByText('AUTO_REPAIR_PATCH_READY SUCCESS').first()).toBeVisible()
  await expect(page.getByText(targetFile).first()).toBeVisible()
  await expect(reviewChecklist.getByRole('button', { name: `查看 AUTO_REPAIR #${repairId} 产物` })).toBeVisible()
  await expect(reviewChecklist.getByText('查看补丁')).toBeVisible()
  await expect(patchReadyAlert.getByRole('button', { name: `查看 AUTO_REPAIR #${repairId} 产物` })).toBeVisible()
  await expect(patchReadyAlert.getByText('查看补丁产物')).toBeVisible()
  await expect(reviewChecklist.getByRole('button', { name: '查看任务' })).toBeVisible()
  await expect(reviewChecklist.getByRole('button', { name: '打开审计' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^创建 PR$/ })).toBeVisible()
  await expectPrimaryButtonWhiteText(page, /^创建 PR$/, `${viewportName}:create-pr-primary`)
  await expect(page.getByText('Patch generation attempt', { exact: true })).toBeVisible()
  await expect(page.getByText('PR submission attempt', { exact: true })).toBeVisible()
  await expect(page.getByText('第 1 次 · Patch generation')).toBeVisible()
  await expect(page.getByText('第 2 次 · PR submission')).toBeVisible()
  await expect(page.getByText('第 1 次 · prepare_workspace').first()).toBeVisible()
  await expect(page.getByText('第 1 次 · generate_patch').first()).toBeVisible()
  await expect(page.getByText('第 2 次 · create_branch').first()).toBeVisible()
  await expect(page.getByText('第 2 次 · push_branch').first()).toBeVisible()
  await expect(page.getByText('第 2 次 · create_pull_request').first()).toBeVisible()
  await expect(page.getByText('补丁证据仍可复用')).toBeVisible()
  await expect(page.getByText('Mock LLM response')).toBeVisible()
  await assertPatchReadyDiffSafety(page, `${viewportName}:patch-ready-diff-safety`)
  await assertPatchReadyLogSafety(page, `${viewportName}:patch-ready-log-safety`)

  expect(network.getDetailFallbackCount(), 'AutoRepair detail fallback was not used when list response omitted repair #101.').toBeGreaterThanOrEqual(1)

  await page.getByRole('button', { name: /^创建 PR$/ }).click()
  await expect(page.getByText('创建受控 Pull Request？')).toBeVisible()
  const prConfirmSummary = page.locator('.sl-autorepair-pr-confirm')
  await expect(prConfirmSummary.getByText('Diff：')).toBeVisible()
  await expect(prConfirmSummary.getByText('候选凭证：')).toBeVisible()
  await expect(prConfirmSummary.getByText('PROJECT_QA_VERIFIED_CITATION / READY')).toBeVisible()
  await expect(prConfirmSummary.getByText('候选门禁来源：')).toBeVisible()
  await expect(prConfirmSummary.getByText('SERVER_DERIVED')).toBeVisible()
  await expect(prConfirmSummary.getByText(longCandidateGateReason)).toBeVisible()
  await expect(prConfirmSummary.getByText('CHANGE_PATCH 已归档')).toBeVisible()
  await expect(prConfirmSummary.getByText(longPatchEvidenceSummary)).toBeVisible()
  await expect(prConfirmSummary.getByText('AUTO_REPAIR_PATCH_READY SUCCESS')).toBeVisible()
  await assertAutoRepairPrConfirmReadability(page, `${viewportName}:pr-confirm`)
  await assertStablePage(page, `${viewportName}:pr-popconfirm`)
  expect(network.getSubmitPrCount(), 'PR submit endpoint was called before Popconfirm confirmation.').toBe(0)
  await page.getByRole('button', { name: '返回审查' }).click()
  await expect(page.getByText('创建受控 Pull Request？')).toBeHidden()
  expect(network.getSubmitPrCount(), 'PR submit endpoint was called after cancelling Popconfirm.').toBe(0)

  await page.getByRole('button', { name: '打开审计' }).click()

  await expect(page.getByRole('tab', { name: '通用审计' })).toHaveAttribute('aria-selected', 'true')
  await assertStablePage(page, `${viewportName}:audit-deep-link`)
  await expect(page.getByText('AUTO_REPAIR_PATCH_READY').first()).toBeVisible()
  await expect(page.getByText(`AUTO_REPAIR #${repairId}`).first()).toBeVisible()
  await expect(page.getByText('Audit Event')).toBeVisible()
  const auditDrawer = page.locator('.sl-audit-drawer-stack').first()
  await auditDrawer.locator('.sl-audit-json-block summary').filter({ hasText: 'Sanitized Input' }).click()
  const sanitizedInputJson = auditDrawer.locator('.sl-audit-json-block').filter({ hasText: 'Sanitized Input' }).locator('pre')
  await expect(sanitizedInputJson).toContainText(`"scanTaskId": ${scanTaskId}`)
  await expect(sanitizedInputJson).toContainText(`"patchArtifactPath": "${patchArtifactPath}"`)

  const latestAuditQuery = network.auditQueries.at(-1) || ''
  expect(latestAuditQuery, 'Audit deep link did not request AUTO_REPAIR resourceType.').toContain('resourceType=AUTO_REPAIR')
  expect(latestAuditQuery, 'Audit deep link did not request resourceId=101.').toContain(`resourceId=${repairId}`)
  expect(latestAuditQuery, 'Audit deep link did not request AUTO_REPAIR_PATCH_READY action.').toContain('action=AUTO_REPAIR_PATCH_READY')
  expect(latestAuditQuery, 'Audit deep link did not request SUCCESS status.').toContain('status=SUCCESS')

  await page.getByRole('button', { name: /打开关联资源/ }).click()
  await expect(page).toHaveURL(new RegExp(`/auto-repairs\\?projectId=${projectId}&repairId=${repairId}$`))
  await assertStablePage(page, `${viewportName}:audit-resource-return`)
  await expect(page.getByText(`任务详情 #${repairId}`)).toBeVisible()
  await expect(patchReadyAlert).toBeVisible()

  expect(network.getSubmitPrCount(), 'Mock submit-pr should not be called in this smoke.').toBe(0)
  expect(network.unhandledApiRequests, `Unhandled /api requests must be mocked: ${network.unhandledApiRequests.join(', ')}`).toEqual([])

  return {
    ...network,
    logSafetyProof: {
      viewport: viewportName,
      rawSecretsHidden: true,
      redactionVisible: true,
      sanitizedLogVisible: true,
    },
    patchDiffSafetyProof: {
      viewport: viewportName,
      rawSecretsHidden: true,
      redactionVisible: true,
      sanitizedDiffVisible: true,
    },
    governanceLoopProof,
  }
}

async function verifyBlockedPatchReadyGate(page: Page, viewportName: string) {
  const network = await installPatchReadyMocks(page)
  await page.goto(`/auto-repairs?projectId=${projectId}&repairId=${blockedRepairId}`)
  await expectAutoRepairTableScrollerContained(page, `${viewportName}:blocked-initial`)

  const repairDetail = page.locator('.sl-autorepair-detail-card')
  const reviewChecklist = repairDetail.getByRole('region', { name: 'PATCH_READY 补丁审查闭环' })
  const sourceBridge = repairDetail.getByRole('region', { name: '来源扫描闭环' })
  const gate = reviewChecklist.getByRole('region', { name: 'PR 前复核门禁' })

  await expect(page.getByText(`任务详情 #${blockedRepairId}`)).toBeVisible()
  const blockedRow = page.locator('.sl-autorepair-table-card .ant-table-row').filter({ hasText: blockedTargetFile }).first()
  await expect(blockedRow).toHaveAttribute('aria-selected', 'true')
  await assertLinkedAutoRepairDetailRegion(page, blockedRow, blockedRepairId)
  await assertStablePage(page, `${viewportName}:blocked-autorepair-detail`)
  await expect(sourceBridge).toBeVisible()
  await expect(sourceBridge.getByText('未绑定扫描来源')).toBeVisible()
  await expect(sourceBridge.getByText('PR 门禁不把 scanTask 作为硬阻塞')).toBeVisible()
  await expect(sourceBridge.getByRole('button', { name: '打开报告' })).toHaveCount(0)
  await expect(sourceBridge.getByRole('button', { name: '扫描审计' })).toHaveCount(0)
  await expect(reviewChecklist).toBeVisible()
  await expectContainedInViewport(repairDetail, `${viewportName}:blocked-detail-card`)
  await expectContainedInViewport(reviewChecklist, `${viewportName}:blocked-review-checklist`)
  await expectLocatorTextNotClipped(repairDetail.getByText(blockedTargetFile).first(), `${viewportName}:blocked-target-file`)
  await expect(gate).toBeVisible()
  await expect(reviewChecklist.getByText('人工候选')).toBeVisible()
  await expect(reviewChecklist.getByText('缺少可审查 diff', { exact: true })).toBeVisible()
  await expect(reviewChecklist.getByText('缺少 patch artifact', { exact: true })).toBeVisible()
  await expect(reviewChecklist.getByText('缺少 generate_patch SUCCESS patch evidence', { exact: true })).toBeVisible()
  await expect(reviewChecklist.getByText('缺少 AUTO_REPAIR_PATCH_READY SUCCESS', { exact: true })).toBeVisible()
  await expect(gate.getByText('4 个阻塞项')).toBeVisible()

  const blockedCreatePr = page.getByRole('button', { name: '创建 PR（复核未通过）' })
  await expect(blockedCreatePr).toBeVisible()
  await expect(blockedCreatePr).toBeDisabled()
  await blockedCreatePr.click({ force: true })
  await expect(page.getByText('创建受控 Pull Request？')).toHaveCount(0)
  expect(network.getSubmitPrCount(), 'Blocked PATCH_READY repair must not call submit-pr.').toBe(0)
  expect(network.unhandledApiRequests, `Unhandled /api requests must be mocked: ${network.unhandledApiRequests.join(', ')}`).toEqual([])

  return network
}

test('PATCH_READY AutoRepair and audit deep links run without touching real APIs', async ({ page }) => {
  const issues = installRuntimeGuards(page)
  const detailFallbackCounts: number[] = []
  const logSafetyProofs: Array<{ viewport: string; rawSecretsHidden: boolean; redactionVisible: boolean; sanitizedLogVisible: boolean }> = []
  const patchDiffSafetyProofs: Array<{ viewport: string; rawSecretsHidden: boolean; redactionVisible: boolean; sanitizedDiffVisible: boolean }> = []
  const governanceLoopProofs: AutoRepairGovernanceLoopProof[] = []
  let missingEvidenceBlocked = false

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const expectedGovernanceColumns = viewport.width <= 720 ? 1 : viewport.width <= 1200 ? 2 : 4
    const network = await verifyPatchReadyFlow(page, viewport.name, expectedGovernanceColumns)
    detailFallbackCounts.push(network.getDetailFallbackCount())
    logSafetyProofs.push(network.logSafetyProof)
    patchDiffSafetyProofs.push(network.patchDiffSafetyProof)
    governanceLoopProofs.push(network.governanceLoopProof)
    await verifyBlockedPatchReadyGate(page, viewport.name)
    missingEvidenceBlocked = true
  }

  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const markerPayload = {
    projectId,
    repairId,
    scanTaskId,
    executionTaskId,
    auditLogId,
    targetFile,
    patchArtifactPath,
    detailFallbackCount: Math.max(...detailFallbackCounts),
    submitPrCount: 0,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    mockedApiOnly: true,
    auditDeepLink: true,
    prConfirmCancelled: true,
    tableDetailAction: {
      visible: true,
      clickedRepairId: repairId,
      detailPanelMatched: true,
      keyboardOpen: { enter: true, space: true },
      accessibleSelection: true,
    },
    sharedSelectableRow: {
      ariaControlsLinked: true,
      detailRegionLinked: true,
      selectedRepairIds: [repairId, blockedRepairId],
    },
    layoutDensity: {
      mobile390Covered: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`).includes('390x844'),
      narrow320Covered: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`).includes('320x740'),
      detailCardContained: true,
      reviewChecklistContained: true,
      sourceBridgeContained: true,
      tableScrollerContained: true,
      logCollapseContained: true,
      prPopconfirmContained: true,
      noHorizontalOverflow: true,
    },
    mobileReadability: {
      criticalTextsWrap: true,
      targetFileNotClipped: true,
      reviewGateTextNotClipped: true,
      candidateReceiptTextNotClipped: true,
      prConfirmTextNotClipped: true,
      logCollapseHeaderNotClipped: true,
      primaryButtonLabelNotClipped: true,
      primaryButtonLabelIconSvgWhite: true,
    },
    tableScroller: {
      containedInViewport: true,
      overflowXAuto: true,
    },
    logSafety: {
      scope: 'LOG_VIEWER_DISPLAY_REDACTION_ONLY',
      fixtureHasBearerSecret: true,
      fixtureHasApiKeySecret: true,
      fixtureHasPasswordSecret: true,
      fixtureHasQuotedSecret: true,
      fixtureHasJwtSecret: true,
      rawSecretsHidden: logSafetyProofs.every(proof => proof.rawSecretsHidden),
      redactionVisible: logSafetyProofs.every(proof => proof.redactionVisible),
      sanitizedLogVisible: logSafetyProofs.every(proof => proof.sanitizedLogVisible),
      markerContainsRawSecret: false,
    },
    patchDiffSafety: {
      scope: 'DIFF_VIEWER_DISPLAY_REDACTION_ONLY',
      fixtureHasRawSecretSentinel: true,
      fixtureHasAuthorizationBearerSecret: true,
      fixtureHasTokenSecret: true,
      fixtureHasApiKeySecret: true,
      fixtureHasSecretPasswordPrivateKeySecret: true,
      fixtureHasAccessRefreshTokenSecret: true,
      fixtureHasSkSecret: true,
      fixtureHasJwtSecret: true,
      rawSecretsHidden: patchDiffSafetyProofs.every(proof => proof.rawSecretsHidden),
      redactionVisible: patchDiffSafetyProofs.every(proof => proof.redactionVisible),
      sanitizedDiffVisible: patchDiffSafetyProofs.every(proof => proof.sanitizedDiffVisible),
      markerContainsRawSecret: false,
    },
    executionDetailGuard: {
      selectedDetailSourceBound: true,
      staleExecutionDetailRejected: true,
    },
    scanSourceBridge: {
      visible: true,
      scanTaskId,
      scanReportUrl: `/scan-tasks/${scanTaskId}`,
      qaDeepLinkBound: true,
      agentTaskDraftBound: true,
      auditDeepLinkBound: true,
      targetFileExplained: true,
      missingScanFallbackVisible: true,
    },
    reviewGate: {
      requiredEvidence: ['diff', 'patchArtifact', 'patchGenerationStep', 'auditEvent'],
      blockingEvidenceSatisfied: true,
      missingEvidenceBlocked,
      manualCandidateScanTaskWarningOnly: true,
      popconfirmSummaryVisible: true,
    },
    autoRepairGovernanceLoop: {
      scope: 'AUTOREPAIRS_GOVERNANCE_LOOP_READABILITY',
      surface: 'CANDIDATE_SOURCE_PATCH_GENERATION_REVIEW_GATE_PR_EXIT',
      visible: governanceLoopProofs.length === viewportMatrix.length,
      stepCount: governanceLoopProofs.every(proof => proof.stepCount === 4) ? 4 : 0,
      expectedColumnsHonored: governanceLoopProofs.every(proof => proof.gridColumns === proof.expectedColumns),
      desktopColumns: governanceLoopProofs.some(proof => proof.viewport.includes('desktop') && proof.gridColumns === 4),
      tabletColumns: governanceLoopProofs.some(proof => proof.viewport.includes('tablet') && proof.gridColumns === 2),
      twoColumnBreakpoint: governanceLoopProofs.some(proof => proof.expectedColumns === 2 && proof.gridColumns === 2),
      mobileColumns: governanceLoopProofs
        .filter(proof => proof.expectedColumns === 1)
        .every(proof => proof.gridColumns === 1),
      candidateSourceVisible: governanceLoopProofs.every(proof => proof.candidateSourceVisible),
      patchGenerationVisible: governanceLoopProofs.every(proof => proof.patchGenerationVisible),
      reviewGateVisible: governanceLoopProofs.every(proof => proof.reviewGateVisible),
      prExitVisible: governanceLoopProofs.every(proof => proof.prExitVisible),
      fullRepairQualityClaim: governanceLoopProofs.some(proof => proof.fullRepairQualityClaim),
      llmFactClaim: governanceLoopProofs.some(proof => proof.llmFactClaim),
      noHorizontalOverflow: governanceLoopProofs.every(proof => proof.noHorizontalOverflow),
    },
    prConfirmCandidateGate: {
      sourceType: 'PROJECT_QA_VERIFIED_CITATION',
      repairEvidenceGate: 'READY',
      repairEvidenceGateSource: 'SERVER_DERIVED',
      visible: true,
      warningOnlyForPatchReady: true,
    },
    attemptSplit: {
      prExecutionAttemptSplit: true,
      attemptIds: [1, 2],
      attemptNos: [1, 2],
      patchAttemptStepKeys: ['prepare_workspace', 'generate_patch'],
      prAttemptStepKeys: ['create_branch', 'push_branch', 'create_pull_request'],
      patchEvidenceFromStep: true,
      prFailureDoesNotBlockPatchEvidence: true,
    },
    runtimeIssues: 0,
    noHorizontalOverflow: true,
    spec: 'patch-ready-smoke.spec.ts',
    baseURLHost: new URL(page.url()).hostname,
  }
  const markerText = JSON.stringify(markerPayload)
  for (const snippet of patchReadyForbiddenLogSecretSnippets) {
    expect(markerText, `PATCH_READY marker must not contain raw log secret snippet: ${snippet}`).not.toContain(snippet)
  }
  for (const snippet of patchReadyForbiddenDiffSecretSnippets) {
    expect(markerText, `PATCH_READY marker must not contain raw diff secret sentinel: ${snippet}`).not.toContain(snippet)
  }
  console.log(`PATCH_READY_UI_SMOKE_OK ${markerText}`)
})
