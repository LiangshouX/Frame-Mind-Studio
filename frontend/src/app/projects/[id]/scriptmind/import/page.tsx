'use client'
import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { PipelineNav } from '@/components/shared/pipeline-nav'
import { importFile, importUrl } from '@/lib/api/scriptmind'
import { Upload, Globe, FileText, Loader2 } from 'lucide-react'

export default function ImportPage() {
  const params = useParams()
  const projectId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'file' | 'url'>('file')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const res = await importFile(projectId, file)
      setResult(res.result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlImport = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await importUrl(projectId, url)
      setResult(res.result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14">
        <PipelineNav projectId={projectId} />
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">
            导入
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-6">
            导入现有内容
          </h1>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('file')}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
                mode === 'file'
                  ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              <Upload className="h-4 w-4" />
              上传文件
            </button>
            <button
              onClick={() => setMode('url')}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
                mode === 'url'
                  ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              <Globe className="h-4 w-4" />
              URL 抓取
            </button>
          </div>

          {mode === 'file' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] rounded-lg p-12 text-center cursor-pointer hover:border-[var(--text-muted)] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,.md,.fountain"
                onChange={handleFileUpload}
                className="hidden"
              />
              {loading ? (
                <Loader2 className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3 animate-spin" />
              ) : (
                <FileText className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
              )}
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {loading ? '解析中...' : '点击或拖拽文件到此处'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                支持 .txt / .docx / .md / .fountain 格式，上限 50 万字
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/story"
                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                onClick={handleUrlImport}
                disabled={!url.trim() || loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white text-sm rounded hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                {loading ? '抓取中...' : '抓取并改编'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 p-5 bg-[var(--bg-card)] border border-[var(--border-light)] rounded">
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">导入结果</h3>
              <pre className="text-sm text-[var(--text-secondary)] overflow-auto max-h-64 font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
