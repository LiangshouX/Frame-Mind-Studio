'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { api } from '@/lib/api'
import { mockProjects, mockCharacters, mockAgentMessages } from '@/lib/mock-data'
import { getAgentName, formatDate } from '@/lib/utils'
import type { Project, Character, AgentMessage } from '@/types'
import {
  ChevronLeft,
  Send,
  Loader2,
  Clapperboard,
  FileText,
  Users,
  MessageSquare,
  Lightbulb,
  BookOpen,
} from 'lucide-react'

type Tab = 'agent' | 'script' | 'characters'

const agentColorMap: Record<string, string> = {
  showrunner: 'var(--agent-showrunner)',
  world_builder: 'var(--agent-worldbuilder)',
  character_designer: 'var(--agent-character)',
  script_doctor: 'var(--agent-scriptdoctor)',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [tab, setTab] = useState<Tab>('agent')
  const [project, setProject] = useState<Project | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProject()
  }, [projectId])

  async function loadProject() {
    setLoading(true)
    try {
      const p = await api.fetchProject(projectId)
      setProject(p)
      const c = await api.fetchCharacters(projectId)
      setCharacters(c)
    } catch {
      setProject(mockProjects.find((p) => p.id === projectId) || mockProjects[0])
      setCharacters(mockCharacters)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-14">
          <div className="flex items-center justify-center py-20 text-[var(--text-muted)] gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </main>
      </>
    )
  }

  if (!project) {
    return (
      <>
        <Navbar />
        <main className="pt-14">
          <div className="text-center py-20">
            <Clapperboard className="h-10 w-10 text-[var(--border)] mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">项目不存在</p>
          </div>
        </main>
      </>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
    { id: 'agent', label: 'Agent 工作台', icon: MessageSquare },
    { id: 'script', label: '剧本', icon: FileText },
    { id: 'characters', label: '角色', icon: Users },
  ]

  return (
    <>
      <Navbar />
      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            返回项目列表
          </Link>

          {/* Header — scene heading style */}
          <div className="mb-6">
            <div className="font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">
              INT. {project.title} — 工作台
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">{project.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {project.genre?.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-secondary)] border border-[var(--border-light)]"
                >
                  {g}
                </span>
              ))}
              <span className="text-xs text-[var(--text-muted)]">
                {project.targetEpisodes} 集
              </span>
              {project.description && (
                <>
                  <span className="text-xs text-[var(--text-muted)]">·</span>
                  <span className="text-xs text-[var(--text-secondary)] line-clamp-1">
                    {project.description}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tabs — underline style */}
          <div className="flex gap-0 border-b border-[var(--border-light)] mb-6">
            {tabs.map((t) => {
              const Icon = t.icon
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          {tab === 'agent' && <AgentWorkbench projectId={projectId} />}
          {tab === 'script' && <ScriptTab projectId={projectId} />}
          {tab === 'characters' && (
            <CharactersTab projectId={projectId} characters={characters} />
          )}
        </div>
      </main>
    </>
  )
}

// ==================== Agent Workbench ====================
function AgentWorkbench({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<AgentMessage[]>(mockAgentMessages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isThinking) return

    const userMsg: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    try {
      const result = await api.sendAgentMessage('session-' + projectId, input)
      const agentMsg: AgentMessage = {
        id: Date.now().toString() + '-agent',
        role: 'assistant',
        agentName: result.agent || 'showrunner',
        content: result.content || '处理完成',
        structuredData: result.structured_data,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, agentMsg])
    } catch {
      setTimeout(() => {
        const agentMsg: AgentMessage = {
          id: Date.now().toString() + '-mock',
          role: 'assistant',
          agentName: 'showrunner',
          content: generateMockResponse(input),
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, agentMsg])
        setIsThinking(false)
      }, 1500)
      return
    }
    setIsThinking(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Chat Area */}
      <div className="lg:col-span-2 flex flex-col h-[560px] rounded border border-[var(--border-light)] bg-[var(--bg-card)] overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            const agentColor = agentColorMap[msg.agentName || ''] || 'var(--text-muted)'

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {isUser ? (
                  <div className="max-w-[80%] px-4 py-2.5 rounded bg-[var(--text-primary)] text-[var(--bg)] text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="agent-bubble max-w-[85%]" data-agent={msg.agentName}>
                    <div
                      className="font-mono text-[0.6875rem] font-bold tracking-[0.08em] uppercase mb-1.5"
                      style={{ color: agentColor }}
                    >
                      {getAgentName(msg.agentName || '')}
                    </div>
                    <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="agent-bubble" data-agent="showrunner">
                <div className="thinking-indicator">
                  <div className="thinking-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>Agent 正在思考...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border-light)] p-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="描述你的创作意图... 例如：写一个现代都市复仇短剧"
              className="flex-1 px-3 py-2.5 text-sm bg-[var(--bg)] border border-[var(--border-light)] rounded resize-none focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)]"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={isThinking || !input.trim()}
              className="self-end px-4 py-2.5 bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium rounded hover:bg-[var(--ink-700)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Outline preview */}
        <div className="rounded border border-[var(--border-light)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-[var(--text-secondary)]" />
            <h3 className="text-sm font-bold">大纲预览</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            发送创作意图后，Agent 会在这里展示生成的故事大纲。
          </p>
        </div>

        {/* Character list */}
        <div className="rounded border border-[var(--border-light)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-[var(--text-secondary)]" />
            <h3 className="text-sm font-bold">角色列表</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Agent 设计的角色将在这里展示。
          </p>
        </div>

        {/* Tips */}
        <div className="rounded border border-[var(--border-light)] bg-[var(--bg-sidebar)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold">提示</h3>
          </div>
          <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 leading-relaxed">
            <li>描述越具体，Agent 生成的内容越精准</li>
            <li>可以指定题材、集数、目标受众</li>
            <li>Agent 会自动协作完善剧本</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ==================== Script Tab ====================
function ScriptTab({ projectId }: { projectId: string }) {
  return (
    <div>
      <div className="rounded border border-[var(--border-light)] bg-[var(--bg-card)] p-8">
        <div className="text-center">
          <FileText className="h-10 w-10 text-[var(--border)] mx-auto mb-4" />
          <h2 className="font-display text-lg font-bold mb-2">剧本编辑器</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-1">
            在 Agent 工作台中完成创作后，剧本将在这里展示。
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            支持结构化编辑、场景管理和版本导出。
          </p>
        </div>
      </div>
    </div>
  )
}

// ==================== Characters Tab ====================
function CharactersTab({
  projectId,
  characters,
}: {
  projectId: string
  characters: Character[]
}) {
  if (characters.length === 0) {
    return (
      <div className="rounded border border-[var(--border-light)] bg-[var(--bg-card)] p-8 text-center">
        <Users className="h-10 w-10 text-[var(--border)] mx-auto mb-4" />
        <h2 className="font-display text-lg font-bold mb-2">暂无角色</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Agent 会在创作过程中自动生成角色档案。
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {characters.map((char) => {
        const roleType = char.roleType || char.role_type || ''
        const roleColor =
          roleType === 'protagonist'
            ? 'var(--agent-showrunner)'
            : roleType === 'antagonist'
            ? 'var(--accent)'
            : 'var(--text-muted)'

        return (
          <div
            key={char.id}
            className="relative rounded border border-[var(--border-light)] bg-[var(--bg-card)] p-5 hover:shadow-md transition-all"
          >
            {/* Color bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
              style={{ backgroundColor: roleColor }}
            />

            <div className="pl-3">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: roleColor }}
                >
                  {char.name[0]}
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold">{char.name}</h3>
                  <span className="font-mono text-[0.6875rem] text-[var(--text-muted)] uppercase tracking-wider">
                    {roleType || '未指定'}
                  </span>
                </div>
              </div>

              {char.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                  {char.description}
                </p>
              )}

              {char.personality?.traits && char.personality.traits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {char.personality.traits.map((trait: string) => (
                    <span
                      key={trait}
                      className="text-xs px-2 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-secondary)] border border-[var(--border-light)]"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}

              {char.backstory && (
                <p className="text-xs text-[var(--text-muted)] mt-3 leading-relaxed line-clamp-2">
                  {char.backstory}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ==================== Mock Response ====================
function generateMockResponse(input: string): string {
  return `好的，我来构思这个短剧的大纲。

## 故事大纲

**标题**: 逆袭之路
**题材**: 都市 · 复仇 · 逆袭
**集数**: 20 集
**每集时长**: 2-3 分钟

### 核心设定

女主从被背叛的底层逆袭为商业女王。前3集完成"受辱 → 觉醒 → 首次反击"的黄金结构，确保观众留存。

### 第1集 · 坠落
女主在公司年会上被当众羞辱，发现男友与闺蜜的背叛。

### 第2集 · 觉醒
意外获得关键信息，开始隐忍布局。

### 第3集 · 反击
首次精准反击，让对手措手不及。

---

以上是初步大纲，你可以提出修改意见，我会安排其他 Agent 进一步完善世界观和角色设定。`
}
