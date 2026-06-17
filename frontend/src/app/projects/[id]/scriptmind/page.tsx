'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { PipelineNav } from '@/components/shared/pipeline-nav'
import { AgentChat } from '@/components/shared/agent-chat'
import { SceneNav } from '@/components/scriptmind/scene-nav'
import { useAgentSession } from '@/hooks/shared/useAgentSession'
import { useScriptEditor, type ElementType, type EditorElement } from '@/hooks/scriptmind/useScriptEditor'
import { cn } from '@/lib/utils'
import {
  Save, Undo2, Redo2, PanelLeftClose, PanelLeftOpen,
  MessageSquare, MessageSquareOff, ChevronLeft,
  Film, Loader2, Check, AlertCircle,
} from 'lucide-react'

const ELEMENT_CYCLE: ElementType[] = [
  'scene_heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition',
]

const TYPE_LABELS: Record<ElementType, string> = {
  scene_heading: '场景',
  action: '动作',
  character: '角色',
  dialogue: '对白',
  parenthetical: '括号',
  transition: '转场',
}

const TYPE_COLORS: Record<ElementType, string> = {
  scene_heading: '#C53D3D',
  action: '#57534E',
  character: '#3D6B5E',
  dialogue: '#3D5A8B',
  parenthetical: '#8B5E3C',
  transition: '#8B5C3D',
}

export default function ScriptMindEditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const agent = useAgentSession()

  const editor = useScriptEditor({ projectId })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [undoStack, setUndoStack] = useState<EditorElement[][]>([])
  const [redoStack, setRedoStack] = useState<EditorElement[][]>([])
  const editorRef = useRef<HTMLDivElement>(null)

  // Push to undo stack on content change
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-30), editor.elements])
    setRedoStack([])
  }, [editor.elements])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((s) => s.slice(0, -1))
    setRedoStack((s) => [...s, editor.elements])
    editor.setElements(prev)
  }, [undoStack, editor])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack((s) => s.slice(0, -1))
    setUndoStack((s) => [...s, editor.elements])
    editor.setElements(next)
  }, [redoStack, editor])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        editor.saveScript('手动保存')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo, editor])

  // Scroll to scene on nav click
  const handleSceneClick = useCallback((sceneId: string) => {
    const el = document.querySelector(`[data-element-id="${sceneId}"]`) as HTMLElement
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    }
  }, [])

  // Element keyboard handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      const idx = editor.elements.findIndex((el) => el.id === id)
      if (idx === -1) return

      // Tab — cycle element type
      if (e.key === 'Tab') {
        e.preventDefault()
        pushUndo()
        const current = editor.elements[idx].type
        const nextIdx = (ELEMENT_CYCLE.indexOf(current) + (e.shiftKey ? -1 : 1) + ELEMENT_CYCLE.length) % ELEMENT_CYCLE.length
        editor.setElements((prev) =>
          prev.map((el, i) => (i === idx ? { ...el, type: ELEMENT_CYCLE[nextIdx] } : el))
        )
        return
      }

      // Enter — new element with smart default type
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        pushUndo()
        const currentType = editor.elements[idx].type
        const newType: ElementType =
          currentType === 'character' ? 'dialogue' :
          currentType === 'dialogue' ? 'action' :
          currentType === 'parenthetical' ? 'dialogue' :
          currentType === 'transition' ? 'scene_heading' :
          currentType === 'scene_heading' ? 'action' : 'action'

        const newId = `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        editor.setElements((prev) => {
          const next = [...prev]
          next.splice(idx + 1, 0, { id: newId, type: newType, content: '' })
          return next
        })
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-element-id="${newId}"]`) as HTMLElement
          el?.focus()
        })
        return
      }

      // Backspace on empty — delete element
      if (e.key === 'Backspace' && editor.elements[idx].content === '' && editor.elements.length > 1) {
        e.preventDefault()
        pushUndo()
        editor.setElements((prev) => prev.filter((_, i) => i !== idx))
        requestAnimationFrame(() => {
          const prevId = editor.elements[Math.max(0, idx - 1)]?.id
          if (prevId) {
            const el = document.querySelector(`[data-element-id="${prevId}"]`) as HTMLElement
            el?.focus()
          }
        })
        return
      }

      // Arrow up — navigate to previous element
      if (e.key === 'ArrowUp' && idx > 0) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          if (range.startOffset === 0 && range.endOffset === 0) {
            e.preventDefault()
            const prevId = editor.elements[idx - 1].id
            const el = document.querySelector(`[data-element-id="${prevId}"]`) as HTMLElement
            el?.focus()
            const r = document.createRange()
            r.selectNodeContents(el)
            r.collapse(false)
            sel.removeAllRanges()
            sel.addRange(r)
          }
        }
      }

      // Arrow down — navigate to next element
      if (e.key === 'ArrowDown' && idx < editor.elements.length - 1) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const el = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
          if (el) {
            const range = sel.getRangeAt(0)
            const textLen = el.textContent?.length || 0
            if (range.endOffset >= textLen) {
              e.preventDefault()
              const nextId = editor.elements[idx + 1].id
              const nextEl = document.querySelector(`[data-element-id="${nextId}"]`) as HTMLElement
              nextEl?.focus()
              const r = document.createRange()
              r.selectNodeContents(nextEl)
              r.collapse(true)
              sel.removeAllRanges()
              sel.addRange(r)
            }
          }
        }
      }
    },
    [editor, pushUndo]
  )

  const handleInput = useCallback(
    (id: string, content: string) => {
      editor.setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, content } : el))
      )
    },
    [editor]
  )

  // Get active element type for status bar
  const activeType = editor.activeId
    ? editor.elements.find((e) => e.id === editor.activeId)?.type
    : null

  if (editor.loading) {
    return (
      <>
        <Navbar />
        <main className="pt-14">
          <PipelineNav projectId={projectId} />
          <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
            <div className="flex items-center gap-3 text-[var(--text-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">加载剧本...</span>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-14">
        <PipelineNav projectId={projectId} />
        <div className="flex h-[calc(100vh-5.25rem)]">
          {/* ===== Left: Scene Navigation ===== */}
          {sidebarOpen && (
            <div className="w-60 flex-shrink-0 animate-slide-in-right">
              <SceneNav
                scenes={editor.sceneList}
                activeSceneId={editor.activeId}
                onSceneClick={handleSceneClick}
              />
            </div>
          )}

          {/* ===== Center: Editor ===== */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-light)] bg-[var(--bg-card)]">
              <div className="flex items-center gap-2">
                {/* Sidebar toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)] transition-colors"
                  title={sidebarOpen ? '收起场景导航' : '展开场景导航'}
                >
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </button>

                {/* Back to outline */}
                <button
                  onClick={() => router.push(`/projects/${projectId}/scriptmind/outline`)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded hover:bg-[var(--bg-sidebar)]"
                >
                  <ChevronLeft className="h-3 w-3" />
                  大纲
                </button>

                <div className="w-px h-4 bg-[var(--border-light)] mx-1" />

                {/* Undo / Redo */}
                <button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)] disabled:opacity-30 transition-colors"
                  title="撤销 (Ctrl+Z)"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)] disabled:opacity-30 transition-colors"
                  title="重做 (Ctrl+Shift+Z)"
                >
                  <Redo2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Save status */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  {editor.saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>保存中...</span>
                    </>
                  ) : editor.lastSaved ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      <span>已保存 {editor.lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  ) : null}
                </div>

                {/* Manual save */}
                <button
                  onClick={() => editor.saveScript('手动保存')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--text-primary)] text-[var(--bg)] rounded hover:bg-[var(--text-primary)]/80 transition-colors"
                >
                  <Save className="h-3 w-3" />
                  保存
                </button>

                {/* Chat toggle */}
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    chatOpen
                      ? 'text-[var(--accent)] bg-[var(--accent-light)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)]'
                  )}
                  title={chatOpen ? '收起 Agent 面板' : '展开 Agent 面板'}
                >
                  {chatOpen ? <MessageSquareOff className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Editor content area */}
            <div className="flex-1 overflow-hidden" ref={editorRef}>
              <EditorContent
                elements={editor.elements}
                activeId={editor.activeId}
                setActiveId={editor.setActiveId}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
              />
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border-light)] bg-[var(--bg-card)]">
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                {activeType && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[activeType] }}
                    />
                    {TYPE_LABELS[activeType]}
                  </span>
                )}
                <span>{editor.elements.length} 段落</span>
                <span>{editor.sceneList.length} 场景</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span>Tab 切换类型</span>
                <span>Enter 新段落</span>
                <span>Ctrl+S 保存</span>
              </div>
            </div>
          </div>

          {/* ===== Right: Agent Chat ===== */}
          {chatOpen && (
            <div className="w-80 flex-shrink-0 border-l border-[var(--border-light)] animate-slide-in-right">
              <AgentChat
                messages={agent.messages}
                isRunning={agent.isRunning}
                currentStage={agent.currentStage}
                stageLabel={agent.stageLabel}
                hitlPending={agent.hitlPending}
                hitlOptions={agent.hitlOptions}
                onReview={agent.submitReview}
              />
            </div>
          )}
        </div>
      </main>
    </>
  )
}

// ==================== Editor Content ====================

interface EditorContentProps {
  elements: EditorElement[]
  activeId: string | null
  setActiveId: (id: string | null) => void
  onKeyDown: (e: React.KeyboardEvent, id: string) => void
  onInput: (id: string, content: string) => void
}

function EditorContent({ elements, activeId, setActiveId, onKeyDown, onInput }: EditorContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex h-full">
      {/* Scene numbers gutter */}
      <div className="w-12 flex-shrink-0 border-r border-[var(--border-light)] bg-[var(--bg-sidebar)] overflow-hidden">
        {elements.map((el) => (
          <div key={`num_${el.id}`} className="h-[2.125rem] flex items-center justify-end pr-2">
            {el.type === 'scene_heading' && el.sceneNumber && (
              <span className="font-mono text-[0.6875rem] text-[var(--text-muted)]">
                {el.sceneNumber}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Editor area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-4 px-6 scrollbar-thin"
        style={{ maxWidth: '48rem', margin: '0 auto' }}
      >
        {elements.map((el) => (
          <ScriptBlock
            key={el.id}
            element={el}
            isActive={el.id === activeId}
            onFocus={() => setActiveId(el.id)}
            onBlur={() => setActiveId(null)}
            onKeyDown={(e) => onKeyDown(e, el.id)}
            onInput={(content) => onInput(el.id, content)}
          />
        ))}

        {/* Empty state hint */}
        {elements.length === 1 && elements[0].content === '' && (
          <div className="mt-8 text-center animate-fade-in">
            <Film className="h-8 w-8 text-[var(--border)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)] mb-1">开始创作你的剧本</p>
            <p className="text-xs text-[var(--text-muted)]">
              输入场景标题，按 <kbd className="px-1.5 py-0.5 bg-[var(--bg-sidebar)] rounded text-[0.625rem] font-mono border border-[var(--border-light)]">Tab</kbd> 切换元素类型
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== Script Block ====================

interface ScriptBlockProps {
  element: EditorElement
  isActive: boolean
  onFocus: () => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onInput: (content: string) => void
}

function ScriptBlock({ element, isActive, onFocus, onBlur, onKeyDown, onInput }: ScriptBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const borderColor = TYPE_COLORS[element.type]

  const getStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'relative',
      padding: '0.25rem 0.5rem',
      borderRadius: 'var(--radius)',
      minHeight: '1.5rem',
      cursor: 'text',
      borderLeft: `3px solid ${borderColor}`,
      transition: 'background-color 0.15s ease, border-color 0.15s ease',
    }

    switch (element.type) {
      case 'scene_heading':
        return {
          ...base,
          fontFamily: "'JetBrains Mono', Consolas, monospace",
          fontSize: '0.8125rem',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          color: 'var(--text-primary)',
          padding: '0.375rem 0.75rem',
          background: isActive ? 'var(--accent-light)' : 'var(--scene-heading-bg)',
          marginTop: '1.25rem',
        }
      case 'action':
        return {
          ...base,
          fontSize: '0.9375rem',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
        }
      case 'character':
        return {
          ...base,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8125rem',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          color: borderColor,
          textAlign: 'center' as const,
          margin: '0.75rem 0 0.125rem',
          paddingTop: '0.375rem',
          borderLeftColor: borderColor,
        }
      case 'dialogue':
        return {
          ...base,
          maxWidth: '65%',
          margin: '0 auto',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          textAlign: 'center' as const,
          borderLeftColor: borderColor,
        }
      case 'parenthetical':
        return {
          ...base,
          maxWidth: '50%',
          margin: '0 auto',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          textAlign: 'center' as const,
          fontStyle: 'italic',
          borderLeftColor: borderColor,
        }
      case 'transition':
        return {
          ...base,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8125rem',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          textAlign: 'right' as const,
          margin: '0.75rem 0',
          borderLeftColor: borderColor,
        }
      default:
        return base
    }
  }

  return (
    <div
      ref={ref}
      data-element-id={element.id}
      data-type={element.type}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onInput((e.target as HTMLElement).textContent || '')}
      dangerouslySetInnerHTML={{ __html: element.content || '' }}
      style={getStyle()}
      className="script-block"
    />
  )
}
