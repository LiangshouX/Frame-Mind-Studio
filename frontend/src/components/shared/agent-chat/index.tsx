'use client'
import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { AGENT_LABELS } from '@/../../shared/constants/pipeline'

interface AgentMessage {
  agentName: string
  role: 'agent' | 'user' | 'system'
  content: string
}

interface AgentChatProps {
  messages: AgentMessage[]
  isRunning: boolean
  currentStage: string | null
  stageLabel: string | null
  hitlPending: boolean
  hitlOptions: string[]
  onReview?: (action: 'approve' | 'revise', feedback?: string) => void
}

const AGENT_COLORS: Record<string, string> = {
  showrunner: 'var(--agent-showrunner)',
  world_builder: 'var(--agent-worldbuilder)',
  character_designer: 'var(--agent-character)',
  script_doctor: 'var(--agent-scriptdoctor)',
  human_review: 'var(--accent)',
  system: 'var(--text-muted)',
}

export function AgentChat({
  messages,
  isRunning,
  currentStage,
  stageLabel,
  hitlPending,
  hitlOptions,
  onReview,
}: AgentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] border-l border-[var(--border-light)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', isRunning ? 'bg-green-500 animate-pulse' : 'bg-[var(--border)]')} />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {stageLabel || 'Agent 面板'}
          </span>
        </div>
        {currentStage && (
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${AGENT_COLORS[currentStage]}15`, color: AGENT_COLORS[currentStage] }}>
            {AGENT_LABELS[currentStage] || currentStage}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center text-[var(--text-muted)] text-sm py-12">
            输入创意，开始 AI 协作
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: AGENT_COLORS[msg.agentName] || 'var(--border)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--text-muted)] mb-0.5">
                {AGENT_LABELS[msg.agentName] || msg.agentName}
              </div>
              <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* HITL Review Panel */}
      {hitlPending && onReview && (
        <div className="border-t border-[var(--border-light)] p-4 bg-[var(--accent-light)]">
          <div className="text-sm font-medium text-[var(--accent)] mb-2">等待审核</div>
          <div className="flex gap-2">
            <button
              onClick={() => onReview('approve')}
              className="flex-1 px-3 py-2 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors"
            >
              批准
            </button>
            <button
              onClick={() => onReview('revise')}
              className="flex-1 px-3 py-2 text-sm border border-[var(--border)] text-[var(--text-secondary)] rounded hover:border-[var(--text-primary)] transition-colors"
            >
              修改
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
