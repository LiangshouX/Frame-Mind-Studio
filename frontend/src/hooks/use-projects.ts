'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Project, CreateProjectRequest } from '@/types'
import { fetchProjects, fetchProject, createProject, updateProject, deleteProject } from '@/lib/api'

interface UseProjectsReturn {
  projects: Project[]
  isLoading: boolean
  error: string | null
  loadProjects: () => Promise<void>
  addProject: (data: CreateProjectRequest) => Promise<Project>
  editProject: (id: string, data: Partial<Project>) => Promise<Project>
  removeProject: (id: string) => Promise<void>
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const addProject = useCallback(async (data: CreateProjectRequest): Promise<Project> => {
    setError(null)
    try {
      const newProject = await createProject(data)
      setProjects((prev) => [newProject, ...prev])
      return newProject
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建项目失败'
      setError(message)
      throw new Error(message)
    }
  }, [])

  const editProject = useCallback(async (id: string, data: Partial<Project>): Promise<Project> => {
    setError(null)
    try {
      const updated = await updateProject(id, data)
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新项目失败'
      setError(message)
      throw new Error(message)
    }
  }, [])

  const removeProject = useCallback(async (id: string): Promise<void> => {
    setError(null)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除项目失败'
      setError(message)
      throw new Error(message)
    }
  }, [])

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    addProject,
    editProject,
    removeProject,
  }
}

interface UseProjectReturn {
  project: Project | null
  isLoading: boolean
  error: string | null
  loadProject: () => Promise<void>
}

export function useProject(id: string): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchProject(id)
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目失败')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  return { project, isLoading, error, loadProject }
}
