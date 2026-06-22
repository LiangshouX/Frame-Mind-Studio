'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, BarChart3, Eye } from 'lucide-react'
import * as qualityApi from '@/lib/api/quality'
import * as foreshadowApi from '@/lib/api/foreshadows'
import type { QualityMetrics } from '@/types/quality'
import type { Foreshadow } from '@/types/foreshadow'

interface CollapsiblePanelsProps {
  projectId: string
}

/**
 * 可折叠的质量面板和伏笔面板，显示在剧本编辑器右侧 AI 对话上方。
 */
export function CollapsiblePanels({ projectId }: CollapsiblePanelsProps) {
  const [showQuality, setShowQuality] = useState(false)
  const [showForeshadow, setShowForeshadow] = useState(false)
  const [quality, setQuality] = useState<QualityMetrics | null>(null)
  const [foreshadows, setForeshadows] = useState<Foreshadow[]>([])

  useEffect(() => {
    if (showQuality && !quality) {
      qualityApi.getQualityMetrics(projectId).then(setQuality).catch(() => {})
    }
  }, [showQuality, projectId, quality])

  useEffect(() => {
    if (showForeshadow && foreshadows.length === 0) {
      foreshadowApi.listForeshadows(projectId).then((r) => setForeshadows(r.items || [])).catch(() => {})
    }
  }, [showForeshadow, projectId, foreshadows.length])

  return (
    <div className="border-b border-[var(--border-light)]">
      {/* 质量面板 */}
      <button
        onClick={() => setShowQuality(!showQuality)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        {showQuality ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
        质量评估
        {quality && (
          <span className="ml-auto text-xs font-medium text-[var(--accent)]">{quality.overall_score}分</span>
        )}
      </button>
      {showQuality && quality && (
        <div className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '钩子强度', value: quality.hook_strength },
              { label: '节奏曲线', value: quality.rhythm_curve },
              { label: '角色平衡', value: quality.character_balance },
              { label: '对白比例', value: quality.dialogue_ratio },
              { label: '场景多样性', value: quality.scene_diversity },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">{m.label}</span>
                <span className={m.value?.status === 'pass' ? 'text-[var(--accent)]' : 'text-[var(--gold)]'}>
                  {m.value?.value ?? '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 伏笔面板 */}
      <button
        onClick={() => setShowForeshadow(!showForeshadow)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors border-t border-[var(--border-light)]"
      >
        {showForeshadow ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Eye className="h-4 w-4 text-[var(--gold)]" />
        伏笔追踪
        {foreshadows.length > 0 && (
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {foreshadows.filter((f) => f.status === 'planted').length} 未回收
          </span>
        )}
      </button>
      {showForeshadow && (
        <div className="px-4 pb-3 space-y-1.5 max-h-40 overflow-y-auto">
          {foreshadows.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">暂无伏笔</p>
          ) : (
            foreshadows.map((f) => (
              <div
                key={f.id}
                className={`text-xs p-2 rounded ${
                  f.urgency === 'high'
                    ? 'bg-[var(--gold)]/10 border border-[var(--gold)]/30'
                    : 'bg-[var(--bg-secondary)]'
                }`}
              >
                <span className={f.status === 'resolved' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}>
                  {f.plant}
                </span>
                {f.status !== 'resolved' && (
                  <span className="ml-1 text-[var(--text-muted)]">[{f.urgency}]</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
