'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import type { McpServerConfigRequest, McpAuthType } from '@/types/settings'
import { ConnectivityTestButton } from './connectivity-test-button'
import { Plus, Trash2, Save, Server } from 'lucide-react'

export function McpServerConfig() {
  const { mcpServers, isLoading, fetchMcpServers, updateMcpServer, deleteMcpServer, testMcpServer } = useSettingsStore()
  const [showForm, setShowForm] = useState(false)
  const [serverId, setServerId] = useState('')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [authType, setAuthType] = useState<McpAuthType>('NONE')
  const [credentials, setCredentials] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMcpServers()
  }, [fetchMcpServers])

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return
    const id = serverId.trim() || name.trim().toLowerCase().replace(/\s+/g, '-')
    setSaving(true)
    try {
      await updateMcpServer(id, { name, url, authType, credentials })
      setShowForm(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteMcpServer(id)
  }

  const resetForm = () => {
    setServerId('')
    setName('')
    setUrl('')
    setAuthType('NONE')
    setCredentials('')
  }

  const safeServers = Array.isArray(mcpServers) ? mcpServers : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">MCP Server 配置</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          添加服务器
        </button>
      </div>

      {safeServers.length === 0 && !isLoading && !showForm && (
        <p className="text-[var(--text-muted)] py-8 text-center">暂未配置 MCP Server</p>
      )}

      {safeServers.map((server) => (
        <div key={server.server_id} className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-[var(--text-muted)]" />
              <div>
                <div className="font-bold">{server.name}</div>
                <div className="text-sm text-[var(--text-muted)] font-mono">{server.url}</div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(server.server_id)}
              className="p-2 hover:bg-red-500/10 rounded text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <ConnectivityTestButton
            onTest={() => testMcpServer(server.server_id)}
            lastResult={server.last_test_result}
          />
        </div>
      ))}

      {showForm && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold">添加 MCP Server</h3>
          <div>
            <label className="block text-sm font-medium mb-1">名称 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="My MCP Server" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL *</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="input w-full font-mono text-sm" placeholder="http://localhost:3000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">认证类型</label>
            <select value={authType} onChange={(e) => setAuthType(e.target.value as McpAuthType)} className="input w-full">
              <option value="NONE">无</option>
              <option value="BEARER">Bearer Token</option>
              <option value="BASIC">Basic Auth</option>
              <option value="API_KEY">API Key</option>
            </select>
          </div>
          {authType !== 'NONE' && (
            <div>
              <label className="block text-sm font-medium mb-1">凭证</label>
              <input type="password" value={credentials} onChange={(e) => setCredentials(e.target.value)} className="input w-full" />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !name.trim() || !url.trim()} className="btn btn-primary flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? '...' : '保存'}
            </button>
            <button onClick={() => { setShowForm(false); resetForm() }} className="btn btn-secondary">取消</button>
          </div>
        </div>
      )}
    </div>
  )
}
