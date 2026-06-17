'use client'
import { useCallback } from 'react'
import { useAgentStore } from '@/stores/agent-store'
import { useWebSocket } from './useWebSocket'
import { wsUrl } from '@/lib/api/client'

export function useAgentSession() {
  const store = useAgentStore()

  const connectToSession = useCallback((sessionId: string) => {
    store.setSession(sessionId)
  }, [store])

  const url = store.sessionId ? wsUrl(store.sessionId) : null
  const { send } = useWebSocket(url, store.handleMessage)

  const submitReview = useCallback((action: 'approve' | 'revise', feedback?: string) => {
    send({ type: 'hitl_response', action, feedback })
    store.handleMessage({
      type: 'stage_update',
      data: { stage: 'human_review', stageLabel: '人类审核', status: 'completed' },
    })
  }, [send, store])

  return {
    ...store,
    connectToSession,
    submitReview,
  }
}
