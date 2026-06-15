// ==================== AI-DramaForge TypeScript Types ====================

// ---------- Enums ----------
export type AgentType = 'showrunner' | 'world_builder' | 'character_designer' | 'script_doctor'
export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'completed'

// ---------- Project ----------
export interface Project {
  id: string
  title: string
  description?: string
  genre: string[]
  status: ProjectStatus
  targetEpisodes: number
  targetDurationMinutes?: number
  styleReference?: string
  episode_count?: number
  characters?: Character[]
  createdAt: string
  updatedAt: string
  // Legacy compat
  created_at?: string
  updated_at?: string
}

// ---------- Character ----------
export interface Character {
  id: string
  projectId?: string
  project_id?: string
  name: string
  roleType?: string
  role_type?: string
  description?: string
  personality?: {
    traits?: string[]
    strength?: string
    weakness?: string
    [key: string]: unknown
  }
  appearance?: string
  backstory?: string
  arcDescription?: string
  arc?: string
  dialogueStyle?: string
  dialogue_style?: string
  visualPrompt?: string
  avatarUrl?: string
  avatar_url?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

// ---------- Script ----------
export interface Script {
  id: string
  projectId?: string
  project_id?: string
  version?: number
  content?: ScriptContent
  episodes?: Episode[]
  status?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface ScriptContent {
  title?: string
  totalEpisodes?: number
  episodes?: ScriptEpisode[]
}

export interface ScriptEpisode {
  episodeNumber: number
  title: string
  durationMinutes?: number
  scenes?: ScriptScene[]
}

export interface ScriptScene {
  sceneId?: string
  location?: string
  time?: string
  moodTags?: string[]
  charactersPresent?: string[]
  beats?: ScriptBeat[]
}

export interface ScriptBeat {
  beatId?: string
  type?: string
  content?: string
  character?: string
  emotion?: string
  cameraSuggestion?: string
  durationSeconds?: number
}

// Legacy compat
export interface Episode {
  id: string
  number: number
  title: string
  summary: string
  scenes: Scene[]
  status: 'draft' | 'reviewed' | 'final'
}

export interface Scene {
  id: string
  number: number
  title: string
  setting: string
  beats: Beat[]
  dialogue: DialogueLine[]
}

export interface Beat {
  id: string
  content: string
  type: 'action' | 'emotion' | 'transition'
}

export interface DialogueLine {
  id: string
  character_id: string
  character_name: string
  content: string
  emotion?: string
  action?: string
}

// ---------- Agent ----------
export interface AgentSession {
  id: string
  projectId?: string
  project_id?: string
  userId?: string
  agentType?: AgentType
  agent_type?: AgentType
  status: 'active' | 'completed' | 'error'
  agentConfig?: Record<string, unknown>
  createdAt?: string
  created_at?: string
}

export interface AgentMessage {
  id: string
  sessionId?: string
  session_id?: string
  role: 'user' | 'assistant' | 'system'
  agentName?: string
  agent_type?: AgentType
  agentType?: AgentType
  content: string
  structuredData?: unknown
  structured_data?: unknown
  toolCalls?: unknown
  tool_calls?: ToolCall[]
  thinking?: ThinkingStep[]
  createdAt?: string
  created_at?: string
}

export interface ThinkingStep {
  type: 'reasoning' | 'observation' | 'plan'
  content: string
}

export interface ToolCall {
  id?: string
  name: string
  args?: Record<string, unknown>
  arguments?: Record<string, unknown>
  result?: string
}

// ---------- Story Outline ----------
export interface StoryOutline {
  id?: string
  projectId?: string
  project_id?: string
  title: string
  genre?: string[]
  logline?: string
  premise?: string
  themes?: string[]
  episodes?: OutlineEpisode[]
  mainPlotPoints?: string[]
  turningPoints?: string[]
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface OutlineEpisode {
  number?: number
  episodeNumber?: number
  title: string
  summary?: string
  keyEvents?: string[]
  key_events?: string[]
  cliffhanger?: string
}

// ---------- World Setting ----------
export interface WorldSetting {
  id?: string
  projectId?: string
  timePeriod?: string
  location?: string
  socialStructure?: string
  rules?: string[]
  scenes?: WorldScene[]
  atmosphere?: string
  notes?: string
}

export interface WorldScene {
  name: string
  description: string
  moodTags?: string[]
}

// ---------- Memory ----------
export interface MemorySearchResult {
  id: string
  content: string
  metadata?: Record<string, unknown>
  source?: string
  relevance?: number
  score?: number
  created_at?: string
}

// ---------- WebSocket ----------
export interface WebSocketMessage {
  type: string
  agent?: string
  agent_type?: AgentType
  content?: string
  data?: {
    content?: string
    agent_type?: AgentType
    thinking?: ThinkingStep
    tool_call?: ToolCall
    error?: string
    message_id?: string
  }
  payload?: {
    content?: string
    thought?: string
    tool_calls?: ToolCall[]
    structured_data?: unknown
    verdict?: string
    feedback?: string
    question?: string
    options?: string[]
    message?: string
  }
}

// ---------- API ----------
export interface ApiResponse<T> {
  code?: number
  data: T
  message?: string
  success?: boolean
  error?: string
}

export interface CreateProjectRequest {
  title: string
  genre?: string[]
  targetEpisodes?: number
  targetDurationMinutes?: number
  styleReference?: string
  description?: string
}

export interface CreateCharacterRequest {
  name: string
  roleType?: string
  role_type?: string
  description?: string
  personality?: Record<string, unknown>
  appearance?: string
  backstory?: string
  arcDescription?: string
  dialogueStyle?: string
}

export interface SendMessageRequest {
  content: string
  agent_type?: AgentType
  agentType?: AgentType
  targetAgents?: string[]
  context?: Record<string, unknown>
}

export interface CharacterRelationship {
  target_character_id: string
  target_character_name: string
  type: string
  description: string
}

export interface CharacterProfile {
  id: string
  character_id: string
  relationships: CharacterRelationship[]
  goals: string[]
  fears: string[]
  secrets: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}
