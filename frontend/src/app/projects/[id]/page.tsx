'use client'

import { useParams, useRouter } from 'next/navigation'
import { AgentChat } from '@/components/shared/agent-chat'
import { OutlineViewer } from '@/components/scriptmind/outline-viewer'
import { useAgentWorkbench } from '@/hooks/shared/use-agent-workbench'
import { Sparkles, FileText, ArrowRight } from 'lucide-react'

export default function ProjectWorkbenchPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { outlineContent, handleSend, handleApprove, handleRevise, handleRefine } = useAgentWorkbench(projectId)

  const hasOutline = !!outlineContent

  return (
    <div className="flex h-full">
      {/* Left: Outline / Prompt Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {hasOutline ? (
          <div className="max-w-3xl mx-auto">
            <OutlineViewer content={outlineContent} onRefine={handleRefine} />
            <div className="mt-6 pt-6 border-t border-[var(--border-light)]">
              <button
                onClick={() => router.push(`/projects/${projectId}/scriptmind`)}
                className="btn btn-primary flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                进入编辑器
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
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
