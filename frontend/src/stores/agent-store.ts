import { create } from 'zustand'
import { ConnectionStatus } from '@/types/agent'

interface AgentMessageUI {
  id: string
  agentName: string
  role: 'agent' | 'user' | 'system'
  content: string
  isStreaming: boolean
  timestamp: string
}

interface AgentStore {
  sessionId: string | null
  stage: string | null
  stageLabel: string | null
  messages: AgentMessageUI[]
  isRunning: boolean
  isReviewing: boolean
  reviewContent: string | null
  tokensConsumed: number
  budgetWarning: string | null
  connectionStatus: ConnectionStatus
  setSession: (sessionId: string) => void
  setStage: (stage: string, label: string) => void
  addMessage: (msg: AgentMessageUI) => void
  appendStream: (content: string) => void
  setRunning: (running: boolean) => void
  setReviewing: (reviewing: boolean, content?: string) => void
  setTokens: (tokens: number) => void
  setBudgetWarning: (warning: string | null) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  reset: () => void
}

const initialState = {
  sessionId: null,
  stage: null,
  stageLabel: null,
  messages: [] as AgentMessageUI[],
  isRunning: false,
  isReviewing: false,
  reviewContent: null,
  tokensConsumed: 0,
  budgetWarning: null,
  connectionStatus: 'disconnected' as ConnectionStatus,
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  ...initialState,

  setSession: (sessionId) => set({ sessionId }),

  setStage: (stage, label) => set({ stage, stageLabel: label }),

  addMessage: (msg) => set({ messages: [...get().messages, msg] }),

  appendStream: (content) => {
    const msgs = [...get().messages]
    const last = msgs[msgs.length - 1]
    if (last && last.isStreaming) {
      last.content += content
    } else {
      msgs.push({
        id: `stream-${Date.now()}`,
        agentName: get().stage || 'unknown',
        role: 'agent',
        content,
        isStreaming: true,
        timestamp: new Date().toISOString(),
      })
    }
    set({ messages: msgs })
  },

  setRunning: (isRunning) => set({ isRunning }),

  setReviewing: (isReviewing, content) =>
    set({ isReviewing, reviewContent: content || null }),

  setTokens: (tokensConsumed) => set({ tokensConsumed }),

  setBudgetWarning: (budgetWarning) => set({ budgetWarning }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  reset: () => set(initialState),
}))
