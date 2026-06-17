import { apiFetch } from './client'
import type { Project } from '@/types/project'

export async function listProjects(): Promise<{ items: Project[]; total: number }> {
  return apiFetch('/projects')
}

export async function getProject(id: string): Promise<Project> {
  return apiFetch(`/projects/${id}`)
}

export async function createProject(data: {
  title: string
  genre: string[]
  format?: string
  description?: string
}): Promise<Project> {
  return apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteProject(id: string): Promise<void> {
  return apiFetch(`/projects/${id}`, { method: 'DELETE' })
}
