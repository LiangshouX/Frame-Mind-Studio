import { ReactNode } from 'react'

interface EmptyStateProps { icon?: ReactNode; title: string; description?: string; action?: ReactNode }

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {icon && <div className="mb-6 text-[var(--text-muted)]">{icon}</div>}
      <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-3">{title}</h3>
      {description && <p className="text-base text-[var(--text-secondary)] mb-8 max-w-sm leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}
