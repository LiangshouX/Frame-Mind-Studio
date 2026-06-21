'use client'

import { WorkflowStep, WORKFLOW_STEP_LABELS, WORKFLOW_STEP_ORDER } from '@/types/workflow'
import { Check, Loader2 } from 'lucide-react'

interface WorkflowTabsProps {
  currentStep: WorkflowStep
  stepStatuses: Record<WorkflowStep, 'pending' | 'in_progress' | 'completed'>
  onStepChange: (step: WorkflowStep) => void
}

export function WorkflowTabs({ currentStep, stepStatuses, onStepChange }: WorkflowTabsProps) {
  return (
    <div className="flex border-b border-[var(--border)] bg-[var(--bg-card)]">
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
              flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all
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
              flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
              ${isActive
                ? 'bg-[var(--accent)] text-white'
                : isCompleted
                  ? 'bg-[var(--success)] text-white'
                  : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
              }
            `}>
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : isInProgress ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                index + 1
              )}
            </span>

            {/* 步骤名称 */}
            <span className="hidden sm:inline">{WORKFLOW_STEP_LABELS[step]}</span>
          </button>
        )
      })}
    </div>
  )
}
