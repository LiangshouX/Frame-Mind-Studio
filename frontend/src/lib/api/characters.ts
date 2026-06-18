import { apiFetch } from './client'
import { Character } from '@/types/character'
import { PaginatedResponse } from '@/types/api'

export async function listCharacters(projectId: string): Promise<PaginatedResponse<Character>> {
  return apiFetch<PaginatedResponse<Character>>(`/projects/${projectId}/characters`)
}

export async function updateCharacter(
  projectId: string,
  characterId: string,
  data: Partial<Character>
): Promise<Character> {
  return apiFetch<Character>(`/projects/${projectId}/characters/${characterId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
