export type AgentStage = 'showrunner' | 'world_builder' | 'character_designer' | 'script_doctor' | 'human_review'
export type SessionType = 'outline_generate' | 'script_refine' | 'import_file' | 'import_url' | 'optimize_segment'
export type SessionStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AgentSession {
  id: string
  sessionType: SessionType
  status: SessionStatus
  tokensConsumed: number
  startedAt?: string
  completedAt?: string
  outputData?: unknown
}

// WebSocket message types
export type WsMessageType = 'stage_update' | 'stream_chunk' | 'hitl_prompt' | 'complete' | 'error' | 'budget_warning'

export interface WsMessage {
  type: WsMessageType
  data: Record<string, unknown>
}

export interface StageUpdateData {
  stage: AgentStage
  stageLabel: string
  status: 'started' | 'completed'
}

export interface StreamChunkData {
  stage: AgentStage
  content: string
}

export interface HitlPromptData {
  stage: 'human_review'
  stageLabel: string
  content: string
  options: string[]
}
