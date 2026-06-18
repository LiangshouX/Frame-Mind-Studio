export interface Script {
  id: string
  project_id: string
  title: string
  content: ScriptContent
  format_type: string
  word_count: number
  scene_count: number
  episode_count: number
  version: number
  created_at: string
  updated_at: string
}

export interface ScriptContent {
  title: string
  totalEpisodes: number
  episodes: ScriptEpisode[]
}

export interface ScriptEpisode {
  episodeNumber: number
  title: string
  durationMinutes: number
  scenes: ScriptScene[]
}

export interface ScriptScene {
  sceneId: string
  location: string
  time: string
  moodTags: string[]
  charactersPresent: string[]
  beats: ScriptBeat[]
}

export interface ScriptBeat {
  beatId: string
  type: 'action' | 'dialogue' | 'emotion' | 'transition'
  content: string
  character: string | null
  emotion: string | null
  cameraSuggestion: string | null
  durationSeconds: number | null
}

export type ElementType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'

export interface SceneNavItem {
  sceneId: string
  sceneNumber: number
  location: string
  episodeNumber: number
}
