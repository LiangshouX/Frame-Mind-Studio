import { create } from 'zustand'
import { ElementType, SceneNavItem } from '@/types/script'

interface EditorStore {
  currentElementType: ElementType
  sceneList: SceneNavItem[]
  isDirty: boolean
  lastSavedAt: string | null
  isSaving: boolean
  setElementType: (type: ElementType) => void
  setSceneList: (scenes: SceneNavItem[]) => void
  setDirty: (dirty: boolean) => void
  setSaving: (saving: boolean) => void
  markSaved: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  currentElementType: 'action',
  sceneList: [],
  isDirty: false,
  lastSavedAt: null,
  isSaving: false,

  setElementType: (currentElementType) => set({ currentElementType }),
  setSceneList: (sceneList) => set({ sceneList }),
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
  markSaved: () => set({ isDirty: false, isSaving: false, lastSavedAt: new Date().toISOString() }),
}))
