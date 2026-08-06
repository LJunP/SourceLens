import fs from 'node:fs'
import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type RuntimeIssue = {
  type: string
  message: string
}

const projectId = 1
const targetIssueId = 2101
const failedIssueId = 2102
const targetTaskId = 4101
const issueRawSecretSentinel = 'ISSUE_DECOMPOSITION_RAW_SECRET_SHOULD_NOT_RENDER'
const issueBearerSecret = 'issue-decomposition-bearer-secret-raw'
const issueApiKeySecret = 'sk-issuedecompositionrawsecret1234567890'
const issueJwtSecret = 'eyJhbGciOiJIUzI1NiJ9.eyJzbF9pc3N1ZV9kZWNvbXBvc2l0aW9uIjoicmF3In0.signatureRawSecret123'
const forbiddenIssueSecretSnippets = [
  issueRawSecretSentinel,
  issueBearerSecret,
  issueApiKeySecret,
  issueJwtSecret,
]

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const project = {
  id: projectId,
  name: 'Issue Decomposition Smoke Project',
  description: 'Mocked project for Issue decomposition detail selection smoke',
  primaryLanguage: 'Java',
  framework: 'Spring Boot',
  status: 'ACTIVE',
  healthScore: 90,
  createdBy: 1,
  createdAt: '2026-07-01T13:00:00Z',
}

const decompositions = [
  {
    id: targetIssueId,
    projectId,
    scanTaskId: 901,
    title: 'Add repository report export',
    description: 'Allow users to export architecture report and evidence summary.',
    businessContext: 'Operators need offline review artifacts.',
    priority: 'HIGH',
    relatedModules: JSON.stringify(['report', 'artifact']),
    status: 'COMPLETED',
    understanding: 'Export should preserve report evidence and scan context.',
    impactModules: JSON.stringify(['report-service', 'artifact-store']),
    impactApis: JSON.stringify(['/api/reports/{id}/export', '/api/artifacts/{id}/download']),
    impactDb: JSON.stringify(['analysis_artifacts']),
    risks: JSON.stringify(['Large reports may timeout', 'Evidence links can become stale']),
    dependencies: JSON.stringify(['artifact storage permission']),
    acceptance: JSON.stringify(['Export includes report title', 'Export includes evidence list', 'Download is audited']),
    suggestedBranch: 'feature/report-export',
    suggestedCommit: 'feat(report): export architecture evidence',
    outputJson: JSON.stringify({
      plan: 'export report with evidence',
      acceptanceCount: 3,
      authorization: `Bearer ${issueBearerSecret}`,
      apiKey: issueApiKeySecret,
      nested: {
        password: issueRawSecretSentinel,
        jwt: issueJwtSecret,
      },
      notes: `token=${issueRawSecretSentinel}`,
    }),
    errorMessage: null,
    createdBy: 1,
    createdAt: '2026-07-01T13:10:00Z',
    updatedAt: '2026-07-01T13:12:00Z',
  },
  {
    id: failedIssueId,
    projectId,
    scanTaskId: 902,
    title: 'Rewrite unclear automation',
    description: 'Need automation but scope is unclear.',
    businessContext: null,
    priority: 'MEDIUM',
    relatedModules: null,
    status: 'FAILED',
    understanding: null,
    impactModules: null,
    impactApis: null,
    impactDb: null,
    risks: null,
    dependencies: null,
    acceptance: null,
    suggestedBranch: null,
    suggestedCommit: null,
    outputJson: null,
    errorMessage: '需求描述过于宽泛，无法生成可执行拆解。',
    createdBy: 1,
    createdAt: '2026-07-01T13:13:00Z',
    updatedAt: '2026-07-01T13:14:00Z',
  },
]

const targetTasks = [
  {
    id: targetTaskId,
    decompositionId: targetIssueId,
    taskOrder: 1,
    category: 'DEVELOP',
    title: 'Implement report export endpoint',
    description: 'Create export endpoint and bind artifact metadata.',
    impactFiles: JSON.stringify(['backend-spring/src/main/java/demo/ReportExportController.java']),
    riskLevel: 'HIGH',
    testSuggestions: JSON.stringify(['Controller export smoke', 'Artifact permission regression']),
    estimatedHours: 4,
    status: 'TODO',
    createdAt: '2026-07-01T13:15:00Z',
  },
]

const markdownByIssue = new Map([
  [targetIssueId, [
    '# Add repository report export',
    '',
    '- Export includes report title',
    '- Download is audited',
    `- Authorization: Bearer ${issueBearerSecret}`,
    `- apiKey=${issueApiKeySecret}`,
    `- password="${issueRawSecretSentinel}"`,
    `- jwt=${issueJwtSecret}`,
    '',
  ].join('\n')],
  [failedIssueId, '# Rewrite unclear automation\n\nFAILED\n'],
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

async function installIssueMocks(page: Page) {
  const unhandledApiRequests: string[] = []
  const taskRequests: number[] = []
  const exportRequests: number[] = []
  const statusUpdates: Array<{ taskId: number; status: string }> = []
  let delayNextTargetTaskRequest = false
  let delayedTargetTaskRoute: Route | null = null
  let delayedTargetTaskRequests = 0
  let releasedDelayedTargetTaskResponses = 0

  await page.unroute('**/api/**').catch(() => {})
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'issue-decomposition-detail-selection-smoke-token')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          window.localStorage.setItem('issue-decomposition-copied-markdown', value)
        },
      },
    })
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
      await fulfillJson(route, result({ id: 1, username: 'issue_decomposition_smoke_user', email: 'issue-decomposition@local.test' }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      await fulfillJson(route, result({ items: [project], page: 1, pageSize: 100, total: 1 }))
      return
    }

    if (method === 'GET' && path === `/api/projects/${projectId}/issue-decompositions`) {
      await fulfillJson(route, result({ items: decompositions, page: 1, pageSize: 20, total: decompositions.length }))
      return
    }

    const tasksMatch = path.match(/^\/api\/issue-decompositions\/(\d+)\/tasks$/)
    if (method === 'GET' && tasksMatch) {
      const issueId = Number(tasksMatch[1])
      taskRequests.push(issueId)
      if (issueId === targetIssueId && delayNextTargetTaskRequest) {
        delayNextTargetTaskRequest = false
        delayedTargetTaskRequests += 1
        delayedTargetTaskRoute = route
        return
      }
      await fulfillJson(route, result(issueId === targetIssueId ? targetTasks : []))
      return
    }

    const exportMatch = path.match(/^\/api\/issue-decompositions\/(\d+)\/export\/markdown$/)
    if (method === 'GET' && exportMatch) {
      const issueId = Number(exportMatch[1])
      exportRequests.push(issueId)
      await fulfillJson(route, result(markdownByIssue.get(issueId) || '# Empty\n'))
      return
    }

    const statusMatch = path.match(/^\/api\/issue-tasks\/(\d+)$/)
    if (method === 'PATCH' && statusMatch) {
      const taskId = Number(statusMatch[1])
      const status = url.searchParams.get('status') || 'TODO'
      statusUpdates.push({ taskId, status })
      const task = targetTasks.find(item => item.id === taskId) || targetTasks[0]
      await fulfillJson(route, result({ ...task, status }))
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
    taskRequests,
    exportRequests,
    statusUpdates,
    delayNextTargetTaskRequest: () => {
      delayNextTargetTaskRequest = true
    },
    releaseDelayedTargetTasks: async () => {
      if (!delayedTargetTaskRoute) throw new Error('No delayed target task response is waiting to be released.')
      const route = delayedTargetTaskRoute
      delayedTargetTaskRoute = null
      releasedDelayedTargetTaskResponses += 1
      await fulfillJson(route, result(targetTasks))
    },
    get delayedTargetTaskRequests() {
      return delayedTargetTaskRequests
    },
    get releasedDelayedTargetTaskResponses() {
      return releasedDelayedTargetTaskResponses
    },
  }
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
      y: rect.y,
      width: rect.width,
      height: rect.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    }
  })
  expect(layout.x, `${label} must not overflow left`).toBeGreaterThanOrEqual(-1)
  expect(layout.x + layout.width, `${label} must not overflow right: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.innerWidth + 1)
}

async function expectIssueTableScrollerContained(page: Page, tableSelector: string, label: string) {
  await expectContainedInViewport(page, tableSelector, `${label}:table`)
  const tableContent = page.locator(`${tableSelector} .ant-table-content`).first()
  await expect(tableContent, `${label}:table-scroller`).toBeVisible()
  const overflowX = await tableContent.evaluate(element => window.getComputedStyle(element).overflowX)
  expect(['auto', 'scroll'].includes(overflowX), `${label}: table content must own horizontal overflow, got ${overflowX}`).toBe(true)
  await expectNoHorizontalOverflow(page, `${label}:table-scroller`)
}

async function expectLocatorTextNotClipped(locator: Locator, label: string) {
  const metrics = await locator.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    text: element.textContent,
  }))
  expect(metrics.scrollWidth, `${label}: text must not be clipped horizontally: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.clientWidth + 2)
  expect(metrics.scrollHeight, `${label}: text must not be clipped vertically: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.clientHeight + 2)
}

async function expectIssueGovernanceLoop(page: Page, viewportName: string) {
  const loop = page.locator('.sl-issue-governance-loop')
  await expect(loop, `${viewportName}:issue-governance-loop`).toBeVisible()
  await expect(loop).toContainText('Issue 拆解治理闭环')
  for (const text of ['需求输入', '任务拆解', '验收门禁', '执行交接']) {
    await expect(loop, `${viewportName}:governance-stage-${text}`).toContainText(text)
  }
  await expect(loop).toContainText('拆解结果只能作为开发计划证据')
  await expect(loop).toContainText('不能证明实现、测试、CI、PR 或 LLM 判断已经正确')
  const steps = loop.locator('.sl-issue-governance-step')
  await expect(steps, `${viewportName}:issue-governance-step-count`).toHaveCount(4)
  const columnCount = await steps.evaluateAll(elements => {
    const rowTops = elements.map(element => Math.round(element.getBoundingClientRect().top))
    const firstRowTop = rowTops[0]
    return rowTops.filter(top => Math.abs(top - firstRowTop) <= 2).length
  })
  const expectedColumns = viewportName === 'desktop' ? 4 : viewportName === 'tablet' ? 2 : 1
  expect(columnCount, `${viewportName}: issue governance grid column count`).toBe(expectedColumns)
  const readableTargets = loop.locator('.sl-issue-governance-head h2, .sl-issue-governance-head p, .sl-issue-governance-meta strong, .sl-issue-governance-copy h3, .sl-issue-governance-copy p')
  const readableCount = await readableTargets.count()
  for (let index = 0; index < readableCount; index += 1) {
    await expectLocatorTextNotClipped(readableTargets.nth(index), `${viewportName}:issue-governance-readable-${index}`)
  }
  const blockedClaims = ['拆解已经实现完成', '任务正确已证明', 'LLM 判断已经完全正确', 'LLM 事实正确已证明', '测试已经完成且无需复核', 'PR 审查已经完成且无需复核']
  const bodyText = await page.locator('body').innerText()
  for (const claim of blockedClaims) {
    expect(bodyText, `${viewportName}: issue governance must not overclaim ${claim}`).not.toContain(claim)
  }
  await expectNoHorizontalOverflow(page, `${viewportName}:issue-governance-loop`)
  return {
    viewport: viewportName,
    columns: columnCount,
    stepCount: 4,
    readable: true,
    fullImplementationClaim: false,
    llmFactClaim: false,
  }
}

async function rowFor(page: Page, label: RegExp) {
  const row = page.getByRole('row', { name: label })
  await row.scrollIntoViewIfNeeded()
  return row
}

async function closeDetail(page: Page) {
  await page.locator('.sl-issue-detail-card').getByRole('button', { name: '关闭' }).click()
  await expect(page.locator('.sl-issue-detail-card')).toHaveCount(0)
}

async function assertIssueRawResultRedaction(page: Page, label: string) {
  const preview = page.getByLabel('脱敏 Issue 拆解原始结果')
  await expect(preview, `${label}:redacted-source-preview`).toBeVisible()
  await expect(preview, `${label}:redaction-visible`).toContainText('[REDACTED]')
  await expect(preview, `${label}:safe-context-visible`).toContainText('export report with evidence')
  for (const secret of forbiddenIssueSecretSnippets) {
    await expect(preview, `${label}:preview-hides-${secret}`).not.toContainText(secret)
    await expect(page.locator('body'), `${label}:body-hides-${secret}`).not.toContainText(secret)
  }
  return {
    previewRedactionVisible: true,
    previewRawSecretsHidden: true,
    bodyRawSecretsHidden: true,
  }
}

test('Issue decomposition detail selection is accessible and action-isolated', async ({ page, baseURL }) => {
  const issues = installRuntimeGuards(page)
  const network = await installIssueMocks(page)
  const visitedViewports: string[] = []
  const redactionProofs: Array<Awaited<ReturnType<typeof assertIssueRawResultRedaction>>> = []
  const copyExportProofs: Array<{ copyRedacted: boolean; downloadRedacted: boolean; markerContainsRawSecret: boolean }> = []
  const governanceProofs: Array<Awaited<ReturnType<typeof expectIssueGovernanceLoop>>> = []
  const staleTaskGuardProofs: Array<{
    delayedResponseReleased: boolean
    failedIssueRemainedSelected: boolean
    staleTargetTasksRejected: boolean
    failedIssueTaskCountStayedZero: boolean
  }> = []
  const baseURLHost = new URL(baseURL || 'http://127.0.0.1').hostname

  for (const viewport of viewportMatrix) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(`/issue-decomposition?projectId=${projectId}`)
    await expect(page.getByRole('heading', { name: 'Issue 拆解与交付计划' })).toBeVisible()
    await expectIssueTableScrollerContained(page, '.sl-issue-main-table', `issue-decomposition:${viewport.name}:main-table`)

    const targetRow = await rowFor(page, new RegExp(`IssueDecomposition #${targetIssueId}`))
    const failedRow = await rowFor(page, new RegExp(`IssueDecomposition #${failedIssueId}`))
    const targetTitleAction = targetRow.getByRole('button', { name: 'Add repository report export' })
    await expect(targetTitleAction).toBeVisible()
    await targetTitleAction.click()
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(targetRow).toHaveAttribute('aria-controls', `issue-decomposition-detail-${targetIssueId}`)
    governanceProofs.push(await expectIssueGovernanceLoop(page, viewport.name))
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Add repository report export')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('计划已具备执行条件')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Export should preserve report evidence')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('report-service')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Export includes evidence list')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Evidence links can become stale')

    await page.getByRole('tab', { name: /子任务/ }).dispatchEvent('click')
    await expect(page.getByRole('tab', { name: /子任务/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Implement report export endpoint')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Controller export smoke')
    await expectIssueTableScrollerContained(page, '.sl-issue-task-table', `issue-decomposition:${viewport.name}:task-table`)
    await page.locator('.sl-issue-detail-card .ant-select-selector').first().click()
    await page.getByTitle('进行中').click()
    await expect(network.statusUpdates).toContainEqual({ taskId: targetTaskId, status: 'IN_PROGRESS' })
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')

    await page.getByRole('tab', { name: '原始结果' }).dispatchEvent('click')
    await expect(page.getByRole('tab', { name: '原始结果' })).toHaveAttribute('aria-selected', 'true')
    redactionProofs.push(await assertIssueRawResultRedaction(page, `issue-decomposition:${viewport.name}:raw-result`))
    await page.locator('.sl-issue-detail-card').getByRole('button', { name: '复制 Markdown' }).click()
    const copied = await page.evaluate(() => window.localStorage.getItem('issue-decomposition-copied-markdown'))
    expect(copied).toContain('Export includes report title')
    expect(copied).toContain('[REDACTED]')
    for (const secret of forbiddenIssueSecretSnippets) {
      expect(copied, `${viewport.name}:copied markdown must hide ${secret}`).not.toContain(secret)
    }
    const downloadPromise = page.waitForEvent('download')
    await page.locator('.sl-issue-detail-card').getByRole('button', { name: '导出 .md' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(`issue-decomposition-${targetIssueId}.md`)
    const downloadPath = await download.path()
    expect(downloadPath, `${viewport.name}:download path must be available for local smoke`).toBeTruthy()
    const downloadedMarkdown = fs.readFileSync(String(downloadPath), 'utf8')
    expect(downloadedMarkdown).toContain('Export includes report title')
    expect(downloadedMarkdown).toContain('[REDACTED]')
    for (const secret of forbiddenIssueSecretSnippets) {
      expect(downloadedMarkdown, `${viewport.name}:downloaded markdown must hide ${secret}`).not.toContain(secret)
    }
    const proofMarker = JSON.stringify({
      copied,
      downloadedMarkdown,
    })
    copyExportProofs.push({
      copyRedacted: copied.includes('[REDACTED]') && forbiddenIssueSecretSnippets.every(secret => !copied.includes(secret)),
      downloadRedacted: downloadedMarkdown.includes('[REDACTED]') && forbiddenIssueSecretSnippets.every(secret => !downloadedMarkdown.includes(secret)),
      markerContainsRawSecret: forbiddenIssueSecretSnippets.some(secret => proofMarker.includes(secret)),
    })
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await closeDetail(page)

    await targetRow.focus()
    await page.keyboard.press('Enter')
    await expect(targetRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('计划已具备执行条件')
    await closeDetail(page)

    await failedRow.focus()
    await page.keyboard.press('Space')
    await expect(failedRow).toHaveAttribute('aria-selected', 'true')
    await expect(targetRow).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Rewrite unclear automation')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('拆解失败，需要重新提交')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('需求描述过于宽泛')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('子任务')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('0')
    await expect(page.locator('.sl-issue-detail-card')).not.toContainText('Implement report export endpoint')

    const targetCopy = targetRow.getByRole('button', { name: `复制 Issue 拆解 #${targetIssueId} Markdown` })
    await targetCopy.click()
    await expect(failedRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Rewrite unclear automation')

    const delayedRequestCountBefore = network.delayedTargetTaskRequests
    const releasedDelayedTaskCountBefore = network.releasedDelayedTargetTaskResponses
    network.delayNextTargetTaskRequest()
    await targetTitleAction.click()
    await expect.poll(() => network.delayedTargetTaskRequests, {
      message: `${viewport.name}: completed issue tasks request should be delayed before switching issue`,
    }).toBeGreaterThan(delayedRequestCountBefore)
    await failedRow.focus()
    await page.keyboard.press('Space')
    await expect(failedRow).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('Rewrite unclear automation')
    await network.releaseDelayedTargetTasks()
    await expect.poll(() => network.releasedDelayedTargetTaskResponses, {
      message: `${viewport.name}: delayed completed issue task response should be released after failed issue selection`,
    }).toBeGreaterThan(releasedDelayedTaskCountBefore)
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
    await page.getByRole('tab', { name: /子任务/ }).dispatchEvent('click')
    await expect(page.getByRole('tab', { name: /子任务/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.sl-issue-detail-card')).toContainText('0')
    await expect(page.locator('.sl-issue-detail-card')).not.toContainText('Implement report export endpoint')
    staleTaskGuardProofs.push({
      delayedResponseReleased: true,
      failedIssueRemainedSelected: await failedRow.getAttribute('aria-selected') === 'true',
      staleTargetTasksRejected: !(await page.locator('.sl-issue-detail-card').textContent() || '').includes('Implement report export endpoint'),
      failedIssueTaskCountStayedZero: (await page.locator('.sl-issue-detail-card').textContent() || '').includes('0'),
    })

    await expectNoHorizontalOverflow(page, `issue-decomposition-detail-selection:${viewport.name}`)
    await expect(page.locator('.ant-message-notice-error')).toHaveCount(0)
    visitedViewports.push(`${viewport.width}x${viewport.height}`)
  }

  expect(network.unhandledApiRequests, 'Every /api request must be mocked in Issue Decomposition detail selection smoke.').toEqual([])
  expect(network.taskRequests).toContain(targetIssueId)
  expect(network.exportRequests).toContain(targetIssueId)
  expect(redactionProofs).toHaveLength(viewportMatrix.length)
  expect(redactionProofs.every(proof => proof.previewRedactionVisible && proof.previewRawSecretsHidden && proof.bodyRawSecretsHidden)).toBe(true)
  expect(copyExportProofs).toHaveLength(viewportMatrix.length)
  expect(copyExportProofs.every(proof => proof.copyRedacted && proof.downloadRedacted && !proof.markerContainsRawSecret)).toBe(true)
  expect(governanceProofs).toHaveLength(viewportMatrix.length)
  expect(governanceProofs.every(proof => proof.stepCount === 4 && proof.readable && !proof.fullImplementationClaim && !proof.llmFactClaim)).toBe(true)
  expect(staleTaskGuardProofs).toHaveLength(viewportMatrix.length)
  expect(staleTaskGuardProofs.every(proof => (
    proof.delayedResponseReleased
    && proof.failedIssueRemainedSelected
    && proof.staleTargetTasksRejected
    && proof.failedIssueTaskCountStayedZero
  ))).toBe(true)
  expect(issues, `Runtime issues must be empty: ${JSON.stringify(issues, null, 2)}`).toEqual([])

  const markerPayload = {
    mockedApiOnly: true,
    unhandledApiRequests: 0,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    visitedViewports,
    detailAction: {
      visible: true,
      clickedIssueId: targetIssueId,
      detailPanelMatched: true,
    },
    keyboardOpen: {
      enter: true,
      space: true,
      selectedIssueIds: [targetIssueId, failedIssueId],
    },
    planningSignal: {
      visible: true,
      countsAligned: true,
      failedStateExplained: true,
    },
    issueGovernanceLoop: {
      scope: 'ISSUE_DECOMPOSITION_GOVERNANCE_LOOP_READABILITY',
      steps: ['需求输入', '任务拆解', '验收门禁', '执行交接'],
      desktopColumns: governanceProofs.find(proof => proof.viewport === 'desktop')?.columns,
      tabletColumns: governanceProofs.find(proof => proof.viewport === 'tablet')?.columns,
      mobileColumns: governanceProofs.find(proof => proof.viewport === 'mobile')?.columns,
      narrowColumns: governanceProofs.find(proof => proof.viewport === 'narrow')?.columns,
      textReadable: governanceProofs.every(proof => proof.readable),
      fullImplementationClaim: false,
      llmFactClaim: false,
    },
    tasks: {
      loadedForCompletedIssueId: targetIssueId,
      statusUpdateIsolated: true,
      staleTasksClearedForFailedIssue: true,
      delayedCompletedIssueTasksRejectedAfterFailedSelection: staleTaskGuardProofs.every(proof => proof.staleTargetTasksRejected),
      delayedTaskResponsesReleased: network.releasedDelayedTargetTaskResponses,
      mainTableScrollerContained: true,
      taskTableScrollerContained: true,
    },
    exportActions: {
      copyIsolated: true,
      downloadIsolated: true,
    },
    rawResultSafety: {
      scope: 'ISSUE_DECOMPOSITION_OUTPUT_JSON_DISPLAY_REDACTION_ONLY',
      fixtureHasRawSecretSentinel: true,
      fixtureHasBearerSecret: true,
      fixtureHasApiKeySecret: true,
      fixtureHasJwtSecret: true,
      previewRedactionVisible: redactionProofs.every(proof => proof.previewRedactionVisible),
      previewRawSecretsHidden: redactionProofs.every(proof => proof.previewRawSecretsHidden),
      bodyRawSecretsHidden: redactionProofs.every(proof => proof.bodyRawSecretsHidden),
      markerContainsRawSecret: false,
    },
    markdownExportSafety: {
      scope: 'ISSUE_DECOMPOSITION_MARKDOWN_COPY_EXPORT_DISPLAY_REDACTION_ONLY',
      copyMarkdownRedacted: copyExportProofs.every(proof => proof.copyRedacted),
      downloadMarkdownRedacted: copyExportProofs.every(proof => proof.downloadRedacted),
      markerContainsRawSecret: false,
    },
    accessibleSelection: true,
    nestedActionsDoNotHijackSelection: true,
    spec: 'issue-decomposition-detail-selection-smoke.spec.ts',
    baseURLHost,
  }
  const markerText = JSON.stringify(markerPayload)
  for (const secret of forbiddenIssueSecretSnippets) {
    expect(markerText, `ISSUE_DECOMPOSITION marker must not include raw issue secret ${secret}`).not.toContain(secret)
  }
  console.log('ISSUE_DECOMPOSITION_DETAIL_SELECTION_SMOKE_OK', markerText)
})
