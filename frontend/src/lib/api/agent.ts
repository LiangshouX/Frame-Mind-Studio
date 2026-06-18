import { apiFetch, apiUpload } from './client'
import { AgentSession } from '@/types/agent'

interface AgentTaskResponse {
  session_id: string
  status: string
  websocket_url: string
}

export async function generateOutline(request: {
  project_id: string
  input_type: 'one_sentence' | 'outline_text' | 'paste'
  input_content: string
  style_preset?: string
  target_episodes?: number
}): Promise<AgentTaskResponse> {
  return apiFetch<AgentTaskResponse>('/agent/generate-outline', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function refineScript(request: {
  project_id: string
  input_type: 'outline'
  input_content: string
}): Promise<AgentTaskResponse> {
  return apiFetch<AgentTaskResponse>('/agent/refine-script', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function importFile(projectId: string, file: File): Promise<AgentTaskResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('project_id', projectId)
  return apiUpload<AgentTaskResponse>('/agent/import-file', formData)
}

export async function importUrl(request: {
  project_id: string
  url: string
}): Promise<AgentTaskResponse> {
  return apiFetch<AgentTaskResponse>('/agent/import-url', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function optimizeSegment(request: {
  project_id: string
  text: string
  element_type: string
  context?: string
}): Promise<{ alternatives: Array<{ text: string; style: string; reason: string }> }> {
  return apiFetch('/agent/optimize-segment', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function getAgentSession(sessionId: string): Promise<AgentSession> {
  return apiFetch<AgentSession>(`/agent/sessions/${sessionId}`)
}

export async function submitReview(
  sessionId: string,
  action: 'approve' | 'revise',
  feedback?: string
): Promise<{ session_id: string; status: string; message: string }> {
  return apiFetch(`/agent/sessions/${sessionId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, feedback }),
  })
}
