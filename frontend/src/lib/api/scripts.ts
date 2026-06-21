import { apiFetch } from './client'
import { Script, ScriptContent, TraditionalScriptContent } from '@/types/script'

export async function getScript(projectId: string): Promise<Script> {
  return apiFetch<Script>(`/projects/${projectId}/script`)
}

export async function updateScript(
  projectId: string,
  content: ScriptContent | TraditionalScriptContent,
  _changeSummary?: string
): Promise<Script> {
  return apiFetch<Script>(`/projects/${projectId}/script`, {
    method: 'PUT',
    body: JSON.stringify(content),
  })
}
