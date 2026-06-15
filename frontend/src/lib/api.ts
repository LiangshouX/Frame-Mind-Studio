import type {
  Project,
  Character,
  Script,
  AgentSession,
  AgentMessage,
  CreateProjectRequest,
  CreateCharacterRequest,
  MemorySearchResult,
  StoryOutline,
} from '@/types'
import { mockProjects, mockCharacters, mockScript, mockOutline, mockAgentMessages } from './mock-data'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_ENGINE_URL || 'http://localhost:8001'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  return data.data || data
}

// Named exports for compatibility
export const fetchProjects = () => api.fetchProjects()
export const fetchProject = (id: string) => api.fetchProject(id)
export const createProject = (data: CreateProjectRequest) => api.createProject(data)
export const updateProject = (id: string, data: Partial<Project>) => api.updateProject(id, data)
export const deleteProject = (id: string) => api.deleteProject(id)
export const fetchCharacters = (projectId: string) => api.fetchCharacters(projectId)
export const createCharacter = (projectId: string, data: CreateCharacterRequest) => api.createCharacter(projectId, data)
export const fetchScript = (projectId: string) => api.fetchScript(projectId)
export const fetchOutline = (projectId: string) => api.fetchOutline(projectId)
export const createAgentSession = (projectId: string) => api.createAgentSession(projectId)
export const sendAgentMessage = (sessionId: string, content: string) => api.sendAgentMessage(sessionId, content)
export const fetchAgentMessages = (sessionId: string) => api.fetchAgentMessages(sessionId)
export const searchMemory = (projectId: string, query: string) => api.searchMemory(projectId, query)

export const api = {
  // ---------- Projects ----------
  async fetchProjects(): Promise<Project[]> {
    try {
      return await request<Project[]>(`${API_BASE}/api/v1/projects`)
    } catch {
      console.warn('Using mock projects')
      return mockProjects
    }
  },

  async fetchProject(id: string): Promise<Project> {
    try {
      return await request<Project>(`${API_BASE}/api/v1/projects/${id}`)
    } catch {
      console.warn('Using mock project')
      const p = mockProjects.find(p => p.id === id)
      if (!p) throw new Error('Project not found')
      return p
    }
  },

  async createProject(data: CreateProjectRequest): Promise<Project> {
    try {
      return await request<Project>(`${API_BASE}/api/v1/projects`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch {
      console.warn('Mock create project')
      return {
        id: `proj_${Date.now()}`,
        ...data,
        genre: data.genre || [],
        status: 'draft',
        targetEpisodes: data.targetEpisodes || 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    try {
      return await request<Project>(`${API_BASE}/api/v1/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch {
      const p = mockProjects.find(p => p.id === id)
      if (!p) throw new Error('Project not found')
      return { ...p, ...data, updatedAt: new Date().toISOString() }
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      await request(`${API_BASE}/api/v1/projects/${id}`, { method: 'DELETE' })
    } catch {
      console.warn('Mock delete project')
    }
  },

  // ---------- Characters ----------
  async fetchCharacters(projectId: string): Promise<Character[]> {
    try {
      return await request<Character[]>(`${API_BASE}/api/v1/projects/${projectId}/characters`)
    } catch {
      console.warn('Using mock characters')
      return mockCharacters.filter(c => c.project_id === projectId || c.projectId === projectId)
    }
  },

  async createCharacter(projectId: string, data: CreateCharacterRequest): Promise<Character> {
    try {
      return await request<Character>(`${API_BASE}/api/v1/projects/${projectId}/characters`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch {
      return {
        id: `char_${Date.now()}`,
        project_id: projectId,
        ...data,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  },

  // ---------- Script ----------
  async fetchScript(projectId: string): Promise<Script> {
    try {
      return await request<Script>(`${API_BASE}/api/v1/projects/${projectId}/script`)
    } catch {
      return mockScript
    }
  },

  // ---------- Agent ----------
  async createAgentSession(projectId: string): Promise<AgentSession> {
    try {
      return await request<AgentSession>(`${AGENT_BASE}/api/v1/agent/sessions`, {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId }),
      })
    } catch {
      return {
        id: `session_${Date.now()}`,
        project_id: projectId,
        status: 'active',
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
    }
  },

  async sendAgentMessage(sessionId: string, content: string): Promise<{ content: string; agent: string; structured_data?: unknown }> {
    try {
      return await request(`${AGENT_BASE}/api/v1/agent/sessions/${sessionId}/message`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
    } catch {
      return {
        content: '这是一条模拟的 Agent 回复。请确保 Agent 引擎已启动。',
        agent: 'showrunner',
      }
    }
  },

  async fetchAgentMessages(sessionId: string): Promise<AgentMessage[]> {
    try {
      return await request<AgentMessage[]>(`${AGENT_BASE}/api/v1/agent/sessions/${sessionId}`)
    } catch {
      return mockAgentMessages
    }
  },

  // ---------- Memory ----------
  async searchMemory(projectId: string, query: string): Promise<MemorySearchResult[]> {
    try {
      return await request<MemorySearchResult[]>(
        `${AGENT_BASE}/api/v1/projects/${projectId}/memory/search?query=${encodeURIComponent(query)}`
      )
    } catch {
      return []
    }
  },

  // ---------- Outline ----------
  async fetchOutline(projectId: string): Promise<StoryOutline> {
    try {
      return await request<StoryOutline>(`${API_BASE}/api/v1/projects/${projectId}/outline`)
    } catch {
      return mockOutline
    }
  },
}
