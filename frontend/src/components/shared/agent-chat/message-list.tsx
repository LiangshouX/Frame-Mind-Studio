import { useEffect, useRef } from 'react'
import { CollapsibleBlock } from './collapsible-block'
import type { CollapsibleBlock as CollapsibleBlockType } from '@/types/agent'

interface MessageUI {
  id: string
  agentName: string
  role: 'user' | 'assistant' | 'system' | 'error'
  content: string
  messageType?: string
  isStreaming: boolean
  timestamp: string
}

interface MessageListProps {
  messages: MessageUI[]
  collapsibleBlocks: CollapsibleBlockType[]
  onToggleBlock: (id: string) => void
}

export function MessageList({ messages, collapsibleBlocks, onToggleBlock }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, collapsibleBlocks])

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
        const isError = msg.role === 'error'
        const isUser = msg.role === 'user'
        const isSystem = msg.role === 'system'

        // 查找与该消息关联的可折叠块
        const relatedBlocks = collapsibleBlocks.filter((b) => {
          // 简单匹配：在消息之前添加的块
          return false // 块独立渲染
        })

        return (
          <div key={msg.id}>
            <div
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${
                isError ? 'bg-red-500/10 rounded-lg p-3' : ''
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  isUser
                    ? 'bg-[var(--accent)] text-white'
                    : isError
                      ? 'bg-red-500/20 text-red-400'
                      : isSystem
                        ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] text-sm italic'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                }`}
              >
                {!isUser && !isSystem && (
                  <div className="text-xs font-medium mb-1 opacity-60">
                    {msg.agentName}
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5" />
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* 独立渲染可折叠块 */}
      {collapsibleBlocks.map((block) => (
        <CollapsibleBlock
          key={block.id}
          block={block}
          onToggle={onToggleBlock}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
