'use client'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { listCharacters } from '@/lib/api/scriptmind'
import { Users, RefreshCw, Loader2, ChevronDown, Edit3, Save, X } from 'lucide-react'

interface Character {
  id: string
  name: string
  description?: string
  role_type?: string
  personality?: { traits?: string[] }
  backstory?: string
  relationships?: Array<{ target: string; relation: string }>
}

interface CharacterPanelProps {
  projectId: string
  className?: string
}

const ROLE_COLORS: Record<string, string> = {
  protagonist: '#3D6B5E',
  antagonist: '#C53D3D',
  supporting: '#3D5A8B',
  minor: '#8B5E3C',
}

export function CharacterPanel({ projectId, className }: CharacterPanelProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listCharacters(projectId)
      setCharacters(data.items as Character[] || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else add(id, next)
      return next
    })
  }

  const add = (id: string, set: Set<string>) => set.add(id)

  const startEdit = (char: Character) => {
    setEditing(char.id)
    setEditDesc(char.description || '')
  }

  const roleLabels: Record<string, string> = {
    protagonist: '主角',
    antagonist: '反派',
    supporting: '配角',
    minor: '龙套',
  }

  return (
    <div className={cn('flex flex-col bg-[var(--bg-card)] border-l border-[var(--border-light)]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="font-mono text-xs tracking-[0.1em] text-[var(--text-muted)] uppercase">
            角色档案
          </span>
          <span className="font-mono text-[0.625rem] text-[var(--text-muted)] bg-[var(--bg-sidebar)] px-1.5 py-0.5 rounded">
            {characters.length}
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && characters.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-[var(--border)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">暂无角色</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Agent 会自动创建角色档案</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-light)]">
            {characters.map((char) => {
              const isExpanded = expanded.has(char.id)
              const roleColor = ROLE_COLORS[char.role_type || ''] || '#8B5E3C'

              return (
                <div key={char.id} className="hover:bg-[var(--bg-sidebar)] transition-colors">
                  <button
                    onClick={() => toggleExpanded(char.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left"
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: roleColor }}
                    >
                      {char.name[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {char.name}
                        </span>
                        <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-muted)]">
                          {roleLabels[char.role_type || ''] || char.role_type || '未指定'}
                        </span>
                      </div>
                      {char.description && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                          {char.description}
                        </p>
                      )}
                    </div>

                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0 transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pl-11 space-y-2">
                      {/* Personality traits */}
                      {char.personality?.traits && char.personality.traits.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {char.personality.traits.map((trait) => (
                            <span
                              key={trait}
                              className="text-[0.625rem] px-1.5 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-secondary)] border border-[var(--border-light)]"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Backstory */}
                      {char.backstory && (
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {char.backstory}
                        </p>
                      )}

                      {/* Relationships */}
                      {char.relationships && char.relationships.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                            关系
                          </span>
                          {char.relationships.map((rel, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                              <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                              {char.name} → {rel.target}: {rel.relation}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
