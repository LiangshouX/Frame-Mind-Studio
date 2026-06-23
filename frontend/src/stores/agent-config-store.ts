import { create } from 'zustand'
import type { AgentConfig } from '@/types/agent'
import {
  getAgentConfig,
  saveAgentConfig,
  deleteAgentConfig,
} from '@/lib/api/agent-api'

interface AgentConfigStore {
  /** 按 agentName 存储的配置 */
  configs: Record<string, AgentConfig>
  /** 加载状态 */
  isLoading: boolean
  /** 是否有未保存的修改 */
  isDirty: boolean
  /** 本地修改的配置 */
  localConfig: Partial<AgentConfig> | null

  fetchConfig: (projectId: string, agentName: string) => Promise<void>
  saveConfig: (projectId: string, agentName: string) => Promise<void>
  deleteConfig: (projectId: string, agentName: string) => Promise<void>
  updateLocalConfig: (partial: Partial<AgentConfig>) => void
  resetLocal: () => void
}

export const useAgentConfigStore = create<AgentConfigStore>((set, get) => ({
  configs: {},
  isLoading: false,
  isDirty: false,
  localConfig: null,

  fetchConfig: async (projectId, agentName) => {
    set({ isLoading: true })
    try {
      const config = await getAgentConfig(projectId, agentName)
      set((state) => ({
        configs: { ...state.configs, [agentName]: config },
        localConfig: config,
        isDirty: false,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to fetch agent config:', error)
      set({ isLoading: false })
    }
  },

  saveConfig: async (projectId, agentName) => {
    const { localConfig } = get()
    if (!localConfig) return

    set({ isLoading: true })
    try {
      await saveAgentConfig(projectId, agentName, {
        system_prompt: localConfig.system_prompt || '',
        skills: localConfig.skills || [],
        rules: localConfig.rules || [],
        model_override: localConfig.model_override || undefined,
      })

      // 重新获取最新配置
      const config = await getAgentConfig(projectId, agentName)
      set((state) => ({
        configs: { ...state.configs, [agentName]: config },
        localConfig: config,
        isDirty: false,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to save agent config:', error)
      set({ isLoading: false })
      throw error
    }
  },

  deleteConfig: async (projectId, agentName) => {
    set({ isLoading: true })
    try {
      await deleteAgentConfig(projectId, agentName)

      // 重新获取（此时应为全局默认）
      const config = await getAgentConfig(projectId, agentName)
      set((state) => ({
        configs: { ...state.configs, [agentName]: config },
        localConfig: config,
        isDirty: false,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to delete agent config:', error)
      set({ isLoading: false })
      throw error
    }
  },

  updateLocalConfig: (partial) => {
    set((state) => ({
      localConfig: { ...state.localConfig, ...partial } as AgentConfig,
      isDirty: true,
    }))
  },

  resetLocal: () => {
    const { configs } = get()
    const agentName = Object.keys(configs)[0]
    if (agentName) {
      set({ localConfig: configs[agentName], isDirty: false })
    }
  },
}))
