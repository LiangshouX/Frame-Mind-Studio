'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

interface InputBarProps {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export function InputBar({ onSend, disabled, placeholder = '输入你的创意想法...' }: InputBarProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="border-t border-[var(--border-light)] p-4">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className="flex-1 input resize-none disabled:opacity-50 text-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="self-end btn btn-primary px-4"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
