'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { ScriptContent } from '@/types/script'

interface OutlineViewerProps { content: ScriptContent; onRefine?: () => void }

export function OutlineViewer({ content, onRefine }: OutlineViewerProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const toggle = (ep: number) => { setExpanded((prev) => { const next = new Set(prev); if (next.has(ep)) next.delete(ep); else next.add(ep); return next }) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">{content.title}</h3>
        {onRefine && <button onClick={onRefine} className="btn btn-primary"><FileText className="h-5 w-5" /> 细化为剧本</button>}
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
