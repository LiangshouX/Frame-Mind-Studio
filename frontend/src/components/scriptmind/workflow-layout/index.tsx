'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { AgentChat } from '@/components/shared/agent-chat'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import { ChatHistorySidebar } from '@/components/scriptmind/chat-history-sidebar'
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

/** 右侧面板 Tab 类型 */
type RightPanelTab = 'chat' | 'history'

/**
 * 统一的工作流布局组件。
 * 左侧为内容面板（60%），右侧为 AI 对话面板（40%）。
 * 右侧面板支持 Tab 切换：对话 / 历史。
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
    getModelSelection,
    loadSessionList,
    createNewSession,
  } = useAgentStore()

  const wsRef = useRef<ReturnType<typeof connectAgentWebSocket> | null>(null)
  const [rightTab, setRightTab] = useState<RightPanelTab>('chat')

  // 设置当前活跃 Tab
  useEffect(() => {
    setActiveTab(step)
    // 加载会话列表
    loadSessionList(projectId, step)
  }, [step, setActiveTab, projectId, loadSessionList])

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
        const currentSessionId = sessions[step]?.sessionId || undefined
        const modelSel = getModelSelection(step)
        const result = await sendChatMessage(
          projectId, step, text, undefined,
          modelSel?.providerId, modelSel?.modelName,
          currentSessionId
        )
        setSession(result.session_id)

        // 更新 store 中的 sessionId
        useAgentStore.setState((state) => {
          const tab = state.sessions[step]
          if (tab) {
            return {
              sessions: {
                ...state.sessions,
                [step]: { ...tab, sessionId: result.session_id },
              },
            }
          }
          return {}
        })

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
    [projectId, step, addMessage, setSession, setRunning, handleMessage, setConnectionStatus, getModelSelection, sessions]
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

      const modelSel = getModelSelection(step)
      const result = await triggerGeneration(
        projectId, step, actionMap[step] || 'generate',
        modelSel?.providerId, modelSel?.modelName
      )
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
  }, [projectId, step, addMessage, setSession, setRunning, handleMessage, setConnectionStatus, getModelSelection])

  // 新建对话
  const handleNewChat = useCallback(async () => {
    await createNewSession(projectId, step)
    setRightTab('chat')
  }, [projectId, step, createNewSession])

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧内容区域 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>

      {/* 右侧 AI 面板 */}
      <ResizablePanel
        defaultWidth={480}
        minWidth={360}
        storageKey="agent-chat-width"
        side="left"
        className="border-l border-[var(--border-light)]"
      >
        <div className="flex flex-col h-full">
          {/* Tab 切换栏 */}
          <div className="flex border-b border-[var(--border-light)]">
            <button
              onClick={() => setRightTab('chat')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                rightTab === 'chat'
                  ? 'text-[var(--text-accent)] border-b-2 border-[var(--border-accent)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              对话
            </button>
            <button
              onClick={() => setRightTab('history')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                rightTab === 'history'
                  ? 'text-[var(--text-accent)] border-b-2 border-[var(--border-accent)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              历史
            </button>
          </div>

          {/* Tab 内容 */}
          <div className="flex-1 overflow-hidden">
            {rightTab === 'chat' ? (
              <AgentChat
                projectId={projectId}
                workflowStep={step}
                onSend={handleSend}
                onGenerate={handleGenerate}
              />
            ) : (
              <ChatHistorySidebar
                projectId={projectId}
                workflowStep={step}
                onNewChat={handleNewChat}
              />
            )}
          </div>
        </div>
      </ResizablePanel>
    </div>
  )
}
