import { apiFetch } from './client'
import type { ScriptContent, QualityMetrics } from '@/types/script'

// --- Script ---

export async function getScript(projectId: string) {
  return apiFetch(`/projects/${projectId}/script`)
}

export async function updateScript(projectId: string, content: ScriptContent, changeSummary?: string) {
  return apiFetch(`/projects/${projectId}/script`, {
    method: 'PATCH',
    body: JSON.stringify({ content, change_summary: changeSummary }),
  })
}

// --- Agent ---

export async function generateOutline(projectId: string, input: string, stylePreset?: string, targetEpisodes = 20) {
  return apiFetch<{ session_id: string; websocket_url: string }>('/agent/generate-outline', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      input_type: 'one_sentence',
      input_content: input,
      style_preset: stylePreset,
      target_episodes: targetEpisodes,
    }),
  })
}

export async function refineScript(projectId: string, inputContent: string) {
  return apiFetch<{ session_id: string }>('/agent/refine-script', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, input_content: inputContent }),
  })
}

export async function importFile(projectId: string, file: File) {
  const form = new FormData()
  form.append('project_id', projectId)
  form.append('file', file)
  return apiFetch<{ session_id: string; result: unknown }>('/agent/import-file', {
    method: 'POST',
    body: form,
    headers: {},
  })
}

export async function importUrl(projectId: string, url: string) {
  return apiFetch<{ session_id: string; result: unknown }>('/agent/import-url', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, url }),
  })
}

// --- Characters ---

export async function listCharacters(projectId: string) {
  return apiFetch<{ items: unknown[]; total: number }>(`/projects/${projectId}/characters`)
}

// --- Foreshadows ---

export async function listForeshadows(projectId: string, resolved?: boolean) {
  const qs = resolved !== undefined ? `?resolved=${resolved}` : ''
  return apiFetch<{ items: unknown[]; total: number }>(`/projects/${projectId}/foreshadows${qs}`)
}

// --- Quality ---

export async function getQualityMetrics(projectId: string): Promise<QualityMetrics> {
  return apiFetch(`/projects/${projectId}/script/quality`)
}

// --- Versions ---

export async function listVersions(projectId: string) {
  return apiFetch<{ items: unknown[]; total: number }>(`/projects/${projectId}/script/versions`)
}

export async function getVersion(projectId: string, versionId: string) {
  return apiFetch(`/projects/${projectId}/script/versions/${versionId}`)
}

export async function restoreVersion(projectId: string, versionId: string) {
  return apiFetch(`/projects/${projectId}/script/versions/${versionId}/restore`, { method: 'POST' })
}

// --- AI Optimize ---

export async function optimizeSegment(
  projectId: string,
  text: string,
  elementType: string = 'dialogue',
  context: string = '',
) {
  const form = new FormData()
  form.append('project_id', projectId)
  form.append('text', text)
  form.append('element_type', elementType)
  form.append('context', context)
  return apiFetch<{ alternatives: Array<{ text: string; style: string; reason: string }> }>(
    '/agent/optimize-segment',
    { method: 'POST', body: form, headers: {} }
  )
}
