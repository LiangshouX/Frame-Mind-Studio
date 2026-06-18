'use client'

import { useCallback } from 'react'
import { useAgentStore } from '@/stores/agent-store'
import * as agentApi from '@/lib/api/agent'
import { useAgentWebSocket } from './use-websocket'

export function useAgentSession(projectId: string) {
  const store = useAgentStore()
  useAgentWebSocket(store.sessionId)

  const startOutlineGeneration = useCallback(async (input: string, stylePreset?: string, targetEpisodes?: number) => {
    store.reset()
    store.setRunning(true)
    try {
      const result = await agentApi.generateOutline({
        project_id: projectId,
        input_type: 'one_sentence',
        input_content: input,
        style_preset: stylePreset,
        target_episodes: targetEpisodes,
      })
      store.setSession(result.session_id)
      return result
    } catch (err) {
      store.setRunning(false)
      throw err
    }
  }, [projectId, store])

  const startRefineScript = useCallback(async (outline: string) => {
    store.reset()
    store.setRunning(true)
    try {
      const result = await agentApi.refineScript({
        project_id: projectId,
        input_type: 'outline',
        input_content: outline,
      })
      store.setSession(result.session_id)
      return result
    } catch (err) {
      store.setRunning(false)
      throw err
    }
  }, [projectId, store])

  const submitReview = useCallback(async (action: 'approve' | 'revise', feedback?: string) => {
    if (!store.sessionId) return
    store.setReviewing(false)
    if (action === 'revise') store.setRunning(true)
    return agentApi.submitReview(store.sessionId, action, feedback)
  }, [store])

  return {
    ...store,
    startOutlineGeneration,
    startRefineScript,
    submitReview,
  }
}
