'use client'

import { useCallback } from 'react'
import { useAgentSession } from '@/hooks/shared/use-agent-session'
import { useProjectStore } from '@/stores/project-store'

/**
 * Shared hook for agent interaction logic used by both the workbench and outline pages.
 * Encapsulates handleSend, handleApprove, handleRevise, and handleRefine callbacks.
 */
export function useAgentWorkbench(projectId: string) {
  const { currentProject } = useProjectStore()
  const agent = useAgentSession(projectId)

  const handleSend = useCallback((text: string, stylePreset?: string) => {
    agent.startOutlineGeneration(text, stylePreset, currentProject?.target_episodes)
  }, [agent, currentProject?.target_episodes])

  const handleApprove = useCallback(() => {
    agent.submitReview('approve')
  }, [agent])

  const handleRevise = useCallback((feedback: string) => {
    agent.submitReview('revise', feedback)
  }, [agent])

  const handleRefine = useCallback(() => {
    const outlineContent = currentProject?.script?.content
    if (!outlineContent) return
    agent.startRefineScript(JSON.stringify(outlineContent))
  }, [agent, currentProject?.script?.content])

  return {
    ...agent,
    handleSend,
    handleApprove,
    handleRevise,
    handleRefine,
    outlineContent: currentProject?.script?.content || null,
    currentProject,
  }
}
