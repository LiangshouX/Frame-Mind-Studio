'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Sparkles, FileText, AlertTriangle, Zap, Heart } from 'lucide-react'
import { SynopsisContent } from '@/types/workflow'
import * as workflowApi from '@/lib/api/workflow'

interface SynopsisPanelProps {
  projectId: string
  onGenerate?: () => void
}

const DEFAULT_CONTENT: SynopsisContent = {
  mainPlot: '',
  coreConflict: '',
  turningPoints: [],
  ending: '',
  themes: [],
}

export function SynopsisPanel({ projectId, onGenerate }: SynopsisPanelProps) {
  const [content, setContent] = useState<SynopsisContent>(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

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
    } catch (error) {
      console.error('Failed to save synopsis:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await workflowApi.generateSynopsis(projectId)
      onGenerate?.()
    } catch (error) {
      console.error('Failed to generate synopsis:', error)
    } finally {
      setGenerating(false)
    }
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
            AI 生成
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
              placeholder="描述故事的主要情节线..."
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
              placeholder="如：&#10;主角发现身世秘密&#10;反派背叛&#10;关键人物牺牲..."
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
