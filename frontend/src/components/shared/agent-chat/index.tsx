'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { MessageList } from './message-list'
import { InputBar } from './input-bar'
import { BudgetWarning } from './budget-warning'
import { AgentConfigDrawer } from './agent-config-drawer'
import { useAgentStore } from '@/stores/agent-store'
import type { WorkflowStep } from '@/types/agent'

interface AgentChatProps {
  projectId: string
  workflowStep: WorkflowStep
  onSend: (text: string) => void
  onGenerate?: () => void
}

export function AgentChat({
  projectId,
  workflowStep,
  onSend,
  onGenerate,
}: AgentChatProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  const {
    sessions,
    activeTab,
    collapsibleBlocks,
    budgetWarning,
    tokensConsumed,
    connectionStatus,
    toggleBlockCollapse,
  } = useAgentStore()

  const currentTab = sessions[activeTab] || { messages: [], isRunning: false, isStreaming: false }
  const { messages, isRunning } = currentTab

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--bg-card)] overflow-hidden">
        {/* 头部 */}
        <div className="px-5 py-3 border-b border-[var(--border-light)] flex items-center justify-between">
          <div className="text-sm font-medium text-[var(--text-primary)]">
            AI 对话
          </div>
          <div className="flex items-center gap-1">
            {onGenerate && (
              <button
                onClick={onGenerate}
                disabled={isRunning}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80 disabled:opacity-50 transition-colors"
              >
                AI 一键生成
              </button>
            )}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              title="Agent 配置"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <MessageList
          messages={messages}
          collapsibleBlocks={collapsibleBlocks}
          onToggleBlock={toggleBlockCollapse}
        />

        {/* 预算警告 */}
        {budgetWarning && <BudgetWarning message={budgetWarning} />}

        {/* 输入栏 */}
        <InputBar onSend={onSend} disabled={isRunning} />

        {/* 底部状态栏 */}
        <div className="px-5 py-2.5 border-t border-[var(--border-light)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-[var(--accent)]'
                  : connectionStatus === 'connecting'
                    ? 'bg-[var(--gold)] animate-pulse'
                    : connectionStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-[var(--text-muted)]'
              }`}
            />
            {connectionStatus === 'connected'
              ? '已连接'
              : connectionStatus === 'connecting'
                ? '连接中...'
                : '未连接'}
          </span>
          <span>Token: {tokensConsumed.toLocaleString()}</span>
        </div>
      </div>

      {/* Agent 配置抽屉 */}
      <AgentConfigDrawer
        projectId={projectId}
        workflowStep={workflowStep}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  )
}
