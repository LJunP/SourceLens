import { createContext, useContext, useState, useRef } from 'react'
import { sendMessageSSE } from '../api/conversation'

export interface StreamingMessage {
  role: 'ASSISTANT'
  content: string
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>
  toolResults: Array<{ id: string; name: string; success: boolean; content: string }>
  status: 'streaming' | 'done' | 'error'
  round?: number
}

interface ChatContextType {
  activeConvId: number | null
  streamingMsg: StreamingMessage | null
  sending: boolean
  sendMsg: (convId: number, content: string, token: string, onMessageDone: () => void) => void
  abortStream: () => void
  resetChatState: () => void
  updateOnMessageDone: (cb: () => void) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeConvId, setActiveConvId] = useState<number | null>(null)
  const [streamingMsg, setStreamingMsg] = useState<StreamingMessage | null>(null)
  const [sending, setSending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const onMessageDoneRef = useRef<(() => void) | null>(null)

  const abortStream = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setSending(false)
    setStreamingMsg(null)
    setActiveConvId(null)
    onMessageDoneRef.current = null
  }

  const resetChatState = () => {
    setStreamingMsg(null)
    setSending(false)
    setActiveConvId(null)
    onMessageDoneRef.current = null
  }

  const updateOnMessageDone = (cb: () => void) => {
    onMessageDoneRef.current = cb
  }

  const sendMsg = (convId: number, content: string, token: string, onMessageDone: () => void) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    setActiveConvId(convId)
    setSending(true)
    onMessageDoneRef.current = onMessageDone

    const streaming: StreamingMessage = {
      role: 'ASSISTANT',
      content: '',
      toolCalls: [],
      toolResults: [],
      status: 'streaming',
    }
    setStreamingMsg(streaming)

    abortRef.current = sendMessageSSE(convId, content, token, {
      onContent: (text) => {
        setStreamingMsg((prev) => prev ? { ...prev, content: prev.content + text } : null)
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
        abortRef.current = null
        if (onMessageDoneRef.current) {
          onMessageDoneRef.current()
        }
      },
      onError: (error) => {
        setStreamingMsg((prev) => prev ? {
          ...prev,
          status: 'error',
          content: prev.content + `\n\n错误: ${error}`
        } : null)
        setSending(false)
        abortRef.current = null
      },
    })
  }

  return (
    <ChatContext.Provider value={{ activeConvId, streamingMsg, sending, sendMsg, abortStream, resetChatState, updateOnMessageDone }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat must be used within ChatProvider')
  return context
}
