'use client'

import { useParams } from 'next/navigation'
import { AgentChat } from '@/components/shared/agent-chat'
import { OutlineViewer } from '@/components/scriptmind/outline-viewer'
import { useAgentSession } from '@/hooks/shared/use-agent-session'
import { useProjectStore } from '@/stores/project-store'

export default function OutlinePage() {
  const params = useParams()
  const projectId = params.id as string
  const { currentProject } = useProjectStore()
  const agent = useAgentSession(projectId)

  const handleSend = (text: string, stylePreset?: string) => {
    agent.startOutlineGeneration(text, stylePreset, currentProject?.target_episodes)
  }

  const handleApprove = () => {
    agent.submitReview('approve')
  }

  const handleRevise = (feedback: string) => {
    agent.submitReview('revise', feedback)
  }

  const outlineContent = currentProject?.script?.content

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6 h-[calc(100vh-7rem)]">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {outlineContent ? (
          <OutlineViewer content={outlineContent} />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
            在右侧输入你的创意想法，生成大纲
          </div>
        )}
      </div>
      <div className="w-96 flex-shrink-0">
        <AgentChat
          projectId={projectId}
          onSend={handleSend}
          onApprove={handleApprove}
          onRevise={handleRevise}
        />
      </div>
    </div>
  )
}
