import { create } from 'zustand'
import * as settingsApi from '@/lib/api/settings'
import type {
  ProviderInfo,
  ProviderConfig,
  ProviderConfigRequest,
  ConnectivityTestResult,
  ToolConfig,
  ToolConfigRequest,
  McpServerConfig,
  McpServerConfigRequest,
  DefaultModel,
  DefaultModelRequest,
} from '@/types/settings'

interface SettingsStore {
  // Legacy (kept for backward compat)
  apiKeys: { provider: string; key_preview: string; configured: boolean }[]
  models: { id: string; provider: string; name: string; use_case: string; configured: boolean }[]

  // New state
  providers: ProviderInfo[]
  providerConfig: ProviderConfig | null
  tools: ToolConfig[]
  mcpServers: McpServerConfig[]
  defaultModel: DefaultModel | null
  isLoading: boolean
  testResult: ConnectivityTestResult | null

  // Legacy actions
  fetchApiKeys: () => Promise<void>
  fetchModels: () => Promise<void>
  addApiKey: (provider: string, apiKey: string) => Promise<void>

  // Provider actions
  fetchProviders: () => Promise<void>
  fetchProviderConfig: (providerId: string) => Promise<ProviderConfig | null>
  updateProvider: (providerId: string, config: ProviderConfigRequest) => Promise<void>
  deleteProvider: (providerId: string) => Promise<void>
  testProvider: (providerId: string) => Promise<ConnectivityTestResult>

  // Tool actions
  fetchTools: () => Promise<void>
  updateTool: (toolId: string, config: ToolConfigRequest) => Promise<void>
  deleteTool: (toolId: string) => Promise<void>
  testTool: (toolId: string) => Promise<ConnectivityTestResult>

  // MCP Server actions
  fetchMcpServers: () => Promise<void>
  updateMcpServer: (serverId: string, config: McpServerConfigRequest) => Promise<void>
  deleteMcpServer: (serverId: string) => Promise<void>
  testMcpServer: (serverId: string) => Promise<ConnectivityTestResult>

  // Default model actions
  fetchDefaultModel: () => Promise<void>
  updateDefaultModel: (config: DefaultModelRequest) => Promise<void>

  clearTestResult: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  apiKeys: [],
  models: [],
  providers: [],
  providerConfig: null,
  tools: [],
  mcpServers: [],
  defaultModel: null,
  isLoading: false,
  testResult: null,

  // --- Legacy actions ---
  fetchApiKeys: async () => {
    set({ isLoading: true })
    try {
      const res = await settingsApi.listApiKeys()
      set({ apiKeys: Array.isArray(res?.items) ? res.items : [], isLoading: false })
    } catch {
      set({ apiKeys: [], isLoading: false })
    }
  },

  fetchModels: async () => {
    set({ isLoading: true })
    try {
      const res = await settingsApi.listModels()
      set({ models: Array.isArray(res?.items) ? res.items : [], isLoading: false })
    } catch {
      set({ models: [], isLoading: false })
    }
  },

  addApiKey: async (provider, apiKey) => {
    const result = await settingsApi.updateApiKey(provider, apiKey)
    set({ apiKeys: [...get().apiKeys.filter(k => k.provider !== provider), result] })
  },

  // --- Provider actions ---
  fetchProviders: async () => {
    set({ isLoading: true })
    try {
      const providers = await settingsApi.listProviders()
      set({ providers: Array.isArray(providers) ? providers : [], isLoading: false })
    } catch {
      set({ providers: [], isLoading: false })
    }
  },

  fetchProviderConfig: async (providerId) => {
    try {
      const config = await settingsApi.getProvider(providerId)
      set({ providerConfig: config })
      return config
    } catch {
      set({ providerConfig: null })
      return null
    }
  },

  updateProvider: async (providerId, config) => {
    await settingsApi.updateProvider(providerId, config)
    await get().fetchProviders()
  },

  deleteProvider: async (providerId) => {
    await settingsApi.deleteProvider(providerId)
    await get().fetchProviders()
  },

  testProvider: async (providerId) => {
    const result = await settingsApi.testProvider(providerId)
    set({ testResult: result })
    await get().fetchProviders()
    return result
  },

  // --- Tool actions ---
  fetchTools: async () => {
    set({ isLoading: true })
    try {
      const tools = await settingsApi.listTools()
      set({ tools: Array.isArray(tools) ? tools : [], isLoading: false })
    } catch {
      set({ tools: [], isLoading: false })
    }
  },

  updateTool: async (toolId, config) => {
    await settingsApi.updateTool(toolId, config)
    await get().fetchTools()
  },

  deleteTool: async (toolId) => {
    await settingsApi.deleteTool(toolId)
    await get().fetchTools()
  },

  testTool: async (toolId) => {
    const result = await settingsApi.testTool(toolId)
    set({ testResult: result })
    await get().fetchTools()
    return result
  },

  // --- MCP Server actions ---
  fetchMcpServers: async () => {
    set({ isLoading: true })
    try {
      const servers = await settingsApi.listMcpServers()
      set({ mcpServers: Array.isArray(servers) ? servers : [], isLoading: false })
    } catch {
      set({ mcpServers: [], isLoading: false })
    }
  },

  updateMcpServer: async (serverId, config) => {
    await settingsApi.updateMcpServer(serverId, config)
    await get().fetchMcpServers()
  },

  deleteMcpServer: async (serverId) => {
    await settingsApi.deleteMcpServer(serverId)
    await get().fetchMcpServers()
  },

  testMcpServer: async (serverId) => {
    const result = await settingsApi.testMcpServer(serverId)
    set({ testResult: result })
    await get().fetchMcpServers()
    return result
  },

  // --- Default model actions ---
  fetchDefaultModel: async () => {
    try {
      const defaultModel = await settingsApi.getDefaultModel()
      set({ defaultModel })
    } catch {
      // ignore
    }
  },

  updateDefaultModel: async (config) => {
    await settingsApi.updateDefaultModel(config)
    await get().fetchDefaultModel()
  },

  clearTestResult: () => set({ testResult: null }),
}))
