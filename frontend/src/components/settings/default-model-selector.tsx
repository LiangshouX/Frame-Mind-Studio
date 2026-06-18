'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

export function DefaultModelSelector() {
  const { providers, defaultModel, fetchProviders, fetchDefaultModel, updateDefaultModel } = useSettingsStore()

  useEffect(() => {
    fetchProviders()
    fetchDefaultModel()
  }, [fetchProviders, fetchDefaultModel])

  const safeProviders = Array.isArray(providers) ? providers : []
  const configuredProviders = safeProviders.filter((p) => p.configured)

  const handleChange = (value: string) => {
    if (!value) {
      updateDefaultModel({ provider: '', model: '' })
      return
    }
    const [provider, model] = value.split('::')
    updateDefaultModel({ provider, model })
  }

  const currentValue = defaultModel?.provider && defaultModel?.model
    ? `${defaultModel.provider}::${defaultModel.model}`
    : ''

  if (configuredProviders.length === 0) return null

  return (
    <div className="card p-6 space-y-3">
      <h3 className="font-bold">默认模型</h3>
      <p className="text-sm text-[var(--text-muted)]">
        新建 Agent 时默认使用的模型。
      </p>
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        className="input w-full"
      >
        <option value="">未设置</option>
        {configuredProviders.map((provider) =>
          (Array.isArray(provider.models) ? provider.models : []).map((model) => (
            <option key={`${provider.id}::${model}`} value={`${provider.id}::${model}`}>
              {provider.name} / {model}
            </option>
          ))
        )}
      </select>
      {defaultModel?.display_name && (
        <p className="text-sm text-[var(--primary)]">当前默认: {defaultModel.display_name}</p>
      )}
    </div>
  )
}
