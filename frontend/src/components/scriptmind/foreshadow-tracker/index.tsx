'use client'

import { Foreshadow } from '@/types/foreshadow'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'

interface ForeshadowTrackerProps { projectId: string; foreshadows: Foreshadow[] }

export function ForeshadowTracker({ projectId, foreshadows }: ForeshadowTrackerProps) {
  const planted = foreshadows.filter((f) => f.status === 'planted')
  const resolved = foreshadows.filter((f) => f.status === 'resolved')

  if (foreshadows.length === 0) return <div className="text-sm text-[var(--text-muted)] py-4"><Eye className="h-5 w-5 mb-2" /> 暂无伏笔</div>

  return (
    <div>
      <div className="text-sm text-[var(--accent)] uppercase tracking-wide mb-3 font-medium">伏笔</div>
      {planted.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-sm text-[var(--gold-dark)] mb-2 font-medium"><EyeOff className="h-4 w-4" /> 未回收 ({planted.length})</div>
          {planted.map((f) => (
            <div key={f.id} className={`text-sm p-3 mb-2 rounded-lg border ${f.urgency === 'high' ? 'border-[var(--gold)]/30 bg-[var(--warning-bg)]' : 'border-[var(--border)]'}`}>
              <div className="flex items-start gap-2">
                {f.urgency === 'high' && <AlertTriangle className="h-4 w-4 text-[var(--gold)] flex-shrink-0 mt-0.5" />}
                <span className="text-[var(--text-secondary)] leading-relaxed">{f.plant}</span>
              </div>
              {f.episode_hint && <div className="text-[var(--text-muted)] mt-2 text-sm">第{f.episode_hint}集</div>}
            </div>
          ))}
        </div>
      )}
      {resolved.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--accent)] mb-2 font-medium"><Eye className="h-4 w-4" /> 已回收 ({resolved.length})</div>
          {resolved.map((f) => (
            <div key={f.id} className="text-sm p-3 mb-2 rounded-lg border border-[var(--border)] opacity-60">
              <span className="text-[var(--text-secondary)] line-through">{f.plant}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
