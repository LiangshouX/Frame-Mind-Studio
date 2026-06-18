import { apiFetch } from './client'
import { Foreshadow } from '@/types/foreshadow'
import { PaginatedResponse } from '@/types/api'

export async function listForeshadows(
  projectId: string,
  status?: 'planted' | 'resolved'
): Promise<PaginatedResponse<Foreshadow>> {
  const query = status ? `?status=${status}` : ''
  return apiFetch<PaginatedResponse<Foreshadow>>(`/projects/${projectId}/foreshadows${query}`)
}

export async function updateForeshadow(
  projectId: string,
  foreshadowId: string,
  data: Partial<Foreshadow>
): Promise<Foreshadow> {
  return apiFetch<Foreshadow>(`/projects/${projectId}/foreshadows/${foreshadowId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
