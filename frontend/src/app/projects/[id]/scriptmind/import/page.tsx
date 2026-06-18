'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react'
import * as agentApi from '@/lib/api/agent'

export default function ImportPage() {
  const params = useParams()
  const projectId = params.id as string
  const [mode, setMode] = useState<'file' | 'url'>('file')
  const [url, setUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setError(null)
    try {
      const res = await agentApi.importFile(projectId, file)
      setResult(`导入任务已启动，会话 ID: ${res.session_id}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const handleUrlImport = async () => {
    if (!url.trim()) return
    setImporting(true)
    setError(null)
    try {
      const res = await agentApi.importUrl({ project_id: projectId, url: url.trim() })
      setResult(`导入任务已启动，会话 ID: ${res.session_id}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl font-bold mb-8">导入内容</h1>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setMode('file')}
            className={`px-4 py-2 text-sm rounded border transition-colors ${
              mode === 'file'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-1.5" />
            上传文件
          </button>
          <button
            onClick={() => setMode('url')}
            className={`px-4 py-2 text-sm rounded border transition-colors ${
              mode === 'url'
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            <LinkIcon className="h-4 w-4 inline mr-1.5" />
            输入 URL
          </button>
        </div>

        {mode === 'file' ? (
          <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-12 text-center">
            <Upload className="h-8 w-8 mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              支持 .txt、.docx、.md、.fountain 格式，最大 50 万字
            </p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white text-sm rounded cursor-pointer hover:bg-[var(--accent-dark)]">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {importing ? '导入中...' : '选择文件'}
              <input
                type="file"
                accept=".txt,.docx,.md,.fountain"
                onChange={handleFileUpload}
                className="hidden"
                disabled={importing}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">网页 URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/story"
                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <button
              onClick={handleUrlImport}
              disabled={!url.trim() || importing}
              className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm rounded hover:bg-[var(--accent-dark)] disabled:opacity-50"
            >
              {importing ? '抓取中...' : '抓取并改编'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 rounded bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] text-sm">
            {result}
          </div>
        )}
      </main>
    </>
  )
}
