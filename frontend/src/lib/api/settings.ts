import { apiFetch } from './client'

export async function listApiKeys() {
  return apiFetch<{ items: { provider: string; key_preview: string; configured: boolean }[] }>('/settings/api-keys')
}

export async function updateApiKey(provider: string, apiKey: string) {
  return apiFetch('/settings/api-keys', {
    method: 'PUT',
    body: JSON.stringify({ provider, api_key: apiKey }),
  })
}

export async function listModels() {
  return apiFetch<{ items: { id: string; provider: string; name: string; use_case: string; configured: boolean }[] }>('/settings/models')
}
