'use client'

import { useState } from 'react'
import { Character } from '@/types/character'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'

interface CharacterPanelProps { projectId: string; characters: Character[] }
const ROLE_LABELS: Record<string, string> = { protagonist: '主角', antagonist: '反派', supporting: '配角', minor: '次要' }

export function CharacterPanel({ projectId, characters }: CharacterPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (characters.length === 0) return <div className="text-sm text-[var(--text-muted)] py-4"><Users className="h-5 w-5 mb-2" /> 暂无角色</div>

  const grouped = characters.reduce<Record<string, Character[]>>((acc, c) => { (acc[c.role] = acc[c.role] || []).push(c); return acc }, {})

  return (
    <div>
      <div className="text-sm text-[var(--accent)] uppercase tracking-wide mb-3 font-medium">角色</div>
      {Object.entries(grouped).map(([role, chars]) => (
        <div key={role} className="mb-4">
          <div className="text-sm text-[var(--text-muted)] mb-2 font-medium">{ROLE_LABELS[role] || role}</div>
          {chars.map((char) => (
            <div key={char.id} className="border border-[var(--border)] rounded-lg mb-2 overflow-hidden">
              <button onClick={() => setExpanded(expanded === char.id ? null : char.id)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--bg-hover)] transition-colors">
                {expanded === char.id ? <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />}
                <span className="text-sm font-bold text-[var(--text-primary)]">{char.name}</span>
              </button>
              {expanded === char.id && (
                <div className="px-3 pb-3 text-sm text-[var(--text-secondary)] space-y-2 border-t border-[var(--border)] pt-2">
                  {char.description && <p className="leading-relaxed">{char.description}</p>}
                  {char.personality.length > 0 && <p>性格: {char.personality.join('、')}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
