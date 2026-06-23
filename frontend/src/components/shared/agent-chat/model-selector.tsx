'use client'

import { useEffect, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings-store'
import { useAgentStore } from '@/stores/agent-store'
import type { WorkflowStep, ModelSelection } from '@/types/agent'

interface ModelSelectorProps {
  workflowStep: WorkflowStep
}

export function ModelSelector({ workflowStep }: ModelSelectorProps) {
  const { availableModels, fetchAvailableModels } = useSettingsStore()
  const { modelSelections, setModelSelection } = useAgentStore()

  // 获取可用模型列表
  useEffect(() => {
    if (availableModels.length === 0) {
      fetchAvailableModels()
    }
  }, [availableModels.length, fetchAvailableModels])

  // 只显示有 API Key 的供应商
  const availableProviders = useMemo(
    () => availableModels.filter((p) => p.available && p.models.length > 0),
    [availableModels]
  )

  // 当前选中的模型
  const current = modelSelections[workflowStep]

  // 当前选中的供应商
  const currentProvider = useMemo(
    () => availableProviders.find((p) => p.provider_id === current?.providerId),
    [availableProviders, current?.providerId]
  )

  // 如果没有选中，自动选择第一个可用供应商和模型
  useEffect(() => {
    if (!current && availableProviders.length > 0) {
      const first = availableProviders[0]
      if (first.models.length > 0) {
        setModelSelection(workflowStep, {
          providerId: first.provider_id,
          modelName: first.models[0].model_id,
        })
      }
    }
  }, [current, availableProviders, workflowStep, setModelSelection])

  // 供应商变更
  const handleProviderChange = (providerId: string) => {
    const provider = availableProviders.find((p) => p.provider_id === providerId)
    if (provider && provider.models.length > 0) {
      setModelSelection(workflowStep, {
        providerId,
        modelName: provider.models[0].model_id,
      })
    }
  }

  // 模型变更
  const handleModelChange = (modelName: string) => {
    if (current) {
      setModelSelection(workflowStep, {
        ...current,
        modelName,
      })
    }
  }

  // 没有可用供应商时显示提示
  if (availableProviders.length === 0) {
    return (
      <div className="px-3 py-1.5 text-xs text-[var(--text-muted)]">
        请先在设置页面配置模型供应商
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      {/* 供应商下拉框 */}
      <div className="relative">
        <select
          value={current?.providerId || ''}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="appearance-none bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs rounded-md px-2 py-1 pr-6 border border-[var(--border-light)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
        >
          {availableProviders.map((p) => (
            <option key={p.provider_id} value={p.provider_id}>
              {p.provider_name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-muted)] pointer-events-none" />
      </div>

      {/* 模型下拉框 */}
      <div className="relative">
        <select
          value={current?.modelName || ''}
          onChange={(e) => handleModelChange(e.target.value)}
          className="appearance-none bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs rounded-md px-2 py-1 pr-6 border border-[var(--border-light)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
        >
          {(currentProvider?.models || []).map((m) => (
            <option key={m.model_id} value={m.model_id}>
              {m.display_name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-muted)] pointer-events-none" />
      </div>
    </div>
  )
}
