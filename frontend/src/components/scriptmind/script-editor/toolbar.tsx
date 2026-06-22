'use client'

import { useState } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Save, Loader2, Wand2, ClipboardCheck, BarChart3, X } from 'lucide-react'
import * as qualityApi from '@/lib/api/quality'
import type { QualityMetrics } from '@/types/quality'

export type ScriptTab = 'content' | 'characters' | 'scenes'

interface EditorToolbarProps {
  activeTab: ScriptTab
  onTabChange: (tab: ScriptTab) => void
  onSave?: () => void
  onAIGenerate?: () => void
  onAIReview?: () => void
  projectId?: string
}

export function EditorToolbar({ activeTab, onTabChange, onSave, onAIGenerate, onAIReview, projectId }: EditorToolbarProps) {
  const { isDirty, isSaving, lastSavedAt } = useEditorStore()
  const [showQuality, setShowQuality] = useState(false)
  const [quality, setQuality] = useState<QualityMetrics | null>(null)
  const [loadingQuality, setLoadingQuality] = useState(false)

  const handleQualityClick = async () => {
    if (showQuality) {
      setShowQuality(false)
      return
    }
    if (!projectId) return
    setLoadingQuality(true)
    try {
      const data = await qualityApi.getQualityMetrics(projectId)
      setQuality(data)
      setShowQuality(true)
    } catch (error) {
      console.error('Failed to load quality metrics:', error)
    } finally {
      setLoadingQuality(false)
    }
  }

  const tabs = [
    { key: 'content' as const, label: '剧本内容' },
    { key: 'characters' as const, label: '角色' },
    { key: 'scenes' as const, label: '场景/布景' },
  ]

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-card)]">
      {/* 左侧：功能标签 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0" />

      {/* 右侧：质量评估 + AI 按钮 + 保存 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 质量评估按钮 */}
        {projectId && (
          <button
            onClick={handleQualityClick}
            disabled={loadingQuality}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 whitespace-nowrap"
            title="质量评估"
          >
            {loadingQuality ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BarChart3 className="h-3.5 w-3.5" />
            )}
            质量评估
          </button>
        )}

        {onAIGenerate && (
          <button
            onClick={onAIGenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Wand2 className="h-3.5 w-3.5" />
            AI 生成剧本
          </button>
        )}
        {onAIReview && (
          <button
            onClick={onAIReview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            AI 审查
          </button>
        )}

        {/* 保存按钮 + 状态 */}
        <div className="flex flex-col items-center ml-2">
          <button
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30"
            title="保存 (Ctrl+S)"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </button>
          <span className={`text-[10px] leading-tight ${
            isSaving ? 'text-[var(--text-muted)]' :
            isDirty ? 'text-[var(--gold)]' :
            lastSavedAt ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'
          }`}>
            {isSaving ? '保存中' : isDirty ? '未保存' : lastSavedAt ? '已保存' : ''}
          </span>
        </div>
      </div>

      {/* 质量评估弹窗 */}
      {showQuality && quality && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowQuality(false)}>
          <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border)] w-96 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">质量评估</h3>
              <button onClick={() => setShowQuality(false)} className="p-1 rounded hover:bg-[var(--bg-hover)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 text-center">
              <span className="text-3xl font-bold text-[var(--accent)]">{quality.overall_score}</span>
              <span className="text-sm text-[var(--text-muted)] ml-1">分</span>
            </div>
            <div className="space-y-3">
              {[
                { label: '钩子强度', value: quality.hook_strength },
                { label: '节奏曲线', value: quality.rhythm_curve },
                { label: '角色平衡', value: quality.character_balance },
                { label: '对白比例', value: quality.dialogue_ratio },
                { label: '场景多样性', value: quality.scene_diversity },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.value?.status === 'pass' ? 'bg-[var(--accent)]' : 'bg-[var(--gold)]'}`}
                        style={{ width: `${(m.value?.value ?? 0) * 10}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${m.value?.status === 'pass' ? 'text-[var(--accent)]' : 'text-[var(--gold)]'}`}>
                      {m.value?.value ?? '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
