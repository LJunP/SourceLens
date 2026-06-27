import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Empty, Input, Popconfirm, Select, Spin, Tag, Tooltip, Typography, message as antdMessage } from 'antd'
import {
  ApiOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  MessageOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  StopOutlined,
  SyncOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { conversationApi, Conversation, ConversationMessage } from '../api/conversation'
import { projectApi } from '../api/project'
import { showApiError } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import AgentToolCall from '../components/AgentToolCall'

const { Text } = Typography

const QUICK_PROMPTS = [
  '解释这个仓库的核心模块边界',
  '找出最值得优先修复的架构风险',
  '根据最近扫描结果生成重构建议',
]

interface StreamingMessage {
  role: 'ASSISTANT'
  content: string
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>
  toolResults: Array<{ id: string; name: string; success: boolean; content: string }>
  status: 'streaming' | 'done' | 'error'
  round?: number
}

interface ToolCallView {
  id: string
  name: string
  arguments: Record<string, unknown>
}

interface ToolResultView {
  id: string
  content: string
  success?: boolean
}

interface ToolAuditStats {
  total: number
  failed: number
  writeOrExec: number
}

export default function AgentChat() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    activeConvId: streamingConvId,
    streamingMsg,
    sending,
    sendMsg,
    abortStream,
    resetChatState,
    updateOnMessageDone,
  } = useChat()

  const parsedConversationId = conversationId ? Number(conversationId) : NaN
  const activeConvId = Number.isFinite(parsedConversationId) ? parsedConversationId : null
  const selectedConversation = conversations.find(conv => conv.id === activeConvId) || null
  const selectedProject = projects.find(project => project.id === projectId) || null
  const visibleStreamingMsg = activeConvId === streamingConvId ? streamingMsg : null

  const messageStats = useMemo(() => buildMessageStats(messages, visibleStreamingMsg), [messages, visibleStreamingMsg])
  const toolStats = useMemo(() => buildToolAuditStats(messages, visibleStreamingMsg), [messages, visibleStreamingMsg])

  useEffect(() => {
    projectApi.list(1, 100)
      .then((res) => {
        const items = res.data.data?.items || []
        setProjects(items)
        setProjectId(prev => prev || items[0]?.id || null)
      })
      .catch(error => showApiError(error, '加载项目列表失败'))
  }, [])

  const loadConversations = useCallback((silent = false) => {
    if (!projectId) return
    if (!silent) setConversationLoading(true)
    conversationApi.list(projectId, 1, 100)
      .then((res) => {
        setConversations(res.data.data?.items || [])
      })
      .catch(error => showApiError(error, '加载对话列表失败'))
      .finally(() => {
        if (!silent) setConversationLoading(false)
      })
  }, [projectId])

  const loadMessages = useCallback((conversation: number, silent = false) => {
    if (!silent) setLoading(true)
    conversationApi.detail(conversation)
      .then((res) => {
        setMessages(res.data.data?.messages || [])
      })
      .catch(error => showApiError(error, '加载对话消息失败'))
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      return
    }
    loadMessages(activeConvId)
  }, [activeConvId, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMsg])

  useEffect(() => {
    if (sending && activeConvId && activeConvId === streamingConvId) {
      updateOnMessageDone(() => {
        loadMessages(activeConvId, true)
        loadConversations(true)
        resetChatState()
      })
    }
  }, [activeConvId, loadConversations, loadMessages, resetChatState, sending, streamingConvId, updateOnMessageDone])

  const handleNewConversation = async () => {
    if (!projectId) {
      antdMessage.warning('请先选择项目')
      return
    }
    try {
      const res = await conversationApi.create(projectId, { title: '新对话' })
      const conv = res.data.data
      setConversations((prev) => [conv, ...prev])
      navigate(`/agent-chat/${conv.id}`)
    } catch (error) {
      showApiError(error, '创建对话失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await conversationApi.delete(id)
      setConversations((prev) => prev.filter((conv) => conv.id !== id))
      if (activeConvId === id) {
        navigate('/agent-chat')
      }
      antdMessage.success('对话已删除')
    } catch (error) {
      showApiError(error, '删除对话失败')
    }
  }

  const handleRefresh = () => {
    loadConversations(true)
    if (activeConvId) {
      loadMessages(activeConvId, true)
    }
  }

  const handleSend = () => {
    if (!activeConvId || !input.trim() || sending) return
    if (!token) {
      antdMessage.warning('登录状态已失效，请重新登录')
      return
    }

    const msg = input.trim()
    setInput('')

    const userMsg: ConversationMessage = {
      id: Date.now(),
      conversationId: activeConvId,
      role: 'USER',
      content: msg,
      toolCallsJson: null,
      toolResultsJson: null,
      modelName: null,
      tokensUsed: null,
      durationMs: null,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    sendMsg(activeConvId, msg, token, () => {
      loadMessages(activeConvId, true)
      loadConversations(true)
      resetChatState()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isStreamingCurrent = Boolean(visibleStreamingMsg && sending)

  return (
    <div className="sl-agent-chat-shell">
      <aside className="sl-agent-chat-sidebar">
        <div className="sl-agent-chat-project">
          <div>
            <span className="sl-kicker">Workspace</span>
            <strong>{selectedProject?.name || '未选择项目'}</strong>
          </div>
          {projects.length > 1 && (
            <Select
              size="small"
              value={projectId}
              onChange={(val) => {
                setProjectId(val)
                navigate('/agent-chat')
              }}
              placeholder="选择项目"
              suffixIcon={<ProjectOutlined />}
              options={projects.map(project => ({ value: project.id, label: project.name }))}
            />
          )}
        </div>

        <div className="sl-agent-chat-sidebar-head">
          <div>
            <Text strong>会话池</Text>
            <small>{conversations.length} 个对话</small>
          </div>
          <div className="sl-agent-chat-sidebar-actions">
            <Tooltip title="刷新">
              <Button type="text" icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
            <Tooltip title="新建对话">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleNewConversation} />
            </Tooltip>
          </div>
        </div>

        <div className="sl-agent-chat-conversation-list">
          {conversationLoading ? (
            <div className="sl-agent-chat-loading"><Spin /></div>
          ) : conversations.length === 0 ? (
            <Empty description="暂无对话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                active={activeConvId === conv.id}
                onSelect={() => navigate(`/agent-chat/${conv.id}`)}
                onDelete={() => handleDelete(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      <main className="sl-agent-chat-main">
        <section className="sl-agent-chat-thread-panel">
          <div className="sl-agent-chat-thread-head">
            <div>
              <div className="sl-agent-chat-title-row">
                <MessageOutlined />
                <h1>{selectedConversation?.title || '代码理解会话'}</h1>
              </div>
              <div className="sl-agent-chat-meta">
                <Tag color={activeConvId ? 'blue' : 'default'}>{activeConvId ? `Conv #${activeConvId}` : '未选择会话'}</Tag>
                {selectedConversation?.agentTaskId && <Tag color="purple">Agent Task #{selectedConversation.agentTaskId}</Tag>}
                {isStreamingCurrent ? <Tag color="processing" icon={<SyncOutlined spin />}>生成中</Tag> : <Tag color="default">待输入</Tag>}
              </div>
            </div>
            <div className="sl-agent-chat-head-actions">
              {isStreamingCurrent && (
                <Button danger icon={<StopOutlined />} onClick={abortStream}>
                  停止
                </Button>
              )}
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
            </div>
          </div>

          {!activeConvId ? (
            <div className="sl-agent-chat-empty">
              <Empty description="选择或创建一个对话开始" />
            </div>
          ) : (
            <>
              <div className="sl-agent-chat-thread">
                {loading ? (
                  <div className="sl-agent-chat-loading"><Spin /></div>
                ) : messages.length === 0 && !visibleStreamingMsg ? (
                  <div className="sl-agent-chat-empty">
                    <Empty description="发送第一条问题" />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {visibleStreamingMsg && <StreamingBubble msg={visibleStreamingMsg} />}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="sl-agent-chat-composer">
                <div className="sl-agent-chat-suggestions">
                  {QUICK_PROMPTS.map(prompt => (
                    <button key={prompt} type="button" onClick={() => setInput(prompt)} disabled={sending}>
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="sl-agent-chat-input-row">
                  <Input.TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="询问仓库结构、调用链、风险根因或修复方向"
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    disabled={sending}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={sending}
                    disabled={!input.trim()}
                  >
                    发送
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>

        <ContextRail
          selectedConversation={selectedConversation}
          messageStats={messageStats}
          toolStats={toolStats}
          streaming={isStreamingCurrent}
        />
      </main>
    </div>
  )
}

function ConversationListItem({
  conversation,
  active,
  onSelect,
  onDelete,
}: {
  conversation: Conversation
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`sl-agent-chat-conversation ${active ? 'sl-agent-chat-conversation-active' : ''}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSelect()
      }}
    >
      <div className="sl-agent-chat-conversation-copy">
        <div>
          <MessageOutlined />
          <strong>{conversation.title || '新对话'}</strong>
        </div>
        <small>{formatDateTime(conversation.updatedAt)}</small>
      </div>
      <Popconfirm title="删除该对话？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={onDelete}>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={(event) => event.stopPropagation()}
        />
      </Popconfirm>
    </div>
  )
}

function ContextRail({
  selectedConversation,
  messageStats,
  toolStats,
  streaming,
}: {
  selectedConversation: Conversation | null
  messageStats: ReturnType<typeof buildMessageStats>
  toolStats: ToolAuditStats
  streaming: boolean
}) {
  const healthTone = toolStats.failed > 0 ? 'danger' : toolStats.writeOrExec > 0 ? 'warning' : selectedConversation ? 'ready' : 'idle'

  return (
    <aside className="sl-agent-chat-context">
      <section className={`sl-agent-chat-health sl-agent-chat-health-${healthTone}`}>
        <div className="sl-agent-chat-health-head">
          <SafetyCertificateOutlined />
          <div>
            <span>会话健康</span>
            <strong>{healthLabel(healthTone, streaming)}</strong>
          </div>
        </div>
        <p>
          {selectedConversation
            ? '当前会话以只读代码理解为默认边界，工具调用会被结构化展示。'
            : '先选择或创建会话，再进入代码理解流程。'}
        </p>
      </section>

      <section className="sl-agent-chat-context-card">
        <div className="sl-agent-chat-context-title">
          <AuditOutlined />
          <span>审计摘要</span>
        </div>
        <div className="sl-agent-chat-stat-grid">
          <AgentChatStat icon={<MessageOutlined />} label="消息" value={messageStats.visibleMessages} />
          <AgentChatStat icon={<RobotOutlined />} label="Assistant" value={messageStats.assistantMessages} />
          <AgentChatStat icon={<ApiOutlined />} label="工具调用" value={toolStats.total} />
          <AgentChatStat icon={<WarningOutlined />} label="异常" value={toolStats.failed} tone={toolStats.failed > 0 ? 'danger' : 'ready'} />
        </div>
      </section>

      <section className="sl-agent-chat-context-card">
        <div className="sl-agent-chat-context-title">
          <FileSearchOutlined />
          <span>上下文状态</span>
        </div>
        <div className="sl-agent-chat-check-list">
          <div>
            <CheckCircleOutlined />
            <span>扫描产物优先</span>
          </div>
          <div>
            <CheckCircleOutlined />
            <span>代码切片检索</span>
          </div>
          <div className={toolStats.writeOrExec > 0 ? 'sl-agent-chat-check-warning' : ''}>
            {toolStats.writeOrExec > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
            <span>写入/命令工具 {toolStats.writeOrExec > 0 ? '已出现' : '默认收敛'}</span>
          </div>
        </div>
      </section>

      {toolStats.failed > 0 && (
        <Alert
          type="warning"
          showIcon
          message="存在失败工具调用"
          description="建议优先查看失败调用参数与返回内容，再继续追问或生成修复任务。"
        />
      )}
    </aside>
  )
}

function AgentChatStat({ icon, label, value, tone = 'idle' }: { icon: ReactNode; label: string; value: number; tone?: 'ready' | 'danger' | 'idle' }) {
  return (
    <div className={`sl-agent-chat-stat sl-agent-chat-stat-${tone}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ConversationMessage }) {
  const isUser = msg.role === 'USER'
  const isTool = msg.role === 'TOOL'

  if (isTool) {
    return null
  }

  const toolCalls = normalizePersistedToolCalls(msg.toolCallsJson)
  const toolResults = normalizePersistedToolResults(msg.toolResultsJson)

  return (
    <div className={`sl-agent-chat-row ${isUser ? 'sl-agent-chat-row-user' : 'sl-agent-chat-row-assistant'}`}>
      <div className="sl-agent-chat-message">
        <div className={`sl-agent-chat-avatar ${isUser ? 'sl-agent-chat-avatar-user' : 'sl-agent-chat-avatar-assistant'}`}>
          {isUser ? <UserOutlined /> : <RobotOutlined />}
        </div>
        <div className="sl-agent-chat-message-body">
          <div className={`sl-agent-chat-bubble ${isUser ? 'sl-agent-chat-bubble-user' : 'sl-agent-chat-bubble-assistant'}`}>
            <div className="sl-agent-chat-bubble-head">
              <span>{isUser ? '你' : 'SourceLens Agent'}</span>
              <small>{formatDateTime(msg.createdAt)}</small>
            </div>
            <div className="sl-agent-chat-content">{msg.content || ''}</div>
            {msg.errorMessage && <Tag color="error">{msg.errorMessage}</Tag>}
          </div>
          {toolCalls.length > 0 && (
            <div className="sl-agent-chat-tool-stack">
              {toolCalls.map((toolCall, idx) => {
                const result = toolResults.find(item => item.id === toolCall.id)
                return (
                  <AgentToolCall
                    key={toolCall.id || idx}
                    name={toolCall.name}
                    arguments={toolCall.arguments}
                    result={result?.content || null}
                    success={result?.success}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StreamingBubble({ msg }: { msg: StreamingMessage }) {
  return (
    <div className="sl-agent-chat-row sl-agent-chat-row-assistant">
      <div className="sl-agent-chat-message">
        <div className="sl-agent-chat-avatar sl-agent-chat-avatar-assistant">
          <RobotOutlined />
        </div>
        <div className="sl-agent-chat-message-body">
          <div className="sl-agent-chat-streaming-line">
            <Badge status={msg.status === 'error' ? 'error' : 'processing'} />
            <span>{msg.round ? `思考中，第 ${msg.round} 轮` : '正在生成回答'}</span>
          </div>
          {msg.content ? (
            <div className="sl-agent-chat-bubble sl-agent-chat-bubble-assistant">
              <div className="sl-agent-chat-content">
                {msg.content}
                {msg.status === 'streaming' && <span className="cursor-blink">|</span>}
              </div>
            </div>
          ) : (
            <div className="sl-agent-chat-thinking">
              <Spin size="small" />
              <Text type="secondary">模型正在读取上下文</Text>
            </div>
          )}
          {msg.toolCalls.length > 0 && (
            <div className="sl-agent-chat-tool-stack">
              {msg.toolCalls.map((toolCall, idx) => {
                const result = msg.toolResults.find((item) => item.id === toolCall.id)
                return (
                  <AgentToolCall
                    key={toolCall.id || idx}
                    name={toolCall.name}
                    arguments={toolCall.arguments}
                    result={result?.content || null}
                    success={result?.success}
                  />
                )
              })}
            </div>
          )}
          {msg.status === 'error' && <Tag color="error">生成失败</Tag>}
        </div>
      </div>
    </div>
  )
}

function buildMessageStats(messages: ConversationMessage[], streamingMsg: StreamingMessage | null) {
  const visibleMessages = messages.filter(msg => msg.role !== 'TOOL').length + (streamingMsg ? 1 : 0)
  const assistantMessages = messages.filter(msg => msg.role === 'ASSISTANT').length + (streamingMsg ? 1 : 0)
  const userMessages = messages.filter(msg => msg.role === 'USER').length
  return { visibleMessages, assistantMessages, userMessages }
}

function buildToolAuditStats(messages: ConversationMessage[], streamingMsg: StreamingMessage | null): ToolAuditStats {
  const persistedCalls = messages.flatMap(msg => normalizePersistedToolCalls(msg.toolCallsJson))
  const persistedResults = messages.flatMap(msg => normalizePersistedToolResults(msg.toolResultsJson))
  const streamingCalls = streamingMsg?.toolCalls.map(call => ({ id: call.id, name: call.name, arguments: call.arguments })) || []
  const streamingResults = streamingMsg?.toolResults.map(result => ({ id: result.id, content: result.content, success: result.success })) || []
  const calls = [...persistedCalls, ...streamingCalls]
  const results = [...persistedResults, ...streamingResults]
  return {
    total: calls.length,
    failed: results.filter(result => result.success === false).length,
    writeOrExec: calls.filter(call => call.name === 'write_file' || call.name === 'shell_exec').length,
  }
}

function normalizePersistedToolCalls(value: string | null): ToolCallView[] {
  return parseJsonArray<unknown>(value).map((item, index) => {
    const record = asRecord(item)
    const fn = asRecord(record.function)
    return {
      id: String(record.id || `tool-${index}`),
      name: String(fn.name || record.name || 'unknown'),
      arguments: normalizeToolArguments(fn.arguments || record.arguments),
    }
  })
}

function normalizePersistedToolResults(value: string | null): ToolResultView[] {
  return parseJsonArray<unknown>(value).map((item, index) => {
    const record = asRecord(item)
    const content = String(record.content || record.result || '')
    const explicitSuccess = typeof record.success === 'boolean' ? record.success : undefined
    return {
      id: String(record.tool_call_id || record.id || `tool-${index}`),
      content,
      success: explicitSuccess ?? !content.startsWith('Error:'),
    }
  })
}

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeToolArguments(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return asRecord(parsed)
    } catch {
      return { raw: value }
    }
  }
  return asRecord(value)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function healthLabel(tone: 'ready' | 'warning' | 'danger' | 'idle', streaming: boolean) {
  if (streaming) return '生成中'
  if (tone === 'danger') return '需复核'
  if (tone === 'warning') return '有高权限工具'
  if (tone === 'ready') return '可继续'
  return '未开始'
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}
