'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { STYLE_PRESETS } from '@/constants/style-presets'

interface InputBarProps {
  onSend: (text: string, stylePreset?: string) => void
  disabled?: boolean
  placeholder?: string
}

export function InputBar({ onSend, disabled, placeholder = '输入你的创意想法...' }: InputBarProps) {
  const [text, setText] = useState('')
  const [preset, setPreset] = useState<string | undefined>()

  const handleSubmit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim(), preset)
    setText('')
  }

  return (
    <div className="border-t border-[var(--border)] p-5">
      <div className="flex flex-wrap gap-2 mb-4">
        {STYLE_PRESETS.map((p) => (
          <button key={p.id} onClick={() => setPreset(preset === p.id ? undefined : p.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              preset === p.id
                ? 'bg-[var(--gold)] text-white border-[var(--gold)] font-medium shadow-sm'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >{p.name}</button>
        ))}
      </div>
      <div className="flex gap-3">
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
          placeholder={placeholder} rows={2} disabled={disabled}
          className="flex-1 input resize-none disabled:opacity-50"
        />
        <button onClick={handleSubmit} disabled={!text.trim() || disabled} className="self-end btn btn-primary px-5">
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
