import { create } from 'zustand'
import type { CollapsibleBlock, ConnectionStatus, MessageType, ModelSelection, WorkflowStep } from '@/types/agent'

/** UI 消息 */
interface AgentMessageUI {
  id: string
  agentName: string
  role: 'user' | 'assistant' | 'system' | 'error'
  content: string
  messageType: MessageType
  isStreaming: boolean
  timestamp: string
}

/** 每个 Tab 的会话状态 */
interface TabSession {
  messages: AgentMessageUI[]
  isRunning: boolean
  isStreaming: boolean
}

interface AgentStore {
  /** 当前活跃的 Tab */
  activeTab: WorkflowStep
  /** 按 workflowStep 分组的会话 */
  sessions: Record<string, TabSession>
  /** 可折叠块 */
  collapsibleBlocks: CollapsibleBlock[]
  /** 当前会话 ID */
  sessionId: string | null
  /** Token 消耗 */
  tokensConsumed: number
  /** 预算警告 */
  budgetWarning: string | null
  /** WebSocket 连接状态 */
  connectionStatus: ConnectionStatus
  /** 每个 Tab 的模型选择 */
  modelSelections: Partial<Record<WorkflowStep, ModelSelection>>

  // ─── Actions ──────────────────────────────────────────────

  setActiveTab: (tab: WorkflowStep) => void
  /** 设置指定 Tab 的模型选择 */
  setModelSelection: (tab: WorkflowStep, selection: ModelSelection) => void
  /** 获取指定 Tab 的模型选择 */
  getModelSelection: (tab: WorkflowStep) => ModelSelection | null
  setSession: (sessionId: string) => void

  /** 获取当前 Tab 的会话（自动创建） */
  getCurrentTab: () => TabSession

  addMessage: (msg: AgentMessageUI) => void
  appendStream: (content: string, agentName?: string) => void
  finishStreaming: () => void
  setRunning: (running: boolean) => void

  /** 添加可折叠块 */
  addCollapsibleBlock: (block: CollapsibleBlock) => void
  /** 更新可折叠块 */
  updateCollapsibleBlock: (id: string, updates: Partial<CollapsibleBlock>) => void
  /** 切换可折叠块展开/折叠 */
  toggleBlockCollapse: (id: string) => void

  setTokens: (tokens: number) => void
  setBudgetWarning: (warning: string | null) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  reset: () => void
  resetTab: (tab: WorkflowStep) => void
}

const createEmptyTab = (): TabSession => ({
  messages: [],
  isRunning: false,
  isStreaming: false,
})

// 从 localStorage 恢复模型选择
function loadModelSelections(): Partial<Record<WorkflowStep, ModelSelection>> {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem('framemind-model-selections')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

// 保存模型选择到 localStorage
function saveModelSelections(selections: Partial<Record<WorkflowStep, ModelSelection>>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('framemind-model-selections', JSON.stringify(selections))
  } catch {
    // ignore
  }
}

const initialState = {
  activeTab: 'worldview' as WorkflowStep,
  sessions: {} as Record<string, TabSession>,
  collapsibleBlocks: [] as CollapsibleBlock[],
  sessionId: null as string | null,
  tokensConsumed: 0,
  budgetWarning: null as string | null,
  connectionStatus: 'disconnected' as ConnectionStatus,
  modelSelections: loadModelSelections(),
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  ...initialState,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setModelSelection: (tab, selection) => {
    const { modelSelections } = get()
    const updated = { ...modelSelections, [tab]: selection }
    saveModelSelections(updated)
    set({ modelSelections: updated })
  },

  getModelSelection: (tab) => {
    const { modelSelections } = get()
    return modelSelections[tab] || null
  },

  setSession: (sessionId) => set({ sessionId }),

  getCurrentTab: () => {
    const { activeTab, sessions } = get()
    if (!sessions[activeTab]) {
      set({ sessions: { ...sessions, [activeTab]: createEmptyTab() } })
      return createEmptyTab()
    }
    return sessions[activeTab]
  },

  addMessage: (msg) => {
    const { activeTab, sessions } = get()
    const tab = sessions[activeTab] || createEmptyTab()
    set({
      sessions: {
        ...sessions,
        [activeTab]: { ...tab, messages: [...tab.messages, msg] },
      },
    })
  },

  appendStream: (content, agentName) => {
    const { activeTab, sessions } = get()
    const tab = sessions[activeTab] || createEmptyTab()
    const msgs = [...tab.messages]
    const last = msgs[msgs.length - 1]

    if (last && last.isStreaming) {
      last.content += content
    } else {
      msgs.push({
        id: `stream-${Date.now()}`,
        agentName: agentName || 'assistant',
        role: 'assistant',
        content,
        messageType: 'text',
        isStreaming: true,
        timestamp: new Date().toISOString(),
      })
    }

    set({
      sessions: {
        ...sessions,
        [activeTab]: { ...tab, messages: msgs, isStreaming: true },
      },
    })
  },

  finishStreaming: () => {
    const { activeTab, sessions } = get()
    const tab = sessions[activeTab]
    if (!tab) return

    set({
      sessions: {
        ...sessions,
        [activeTab]: {
          ...tab,
          messages: tab.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          ),
          isStreaming: false,
        },
      },
    })
  },

  setRunning: (isRunning) => {
    const { activeTab, sessions } = get()
    const tab = sessions[activeTab] || createEmptyTab()
    set({
      sessions: {
        ...sessions,
        [activeTab]: { ...tab, isRunning },
      },
    })
  },

  addCollapsibleBlock: (block) => {
    set((state) => ({
      collapsibleBlocks: [...state.collapsibleBlocks, block],
    }))
  },

  updateCollapsibleBlock: (id, updates) => {
    set((state) => ({
      collapsibleBlocks: state.collapsibleBlocks.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }))
  },

  toggleBlockCollapse: (id) => {
    set((state) => ({
      collapsibleBlocks: state.collapsibleBlocks.map((b) =>
        b.id === id ? { ...b, isCollapsed: !b.isCollapsed } : b
      ),
    }))
  },

  setTokens: (tokensConsumed) => set({ tokensConsumed }),

  setBudgetWarning: (budgetWarning) => set({ budgetWarning }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  reset: () => set(initialState),

  resetTab: (tab) => {
    const { sessions } = get()
    set({
      sessions: { ...sessions, [tab]: createEmptyTab() },
      collapsibleBlocks: [],
    })
  },
}))
