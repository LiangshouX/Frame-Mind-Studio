import { useEffect, useRef } from 'react'
import { AGENT_STAGES } from '@/constants/agent-stages'

interface MessageUI {
  id: string
  agentName: string
  role: 'agent' | 'user' | 'system' | 'error'
  content: string
  isStreaming: boolean
  timestamp: string
}

interface MessageListProps {
  messages: MessageUI[]
}

export function MessageList({ messages }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-base p-8">
        输入你的创意想法，开始和 Agent 对话
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
      {messages.map((msg) => {
        const stageInfo = AGENT_STAGES[msg.agentName as keyof typeof AGENT_STAGES]
        const isError = msg.role === 'error'

        return (
          <div key={msg.id} className={`flex gap-3 ${isError ? 'bg-[var(--error-bg)] rounded-lg p-3' : ''}`}>
            <div
              className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: isError ? 'var(--error)' : stageInfo?.color || '#666' }}
            >
              {msg.role === 'user' ? '你' : isError ? '!' : msg.agentName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold" style={{ color: isError ? 'var(--error)' : stageInfo?.color }}>
                  {msg.role === 'user' ? '你' : isError ? '错误' : stageInfo?.label || msg.agentName}
                </span>
                {msg.isStreaming && (
                  <span className="text-xs text-[var(--accent)] animate-pulse">输出中...</span>
                )}
              </div>
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isError ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
