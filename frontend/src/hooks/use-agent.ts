'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AgentMessage, AgentType, ThinkingStep, ToolCall, WebSocketMessage } from '@/types'
import { AgentWebSocket, createMockWebSocket } from '@/lib/websocket'
import { fetchAgentMessages } from '@/lib/api'
import { generateId } from '@/lib/utils'

interface UseAgentOptions {
  projectId: string
  sessionId?: string
}

interface UseAgentReturn {
  messages: AgentMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  sendMessage: (content: string, agentType?: AgentType) => Promise<void>
  clearMessages: () => void
  currentThinking: ThinkingStep[]
  currentToolCall: ToolCall | null
}

export function useAgent({ projectId, sessionId }: UseAgentOptions): UseAgentReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentThinking, setCurrentThinking] = useState<ThinkingStep[]>([])
  const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null)

  const wsRef = useRef<AgentWebSocket | ReturnType<typeof createMockWebSocket> | null>(null)
  const streamingMessageRef = useRef<string>('')
  const currentMessageIdRef = useRef<string>('')

  // Load existing messages
  useEffect(() => {
    if (sessionId) {
      setIsLoading(true)
      fetchAgentMessages(sessionId)
        .then(setMessages)
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false))
    }
  }, [sessionId])

  const handleWebSocketMessage = useCallback((wsMessage: WebSocketMessage) => {
    const { type, data } = wsMessage
    if (!data) return

    switch (type) {
      case 'thinking':
        if (data.thinking) {
          setCurrentThinking((prev) => [...prev, data.thinking!])
        }
        break

      case 'tool_call':
        if (data.tool_call) {
          setCurrentToolCall(data.tool_call)
        }
        break

      case 'tool_result':
        if (data.tool_call) {
          setCurrentToolCall((prev) =>
            prev ? { ...prev, result: data.tool_call?.result } : null
          )
        }
        break

      case 'message':
        if (data.content) {
          streamingMessageRef.current = data.content
          setIsStreaming(true)

          setMessages((prev) => {
            const existingIndex = prev.findIndex((m) => m.id === data.message_id)
            if (existingIndex >= 0) {
              const updated = [...prev]
              updated[existingIndex] = {
                ...updated[existingIndex],
                content: data.content!,
              }
              return updated
            }
            return [
              ...prev,
              {
                id: data.message_id || generateId(),
                session_id: sessionId || '',
                role: 'assistant',
                agent_type: data.agent_type || 'showrunner',
                content: data.content!,
                thinking: currentThinking.length > 0 ? [...currentThinking] : undefined,
                tool_calls: currentToolCall ? [currentToolCall] : undefined,
                created_at: new Date().toISOString(),
              },
            ]
          })
        }
        break

      case 'done':
        setIsStreaming(false)
        setCurrentThinking([])
        setCurrentToolCall(null)
        streamingMessageRef.current = ''
        break

      case 'error':
        setError(data.error || 'Unknown error')
        setIsStreaming(false)
        break
    }
  }, [sessionId, currentThinking, currentToolCall])

  const handleWebSocketError = useCallback((error: Event) => {
    console.error('WebSocket error:', error)
    setError('连接错误，请重试')
  }, [])

  const handleWebSocketClose = useCallback((event: CloseEvent) => {
    if (!event.wasClean) {
      setError('连接已断开')
    }
  }, [])

  // Initialize WebSocket
  useEffect(() => {
    if (!sessionId) return

    try {
      const ws = new AgentWebSocket(
        sessionId,
        handleWebSocketMessage,
        handleWebSocketError,
        handleWebSocketClose
      )
      ws.connect()
      wsRef.current = ws
    } catch {
      console.warn('WebSocket unavailable, using mock mode')
      wsRef.current = createMockWebSocket(sessionId, handleWebSocketMessage)
    }

    return () => {
      wsRef.current?.disconnect()
    }
  }, [sessionId, handleWebSocketMessage, handleWebSocketError, handleWebSocketClose])

  const sendMessage = useCallback(
    async (content: string, agentType?: AgentType) => {
      if (!content.trim()) return

      setError(null)
      const userMessage: AgentMessage = {
        id: generateId(),
        session_id: sessionId || '',
        role: 'user',
        content: content.trim(),
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])

      try {
        if (wsRef.current) {
          wsRef.current.send({
            type: 'message',
            content: content.trim(),
            agent_type: agentType,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '发送失败')
      }
    },
    [sessionId]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setCurrentThinking([])
    setCurrentToolCall(null)
  }, [])

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    currentThinking,
    currentToolCall,
  }
}
