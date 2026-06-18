'use client'

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

  return (
    <div className="flex flex-col h-full border border-[var(--border)] rounded-xl bg-[var(--bg-card)] overflow-hidden shadow-soft">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <StageIndicator currentStage={stage} isRunning={isRunning} />
      </div>

      <MessageList messages={messages} />
      {budgetWarning && <BudgetWarning message={budgetWarning} />}

      {isReviewing && reviewContent ? (
        <ReviewPanel content={reviewContent} onApprove={onApprove} onRevise={onRevise} />
      ) : (
        <InputBar onSend={onSend} disabled={isRunning} />
      )}

      <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
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
