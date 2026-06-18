'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { useSettingsStore } from '@/stores/settings-store'
import { Key } from 'lucide-react'

const PROVIDERS = ['openai', 'dashscope', 'anthropic', 'gemini']

export default function SettingsPage() {
  const { apiKeys, models, isLoading, fetchApiKeys, fetchModels, addApiKey } = useSettingsStore()
  const [provider, setProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchApiKeys()
    fetchModels()
  }, [fetchApiKeys, fetchModels])

  const handleAddKey = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await addApiKey(provider, apiKey.trim())
      setApiKey('')
    } catch {
      // error handled in store
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-10">设置</h1>

        <section className="mb-12">
          <h2 className="font-display text-xl font-bold mb-6">API Key 管理</h2>
          <div className="space-y-3 mb-8">
            {apiKeys.map((key) => (
              <div
                key={key.provider}
                className="flex items-center justify-between p-4 card"
              >
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-[var(--text-muted)]" />
                  <span className="text-base font-bold">{key.provider}</span>
                </div>
                <span className="text-sm text-[var(--text-muted)] font-mono">{key.key_preview}</span>
              </div>
            ))}
            {apiKeys.length === 0 && !isLoading && (
              <p className="text-base text-[var(--text-muted)] py-4">暂未配置 API Key</p>
            )}
          </div>

          <div className="p-6 card">
            <h3 className="text-base font-bold mb-4">添加 API Key</h3>
            <div className="flex gap-3">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="input w-40"
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="input flex-1"
              />
              <button
                onClick={handleAddKey}
                disabled={!apiKey.trim() || saving}
                className="btn btn-primary"
              >
                {saving ? '...' : '保存'}
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-6">可用模型</h2>
          <div className="space-y-3">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-4 card"
              >
                <div>
                  <div className="text-base font-bold">{model.name}</div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">{model.use_case}</div>
                </div>
                <span className={`badge ${model.configured ? 'badge-success' : 'badge-default'}`}>
                  {model.configured ? '已配置' : '未配置'}
                </span>
              </div>
            ))}
            {models.length === 0 && !isLoading && (
              <p className="text-base text-[var(--text-muted)] py-4">暂无可用模型</p>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
