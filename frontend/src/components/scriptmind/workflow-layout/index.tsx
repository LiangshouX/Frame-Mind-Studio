'use client'

import { useEffect, useRef, useCallback } from 'react'
import { AgentChat } from '@/components/shared/agent-chat'
import { useAgentStore } from '@/stores/agent-store'
import { connectAgentWebSocket } from '@/lib/websocket/stomp-client'
import * as workflowApi from '@/lib/api/workflow'
import { AgentWebSocketMessage } from '@/types/agent'

interface WorkflowLayoutProps {
  projectId: string
  step: string
  children: React.ReactNode
  /** AI 生成按钮的回调，由各面板传入 */
  onGenerate?: () => void
}

/**
 * 统一的工作流布局组件。
 * 左侧为内容面板（60%），右侧为 AI 对话面板（40%）。
 * 自动管理 WebSocket 连接和消息处理。
 */
export function WorkflowLayout({ projectId, step, children, onGenerate }: WorkflowLayoutProps) {
  const {
    sessionId,
    setSession,
    setStage,
    addMessage,
    appendStream,
    finishStreaming,
    setRunning,
    setReviewing,
    setTokens,
    setBudgetWarning,
    setConnectionStatus,
    reset,
  } = useAgentStore()

  const wsRef = useRef<ReturnType<typeof connectAgentWebSocket> | null>(null)

  // WebSocket 消息处理
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
      case 'complete':
        finishStreaming()
        setRunning(false)
        setTokens(msg.data.tokens_consumed)
        addMessage({
          id: `complete-${Date.now()}`,
          agentName: 'system',
          role: 'system',
          content: '✅ 生成完成',
          isStreaming: false,
          timestamp: new Date().toISOString(),
        })
        // 通知父组件生成完成
        onGenerate?.()
        break
      case 'error':
        finishStreaming()
        setRunning(false)
        addMessage({
          id: `error-${Date.now()}`,
          agentName: 'system',
          role: 'error',
          content: `❌ ${msg.data.message}`,
          isStreaming: false,
          timestamp: new Date().toISOString(),
        })
        break
      case 'budget_warning':
        setBudgetWarning(msg.data.message)
        break
      case 'hitl_prompt':
        setReviewing(true, msg.data.content)
        break
    }
  }, [setStage, appendStream, finishStreaming, setRunning, setTokens, addMessage, setBudgetWarning, setReviewing, onGenerate])

  // 组件卸载时断开 WebSocket
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    }
  }, [])

  // 发送消息到 AI
  const handleSend = useCallback(async (text: string, stylePreset?: string) => {
    addMessage({
      id: `user-${Date.now()}`,
      agentName: 'user',
      role: 'user',
      content: text,
      isStreaming: false,
      timestamp: new Date().toISOString(),
    })

    try {
      // 根据当前步骤调用对应的生成 API
      let result: { session_id: string; websocket_url: string }

      switch (step) {
        case 'worldview':
          result = await workflowApi.generateWorldSetting(projectId)
          break
        case 'synopsis':
          result = await workflowApi.generateSynopsis(projectId)
          break
        case 'characters':
          result = await workflowApi.generateCharacters(projectId)
          break
        case 'outline':
          result = await workflowApi.generateOutline(projectId)
          break
        case 'script':
          result = await workflowApi.generateScript(projectId)
          break
        default:
          return
      }

      // 设置会话 ID
      setSession(result.session_id)

      // 断开旧连接
      if (wsRef.current) {
        wsRef.current.disconnect()
      }

      // 建立新 WebSocket 连接
      wsRef.current = connectAgentWebSocket(result.session_id, {
        onMessage: handleMessage,
        onConnectionChange: setConnectionStatus,
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      addMessage({
        id: `error-${Date.now()}`,
        agentName: 'system',
        role: 'error',
        content: `❌ 发送失败: ${error instanceof Error ? error.message : '未知错误'}`,
        isStreaming: false,
        timestamp: new Date().toISOString(),
      })
    }
  }, [step, projectId, addMessage, setSession, handleMessage, setConnectionStatus])

  // 审批
  const handleApprove = useCallback(async () => {
    setReviewing(false)
    if (sessionId) {
      try {
        const { apiFetch } = await import('@/lib/api/client')
        await apiFetch(`/agent/sessions/${sessionId}/review`, {
          method: 'POST',
          body: JSON.stringify({ action: 'approve' }),
        })
      } catch (error) {
        console.error('Approve failed:', error)
      }
    }
  }, [sessionId, setReviewing])

  // 修订
  const handleRevise = useCallback(async (feedback: string) => {
    setReviewing(false)
    if (sessionId) {
      try {
        const { apiFetch } = await import('@/lib/api/client')
        await apiFetch(`/agent/sessions/${sessionId}/review`, {
          method: 'POST',
          body: JSON.stringify({ action: 'revise', feedback }),
        })
      } catch (error) {
        console.error('Revise failed:', error)
      }
    }
  }, [sessionId, setReviewing])

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧内容区域 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {children}
      </div>

      {/* 右侧 AI 对话面板 */}
      <div className="w-[400px] flex-shrink-0 border-l border-[var(--border-light)]">
        <AgentChat
          projectId={projectId}
          onSend={handleSend}
          onApprove={handleApprove}
          onRevise={handleRevise}
        />
      </div>
    </div>
  )
}
