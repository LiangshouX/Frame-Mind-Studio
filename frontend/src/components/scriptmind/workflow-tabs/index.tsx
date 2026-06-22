'use client'

import { WorkflowStep, WORKFLOW_STEP_LABELS, WORKFLOW_STEP_ORDER } from '@/types/workflow'
import { Check, Loader2 } from 'lucide-react'

interface WorkflowTabsProps {
  currentStep: WorkflowStep
  stepStatuses: Record<WorkflowStep, 'pending' | 'in_progress' | 'completed'>
  onStepChange: (step: WorkflowStep) => void
}

// 步骤简称映射（用于移动端紧凑显示）
const STEP_SHORT_LABELS: Record<WorkflowStep, string> = {
  worldview: '世界观',
  synopsis: '梗概',
  characters: '角色',
  outline: '大纲',
  script: '剧本',
}

export function WorkflowTabs({ currentStep, stepStatuses, onStepChange }: WorkflowTabsProps) {
  return (
    <div className="flex border-b border-[var(--border)] bg-[var(--bg-card)] overflow-x-auto">
      {WORKFLOW_STEP_ORDER.map((step, index) => {
        const status = stepStatuses[step]
        const isActive = step === currentStep
        const isCompleted = status === 'completed'
        const isInProgress = status === 'in_progress'

        return (
          <button
            key={step}
            onClick={() => onStepChange(step)}
            className={`
              flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-all whitespace-nowrap
              ${isActive
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent-subtle)]'
                : isCompleted
                  ? 'text-[var(--success)] hover:bg-[var(--bg-hover)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }
            `}
          >
            {/* 步骤编号/状态图标 */}
            <span className={`
              flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold flex-shrink-0
              ${isActive
                ? 'bg-[var(--accent)] text-white'
                : isCompleted
                  ? 'bg-[var(--success)] text-white'
                  : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
              }
            `}>
              {isCompleted ? (
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              ) : isInProgress ? (
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
              ) : (
                index + 1
              )}
            </span>

            {/* 步骤名称 - 始终显示简称 */}
            <span className="truncate">{STEP_SHORT_LABELS[step]}</span>
          </button>
        )
      })}
    </div>
  )
}
