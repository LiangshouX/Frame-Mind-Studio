import { apiFetch } from './client'
import { Project, ProjectDetail, ProjectCreateRequest } from '@/types/project'
import { PaginatedResponse } from '@/types/api'

export async function createProject(request: ProjectCreateRequest): Promise<Project> {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function listProjects(): Promise<PaginatedResponse<Project>> {
  return apiFetch<PaginatedResponse<Project>>('/projects')
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  return apiFetch<ProjectDetail>(`/projects/${projectId}`)
}

export async function deleteProject(projectId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}`, { method: 'DELETE' })
}
