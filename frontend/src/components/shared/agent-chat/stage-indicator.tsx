import { AGENT_STAGES } from '@/constants/agent-stages'
import { Check, Loader2 } from 'lucide-react'

interface StageIndicatorProps {
  currentStage: string | null
  isRunning: boolean
}

const STAGE_ORDER = ['showrunner', 'world_builder', 'character_designer', 'script_doctor'] as const

export function StageIndicator({ currentStage, isRunning }: StageIndicatorProps) {
  const currentIdx = currentStage ? STAGE_ORDER.indexOf(currentStage as typeof STAGE_ORDER[number]) : -1

  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin py-2">
      {STAGE_ORDER.map((stage, idx) => {
        const info = AGENT_STAGES[stage]
        const isActive = stage === currentStage && isRunning
        const isDone = currentIdx > idx

        return (
          <div key={stage} className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap font-medium transition-all ${
                isActive
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : isDone
                    ? 'bg-[var(--success-bg)] text-[var(--accent)] border border-[var(--accent)]/15'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}
            >
              {isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : isDone ? <Check className="h-4 w-4" /> : null}
              {info.label}
            </div>
            {idx < STAGE_ORDER.length - 1 && (
              <div className={`w-8 h-px ${isDone ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
