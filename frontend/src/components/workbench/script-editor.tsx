'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { ScriptContent, ScriptEpisode, ScriptScene, ScriptBeat } from '@/types'

type ElementType = 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition'

interface ScriptElement {
  id: string
  type: ElementType
  content: string
  character?: string
  emotion?: string
  sceneNumber?: number
}

interface ScriptEditorProps {
  script: ScriptContent | null
  onScriptChange?: (script: ScriptContent) => void
  readOnly?: boolean
}

export function ScriptEditor({ script, onScriptChange, readOnly = false }: ScriptEditorProps) {
  const [elements, setElements] = React.useState<ScriptElement[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Convert script data to flat element list
  React.useEffect(() => {
    if (!script?.episodes) return
    const els: ScriptElement[] = []
    let sceneNum = 0

    for (const ep of script.episodes) {
      els.push({
        id: `ep_${ep.episodeNumber}`,
        type: 'transition',
        content: `—— 第 ${ep.episodeNumber} 集：${ep.title} ——`,
      })

      for (const scene of ep.scenes || []) {
        sceneNum++
        els.push({
          id: scene.sceneId || `scene_${sceneNum}`,
          type: 'scene_heading',
          content: `${scene.location || '场景'} - ${scene.time || '时间'}`,
          sceneNumber: sceneNum,
        })

        for (const beat of scene.beats || []) {
          if (beat.type === 'dialogue' && beat.character) {
            els.push({
              id: `${beat.beatId}_char`,
              type: 'character',
              content: beat.character,
              character: beat.character,
              emotion: beat.emotion,
            })
            els.push({
              id: beat.beatId || `beat_${Math.random()}`,
              type: 'dialogue',
              content: beat.content || '',
              character: beat.character,
            })
          } else {
            els.push({
              id: beat.beatId || `beat_${Math.random()}`,
              type: beat.type === 'emotion' ? 'action' : 'action',
              content: beat.content || '',
            })
          }
        }
      }
    }

    if (els.length === 0) {
      els.push({ id: 'empty_1', type: 'scene_heading', content: '' })
    }

    setElements(els)
  }, [script])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (readOnly) return
      const idx = elements.findIndex((el) => el.id === id)
      if (idx === -1) return

      // Tab — cycle element type
      if (e.key === 'Tab') {
        e.preventDefault()
        const cycle: ElementType[] = ['scene_heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition']
        const current = elements[idx].type
        const nextIdx = (cycle.indexOf(current) + (e.shiftKey ? -1 : 1) + cycle.length) % cycle.length
        setElements((prev) =>
          prev.map((el, i) => (i === idx ? { ...el, type: cycle[nextIdx] } : el))
        )
        return
      }

      // Enter — new element after current
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const currentType = elements[idx].type
        // After dialogue, default to action; after character, default to dialogue
        const newType: ElementType =
          currentType === 'character' ? 'dialogue' :
          currentType === 'dialogue' ? 'action' :
          currentType === 'scene_heading' ? 'action' : 'action'

        const newId = `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        setElements((prev) => {
          const next = [...prev]
          next.splice(idx + 1, 0, { id: newId, type: newType, content: '' })
          return next
        })
        // Focus new element
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-element-id="${newId}"]`) as HTMLElement
          el?.focus()
        })
        return
      }

      // Backspace on empty — delete element
      if (e.key === 'Backspace' && elements[idx].content === '' && elements.length > 1) {
        e.preventDefault()
        setElements((prev) => prev.filter((_, i) => i !== idx))
        // Focus previous
        requestAnimationFrame(() => {
          const prevId = elements[Math.max(0, idx - 1)]?.id
          if (prevId) {
            const el = document.querySelector(`[data-element-id="${prevId}"]`) as HTMLElement
            el?.focus()
          }
        })
        return
      }

      // Arrow up/down — navigate elements
      if (e.key === 'ArrowUp' && idx > 0) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          if (range.startOffset === 0 && range.endOffset === 0) {
            e.preventDefault()
            const prevId = elements[idx - 1].id
            const el = document.querySelector(`[data-element-id="${prevId}"]`) as HTMLElement
            el?.focus()
            // Move cursor to end
            const range2 = document.createRange()
            range2.selectNodeContents(el)
            range2.collapse(false)
            sel.removeAllRanges()
            sel.addRange(range2)
          }
        }
      }

      if (e.key === 'ArrowDown' && idx < elements.length - 1) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const el = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
          if (el) {
            const range = sel.getRangeAt(0)
            const textLen = el.textContent?.length || 0
            if (range.endOffset >= textLen) {
              e.preventDefault()
              const nextId = elements[idx + 1].id
              const nextEl = document.querySelector(`[data-element-id="${nextId}"]`) as HTMLElement
              nextEl?.focus()
              const range2 = document.createRange()
              range2.selectNodeContents(nextEl)
              range2.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range2)
            }
          }
        }
      }
    },
    [elements, readOnly]
  )

  const handleInput = React.useCallback(
    (id: string, content: string) => {
      if (readOnly) return
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, content } : el))
      )
    },
    [readOnly]
  )

  const typeLabels: Record<ElementType, string> = {
    scene_heading: '场景',
    action: '动作',
    character: '角色',
    dialogue: '对白',
    parenthetical: '括号',
    transition: '转场',
  }

  return (
    <div className="flex h-full">
      {/* Scene numbers gutter */}
      <div className="w-12 flex-shrink-0 border-r border-[var(--border-light)] bg-[var(--bg-sidebar)]">
        {elements.map((el) => (
          <div
            key={`num_${el.id}`}
            className="h-[2.125rem] flex items-center justify-end pr-2"
          >
            {el.type === 'scene_heading' && el.sceneNumber && (
              <span className="scene-number">{el.sceneNumber}</span>
            )}
          </div>
        ))}
      </div>

      {/* Editor area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-4 px-6"
        style={{ maxWidth: '42rem', margin: '0 auto' }}
      >
        {elements.map((el) => (
          <div
            key={el.id}
            className="script-block"
            data-type={el.type}
            data-element-id={el.id}
            tabIndex={0}
            onFocus={() => setActiveId(el.id)}
            onBlur={() => setActiveId(null)}
            onKeyDown={(e) => handleKeyDown(e, el.id)}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onInput={(e) =>
              handleInput(el.id, (e.target as HTMLElement).textContent || '')
            }
            // Set initial content
            dangerouslySetInnerHTML={{ __html: el.content || '' }}
            style={
              el.type === 'scene_heading'
                ? {
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.05em',
                    color: 'var(--text-primary)',
                    padding: '0.375rem 0.75rem',
                    background: 'var(--scene-heading-bg)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: '0 4px 4px 0',
                    margin: '1rem 0 0.5rem',
                    minHeight: '1.5rem',
                  }
                : el.type === 'action'
                ? {
                    fontSize: '0.9375rem',
                    lineHeight: 1.7,
                    color: 'var(--text-primary)',
                    padding: '0.25rem 0.5rem',
                    minHeight: '1.5rem',
                  }
                : el.type === 'character'
                ? {
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.08em',
                    color: 'var(--text-secondary)',
                    textAlign: 'center' as const,
                    margin: '0.75rem 0 0.125rem',
                    paddingTop: '0.375rem',
                    minHeight: '1.5rem',
                  }
                : el.type === 'dialogue'
                ? {
                    maxWidth: '60%',
                    margin: '0 auto',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    textAlign: 'center' as const,
                    padding: '0.25rem 0.5rem',
                    minHeight: '1.5rem',
                  }
                : el.type === 'parenthetical'
                ? {
                    maxWidth: '50%',
                    margin: '0 auto',
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center' as const,
                    fontStyle: 'italic',
                    padding: '0.125rem 0.5rem',
                    minHeight: '1.5rem',
                  }
                : {
                    // transition
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    textAlign: 'right' as const,
                    margin: '0.75rem 0',
                    padding: '0.25rem 0.5rem',
                    minHeight: '1.5rem',
                  }
            }
          />
        ))}

        {/* Hint */}
        {activeId && !readOnly && (
          <div className="mt-4 text-xs text-[var(--text-muted)] flex items-center gap-4">
            <span>
              当前: <span className="font-mono">{typeLabels[elements.find((e) => e.id === activeId)?.type || 'action']}</span>
            </span>
            <span>Tab 切换类型</span>
            <span>Enter 新建段落</span>
            <span>空内容 + Backspace 删除</span>
          </div>
        )}
      </div>
    </div>
  )
}
