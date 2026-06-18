import { AGENT_STAGES } from '@/constants/agent-stages'
import { Check, Loader2, Filter, X } from 'lucide-react'

interface StageIndicatorProps {
  currentStage: string | null
  isRunning: boolean
  activeFilter: string | null
  onFilterChange: (filter: string | null) => void
}

const STAGE_ORDER = ['showrunner', 'world_builder', 'character_designer', 'script_doctor'] as const

export function StageIndicator({ currentStage, isRunning, activeFilter, onFilterChange }: StageIndicatorProps) {
  const currentIdx = currentStage ? STAGE_ORDER.indexOf(currentStage as typeof STAGE_ORDER[number]) : -1

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        {STAGE_ORDER.map((stage, idx) => {
          const info = AGENT_STAGES[stage]
          const isActive = stage === currentStage && isRunning
          const isDone = currentIdx > idx
          const isFiltered = activeFilter === stage

          return (
            <div key={stage} className="flex items-center gap-1.5">
              <button
                onClick={() => onFilterChange(isFiltered ? null : stage)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-medium transition-all cursor-pointer ${
                  isFiltered
                    ? 'ring-2 ring-[var(--accent)] ring-offset-1 bg-[var(--accent-subtle)] text-[var(--accent)]'
                    : isActive
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : isDone
                        ? 'bg-[var(--success-bg)] text-[var(--accent)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
                title={`点击查看 ${info.label} 的输出`}
              >
                {isActive ? <Loader2 className="h-3 w-3 animate-spin" /> : isDone ? <Check className="h-3 w-3" /> : null}
                {info.label}
              </button>
              {idx < STAGE_ORDER.length - 1 && (
                <div className={`w-4 h-px ${isDone ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {activeFilter && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--accent-subtle)] text-xs text-[var(--accent)]">
          <Filter className="h-3 w-3" />
          <span>正在查看: {AGENT_STAGES[activeFilter as keyof typeof AGENT_STAGES]?.label}</span>
          <button
            onClick={() => onFilterChange(null)}
            className="ml-auto p-0.5 rounded hover:bg-[var(--accent)]/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
