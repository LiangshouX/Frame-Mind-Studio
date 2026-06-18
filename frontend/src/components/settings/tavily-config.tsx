'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import { ConnectivityTestButton } from './connectivity-test-button'
import { Save, Trash2 } from 'lucide-react'

export function TavilyConfig() {
  const { tools, isLoading, fetchTools, updateTool, deleteTool, testTool } = useSettingsStore()
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  const safeTools = Array.isArray(tools) ? tools : []
  const tavily = safeTools.find((t) => t.tool_id === 'tavily')

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await updateTool('tavily', { apiKey: apiKey.trim() })
      setApiKey('')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await deleteTool('tavily')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Tavily 搜索配置</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Tavily 提供 AI 优化的搜索能力，配置后 Agent 可在任务执行中进行联网搜索。
      </p>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">API Key *</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={tavily?.configured ? '已保存 (输入新值以更新)' : 'tvly-...'}
            className="input w-full"
          />
          {tavily?.configured && tavily.api_key_preview && (
            <p className="text-xs text-[var(--text-muted)] mt-1">当前: {tavily.api_key_preview}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? '...' : '保存'}
          </button>
          {tavily?.configured && (
            <button onClick={handleDelete} className="btn btn-secondary text-red-500 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              重置
            </button>
          )}
        </div>

        {tavily?.configured && (
          <ConnectivityTestButton
            onTest={() => testTool('tavily')}
            lastResult={tavily.last_test_result}
          />
        )}
      </div>
    </div>
  )
}
