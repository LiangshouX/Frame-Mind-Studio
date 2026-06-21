'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createEditor, Descendant, Element as SlateElement } from 'slate'
import { Slate, Editable, withReact, RenderElementProps } from 'slate-react'
import { withHistory } from 'slate-history'
import { Script, ScriptContent, TraditionalScriptContent, ScriptEpisode, ScriptScene, ScriptBeat, ElementType } from '@/types/script'
import { useEditorStore } from '@/stores/editor-store'
import { ELEMENT_TYPE_NEXT, ENTER_DEFAULT_AFTER } from '@/constants/element-types'
import { debounce } from '@/lib/utils/debounce'
import * as scriptsApi from '@/lib/api/scripts'

interface ScriptEditorProps { projectId: string; script: Script | null }
interface CustomElement { type: string; children: CustomText[] }
interface CustomText { text: string }

declare module 'slate' {
  interface CustomTypes { Element: CustomElement; Text: CustomText }
}

function ElementRenderer({ attributes, children, element }: RenderElementProps) {
  const type = (element as CustomElement).type || 'action'
  return <div {...attributes} className={ELEMENT_CLASSNAMES[type] || ELEMENT_CLASSNAMES.action}>{children}</div>
}

const ELEMENT_CLASSNAMES: Record<string, string> = {
  scene_heading: 'font-mono text-base font-bold uppercase tracking-wide text-[var(--accent)] py-3 border-b border-[var(--border)] mb-2',
  action: 'text-base text-[var(--text-secondary)] py-1.5 leading-relaxed',
  character: 'font-mono text-sm font-bold uppercase tracking-[0.1em] text-[var(--gold-dark)] pt-4 pb-1.5',
  dialogue: 'text-base text-[var(--text-primary)] pl-8 pr-16 py-1.5 leading-relaxed',
  parenthetical: 'text-sm text-[var(--text-muted)] pl-8 italic py-1',
  transition: 'font-mono text-sm text-right text-[var(--text-muted)] uppercase py-3',
}

function scriptToSlate(script: Script | null): Descendant[] {
  if (!script?.content) return [{ type: 'action', children: [{ text: '' }] } as Descendant]

  const nodes: Descendant[] = []

  // 判断是微短剧模型还是传统影视模型
  if ('episodes' in script.content) {
    // 微短剧模型：episode → scene → beat
    const content = script.content as ScriptContent
    if (!content.episodes?.length) return [{ type: 'action', children: [{ text: '' }] } as Descendant]
    for (const ep of content.episodes) {
      for (const scene of ep.scenes) {
        nodes.push({ type: 'scene_heading', children: [{ text: `${scene.location} — ${scene.time}` }] } as Descendant)
        for (const beat of scene.beats) {
          nodes.push({ type: beat.type === 'dialogue' ? 'dialogue' : beat.type === 'transition' ? 'transition' : 'action', children: [{ text: beat.character ? `${beat.character}: ${beat.content}` : beat.content }] } as Descendant)
        }
      }
    }
  } else if ('acts' in script.content) {
    // 传统影视模型：act → sequence → scene → block
    const content = script.content as TraditionalScriptContent
    if (!content.acts?.length) return [{ type: 'action', children: [{ text: '' }] } as Descendant]
    for (const act of content.acts) {
      nodes.push({ type: 'scene_heading', children: [{ text: `第${act.actNumber}幕: ${act.actName}` }] } as Descendant)
      for (const seq of act.sequences) {
        nodes.push({ type: 'action', children: [{ text: `[${seq.sequenceName}] ${seq.plotPoint}` }] } as Descendant)
        for (const scene of seq.scenes) {
          nodes.push({ type: 'scene_heading', children: [{ text: scene.slugline }] } as Descendant)
          for (const block of scene.blocks) {
            nodes.push({
              type: block.blockType === 'dialogue' ? 'dialogue' : block.blockType === 'transition' ? 'transition' : 'action',
              children: [{ text: block.characterName ? `${block.characterName}: ${block.content}` : block.content }]
            } as Descendant)
          }
        }
      }
    }
  }

  return nodes.length > 0 ? nodes : [{ type: 'action', children: [{ text: '' }] } as Descendant]
}

/** Convert Slate editor nodes back to structured ScriptContent format */
function slateToScript(nodes: Descendant[], title = '', totalEpisodes = 1): ScriptContent {
  const episodes: ScriptEpisode[] = []
  let currentEpisode: ScriptEpisode = {
    episodeNumber: 1,
    title: '',
    durationMinutes: 0,
    scenes: [],
  }
  let currentScene: ScriptScene | null = null
  let lastDialogueBeat: ScriptBeat | null = null

  const ensureEpisode = () => {
    if (currentEpisode.scenes.length === 0) {
      episodes.push(currentEpisode)
    } else if (!episodes.includes(currentEpisode)) {
      episodes.push(currentEpisode)
    }
  }

  const ensureScene = (): ScriptScene => {
    if (!currentScene) {
      currentScene = {
        sceneId: `S${currentEpisode.scenes.length + 1}`,
        location: '',
        time: '',
        moodTags: [],
        charactersPresent: [],
        beats: [],
      }
      currentEpisode.scenes.push(currentScene)
    }
    return currentScene
  }

  for (const node of nodes) {
    const el = node as CustomElement
    const text = el.children?.map((c: CustomText) => c.text).join('') || ''

    switch (el.type) {
      case 'scene_heading': {
        ensureEpisode()
        const parts = text.split('—').map(s => s.trim())
        currentScene = {
          sceneId: `S${currentEpisode.scenes.length + 1}`,
          location: parts[0] || text,
          time: parts[1] || '',
          moodTags: [],
          charactersPresent: [],
          beats: [],
        }
        currentEpisode.scenes.push(currentScene)
        lastDialogueBeat = null
        break
      }
      case 'character': {
        // Character heading before dialogue — will be merged with next dialogue node
        const scene = ensureScene()
        // Pre-create dialogue beat with character name
        const charName = text.trim()
        lastDialogueBeat = {
          beatId: `B${scene.beats.length + 1}`,
          type: 'dialogue',
          content: '',
          character: charName,
          emotion: null,
          cameraSuggestion: null,
          durationSeconds: null,
        }
        scene.beats.push(lastDialogueBeat)
        break
      }
      case 'dialogue': {
        const scene = ensureScene()
        if (lastDialogueBeat && lastDialogueBeat.content === '') {
          // Merge with preceding character node
          lastDialogueBeat.content = text
        } else {
          // Standalone dialogue (no preceding character)
          lastDialogueBeat = {
            beatId: `B${scene.beats.length + 1}`,
            type: 'dialogue',
            content: text,
            character: null,
            emotion: null,
            cameraSuggestion: null,
            durationSeconds: null,
          }
          scene.beats.push(lastDialogueBeat)
        }
        break
      }
      case 'parenthetical': {
        // Append to previous dialogue beat's content
        if (lastDialogueBeat) {
          lastDialogueBeat.content += ` (${text})`
        }
        break
      }
      case 'transition': {
        const scene = ensureScene()
        lastDialogueBeat = null
        scene.beats.push({
          beatId: `B${scene.beats.length + 1}`,
          type: 'transition',
          content: text,
          character: null,
          emotion: null,
          cameraSuggestion: null,
          durationSeconds: null,
        })
        break
      }
      case 'action':
      default: {
        const scene = ensureScene()
        lastDialogueBeat = null
        scene.beats.push({
          beatId: `B${scene.beats.length + 1}`,
          type: 'action',
          content: text,
          character: null,
          emotion: null,
          cameraSuggestion: null,
          durationSeconds: null,
        })
        break
      }
    }
  }

  ensureEpisode()

  return {
    title,
    totalEpisodes: Math.max(totalEpisodes, episodes.length),
    episodes,
  }
}

export function ScriptEditor({ projectId, script }: ScriptEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const editorRef = useRef(editor)
  const { currentElementType, setDirty, setSaving, markSaved, saveRequestCount } = useEditorStore()
  const initialValue = useMemo(() => scriptToSlate(script), [script])
  // Key forces Slate to re-mount when script data changes (e.g. after async load or restore)
  const slateKey = useMemo(() => script?.id || script?.content?.title || 'empty', [script])

  const performSave = useCallback(async (changeSummary?: string) => {
    // 根据内容类型决定保存格式
    const content = slateToScript(
      editorRef.current.children,
      script?.content?.title || script?.title || '',
      script?.content && 'totalEpisodes' in script.content ? script.content.totalEpisodes : 1,
    )
    setSaving(true)
    try {
      await scriptsApi.updateScript(projectId, content, changeSummary)
      markSaved()
    } catch {
      setSaving(false)
    }
  }, [projectId, script, setSaving, markSaved])

  const autoSave = useMemo(() => debounce(async () => {
    await performSave()
  }, 30_000), [performSave])

  const handleManualSave = useCallback(async () => {
    autoSave.cancel()
    await performSave('手动保存')
  }, [autoSave, performSave])

  // Watch for save requests from toolbar
  const prevSaveCount = useRef(saveRequestCount)
  useEffect(() => {
    if (saveRequestCount > prevSaveCount.current) {
      prevSaveCount.current = saveRequestCount
      handleManualSave()
    }
  }, [saveRequestCount, handleManualSave])

  const handleChange = useCallback(() => { setDirty(true); autoSave() }, [setDirty, autoSave])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      const nextType = event.shiftKey
        ? Object.entries(ELEMENT_TYPE_NEXT).find(([, v]) => v === currentElementType)?.[0] || 'scene_heading'
        : ELEMENT_TYPE_NEXT[currentElementType] || 'scene_heading'
      useEditorStore.getState().setElementType(nextType as ElementType)
      const { selection } = editor
      if (selection) { const [match] = editor.nodes({ match: n => SlateElement.isElement(n) }); if (match) editor.setNodes({ type: nextType }) }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      const defaultType = ENTER_DEFAULT_AFTER[currentElementType] || 'action'
      editor.insertBreak()
      useEditorStore.getState().setElementType(defaultType as ElementType)
      editor.setNodes({ type: defaultType })
    }
    if (event.key === 'Backspace') {
      const { selection } = editor
      if (selection) {
        const [match] = editor.nodes({ match: n => SlateElement.isElement(n) })
        if (match) { const [node] = match; const el = node as CustomElement; if ((el.children?.map((c: CustomText) => c.text).join('') || '').length === 0) { event.preventDefault(); editor.deleteBackward('block') } }
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      handleManualSave()
    }
  }, [editor, currentElementType, handleManualSave])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Slate key={slateKey} editor={editor} initialValue={initialValue} onChange={handleChange}>
        <Editable renderElement={ElementRenderer} onKeyDown={handleKeyDown} placeholder="开始编写剧本..." className="min-h-[50vh] focus:outline-none" spellCheck={false} />
      </Slate>
    </div>
  )
}
