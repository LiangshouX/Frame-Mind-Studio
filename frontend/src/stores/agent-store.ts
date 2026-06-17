import { create } from 'zustand'
import type { AgentStage, WsMessage } from '@/types/agent'

interface AgentMessage {
  agentName: string
  role: 'agent' | 'user' | 'system'
  content: string
}

interface AgentStore {
  sessionId: string | null
  currentStage: AgentStage | null
  stageLabel: string | null
  messages: AgentMessage[]
  isRunning: boolean
  hitlPending: boolean
  hitlOptions: string[]
  error: string | null
  setSession: (id: string) => void
  handleMessage: (msg: WsMessage) => void
  clearSession: () => void
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  sessionId: null,
  currentStage: null,
  stageLabel: null,
  messages: [],
  isRunning: false,
  hitlPending: false,
  hitlOptions: [],
  error: null,

  setSession: (id) => set({
    sessionId: id,
    isRunning: true,
    messages: [],
    error: null,
    hitlPending: false,
  }),

  handleMessage: (msg) => {
    const { messages } = get()
    switch (msg.type) {
      case 'stage_update': {
        const data = msg.data as { stage: AgentStage; stageLabel: string; status: string }
        set({ currentStage: data.stage, stageLabel: data.stageLabel })
        if (data.status === 'started') {
          set({ messages: [...messages, { agentName: data.stage, role: 'system', content: `▶ ${data.stageLabel} 开始工作...` }] })
        }
        break
      }
      case 'stream_chunk': {
        const data = msg.data as { stage: AgentStage; content: string }
        set({ messages: [...messages, { agentName: data.stage, role: 'agent', content: data.content }] })
        break
      }
      case 'hitl_prompt': {
        const data = msg.data as { content: string; options: string[] }
        set({
          hitlPending: true,
          hitlOptions: data.options,
          messages: [...messages, { agentName: 'human_review', role: 'system', content: `📋 人类审核请求:\n${data.content}` }],
        })
        break
      }
      case 'complete':
        set({ isRunning: false, hitlPending: false, currentStage: null, stageLabel: null })
        set({ messages: [...messages, { agentName: 'system', role: 'system', content: '✅ 任务完成' }] })
        break
      case 'error': {
        const data = msg.data as { message: string }
        set({ isRunning: false, error: data.message })
        set({ messages: [...messages, { agentName: 'system', role: 'system', content: `❌ 错误: ${data.message}` }] })
        break
      }
      case 'budget_warning': {
        const data = msg.data as { message: string }
        set({ messages: [...messages, { agentName: 'system', role: 'system', content: `⚠️ ${data.message}` }] })
        break
      }
    }
  },

  clearSession: () => set({
    sessionId: null,
    currentStage: null,
    stageLabel: null,
    messages: [],
    isRunning: false,
    hitlPending: false,
    error: null,
  }),
}))
