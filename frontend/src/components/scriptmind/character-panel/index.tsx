'use client'

import { useState, useEffect, useCallback } from 'react'
import { Character } from '@/types/character'
import * as charactersApi from '@/lib/api/characters'
import {
  ChevronDown,
  ChevronRight,
  Users,
  Plus,
  Trash2,
  Wand2,
  Save,
  X,
  Sparkles,
} from 'lucide-react'

interface CharacterPanelProps {
  projectId: string
  characters: Character[]
  onRefresh?: () => void
}

const ROLE_LABELS: Record<string, string> = {
  protagonist: '主角',
  antagonist: '反派',
  supporting: '配角',
  minor: '次要角色',
}

const ROLE_OPTIONS = [
  { value: 'protagonist', label: '主角' },
  { value: 'antagonist', label: '反派' },
  { value: 'supporting', label: '配角' },
  { value: 'minor', label: '次要角色' },
]

const GENDER_OPTIONS = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
  { value: '其他', label: '其他' },
]

/**
 * 角色管理面板 —— 完整 CRUD + AI 生成 + AI 优化
 */
export function CharacterPanel({ projectId, characters: initialCharacters, onRefresh }: CharacterPanelProps) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // 表单状态
  const [form, setForm] = useState({
    name: '',
    gender: '男',
    role: 'supporting',
    identity: '',
    personality: '',
    appearance: '',
    background: '',
    goals: '',
    overview: '',
    dialogue_style: '',
    arc: '',
  })

  // 同步外部 characters 变化
  useEffect(() => {
    setCharacters(initialCharacters)
  }, [initialCharacters])

  // 刷新角色列表
  const refreshCharacters = useCallback(async () => {
    try {
      const result = await charactersApi.listCharacters(projectId)
      setCharacters(result.items || [])
      onRefresh?.()
    } catch (error) {
      console.error('Failed to refresh characters:', error)
    }
  }, [projectId, onRefresh])

  // 重置表单
  const resetForm = () => {
    setForm({
      name: '',
      gender: '男',
      role: 'supporting',
      identity: '',
      personality: '',
      appearance: '',
      background: '',
      goals: '',
      overview: '',
      dialogue_style: '',
      arc: '',
    })
  }

  // 创建角色
  const handleCreate = async () => {
    if (!form.name.trim()) return
    try {
      await charactersApi.createCharacter(projectId, {
        name: form.name,
        gender: form.gender,
        role: form.role,
        identity: form.identity || undefined,
        personality: form.personality
          ? form.personality.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
          : [],
        appearance: form.appearance || undefined,
        background: form.background || undefined,
        goals: form.goals || undefined,
        overview: form.overview || undefined,
        dialogue_style: form.dialogue_style || undefined,
        arc: form.arc || undefined,
      })
      setShowCreateForm(false)
      resetForm()
      await refreshCharacters()
    } catch (error) {
      console.error('Failed to create character:', error)
    }
  }

  // 更新角色（自动保存）
  const handleUpdate = async (characterId: string, field: string, value: string) => {
    try {
      await charactersApi.updateCharacter(projectId, characterId, { [field]: value } as Partial<Character>)
      await refreshCharacters()
    } catch (error) {
      console.error('Failed to update character:', error)
    }
  }

  // 删除角色
  const handleDelete = async (characterId: string) => {
    try {
      await charactersApi.deleteCharacter(projectId, characterId)
      setDeleteConfirm(null)
      setExpanded(null)
      await refreshCharacters()
    } catch (error) {
      console.error('Failed to delete character:', error)
    }
  }

  // AI 生成角色
  const handleAIGenerate = async () => {
    setIsGenerating(true)
    try {
      const { generateCharacters } = await import('@/lib/api/workflow')
      await generateCharacters(projectId)
      // 等待一段时间后刷新（给 Agent 时间生成）
      setTimeout(async () => {
        await refreshCharacters()
        setIsGenerating(false)
      }, 3000)
    } catch (error) {
      console.error('AI generate failed:', error)
      setIsGenerating(false)
    }
  }

  // 按角色分组
  const grouped = characters.reduce<Record<string, Character[]>>((acc, c) => {
    ;(acc[c.role] = acc[c.role] || []).push(c)
    return acc
  }, {})

  // 空状态
  if (characters.length === 0 && !showCreateForm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-12 w-12 text-[var(--text-muted)] mb-4 opacity-40" />
        <p className="text-[var(--text-muted)] mb-6">暂无角色，点击「AI 生成」或「新增角色」开始设计</p>
        <div className="flex gap-3">
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            {isGenerating ? '生成中...' : 'AI 生成角色'}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            新增角色
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          角色列表
          <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">({characters.length})</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {isGenerating ? '生成中...' : 'AI 生成'}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            新增角色
          </button>
        </div>
      </div>

      {/* 新增角色表单 */}
      {showCreateForm && (
        <CharacterForm
          form={form}
          onChange={setForm}
          onSave={handleCreate}
          onCancel={() => {
            setShowCreateForm(false)
            resetForm()
          }}
          title="新增角色"
        />
      )}

      {/* 角色列表（按角色分组） */}
      {Object.entries(grouped).map(([role, chars]) => (
        <div key={role}>
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wide">
            {ROLE_LABELS[role] || role}
          </h3>
          <div className="space-y-2">
            {chars.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                isExpanded={expanded === char.id}
                isEditing={editingId === char.id}
                onToggle={() => setExpanded(expanded === char.id ? null : char.id)}
                onStartEdit={() => {
                  setEditingId(char.id)
                  setForm({
                    name: char.name,
                    gender: char.gender || '男',
                    role: char.role,
                    identity: char.identity || '',
                    personality: (char.personality || []).join('、'),
                    appearance: char.appearance || '',
                    background: char.background || '',
                    goals: char.goals || '',
                    overview: char.overview || '',
                    dialogue_style: char.dialogue_style || '',
                    arc: char.arc || '',
                  })
                }}
                onSaveEdit={async () => {
                  await charactersApi.updateCharacter(projectId, char.id, {
                    name: form.name,
                    gender: form.gender,
                    role: form.role as Character['role'],
                    identity: form.identity,
                    personality: form.personality
                      ? form.personality.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
                      : [],
                    appearance: form.appearance,
                    background: form.background,
                    goals: form.goals,
                    overview: form.overview,
                    dialogue_style: form.dialogue_style,
                    arc: form.arc,
                  })
                  setEditingId(null)
                  await refreshCharacters()
                }}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => setDeleteConfirm(char.id)}
                form={form}
                onChangeForm={setForm}
              />
            ))}
          </div>

          {/* 删除确认 */}
          {deleteConfirm && chars.some((c) => c.id === deleteConfirm) && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 mb-2">
                确定删除此角色？该操作不可撤销，大纲和剧本中对角色的引用可能需要手动调整。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  确认删除
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1 text-sm border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── 角色卡片组件 ────────────────────────────────────────────────

interface CharacterCardProps {
  character: Character
  isExpanded: boolean
  isEditing: boolean
  onToggle: () => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  form: typeof defaultForm
  onChangeForm: (form: typeof defaultForm) => void
}

const defaultForm = {
  name: '',
  gender: '男',
  role: 'supporting',
  identity: '',
  personality: '',
  appearance: '',
  background: '',
  goals: '',
  overview: '',
  dialogue_style: '',
  arc: '',
}

function CharacterCard({
  character: char,
  isExpanded,
  isEditing,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  form,
  onChangeForm,
}: CharacterCardProps) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      {/* 卡片头部 */}
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
          )}
          <span className="font-medium text-[var(--text-primary)]">{char.name}</span>
          {char.gender && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
              {char.gender}
            </span>
          )}
          {char.identity && (
            <span className="text-xs text-[var(--text-muted)] truncate">{char.identity}</span>
          )}
        </button>
        <div className="flex items-center gap-1 pr-3">
          <button
            onClick={onStartEdit}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="编辑"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-[var(--text-muted)] hover:text-red-400"
            title="删除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border)]">
          {isEditing ? (
            /* 编辑模式 */
            <div className="space-y-3">
              <CharacterFormFields form={form} onChange={onChangeForm} />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onSaveEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
                >
                  <Save className="h-3.5 w-3.5" />
                  保存
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]"
                >
                  <X className="h-3.5 w-3.5" />
                  取消
                </button>
              </div>
            </div>
          ) : (
            /* 展示模式 */
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              {char.overview && <p className="leading-relaxed">{char.overview}</p>}
              {char.personality && char.personality.length > 0 && (
                <p>
                  <span className="text-[var(--text-muted)]">性格：</span>
                  {char.personality.join('、')}
                </p>
              )}
              {char.appearance && (
                <p>
                  <span className="text-[var(--text-muted)]">外貌：</span>
                  {char.appearance}
                </p>
              )}
              {char.background && (
                <p>
                  <span className="text-[var(--text-muted)]">背景：</span>
                  {char.background}
                </p>
              )}
              {char.goals && (
                <p>
                  <span className="text-[var(--text-muted)]">目标：</span>
                  {char.goals}
                </p>
              )}
              {char.arc && (
                <p>
                  <span className="text-[var(--text-muted)]">弧线：</span>
                  {char.arc}
                </p>
              )}
              {char.dialogue_style && (
                <p>
                  <span className="text-[var(--text-muted)]">对白风格：</span>
                  {char.dialogue_style}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 角色表单组件 ────────────────────────────────────────────────

interface CharacterFormProps {
  form: typeof defaultForm
  onChange: (form: typeof defaultForm) => void
  onSave: () => void
  onCancel: () => void
  title: string
}

function CharacterForm({ form, onChange, onSave, onCancel, title }: CharacterFormProps) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-medium text-[var(--text-primary)]">{title}</h3>
      <CharacterFormFields form={form} onChange={onChange} />
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          disabled={!form.name.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]"
        >
          <X className="h-3.5 w-3.5" />
          取消
        </button>
      </div>
    </div>
  )
}

// ─── 表单字段组件 ────────────────────────────────────────────────

function CharacterFormFields({
  form,
  onChange,
}: {
  form: typeof defaultForm
  onChange: (form: typeof defaultForm) => void
}) {
  const update = (field: string, value: string) => {
    onChange({ ...form, [field]: value })
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">姓名 *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
          placeholder="角色姓名"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">性别</label>
        <select
          value={form.gender}
          onChange={(e) => update('gender', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
        >
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">角色类型</label>
        <select
          value={form.role}
          onChange={(e) => update('role', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">身份定位</label>
        <input
          type="text"
          value={form.identity}
          onChange={(e) => update('identity', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
          placeholder="如：CEO、学生、侦探"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs text-[var(--text-muted)] mb-1">性格标签</label>
        <input
          type="text"
          value={form.personality}
          onChange={(e) => update('personality', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
          placeholder="用逗号分隔，如：聪明、坚韧、幽默"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs text-[var(--text-muted)] mb-1">人物小传</label>
        <textarea
          value={form.overview}
          onChange={(e) => update('overview', e.target.value)}
          rows={3}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] resize-none"
          placeholder="角色的核心故事和背景..."
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs text-[var(--text-muted)] mb-1">外貌描述</label>
        <textarea
          value={form.appearance}
          onChange={(e) => update('appearance', e.target.value)}
          rows={2}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] resize-none"
          placeholder="发型、体型、穿着风格..."
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs text-[var(--text-muted)] mb-1">背景故事</label>
        <textarea
          value={form.background}
          onChange={(e) => update('background', e.target.value)}
          rows={2}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] resize-none"
          placeholder="出身、经历、创伤..."
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">核心目标</label>
        <input
          type="text"
          value={form.goals}
          onChange={(e) => update('goals', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
          placeholder="角色想要什么"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">人物弧线</label>
        <input
          type="text"
          value={form.arc}
          onChange={(e) => update('arc', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
          placeholder="从 A 到 B 的变化"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-xs text-[var(--text-muted)] mb-1">对白风格</label>
        <input
          type="text"
          value={form.dialogue_style}
          onChange={(e) => update('dialogue_style', e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
          placeholder="口头禅、用词习惯、语气特点"
        />
      </div>
    </div>
  )
}
