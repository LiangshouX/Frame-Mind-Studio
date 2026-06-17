'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { PipelineNav } from '@/components/shared/pipeline-nav'
import { AgentChat } from '@/components/shared/agent-chat'
import { useAgentSession } from '@/hooks/shared/useAgentSession'
import { generateOutline } from '@/lib/api/scriptmind'
import { STYLE_PRESETS } from '@/../../shared/constants/pipeline'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function OutlinePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const agent = useAgentSession()

  const [input, setInput] = useState('')
  const [stylePreset, setStylePreset] = useState<string>('')
  const [targetEpisodes, setTargetEpisodes] = useState(20)
  const [mode, setMode] = useState<'sentence' | 'paste'>('sentence')

  const handleGenerate = async () => {
    if (!input.trim()) return
    try {
      const result = await generateOutline(projectId, input, stylePreset || undefined, targetEpisodes)
      agent.connectToSession(result.session_id)
    } catch (e: any) {
      console.error(e)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14">
        <PipelineNav projectId={projectId} />
        <div className="flex h-[calc(100vh-7rem)]">
          {/* Left: Input Panel */}
          <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto">
            <div className="font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">
              大纲生成
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-6">
              一句话，生成完整大纲
            </h1>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('sentence')}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  mode === 'sentence'
                    ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]'
                }`}
              >
                一句话创意
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  mode === 'paste'
                    ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)]'
                }`}
              >
                粘贴大纲
              </button>
            </div>

            {/* Input Area */}
            {mode === 'sentence' ? (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如：写一个现代都市复仇短剧，女主被渣男背叛后逆袭"
                rows={3}
                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none mb-6"
              />
            ) : (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"第1集: 命运的转折\n- 女主发现男友和闺蜜联手背叛\n- 被公司开除，失去一切\n\n第2集: 绝地反击\n- 偶遇贵人，获得新机会\n- 开始策划复仇计划"}
                rows={12}
                className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none mb-6 font-mono text-sm"
              />
            )}

            {/* Style Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">风格预设</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setStylePreset(stylePreset === preset.id ? '' : preset.id)}
                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                      stylePreset === preset.id
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Episodes */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                目标集数: {targetEpisodes}
              </label>
              <input
                type="range"
                min={8}
                max={100}
                step={2}
                value={targetEpisodes}
                onChange={(e) => setTargetEpisodes(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>8 集</span>
                <span>100 集</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!input.trim() || agent.isRunning}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--accent)] text-white text-sm font-medium rounded hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {agent.isRunning ? '生成中...' : '生成大纲'}
            </button>

            {/* Quick nav to editor */}
            <button
              onClick={() => router.push(`/projects/${projectId}/scriptmind`)}
              className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] text-sm rounded hover:border-[var(--text-primary)] transition-colors"
            >
              直接进入编辑器
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Right: Agent Chat */}
          <div className="w-96 flex-shrink-0">
            <AgentChat
              messages={agent.messages}
              isRunning={agent.isRunning}
              currentStage={agent.currentStage}
              stageLabel={agent.stageLabel}
              hitlPending={agent.hitlPending}
              hitlOptions={agent.hitlOptions}
              onReview={agent.submitReview}
            />
          </div>
        </div>
      </main>
    </>
  )
}
