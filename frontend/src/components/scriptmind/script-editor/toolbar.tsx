'use client'

import { useEditorStore } from '@/stores/editor-store'
import { ELEMENT_TYPES, ELEMENT_TYPE_LABELS } from '@/constants/element-types'
import { Save, Loader2 } from 'lucide-react'

export function EditorToolbar({ onSave }: { onSave?: () => void }) {
  const { currentElementType, setElementType, isDirty, isSaving, lastSavedAt } = useEditorStore()

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        {ELEMENT_TYPES.map((type) => (
          <button key={type} onClick={() => setElementType(type)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap font-medium transition-all ${
              currentElementType === type
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >{ELEMENT_TYPE_LABELS[type]}</button>
        ))}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        {isSaving ? <span className="flex items-center gap-1.5"><Loader2 className="h-4 w-4 animate-spin" /> 保存中...</span>
         : isDirty ? <span>未保存</span> : lastSavedAt ? <span className="text-[var(--accent)]">已保存</span> : null}
        <button onClick={onSave} disabled={!isDirty || isSaving} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30" title="保存 (Ctrl+S)">
          <Save className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
