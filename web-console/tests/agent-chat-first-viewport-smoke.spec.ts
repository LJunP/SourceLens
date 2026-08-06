import { expect, test, type Locator, type Page, type Route } from '@playwright/test'

type AgentChatState = 'INITIAL_LOADING' | 'FATAL_LOAD' | 'EMPTY' | 'READY' | 'STREAMING' | 'STALE_REFRESH'
type DelayedKind = 'projects' | 'conversation-list' | 'detail'

type ConversationFixture = ReturnType<typeof conversationFixture>
type MessageFixture = ReturnType<typeof messageFixture>

interface DelayedResponse {
  kind: DelayedKind
  ownerId: number | null
  route: Route
  data: unknown
}

interface MockControls {
  projectFailure: boolean
  holdProjectsOnce: number
  holdConversationLists: Set<number>
  holdDetails: Set<number>
  failNextDetails: Set<number>
  conversationsByProject: Map<number, ConversationFixture[]>
  messagesByConversation: Map<number, MessageFixture[]>
  delayed: DelayedResponse[]
  conversationListRequests: Map<number, number>
  unhandledApiRequests: string[]
  releaseDelayed: (kind: DelayedKind, ownerId?: number | null) => Promise<number>
}

const projectAId = 11
const projectBId = 22
const conversationAId = 101
const conversationBId = 202
const emptyConversationId = 303
const raceConversationAId = 401
const raceConversationBId = 402

const projectA = projectFixture(projectAId, 'AgentChat First Viewport A')
const projectB = projectFixture(projectBId, 'AgentChat First Viewport B')
const conversationA = conversationFixture(conversationAId, projectAId, 'A 可信线程')
const conversationB = conversationFixture(conversationBId, projectAId, 'B 切换线程')
const emptyConversation = conversationFixture(emptyConversationId, projectAId, '已选空线程')
const raceConversationA = conversationFixture(raceConversationAId, projectAId, 'RACE_A_DELAYED_TITLE')
const raceConversationB = conversationFixture(raceConversationBId, projectBId, 'RACE_B_OWNER_TITLE')
const messageA = messageFixture(1001, conversationAId, 'A_TRUSTED_MESSAGE_STAYS_VISIBLE')
const messageB = messageFixture(2001, conversationBId, 'B_STREAM_OWNER_MESSAGE')
const raceMessageA = messageFixture(4001, raceConversationAId, 'RACE_A_DELAYED_MESSAGE_MUST_NOT_RENDER')
const raceMessageB = messageFixture(4002, raceConversationBId, 'RACE_B_MESSAGE_OWNER_CONFIRMED')

const viewportMatrix = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 740 },
]

const stateContracts: Record<AgentChatState, { label: string; primary: string | null; primaryLabel: string | null }> = {
  INITIAL_LOADING: { label: '初始加载中', primary: null, primaryLabel: null },
  FATAL_LOAD: { label: '加载失败', primary: 'retry', primaryLabel: '重试加载' },
  EMPTY: { label: '等待输入', primary: null, primaryLabel: null },
  READY: { label: '上下文已就绪', primary: null, primaryLabel: null },
  STREAMING: { label: '生成中', primary: 'stop', primaryLabel: '停止生成' },
  STALE_REFRESH: { label: '上下文已陈旧', primary: 'resync', primaryLabel: '重新同步' },
}

const proof = {
  stateCoverage: [] as string[],
  emptyPoolChecked: [] as string[],
  selectedEmptyThreadChecked: [] as string[],
  readyComposerSendChecked: [] as string[],
  streamingConversationSwitchChecked: [] as string[],
  staleRecoveryChecked: [] as string[],
  threadFirstDrawerChecked: [] as string[],
  desktopPoolChecked: [] as string[],
  visualEvidence: [] as string[],
  raceChecked: [] as string[],
  unhandledApiRequests: 0,
}
let hadTestFailure = false

test.afterEach(({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) hadTestFailure = true
})

function result<T>(data: T) {
  return { code: 'SUCCESS', message: 'OK', data }
}

function projectFixture(id: number, name: string) {
  return {
    id,
    name,
    description: 'Mocked AgentChat first viewport project',
    primaryLanguage: 'TypeScript',
    framework: 'React',
    status: 'ACTIVE',
    healthScore: 91,
    createdBy: 1,
    createdAt: '2026-07-10T01:00:00Z',
  }
}

function conversationFixture(id: number, projectId: number, title: string) {
  return {
    id,
    projectId,
    agentTaskId: null,
    title,
    systemPrompt: null,
    status: 'ACTIVE',
    createdBy: 1,
    createdAt: '2026-07-10T02:00:00Z',
    updatedAt: '2026-07-10T02:03:00Z',
  }
}

function messageFixture(id: number, conversationId: number, content: string) {
  return {
    id,
    conversationId,
    role: 'ASSISTANT',
    content,
    toolCallsJson: null,
    toolResultsJson: null,
    modelName: 'mock-agent-chat-first-viewport',
    tokensUsed: 42,
    durationMs: 120,
    status: 'COMPLETED',
    errorMessage: null,
    createdAt: '2026-07-10T02:03:00Z',
  }
}

async function fulfillJson(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(data),
  })
}

async function fulfillFailure(route: Route, message: string, status = 503) {
  await fulfillJson(route, { code: 'SERVICE_UNAVAILABLE', message, data: null }, status)
}

async function installMocks(page: Page): Promise<MockControls> {
  const controls: MockControls = {
    projectFailure: false,
    holdProjectsOnce: 0,
    holdConversationLists: new Set(),
    holdDetails: new Set(),
    failNextDetails: new Set(),
    conversationsByProject: new Map([
      [projectAId, []],
      [projectBId, [raceConversationB]],
    ]),
    messagesByConversation: new Map([
      [conversationAId, [messageA]],
      [conversationBId, [messageB]],
      [emptyConversationId, []],
      [raceConversationAId, [raceMessageA]],
      [raceConversationBId, [raceMessageB]],
    ]),
    delayed: [],
    conversationListRequests: new Map(),
    unhandledApiRequests: [],
    releaseDelayed: async () => 0,
  }

  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'agent-chat-first-viewport-mocked-token')

    type SseRequestRecord = {
      path: string
      body: Record<string, unknown>
      completed: boolean
      aborted: boolean
    }
    type SseWindow = typeof window & {
      __SL_AGENT_CHAT_FIRST_VIEWPORT_SSE__?: { requests: SseRequestRecord[] }
    }

    const mockState = { requests: [] as SseRequestRecord[] }
    ;(window as SseWindow).__SL_AGENT_CHAT_FIRST_VIEWPORT_SSE__ = mockState
    const nativeFetch = window.fetch.bind(window)

    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url
      const url = new URL(requestUrl, window.location.origin)
      const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()

      if (method === 'POST' && /^\/api\/conversations\/\d+\/messages$/.test(url.pathname)) {
        let body: Record<string, unknown> = {}
        try {
          body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>
        } catch {
          body = {}
        }
        const requestRecord: SseRequestRecord = {
          path: url.pathname,
          body,
          completed: false,
          aborted: false,
        }
        mockState.requests.push(requestRecord)

        const encoder = new TextEncoder()
        let streamController: ReadableStreamDefaultController<Uint8Array> | null = null
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            streamController = controller
            controller.enqueue(encoder.encode('event: content\ndata: {"content":"MOCK_SSE_HELD_OPEN"}\n\n'))
          },
          cancel() {
            requestRecord.aborted = true
          },
        })
        init?.signal?.addEventListener('abort', () => {
          requestRecord.aborted = true
          try {
            streamController?.error(new DOMException('Aborted', 'AbortError'))
          } catch {
            // The reader may already have observed the abort.
          }
        }, { once: true })

        return Promise.resolve(new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        }))
      }

      return nativeFetch(input, init)
    }) as typeof window.fetch
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
      await fulfillJson(route, result({
        id: 1,
        username: 'agent_chat_first_viewport',
        email: 'agent-chat-first-viewport@local.test',
        status: 'ACTIVE',
      }))
      return
    }

    if (method === 'GET' && path === '/api/projects') {
      const data = result({ items: [projectA, projectB], page: 1, pageSize: 100, total: 2 })
      if (controls.holdProjectsOnce > 0) {
        controls.holdProjectsOnce -= 1
        controls.delayed.push({ kind: 'projects', ownerId: null, route, data })
        return
      }
      if (controls.projectFailure) {
        await fulfillFailure(route, 'MOCK_PROJECT_FATAL_LOAD')
        return
      }
      await fulfillJson(route, data)
      return
    }

    const conversationListMatch = path.match(/^\/api\/projects\/(\d+)\/conversations$/)
    if (method === 'GET' && conversationListMatch) {
      const ownerId = Number(conversationListMatch[1])
      controls.conversationListRequests.set(ownerId, (controls.conversationListRequests.get(ownerId) || 0) + 1)
      const items = controls.conversationsByProject.get(ownerId) || []
      const data = result({ items, page: 1, pageSize: 100, total: items.length })
      if (controls.holdConversationLists.has(ownerId)) {
        controls.delayed.push({ kind: 'conversation-list', ownerId, route, data })
        return
      }
      await fulfillJson(route, data)
      return
    }

    const detailMatch = path.match(/^\/api\/conversations\/(\d+)$/)
    if (method === 'GET' && detailMatch) {
      const ownerId = Number(detailMatch[1])
      const conversations = [conversationA, conversationB, emptyConversation, raceConversationA, raceConversationB]
      const conversation = conversations.find(item => item.id === ownerId)
      if (!conversation) {
        await fulfillFailure(route, `Unknown mocked conversation ${ownerId}`, 404)
        return
      }
      const data = result({ conversation, messages: controls.messagesByConversation.get(ownerId) || [] })
      if (controls.holdDetails.has(ownerId)) {
        controls.delayed.push({ kind: 'detail', ownerId, route, data })
        return
      }
      if (controls.failNextDetails.delete(ownerId)) {
        await fulfillFailure(route, `MOCK_SILENT_REFRESH_FAILURE_${ownerId}`)
        return
      }
      await fulfillJson(route, data)
      return
    }

    controls.unhandledApiRequests.push(`${method} ${path}${url.search}`)
    await fulfillFailure(route, `Unhandled AgentChat first viewport API: ${method} ${path}`, 599)
  })

  controls.releaseDelayed = async (kind, ownerId) => {
    if (kind === 'conversation-list' && ownerId !== undefined) controls.holdConversationLists.delete(ownerId)
    if (kind === 'detail' && ownerId !== undefined) controls.holdDetails.delete(ownerId)
    const released: DelayedResponse[] = []
    for (let index = controls.delayed.length - 1; index >= 0; index -= 1) {
      const item = controls.delayed[index]
      if (item.kind === kind && (ownerId === undefined || item.ownerId === ownerId)) {
        released.unshift(item)
        controls.delayed.splice(index, 1)
      }
    }
    await Promise.all(released.map(item => fulfillJson(item.route, item.data)))
    return released.length
  }

  return controls
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const layout = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  const overflow = Math.max(layout.bodyScrollWidth, layout.documentScrollWidth) - layout.innerWidth
  expect(overflow, `${label}: horizontal overflow ${JSON.stringify(layout)}`).toBeLessThanOrEqual(1)
}

async function expectInsideViewport(
  locator: Locator,
  viewport: { width: number; height: number },
  label: string,
) {
  const box = await locator.boundingBox()
  expect(box, `${label}: rendered bounding box`).not.toBeNull()
  expect(box!.x, `${label}: left edge`).toBeGreaterThanOrEqual(-1)
  expect(box!.y, `${label}: top edge`).toBeGreaterThanOrEqual(-1)
  expect(box!.x + box!.width, `${label}: right edge`).toBeLessThanOrEqual(viewport.width + 1)
  expect(box!.y + box!.height, `${label}: bottom edge`).toBeLessThanOrEqual(viewport.height + 1)
}

async function expectState(
  page: Page,
  state: AgentChatState,
  viewport: { width: number; height: number },
  label: string,
) {
  const contract = stateContracts[state]
  const root = page.locator(`.sl-agent-chat-shell[data-sl-agent-chat-state="${state}"]`)
  const indicator = page.locator(`[data-agent-chat-state-indicator="${state}"]`)
  await expect(root, `${label}: ${state} root`).toHaveCount(1)
  await expect(root).toHaveAttribute('data-agent-chat-state', state)
  await expect(root).toHaveAttribute('data-agent-chat-thread-priority', viewport.width <= 1200 ? 'first' : 'desktop-grid')
  await expect(indicator, `${label}: ${state} indicator`).toBeVisible()
  await expect(indicator).toHaveAttribute('data-agent-chat-primary-actions', contract.primary ? '1' : '0')
  await expect(indicator.getByText(contract.label, { exact: true })).toBeVisible()

  const reason = indicator.locator('.sl-agent-chat-state-copy p')
  await expect(reason).toBeVisible()
  await expect(reason).not.toHaveText('')
  await expectInsideViewport(reason, viewport, `${label}:${state}:reason`)

  const primaryActions = indicator.locator('[data-agent-chat-primary-action]')
  await expect(primaryActions).toHaveCount(contract.primary ? 1 : 0)
  if (contract.primary && contract.primaryLabel) {
    const primary = indicator.locator(`[data-agent-chat-primary-action="${contract.primary}"]`)
    await expect(primary).toBeVisible()
    await expect(primary).toHaveAccessibleName(contract.primaryLabel)
    await expectInsideViewport(primary, viewport, `${label}:${state}:${contract.primary}`)
  }

  expect(await page.evaluate(() => window.scrollY), `${label}:${state}: document scrollY`).toBe(0)
  await expectNoHorizontalOverflow(page, `${label}:${state}`)
}

async function expectComposerCanSend(
  page: Page,
  viewport: { width: number; height: number },
  question: string,
  label: string,
) {
  const composer = page.locator('[data-agent-chat-composer="true"]')
  const textarea = page.getByLabel('输入给 SourceLens Agent 的问题')
  const send = page.getByRole('button', { name: '发送' })
  await expect(composer).toBeVisible()
  await expect(textarea).toBeEnabled()
  await expect(send).toBeDisabled()
  await expectInsideViewport(composer, viewport, `${label}:composer`)
  await expectInsideViewport(textarea, viewport, `${label}:textarea`)
  await expectInsideViewport(send, viewport, `${label}:send`)

  await textarea.fill(question)
  await expect(textarea).toHaveValue(question)
  await expect(send).toBeEnabled()
  await expectInsideViewport(textarea, viewport, `${label}:filled-textarea`)
  await expectInsideViewport(send, viewport, `${label}:enabled-send`)
  expect(await page.evaluate(() => window.scrollY), `${label}: document scrollY`).toBe(0)
  return { textarea, send }
}

async function expectComposerLocked(
  page: Page,
  viewport: { width: number; height: number },
  reason: RegExp,
  label: string,
) {
  const composer = page.locator('[data-agent-chat-composer="true"]')
  const textarea = page.getByLabel('输入给 SourceLens Agent 的问题')
  const send = page.getByRole('button', { name: '发送' })
  const lockReason = page.locator('#agent-chat-composer-lock-reason')
  await expect(composer).toBeVisible()
  await expect(textarea).toBeDisabled()
  await expect(send).toBeDisabled()
  await expect(lockReason).toHaveText(reason)
  await expectInsideViewport(composer, viewport, `${label}:locked-composer`)
  await expectInsideViewport(textarea, viewport, `${label}:locked-textarea`)
  await expectInsideViewport(send, viewport, `${label}:locked-send`)
  await expectInsideViewport(lockReason, viewport, `${label}:lock-reason`)
}

async function getSseRequests(page: Page) {
  return page.evaluate(() => {
    type SseWindow = typeof window & {
      __SL_AGENT_CHAT_FIRST_VIEWPORT_SSE__?: {
        requests: Array<{
          path: string
          body: Record<string, unknown>
          completed: boolean
          aborted: boolean
        }>
      }
    }
    return (window as SseWindow).__SL_AGENT_CHAT_FIRST_VIEWPORT_SSE__?.requests || []
  })
}

async function expectSseRequestCount(page: Page, expected: number, label: string) {
  await expect.poll(async () => (await getSseRequests(page)).length, { message: label }).toBe(expected)
}

async function expectConversationPoolDefault(
  page: Page,
  viewport: { width: number; height: number },
  label: string,
) {
  const directPool = page.locator('.sl-agent-chat-shell > .sl-agent-chat-sidebar')
  if (viewport.width > 1200) {
    await expect(directPool).toBeVisible()
    await expect(directPool.getByText('暂无对话', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '打开会话池' })).toHaveCount(0)
    await expectInsideViewport(directPool.locator('.sl-agent-chat-project'), viewport, `${label}:desktop-project`)
    await expectInsideViewport(directPool.locator('.sl-agent-chat-sidebar-head'), viewport, `${label}:desktop-actions`)
    proof.desktopPoolChecked.push(`${viewport.width}x${viewport.height}`)
    return
  }

  await expect(directPool).toHaveCount(0)
  const opener = page.getByRole('button', { name: '打开会话池' })
  await expect(opener).toBeVisible()
  await expectInsideViewport(opener, viewport, `${label}:pool-opener`)
  await opener.click()

  const drawer = page.locator('.sl-agent-chat-conversation-drawer.ant-drawer-open')
  await expect(drawer).toBeVisible()
  await expect(drawer.getByText('会话池', { exact: true }).first()).toBeVisible()
  await expect(drawer.getByText('暂无对话', { exact: true })).toBeVisible()
  await expect.poll(async () => (await drawer.locator('.ant-drawer-content').boundingBox())?.x ?? -999).toBeGreaterThanOrEqual(-1)
  await expectInsideViewport(drawer.locator('.ant-drawer-content'), viewport, `${label}:drawer-content`)
  const close = drawer.locator('.ant-drawer-close')
  await expect(close).toBeVisible()
  await expectInsideViewport(close, viewport, `${label}:drawer-close`)
  await close.click()
  await expect(page.locator('.sl-agent-chat-conversation-drawer.ant-drawer-open')).toHaveCount(0)
  await expect(directPool).toHaveCount(0)
  proof.threadFirstDrawerChecked.push(`${viewport.width}x${viewport.height}`)
}

async function selectConversation(
  page: Page,
  viewport: { width: number; height: number },
  conversationId: number,
  title: string,
  label: string,
) {
  let pool: Locator
  if (viewport.width <= 1200) {
    await expect(page.locator('.sl-agent-chat-shell > .sl-agent-chat-sidebar')).toHaveCount(0)
    await page.getByRole('button', { name: '打开会话池' }).click()
    const drawer = page.locator('.sl-agent-chat-conversation-drawer.ant-drawer-open')
    await expect(drawer).toBeVisible()
    await expect.poll(async () => (await drawer.locator('.ant-drawer-content').boundingBox())?.x ?? -999).toBeGreaterThanOrEqual(-1)
    pool = drawer
  } else {
    pool = page.locator('.sl-agent-chat-shell > .sl-agent-chat-sidebar')
    await expect(pool).toBeVisible()
  }

  const link = pool.getByRole('link', { name: new RegExp(title) })
  await expect(link, `${label}: conversation link`).toBeVisible()
  await expectInsideViewport(link, viewport, `${label}:conversation-link`)
  await link.click()
  await expect(page).toHaveURL(new RegExp(`/agent-chat/${conversationId}$`))
  if (viewport.width <= 1200) {
    await expect(page.locator('.sl-agent-chat-conversation-drawer.ant-drawer-open')).toHaveCount(0)
    await expect(pool).toBeHidden()
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  }
}

async function navigateClientSide(page: Page, conversationId: number) {
  await page.evaluate((id) => {
    const currentState = window.history.state || {}
    window.history.pushState({
      ...currentState,
      idx: Number(currentState.idx || 0) + 1,
      key: `agent-chat-race-${id}-${Date.now()}`,
    }, '', `/agent-chat/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
  }, conversationId)
}

for (const viewport of viewportMatrix) {
  test(`AgentChat first viewport state truth on ${viewport.name}`, async ({ page }, testInfo) => {
    const controls = await installMocks(page)
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    controls.holdProjectsOnce = 2

    await page.goto('/agent-chat')
    await expect.poll(
      () => controls.delayed.filter(item => item.kind === 'projects').length,
      { message: `${viewport.name}: initial project request entered hold` },
    ).toBe(2)
    await expectState(page, 'INITIAL_LOADING', viewport, viewport.name)

    expect(await controls.releaseDelayed('projects')).toBe(2)
    await expectState(page, 'EMPTY', viewport, `${viewport.name}:empty-pool`)
    await expect(page.getByText('选择或创建一个对话', { exact: true })).toBeVisible()
    await expectConversationPoolDefault(page, viewport, `${viewport.name}:empty-pool`)
    proof.emptyPoolChecked.push(`${viewport.width}x${viewport.height}`)

    controls.projectFailure = true
    await page.reload()
    await expectState(page, 'FATAL_LOAD', viewport, viewport.name)
    controls.projectFailure = false
    await page.locator('[data-agent-chat-primary-action="retry"]').click()
    await expectState(page, 'EMPTY', viewport, `${viewport.name}:fatal-recovered`)

    controls.conversationsByProject.set(projectAId, [conversationA, conversationB, emptyConversation])
    const listRequestsBeforeRefresh = controls.conversationListRequests.get(projectAId) || 0
    await page.getByRole('button', { name: '刷新当前会话' }).click()
    await expect.poll(
      () => controls.conversationListRequests.get(projectAId) || 0,
      { message: `${viewport.name}: refreshed conversation pool` },
    ).toBeGreaterThan(listRequestsBeforeRefresh)

    await selectConversation(page, viewport, emptyConversationId, emptyConversation.title, `${viewport.name}:select-empty`)
    await expectState(page, 'EMPTY', viewport, `${viewport.name}:selected-empty`)
    await expect(page.locator('.sl-agent-chat-shell')).toHaveAttribute('data-sl-agent-chat-message-owner', String(emptyConversationId))
    const emptyComposer = await expectComposerCanSend(
      page,
      viewport,
      `EMPTY_SEND_${viewport.name}`,
      `${viewport.name}:selected-empty`,
    )
    await emptyComposer.send.click()
    await expectSseRequestCount(page, 1, `${viewport.name}: EMPTY send must use mocked SSE`)
    await expectState(page, 'STREAMING', viewport, `${viewport.name}:empty-streaming`)
    await expectComposerLocked(page, viewport, /当前回复正在生成/, `${viewport.name}:empty-streaming`)
    await page.locator('[data-agent-chat-primary-action="stop"]').click()
    await expectState(page, 'READY', viewport, `${viewport.name}:empty-send-stopped`)
    proof.selectedEmptyThreadChecked.push(`${viewport.width}x${viewport.height}`)

    await selectConversation(page, viewport, conversationAId, conversationA.title, `${viewport.name}:select-ready-a`)
    await expectState(page, 'READY', viewport, `${viewport.name}:ready-a`)
    await expect(page.getByText(messageA.content, { exact: true })).toBeVisible()
    await expect(page.locator('.sl-agent-chat-shell')).toHaveAttribute('data-sl-agent-chat-message-owner', String(conversationAId))

    if (viewport.name === 'desktop' || viewport.name === 'narrow') {
      const screenshotPath = testInfo.outputPath(`agent-chat-${viewport.name}-ready.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' })
      await testInfo.attach(`agent-chat-${viewport.name}-ready`, { path: screenshotPath, contentType: 'image/png' })
      proof.visualEvidence.push(`${viewport.name}:READY`)
    }

    const readyComposer = await expectComposerCanSend(
      page,
      viewport,
      `READY_SEND_${viewport.name}`,
      `${viewport.name}:ready-a`,
    )
    await readyComposer.send.click()
    await expectSseRequestCount(page, 2, `${viewport.name}: READY send must use mocked SSE`)
    await expectState(page, 'STREAMING', viewport, `${viewport.name}:streaming-a`)

    await selectConversation(page, viewport, conversationBId, conversationB.title, `${viewport.name}:streaming-switch-b`)
    await expectState(page, 'STREAMING', viewport, `${viewport.name}:streaming-owner-b`)
    await expect(page.locator('[data-agent-chat-state-indicator="STREAMING"] .sl-agent-chat-state-copy p')).toContainText(`Conv #${conversationAId}`)
    await expect(page.getByText(messageB.content, { exact: true })).toBeVisible()
    await expect(page.locator('.sl-agent-chat-shell')).toHaveAttribute('data-sl-agent-chat-message-owner', String(conversationBId))
    await expectComposerLocked(page, viewport, new RegExp(`Conv #${conversationAId} 正在生成`), `${viewport.name}:streaming-owner-b`)
    await page.locator('[data-agent-chat-primary-action="stop"]').click()
    await expectState(page, 'READY', viewport, `${viewport.name}:stream-stopped-on-b`)
    proof.readyComposerSendChecked.push(`${viewport.width}x${viewport.height}`)
    proof.streamingConversationSwitchChecked.push(`${viewport.width}x${viewport.height}`)

    await selectConversation(page, viewport, conversationAId, conversationA.title, `${viewport.name}:return-a-for-stale`)
    await expectState(page, 'READY', viewport, `${viewport.name}:ready-before-stale`)
    controls.failNextDetails.add(conversationAId)
    await page.getByRole('button', { name: '刷新当前会话' }).click()
    await expectState(page, 'STALE_REFRESH', viewport, `${viewport.name}:stale`)
    await expect(page.getByText(messageA.content, { exact: true })).toBeVisible()
    await expectComposerLocked(page, viewport, /上下文可能已陈旧/, `${viewport.name}:stale`)
    await expect(page.locator('[data-agent-chat-state-indicator="STALE_REFRESH"]')).toContainText(`MOCK_SILENT_REFRESH_FAILURE_${conversationAId}`)

    if (viewport.name === 'desktop' || viewport.name === 'narrow') {
      const screenshotPath = testInfo.outputPath(`agent-chat-${viewport.name}-stale.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false, animations: 'disabled' })
      await testInfo.attach(`agent-chat-${viewport.name}-stale`, { path: screenshotPath, contentType: 'image/png' })
      proof.visualEvidence.push(`${viewport.name}:STALE_REFRESH`)
    }

    await page.locator('[data-agent-chat-primary-action="resync"]').click()
    await expectState(page, 'READY', viewport, `${viewport.name}:stale-recovered`)
    await expect(page.getByText(messageA.content, { exact: true })).toBeVisible()
    proof.staleRecoveryChecked.push(`${viewport.width}x${viewport.height}`)
    proof.stateCoverage.push(...Object.keys(stateContracts).map(state => `${viewport.width}x${viewport.height}:${state}`))

    const sseRequests = await getSseRequests(page)
    expect(sseRequests).toHaveLength(2)
    expect(sseRequests.every(request => request.completed === false), `${viewport.name}: SSE mocks remain unfinished`).toBe(true)
    expect(sseRequests.every(request => request.aborted), `${viewport.name}: user stop aborts both held SSE streams`).toBe(true)
    expect(sseRequests[0].path).toBe(`/api/conversations/${emptyConversationId}/messages`)
    expect(sseRequests[1].path).toBe(`/api/conversations/${conversationAId}/messages`)
    expect(controls.delayed).toEqual([])
    expect(controls.unhandledApiRequests).toEqual([])
    proof.unhandledApiRequests += controls.unhandledApiRequests.length
  })
}

test('AgentChat rejects delayed A detail and list responses after B takes ownership', async ({ page }) => {
  const controls = await installMocks(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  controls.conversationsByProject.set(projectAId, [raceConversationA])
  controls.conversationsByProject.set(projectBId, [raceConversationB])
  controls.holdConversationLists.add(projectAId)
  controls.holdDetails.add(raceConversationAId)

  await page.goto(`/agent-chat/${raceConversationAId}`)
  await expect.poll(
    () => controls.delayed.filter(item => item.kind === 'conversation-list' && item.ownerId === projectAId).length,
    { message: 'race A conversation list entered hold' },
  ).toBeGreaterThanOrEqual(1)
  await expect.poll(
    () => controls.delayed.filter(item => item.kind === 'detail' && item.ownerId === raceConversationAId).length,
    { message: 'race A detail entered hold' },
  ).toBeGreaterThanOrEqual(1)
  await page.waitForTimeout(50)
  const heldAListRequests = controls.delayed.filter(item => item.kind === 'conversation-list' && item.ownerId === projectAId).length
  const heldADetailRequests = controls.delayed.filter(item => item.kind === 'detail' && item.ownerId === raceConversationAId).length
  await expectState(page, 'INITIAL_LOADING', viewportMatrix[0], 'race-a-held')

  await navigateClientSide(page, raceConversationBId)
  await expectState(page, 'READY', viewportMatrix[0], 'race-b-before-release')
  const root = page.locator('.sl-agent-chat-shell')
  await expect(root).toHaveAttribute('data-sl-agent-chat-project-owner', String(projectBId))
  await expect(root).toHaveAttribute('data-sl-agent-chat-conversation-owner', String(projectBId))
  await expect(root).toHaveAttribute('data-sl-agent-chat-message-owner', String(raceConversationBId))
  await expect(page.getByRole('heading', { name: raceConversationB.title })).toBeVisible()
  await expect(page.getByText(raceMessageB.content, { exact: true })).toBeVisible()

  expect(await controls.releaseDelayed('detail', raceConversationAId)).toBe(heldADetailRequests)
  expect(await controls.releaseDelayed('conversation-list', projectAId)).toBe(heldAListRequests)
  await page.waitForTimeout(100)

  await expectState(page, 'READY', viewportMatrix[0], 'race-b-after-release')
  await expect(root).toHaveAttribute('data-sl-agent-chat-project-owner', String(projectBId))
  await expect(root).toHaveAttribute('data-sl-agent-chat-conversation-owner', String(projectBId))
  await expect(root).toHaveAttribute('data-sl-agent-chat-message-owner', String(raceConversationBId))
  await expect(page.getByRole('heading', { name: raceConversationB.title })).toBeVisible()
  await expect(page.getByText(raceMessageB.content, { exact: true })).toBeVisible()
  await expect(page.getByText(raceConversationA.title, { exact: true })).toHaveCount(0)
  await expect(page.getByText(raceMessageA.content, { exact: true })).toHaveCount(0)
  expect(controls.delayed).toEqual([])
  expect(controls.unhandledApiRequests).toEqual([])
  proof.raceChecked.push('A_DETAIL_AND_PROJECT_LIST_TO_B_OWNER')
  proof.unhandledApiRequests += controls.unhandledApiRequests.length
})

test.afterAll(() => {
  if (process.env.SL_AGENT_CHAT_FIRST_VIEWPORT_PARTIAL === '1' || hadTestFailure) return
  expect(proof.stateCoverage).toHaveLength(viewportMatrix.length * Object.keys(stateContracts).length)
  expect(proof.emptyPoolChecked).toHaveLength(5)
  expect(proof.selectedEmptyThreadChecked).toHaveLength(5)
  expect(proof.readyComposerSendChecked).toHaveLength(5)
  expect(proof.streamingConversationSwitchChecked).toHaveLength(5)
  expect(proof.staleRecoveryChecked).toHaveLength(5)
  expect(proof.threadFirstDrawerChecked).toEqual(['1024x768', '768x1024', '390x844', '320x740'])
  expect(proof.desktopPoolChecked).toEqual(['1440x900'])
  expect(proof.visualEvidence).toEqual([
    'desktop:READY',
    'desktop:STALE_REFRESH',
    'narrow:READY',
    'narrow:STALE_REFRESH',
  ])
  expect(proof.raceChecked).toEqual(['A_DETAIL_AND_PROJECT_LIST_TO_B_OWNER'])
  expect(proof.unhandledApiRequests).toBe(0)

  console.log('AGENT_CHAT_FIRST_VIEWPORT_SMOKE_OK', JSON.stringify({
    testCount: 6,
    viewports: viewportMatrix.map(viewport => `${viewport.width}x${viewport.height}`),
    states: Object.keys(stateContracts),
    emptyModes: ['CONFIRMED_EMPTY_POOL', 'SELECTED_EMPTY_THREAD'],
    primaryActions: {
      INITIAL_LOADING: 0,
      FATAL_LOAD: 'retry',
      EMPTY: 0,
      READY: 0,
      STREAMING: 'stop',
      STALE_REFRESH: 'resync',
    },
    mockedApiOnly: true,
    realApi: false,
    db: false,
    unhandledApiRequests: proof.unhandledApiRequests,
    sseMockHeldOpen: true,
    aToBStreamingOccupancyReason: true,
    delayedDetailAndListOwnerIsolation: true,
    documentScrollY: 0,
    noHorizontalOverflow: true,
    scrollIntoViewIfNeeded: false,
    forceClick: false,
    screenshots: [
      'agent-chat-desktop-ready.png',
      'agent-chat-desktop-stale.png',
      'agent-chat-narrow-ready.png',
      'agent-chat-narrow-stale.png',
    ],
    preserveOutput: 'always',
    workers: 1,
    fullyParallel: false,
    spec: 'agent-chat-first-viewport-smoke.spec.ts',
  }))
})
