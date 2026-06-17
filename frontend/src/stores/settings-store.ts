import { create } from 'zustand'

interface SettingsStore {
  apiKeys: { provider: string; keyPreview: string; configured: boolean }[]
  models: { id: string; provider: string; name: string; useCase: string; configured: boolean }[]
  setApiKeys: (keys: SettingsStore['apiKeys']) => void
  setModels: (models: SettingsStore['models']) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  apiKeys: [],
  models: [],
  setApiKeys: (apiKeys) => set({ apiKeys }),
  setModels: (models) => set({ models }),
}))
