'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, FileText, Loader2 } from 'lucide-react'
import { apiUpload } from '@/lib/api/client'

interface UploadDialogProps {
  projectId: string
  open: boolean
  onClose: () => void
  onUploaded?: () => void
}

/**
 * 上传已有内容的对话框。
 * 支持 .txt, .docx, .md, .fountain 格式。
 * 支持 Escape 键关闭、遮罩层点击关闭、焦点陷阱。
 */
export function UploadDialog({ projectId, open, onClose, onUploaded }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setError(null)
    onClose()
  }

  // Escape 键关闭对话框
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // 焦点陷阱：Tab 键循环限制在对话框内
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const dialog = dialogRef.current
    const getFocusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ))
    // 打开时自动聚焦第一个可交互元素
    const focusable = getFocusable()
    focusable[0]?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    dialog.addEventListener('keydown', handleTab)
    return () => dialog.removeEventListener('keydown', handleTab)
  }, [open])

  if (!open) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', projectId)

      const data = await apiUpload<Record<string, unknown>>('/agent/import-file', formData)
      setResult(data)
      onUploaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">上传已有内容</h2>
          <button onClick={handleClose} className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors">
            <X className="h-5 w-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* 文件选择 */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.docx,.md,.fountain"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 px-6 py-8 border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all"
            >
              <Upload className="h-8 w-8 text-[var(--text-muted)]" />
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {file ? file.name : '点击选择文件'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  支持 .txt, .docx, .md, .fountain 格式
                </p>
              </div>
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* 上传结果 */}
          {result && (
            <div className="p-4 bg-[var(--accent-subtle)] border border-[var(--accent)]/30 rounded-lg space-y-2">
              <p className="text-sm font-medium text-[var(--accent)]">✅ 上传成功</p>
              <div className="text-sm text-[var(--text-secondary)]">
                <p>文件已解析完成，内容已导入到项目中。</p>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            {result ? '关闭' : '取消'}
          </button>
          {!result && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  上传
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
