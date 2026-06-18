'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScriptVersion } from '@/types/version'
import * as versionsApi from '@/lib/api/versions'
import { Loader2, RotateCcw, GitCompare, History } from 'lucide-react'

interface VersionHistoryProps {
  projectId: string
  onRestore?: (content: ScriptVersion['content']) => void
}

export function VersionHistory({ projectId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ScriptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())
  const [diff, setDiff] = useState<{ from: number; to: number; data: unknown } | null>(null)
  const [diffLoading, setDiffLoading] = useState(false)

  const loadVersions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await versionsApi.listVersions(projectId)
      setVersions(result.items || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  const handleRestore = useCallback(async (versionNumber: number) => {
    try {
      const script = await versionsApi.restoreVersion(projectId, versionNumber)
      onRestore?.(script.content)
      await loadVersions()
    } catch (err) {
      setError((err as Error).message)
    }
  }, [projectId, onRestore, loadVersions])

  const handleCompare = useCallback(async () => {
    const ids = Array.from(selectedForCompare)
    if (ids.length !== 2) return
    const v1 = versions.find((v) => v.id === ids[0])
    const v2 = versions.find((v) => v.id === ids[1])
    if (!v1 || !v2) return
    setDiffLoading(true)
    try {
      const result = await versionsApi.compareVersions(
        projectId,
        Math.min(v1.version, v2.version),
        Math.max(v1.version, v2.version),
      )
      setDiff({ from: Math.min(v1.version, v2.version), to: Math.max(v1.version, v2.version), data: result.diff })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDiffLoading(false)
    }
  }, [selectedForCompare, versions, projectId])

  const toggleSelect = (id: string) => {
    setSelectedForCompare((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 2) {
        next.add(id)
      } else {
        const first = next.values().next().value!
        next.delete(first)
        next.add(id)
      }
      return next
    })
    setDiff(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-[var(--error)] p-3 rounded-lg bg-[var(--error-bg)]">
        {error}
        <button onClick={loadVersions} className="ml-2 underline">重试</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
          <History className="h-4 w-4 text-[var(--accent)]" />
          版本历史
        </div>
        {selectedForCompare.size === 2 && (
          <button
            onClick={handleCompare}
            disabled={diffLoading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            {diffLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitCompare className="h-3 w-3" />}
            对比
          </button>
        )}
      </div>

      {versions.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] py-4">暂无版本记录</div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className={`p-3 rounded-lg border transition-all ${
                selectedForCompare.has(v.id)
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-[var(--border)] hover:border-[var(--border-light)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-mono font-bold text-[var(--accent)]">v{v.version}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSelect(v.id)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      selectedForCompare.has(v.id)
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {selectedForCompare.has(v.id) ? '已选' : '选择'}
                  </button>
                  <button
                    onClick={() => handleRestore(v.version)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                    title="回溯到此版本"
                  >
                    <RotateCcw className="h-3 w-3" /> 回溯
                  </button>
                </div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {new Date(v.created_at).toLocaleString('zh-CN')}
              </div>
              {v.message && (
                <div className="text-sm text-[var(--text-secondary)] mt-1">{v.message}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {diff && (
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <div className="text-sm font-bold text-[var(--text-primary)] mb-2">
            v{diff.from} → v{diff.to} 差异
          </div>
          <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(diff.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
