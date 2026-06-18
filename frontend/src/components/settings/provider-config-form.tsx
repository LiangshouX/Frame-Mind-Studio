'use client'

import { useState, useEffect } from 'react'
import type { ProviderConfig, ProviderConfigRequest } from '@/types/settings'
import { X, Plus, Save, Trash2 } from 'lucide-react'

interface ProviderConfigFormProps {
  providerId: string
  providerName: string
  defaultBaseUrl: string
  defaultModels: string[]
  config: ProviderConfig | null
  onSave: (config: ProviderConfigRequest) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
}

export function ProviderConfigForm({
  providerId,
  providerName,
  defaultBaseUrl,
  defaultModels,
  config,
  onSave,
  onDelete,
  onClose,
}: ProviderConfigFormProps) {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl || '')
  const [models, setModels] = useState<string[]>(Array.isArray(defaultModels) ? defaultModels : [])
  const [newModel, setNewModel] = useState('')
  const [defaultModel, setDefaultModel] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (config) {
      setBaseUrl(config.base_url || defaultBaseUrl || '')
      setModels(config.models && config.models.length > 0 ? config.models : (Array.isArray(defaultModels) ? defaultModels : []))
      setDefaultModel(config.default_model || '')
      // Don't pre-fill API key — user must re-enter to change
    }
  }, [config, defaultBaseUrl, defaultModels])

  const handleSave = async () => {
    if (!apiKey.trim() && !config?.configured) return
    setSaving(true)
    try {
      const request: ProviderConfigRequest = {
        apiKey: apiKey.trim() || '',
        baseUrl,
        models,
        defaultModel,
      }
      await onSave(request)
      setApiKey('')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  const addModel = () => {
    const trimmed = newModel.trim()
    if (trimmed && !models.includes(trimmed)) {
      setModels([...models, trimmed])
      setNewModel('')
    }
  }

  const removeModel = (model: string) => {
    setModels(models.filter((m) => m !== model))
    if (defaultModel === model) setDefaultModel('')
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">配置 {providerName}</h3>
        <button onClick={onClose} className="p-1 hover:bg-[var(--surface)] rounded">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium mb-1.5">API Key *</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={config?.configured ? '已保存 (输入新值以更新)' : 'sk-...'}
          className="input w-full"
        />
        {config?.configured && config.api_key_preview && (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            当前: {config.api_key_preview}
          </p>
        )}
      </div>

      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Base URL</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="input w-full font-mono text-sm"
        />
      </div>

      {/* Models */}
      <div>
        <label className="block text-sm font-medium mb-1.5">模型列表</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {models.map((model) => (
            <span
              key={model}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-[var(--surface)] rounded-md"
            >
              {model}
              <button
                onClick={() => removeModel(model)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addModel()}
            placeholder="添加模型名称..."
            className="input flex-1 text-sm"
          />
          <button onClick={addModel} className="btn btn-secondary px-3">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Default Model */}
      {models.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1.5">默认模型</label>
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="input w-full"
          >
            <option value="">无</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || (!apiKey.trim() && !config?.configured)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? '保存中...' : '保存'}
        </button>
        {config?.configured && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-secondary text-red-500 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? '...' : '重置'}
          </button>
        )}
      </div>
    </div>
  )
}
