'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useVersionHistory, type VersionEntry } from '@/hooks/shared/useVersionHistory'
import { History, RefreshCw, Loader2, RotateCcw, ChevronRight, GitBranch } from 'lucide-react'

interface VersionHistoryProps {
  projectId: string
  onRestore?: () => void
  className?: string
}

export function VersionHistory({ projectId, onRestore, className }: VersionHistoryProps) {
  const { versions, total, loading, error, refresh, restore } = useVersionHistory({ projectId })
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleRestore = async (versionId: string) => {
    if (confirmId !== versionId) {
      setConfirmId(versionId)
      return
    }
    setRestoringId(versionId)
    try {
      await restore(versionId)
      onRestore?.()
    } catch {
      // Error handled in hook
    } finally {
      setRestoringId(null)
      setConfirmId(null)
    }
  }

  const sourceLabels: Record<string, string> = {
    manual: '手动编辑',
    agent: 'Agent 生成',
    restore: '版本回溯',
    import: '文件导入',
    auto_save: '自动保存',
  }

  return (
    <div className={cn('flex flex-col bg-[var(--bg-card)] border-l border-[var(--border-light)]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="font-mono text-xs tracking-[0.1em] text-[var(--text-muted)] uppercase">
            版本历史
          </span>
          {total > 0 && (
            <span className="font-mono text-[0.625rem] text-[var(--text-muted)] bg-[var(--bg-sidebar)] px-1.5 py-0.5 rounded">
              {total}
            </span>
          )}
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
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {error && (
          <div className="m-3 p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        {loading && versions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <GitBranch className="h-8 w-8 text-[var(--border)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">暂无版本记录</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">编辑后自动创建版本快照</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[1.375rem] top-0 bottom-0 w-px bg-[var(--border-light)]" />

            {versions.map((v) => (
              <div
                key={v.id}
                className="relative flex items-start gap-3 px-3 py-3 hover:bg-[var(--bg-sidebar)] transition-colors group"
              >
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 w-3 h-3 rounded-full bg-[var(--bg-card)] border-2 border-[var(--border)] group-hover:border-[var(--accent)] mt-0.5 transition-colors" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
                      v{v.version_number}
                    </span>
                    <span className="text-[0.625rem] text-[var(--text-muted)]">
                      {formatTime(v.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                    {v.change_summary || '无备注'}
                  </p>
                  <span className="inline-flex items-center mt-1 text-[0.625rem] px-1.5 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-muted)]">
                    {sourceLabels[v.change_source] || v.change_source}
                  </span>
                </div>

                {/* Restore button */}
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={restoringId === v.id}
                  className={cn(
                    'flex-shrink-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100',
                    confirmId === v.id
                      ? 'text-[var(--accent)] bg-[var(--accent-light)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)]'
                  )}
                  title={confirmId === v.id ? '确认回溯' : '回溯到此版本'}
                >
                  {restoringId === v.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin} 分钟前`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr} 小时前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
