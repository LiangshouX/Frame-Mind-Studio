/** Model provider type identifiers */
export type ProviderType = 'OPENAI_COMPATIBLE' | 'DASHSCOPE' | 'ANTHROPIC' | 'GEMINI' | 'OLLAMA'

/** Connectivity test result status */
export type TestResultStatus = 'SUCCESS' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN_ERROR' | 'UNTESTED'

/** MCP server authentication types */
export type McpAuthType = 'NONE' | 'BEARER' | 'BASIC' | 'API_KEY'

/**
 * Model provider catalog entry — matches backend ProviderConfigResponse JSON.
 * Backend uses SNAKE_CASE Jackson naming strategy, so all keys are snake_case.
 */
export interface ProviderInfo {
  id: string
  name: string
  configured: boolean
  api_key_preview: string
  base_url: string
  models: string[]
  default_model: string | null
  last_tested: string | null
  last_test_result: TestResultStatus
  last_test_message: string
}

/** Provider configuration detail (same shape as ProviderInfo for now) */
export type ProviderConfig = ProviderInfo

/** Request to save/update provider configuration (frontend camelCase → API converts to snake_case) */
export interface ProviderConfigRequest {
  apiKey: string
  baseUrl?: string
  models?: string[]
  defaultModel?: string
}

/** Connectivity test result — matches backend JSON (snake_case) */
export interface ConnectivityTestResult {
  provider_id?: string
  tool_id?: string
  server_id?: string
  result: TestResultStatus
  message: string
  tested_at: string
}

/** Tool configuration (Tavily, etc.) — matches backend ToolConfigResponse JSON */
export interface ToolConfig {
  tool_id: string
  name: string
  configured: boolean
  api_key_preview: string
  last_tested: string | null
  last_test_result: TestResultStatus
  last_test_message: string
}

/** Request to save/update tool configuration */
export interface ToolConfigRequest {
  apiKey: string
  parameters?: Record<string, string>
}

/** MCP server configuration — matches backend JSON */
export interface McpServerConfig {
  server_id: string
  name: string
  url: string
  auth_type: McpAuthType
  configured: boolean
  last_tested: string | null
  last_test_result: TestResultStatus
  last_test_message: string
}

/** Request to save/update MCP server configuration */
export interface McpServerConfigRequest {
  name: string
  url: string
  authType: McpAuthType
  credentials: string
}

/** Default model reference — matches backend JSON */
export interface DefaultModel {
  provider: string | null
  model: string | null
  display_name: string | null
}

/** Request to set default model */
export interface DefaultModelRequest {
  provider: string
  model: string
}

/** 模型信息 */
export interface ModelInfo {
  model_id: string
  display_name: string
}

/** 供应商及其可用模型 */
export interface ProviderWithModels {
  provider_id: string
  provider_name: string
  type: ProviderType
  available: boolean
  models: ModelInfo[]
}
