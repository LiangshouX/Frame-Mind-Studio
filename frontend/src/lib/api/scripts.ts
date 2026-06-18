import { apiFetch } from './client'
import { Script, ScriptContent } from '@/types/script'

export async function getScript(projectId: string): Promise<Script> {
  return apiFetch<Script>(`/projects/${projectId}/script`)
}

export async function updateScript(
  projectId: string,
  content: ScriptContent,
  changeSummary?: string
): Promise<Script> {
  return apiFetch<Script>(`/projects/${projectId}/script`, {
    method: 'PATCH',
    body: JSON.stringify({ content, change_summary: changeSummary }),
  })
}
