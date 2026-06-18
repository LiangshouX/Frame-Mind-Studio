import { AGENT_STAGES } from '@/constants/agent-stages'

interface MessageUI {
  id: string
  agentName: string
  role: 'agent' | 'user' | 'system'
  content: string
  isStreaming: boolean
  timestamp: string
}

interface MessageListProps {
  messages: MessageUI[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-base p-8">
        输入你的创意想法，开始和 Agent 对话
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
      {messages.map((msg) => {
        const stageInfo = AGENT_STAGES[msg.agentName as keyof typeof AGENT_STAGES]

        return (
          <div key={msg.id} className="flex gap-4">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: stageInfo?.color || '#666' }}
            >
              {msg.role === 'user' ? '你' : msg.agentName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-bold" style={{ color: stageInfo?.color }}>
                  {msg.role === 'user' ? '你' : stageInfo?.label || msg.agentName}
                </span>
                {msg.isStreaming && (
                  <span className="text-sm text-[var(--accent)] animate-pulse">输出中...</span>
                )}
              </div>
              <div className="text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
