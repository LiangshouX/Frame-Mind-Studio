import { apiFetch } from './client'
import type {
  ProviderInfo,
  ProviderConfig,
  ProviderConfigRequest,
  ConnectivityTestResult,
  ToolConfig,
  ToolConfigRequest,
  McpServerConfig,
  McpServerConfigRequest,
  DefaultModel,
  DefaultModelRequest,
} from '@/types/settings'

// --- Legacy types (kept for backward compat) ---

interface ApiKeyConfig {
  provider: string
  key_preview: string
  configured: boolean
}

interface ModelConfig {
  id: string
  provider: string
  name: string
  use_case: string
  configured: boolean
}

// --- Legacy API (backward compat) ---

export async function listApiKeys(): Promise<{ items: ApiKeyConfig[] }> {
  return apiFetch('/settings/api-keys')
}

export async function updateApiKey(provider: string, apiKey: string): Promise<ApiKeyConfig> {
  return apiFetch('/settings/api-keys', {
    method: 'PUT',
    body: JSON.stringify({ provider, api_key: apiKey }),
  })
}

export async function listModels(): Promise<{ items: ModelConfig[] }> {
  return apiFetch('/settings/models')
}

// --- Provider API ---

export async function listProviders(): Promise<ProviderInfo[]> {
  return apiFetch('/settings/providers')
}

export async function getProvider(providerId: string): Promise<ProviderConfig> {
  return apiFetch(`/settings/providers/${providerId}`)
}

export async function updateProvider(
  providerId: string,
  config: ProviderConfigRequest
): Promise<ProviderConfig> {
  return apiFetch(`/settings/providers/${providerId}`, {
    method: 'PUT',
    body: JSON.stringify({
      api_key: config.apiKey,
      base_url: config.baseUrl,
      models: config.models,
      default_model: config.defaultModel,
    }),
  })
}

export async function deleteProvider(providerId: string): Promise<void> {
  return apiFetch(`/settings/providers/${providerId}`, {
    method: 'DELETE',
  })
}

export async function testProvider(providerId: string): Promise<ConnectivityTestResult> {
  return apiFetch(`/settings/providers/${providerId}/test`, {
    method: 'POST',
  })
}

// --- Tool API ---

export async function listTools(): Promise<ToolConfig[]> {
  return apiFetch('/settings/tools')
}

export async function updateTool(
  toolId: string,
  config: ToolConfigRequest
): Promise<ToolConfig> {
  return apiFetch(`/settings/tools/${toolId}`, {
    method: 'PUT',
    body: JSON.stringify({
      api_key: config.apiKey,
      parameters: config.parameters,
    }),
  })
}

export async function deleteTool(toolId: string): Promise<void> {
  return apiFetch(`/settings/tools/${toolId}`, {
    method: 'DELETE',
  })
}

export async function testTool(toolId: string): Promise<ConnectivityTestResult> {
  return apiFetch(`/settings/tools/${toolId}/test`, {
    method: 'POST',
  })
}

// --- MCP Server API ---

export async function listMcpServers(): Promise<McpServerConfig[]> {
  return apiFetch('/settings/mcp-servers')
}

export async function updateMcpServer(
  serverId: string,
  config: McpServerConfigRequest
): Promise<McpServerConfig> {
  return apiFetch(`/settings/mcp-servers/${serverId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: config.name,
      url: config.url,
      auth_type: config.authType,
      credentials: config.credentials,
    }),
  })
}

export async function deleteMcpServer(serverId: string): Promise<void> {
  return apiFetch(`/settings/mcp-servers/${serverId}`, {
    method: 'DELETE',
  })
}

export async function testMcpServer(serverId: string): Promise<ConnectivityTestResult> {
  return apiFetch(`/settings/mcp-servers/${serverId}/test`, {
    method: 'POST',
  })
}

// --- Default Model API ---

export async function getDefaultModel(): Promise<DefaultModel> {
  return apiFetch('/settings/default-model')
}

export async function updateDefaultModel(config: DefaultModelRequest): Promise<void> {
  return apiFetch('/settings/default-model', {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}
