/**
 * 剧本类型定义
 * 支持微短剧（Beat 驱动）和传统影视（Block 驱动）双轨数据模型
 */

export interface Script {
  id: string
  project_id: string
  title: string
  content: ScriptContent | TraditionalScriptContent
  format_type: string
  word_count: number
  scene_count: number
  episode_count: number
  version: number
  created_at: string
  updated_at: string
}

// ─── 微短剧模型 ─────────────────────────────────────────────────

export interface ScriptContent {
  title: string
  totalEpisodes: number
  episodes: ScriptEpisode[]
}

export interface ScriptEpisode {
  episodeNumber: number
  title: string
  highlight?: string
  hook?: string
  durationMinutes: number
  targetDurationSeconds?: number
  scenes: ScriptScene[]
}

export interface ScriptScene {
  sceneId: string
  intExt?: '内景' | '外景' | '内外景'
  location: string
  time: string
  moodTags: string[]
  charactersPresent: string[]
  beats: ScriptBeat[]
}

export interface ScriptBeat {
  beatId: string
  beatType?: string
  type: string
  summary?: string
  content: string
  visualAction?: string
  character: string | null
  emotion: string | null
  emotionArc?: string
  cameraSuggestion: string | null
  durationSeconds: number | null
  dialogues?: ScriptDialogue[]
}

export interface ScriptDialogue {
  characterName: string
  parenthetical?: string
  line: string
}

// ─── 传统影视模型 ───────────────────────────────────────────────

export interface TraditionalScriptContent {
  title: string
  structureModel: '三幕剧' | '英雄之旅' | '起承转合'
  acts: ScriptAct[]
}

export interface ScriptAct {
  actNumber: number
  actName: string
  actGoal: string
  sequences: ScriptSequence[]
}

export interface ScriptSequence {
  sequenceId: string
  sequenceName: string
  plotPoint: string
  scenes: TraditionalScene[]
}

export interface TraditionalScene {
  sceneId: string
  slugline: string
  intExt: '内景' | '外景' | '内外景'
  location: string
  timeOfDay: string
  charactersPresent: string[]
  sceneObjective?: string
  blocks: ScriptBlock[]
}

export interface ScriptBlock {
  blockId: string
  blockType: 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition'
  content: string
  characterName?: string
}

// ─── 编辑器类型 ─────────────────────────────────────────────────

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
