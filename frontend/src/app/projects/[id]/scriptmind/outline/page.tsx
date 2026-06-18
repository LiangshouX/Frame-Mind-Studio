'use client'

import { useParams } from 'next/navigation'
import { AgentChat } from '@/components/shared/agent-chat'
import { OutlineViewer } from '@/components/scriptmind/outline-viewer'
import { useAgentWorkbench } from '@/hooks/shared/use-agent-workbench'

export default function OutlinePage() {
  const params = useParams()
  const projectId = params.id as string
  const { outlineContent, handleSend, handleApprove, handleRevise } = useAgentWorkbench(projectId)

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-3xl mx-auto">
          {outlineContent ? (
            <OutlineViewer content={outlineContent} />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
              在右侧输入你的创意想法，生成大纲
            </div>
          )}
        </div>
      </div>
      <div className="w-[480px] flex-shrink-0 border-l border-[var(--border-light)]">
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
