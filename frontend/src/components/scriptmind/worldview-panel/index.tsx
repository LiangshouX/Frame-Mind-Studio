'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Sparkles, Globe, BookOpen, MapPin, Palette, Upload } from 'lucide-react'
import { WorldSettingContent } from '@/types/workflow'
import * as workflowApi from '@/lib/api/workflow'
import { useToast } from '@/components/shared/toast/toast-context'

interface WorldviewPanelProps {
  projectId: string
  onGenerate?: () => void
  onSkip?: () => void
  onUpload?: () => void
}

const DEFAULT_CONTENT: WorldSettingContent = {
  genre: '',
  style: '',
  era: '',
  setting: '',
  coreConflict: '',
  uniqueSellingPoint: '',
  worldRules: [],
  locations: [],
  themes: [],
}

export function WorldviewPanel({ projectId, onGenerate, onSkip, onUpload }: WorldviewPanelProps) {
  const [content, setContent] = useState<WorldSettingContent>(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadWorldSetting()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadWorldSetting = async () => {
    setLoading(true)
    try {
      const data = await workflowApi.getWorldSetting(projectId)
      if (data?.content) {
        setContent({
          ...DEFAULT_CONTENT,
          ...data.content,
          worldRules: data.content.worldRules || [],
          locations: data.content.locations || [],
          themes: data.content.themes || [],
        })
      }
    } catch (error) {
      console.error('Failed to load world setting:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await workflowApi.saveWorldSetting(projectId, content)
      showToast('保存成功', 'success')
    } catch (error) {
      console.error('Failed to save world setting:', error)
      showToast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await workflowApi.generateWorldSetting(projectId)
      onGenerate?.()
    } catch (error) {
      console.error('Failed to generate world setting:', error)
    } finally {
      setGenerating(false)
    }
  }

  const updateField = (field: keyof WorldSettingContent, value: string | string[]) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }

  const addLocation = () => {
    setContent(prev => ({
      ...prev,
      locations: [...prev.locations, { name: '', description: '' }]
    }))
  }

  const updateLocation = (index: number, field: 'name' | 'description', value: string) => {
    setContent(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => i === index ? { ...loc, [field]: value } : loc)
    }))
  }

  const removeLocation = (index: number) => {
    setContent(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }))
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
        <h3 className="text-lg font-bold text-[var(--text-primary)]">创意及世界观设定</h3>
        <div className="flex items-center gap-2">
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              跳过此步
            </button>
          )}
          {onUpload && (
            <button
              onClick={onUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              上传已有内容
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
        {/* 基础设定 */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <Globe className="h-5 w-5 text-[var(--accent)]" />
            基础设定
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">题材类型</label>
              <input
                type="text"
                value={content.genre}
                onChange={e => updateField('genre', e.target.value)}
                placeholder="如：古装仙侠、现代都市、悬疑推理..."
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">风格基调</label>
              <input
                type="text"
                value={content.style}
                onChange={e => updateField('style', e.target.value)}
                placeholder="如：热血燃向、虐恋情深、轻松搞笑..."
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">时代背景</label>
              <input
                type="text"
                value={content.era}
                onChange={e => updateField('era', e.target.value)}
                placeholder="如：架空古代、2024年、未来3000年..."
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">核心卖点</label>
              <input
                type="text"
                value={content.uniqueSellingPoint}
                onChange={e => updateField('uniqueSellingPoint', e.target.value)}
                placeholder="如：重生复仇、穿越逆袭、双强CP..."
                className="input w-full"
              />
            </div>
          </div>
        </section>

        {/* 故事背景 */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            故事背景
          </h4>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">世界观背景</label>
            <textarea
              value={content.setting}
              onChange={e => updateField('setting', e.target.value)}
              placeholder="描述故事发生的世界背景..."
              rows={4}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">核心冲突</label>
            <textarea
              value={content.coreConflict}
              onChange={e => updateField('coreConflict', e.target.value)}
              placeholder="故事的主要矛盾冲突..."
              rows={3}
              className="input w-full"
            />
          </div>
        </section>

        {/* 世界规则 */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <Palette className="h-5 w-5 text-[var(--accent)]" />
            世界规则
          </h4>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              规则体系（每行一条）
            </label>
            <textarea
              value={content.worldRules.join('\n')}
              onChange={e => updateField('worldRules', e.target.value.split('\n').filter(Boolean))}
              placeholder="如：&#10;修士分为九个境界&#10;灵气是修炼的基础&#10;妖兽可以契约..."
              rows={5}
              className="input w-full"
            />
          </div>
        </section>

        {/* 场景地点 */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
            <MapPin className="h-5 w-5 text-[var(--accent)]" />
            场景地点
          </h4>
          {content.locations.map((loc, index) => (
            <div key={index} className="flex gap-4 items-start p-4 border border-[var(--border)] rounded-lg">
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={loc.name}
                  onChange={e => updateLocation(index, 'name', e.target.value)}
                  placeholder="地点名称"
                  className="input w-full"
                />
                <textarea
                  value={loc.description}
                  onChange={e => updateLocation(index, 'description', e.target.value)}
                  placeholder="地点描述"
                  rows={2}
                  className="input w-full"
                />
              </div>
              <button
                onClick={() => removeLocation(index)}
                className="text-[var(--error)] hover:text-[var(--error-dark)] p-2"
              >
                删除
              </button>
            </div>
          ))}
          <button
            onClick={addLocation}
            className="btn btn-outline w-full"
          >
            + 添加地点
          </button>
        </section>

        {/* 主题标签 */}
        <section className="space-y-4">
          <h4 className="text-base font-semibold text-[var(--text-primary)]">主题标签</h4>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              主题（逗号分隔）
            </label>
            <input
              type="text"
              value={content.themes.join('、')}
              onChange={e => updateField('themes', e.target.value.split(/[、,，]/).filter(Boolean))}
              placeholder="如：复仇、成长、爱情、权谋..."
              className="input w-full"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
