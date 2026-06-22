'use client'

import { useEffect, useRef, useCallback } from 'react'
import { connectAgentWebSocket } from '@/lib/websocket/stomp-client'
import { useAgentStore } from '@/stores/agent-store'
import { AgentWebSocketMessage } from '@/types/agent'

export function useAgentWebSocket(sessionId: string | null) {
  const connRef = useRef<ReturnType<typeof connectAgentWebSocket> | null>(null)
  const { setStage, appendStream, setReviewing, setRunning, setTokens, setBudgetWarning, setConnectionStatus, addMessage, finishStreaming } = useAgentStore()

  const handleMessage = useCallback((msg: AgentWebSocketMessage) => {
    switch (msg.type) {
      case 'stage_update':
        setStage(msg.data.stage, msg.data.stage_label)
        if (msg.data.status === 'started') {
          setRunning(true)
        }
        break
      case 'stream_chunk':
        appendStream(msg.data.content)
        break
      case 'hitl_prompt':
        setReviewing(true, msg.data.content)
        setRunning(false)
        break
      case 'complete':
        setRunning(false)
        setTokens(msg.data.tokens_consumed)
        finishStreaming()
        break
      case 'error':
        setRunning(false)
        finishStreaming()
        addMessage({
          id: `error-${Date.now()}`,
          agentName: 'system',
          role: 'error',
          content: msg.data.message,
          isStreaming: false,
          timestamp: new Date().toISOString(),
        })
        break
      case 'budget_warning':
        setBudgetWarning(msg.data.message)
        break
    }
  }, [setStage, appendStream, setReviewing, setRunning, setTokens, setBudgetWarning, addMessage, finishStreaming])

  // 手动重连函数
  const reconnect = useCallback(() => {
    connRef.current?.reconnect()
  }, [])

  useEffect(() => {
    if (!sessionId) return

    connRef.current = connectAgentWebSocket(sessionId, {
      onMessage: handleMessage,
      onConnectionChange: setConnectionStatus,
    })

    // 监听手动重连事件
    const handleReconnectEvent = () => reconnect()
    window.addEventListener('ws-reconnect', handleReconnectEvent)

    return () => {
      window.removeEventListener('ws-reconnect', handleReconnectEvent)
      connRef.current?.disconnect()
    }
  }, [sessionId, handleMessage, setConnectionStatus, reconnect])

  return connRef.current
}
