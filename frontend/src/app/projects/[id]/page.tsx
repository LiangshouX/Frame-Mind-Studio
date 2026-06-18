'use client'

import { useParams } from 'next/navigation'
import { AgentChat } from '@/components/shared/agent-chat'
import { OutlineViewer } from '@/components/scriptmind/outline-viewer'
import { useAgentSession } from '@/hooks/shared/use-agent-session'
import { useProjectStore } from '@/stores/project-store'
import { Sparkles, FileText } from 'lucide-react'

export default function ProjectWorkbenchPage() {
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
  const hasOutline = !!outlineContent

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6 h-[calc(100vh-11rem)]">
      {/* Left: Outline / Prompt Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {hasOutline ? (
          <OutlineViewer content={outlineContent} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-3">
              开始创作你的剧本
            </h2>
            <p className="text-base text-[var(--text-secondary)] max-w-md mb-6 leading-relaxed">
              在右侧 Agent 面板中输入一句话梗概，AI 团队将为你生成结构化大纲。你可以实时查看生成进度，并在完成后审核修改。
            </p>
            <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-hover)] border border-[var(--border-light)]">
                <FileText className="h-3.5 w-3.5" />
                支持风格预设
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-hover)] border border-[var(--border-light)]">
                <Sparkles className="h-3.5 w-3.5" />
                流式生成
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Agent Interaction Panel */}
      <div className="w-[420px] flex-shrink-0">
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
