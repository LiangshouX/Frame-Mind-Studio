'use client'

import { useEffect, useState } from 'react'
import { ScriptVersion } from '@/types/version'
import * as versionsApi from '@/lib/api/versions'
import { formatDate } from '@/lib/utils/format'
import { RotateCcw, GitCompare } from 'lucide-react'

interface VersionHistoryProps {
  projectId: string
  onRestore?: () => void
}

export function VersionHistory({ projectId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ScriptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { items } = await versionsApi.listVersions(projectId)
        setVersions(items)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  const handleRestore = async (versionId: string) => {
    try {
      await versionsApi.restoreVersion(projectId, versionId)
      onRestore?.()
    } catch {
      // silent
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 2) next.add(id)
      return next
    })
  }

  if (loading) return <div className="text-sm text-[var(--text-muted)] p-4">加载中...</div>
  if (versions.length === 0) return <div className="text-sm text-[var(--text-muted)] p-4">暂无版本历史</div>

  return (
    <div className="p-4">
      <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide mb-4 font-medium">版本历史</div>
      <div className="space-y-2">
        {versions.map((v) => (
          <div
            key={v.id}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm cursor-pointer transition-all ${
              selected.has(v.id) ? 'bg-[var(--accent-subtle)] border border-[var(--accent)]/20' : 'hover:bg-[var(--bg-hover)]'
            }`}
            onClick={() => toggleSelect(v.id)}
          >
            <span className="font-mono text-[var(--accent)] font-bold">v{v.version}</span>
            <span className="flex-1 text-[var(--text-secondary)] truncate">
              {v.message || '无备注'}
            </span>
            <span className="text-[var(--text-muted)]">{formatDate(v.created_at)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleRestore(v.id) }}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] rounded-lg transition-colors"
              title="回溯到此版本"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {selected.size === 2 && (
        <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 btn btn-secondary">
          <GitCompare className="h-4 w-4" />
          对比选中版本
        </button>
      )}
    </div>
  )
}
