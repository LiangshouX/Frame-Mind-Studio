'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Sparkles, FileText, AlertTriangle, Zap, Heart, ChevronDown, ChevronRight } from 'lucide-react'
import { SynopsisContent } from '@/types/workflow'
import * as workflowApi from '@/lib/api/workflow'
import { useToast } from '@/components/shared/toast/toast-context'

interface SynopsisPanelProps {
  projectId: string
  onGenerate?: () => void
  onSkip?: () => void
}

const DEFAULT_CONTENT: SynopsisContent = {
  mainPlot: '',
  coreConflict: '',
  turningPoints: [],
  ending: '',
  themes: [],
}

export function SynopsisPanel({ projectId, onGenerate, onSkip }: SynopsisPanelProps) {
  const [content, setContent] = useState<SynopsisContent>(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadSynopsis()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSynopsis = async () => {
    setLoading(true)
    try {
      const data = await workflowApi.getSynopsis(projectId)
      if (data?.content) {
        setContent({
          ...DEFAULT_CONTENT,
          ...data.content,
          turningPoints: data.content.turningPoints || [],
          themes: data.content.themes || [],
        })
      }
    } catch (error) {
      console.error('Failed to load synopsis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await workflowApi.saveSynopsis(projectId, content)
      showToast('保存成功', 'success')
    } catch (error) {
      console.error('Failed to save synopsis:', error)
      showToast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    // 触发 WorkflowLayout 的 onGenerate 回调，由 Agent Chat 处理生成
    onGenerate?.()
  }

  const updateField = (field: keyof SynopsisContent, value: string | string[]) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">梗概</h3>
        <div className="flex items-center gap-2">
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              跳过此步
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-outline flex items-center gap-2"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI 生成梗概
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 梗概结构指导（可折叠） */}
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            {showGuide ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            📋 梗概结构指导
          </button>
          {showGuide && (
            <div className="px-4 pb-4 text-sm text-[var(--text-muted)] space-y-2 border-t border-[var(--border)] pt-3">
              <p><strong>故事主线：</strong>用 2-3 段话描述故事的核心情节走向，包括起因、发展和高潮。</p>
              <p><strong>核心冲突：</strong>明确主角面临的主要矛盾和挑战，这是推动故事前进的动力。</p>
              <p><strong>关键转折点：</strong>列出 3-5 个改变故事走向的重要事件。</p>
              <p><strong>结局走向：</strong>描述故事的最终结局和主题升华。</p>
            </div>
          )}
        </div>

        {/* 主线剧情 */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            主线剧情
          </h4>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              故事主线
            </label>
            <textarea
              value={content.mainPlot}
              onChange={e => updateField('mainPlot', e.target.value)}
              placeholder="开始撰写你的故事梗概..."
              rows={5}
              className="input w-full"
            />
          </div>
        </section>

        {/* 核心冲突 */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <AlertTriangle className="h-5 w-5 text-[var(--accent)]" />
            核心冲突
          </h4>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              矛盾冲突
            </label>
            <textarea
              value={content.coreConflict}
              onChange={e => updateField('coreConflict', e.target.value)}
              placeholder="故事的核心矛盾是什么？主角面临的主要挑战..."
              rows={4}
              className="input w-full"
            />
          </div>
        </section>

        {/* 转折点 */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <Zap className="h-5 w-5 text-[var(--accent)]" />
            关键转折点
          </h4>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              转折点（每行一个）
            </label>
            <textarea
              value={content.turningPoints.join('\n')}
              onChange={e => updateField('turningPoints', e.target.value.split('\n').filter(Boolean))}
              placeholder={"如：\n主角发现身世秘密\n反派背叛\n关键人物牺牲..."}
              rows={5}
              className="input w-full"
            />
          </div>
        </section>

        {/* 结局 */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <Heart className="h-5 w-5 text-[var(--accent)]" />
            结局
          </h4>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              故事结局
            </label>
            <textarea
              value={content.ending}
              onChange={e => updateField('ending', e.target.value)}
              placeholder="描述故事的结局走向..."
              rows={4}
              className="input w-full"
            />
          </div>
        </section>

        {/* 主题 */}
        <section className="space-y-4">
          <h4 className="text-base font-semibold text-[var(--text-primary)]">主题</h4>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              核心主题（逗号分隔）
            </label>
            <input
              type="text"
              value={content.themes.join('、')}
              onChange={e => updateField('themes', e.target.value.split(/[、,，]/).filter(Boolean))}
              placeholder="如：成长、救赎、复仇、爱情..."
              className="input w-full"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
