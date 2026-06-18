import { apiFetch } from './client'
import { ScriptVersion } from '@/types/version'
import { Script } from '@/types/script'
import { PaginatedResponse } from '@/types/api'

export async function listVersions(
  projectId: string,
  limit = 20,
  offset = 0
): Promise<PaginatedResponse<ScriptVersion>> {
  return apiFetch<PaginatedResponse<ScriptVersion>>(
    `/projects/${projectId}/script/versions?limit=${limit}&offset=${offset}`
  )
}

export async function getVersion(projectId: string, versionId: string): Promise<ScriptVersion> {
  return apiFetch<ScriptVersion>(`/projects/${projectId}/script/versions/${versionId}`)
}

export async function restoreVersion(projectId: string, versionId: string): Promise<Script> {
  return apiFetch<Script>(`/projects/${projectId}/script/versions/${versionId}/restore`, {
    method: 'POST',
  })
}

export async function compareVersions(
  projectId: string,
  fromVersion: number,
  toVersion: number
): Promise<{ from_version: number; to_version: number; diff: unknown }> {
  return apiFetch(
    `/projects/${projectId}/script/versions/compare?from_version=${fromVersion}&to_version=${toVersion}`
  )
}
