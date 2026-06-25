import { create } from 'zustand'
import type { CollapsibleBlock, ConnectionStatus, MessageType, ModelSelection, WorkflowStep } from '@/types/agent'
import { listSessions, getSessionDetail, createSession, deleteSession as apiDeleteSession } from '@/lib/api/agent-api'

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
  /** 当前会话 ID */
  sessionId: string | null
  /** 会话标题 */
  title: string | null
}

/** 会话列表项（用于侧边栏显示） */
interface SessionListItem {
  id: string
  title: string | null
  createdAt: string
  messageCount: number
  status: string
}

interface AgentStore {
  /** 当前活跃的 Tab */
  activeTab: WorkflowStep
  /** 按 workflowStep 分组的会话 */
  sessions: Record<string, TabSession>
  /** 按 workflowStep 分组的会话列表（用于侧边栏） */
  sessionsByTab: Record<WorkflowStep, SessionListItem[]>
  /** 会话列表加载状态 */
  sessionListLoading: boolean
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

  // ─── 会话管理 Actions ──────────────────────────────────────

  /** 从 API 加载指定 workflow step 的会话列表 */
  loadSessionList: (projectId: string, workflowStep: WorkflowStep) => Promise<void>
  /** 切换到指定会话（加载历史消息） */
  switchSession: (projectId: string, sessionId: string, workflowStep: WorkflowStep) => Promise<void>
  /** 创建新会话并切换 */
  createNewSession: (projectId: string, workflowStep: WorkflowStep) => Promise<void>
  /** 删除会话 */
  removeSession: (projectId: string, sessionId: string, workflowStep: WorkflowStep) => Promise<void>
  /** 更新会话标题（本地） */
  updateSessionTitleLocal: (workflowStep: WorkflowStep, sessionId: string, title: string) => void
}

const createEmptyTab = (): TabSession => ({
  messages: [],
  isRunning: false,
  isStreaming: false,
  sessionId: null,
  title: null,
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

// 从 localStorage 恢复每个 step 的活跃会话 ID
function loadActiveSessionIds(): Partial<Record<WorkflowStep, string>> {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem('framemind-active-sessions')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

// 保存每个 step 的活跃会话 ID 到 localStorage
function saveActiveSessionIds(ids: Partial<Record<WorkflowStep, string>>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('framemind-active-sessions', JSON.stringify(ids))
  } catch {
    // ignore
  }
}

// 初始化每个 step 的会话列表
const initSessionsByTab = (): Record<WorkflowStep, SessionListItem[]> => ({
  worldview: [],
  synopsis: [],
  characters: [],
  outline: [],
  script: [],
})

const initialState = {
  activeTab: 'worldview' as WorkflowStep,
  sessions: {} as Record<string, TabSession>,
  sessionsByTab: initSessionsByTab(),
  sessionListLoading: false,
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

  // ─── 会话管理 Actions ──────────────────────────────────────

  loadSessionList: async (projectId, workflowStep) => {
    set({ sessionListLoading: true })
    try {
      const result = await listSessions(projectId, workflowStep, 0, 100)
      const items: SessionListItem[] = result.content.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.created_at,
        messageCount: s.message_count,
        status: s.status,
      }))
      set((state) => ({
        sessionsByTab: { ...state.sessionsByTab, [workflowStep]: items },
        sessionListLoading: false,
      }))
    } catch {
      set({ sessionListLoading: false })
    }
  },

  switchSession: async (projectId, sessionId, workflowStep) => {
    const detail = await getSessionDetail(projectId, sessionId)
    if (!detail) return

    const messages: AgentMessageUI[] = (detail.messages || []).map((m) => ({
      id: m.id,
      agentName: detail.agent_name || 'assistant',
      role: m.role as AgentMessageUI['role'],
      content: m.content || '',
      messageType: m.message_type,
      isStreaming: false,
      timestamp: m.created_at || new Date().toISOString(),
    }))

    set((state) => {
      const tab = state.sessions[workflowStep] || createEmptyTab()
      const updatedTab = { ...tab, messages, sessionId, title: detail.title || null }
      const activeSessionIds = loadActiveSessionIds()
      activeSessionIds[workflowStep] = sessionId
      saveActiveSessionIds(activeSessionIds)
      return {
        sessions: { ...state.sessions, [workflowStep]: updatedTab },
        sessionId,
        activeTab: workflowStep,
      }
    })
  },

  createNewSession: async (projectId, workflowStep) => {
    const result = await createSession(projectId, workflowStep)
    const tab = createEmptyTab()
    tab.sessionId = result.id

    set((state) => {
      const activeSessionIds = loadActiveSessionIds()
      activeSessionIds[workflowStep] = result.id
      saveActiveSessionIds(activeSessionIds)
      return {
        sessions: { ...state.sessions, [workflowStep]: tab },
        sessionId: result.id,
        activeTab: workflowStep,
      }
    })

    // 刷新会话列表
    get().loadSessionList(projectId, workflowStep)
  },

  removeSession: async (projectId, sessionId, workflowStep) => {
    await apiDeleteSession(projectId, sessionId)

    set((state) => {
      const items = (state.sessionsByTab[workflowStep] || []).filter((s) => s.id !== sessionId)
      const activeSessionIds = loadActiveSessionIds()

      // 如果删除的是当前活跃会话，切换到列表中第一个或清空
      const tab = state.sessions[workflowStep]
      let updatedTab = tab
      let newSessionId = state.sessionId

      if (tab?.sessionId === sessionId) {
        if (items.length > 0) {
          // 切换到第一个会话
          newSessionId = items[0].id
          updatedTab = { ...createEmptyTab(), sessionId: items[0].id, title: items[0].title }
          activeSessionIds[workflowStep] = items[0].id
        } else {
          updatedTab = createEmptyTab()
          newSessionId = null
          delete activeSessionIds[workflowStep]
        }
      }

      saveActiveSessionIds(activeSessionIds)
      return {
        sessionsByTab: { ...state.sessionsByTab, [workflowStep]: items },
        sessions: { ...state.sessions, [workflowStep]: updatedTab },
        sessionId: newSessionId,
      }
    })
  },

  updateSessionTitleLocal: (workflowStep, sessionId, title) => {
    set((state) => {
      const items = (state.sessionsByTab[workflowStep] || []).map((s) =>
        s.id === sessionId ? { ...s, title } : s
      )
      const tab = state.sessions[workflowStep]
      const updatedTab = tab?.sessionId === sessionId ? { ...tab, title } : tab
      return {
        sessionsByTab: { ...state.sessionsByTab, [workflowStep]: items },
        sessions: { ...state.sessions, [workflowStep]: updatedTab },
      }
    })
  },
}))
