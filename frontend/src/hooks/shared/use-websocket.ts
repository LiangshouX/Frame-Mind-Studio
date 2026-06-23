'use client'

import { useEffect, useRef, useCallback } from 'react'
import { connectAgentWebSocket } from '@/lib/websocket/stomp-client'
import { useAgentStore } from '@/stores/agent-store'
import { AgentWebSocketMessage } from '@/types/agent'

export function useAgentWebSocket(sessionId: string | null) {
  const connRef = useRef<ReturnType<typeof connectAgentWebSocket> | null>(null)
  const {
    appendStream,
    setRunning,
    setTokens,
    setBudgetWarning,
    setConnectionStatus,
    addMessage,
    finishStreaming,
    addCollapsibleBlock,
    updateCollapsibleBlock,
  } = useAgentStore()

  const handleMessage = useCallback(
    (msg: AgentWebSocketMessage) => {
      switch (msg.type) {
        case 'stream_chunk':
          appendStream(msg.data.content, msg.data.agent_name)
          break
        case 'thinking_block':
          if (msg.data.status === 'start') {
            addCollapsibleBlock({
              id: msg.data.block_id,
              type: 'thinking',
              content: '',
              isCollapsed: true,
              status: 'start',
            })
          } else if (msg.data.status === 'end') {
            updateCollapsibleBlock(msg.data.block_id, {
              content: msg.data.content,
              status: 'end',
            })
          }
          break
        case 'tool_call':
          if (msg.data.status === 'start') {
            addCollapsibleBlock({
              id: msg.data.block_id,
              type: 'tool_call',
              toolName: msg.data.tool_name,
              content: msg.data.tool_input ? JSON.stringify(msg.data.tool_input, null, 2) : '',
              isCollapsed: true,
              status: 'start',
            })
          } else if (msg.data.status === 'end') {
            updateCollapsibleBlock(msg.data.block_id, {
              content: msg.data.tool_result || '',
              status: 'end',
            })
          }
          break
        case 'tool_result':
          updateCollapsibleBlock(msg.data.block_id, {
            content: msg.data.output,
            status: 'end',
          })
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
            messageType: 'text',
            isStreaming: false,
            timestamp: new Date().toISOString(),
          })
          break
        case 'budget_warning':
          setBudgetWarning(msg.data.message)
          break
      }
    },
    [
      appendStream,
      setRunning,
      setTokens,
      setBudgetWarning,
      addMessage,
      finishStreaming,
      addCollapsibleBlock,
      updateCollapsibleBlock,
    ]
  )

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
