'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getScript, updateScript } from '@/lib/api/scriptmind'
import type { ScriptContent, ScriptEpisode, ScriptScene, ScriptBeat } from '@/types/script'

export type ElementType = 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition'

export interface EditorElement {
  id: string
  type: ElementType
  content: string
  character?: string
  emotion?: string
  sceneNumber?: number
  episodeNumber?: number
}

interface UseScriptEditorOptions {
  projectId: string
  autoSaveDelay?: number // ms, default 3000
}

interface UseScriptEditorReturn {
  elements: EditorElement[]
  setElements: (els: EditorElement[] | ((prev: EditorElement[]) => EditorElement[])) => void
  activeId: string | null
  setActiveId: (id: string | null) => void
  loading: boolean
  saving: boolean
  lastSaved: Date | null
  scriptTitle: string
  loadScript: () => Promise<void>
  saveScript: (summary?: string) => Promise<void>
  convertToScriptContent: () => ScriptContent
  sceneList: { id: string; label: string; sceneNumber: number; episodeNumber?: number }[]
}

let nextElId = 0
function makeId(): string {
  return `el_${Date.now()}_${++nextElId}`
}

/** Convert backend ScriptContent → flat EditorElement[] */
function scriptToElements(script: ScriptContent): EditorElement[] {
  const els: EditorElement[] = []
  let sceneNum = 0

  for (const ep of script.episodes || []) {
    // Episode divider
    els.push({
      id: makeId(),
      type: 'transition',
      content: `—— 第 ${ep.episodeNumber} 集：${ep.title} ——`,
      episodeNumber: ep.episodeNumber,
    })

    for (const scene of ep.scenes || []) {
      sceneNum++
      els.push({
        id: makeId(),
        type: 'scene_heading',
        content: `${scene.location || 'INT. 场景'} - ${scene.time || '时间'}`,
        sceneNumber: sceneNum,
        episodeNumber: ep.episodeNumber,
      })

      for (const beat of scene.beats || []) {
        if (beat.type === 'dialogue' && beat.character) {
          els.push({
            id: makeId(),
            type: 'character',
            content: beat.character,
            character: beat.character,
          })
          els.push({
            id: makeId(),
            type: 'dialogue',
            content: beat.content || '',
            character: beat.character,
            emotion: beat.emotion,
          })
        } else {
          els.push({
            id: makeId(),
            type: 'action',
            content: beat.content || '',
          })
        }
      }
    }
  }

  if (els.length === 0) {
    els.push({ id: makeId(), type: 'scene_heading', content: '' })
  }

  return els
}

/** Convert flat EditorElement[] → backend ScriptContent */
function elementsToScript(elements: EditorElement[], title: string): ScriptContent {
  const episodes: ScriptEpisode[] = []
  let currentEpisode: ScriptEpisode | null = null
  let currentScene: ScriptScene | null = null
  let sceneNum = 0

  for (const el of elements) {
    if (el.type === 'transition' && el.content.includes('第') && el.content.includes('集')) {
      // Parse episode from transition line
      const match = el.content.match(/第\s*(\d+)\s*集[：:]\s*(.+)/)
      if (match) {
        if (currentScene && currentEpisode) {
          currentEpisode.scenes.push(currentScene)
        }
        if (currentEpisode) {
          episodes.push(currentEpisode)
        }
        currentEpisode = {
          episodeNumber: parseInt(match[1]),
          title: match[2].replace(/[——\s]+$/, '').trim(),
          durationMinutes: 3,
          keyEvents: [],
          scenes: [],
        }
        currentScene = null
      }
      continue
    }

    if (el.type === 'scene_heading') {
      if (currentScene && currentEpisode) {
        currentEpisode.scenes.push(currentScene)
      }
      sceneNum++
      const parts = el.content.split(/\s*[-–—]\s*/)
      currentScene = {
        sceneId: `scene_${sceneNum}`,
        location: parts[0] || '场景',
        time: parts[1] || '',
        moodTags: [],
        charactersPresent: [],
        beats: [],
      }
      continue
    }

    // Ensure we have a scene
    if (!currentScene) {
      sceneNum++
      currentScene = {
        sceneId: `scene_${sceneNum}`,
        location: '场景',
        time: '',
        moodTags: [],
        charactersPresent: [],
        beats: [],
      }
    }

    // Ensure we have an episode
    if (!currentEpisode) {
      currentEpisode = {
        episodeNumber: 1,
        title: '第1集',
        durationMinutes: 3,
        keyEvents: [],
        scenes: [],
      }
    }

    if (el.type === 'character') {
      // Character name — the next element should be dialogue
      continue
    }

    const beat: ScriptBeat = {
      beatId: el.id,
      type: el.type === 'dialogue' ? 'dialogue' : el.type === 'parenthetical' ? 'dialogue' : 'action',
      content: el.content,
      character: el.character,
      emotion: el.emotion,
    }

    if (el.type === 'dialogue' && el.character) {
      // Look back for character name
      const idx = elements.indexOf(el)
      for (let i = idx - 1; i >= 0; i--) {
        if (elements[i].type === 'character') {
          beat.character = elements[i].content
          break
        }
        if (elements[i].type !== 'parenthetical') break
      }
    }

    currentScene.beats.push(beat)
  }

  // Close remaining
  if (currentScene && currentEpisode) {
    currentEpisode.scenes.push(currentScene)
  }
  if (currentEpisode) {
    episodes.push(currentEpisode)
  }

  return {
    title,
    totalEpisodes: episodes.length,
    episodes,
  }
}

export function useScriptEditor({ projectId, autoSaveDelay = 3000 }: UseScriptEditorOptions): UseScriptEditorReturn {
  const [elements, setElements] = useState<EditorElement[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [scriptTitle, setScriptTitle] = useState('未命名剧本')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirtyRef = useRef(false)

  const loadScript = useCallback(async () => {
    setLoading(true)
    try {
      const script: any = await getScript(projectId)
      if (script?.content?.episodes?.length > 0) {
        setElements(scriptToElements(script.content))
        setScriptTitle(script.content.title || script.title || '未命名剧本')
      } else {
        setElements([{ id: makeId(), type: 'scene_heading', content: '' }])
      }
    } catch {
      // Start with empty editor
      setElements([{ id: makeId(), type: 'scene_heading', content: '' }])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const convertToScriptContent = useCallback((): ScriptContent => {
    return elementsToScript(elements, scriptTitle)
  }, [elements, scriptTitle])

  const saveScript = useCallback(async (summary?: string) => {
    setSaving(true)
    try {
      const content = elementsToScript(elements, scriptTitle)
      await updateScript(projectId, content, summary || '手动编辑')
      setLastSaved(new Date())
      dirtyRef.current = false
    } catch (e) {
      console.error('Auto-save failed:', e)
    } finally {
      setSaving(false)
    }
  }, [projectId, elements, scriptTitle])

  // Auto-save on content change
  useEffect(() => {
    if (loading || elements.length === 0) return
    dirtyRef.current = true

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (dirtyRef.current) {
        saveScript('自动保存')
      }
    }, autoSaveDelay)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [elements, loading, autoSaveDelay, saveScript])

  // Load on mount
  useEffect(() => {
    loadScript()
  }, [loadScript])

  // Scene list for sidebar navigation
  const sceneList = elements
    .filter((el) => el.type === 'scene_heading')
    .map((el, i) => ({
      id: el.id,
      label: el.content || `场景 ${i + 1}`,
      sceneNumber: el.sceneNumber || i + 1,
      episodeNumber: el.episodeNumber,
    }))

  return {
    elements,
    setElements,
    activeId,
    setActiveId,
    loading,
    saving,
    lastSaved,
    scriptTitle,
    loadScript,
    saveScript,
    convertToScriptContent,
    sceneList,
  }
}
