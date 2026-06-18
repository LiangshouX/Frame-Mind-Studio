'use client'

import { useState } from 'react'
import * as agentApi from '@/lib/api/agent'
import { Wand2, Loader2, X } from 'lucide-react'

interface OptimizePanelProps {
  projectId: string
  selectedText: string
  elementType?: string
  onClose: () => void
  onApply: (text: string) => void
}

export function OptimizePanel({ projectId, selectedText, elementType = 'dialogue', onClose, onApply }: OptimizePanelProps) {
  const [alternatives, setAlternatives] = useState<Array<{ text: string; style: string; reason: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOptimize = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await agentApi.optimizeSegment({
        project_id: projectId,
        text: selectedText,
        element_type: elementType,
      })
      setAlternatives(result.alternatives)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-card)] p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-base font-bold">
          <Wand2 className="h-5 w-5 text-[var(--gold)]" />
          AI 优化建议
        </div>
        <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="text-sm text-[var(--text-muted)] mb-4 p-3 rounded-lg bg-[var(--bg)]">
        {selectedText}
      </div>

      {alternatives.length === 0 && !loading && !error && (
        <button onClick={handleOptimize} className="w-full btn btn-gold">
          生成优化建议
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-6 text-[var(--text-muted)] text-base">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          生成中...
        </div>
      )}

      {error && (
        <div className="text-sm text-[var(--error)] p-3 rounded-lg bg-[var(--error-bg)]">{error}</div>
      )}

      {alternatives.length > 0 && (
        <div className="space-y-3">
          {alternatives.map((alt, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-[var(--border-light)] hover:border-[var(--gold)] transition-all">
              <div className="text-base text-[var(--text-secondary)] mb-3 leading-relaxed">{alt.text}</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">{alt.reason}</span>
                <button onClick={() => onApply(alt.text)} className="btn btn-gold px-4 py-1.5 text-sm">
                  应用
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
