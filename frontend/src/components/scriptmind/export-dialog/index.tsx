'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Download, FileText, FileJson, Loader2 } from 'lucide-react'
import * as workflowApi from '@/lib/api/workflow'

interface ExportDialogProps {
  projectId: string
  open: boolean
  onClose: () => void
}

type ExportFormat = 'json' | 'fountain'

/**
 * 导出剧本对话框。
 * 支持 JSON 和 Fountain 格式。
 * 支持 Escape 键关闭、遮罩层点击关闭、焦点陷阱。
 */
export function ExportDialog({ projectId, open, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleClose = () => {
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

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      let data: unknown
      let filename: string
      let mimeType: string

      if (format === 'json') {
        data = await workflowApi.exportJson(projectId)
        filename = `script-${projectId}.json`
        mimeType = 'application/json'
      } else {
        data = await workflowApi.exportFountain(projectId)
        filename = `script-${projectId}.fountain`
        mimeType = 'text/plain'
      }

      // 检查空内容
      if (!data || (typeof data === 'object' && Object.keys(data as object).length === 0)) {
        setError('暂无内容可导出')
        return
      }

      // 触发下载
      const content = format === 'json' ? JSON.stringify(data, null, 2) : String(data)
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败')
    } finally {
      setExporting(false)
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
        className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">导出剧本</h2>
          <button onClick={handleClose} className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors">
            <X className="h-5 w-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            选择导出格式，将剧本内容下载到本地。
          </p>

          {/* 格式选择 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('json')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                format === 'json'
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-[var(--border)] hover:border-[var(--text-muted)]'
              }`}
            >
              <FileJson className="h-8 w-8 text-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">JSON</span>
              <span className="text-xs text-[var(--text-muted)]">结构化数据</span>
            </button>
            <button
              onClick={() => setFormat('fountain')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                format === 'fountain'
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-[var(--border)] hover:border-[var(--text-muted)]'
              }`}
            >
              <FileText className="h-8 w-8 text-[var(--accent)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Fountain</span>
              <span className="text-xs text-[var(--text-muted)]">标准剧本格式</span>
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                导出 {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
