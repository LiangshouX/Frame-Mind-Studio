'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Sparkles, List, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { OutlineContent, OutlineEpisode, OutlineAct } from '@/types/workflow'
import * as workflowApi from '@/lib/api/workflow'

interface OutlinePanelProps {
  projectId: string
  projectType?: 'short_drama' | 'feature_film'
  onGenerate?: () => void
}

export function OutlinePanel({ projectId, projectType = 'short_drama', onGenerate }: OutlinePanelProps) {
  const [content, setContent] = useState<OutlineContent>({})
  const [format, setFormat] = useState<'episode_list' | 'act_structure'>('episode_list')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadOutline()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadOutline = async () => {
    setLoading(true)
    try {
      const data = await workflowApi.getOutline(projectId)
      if (data) {
        setContent({
          episodes: data.content.episodes || [],
          acts: data.content.acts || [],
          structureModel: data.content.structureModel || '',
        })
        setFormat(data.format)
      }
    } catch (error) {
      console.error('Failed to load outline:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await workflowApi.saveOutline(projectId, content, format)
    } catch (error) {
      console.error('Failed to save outline:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await workflowApi.generateOutline(projectId)
      onGenerate?.()
    } catch (error) {
      console.error('Failed to generate outline:', error)
    } finally {
      setGenerating(false)
    }
  }

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // 短剧模式：集数列表
  const addEpisode = () => {
    const episodes = content.episodes || []
    setContent({
      ...content,
      episodes: [
        ...episodes,
        {
          episodeNumber: episodes.length + 1,
          title: '',
          highlight: '',
          hook: '',
          keyEvents: [],
          durationSeconds: 180,
        }
      ]
    })
  }

  const updateEpisode = (index: number, field: keyof OutlineEpisode, value: string | string[] | number) => {
    const episodes = [...(content.episodes || [])]
    episodes[index] = { ...episodes[index], [field]: value }
    setContent({ ...content, episodes })
  }

  const removeEpisode = (index: number) => {
    const episodes = (content.episodes || []).filter((_, i) => i !== index)
    setContent({ ...content, episodes })
  }

  // 传统影视模式：幕次结构
  const addAct = () => {
    const acts = content.acts || []
    setContent({
      ...content,
      acts: [
        ...acts,
        {
          actNumber: acts.length + 1,
          actName: '',
          actGoal: '',
          sequences: [],
        }
      ]
    })
  }

  const updateAct = (index: number, field: keyof OutlineAct, value: string | number) => {
    const acts = [...(content.acts || [])]
    acts[index] = { ...acts[index], [field]: value }
    setContent({ ...content, acts })
  }

  const removeAct = (index: number) => {
    const acts = (content.acts || []).filter((_, i) => i !== index)
    setContent({ ...content, acts })
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
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">大纲</h3>
          <select
            value={format}
            onChange={e => setFormat(e.target.value as 'episode_list' | 'act_structure')}
            className="input py-1 px-2 text-sm"
          >
            <option value="episode_list">集数列表（短剧）</option>
            <option value="act_structure">幕次结构（传统影视）</option>
          </select>
        </div>
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

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 短剧模式：集数列表 */}
        {format === 'episode_list' && (
          <div className="space-y-4">
            {content.episodes?.map((episode, index) => (
              <div
                key={index}
                className="border border-[var(--border)] rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 p-4 bg-[var(--bg-card)] cursor-pointer hover:bg-[var(--bg-hover)]"
                  onClick={() => toggleExpand(index)}
                >
                  {expandedItems.has(index) ? (
                    <ChevronDown className="h-5 w-5 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />
                  )}
                  <span className="font-mono text-sm text-[var(--accent)] font-bold">
                    第{episode.episodeNumber}集
                  </span>
                  <span className="flex-1 font-medium text-[var(--text-primary)]">
                    {episode.title || '未命名'}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {Math.floor(episode.durationSeconds / 60)}分钟
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); removeEpisode(index) }}
                    className="text-[var(--error)] hover:text-[var(--error-dark)] p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {expandedItems.has(index) && (
                  <div className="p-4 border-t border-[var(--border)] space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">标题</label>
                      <input
                        type="text"
                        value={episode.title}
                        onChange={e => updateEpisode(index, 'title', e.target.value)}
                        placeholder="集标题"
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">高光时刻</label>
                      <textarea
                        value={episode.highlight}
                        onChange={e => updateEpisode(index, 'highlight', e.target.value)}
                        placeholder="本集高光场景..."
                        rows={2}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">钩子/悬念</label>
                      <textarea
                        value={episode.hook}
                        onChange={e => updateEpisode(index, 'hook', e.target.value)}
                        placeholder="结尾钩子..."
                        rows={2}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                        关键事件（每行一个）
                      </label>
                      <textarea
                        value={episode.keyEvents.join('\n')}
                        onChange={e => updateEpisode(index, 'keyEvents', e.target.value.split('\n').filter(Boolean))}
                        placeholder="关键剧情事件..."
                        rows={3}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">时长（秒）</label>
                      <input
                        type="number"
                        value={episode.durationSeconds}
                        onChange={e => updateEpisode(index, 'durationSeconds', parseInt(e.target.value) || 0)}
                        className="input w-32"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addEpisode}
              className="btn btn-outline w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              添加集数
            </button>
          </div>
        )}

        {/* 传统影视模式：幕次结构 */}
        {format === 'act_structure' && (
          <div className="space-y-4">
            {content.acts?.map((act, index) => (
              <div
                key={index}
                className="border border-[var(--border)] rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 p-4 bg-[var(--bg-card)] cursor-pointer hover:bg-[var(--bg-hover)]"
                  onClick={() => toggleExpand(index)}
                >
                  {expandedItems.has(index) ? (
                    <ChevronDown className="h-5 w-5 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />
                  )}
                  <span className="font-mono text-sm text-[var(--accent)] font-bold">
                    第{act.actNumber}幕
                  </span>
                  <span className="flex-1 font-medium text-[var(--text-primary)]">
                    {act.actName || '未命名'}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {act.sequences.length} 个序列
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); removeAct(index) }}
                    className="text-[var(--error)] hover:text-[var(--error-dark)] p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {expandedItems.has(index) && (
                  <div className="p-4 border-t border-[var(--border)] space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">幕名</label>
                      <input
                        type="text"
                        value={act.actName}
                        onChange={e => updateAct(index, 'actName', e.target.value)}
                        placeholder="如：第一幕 - 建置"
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">目标</label>
                      <textarea
                        value={act.actGoal}
                        onChange={e => updateAct(index, 'actGoal', e.target.value)}
                        placeholder="本幕的叙事目标..."
                        rows={2}
                        className="input w-full"
                      />
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      序列编辑功能开发中...
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addAct}
              className="btn btn-outline w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              添加幕次
            </button>
          </div>
        )}

        {/* 空状态 */}
        {((format === 'episode_list' && (!content.episodes || content.episodes.length === 0)) ||
          (format === 'act_structure' && (!content.acts || content.acts.length === 0))) && (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
            <List className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium mb-2">暂无大纲内容</p>
            <p className="text-sm">点击「AI 生成」按钮自动创建大纲，或手动添加</p>
          </div>
        )}
      </div>
    </div>
  )
}
