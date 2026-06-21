// ScriptMind — Shared TypeScript types
// 支持微短剧（Beat 驱动）和传统影视（Block 驱动）双轨数据模型

// ─── 微短剧模型 ─────────────────────────────────────────────────

export type BeatType = 'action' | 'dialogue' | 'emotion' | 'transition'
  | '受辱' | '打脸' | '掉马甲' | '误会' | '反转' | '悬念'

export interface ScriptDialogue {
  characterName: string
  parenthetical?: string
  line: string
}

export interface ScriptBeat {
  beatId: string
  beatType: BeatType
  type: BeatType
  summary: string
  content: string
  visualAction?: string
  character?: string
  emotion?: string
  emotionArc?: string
  cameraSuggestion?: string
  durationSeconds?: number
  dialogues?: ScriptDialogue[]
}

export interface ScriptScene {
  sceneId: string
  intExt: '内景' | '外景' | '内外景'
  location: string
  time: string
  moodTags: string[]
  charactersPresent: string[]
  beats: ScriptBeat[]
}

export interface ScriptEpisode {
  episodeNumber: number
  title: string
  highlight?: string
  hook?: string
  durationMinutes: number
  targetDurationSeconds?: number
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

// ─── 传统影视模型 ───────────────────────────────────────────────

export type BlockType = 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition'

export interface ScriptBlock {
  blockId: string
  blockType: BlockType
  content: string
  characterName?: string
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

export interface ScriptSequence {
  sequenceId: string
  sequenceName: string
  plotPoint: string
  scenes: TraditionalScene[]
}

export interface ScriptAct {
  actNumber: number
  actName: string
  actGoal: string
  sequences: ScriptSequence[]
}

export interface TraditionalScriptContent {
  title: string
  structureModel: '三幕剧' | '英雄之旅' | '起承转合'
  acts: ScriptAct[]
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
  gender?: string
  roleType: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  identity?: string
  persona?: string
  description?: string
  appearance?: string
  background?: string
  personality: string[]
  relationships: Record<string, string>
  characterArc?: string
  overview?: string
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
