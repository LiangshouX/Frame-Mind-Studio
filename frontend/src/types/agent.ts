export type AgentStage = 'showrunner' | 'world_builder' | 'character_designer' | 'script_doctor' | 'human_review'

export type WsMessageType = 'stage_update' | 'stream_chunk' | 'hitl_prompt' | 'complete' | 'error' | 'budget_warning'

export interface WsMessage {
  type: WsMessageType
  data: Record<string, unknown>
}
