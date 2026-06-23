'use client'

import { ChevronDown, ChevronRight, Brain, Wrench, Sparkles } from 'lucide-react'
import type { CollapsibleBlock as CollapsibleBlockType } from '@/types/agent'

interface CollapsibleBlockProps {
  block: CollapsibleBlockType
  onToggle: (id: string) => void
}

const BLOCK_CONFIG = {
  thinking: {
    icon: Brain,
    label: '思考过程',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  tool_call: {
    icon: Wrench,
    label: '工具调用',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  skill: {
    icon: Sparkles,
    label: '技能',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
} as const

export function CollapsibleBlock({ block, onToggle }: CollapsibleBlockProps) {
  const config = BLOCK_CONFIG[block.type]
  const Icon = config.icon

  const summary = block.isCollapsed
    ? block.type === 'tool_call' && block.toolName
      ? `使用工具: ${block.toolName}`
      : block.content.slice(0, 80) + (block.content.length > 80 ? '...' : '')
    : null

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} my-2 overflow-hidden`}>
      <button
        onClick={() => onToggle(block.id)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium ${config.color} hover:bg-white/5 transition-colors`}
      >
        {block.isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
        )}
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">
          {block.toolName ? `${config.label}: ${block.toolName}` : config.label}
        </span>
        {block.status === 'start' && (
          <span className="text-xs opacity-60 animate-pulse">执行中...</span>
        )}
      </button>

      {block.isCollapsed && summary && (
        <div className="px-3 pb-2 text-xs text-[var(--text-muted)] opacity-70">
          {summary}
        </div>
      )}

      {!block.isCollapsed && (
        <div className="px-3 pb-3 text-sm text-[var(--text-secondary)] whitespace-pre-wrap border-t border-white/5">
          {block.content || '等待内容...'}
        </div>
      )}
    </div>
  )
}
