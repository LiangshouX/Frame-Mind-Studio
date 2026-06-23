'use client'

import { useEffect, useState } from 'react'
import { X, Save, RotateCcw, Trash2 } from 'lucide-react'
import { useAgentConfigStore } from '@/stores/agent-config-store'
import type { WorkflowStep } from '@/types/agent'

interface AgentConfigDrawerProps {
  projectId: string
  workflowStep: WorkflowStep
  isOpen: boolean
  onClose: () => void
}

/** workflowStep → agentName 映射 */
const STEP_TO_AGENT: Record<string, string> = {
  worldview: 'creative_agent',
  synopsis: 'synopsis_agent',
  characters: 'character_agent',
  outline: 'outline_agent',
  script: 'script_agent',
}

export function AgentConfigDrawer({
  projectId,
  workflowStep,
  isOpen,
  onClose,
}: AgentConfigDrawerProps) {
  const agentName = STEP_TO_AGENT[workflowStep] || 'creative_agent'
  const {
    configs,
    localConfig,
    isDirty,
    isLoading,
    fetchConfig,
    saveConfig,
    deleteConfig,
    updateLocalConfig,
    resetLocal,
  } = useAgentConfigStore()

  const [skillInput, setSkillInput] = useState('')
  const [ruleInput, setRuleInput] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (isOpen) {
      fetchConfig(projectId, agentName)
    }
  }, [isOpen, projectId, agentName, fetchConfig])

  const config = localConfig || configs[agentName]

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      await saveConfig(projectId, agentName)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要恢复为全局默认配置吗？')) return
    try {
      await deleteConfig(projectId, agentName)
    } catch (error) {
      console.error('Failed to delete config:', error)
    }
  }

  const handleAddSkill = () => {
    if (!skillInput.trim()) return
    const skills = [...(config?.skills || []), skillInput.trim()]
    updateLocalConfig({ skills })
    setSkillInput('')
  }

  const handleRemoveSkill = (index: number) => {
    const skills = (config?.skills || []).filter((_, i) => i !== index)
    updateLocalConfig({ skills })
  }

  const handleAddRule = () => {
    if (!ruleInput.trim()) return
    const rules = [...(config?.rules || []), ruleInput.trim()]
    updateLocalConfig({ rules })
    setRuleInput('')
  }

  const handleRemoveRule = (index: number) => {
    const rules = (config?.rules || []).filter((_, i) => i !== index)
    updateLocalConfig({ rules })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 抽屉 */}
      <div className="relative w-[420px] bg-[var(--bg-card)] border-l border-[var(--border-light)] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-light)] px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Agent 配置
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {agentName}
              {config?.is_project_override && (
                <span className="ml-2 text-[var(--accent)]">（项目覆盖）</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-5 space-y-5">
          {/* 系统提示词 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              系统提示词
            </label>
            <textarea
              value={config?.system_prompt || ''}
              onChange={(e) => updateLocalConfig({ system_prompt: e.target.value })}
              rows={8}
              className="w-full input resize-none text-sm"
              placeholder="输入系统提示词..."
            />
          </div>

          {/* 技能 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              技能
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(config?.skills || []).map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--accent-subtle)] text-[var(--accent)]"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(i)}
                    className="hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="添加技能..."
                className="flex-1 input text-sm"
              />
              <button onClick={handleAddSkill} className="btn btn-secondary text-sm">
                添加
              </button>
            </div>
          </div>

          {/* 规则 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              规则
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(config?.rules || []).map((rule, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                >
                  {rule}
                  <button
                    onClick={() => handleRemoveRule(i)}
                    className="hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                placeholder="添加规则..."
                className="flex-1 input text-sm"
              />
              <button onClick={handleAddRule} className="btn btn-secondary text-sm">
                添加
              </button>
            </div>
          </div>

          {/* 模型覆盖 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              模型覆盖
            </label>
            <input
              value={config?.model_override || ''}
              onChange={(e) => updateLocalConfig({ model_override: e.target.value || null })}
              placeholder="留空使用默认模型"
              className="w-full input text-sm"
            />
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="sticky bottom-0 bg-[var(--bg-card)] border-t border-[var(--border-light)] px-5 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="btn btn-ghost text-sm text-red-400 hover:text-red-300"
              title="恢复为全局默认"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              恢复默认
            </button>
            <button
              onClick={resetLocal}
              disabled={!isDirty}
              className="btn btn-ghost text-sm disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              撤销修改
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty || isLoading}
            className="btn btn-primary text-sm disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {saveStatus === 'saving'
              ? '保存中...'
              : saveStatus === 'saved'
                ? '已保存 ✓'
                : saveStatus === 'error'
                  ? '保存失败'
                  : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
