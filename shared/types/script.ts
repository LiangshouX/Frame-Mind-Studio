// ScriptMind — Shared TypeScript types
// These mirror the backend Pydantic schemas for frontend type safety

export type BeatType = 'action' | 'dialogue' | 'emotion' | 'transition'

export interface ScriptBeat {
  beatId: string
  type: BeatType
  content: string
  character?: string
  emotion?: string
  cameraSuggestion?: string
  durationSeconds?: number
}

export interface ScriptScene {
  sceneId: string
  location: string
  time: string
  moodTags: string[]
  charactersPresent: string[]
  beats: ScriptBeat[]
}

export interface ScriptEpisode {
  episodeNumber: number
  title: string
  durationMinutes: number
  summary?: string
  keyEvents: string[]
  cliffhanger?: string
  scenes: ScriptScene[]
}

export interface ScriptContent {
  title: string
  totalEpisodes: number
  episodes: ScriptEpisode[]
}

export interface StoryOutline {
  title: string
  genre: string[]
  logline: string
  episodes: OutlineEpisode[]
  mainPlotPoints: string[]
  turningPoints: string[]
  themes: string[]
}

export interface OutlineEpisode {
  episodeNumber: number
  title: string
  summary: string
  keyEvents: string[]
  cliffhanger: string
}

export interface Character {
  id: string
  name: string
  roleType: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  description?: string
  appearance?: string
  personality: string[]
  relationships: Record<string, string>
  characterArc?: string
  visualPrompt?: string
}

export interface Foreshadow {
  id: string
  content: string
  plantedEpisode: number
  resolved: boolean
  resolvedEpisode?: number
  relatedCharacters: string[]
  importance: 'high' | 'medium' | 'low'
}

export interface QualityMetrics {
  hookStrength: { value: number; target: number; status: string; details: string }
  rhythmCurve: { value: number; target: number; status: string; details: string }
  characterBalance: { value: number; targetRange: [number, number]; status: string; details: string }
  dialogueRatio: { value: number; targetRange: [number, number]; status: string; details: string }
  sceneDiversity: { value: number; target: number; status: string; details: string }
  foreshadowStatus: { total: number; resolved: number; unresolved: number; status: string; details: string }
  overallScore: number
}
