import { create } from 'zustand'
import { Project, ProjectDetail } from '@/types/project'
import * as projectsApi from '@/lib/api/projects'

interface ProjectStore {
  projects: Project[]
  currentProject: ProjectDetail | null
  isLoading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (params: { title: string; genre: string[]; format: string; description?: string }) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  clearCurrent: () => void
  updateCurrentScript: (script: ProjectDetail['script']) => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const { items } = await projectsApi.listProjects()
      set({ projects: items, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const project = await projectsApi.getProject(id)
      set({ currentProject: project, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  createProject: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const project = await projectsApi.createProject(params as never)
      set({ projects: [project, ...get().projects], isLoading: false })
      return project
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
      throw err
    }
  },

  deleteProject: async (id: string) => {
    try {
      await projectsApi.deleteProject(id)
      set({ projects: get().projects.filter(p => p.id !== id) })
    } catch (err) {
      set({ error: (err as Error).message })
      throw err
    }
  },

  clearCurrent: () => set({ currentProject: null }),

  updateCurrentScript: (script) => {
    const current = get().currentProject
    if (!current) return
    set({ currentProject: { ...current, script } })
  },
}))
