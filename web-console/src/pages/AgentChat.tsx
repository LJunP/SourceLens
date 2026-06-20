import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Input, Button, Spin, Empty, Typography, Space, Tag, Tooltip } from 'antd'
import { SendOutlined, PlusOutlined, DeleteOutlined, MessageOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { conversationApi, Conversation, ConversationMessage, sendMessageSSE } from '../api/conversation'
import { projectApi } from '../api/project'
import { useAuth } from '../contexts/AuthContext'
import AgentToolCall from '../components/AgentToolCall'

const { Text } = Typography

interface StreamingMessage {
  role: 'ASSISTANT'
  content: string
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>
  toolResults: Array<{ id: string; name: string; success: boolean; content: string }>
  status: 'streaming' | 'done' | 'error'
  round?: number
}

export default function AgentChat() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [streamingMsg, setStreamingMsg] = useState<StreamingMessage | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [projectId, setProjectId] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConvId = conversationId ? Number(conversationId) : null

  // 加载项目列表以设置 projectId
  useEffect(() => {
    projectApi.list(1, 1).then((res) => {
      const items = res.data.data?.items || []
      if (items.length > 0) {
        setProjectId(items[0].id)
      }
    })
  }, [])

  // 加载对话列表
  useEffect(() => {
    if (!projectId) return
    conversationApi.list(projectId, 1, 100).then((res) => {
      const items = res.data.data?.items || []
      setConversations(items)
    })
  }, [projectId])

  // 加载消息
  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      return
    }
    setLoading(true)
    conversationApi.detail(activeConvId).then((res) => {
      setMessages(res.data.data?.messages || [])
    }).finally(() => setLoading(false))
  }, [activeConvId])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMsg])

  const handleNewConversation = async () => {
    if (!projectId) return
    const res = await conversationApi.create(projectId, { title: '新对话' })
    const conv = res.data.data
    setConversations((prev) => [conv, ...prev])
    navigate(`/agent-chat/${conv.id}`)
  }

  const handleDelete = async (id: number) => {
    await conversationApi.delete(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeConvId === id) {
      navigate('/agent-chat')
    }
  }

  const handleSend = () => {
    if (!activeConvId || !input.trim() || sending) return

    const msg = input.trim()
    setInput('')
    setSending(true)

    // 添加用户消息到列表
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

    // 开始流式响应
    const streaming: StreamingMessage = {
      role: 'ASSISTANT',
      content: '',
      toolCalls: [],
      toolResults: [],
      status: 'streaming',
    }
    setStreamingMsg(streaming)

    abortRef.current = sendMessageSSE(activeConvId, msg, token!, {
      onContent: (content) => {
        setStreamingMsg((prev) => prev ? { ...prev, content: prev.content + content } : null)
      },
      onToolCall: (data) => {
        setStreamingMsg((prev) => prev ? {
          ...prev,
          toolCalls: [...prev.toolCalls, data],
        } : null)
      },
      onToolResult: (data) => {
        setStreamingMsg((prev) => prev ? {
          ...prev,
          toolResults: [...prev.toolResults, data],
        } : null)
      },
      onThinking: (data) => {
        setStreamingMsg((prev) => prev ? { ...prev, round: data.round } : null)
      },
      onDone: () => {
        setStreamingMsg((prev) => prev ? { ...prev, status: 'done' } : null)
        setSending(false)
        // 重新加载消息列表以获取持久化的消息
        if (activeConvId) {
          conversationApi.detail(activeConvId).then((res) => {
            setMessages(res.data.data?.messages || [])
            setStreamingMsg(null)
          })
        }
      },
      onError: (error) => {
        setStreamingMsg((prev) => prev ? { ...prev, status: 'error', content: prev.content + `\n\n错误: ${error}` } : null)
        setSending(false)
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 16 }}>
      {/* 左侧对话列表 */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>AI 对话</Text>
          <Tooltip title="新建对话">
            <Button type="text" icon={<PlusOutlined />} onClick={handleNewConversation} />
          </Tooltip>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {conversations.length === 0 ? (
            <Empty description="暂无对话" style={{ marginTop: 40 }} />
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/agent-chat/${conv.id}`)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: activeConvId === conv.id ? '#e6f4ff' : 'transparent',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: activeConvId === conv.id ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <MessageOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                    {conv.title || '新对话'}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => { e.stopPropagation(); handleDelete(conv.id) }}
                  style={{ color: '#999', opacity: 0.6 }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧消息区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeConvId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="选择或创建一个对话开始" />
          </div>
        ) : (
          <>
            {/* 消息列表 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
              ) : messages.length === 0 && !streamingMsg ? (
                <Empty description="发送消息开始对话" style={{ marginTop: 60 }} />
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  {streamingMsg && <StreamingBubble msg={streamingMsg} />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* 输入框 */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid #f0f0f0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                  autoSize={{ minRows: 1, maxRows: 6 }}
                  disabled={sending}
                  style={{ fontSize: 14 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sending}
                  style={{ height: 'auto' }}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ConversationMessage }) {
  const isUser = msg.role === 'USER'
  const isTool = msg.role === 'TOOL'

  if (isTool) {
    // Tool 消息不单独显示，由 assistant 的 toolCalls/toolResults 处理
    return null
  }

  const toolCalls = msg.toolCallsJson ? JSON.parse(msg.toolCallsJson) : []
  const toolResults = msg.toolResultsJson ? JSON.parse(msg.toolResultsJson) : []

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '80%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: isUser ? '#1677ff' : '#52c41a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, flexShrink: 0,
        }}>
          {isUser ? <UserOutlined /> : <RobotOutlined />}
        </div>
        <div>
          <div style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: isUser ? '#1677ff' : '#f5f5f5',
            color: isUser ? '#fff' : '#333',
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {msg.content || ''}
          </div>
          {/* 工具调用展示 */}
          {toolCalls.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {toolCalls.map((tc: { id: string; function?: { name: string; arguments: Record<string, unknown> } }, idx: number) => {
                const result = toolResults.find((r: { tool_call_id: string }) => r.tool_call_id === tc.id)
                return (
                  <AgentToolCall
                    key={tc.id || idx}
                    name={tc.function?.name || 'unknown'}
                    arguments={tc.function?.arguments || {}}
                    result={result?.content || null}
                    success={result ? !result.content?.startsWith('Error:') : undefined}
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
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '80%' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#52c41a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, flexShrink: 0,
        }}>
          <RobotOutlined />
        </div>
        <div>
          {msg.round && msg.status === 'streaming' && (
            <Tag color="processing" style={{ marginBottom: 4 }}>思考中 (第 {msg.round} 轮)</Tag>
          )}
          {msg.content && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: '#f5f5f5',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content}
              {msg.status === 'streaming' && <span className="cursor-blink">|</span>}
            </div>
          )}
          {!msg.content && msg.status === 'streaming' && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f5f5f5' }}>
              <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>思考中...</Text>
            </div>
          )}
          {msg.toolCalls.map((tc, idx) => {
            const result = msg.toolResults.find((r) => r.id === tc.id)
            return (
              <AgentToolCall
                key={tc.id || idx}
                name={tc.name}
                arguments={tc.arguments}
                result={result?.content || null}
                success={result?.success}
              />
            )
          })}
          {msg.status === 'error' && (
            <Tag color="error" style={{ marginTop: 4 }}>出错了</Tag>
          )}
        </div>
      </div>
    </div>
  )
}