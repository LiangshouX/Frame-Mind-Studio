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
    <div className="border-t-2 border-[var(--accent)] bg-[var(--accent-subtle)] p-5">
      <div className="text-sm text-[var(--accent)] font-bold mb-3 uppercase tracking-wide">
        人类审核
      </div>
      <div className="text-base text-[var(--text-secondary)] mb-5 max-h-40 overflow-y-auto scrollbar-thin whitespace-pre-wrap leading-relaxed">
        {content}
      </div>

      {showFeedback ? (
        <div className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请输入修改意见..."
            rows={3}
            className="input resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => onRevise(feedback)}
              className="btn btn-primary"
            >
              提交修改
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              className="btn btn-ghost"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={onApprove}
            className="btn bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
          >
            <Check className="h-5 w-5" />
            批准
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            className="btn btn-secondary"
          >
            <RotateCcw className="h-5 w-5" />
            要求修改
          </button>
        </div>
      )}
    </div>
  )
}
