'use client'
import { cn } from '@/lib/utils'
import { GitCompare, Plus, Minus, PenLine } from 'lucide-react'

interface DiffViewerProps {
  diff: {
    episodes_added: number[]
    episodes_removed: number[]
    episodes_modified: Array<{
      episode_number: number
      old_title?: string
      new_title?: string
      changed: boolean
    }>
  }
  className?: string
}

export function DiffViewer({ diff, className }: DiffViewerProps) {
  const hasChanges =
    diff.episodes_added.length > 0 ||
    diff.episodes_removed.length > 0 ||
    diff.episodes_modified.length > 0

  if (!hasChanges) {
    return (
      <div className={cn('text-center py-6', className)}>
        <GitCompare className="h-6 w-6 text-[var(--border)] mx-auto mb-2" />
        <p className="text-xs text-[var(--text-muted)]">两个版本无差异</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Added episodes */}
      {diff.episodes_added.map((epNum) => (
        <div
          key={`add_${epNum}`}
          className="flex items-center gap-2 px-3 py-2 rounded bg-green-50 border border-green-200"
        >
          <Plus className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
          <span className="text-xs text-green-700">
            新增第 {epNum} 集
          </span>
        </div>
      ))}

      {/* Removed episodes */}
      {diff.episodes_removed.map((epNum) => (
        <div
          key={`rm_${epNum}`}
          className="flex items-center gap-2 px-3 py-2 rounded bg-red-50 border border-red-200"
        >
          <Minus className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-700">
            删除第 {epNum} 集
          </span>
        </div>
      ))}

      {/* Modified episodes */}
      {diff.episodes_modified.map((ep) => (
        <div
          key={`mod_${ep.episode_number}`}
          className="flex items-center gap-2 px-3 py-2 rounded bg-amber-50 border border-amber-200"
        >
          <PenLine className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-xs text-amber-700">
            修改第 {ep.episode_number} 集
            {ep.old_title && ep.new_title && ep.old_title !== ep.new_title && (
              <span className="text-amber-500">
                : {ep.old_title} → {ep.new_title}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
