'use client'
import { cn } from '@/lib/utils'
import { useQualityMetrics } from '@/hooks/scriptmind/useQualityMetrics'
import { BarChart3, RefreshCw, Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import type { QualityMetrics } from '@/types/script'

interface QualityDashboardProps {
  projectId: string
  className?: string
}

const METRIC_CONFIG = [
  { key: 'hookStrength', label: '钩子强度', icon: '🎯', unit: '%' },
  { key: 'rhythmCurve', label: '节奏曲线', icon: '📈', unit: '%' },
  { key: 'characterBalance', label: '角色平衡', icon: '⚖️', unit: '%' },
  { key: 'dialogueRatio', label: '对白占比', icon: '💬', unit: '%' },
  { key: 'sceneDiversity', label: '场景多样性', icon: '🎬', unit: '%' },
] as const

export function QualityDashboard({ projectId, className }: QualityDashboardProps) {
  const { metrics, loading, error, refresh } = useQualityMetrics({ projectId })

  return (
    <div className={cn('flex flex-col bg-[var(--bg-card)] border-l border-[var(--border-light)]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="font-mono text-xs tracking-[0.1em] text-[var(--text-muted)] uppercase">
            质量评估
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)] disabled:opacity-50 transition-colors"
          title="刷新"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {error && (
          <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        {loading && !metrics ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : metrics ? (
          <>
            {/* Overall score */}
            <div className="text-center pb-4 border-b border-[var(--border-light)]">
              <div className="font-display text-3xl font-bold text-[var(--text-primary)]">
                {metrics.overallScore}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">综合评分</div>
              <ScoreBadge score={metrics.overallScore} className="mt-2" />
            </div>

            {/* Individual metrics */}
            {METRIC_CONFIG.map(({ key, label, icon, unit }) => {
              const metric = metrics[key]
              if (!metric) return null
              const value = Math.round(metric.value * 100)
              const status = metric.status

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <span>{icon}</span>
                      {label}
                    </span>
                    <StatusIcon status={status} />
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-[var(--bg-sidebar)] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        status === 'pass' ? 'bg-green-500' :
                        status === 'warning' ? 'bg-amber-500' :
                        'bg-[var(--border)]'
                      )}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[0.625rem] text-[var(--text-muted)]">
                    <span>{value}{unit}</span>
                    <span>{metric.details}</span>
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-8 w-8 text-[var(--border)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">暂无质量数据</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">编辑剧本后自动计算</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    case 'warning':
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
    default:
      return <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
  }
}

function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const level =
    score >= 80 ? { label: '优秀', color: 'bg-green-100 text-green-700 border-green-200' } :
    score >= 60 ? { label: '良好', color: 'bg-amber-100 text-amber-700 border-amber-200' } :
    score >= 40 ? { label: '一般', color: 'bg-orange-100 text-orange-700 border-orange-200' } :
    { label: '待改进', color: 'bg-red-100 text-red-700 border-red-200' }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border', level.color, className)}>
      {level.label}
    </span>
  )
}
