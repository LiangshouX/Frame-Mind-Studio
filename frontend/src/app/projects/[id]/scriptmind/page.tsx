'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { ScriptContent } from '@/types/script'
import { ScriptEditor } from '@/components/scriptmind/script-editor'
import { EditorToolbar } from '@/components/scriptmind/script-editor/toolbar'
import { OptimizePanel } from '@/components/scriptmind/script-editor/optimize'
import { CharacterPanel } from '@/components/scriptmind/character-panel'
import { ForeshadowTracker } from '@/components/scriptmind/foreshadow-tracker'
import { VersionHistory } from '@/components/shared/version-history'
import { SceneNav } from '@/components/scriptmind/scene-nav'

export default function ScriptmindPage() {
  const params = useParams()
  const projectId = params.id as string
  const { currentProject, updateCurrentScript } = useProjectStore()
  const requestSave = useEditorStore((s) => s.requestSave)
  const currentElementType = useEditorStore((s) => s.currentElementType)

  const [showOptimize, setShowOptimize] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [activeTab, setActiveTab] = useState<'characters' | 'foreshadows' | 'versions'>('characters')

  const handleSceneClick = useCallback((sceneId: string) => {
    // Find the scene heading element in the editor by data attribute or text content
    const editorEl = document.querySelector('[data-slate-editor]')
    if (!editorEl) return
    const headings = editorEl.querySelectorAll('[class*="scene_heading"], [data-slate-element="scene_heading"]')
    for (const heading of headings) {
      if (heading.textContent?.includes(sceneId)) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    // Fallback: search all elements for the scene ID text
    const allElements = editorEl.querySelectorAll('[data-slate-node="element"]')
    for (const el of allElements) {
      if (el.textContent?.startsWith(sceneId)) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
  }, [])

  const handleOptimizeToggle = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
    }
    setShowOptimize((prev) => !prev)
  }, [])

  const handleOptimizeApply = useCallback((text: string) => {
    // Apply the optimized text to the current selection
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
    }
    setShowOptimize(false)
  }, [])

  const handleVersionRestore = useCallback((content: ScriptContent) => {
    if (!currentProject?.script) return
    updateCurrentScript({ ...currentProject.script, content })
  }, [currentProject?.script, updateCurrentScript])

  return (
    <div className="flex h-full">
      <div className="w-56 flex-shrink-0 border-r border-[var(--border-light)] overflow-y-auto scrollbar-thin bg-[var(--bg-card)]">
        <SceneNav onSceneClick={handleSceneClick} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <EditorToolbar onSave={requestSave} />
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ScriptEditor projectId={projectId} script={currentProject?.script || null} />
          {showOptimize && selectedText && (
            <div className="p-8 max-w-3xl mx-auto">
              <OptimizePanel
                projectId={projectId}
                selectedText={selectedText}
                elementType={currentElementType}
                onClose={() => setShowOptimize(false)}
                onApply={handleOptimizeApply}
              />
            </div>
          )}
        </div>
      </div>
      <div className="w-80 flex-shrink-0 border-l border-[var(--border-light)] flex flex-col bg-[var(--bg-card)]">
        <div className="flex border-b border-[var(--border)]">
          {([['characters', '角色'], ['foreshadows', '伏笔'], ['versions', '版本']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          {activeTab === 'characters' && (
            <CharacterPanel projectId={projectId} characters={currentProject?.characters || []} />
          )}
          {activeTab === 'foreshadows' && (
            <ForeshadowTracker projectId={projectId} foreshadows={currentProject?.foreshadows || []} />
          )}
          {activeTab === 'versions' && (
            <VersionHistory projectId={projectId} onRestore={handleVersionRestore} />
          )}
        </div>
      </div>
    </div>
  )
}
