import { create } from 'zustand'
import * as settingsApi from '@/lib/api/settings'

interface ApiKeyConfig {
  provider: string
  key_preview: string
  configured: boolean
}

interface ModelConfig {
  id: string
  provider: string
  name: string
  use_case: string
  configured: boolean
}

interface SettingsStore {
  apiKeys: ApiKeyConfig[]
  models: ModelConfig[]
  isLoading: boolean
  fetchApiKeys: () => Promise<void>
  fetchModels: () => Promise<void>
  addApiKey: (provider: string, apiKey: string) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  apiKeys: [],
  models: [],
  isLoading: false,

  fetchApiKeys: async () => {
    set({ isLoading: true })
    try {
      const { items } = await settingsApi.listApiKeys()
      set({ apiKeys: items, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchModels: async () => {
    set({ isLoading: true })
    try {
      const { items } = await settingsApi.listModels()
      set({ models: items, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addApiKey: async (provider, apiKey) => {
    const result = await settingsApi.updateApiKey(provider, apiKey)
    set({ apiKeys: [...get().apiKeys.filter(k => k.provider !== provider), result] })
  },
}))
