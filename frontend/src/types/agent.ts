/** Agent 消息类型 */
export type MessageType = 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'skill'

/** 可折叠块类型 */
export type CollapsibleBlockType = 'thinking' | 'tool_call' | 'skill'

/** 可折叠块状态 */
export type CollapsibleBlockStatus = 'start' | 'delta' | 'end'

/** 工作流步骤 */
export type WorkflowStep = 'worldview' | 'synopsis' | 'characters' | 'outline' | 'script'

/** Agent 名称 */
export type AgentName = 'creative_agent' | 'synopsis_agent' | 'character_agent' | 'outline_agent' | 'script_agent'

/** 可折叠块 */
export interface CollapsibleBlock {
  id: string
  type: CollapsibleBlockType
  toolName?: string
  content: string
  isCollapsed: boolean
  status: CollapsibleBlockStatus
}

/** Agent 配置 */
export interface AgentConfig {
  agent_name: string
  system_prompt: string
  skills: string[]
  rules: string[]
  model_override: string | null
  is_project_override: boolean
  version: number
}

/** 模型选择（供应商 + 模型） */
export interface ModelSelection {
  providerId: string
  modelName: string
}

/** Agent 会话 */
export interface AgentSession {
  id: string
  project_id: string
  workflow_step: WorkflowStep
  agent_name: AgentName
  status: 'pending' | 'running' | 'completed' | 'failed'
  messages: AgentMessageResponse[]
  created_at: string
  updated_at: string
}

/** Agent 消息响应 */
export interface AgentMessageResponse {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  message_type: MessageType
  metadata: Record<string, unknown> | null
  message_order: number
  created_at: string
}

// ─── WebSocket 消息类型 ──────────────────────────────────────────

/** 流式文本块 */
export interface StreamChunkMessage {
  type: 'stream_chunk'
  data: {
    agent_name: string
    content: string
    delta: boolean
  }
}

/** 思考块 */
export interface ThinkingBlockMessage {
  type: 'thinking_block'
  data: {
    agent_name: string
    block_id: string
    status: CollapsibleBlockStatus
    content: string
  }
}

/** 工具调用 */
export interface ToolCallMessage {
  type: 'tool_call'
  data: {
    agent_name: string
    block_id: string
    status: CollapsibleBlockStatus
    tool_name: string
    tool_input?: Record<string, unknown>
    tool_result?: string
  }
}

/** 工具结果 */
export interface ToolResultMessage {
  type: 'tool_result'
  data: {
    agent_name: string
    block_id: string
    tool_name: string
    output: string
    status: CollapsibleBlockStatus
  }
}

/** 完成消息 */
export interface CompleteMessage {
  type: 'complete'
  data: {
    session_id: string
    tokens_consumed: number
    result?: Record<string, unknown>
  }
}

/** 错误消息 */
export interface WsErrorMessage {
  type: 'error'
  data: {
    session_id: string
    error_code: string
    message: string
  }
}

/** 预算警告 */
export interface BudgetWarningMessage {
  type: 'budget_warning'
  data: {
    tokens_used: number
    token_limit: number
    threshold: number
    message: string
  }
}

/** 冲突检测 */
export interface ConflictDetectedMessage {
  type: 'conflict_detected'
  data: {
    entity_type: string
    entity_id: string
    current_version: number
    expected_version: number
    message: string
  }
}

/** HITL 审核提示 */
export interface HitlPromptMessage {
  type: 'hitl_prompt'
  data: {
    content: string
    options: string[]
  }
}

/** 所有 WebSocket 消息类型的联合 */
export type AgentWebSocketMessage =
  | StreamChunkMessage
  | ThinkingBlockMessage
  | ToolCallMessage
  | ToolResultMessage
  | CompleteMessage
  | WsErrorMessage
  | BudgetWarningMessage
  | ConflictDetectedMessage
  | HitlPromptMessage

/** WebSocket 连接状态 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
