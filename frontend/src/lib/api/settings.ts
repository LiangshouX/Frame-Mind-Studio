import { apiFetch } from './client'

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
