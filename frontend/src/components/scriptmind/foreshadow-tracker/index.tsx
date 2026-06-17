'use client'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { listForeshadows } from '@/lib/api/scriptmind'
import { Eye, EyeOff, RefreshCw, Loader2, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react'

interface Foreshadow {
  id: string
  description: string
  planted_episode: number
  resolved: boolean
  resolved_episode?: number
  resolution_note?: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

interface ForeshadowTrackerProps {
  projectId: string
  className?: string
}

const URGENCY_CONFIG = {
  low: { label: '低', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  medium: { label: '中', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: '紧急', color: 'bg-red-100 text-red-700 border-red-200' },
}

export function ForeshadowTracker({ projectId, className }: ForeshadowTrackerProps) {
  const [foreshadows, setForeshadows] = useState<Foreshadow[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const resolved = filter === 'all' ? undefined : filter === 'resolved'
      const data = await listForeshadows(projectId, resolved)
      setForeshadows(data.items as Foreshadow[] || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [projectId, filter])

  useEffect(() => { refresh() }, [refresh])

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const unresolvedCount = foreshadows.filter((f) => !f.resolved).length

  return (
    <div className={cn('flex flex-col bg-[var(--bg-card)] border-l border-[var(--border-light)]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="font-mono text-xs tracking-[0.1em] text-[var(--text-muted)] uppercase">
            伏笔追踪
          </span>
          {unresolvedCount > 0 && (
            <span className="font-mono text-[0.625rem] text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.5 rounded">
              {unresolvedCount}
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-[var(--border-light)]">
        {(['all', 'unresolved', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              filter === f
                ? 'bg-[var(--accent-light)] text-[var(--accent)] font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            {f === 'all' ? '全部' : f === 'unresolved' ? '未回收' : '已回收'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && foreshadows.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : foreshadows.length === 0 ? (
          <div className="text-center py-8">
            <EyeOff className="h-8 w-8 text-[var(--border)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">
              {filter === 'unresolved' ? '所有伏笔已回收' : '暂无伏笔'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-light)]">
            {foreshadows.map((fs) => {
              const isExpanded = expanded.has(fs.id)
              const urgency = URGENCY_CONFIG[fs.urgency] || URGENCY_CONFIG.medium

              return (
                <div key={fs.id} className="hover:bg-[var(--bg-sidebar)] transition-colors">
                  <button
                    onClick={() => toggleExpanded(fs.id)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left"
                  >
                    {/* Status icon */}
                    {fs.resolved ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-primary)] line-clamp-2">
                        {fs.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[0.625rem] text-[var(--text-muted)]">
                          埋设: 第{fs.planted_episode}集
                        </span>
                        {fs.resolved && fs.resolved_episode && (
                          <span className="text-[0.625rem] text-green-600">
                            回收: 第{fs.resolved_episode}集
                          </span>
                        )}
                        <span className={cn('text-[0.625rem] px-1 py-0 rounded border', urgency.color)}>
                          {urgency.label}
                        </span>
                      </div>
                    </div>

                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0 transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </button>

                  {isExpanded && fs.resolution_note && (
                    <div className="px-3 pb-2.5 pl-9">
                      <p className="text-xs text-[var(--text-muted)] italic">
                        {fs.resolution_note}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
