'use client'

import { useCallback } from 'react'
import { useAgentSession } from '@/hooks/shared/use-agent-session'
import { useProjectStore } from '@/stores/project-store'

/**
 * Shared hook for agent interaction logic used by both the workbench and outline pages.
 */
export function useAgentWorkbench(projectId: string) {
  const { currentProject } = useProjectStore()
  const agent = useAgentSession(projectId)

  const handleSend = useCallback(
    (text: string) => {
      agent.sendChat('worldview', text)
    },
    [agent]
  )

  const handleRefine = useCallback(() => {
    const outlineContent = currentProject?.script?.content
    if (!outlineContent) return
    agent.sendChat('script', '请精修以下剧本:\n' + JSON.stringify(outlineContent, null, 2))
  }, [agent, currentProject?.script?.content])

  return {
    ...agent,
    handleSend,
    handleRefine,
    outlineContent: currentProject?.script?.content || null,
    currentProject,
  }
}
