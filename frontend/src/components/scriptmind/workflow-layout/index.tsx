'use client'

import { useEffect, useRef, useCallback } from 'react'
import { AgentChat } from '@/components/shared/agent-chat'
import { useAgentStore } from '@/stores/agent-store'
import { connectAgentWebSocket } from '@/lib/websocket/stomp-client'
import { sendChatMessage, triggerGeneration, getChatHistory } from '@/lib/api/agent-api'
import type { AgentWebSocketMessage, WorkflowStep } from '@/types/agent'

interface WorkflowLayoutProps {
  projectId: string
  step: WorkflowStep
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
    setSession,
    setActiveTab,
    addMessage,
    appendStream,
    finishStreaming,
    setRunning,
    setTokens,
    setBudgetWarning,
    setConnectionStatus,
    addCollapsibleBlock,
    updateCollapsibleBlock,
    sessions,
  } = useAgentStore()

  const wsRef = useRef<ReturnType<typeof connectAgentWebSocket> | null>(null)

  // 设置当前活跃 Tab
  useEffect(() => {
    setActiveTab(step)
  }, [step, setActiveTab])

  // 加载聊天历史
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getChatHistory(projectId, step)
        if (history && history.messages) {
          // 将历史消息添加到 store
          for (const msg of history.messages) {
            addMessage({
              id: msg.id,
              agentName: msg.role === 'user' ? 'user' : history.agent_name || 'assistant',
              role: msg.role === 'user' ? 'user' : msg.role === 'system' ? 'system' : 'assistant',
              content: msg.content,
              messageType: msg.message_type || 'text',
              isStreaming: false,
              timestamp: msg.created_at,
            })
          }
          if (history.id) {
            setSession(history.id)
          }
        }
      } catch {
        // 静默失败，首次使用时没有历史
      }
    }
    loadHistory()
  }, [projectId, step]) // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket 消息处理
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
          } else if (msg.data.status === 'delta') {
            updateCollapsibleBlock(msg.data.block_id, {
              content:
                (useAgentStore.getState().collapsibleBlocks.find((b) => b.id === msg.data.block_id)
                  ?.content || '') + msg.data.content,
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
          finishStreaming()
          setRunning(false)
          setTokens(msg.data.tokens_consumed)
          addMessage({
            id: `complete-${Date.now()}`,
            agentName: 'system',
            role: 'system',
            content: '✅ 生成完成',
            messageType: 'text',
            isStreaming: false,
            timestamp: new Date().toISOString(),
          })
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
      finishStreaming,
      setRunning,
      setTokens,
      addMessage,
      setBudgetWarning,
      addCollapsibleBlock,
      updateCollapsibleBlock,
      onGenerate,
    ]
  )

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
  const handleSend = useCallback(
    async (text: string) => {
      addMessage({
        id: `user-${Date.now()}`,
        agentName: 'user',
        role: 'user',
        content: text,
        messageType: 'text',
        isStreaming: false,
        timestamp: new Date().toISOString(),
      })

      setRunning(true)

      try {
        const result = await sendChatMessage(projectId, step, text)
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
        setRunning(false)
        addMessage({
          id: `error-${Date.now()}`,
          agentName: 'system',
          role: 'error',
          content: `❌ 发送失败: ${error instanceof Error ? error.message : '未知错误'}`,
          messageType: 'text',
          isStreaming: false,
          timestamp: new Date().toISOString(),
        })
      }
    },
    [projectId, step, addMessage, setSession, setRunning, handleMessage, setConnectionStatus]
  )

  // AI 一键生成
  const handleGenerate = useCallback(async () => {
    setRunning(true)

    try {
      const actionMap: Record<string, string> = {
        worldview: 'generate_concept',
        synopsis: 'generate_synopsis',
        characters: 'generate_all',
        outline: 'generate_outline',
        script: 'generate_script',
      }

      const result = await triggerGeneration(projectId, step, actionMap[step] || 'generate')
      setSession(result.session_id)

      if (wsRef.current) {
        wsRef.current.disconnect()
      }

      wsRef.current = connectAgentWebSocket(result.session_id, {
        onMessage: handleMessage,
        onConnectionChange: setConnectionStatus,
      })
    } catch (error) {
      console.error('Generation failed:', error)
      setRunning(false)
      addMessage({
        id: `error-${Date.now()}`,
        agentName: 'system',
        role: 'error',
        content: `❌ 生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
        messageType: 'text',
        isStreaming: false,
        timestamp: new Date().toISOString(),
      })
    }
  }, [projectId, step, addMessage, setSession, setRunning, handleMessage, setConnectionStatus])

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧内容区域 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>

      {/* 右侧 AI 对话面板 */}
      <div className="w-[400px] flex-shrink-0 border-l border-[var(--border-light)]">
        <AgentChat
          projectId={projectId}
          workflowStep={step}
          onSend={handleSend}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  )
}
