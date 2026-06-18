import { AlertTriangle } from 'lucide-react'

interface BudgetWarningProps {
  message: string
}

export function BudgetWarning({ message }: BudgetWarningProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--warning)]/10 border-t border-[var(--warning)]/30 text-[var(--warning)] text-xs">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
