/** 工作流步骤 */
export type WorkflowStep = 'worldview' | 'synopsis' | 'characters' | 'outline' | 'script'

/** Agent 名称 */
export type AgentName = 'creative_agent' | 'synopsis_agent' | 'character_agent' | 'outline_agent' | 'script_agent'

/** 消息类型 */
export type MessageType = 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'skill'

/** 会话状态 */
export type SessionStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AgentSession {
  id: string
  workflowStep: WorkflowStep
  agentName: AgentName
  status: SessionStatus
  tokensConsumed: number
  startedAt?: string
  completedAt?: string
  outputData?: unknown
}

// WebSocket 消息类型
export type WsMessageType =
  | 'stream_chunk'
  | 'thinking_block'
  | 'tool_call'
  | 'tool_result'
  | 'complete'
  | 'error'
  | 'budget_warning'
  | 'conflict_detected'

export interface WsMessage {
  type: WsMessageType
  data: Record<string, unknown>
}

export interface StreamChunkData {
  agent_name: string
  content: string
  delta: boolean
}

export interface ThinkingBlockData {
  agent_name: string
  block_id: string
  status: 'start' | 'delta' | 'end'
  content: string
}

export interface ToolCallData {
  agent_name: string
  block_id: string
  status: 'start' | 'delta' | 'end'
  tool_name: string
  tool_input?: Record<string, unknown>
  tool_result?: string
}

export interface ToolResultData {
  agent_name: string
  block_id: string
  tool_name: string
  output: string
}
