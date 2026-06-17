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

export interface QualityMetrics {
  hookStrength: { value: number; target: number; status: string; details: string }
  rhythmCurve: { value: number; target: number; status: string; details: string }
  characterBalance: { value: number; targetRange: [number, number]; status: string; details: string }
  dialogueRatio: { value: number; targetRange: [number, number]; status: string; details: string }
  sceneDiversity: { value: number; target: number; status: string; details: string }
  overallScore: number
}
