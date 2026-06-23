'use client'

import { useCallback } from 'react'
import { useAgentStore } from '@/stores/agent-store'
import { sendChatMessage, triggerGeneration } from '@/lib/api/agent-api'
import { useAgentWebSocket } from './use-websocket'
import type { WorkflowStep } from '@/types/agent'

export function useAgentSession(projectId: string) {
  const store = useAgentStore()
  useAgentWebSocket(store.sessionId)

  /** 发送聊天消息 */
  const sendChat = useCallback(
    async (workflowStep: WorkflowStep, message: string) => {
      store.setRunning(true)
      try {
        const result = await sendChatMessage(projectId, workflowStep, message)
        store.setSession(result.session_id)
        return result
      } catch (err) {
        store.setRunning(false)
        throw err
      }
    },
    [projectId, store]
  )

  /** 触发 AI 一键生成 */
  const generate = useCallback(
    async (workflowStep: WorkflowStep, action: string) => {
      store.setRunning(true)
      try {
        const result = await triggerGeneration(projectId, workflowStep, action)
        store.setSession(result.session_id)
        return result
      } catch (err) {
        store.setRunning(false)
        throw err
      }
    },
    [projectId, store]
  )

  return {
    ...store,
    sendChat,
    generate,
  }
}
