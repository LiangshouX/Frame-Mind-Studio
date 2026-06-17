'use client'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { optimizeSegment } from '@/lib/api/scriptmind'
import { Sparkles, Loader2, Check, X, RotateCcw } from 'lucide-react'

interface Alternative {
  text: string
  style: string
  reason: string
}

interface OptimizePanelProps {
  projectId: string
  selectedText: string
  elementType: string
  context?: string
  onApply: (text: string) => void
  onClose: () => void
  className?: string
}

export function OptimizePanel({
  projectId,
  selectedText,
  elementType,
  context = '',
  onApply,
  onClose,
  className,
}: OptimizePanelProps) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appliedIdx, setAppliedIdx] = useState<number | null>(null)

  const handleOptimize = useCallback(async () => {
    if (!selectedText.trim()) return
    setLoading(true)
    setError('')
    setAlternatives([])
    try {
      const result = await optimizeSegment(projectId, selectedText, elementType, context)
      setAlternatives(result.alternatives || [])
    } catch (e: any) {
      setError(e.message || '优化失败')
    } finally {
      setLoading(false)
    }
  }, [projectId, selectedText, elementType, context])

  const handleApply = (text: string, idx: number) => {
    setAppliedIdx(idx)
    onApply(text)
  }

  return (
    <div className={cn(
      'rounded border border-[var(--border-light)] bg-[var(--bg-card)] shadow-lg overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-light)] bg-[var(--bg-sidebar)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">AI 润色</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Original text */}
      <div className="px-4 py-3 border-b border-[var(--border-light)]">
        <div className="text-[0.625rem] text-[var(--text-muted)] uppercase tracking-wider mb-1">
          原文
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
          "{selectedText}"
        </p>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {alternatives.length === 0 && !loading && !error && (
          <button
            onClick={handleOptimize}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            生成改写方案
          </button>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">正在生成改写方案...</span>
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <div className="p-2.5 border border-red-200 bg-red-50 text-red-700 text-xs rounded">
              {error}
            </div>
            <button
              onClick={handleOptimize}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--accent)] hover:bg-[var(--accent-light)] rounded transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              重试
            </button>
          </div>
        )}

        {alternatives.length > 0 && (
          <div className="space-y-3">
            {alternatives.map((alt, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded border p-3 transition-colors',
                  appliedIdx === idx
                    ? 'border-green-300 bg-green-50'
                    : 'border-[var(--border-light)] hover:border-[var(--accent)]'
                )}
              >
                {/* Style label */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.625rem] font-medium px-1.5 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-muted)]">
                    {alt.style}
                  </span>
                  {appliedIdx === idx ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      已应用
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(alt.text, idx)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-light)] rounded transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      应用
                    </button>
                  )}
                </div>

                {/* Text */}
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  {alt.text}
                </p>

                {/* Reason */}
                {alt.reason && (
                  <p className="text-[0.625rem] text-[var(--text-muted)] mt-1.5 italic">
                    {alt.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
