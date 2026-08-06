import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Alert, Badge, Drawer, Input, Popconfirm, Select, Tag, Typography, message as antdMessage } from 'antd'
import {
  ApiOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  MenuOutlined,
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
import { agentTaskApi, AgentTask } from '../api/agentTask'
import { projectApi } from '../api/project'
import { formatApiError } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import AgentToolCall from '../components/AgentToolCall'
import ActionButton from '../components/ui/ActionButton'
import IconActionButton from '../components/ui/IconActionButton'
import StateBlock from '../components/ui/StateBlock'
import { redactSensitiveText } from '../utils/displayRedaction'

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

interface ToolEvidenceSummary {
  label: string
  failed: number
  writeOrExec: number
}

interface CodeUnderstandingHandoff {
  key: string
  projectId: number | null
  scanTaskId: number | null
  prompt: string
  source: string
  inputKind: string
  inputLabel: string
  sourceLabel: string
  filePath: string
  lineRef: string
  contextRole: string
  evidenceType: string
  relevanceScore: string
}

type AgentChatClosureGateTone = 'ready' | 'warning' | 'danger' | 'idle'

interface AgentChatClosureGateCheck {
  label: string
  status: string
  reason: string
  tone: AgentChatClosureGateTone
}

interface AgentChatClosureGate {
  title: string
  status: string
  description: string
  tone: AgentChatClosureGateTone
  checks: AgentChatClosureGateCheck[]
}

type AgentChatTrustLoopTone = 'ready' | 'warning' | 'danger' | 'idle'

interface AgentChatTrustLoopStep {
  key: string
  icon: ReactNode
  title: string
  status: string
  description: string
  tone: AgentChatTrustLoopTone
  actionLabel?: string
  targetUrl?: string
}

type AgentChatViewState = 'INITIAL_LOADING' | 'FATAL_LOAD' | 'STREAMING' | 'STALE_REFRESH' | 'EMPTY' | 'READY'
type AgentChatRefreshScope = 'projects' | 'conversations' | 'messages'

const AGENT_CHAT_STATE_LABELS: Record<AgentChatViewState, string> = {
  INITIAL_LOADING: '初始加载中',
  FATAL_LOAD: '加载失败',
  STREAMING: '生成中',
  STALE_REFRESH: '上下文已陈旧',
  EMPTY: '等待输入',
  READY: '上下文已就绪',
}

interface AgentChatStaleRefresh {
  scope: AgentChatRefreshScope
  ownerId: number | null
  message: string
}

type AgentChatStaleRefreshMap = Partial<Record<AgentChatRefreshScope, AgentChatStaleRefresh>>

export default function AgentChat() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { token } = useAuth()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([])
  const [projectSnapshotReady, setProjectSnapshotReady] = useState(false)
  const [conversationSnapshotProjectId, setConversationSnapshotProjectId] = useState<number | null>(null)
  const [messageSnapshotConversationId, setMessageSnapshotConversationId] = useState<number | null>(null)
  const [staleRefreshes, setStaleRefreshes] = useState<AgentChatStaleRefreshMap>({})
  const [projectListError, setProjectListError] = useState<string | null>(null)
  const [conversationListError, setConversationListError] = useState<string | null>(null)
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [closureTask, setClosureTask] = useState<AgentTask | null>(null)
  const [closureTaskLoading, setClosureTaskLoading] = useState(false)
  const [closureTaskError, setClosureTaskError] = useState<string | null>(null)
  const [handoffTaskCreating, setHandoffTaskCreating] = useState(false)
  const [handoffTaskError, setHandoffTaskError] = useState<string | null>(null)
  const [isThreadFirstLayout, setIsThreadFirstLayout] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1200px)').matches
  ))
  const [conversationDrawerOpen, setConversationDrawerOpen] = useState(false)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const handoffDraftAppliedRef = useRef<string | null>(null)
  const activeConversationRef = useRef<number | null>(null)
  const projectIdRef = useRef<number | null>(null)
  const projectSnapshotReadyRef = useRef(false)
  const conversationSnapshotProjectRef = useRef<number | null>(null)
  const messageSnapshotConversationRef = useRef<number | null>(null)
  const latestProjectsRequestRef = useRef(0)
  const latestConversationsRequestRef = useRef(0)
  const latestMessagesRequestRef = useRef(0)

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
  const auditProjectId = selectedConversation?.projectId || null
  const codeUnderstandingHandoff = useMemo(() => parseCodeUnderstandingHandoff(searchParams), [searchParams])

  const clearStaleRefresh = useCallback((scope: AgentChatRefreshScope, ownerId?: number | null) => {
    setStaleRefreshes(prev => {
      const current = prev[scope]
      if (!current || (ownerId !== undefined && current.ownerId !== ownerId)) return prev
      const next = { ...prev }
      delete next[scope]
      return next
    })
  }, [])

  const markStaleRefresh = useCallback((refresh: AgentChatStaleRefresh) => {
    setStaleRefreshes(prev => ({ ...prev, [refresh.scope]: refresh }))
  }, [])

  const applyProjectId = useCallback((nextProjectId: number | null, invalidateMessages = false) => {
    if (projectIdRef.current === nextProjectId) return
    projectIdRef.current = nextProjectId
    latestConversationsRequestRef.current += 1
    conversationSnapshotProjectRef.current = null
    setConversationSnapshotProjectId(null)
    setConversationListError(null)
    setConversationLoading(Boolean(nextProjectId))
    setConversations([])
    if (invalidateMessages) {
      latestMessagesRequestRef.current += 1
      messageSnapshotConversationRef.current = null
      setMessageSnapshotConversationId(null)
      setMessagesError(null)
      setLoading(false)
      setMessages([])
    }
    setProjectId(nextProjectId)
  }, [])

  const messageStats = useMemo(() => buildMessageStats(messages, visibleStreamingMsg), [messages, visibleStreamingMsg])
  const toolStats = useMemo(() => buildToolAuditStats(messages, visibleStreamingMsg), [messages, visibleStreamingMsg])
  const agentTrustLoopSteps = useMemo<AgentChatTrustLoopStep[]>(() => {
    const projectReady = Boolean(projectSnapshotReady && projectId)
    const evidenceReady = Boolean(codeUnderstandingHandoff || messageStats.visibleMessages > 0)
    const auditReady = Boolean(auditProjectId && activeConvId)
    const taskReady = Boolean(selectedConversation?.agentTaskId)

    return [
      {
        key: 'project-context',
        icon: <ProjectOutlined />,
        title: '项目上下文',
        status: projectReady ? selectedProject?.name || `Project #${projectId}` : '未选择项目',
        description: projectReady ? '对话、工具审计和任务闭环都限定在当前项目内。' : '先选择项目，避免跨仓库上下文污染。',
        tone: projectReady ? 'ready' : 'idle',
        actionLabel: '打开项目',
        targetUrl: projectId ? `/projects/${projectId}` : undefined,
      },
      {
        key: 'evidence-input',
        icon: <FileSearchOutlined />,
        title: '证据输入',
        status: codeUnderstandingHandoff
          ? '代码理解交接包已接收'
          : evidenceReady
            ? `${messageStats.visibleMessages} 条上下文消息`
            : '等待问题或交接包',
        description: codeUnderstandingHandoff
          ? '当前输入来自结构化 handoff，未携带 raw prompt、源码正文或 stack。'
          : evidenceReady
            ? '会话已有上下文，继续追问前应复核证据来源。'
            : '建议从扫描报告、代码切片或明确文件位置开始。',
        tone: codeUnderstandingHandoff ? 'ready' : evidenceReady ? 'warning' : 'idle',
      },
      {
        key: 'tool-audit',
        icon: <AuditOutlined />,
        title: '工具审计',
        status: auditReady ? `${toolStats.total} 次工具调用` : '等待会话',
        description: toolStats.failed > 0
          ? `${toolStats.failed} 次失败调用需要先复核。`
          : toolStats.writeOrExec > 0
            ? `${toolStats.writeOrExec} 次写入/命令工具需要人工复核。`
            : auditReady
              ? '审计入口已绑定当前 conversationId。'
              : '选择会话后才能按 conversationId 过滤工具调用。',
        tone: toolStats.failed > 0 ? 'danger' : toolStats.writeOrExec > 0 ? 'warning' : auditReady ? 'ready' : 'idle',
        actionLabel: '查看审计',
        targetUrl: auditReady && auditProjectId && activeConvId ? agentToolAuditUrl(auditProjectId, activeConvId) : undefined,
      },
      {
        key: 'closure-task',
        icon: <RobotOutlined />,
        title: '闭环任务',
        status: closureTaskLoading
          ? '任务加载中'
          : closureTaskError
            ? '任务加载失败'
            : taskReady
              ? `AgentTask #${selectedConversation?.agentTaskId}`
              : '未绑定 AgentTask',
        description: closureTaskError
          ? '任务详情不可用时不能宣称报告闭环完整。'
          : taskReady
            ? closureTask?.scanTaskId
              ? `已绑定 Scan #${closureTask.scanTaskId}，可回跳扫描报告。`
              : '已绑定任务，但扫描报告入口仍未形成。'
            : '需要绑定 AgentTask 才能形成任务、审计、报告闭环。',
        tone: closureTaskError
          ? 'danger'
          : taskReady
            ? closureTask?.scanTaskId ? 'ready' : 'warning'
            : 'idle',
        actionLabel: '打开任务',
        targetUrl: taskReady && auditProjectId && selectedConversation?.agentTaskId
          ? agentTaskDeepLinkUrl(auditProjectId, selectedConversation.agentTaskId)
          : undefined,
      },
    ]
  }, [
    activeConvId,
    auditProjectId,
    closureTask?.scanTaskId,
    closureTaskError,
    closureTaskLoading,
    codeUnderstandingHandoff,
    messageStats.visibleMessages,
    projectId,
    projectSnapshotReady,
    selectedConversation?.agentTaskId,
    selectedProject?.name,
    toolStats.failed,
    toolStats.total,
    toolStats.writeOrExec,
  ])

  useLayoutEffect(() => {
    if (activeConversationRef.current !== activeConvId) {
      latestMessagesRequestRef.current += 1
    }
    activeConversationRef.current = activeConvId
    if (messageSnapshotConversationRef.current !== activeConvId) {
      messageSnapshotConversationRef.current = null
      setMessageSnapshotConversationId(null)
      setMessages([])
      setMessagesError(null)
      setLoading(Boolean(activeConvId))
    }
  }, [activeConvId])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1200px)')
    const sync = () => {
      setIsThreadFirstLayout(media.matches)
      if (!media.matches) setConversationDrawerOpen(false)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!codeUnderstandingHandoff) return
    const sanitizedParams = sanitizeCodeUnderstandingHandoffParams(searchParams)
    if (sanitizedParams) {
      navigate(`${location.pathname}?${sanitizedParams.toString()}`, { replace: true })
      return
    }
    if (codeUnderstandingHandoff.projectId) {
      applyProjectId(codeUnderstandingHandoff.projectId, true)
    }
    if (handoffDraftAppliedRef.current !== codeUnderstandingHandoff.key) {
      setInput(codeUnderstandingHandoff.prompt)
      handoffDraftAppliedRef.current = codeUnderstandingHandoff.key
    }
  }, [applyProjectId, codeUnderstandingHandoff, location.pathname, navigate, searchParams])

  const loadClosureTask = useCallback((taskId: number, shouldApply: () => boolean = () => true) => {
    setClosureTask(null)
    setClosureTaskError(null)
    setClosureTaskLoading(true)
    agentTaskApi.detail(taskId)
      .then(res => {
        if (shouldApply()) setClosureTask(res.data.data || null)
      })
      .catch(error => {
        if (shouldApply()) {
          setClosureTaskError(redactAgentChatApiError(error, '加载 Agent 任务闭环失败'))
          showRedactedAgentChatApiError(error, '加载 Agent 任务闭环失败')
        }
      })
      .finally(() => {
        if (shouldApply()) setClosureTaskLoading(false)
      })
  }, [])

  useEffect(() => {
    const taskId = selectedConversation?.agentTaskId
    if (!taskId) {
      setClosureTask(null)
      setClosureTaskError(null)
      setClosureTaskLoading(false)
      return
    }
    let cancelled = false
    loadClosureTask(taskId, () => !cancelled)
    return () => {
      cancelled = true
    }
  }, [loadClosureTask, selectedConversation?.agentTaskId])

  const handleRetryClosureTask = useCallback(() => {
    const taskId = selectedConversation?.agentTaskId
    if (!taskId) return
    loadClosureTask(taskId)
  }, [loadClosureTask, selectedConversation?.agentTaskId])

  const loadProjects = useCallback((silent = false) => {
    const requestGeneration = latestProjectsRequestRef.current + 1
    latestProjectsRequestRef.current = requestGeneration
    const shouldApply = () => latestProjectsRequestRef.current === requestGeneration
    const hasTrustedSnapshot = projectSnapshotReadyRef.current
    if (!hasTrustedSnapshot) {
      setProjectLoading(true)
      setProjectListError(null)
    } else if (!silent) {
      setProjectListError(null)
    }
    projectApi.list(1, 100)
      .then((res) => {
        if (!shouldApply()) return
        const items = res.data.data?.items || []
        setProjects(items)
        projectSnapshotReadyRef.current = true
        setProjectSnapshotReady(true)
        const previousProjectId = projectIdRef.current
        const retainedProjectId = items.some(item => item.id === projectIdRef.current)
          ? projectIdRef.current
          : null
        const projectWasRemoved = Boolean(previousProjectId && !retainedProjectId)
        applyProjectId(retainedProjectId || items[0]?.id || null, projectWasRemoved)
        if (projectWasRemoved && activeConversationRef.current) {
          navigate('/agent-chat', { replace: true })
        }
        setProjectListError(null)
        clearStaleRefresh('projects')
      })
      .catch(error => {
        if (!shouldApply()) return
        const errorText = redactAgentChatApiError(error, '加载项目列表失败')
        if (projectSnapshotReadyRef.current) {
          setProjectListError(null)
          markStaleRefresh({ scope: 'projects', ownerId: null, message: errorText })
        } else {
          setProjectListError(errorText)
        }
        showRedactedAgentChatApiError(error, '加载项目列表失败')
      })
      .finally(() => {
        if (shouldApply()) setProjectLoading(false)
      })
  }, [applyProjectId, clearStaleRefresh, markStaleRefresh, navigate])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const loadConversations = useCallback((silent = false) => {
    const targetProjectId = projectId
    if (!targetProjectId) return
    const requestGeneration = latestConversationsRequestRef.current + 1
    latestConversationsRequestRef.current = requestGeneration
    const shouldApply = () => (
      latestConversationsRequestRef.current === requestGeneration
      && projectIdRef.current === targetProjectId
    )
    const hasTrustedSnapshot = conversationSnapshotProjectRef.current === targetProjectId
    if (!hasTrustedSnapshot) {
      conversationSnapshotProjectRef.current = null
      setConversationSnapshotProjectId(null)
      setConversationListError(null)
      setConversationLoading(true)
      setConversations([])
    } else if (!silent) {
      setConversationListError(null)
    }
    conversationApi.list(targetProjectId, 1, 100)
      .then((res) => {
        if (!shouldApply()) return
        const items = res.data.data?.items || []
        if (items.some(item => item.projectId !== targetProjectId)) {
          throw new Error('会话列表响应与当前项目不匹配')
        }
        setConversations(items)
        conversationSnapshotProjectRef.current = targetProjectId
        setConversationSnapshotProjectId(targetProjectId)
        setConversationListError(null)
        clearStaleRefresh('conversations', targetProjectId)
      })
      .catch(error => {
        if (!shouldApply()) return
        const errorText = redactAgentChatApiError(error, '加载对话列表失败')
        if (conversationSnapshotProjectRef.current === targetProjectId) {
          setConversationListError(null)
          markStaleRefresh({ scope: 'conversations', ownerId: targetProjectId, message: errorText })
        } else {
          setConversationListError(errorText)
        }
        showRedactedAgentChatApiError(error, '加载对话列表失败')
      })
      .finally(() => {
        if (shouldApply()) setConversationLoading(false)
      })
  }, [clearStaleRefresh, markStaleRefresh, projectId])

  const loadMessages = useCallback((conversation: number, silent = false) => {
    const requestGeneration = latestMessagesRequestRef.current + 1
    latestMessagesRequestRef.current = requestGeneration
    const shouldApply = () => (
      latestMessagesRequestRef.current === requestGeneration
      && activeConversationRef.current === conversation
    )
    const hasTrustedSnapshot = messageSnapshotConversationRef.current === conversation
    if (!hasTrustedSnapshot) {
      messageSnapshotConversationRef.current = null
      setMessageSnapshotConversationId(null)
      setMessagesError(null)
      setMessages([])
      setLoading(true)
    } else if (!silent) {
      setMessagesError(null)
    }
    conversationApi.detail(conversation)
      .then((res) => {
        if (!shouldApply()) return
        const detail = res.data.data
        if (!detail?.conversation || detail.conversation.id !== conversation) {
          throw new Error('对话响应与当前请求不匹配')
        }
        const nextMessages = detail.messages || []
        if (nextMessages.some(message => message.conversationId !== conversation)) {
          throw new Error('消息响应与当前会话不匹配')
        }
        applyProjectId(detail.conversation.projectId)
        setConversations(prev => prev.some(item => item.id === detail.conversation.id) ? prev : [detail.conversation, ...prev])
        setMessages(nextMessages)
        messageSnapshotConversationRef.current = conversation
        setMessageSnapshotConversationId(conversation)
        setMessagesError(null)
        clearStaleRefresh('messages', conversation)
      })
      .catch(error => {
        if (!shouldApply()) return
        const errorText = redactAgentChatApiError(error, '加载对话消息失败')
        if (messageSnapshotConversationRef.current === conversation) {
          setMessagesError(null)
          markStaleRefresh({ scope: 'messages', ownerId: conversation, message: errorText })
        } else {
          setMessages([])
          setMessagesError(errorText)
        }
        showRedactedAgentChatApiError(error, '加载对话消息失败')
      })
      .finally(() => {
        if (shouldApply()) setLoading(false)
      })
  }, [applyProjectId, clearStaleRefresh, markStaleRefresh])

  useEffect(() => {
    if (!projectId) {
      latestConversationsRequestRef.current += 1
      setConversationLoading(false)
      return
    }
    loadConversations()
  }, [loadConversations, projectId])

  useEffect(() => {
    if (!activeConvId) {
      latestMessagesRequestRef.current += 1
      messageSnapshotConversationRef.current = null
      setMessageSnapshotConversationId(null)
      setMessages([])
      setMessagesError(null)
      setLoading(false)
      return
    }
    loadMessages(activeConvId)
  }, [activeConvId, loadMessages])

  useEffect(() => {
    const messageContainer = messagesScrollRef.current
    if (!messageContainer) return
    const frame = window.requestAnimationFrame(() => {
      messageContainer.scrollTo({ top: messageContainer.scrollHeight, behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages, visibleStreamingMsg])

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
      const title = codeUnderstandingHandoff
        ? `代码理解：${redactAgentChatText(codeUnderstandingHandoff.sourceLabel)} ${redactAgentChatText(codeUnderstandingHandoff.lineRef)}`
        : '新对话'
      const res = await conversationApi.create(projectId, { title })
      const conv = res.data.data
      setConversations((prev) => prev.some(item => item.id === conv.id)
        ? prev.map(item => item.id === conv.id ? conv : item)
        : [conv, ...prev])
      setConversationDrawerOpen(false)
      navigate(`/agent-chat/${conv.id}`)
    } catch (error) {
      showRedactedAgentChatApiError(error, '创建对话失败')
    }
  }

  const handleCreateHandoffAgentTask = async () => {
    if (!codeUnderstandingHandoff) return
    const targetProjectId = codeUnderstandingHandoff.projectId || projectId
    if (!targetProjectId) {
      antdMessage.warning('请先选择项目')
      return
    }
    if (!codeUnderstandingHandoff.scanTaskId) {
      setHandoffTaskError('缺少成功扫描任务，暂不能创建绑定 AgentTask。')
      return
    }

    setHandoffTaskCreating(true)
    setHandoffTaskError(null)
    try {
      const title = `代码理解：${redactAgentChatText(codeUnderstandingHandoff.sourceLabel)} ${redactAgentChatText(codeUnderstandingHandoff.lineRef)}`
      let targetConversationId = activeConvId || null
      if (!targetConversationId) {
        const conversationRes = await conversationApi.create(targetProjectId, { title })
        const conversation = conversationRes.data.data
        setConversations((prev) => prev.some(item => item.id === conversation.id)
          ? prev.map(item => item.id === conversation.id ? conversation : item)
          : [conversation, ...prev])
        targetConversationId = conversation.id
      }
      const receipt = {
        handoffType: 'CODE_UNDERSTANDING',
        source: codeUnderstandingHandoff.source,
        inputKind: codeUnderstandingHandoff.inputKind,
        inputLabel: codeUnderstandingHandoff.inputLabel,
        sourceLabel: codeUnderstandingHandoff.sourceLabel,
        filePath: codeUnderstandingHandoff.filePath,
        lineRef: codeUnderstandingHandoff.lineRef,
        contextRole: codeUnderstandingHandoff.contextRole,
        evidenceType: codeUnderstandingHandoff.evidenceType,
        relevanceScore: codeUnderstandingHandoff.relevanceScore,
        rawPromptStored: false,
        rawStackStored: false,
        autoSent: false,
        autoStarted: false,
      }
      const res = await agentTaskApi.create({
        projectId: targetProjectId,
        scanTaskId: codeUnderstandingHandoff.scanTaskId,
        conversationId: targetConversationId,
        taskType: 'CUSTOM',
        title,
        description: '由 Project QA 代码理解证据交接创建的受控 AgentTask 草稿。',
        priority: 'MEDIUM',
        inputJson: JSON.stringify(receipt),
      })
      const task = res.data.data
      setClosureTask(task)
      if (task?.conversationId) {
        setConversations(prev => prev.map(conv => conv.id === task.conversationId ? { ...conv, agentTaskId: task.id } : conv))
        navigate(`/agent-chat/${task.conversationId}`)
      }
      setInput(codeUnderstandingHandoff.prompt)
      loadConversations(true)
      antdMessage.success('已创建并绑定 AgentTask，草稿仍需手动发送')
    } catch (error) {
      const errorText = redactAgentChatApiError(error, '创建绑定 AgentTask 失败')
      setHandoffTaskError(errorText)
      showRedactedAgentChatApiError(error, '创建绑定 AgentTask 失败')
    } finally {
      setHandoffTaskCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await conversationApi.delete(id)
      setConversations((prev) => prev.filter((conv) => conv.id !== id))
      if (activeConvId === id) {
        activeConversationRef.current = null
        latestMessagesRequestRef.current += 1
        navigate('/agent-chat')
      }
      antdMessage.success('对话已删除')
    } catch (error) {
      showRedactedAgentChatApiError(error, '删除对话失败')
    }
  }

  const hasTrustedConversations = Boolean(projectId && conversationSnapshotProjectId === projectId)
  const hasTrustedMessages = Boolean(activeConvId && messageSnapshotConversationId === activeConvId)
  const streamFailedCurrent = Boolean(visibleStreamingMsg?.status === 'error' && !sending)
  const relevantStaleRefreshes = Object.values(staleRefreshes)
    .filter((refresh): refresh is AgentChatStaleRefresh => Boolean(refresh))
    .filter(refresh => (
      refresh.scope === 'projects'
      || (refresh.scope === 'conversations' && refresh.ownerId === projectId)
      || (refresh.scope === 'messages' && refresh.ownerId === activeConvId)
    ))
  const hasFatalLoad = Boolean(
    (!projectSnapshotReady && projectListError)
    || (projectId && !hasTrustedConversations && conversationListError)
    || (activeConvId && !hasTrustedMessages && messagesError)
  )
  const hasUnconfirmedSnapshot = Boolean(
    !projectSnapshotReady
    || (projectId && !hasTrustedConversations)
    || (activeConvId && !hasTrustedMessages)
  )
  const isInitialLoading = !hasFatalLoad && (projectLoading || hasUnconfirmedSnapshot)
  const hasStaleContext = relevantStaleRefreshes.length > 0 || streamFailedCurrent
  const isStreamingCurrent = Boolean(sending && activeConvId && activeConvId === streamingConvId)
  const isStreamingElsewhere = Boolean(sending && streamingConvId && activeConvId !== streamingConvId)

  let viewState: AgentChatViewState
  if (isInitialLoading) {
    viewState = 'INITIAL_LOADING'
  } else if (hasFatalLoad) {
    viewState = 'FATAL_LOAD'
  } else if (sending) {
    viewState = 'STREAMING'
  } else if (hasStaleContext) {
    viewState = 'STALE_REFRESH'
  } else if (!activeConvId || !hasTrustedMessages || (messages.length === 0 && !visibleStreamingMsg)) {
    viewState = 'EMPTY'
  } else {
    viewState = 'READY'
  }

  const canCompose = Boolean(activeConvId && (viewState === 'EMPTY' || viewState === 'READY'))
  const composerLockReason = viewState === 'INITIAL_LOADING'
    ? '正在确认可信快照，暂不可发送。'
    : viewState === 'FATAL_LOAD'
      ? '当前没有可信上下文，请先重试加载。'
      : viewState === 'STREAMING'
        ? isStreamingElsewhere
          ? `Conv #${streamingConvId} 正在生成，停止后才能在当前会话发送。`
          : '当前回复正在生成，可停止后继续提问。'
        : viewState === 'STALE_REFRESH'
          ? '上下文可能已陈旧，请重新同步后再发送。'
          : ''

  const handleRefresh = () => {
    loadProjects(true)
    loadConversations(true)
    if (activeConvId) {
      loadMessages(activeConvId, true)
    }
  }

  const handleFatalRetry = () => {
    if (!projectSnapshotReady) {
      loadProjects()
    }
    if (projectId && !hasTrustedConversations) loadConversations()
    if (activeConvId && !hasTrustedMessages) loadMessages(activeConvId)
  }

  const handleStaleResync = () => {
    const staleScopes = new Set(relevantStaleRefreshes.map(refresh => refresh.scope))
    if (streamFailedCurrent && activeConvId) {
      markStaleRefresh({ scope: 'messages', ownerId: activeConvId, message: '生成失败，消息上下文需要重新同步。' })
      staleScopes.add('messages')
      resetChatState()
    }
    if (staleScopes.has('projects')) loadProjects(true)
    if (staleScopes.has('conversations') && projectId) loadConversations(true)
    if (staleScopes.has('messages') && activeConvId) loadMessages(activeConvId, true)
  }

  const handleSend = () => {
    if (!activeConvId || !input.trim() || !canCompose) return
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

  const conversationSidebar = (
    <aside id="agent-chat-conversation-pool" className="sl-agent-chat-sidebar" aria-label="Agent 会话池面板">
      <div className="sl-agent-chat-project">
        {projectListError ? (
          <StateBlock
            compact
            tone="error"
            title="项目列表加载失败"
            description={projectListError}
            action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={() => loadProjects()} label="重试加载" />}
          />
        ) : (
          <>
            <div>
              <span className="sl-kicker">Workspace</span>
              <strong>{selectedProject?.name || '未选择项目'}</strong>
            </div>
            {projects.length > 1 && (
              <Select
                size="small"
                value={projectId}
                onChange={(val) => {
                  applyProjectId(val, true)
                  setConversationDrawerOpen(false)
                  navigate('/agent-chat')
                }}
                placeholder="选择项目"
                suffixIcon={<ProjectOutlined />}
                options={projects.map(project => ({ value: project.id, label: project.name }))}
              />
            )}
          </>
        )}
      </div>

      <div className="sl-agent-chat-sidebar-head">
        <div>
          <Text strong>会话池</Text>
          <small>{conversations.length} 个对话</small>
        </div>
        <div className="sl-agent-chat-sidebar-actions">
          <IconActionButton label="刷新会话池" tooltip="刷新会话池" type="text" icon={<ReloadOutlined />} onClick={handleRefresh} />
          <IconActionButton label="新建对话" tooltip="新建对话" type="primary" icon={<PlusOutlined />} onClick={handleNewConversation} />
        </div>
      </div>

      <div className="sl-agent-chat-conversation-list" role="list" aria-label="会话池">
        {conversationLoading ? (
          <StateBlock compact tone="loading" title="正在加载对话" description="会话池加载完成后会展示历史上下文。" />
        ) : conversationListError ? (
          <StateBlock
            compact
            tone="error"
            title="会话列表加载失败"
            description={conversationListError}
            action={<ActionButton size="small" icon={<ReloadOutlined />} onClick={() => loadConversations()} label="重试加载" />}
          />
        ) : conversations.length === 0 ? (
          <StateBlock compact title="暂无对话" description="新建对话后可以开始基于项目代码提问。" />
        ) : (
          conversations.map((conv) => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              active={activeConvId === conv.id}
              onSelect={() => setConversationDrawerOpen(false)}
              onDelete={() => handleDelete(conv.id)}
            />
          ))
        )}
      </div>
    </aside>
  )

  const trustWorkbench = <AgentChatTrustLoopPanel steps={agentTrustLoopSteps} onNavigate={navigate} />
  const handoffPanel = codeUnderstandingHandoff ? (
    <CodeUnderstandingHandoffPanel
      handoff={codeUnderstandingHandoff}
      activeConversationId={activeConvId}
      binding={handoffTaskCreating}
      error={handoffTaskError}
      onUsePrompt={() => setInput(codeUnderstandingHandoff.prompt)}
      onNewConversation={handleNewConversation}
      onCreateAgentTask={handleCreateHandoffAgentTask}
    />
  ) : null
  const contextRail = (
    <ContextRail
      selectedConversation={selectedConversation}
      closureTask={closureTask}
      closureTaskLoading={closureTaskLoading}
      closureTaskError={closureTaskError}
      messageStats={messageStats}
      toolStats={toolStats}
      streaming={isStreamingCurrent}
      onNavigate={navigate}
      onRetryClosureTask={handleRetryClosureTask}
    />
  )

  return (
    <div
      className="sl-agent-chat-shell"
      data-sl-agent-chat-state={viewState}
      data-sl-agent-chat-project-owner={projectId ?? 'none'}
      data-sl-agent-chat-conversation-owner={conversationSnapshotProjectId ?? 'unconfirmed'}
      data-sl-agent-chat-message-owner={messageSnapshotConversationId ?? 'unconfirmed'}
      data-agent-chat-state={viewState}
      data-agent-chat-project-owner={projectId ?? 'none'}
      data-agent-chat-conversation-owner={conversationSnapshotProjectId ?? 'unconfirmed'}
      data-agent-chat-message-owner={messageSnapshotConversationId ?? 'unconfirmed'}
      data-agent-chat-thread-priority={isThreadFirstLayout ? 'first' : 'desktop-grid'}
    >
      {!isThreadFirstLayout && conversationSidebar}

      <main className="sl-agent-chat-main">
        <section className={`sl-agent-chat-thread-panel ${codeUnderstandingHandoff && !isThreadFirstLayout ? 'sl-agent-chat-thread-panel-handoff' : ''}`}>
          <div className="sl-agent-chat-thread-head">
            <div>
              <div className="sl-agent-chat-title-row">
                <MessageOutlined />
                <h1>{redactAgentChatText(selectedConversation?.title || '代码理解会话')}</h1>
              </div>
              <div className="sl-agent-chat-meta">
                <Tag color={activeConvId ? 'blue' : 'default'}>{activeConvId ? `Conv #${activeConvId}` : '未选择会话'}</Tag>
                {selectedConversation?.agentTaskId && <Tag color="purple">Agent Task #{selectedConversation.agentTaskId}</Tag>}
                <Tag color={viewState === 'STREAMING' ? 'processing' : viewState === 'STALE_REFRESH' || viewState === 'FATAL_LOAD' ? 'error' : 'default'}>
                  {AGENT_CHAT_STATE_LABELS[viewState]}
                </Tag>
              </div>
            </div>
            <div className="sl-agent-chat-head-actions">
              {isThreadFirstLayout && (
                <IconActionButton
                  aria-controls="agent-chat-conversation-pool"
                  aria-expanded={conversationDrawerOpen}
                  label="打开会话池"
                  tooltip="打开会话池"
                  icon={<MenuOutlined />}
                  onClick={() => setConversationDrawerOpen(true)}
                />
              )}
              {(viewState === 'EMPTY' || viewState === 'READY') && (
                <IconActionButton label="刷新当前会话" tooltip="刷新当前会话" icon={<ReloadOutlined />} onClick={handleRefresh} />
              )}
            </div>
          </div>

          <AgentChatStateBanner
            state={viewState}
            activeConversationId={activeConvId}
            streamingConversationId={streamingConvId}
            staleMessage={streamFailedCurrent ? '生成失败，当前消息上下文尚未重新确认。' : relevantStaleRefreshes[0]?.message}
            onFatalRetry={handleFatalRetry}
            onStaleResync={handleStaleResync}
            onStop={abortStream}
          />

          {sending && viewState !== 'STREAMING' && (
            <div className="sl-agent-chat-global-stream-occupancy" role="status" data-agent-chat-global-streaming="true">
              <SyncOutlined spin />
              <span><strong>Conv #{streamingConvId}</strong> 正在生成，当前状态完成确认前仍可在这里停止。</span>
              <ActionButton danger size="small" icon={<StopOutlined />} onClick={abortStream} label="停止生成" />
            </div>
          )}

          {!isThreadFirstLayout && trustWorkbench}
          {!isThreadFirstLayout && handoffPanel}

          {!activeConvId ? (
            <div className="sl-agent-chat-empty">
              <StateBlock
                title="选择或创建一个对话"
                description={isThreadFirstLayout ? '打开会话池选择历史会话，或新建代码理解对话。' : '选择左侧会话，或新建一个代码理解对话。'}
                action={isThreadFirstLayout && hasTrustedConversations ? (
                  <ActionButton
                    data-agent-chat-primary-action="empty-conversation"
                    type="primary"
                    icon={conversations.length > 0 ? <MenuOutlined /> : <PlusOutlined />}
                    onClick={conversations.length > 0 ? () => setConversationDrawerOpen(true) : handleNewConversation}
                    label={conversations.length > 0 ? '选择会话' : '新建对话'}
                  />
                ) : undefined}
              />
            </div>
          ) : (
            <>
              <div className="sl-agent-chat-thread" ref={messagesScrollRef} data-agent-chat-scroll-container="messages">
                {loading && !hasTrustedMessages ? (
                  <StateBlock compact tone="loading" title="正在加载消息" description="历史消息加载完成后会恢复上下文。" />
                ) : messagesError && !hasTrustedMessages ? (
                  <div className="sl-agent-chat-empty">
                    <StateBlock
                      compact
                      tone="error"
                      title="对话消息加载失败"
                      description={messagesError}
                    />
                  </div>
                ) : messages.length === 0 && !visibleStreamingMsg ? (
                  <div className="sl-agent-chat-empty">
                    <StateBlock compact title="发送第一条问题" description="可以从架构、风险、调用链或文件证据开始提问。" />
                  </div>
                ) : (
                  <div
                    className="sl-agent-chat-message-log"
                    role="log"
                    aria-label="Agent 消息流"
                    aria-live="polite"
                    aria-relevant="additions text"
                    aria-busy={isStreamingCurrent}
                  >
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        auditUrl={auditProjectId && activeConvId ? agentToolAuditUrl(auditProjectId, activeConvId) : undefined}
                      />
                    ))}
                    {visibleStreamingMsg && (
                      <StreamingBubble
                        msg={visibleStreamingMsg}
                        auditUrl={auditProjectId && activeConvId ? agentToolAuditUrl(auditProjectId, activeConvId) : undefined}
                      />
                    )}
                    <div data-agent-chat-message-end="true" />
                  </div>
                )}
              </div>

              <div className="sl-agent-chat-composer" data-agent-chat-composer="true">
                {isThreadFirstLayout ? (
                  <Select<string>
                    className="sl-agent-chat-suggestion-select"
                    aria-label="选择快速问题"
                    placeholder="选择快速问题"
                    value={undefined}
                    disabled={!canCompose}
                    onChange={(prompt) => {
                      if (prompt) setInput(prompt)
                    }}
                    options={QUICK_PROMPTS.map(prompt => ({ value: prompt, label: prompt }))}
                  />
                ) : (
                  <div className="sl-agent-chat-suggestions">
                    {QUICK_PROMPTS.map(prompt => (
                      <button key={prompt} type="button" onClick={() => setInput(prompt)} disabled={!canCompose}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                {composerLockReason && (
                  <p id="agent-chat-composer-lock-reason" className="sl-agent-chat-composer-lock" role="status">
                    {composerLockReason}
                  </p>
                )}
                <div className="sl-agent-chat-input-row">
                  <Input.TextArea
                    aria-label="输入给 SourceLens Agent 的问题"
                    aria-describedby={composerLockReason ? 'agent-chat-composer-lock-reason' : undefined}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="询问仓库结构、调用链、风险根因或修复方向"
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    disabled={!canCompose}
                  />
                  <ActionButton
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={isStreamingCurrent}
                    disabled={!input.trim() || !canCompose}
                    label="发送"
                  />
                </div>
              </div>
            </>
          )}
        </section>

        {isThreadFirstLayout ? (
          <section className="sl-agent-chat-mobile-secondary" aria-label="次级治理与上下文">
            {trustWorkbench}
            {handoffPanel}
            {contextRail}
          </section>
        ) : contextRail}
      </main>

      <Drawer
        rootClassName="sl-agent-chat-conversation-drawer"
        title="会话池"
        placement="left"
        width="min(320px, calc(100vw - 24px))"
        open={isThreadFirstLayout && conversationDrawerOpen}
        onClose={() => setConversationDrawerOpen(false)}
        destroyOnClose={false}
      >
        {isThreadFirstLayout && conversationSidebar}
      </Drawer>
    </div>
  )
}

function AgentChatStateBanner({
  state,
  activeConversationId,
  streamingConversationId,
  staleMessage,
  onFatalRetry,
  onStaleResync,
  onStop,
}: {
  state: AgentChatViewState
  activeConversationId: number | null
  streamingConversationId: number | null
  staleMessage?: string
  onFatalRetry: () => void
  onStaleResync: () => void
  onStop: () => void
}) {
  const isStreamingElsewhere = Boolean(streamingConversationId && streamingConversationId !== activeConversationId)
  const config: Record<AgentChatViewState, { description: string; icon: ReactNode; label: string; tone: string }> = {
    INITIAL_LOADING: {
      description: '正在确认项目、会话与消息归属，可信快照完成前不开放发送。',
      icon: <SyncOutlined spin />,
      label: '初始加载中',
      tone: 'loading',
    },
    FATAL_LOAD: {
      description: '没有可用的可信快照。重试成功前不会把未确认数据呈现为空态或就绪态。',
      icon: <WarningOutlined />,
      label: '加载失败',
      tone: 'fatal',
    },
    STREAMING: {
      description: isStreamingElsewhere
        ? `Conv #${streamingConversationId} 正在生成，当前会话发送已锁定。`
        : 'Agent 正在生成当前回复，输入与快速问题已锁定。',
      icon: <SyncOutlined spin />,
      label: '生成中',
      tone: 'streaming',
    },
    STALE_REFRESH: {
      description: staleMessage || '静默刷新失败，旧消息仍保留，但重新同步前禁止继续发送。',
      icon: <WarningOutlined />,
      label: '上下文已陈旧',
      tone: 'stale',
    },
    EMPTY: {
      description: activeConversationId ? '可信会话尚无消息，可从 composer 发送第一条问题。' : '可信会话池已确认，请选择或创建会话。',
      icon: <MessageOutlined />,
      label: '等待输入',
      tone: 'empty',
    },
    READY: {
      description: '当前消息快照已确认，可继续提问。',
      icon: <CheckCircleOutlined />,
      label: '上下文已就绪',
      tone: 'ready',
    },
  }
  const current = config[state]
  const primaryAction = state === 'FATAL_LOAD' ? (
    <ActionButton data-agent-chat-primary-action="retry" type="primary" icon={<ReloadOutlined />} onClick={onFatalRetry} label="重试加载" />
  ) : state === 'STREAMING' ? (
    <ActionButton data-agent-chat-primary-action="stop" danger icon={<StopOutlined />} onClick={onStop} label="停止生成" />
  ) : state === 'STALE_REFRESH' ? (
    <ActionButton data-agent-chat-primary-action="resync" type="primary" icon={<ReloadOutlined />} onClick={onStaleResync} label="重新同步" />
  ) : null

  return (
    <section
      className={`sl-agent-chat-state sl-agent-chat-state-${current.tone}`}
      data-agent-chat-state-indicator={state}
      data-agent-chat-primary-actions={primaryAction ? 1 : 0}
      role={state === 'FATAL_LOAD' || state === 'STALE_REFRESH' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div className="sl-agent-chat-state-icon" aria-hidden>{current.icon}</div>
      <div className="sl-agent-chat-state-copy">
        <span>当前状态</span>
        <strong>{current.label}</strong>
        <p>{redactAgentChatText(current.description)}</p>
      </div>
      <div className="sl-agent-chat-state-action">{primaryAction}</div>
    </section>
  )
}

function AgentChatTrustLoopPanel({
  steps,
  onNavigate,
}: {
  steps: AgentChatTrustLoopStep[]
  onNavigate: (url: string) => void
}) {
  return (
    <section className="sl-agent-chat-trust-loop" aria-label="Agent 会话可信工作台">
      <div className="sl-agent-chat-trust-loop-head">
        <SafetyCertificateOutlined />
        <div>
          <span>Conversation Control Plane</span>
          <strong>会话可信工作台</strong>
        </div>
      </div>
      <p>发送前先确认项目、证据、工具审计和闭环任务四段链路，避免 Agent 对话脱离可复核证据。</p>
      <div className="sl-agent-chat-trust-loop-grid">
        {steps.map((step, index) => (
          <article
            key={step.key}
            className={`sl-agent-chat-trust-step sl-agent-chat-trust-step-${step.tone}`}
            data-sl-trust-step={step.key}
          >
            <div className="sl-agent-chat-trust-step-icon">
              {step.icon}
              <span>{index + 1}</span>
            </div>
            <div className="sl-agent-chat-trust-step-copy">
              <span>{step.title}</span>
              <strong>{step.status}</strong>
              <p>{step.description}</p>
            </div>
            {step.targetUrl ? (
              <ActionButton
                size="small"
                type="text"
                data-sl-target-url={step.targetUrl}
                onClick={() => onNavigate(step.targetUrl as string)}
                label={step.actionLabel || '查看'}
              />
            ) : (
              <small className="sl-agent-chat-trust-step-lock">待就绪</small>
            )}
          </article>
        ))}
      </div>
    </section>
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
  const title = redactAgentChatText(conversation.title || '新对话')
  return (
    <div
      role="listitem"
      className={`sl-agent-chat-conversation ${active ? 'sl-agent-chat-conversation-active' : ''}`}
    >
      <Link
        to={`/agent-chat/${conversation.id}`}
        aria-current={active ? 'page' : undefined}
        className="sl-agent-chat-conversation-select"
        onClick={onSelect}
      >
        <div className="sl-agent-chat-conversation-copy">
          <div>
            <MessageOutlined />
            <strong>{title}</strong>
          </div>
          <small>{formatDateTime(conversation.updatedAt)}</small>
        </div>
      </Link>
      <Popconfirm title="删除该对话？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={onDelete}>
        <IconActionButton
          label={`删除对话 ${title || conversation.id}`}
          tooltip="删除"
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={(event) => event.stopPropagation()}
        />
      </Popconfirm>
    </div>
  )
}

function CodeUnderstandingHandoffPanel({
  handoff,
  activeConversationId,
  binding,
  error,
  onUsePrompt,
  onNewConversation,
  onCreateAgentTask,
}: {
  handoff: CodeUnderstandingHandoff
  activeConversationId: number | null
  binding: boolean
  error: string | null
  onUsePrompt: () => void
  onNewConversation: () => void
  onCreateAgentTask: () => void
}) {
  const sourceLabel = redactAgentChatText(handoff.sourceLabel)
  const lineRef = redactAgentChatText(handoff.lineRef)
  const filePath = redactAgentChatText(handoff.filePath)
  const canCreateBoundTask = Boolean(handoff.scanTaskId)
  const createDisabledReason = canCreateBoundTask ? null : '缺少成功扫描任务，无法创建绑定 AgentTask。'
  return (
    <section className="sl-agent-chat-handoff" aria-label="代码理解交接包">
      <div className="sl-agent-chat-handoff-head">
        <div>
          <span>代码理解交接包</span>
          <strong>{sourceLabel} · {lineRef}</strong>
        </div>
        <Tag color={activeConversationId ? 'green' : 'gold'}>
          {activeConversationId ? `Conv #${activeConversationId}` : '等待选择会话'}
        </Tag>
      </div>
      <p>该交接只携带当前扫描的证据位置和问题草稿；发送后仍走 AgentChat SSE、工具调用审计和会话闭环。</p>
      <div className="sl-agent-chat-handoff-grid">
        <div><span>来源</span><strong>{redactAgentChatText(handoff.source)}</strong></div>
        <div><span>输入类型</span><strong>{redactAgentChatText(handoff.inputLabel || handoff.inputKind)}</strong></div>
        <div><span>扫描</span><strong>{handoff.scanTaskId ? `Scan #${handoff.scanTaskId}` : '未绑定'}</strong></div>
        <div><span>证据角色</span><strong>{redactAgentChatText(handoff.contextRole || '-')}</strong></div>
        <div><span>证据类型</span><strong>{redactAgentChatText(handoff.evidenceType || '-')}</strong></div>
        <div><span>相关分</span><strong>{redactAgentChatText(handoff.relevanceScore || '-')}</strong></div>
      </div>
      <div className="sl-agent-chat-handoff-file" title={filePath}>
        {filePath}
      </div>
      {createDisabledReason && (
        <p className="sl-agent-chat-handoff-warning">{createDisabledReason}</p>
      )}
      <div className="sl-agent-chat-handoff-actions">
        {activeConversationId && (
          <ActionButton size="small" icon={<SendOutlined />} onClick={onUsePrompt} label="使用交接问题" />
        )}
        <ActionButton
          size="small"
          type="primary"
          icon={<RobotOutlined />}
          onClick={onCreateAgentTask}
          loading={binding}
          disabled={!canCreateBoundTask || binding}
          title={createDisabledReason || undefined}
          label={activeConversationId ? '创建绑定任务' : '创建绑定任务并进入会话'}
        />
        {!activeConversationId && (
          <ActionButton size="small" icon={<PlusOutlined />} onClick={onNewConversation} label="仅新建对话" />
        )}
      </div>
      {error && <p className="sl-agent-chat-handoff-error">{error}</p>}
    </section>
  )
}

function ContextRail({
  selectedConversation,
  closureTask,
  closureTaskLoading,
  closureTaskError,
  messageStats,
  toolStats,
  streaming,
  onNavigate,
  onRetryClosureTask,
}: {
  selectedConversation: Conversation | null
  closureTask: AgentTask | null
  closureTaskLoading: boolean
  closureTaskError: string | null
  messageStats: ReturnType<typeof buildMessageStats>
  toolStats: ToolAuditStats
  streaming: boolean
  onNavigate: (url: string) => void
  onRetryClosureTask: () => void
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
            ? '本会话会展示工具边界；出现写入或命令工具时需复核。'
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

      <AgentChatClosureRail
        conversation={selectedConversation}
        task={closureTask}
        taskLoading={closureTaskLoading}
        taskError={closureTaskError}
        onNavigate={onNavigate}
        onRetry={onRetryClosureTask}
      />

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
            <span>写入/命令工具 {toolStats.writeOrExec > 0 ? '已出现，需复核' : '未出现'}</span>
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

function AgentChatClosureRail({
  conversation,
  task,
  taskLoading,
  taskError,
  onNavigate,
  onRetry,
}: {
  conversation: Conversation | null
  task: AgentTask | null
  taskLoading: boolean
  taskError: string | null
  onNavigate: (url: string) => void
  onRetry: () => void
}) {
  const auditUrl = conversation ? agentToolAuditUrl(conversation.projectId, conversation.id) : ''
  const taskUrl = conversation?.agentTaskId ? agentTaskDeepLinkUrl(conversation.projectId, conversation.agentTaskId) : ''
  const scanUrl = task?.scanTaskId ? `/scan-tasks/${task.scanTaskId}` : ''
  const manualCodeUnderstandingHandoff = isManualCodeUnderstandingHandoffTask(task)
  const closureGate = buildAgentChatClosureGate(conversation, task, taskLoading, taskError)

  const navigateTo = (url: string) => () => {
    if (url) onNavigate(url)
  }

  return (
    <section className="sl-agent-chat-closure-rail" aria-label="Agent 闭环下一步">
      <div className="sl-agent-chat-context-title">
        <RobotOutlined />
        <span>Agent 闭环下一步</span>
      </div>

      <AgentChatClosureGatePanel gate={closureGate} />

      {!conversation ? (
        <p className="sl-agent-chat-closure-copy">选择会话后显示审计、Agent 任务和扫描报告闭环入口。</p>
      ) : (
        <>
          <div className="sl-agent-chat-closure-meta">
            <div>
              <span>当前对话</span>
              <strong>Conv #{conversation.id}</strong>
            </div>
            <div>
              <span>Agent 任务</span>
              <strong>{conversation.agentTaskId ? `AgentTask #${conversation.agentTaskId}` : '未绑定'}</strong>
            </div>
            <div>
              <span>来源扫描</span>
              <strong>{taskLoading ? '加载中' : taskError ? '加载失败' : task?.scanTaskId ? `Scan #${task.scanTaskId}` : '未绑定'}</strong>
            </div>
          </div>

          {manualCodeUnderstandingHandoff && (
            <section className="sl-agent-chat-manual-send-proof" aria-label="代码理解手动发送闭环">
              <div className="sl-agent-chat-manual-send-proof-head">
                <SendOutlined />
                <span>等待用户手动发送</span>
              </div>
              <p>草稿已预填到输入框；发送前不会启动 AgentTask，也不会调用写入或修复工具。</p>
              <div className="sl-agent-chat-manual-send-proof-grid">
                <div>
                  <span>任务状态</span>
                  <strong>{task?.status || '-'}</strong>
                </div>
                <div>
                  <span>发送方式</span>
                  <strong>手动确认</strong>
                </div>
              </div>
            </section>
          )}

          {taskError && (
            <StateBlock
              compact
              tone="error"
              title="Agent 任务闭环加载失败"
              description={taskError}
              action={<ActionButton size="small" icon={<ReloadOutlined />} loading={taskLoading} onClick={onRetry} label="重试加载" />}
            />
          )}

          <div className="sl-agent-chat-closure-actions">
            <ActionButton
              size="small"
              icon={<AuditOutlined />}
              data-sl-target-url={auditUrl}
              onClick={navigateTo(auditUrl)}
              label="查看工具审计"
            />
            {conversation.agentTaskId && (
              <ActionButton
                size="small"
                icon={<RobotOutlined />}
                data-sl-target-url={taskUrl}
                onClick={navigateTo(taskUrl)}
                label="打开 Agent 任务"
              />
            )}
            {task?.scanTaskId && (
              <ActionButton
                size="small"
                icon={<FileSearchOutlined />}
                data-sl-target-url={scanUrl}
                onClick={navigateTo(scanUrl)}
                label="打开扫描报告"
              />
            )}
          </div>

          <p className="sl-agent-chat-closure-copy">
            {task?.scanTaskId
              ? '先复核工具审计，再回到绑定扫描报告和 Agent 任务查看证据链。'
              : '该会话没有完整扫描绑定；可以先查看工具审计，再决定是否创建或绑定 Agent 任务。'}
          </p>
        </>
      )}
    </section>
  )
}

function AgentChatClosureGatePanel({ gate }: { gate: AgentChatClosureGate }) {
  const icon = gate.tone === 'danger'
    ? <WarningOutlined />
    : gate.tone === 'ready'
      ? <CheckCircleOutlined />
      : <SafetyCertificateOutlined />

  return (
    <section className={`sl-agent-chat-closure-gate sl-agent-chat-closure-gate-${gate.tone}`} aria-label="Agent 闭环动作门禁说明">
      <div className="sl-agent-chat-closure-gate-head">
        {icon}
        <div>
          <span>{gate.status}</span>
          <strong>{gate.title}</strong>
        </div>
      </div>
      <p>{gate.description}</p>
      <div className="sl-agent-chat-closure-gate-grid">
        {gate.checks.map(check => (
          <div key={check.label} className={`sl-agent-chat-closure-gate-check sl-agent-chat-closure-gate-check-${check.tone}`}>
            <span>{check.label}</span>
            <strong>{check.status}</strong>
            <small>{check.reason}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

function buildAgentChatClosureGate(
  conversation: Conversation | null,
  task: AgentTask | null,
  taskLoading: boolean,
  taskError: string | null,
): AgentChatClosureGate {
  if (!conversation) {
    return {
      title: '选择对话后开放闭环入口',
      status: '闭环动作门禁关闭',
      description: '当前没有选中的 Agent 对话，工具审计、AgentTask 和扫描报告入口都不能形成有效上下文。',
      tone: 'idle',
      checks: [
        { label: '工具审计', status: '等待对话', reason: '需要 conversationId 才能筛选工具调用。', tone: 'idle' },
        { label: 'AgentTask', status: '等待绑定', reason: '需要 agentTaskId 才能定位任务详情。', tone: 'idle' },
        { label: '扫描报告', status: '等待扫描', reason: '需要绑定任务返回 scanTaskId。', tone: 'idle' },
      ],
    }
  }

  if (!conversation.agentTaskId) {
    return {
      title: '未绑定 AgentTask，任务闭环未形成',
      status: '闭环动作门禁部分开放',
      description: '工具审计可按当前对话筛选，但 AgentTask 和扫描报告入口关闭，不能宣称该对话已经形成任务到报告的完整证据链。',
      tone: 'warning',
      checks: [
        { label: '工具审计', status: '工具审计可用', reason: '当前对话筛选条件已就绪。', tone: 'ready' },
        { label: 'AgentTask', status: 'AgentTask 入口关闭', reason: '当前对话未绑定 agentTaskId。', tone: 'warning' },
        { label: '扫描报告', status: '扫描报告入口关闭', reason: '需要先绑定 AgentTask 并取得 scanTaskId。', tone: 'warning' },
      ],
    }
  }

  if (taskError) {
    return {
      title: 'Agent 任务闭环加载失败',
      status: '闭环动作门禁部分开放',
      description: '工具审计和 AgentTask 深链仍可复核；扫描报告入口关闭，必须重试加载任务详情后才能确认 scanTaskId。',
      tone: 'danger',
      checks: [
        { label: '工具审计', status: '工具审计可用', reason: '当前对话筛选条件已就绪。', tone: 'ready' },
        { label: 'AgentTask', status: 'AgentTask 可定位', reason: '任务详情深链已就绪。', tone: 'ready' },
        { label: '扫描报告', status: '扫描报告入口关闭', reason: '任务详情加载失败，scanTaskId 未被当前页面确认。', tone: 'danger' },
      ],
    }
  }

  if (taskLoading) {
    return {
      title: 'Agent 任务详情加载中',
      status: '闭环动作门禁复核中',
      description: '工具审计和 AgentTask 深链已具备上下文；扫描报告入口等待任务详情返回后再开放。',
      tone: 'warning',
      checks: [
        { label: '工具审计', status: '工具审计可用', reason: '当前对话筛选条件已就绪。', tone: 'ready' },
        { label: 'AgentTask', status: 'AgentTask 可定位', reason: '任务详情深链已就绪。', tone: 'ready' },
        { label: '扫描报告', status: '等待任务详情', reason: '正在确认 scanTaskId。', tone: 'warning' },
      ],
    }
  }

  if (!task) {
    return {
      title: 'Agent 任务详情未返回',
      status: '闭环动作门禁部分开放',
      description: '当前对话已绑定 AgentTask，但页面尚未拿到任务详情；只能先进入审计和任务详情复核。',
      tone: 'warning',
      checks: [
        { label: '工具审计', status: '工具审计可用', reason: '当前对话筛选条件已就绪。', tone: 'ready' },
        { label: 'AgentTask', status: 'AgentTask 可定位', reason: '任务详情深链已就绪。', tone: 'ready' },
        { label: '扫描报告', status: '扫描报告入口关闭', reason: '任务详情缺失，scanTaskId 未确认。', tone: 'warning' },
      ],
    }
  }

  if (!task.scanTaskId) {
    return {
      title: '任务存在但未绑定扫描报告',
      status: '闭环动作门禁部分开放',
      description: '工具审计和 AgentTask 可复核；扫描报告入口关闭，报告引用和扫描证据链仍不完整。',
      tone: 'warning',
      checks: [
        { label: '工具审计', status: '工具审计可用', reason: '当前对话筛选条件已就绪。', tone: 'ready' },
        { label: 'AgentTask', status: 'AgentTask 可定位', reason: '任务详情深链已就绪。', tone: 'ready' },
        { label: '扫描报告', status: '扫描报告入口关闭', reason: '该 AgentTask 没有 scanTaskId。', tone: 'warning' },
      ],
    }
  }

  return {
    title: '审计、任务和扫描报告证据链完整',
    status: '闭环动作门禁开放',
    description: '工具审计、AgentTask 和扫描报告都已具备可跳转上下文；继续复核时应按审计记录、任务过程、扫描报告顺序检查证据。',
    tone: 'ready',
    checks: [
      { label: '工具审计', status: '工具审计可用', reason: '当前对话筛选条件已就绪。', tone: 'ready' },
      { label: 'AgentTask', status: 'AgentTask 可定位', reason: '任务详情深链已就绪。', tone: 'ready' },
      { label: '扫描报告', status: '扫描报告可回跳', reason: '扫描报告深链已就绪。', tone: 'ready' },
    ],
  }
}

function isManualCodeUnderstandingHandoffTask(task: AgentTask | null) {
  if (!task || task.taskType !== 'CUSTOM' || !task.inputJson) return false
  try {
    const receipt = JSON.parse(task.inputJson) as Record<string, unknown>
    return receipt.handoffType === 'CODE_UNDERSTANDING'
      && receipt.rawPromptStored === false
      && receipt.rawStackStored === false
      && receipt.autoSent === false
      && receipt.autoStarted === false
  } catch {
    return false
  }
}

function redactAgentChatText(value?: string | null): string {
  return value ? redactSensitiveText(value) : ''
}

function redactAgentChatApiError(error: unknown, fallback: string): string {
  return redactAgentChatText(formatApiError(error, fallback))
}

function showRedactedAgentChatApiError(error: unknown, fallback: string): void {
  antdMessage.error(redactAgentChatApiError(error, fallback))
}

function MessageBubble({ msg, auditUrl }: { msg: ConversationMessage; auditUrl?: string }) {
  const isUser = msg.role === 'USER'
  const isTool = msg.role === 'TOOL'

  if (isTool) {
    return null
  }

  const toolCalls = normalizePersistedToolCalls(msg.toolCallsJson)
  const toolResults = normalizePersistedToolResults(msg.toolResultsJson)
  const evidenceSummary = buildToolEvidenceSummary(toolCalls, toolResults)
  const speaker = isUser ? '你' : 'SourceLens Agent'

  return (
    <article className={`sl-agent-chat-row ${isUser ? 'sl-agent-chat-row-user' : 'sl-agent-chat-row-assistant'}`} aria-label={`${speaker} 消息，${formatDateTime(msg.createdAt)}`}>
      <div className="sl-agent-chat-message">
        <div className={`sl-agent-chat-avatar ${isUser ? 'sl-agent-chat-avatar-user' : 'sl-agent-chat-avatar-assistant'}`} aria-hidden="true">
          {isUser ? <UserOutlined /> : <RobotOutlined />}
        </div>
        <div className="sl-agent-chat-message-body">
          <div className={`sl-agent-chat-bubble ${isUser ? 'sl-agent-chat-bubble-user' : 'sl-agent-chat-bubble-assistant'}`}>
            <div className="sl-agent-chat-bubble-head">
              <span>{isUser ? '你' : 'SourceLens Agent'}</span>
              <small>{formatDateTime(msg.createdAt)}</small>
            </div>
            <div className="sl-agent-chat-content">{redactAgentChatText(msg.content)}</div>
            {msg.errorMessage && <Tag color="error">{redactAgentChatText(msg.errorMessage)}</Tag>}
          </div>
          {toolCalls.length > 0 && (
            <ToolEvidenceBlock calls={toolCalls} results={toolResults} summary={evidenceSummary} auditUrl={auditUrl} />
          )}
        </div>
      </div>
    </article>
  )
}

function StreamingBubble({ msg, auditUrl }: { msg: StreamingMessage; auditUrl?: string }) {
  const evidenceSummary = buildToolEvidenceSummary(msg.toolCalls, msg.toolResults)

  return (
    <article className="sl-agent-chat-row sl-agent-chat-row-assistant" aria-label="SourceLens Agent 正在生成消息">
      <div className="sl-agent-chat-message">
        <div className="sl-agent-chat-avatar sl-agent-chat-avatar-assistant" aria-hidden="true">
          <RobotOutlined />
        </div>
        <div className="sl-agent-chat-message-body">
          <div className="sl-agent-chat-streaming-line" role="status" aria-live="polite">
            <Badge status={msg.status === 'error' ? 'error' : 'processing'} />
            <span>{msg.round ? `思考中，第 ${msg.round} 轮` : '正在生成回答'}</span>
          </div>
          {msg.content ? (
            <div className="sl-agent-chat-bubble sl-agent-chat-bubble-assistant">
              <div className="sl-agent-chat-content">
                {redactAgentChatText(msg.content)}
                {msg.status === 'streaming' && <span className="cursor-blink">|</span>}
              </div>
            </div>
          ) : (
            <div className="sl-agent-chat-thinking">
              <SyncOutlined spin />
              <Text type="secondary">模型正在读取上下文</Text>
            </div>
          )}
          {msg.toolCalls.length > 0 && (
            <ToolEvidenceBlock calls={msg.toolCalls} results={msg.toolResults} summary={evidenceSummary} auditUrl={auditUrl} />
          )}
          {msg.status === 'error' && <Tag color="error" role="alert">生成失败</Tag>}
        </div>
      </div>
    </article>
  )
}

function ToolEvidenceBlock({
  calls,
  results,
  summary,
  auditUrl,
}: {
  calls: ToolCallView[]
  results: ToolResultView[]
  summary: ToolEvidenceSummary
  auditUrl?: string
}) {
  return (
    <section className="sl-agent-chat-evidence" aria-label="本轮工具证据">
      <div className="sl-agent-chat-evidence-strip">
        <span>本轮证据</span>
        <strong>{summary.label}</strong>
        <Tag color={summary.writeOrExec > 0 ? 'orange' : 'green'}>
          {summary.writeOrExec > 0 ? '需复核工具边界' : '未出现写入工具'}
        </Tag>
        {auditUrl && (
          <ActionButton
            size="small"
            type="link"
            icon={<AuditOutlined />}
            href={auditUrl}
            label="查看审计"
          />
        )}
      </div>
      <div className="sl-agent-chat-tool-stack">
        {calls.map((toolCall, idx) => {
          const result = results.find(item => item.id === toolCall.id)
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
    </section>
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

function buildToolEvidenceSummary(calls: ToolCallView[], results: ToolResultView[]): ToolEvidenceSummary {
  const readFiles = calls.filter(call => call.name === 'read_file').length
  const searches = calls.filter(call => call.name === 'search_code').length
  const failed = results.filter(result => result.success === false).length
  const writeOrExec = calls.filter(call => call.name === 'write_file' || call.name === 'shell_exec').length
  const parts = [
    readFiles > 0 ? `读取 ${readFiles} 个文件` : null,
    searches > 0 ? `搜索 ${searches} 次` : null,
    `工具 ${calls.length} 次`,
    `${failed} 个失败`,
  ].filter(Boolean)
  return {
    label: parts.join('，'),
    failed,
    writeOrExec,
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

function parseCodeUnderstandingHandoff(params: URLSearchParams): CodeUnderstandingHandoff | null {
  if (params.get('handoff') !== 'code-understanding') return null
  const filePath = (params.get('filePath') || '').trim()
  const lineRef = (params.get('lineRef') || '').trim()
  if (!filePath || !lineRef) return null
  const sourceLabel = (params.get('sourceLabel') || 'C1').trim()
  const scanTaskId = parsePositiveInt(params.get('scanTaskId'))
  const inputLabel = params.get('inputLabel') || params.get('inputKind') || '代码定位'
  const prompt = buildCodeUnderstandingHandoffPrompt(lineRef, sourceLabel, inputLabel)
  return {
    key: [
      params.get('projectId') || '',
      scanTaskId || '',
      sourceLabel,
      lineRef,
      prompt,
    ].join('|'),
    projectId: parsePositiveInt(params.get('projectId')),
    scanTaskId,
    prompt,
    source: params.get('source') || 'PROJECT_QA_CODE_UNDERSTANDING_LENS',
    inputKind: params.get('inputKind') || 'UNKNOWN',
    inputLabel,
    sourceLabel,
    filePath,
    lineRef,
    contextRole: params.get('contextRole') || '',
    evidenceType: params.get('evidenceType') || '',
    relevanceScore: params.get('relevanceScore') || '',
  }
}

function sanitizeCodeUnderstandingHandoffParams(params: URLSearchParams): URLSearchParams | null {
  if (params.get('handoff') !== 'code-understanding') return null
  const sanitized = new URLSearchParams(params)
  let changed = false
  const textKeys = [
    'source',
    'inputKind',
    'inputLabel',
    'sourceLabel',
    'filePath',
    'lineRef',
    'contextRole',
    'evidenceType',
    'relevanceScore',
  ]
  textKeys.forEach((key) => {
    const value = sanitized.get(key)
    if (!value) return
    const redacted = redactAgentChatText(value)
    if (redacted !== value) {
      sanitized.set(key, redacted)
      changed = true
    }
  })
  return changed ? sanitized : null
}

function buildCodeUnderstandingHandoffPrompt(lineRef: string, sourceLabel: string, inputLabel: string): string {
  const safeLineRef = redactAgentChatText(lineRef)
  const safeSourceLabel = redactAgentChatText(sourceLabel)
  const safeInputLabel = redactAgentChatText(inputLabel)
  return [
    `请基于当前扫描证据解释 ${safeLineRef}。`,
    `证据编号：${safeSourceLabel}。`,
    `输入类型：${safeInputLabel}。`,
    '请先说明这段代码的职责、调用上下文和潜在风险；只能引用当前证据，不要假设未检索到的实现。',
  ].join('\n')
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function healthLabel(tone: 'ready' | 'warning' | 'danger' | 'idle', streaming: boolean) {
  if (streaming) return '生成中'
  if (tone === 'danger') return '需复核'
  if (tone === 'warning') return '有高权限工具'
  if (tone === 'ready') return '可继续'
  return '未开始'
}

function agentToolAuditUrl(projectId: number, conversationId: number) {
  const params = new URLSearchParams({
    projectId: String(projectId),
    conversationId: String(conversationId),
  })
  return `/audit-logs?${params.toString()}`
}

function agentTaskDeepLinkUrl(projectId: number, taskId: number) {
  const params = new URLSearchParams({
    projectId: String(projectId),
    taskId: String(taskId),
  })
  return `/agent-tasks?${params.toString()}`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}
