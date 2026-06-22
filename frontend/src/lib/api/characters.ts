import { apiFetch } from './client'
import { Character } from '@/types/character'
import { PaginatedResponse } from '@/types/api'

export async function listCharacters(projectId: string): Promise<PaginatedResponse<Character>> {
  return apiFetch<PaginatedResponse<Character>>(`/projects/${projectId}/characters`)
}

export async function createCharacter(
  projectId: string,
  data: {
    name: string
    gender?: string
    role?: string
    identity?: string
    persona?: string
    description?: string
    personality?: string[]
    appearance?: string
    background?: string
    goals?: string
    relationships?: unknown[]
    dialogue_style?: string
    arc?: string
    overview?: string
  }
): Promise<Character> {
  return apiFetch<Character>(`/projects/${projectId}/characters`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
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

export async function deleteCharacter(
  projectId: string,
  characterId: string
): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/characters/${characterId}`, {
    method: 'DELETE',
  })
}
