'use client'

import { useState, useMemo } from 'react'
import { MessageList } from './message-list'
import { InputBar } from './input-bar'
import { StageIndicator } from './stage-indicator'
import { ReviewPanel } from './review-panel'
import { BudgetWarning } from './budget-warning'
import { useAgentStore } from '@/stores/agent-store'

interface AgentChatProps {
  projectId: string
  onSend: (text: string, stylePreset?: string) => void
  onApprove: () => void
  onRevise: (feedback: string) => void
}

export function AgentChat({ projectId, onSend, onApprove, onRevise }: AgentChatProps) {
  const { messages, isRunning, isReviewing, reviewContent, stage, budgetWarning, tokensConsumed, connectionStatus } = useAgentStore()
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const filteredMessages = useMemo(() => {
    if (!activeFilter) return messages
    return messages.filter((msg) => msg.agentName === activeFilter || msg.role === 'user' || msg.role === 'system')
  }, [messages, activeFilter])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border-light)]">
        <StageIndicator
          currentStage={stage}
          isRunning={isRunning}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      <MessageList messages={filteredMessages} />
      {budgetWarning && <BudgetWarning message={budgetWarning} />}

      {isReviewing && reviewContent ? (
        <ReviewPanel content={reviewContent} onApprove={onApprove} onRevise={onRevise} />
      ) : (
        <InputBar onSend={onSend} disabled={isRunning} />
      )}

      <div className="px-5 py-2.5 border-t border-[var(--border-light)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            connectionStatus === 'connected' ? 'bg-[var(--accent)]' :
            connectionStatus === 'connecting' ? 'bg-[var(--gold)] animate-pulse' :
            'bg-[var(--text-muted)]'
          }`} />
          {connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '未连接'}
        </span>
        <span>Token: {tokensConsumed.toLocaleString()}</span>
      </div>
    </div>
  )
}
