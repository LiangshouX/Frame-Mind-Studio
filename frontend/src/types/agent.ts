export interface AgentSession {
  id: string
  project_id: string
  session_type: 'outline_generate' | 'script_refine' | 'import' | 'optimize'
  status: 'pending' | 'running' | 'completed' | 'failed'
  input_data: Record<string, unknown>
  output_data: Record<string, unknown> | null
  tokens_consumed: number
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface AgentMessage {
  id: string
  session_id: string
  agent_name: 'showrunner' | 'world_builder' | 'character_designer' | 'script_doctor'
  role: 'agent' | 'user' | 'system'
  content: string
  message_order: number
  created_at: string
}

export type AgentStage =
  | 'showrunner'
  | 'world_builder'
  | 'character_designer'
  | 'script_doctor'
  | 'human_review'

export interface StageUpdateMessage {
  type: 'stage_update'
  data: {
    stage: string
    stage_label: string
    status: 'started' | 'completed'
  }
}

export interface StreamChunkMessage {
  type: 'stream_chunk'
  data: {
    stage: string
    content: string
  }
}

export interface HitlPromptMessage {
  type: 'hitl_prompt'
  data: {
    stage: string
    stage_label: string
    content: string
    options: string[]
  }
}

export interface CompleteMessage {
  type: 'complete'
  data: {
    session_id: string
    result: Record<string, unknown>
    tokens_consumed: number
  }
}

export interface WsErrorMessage {
  type: 'error'
  data: {
    session_id: string
    error_code: string
    message: string
  }
}

export interface BudgetWarningMessage {
  type: 'budget_warning'
  data: {
    tokens_used: number
    token_limit: number
    threshold: number
    message: string
  }
}

export type AgentWebSocketMessage =
  | StageUpdateMessage
  | StreamChunkMessage
  | HitlPromptMessage
  | CompleteMessage
  | WsErrorMessage
  | BudgetWarningMessage

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
