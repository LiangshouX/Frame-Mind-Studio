'use client'

import { useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'

interface ReviewPanelProps {
  content: string
  onApprove: () => void
  onRevise: (feedback: string) => void
}

export function ReviewPanel({ content, onApprove, onRevise }: ReviewPanelProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')

  return (
    <div className="border-t-2 border-[var(--accent)] bg-[var(--accent-subtle)] p-4">
      <div className="text-xs text-[var(--accent)] font-bold mb-2 uppercase tracking-wide">
        人类审核
      </div>
      <div className="text-sm text-[var(--text-secondary)] mb-4 max-h-32 overflow-y-auto scrollbar-thin whitespace-pre-wrap leading-relaxed">
        {content}
      </div>

      {showFeedback ? (
        <div className="space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请输入修改意见..."
            rows={3}
            className="input resize-none text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onRevise(feedback)}
              className="btn btn-primary text-sm"
            >
              提交修改
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              className="btn btn-ghost text-sm"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="btn bg-[var(--success)] text-white hover:bg-[var(--success)]/90 text-sm"
          >
            <Check className="h-4 w-4" />
            批准
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            className="btn btn-secondary text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            要求修改
          </button>
        </div>
      )}
    </div>
  )
}
