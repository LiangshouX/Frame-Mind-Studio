import { MetricItem } from '@/types/quality'
import { formatPercent } from '@/lib/utils/format'

interface MetricCardProps {
  label: string
  metric: MetricItem
}

export function MetricCard({ label, metric }: MetricCardProps) {
  const isWarning = metric.status === 'warning'

  return (
    <div className={`p-4 rounded-xl border ${isWarning ? 'border-[var(--warning)]/30 bg-[var(--warning-bg)]' : 'border-[var(--border-light)] bg-[var(--bg-card)]'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--text-muted)] font-medium">{label}</span>
        <span className={`badge ${isWarning ? 'badge-warning' : 'badge-success'}`}>
          {isWarning ? '警告' : '通过'}
        </span>
      </div>
      <div className="text-2xl font-bold">{formatPercent(metric.value)}</div>
      <div className="text-sm text-[var(--text-muted)] mt-2">{metric.details}</div>
    </div>
  )
}
