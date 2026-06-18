'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, RefreshCw, Loader2 } from 'lucide-react'
import { ScriptContent } from '@/types/script'

interface OutlineViewerProps {
  content: ScriptContent | null | undefined
  onRefine?: () => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function OutlineViewer({ content, onRefine, loading, error, onRetry }: OutlineViewerProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const toggle = (ep: number) => { setExpanded((prev) => { const next = new Set(prev); if (next.has(ep)) next.delete(ep); else next.add(ep); return next }) }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <Loader2 className="h-10 w-10 text-[var(--accent)] animate-spin mb-4" />
        <p className="text-base text-[var(--text-muted)]">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-[var(--error-bg)] flex items-center justify-center mb-4">
          <span className="text-2xl text-[var(--error)]">!</span>
        </div>
        <p className="text-base text-[var(--error)] mb-4">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-outline flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> 重试
          </button>
        )}
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-base p-8">
        暂无大纲内容
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">{content.title}</h3>
        {onRefine && <button onClick={onRefine} className="btn btn-primary flex items-center gap-2"><FileText className="h-5 w-5" /> 细化为剧本</button>}
      </div>
      <div className="text-base text-[var(--text-secondary)]">共 {content.totalEpisodes} 集</div>

      <div className="space-y-3">
        {content.episodes.map((ep) => (
          <div key={ep.episodeNumber} className="border border-[var(--border)] rounded-xl overflow-hidden">
            <button onClick={() => toggle(ep.episodeNumber)} className="w-full flex items-center gap-4 px-5 py-4 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors text-left">
              {expanded.has(ep.episodeNumber) ? <ChevronDown className="h-5 w-5 text-[var(--text-muted)]" /> : <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />}
              <span className="font-mono text-sm text-[var(--accent)] font-bold">第{ep.episodeNumber}集</span>
              <span className="text-base font-bold flex-1 text-[var(--text-primary)]">{ep.title}</span>
              <span className="text-sm text-[var(--text-muted)]">{ep.durationMinutes}分钟</span>
            </button>
            {expanded.has(ep.episodeNumber) && (
              <div className="px-5 py-4 border-t border-[var(--border)] space-y-3">
                {ep.scenes.map((scene) => (
                  <div key={scene.sceneId} className="pl-5 border-l-2 border-[var(--accent)]/30">
                    <div className="text-sm text-[var(--text-muted)] mb-2">{scene.sceneId} · {scene.location} · {scene.time}</div>
                    {scene.beats.map((beat) => (
                      <div key={beat.beatId} className="text-base text-[var(--text-secondary)] py-1 leading-relaxed">
                        {beat.type === 'dialogue' && beat.character && <span className="font-bold text-[var(--text-primary)]">{beat.character}: </span>}
                        {beat.content}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
