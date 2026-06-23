'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { useWorkflowStore } from '@/stores/workflow-store'
import { WorkflowStep } from '@/types/workflow'
import { WorkflowTabs } from '@/components/scriptmind/workflow-tabs'
import { WorldviewPanel } from '@/components/scriptmind/worldview-panel'
import { SynopsisPanel } from '@/components/scriptmind/synopsis-panel'
import { CharacterPanel } from '@/components/scriptmind/character-panel'
import { OutlinePanel } from '@/components/scriptmind/outline-panel'
import { ScriptEditor } from '@/components/scriptmind/script-editor'
import { EditorToolbar, ScriptTab } from '@/components/scriptmind/script-editor/toolbar'
import { OptimizePanel } from '@/components/scriptmind/script-editor/optimize'
import { SceneNav } from '@/components/scriptmind/scene-nav'
import { AgentChat } from '@/components/shared/agent-chat'
import { WorkflowLayout } from '@/components/scriptmind/workflow-layout'
import { ResizablePanel } from '@/components/shared/resizable-panel'
import { useEditorStore } from '@/stores/editor-store'
import { useAgentStore } from '@/stores/agent-store'
import { connectAgentWebSocket } from '@/lib/websocket/stomp-client'
import * as workflowApi from '@/lib/api/workflow'
import { AgentWebSocketMessage } from '@/types/agent'
import { Loader2, Users, MapPin } from 'lucide-react'
import { UploadDialog } from '@/components/scriptmind/upload-dialog'
import { ExportDialog } from '@/components/scriptmind/export-dialog'

export default function ScriptmindPage() {
  const params = useParams()
  const projectId = params.id as string
  const { currentProject, fetchProject } = useProjectStore()
  const {
    currentStep,
    stepStatuses,
    setCurrentStep,
    markCompleted,
  } = useWorkflowStore()
  const requestSave = useEditorStore((s) => s.requestSave)
  const currentElementType = useEditorStore((s) => s.currentElementType)

  const [showOptimize, setShowOptimize] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [activeScriptTab, setActiveScriptTab] = useState<ScriptTab>('content')
  const [outlineData, setOutlineData] = useState<any>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Agent store (for script step's direct WebSocket management)
  const {
    setSession: setAgentSession,
    addMessage: addAgentMessage,
    appendStream,
    finishStreaming,
    setRunning: setAgentRunning,
    setTokens: setAgentTokens,
    setBudgetWarning: setAgentBudgetWarning,
    setConnectionStatus: setAgentConnectionStatus,
  } = useAgentStore()
  const wsRef = useRef<ReturnType<typeof connectAgentWebSocket> | null>(null)

  // 初始化工作流状态
  useEffect(() => {
    useWorkflowStore.getState().initialize()
    // 加载项目数据
    fetchProject(projectId)
  }, [projectId, fetchProject])

  // 加载大纲数据（用于场景导航）
  useEffect(() => {
    if (currentStep === 'script') {
      workflowApi.getOutline(projectId).then((data) => {
        setOutlineData(data)
      }).catch(() => {})
    }
  }, [projectId, currentStep])

  const handleStepChange = useCallback((step: WorkflowStep) => {
    setCurrentStep(step)
  }, [setCurrentStep])

  const handleGenerate = useCallback(() => {
    markCompleted(currentStep)
    // 刷新项目数据
    fetchProject(projectId)
  }, [currentStep, markCompleted, projectId, fetchProject])

  const handleSceneClick = useCallback((sceneId: string) => {
    const editorEl = document.querySelector('[data-slate-editor]')
    if (!editorEl) return
    const headings = editorEl.querySelectorAll('[class*="scene_heading"], [data-slate-element="scene_heading"]')
    for (const heading of headings) {
      if (heading.textContent?.includes(sceneId)) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    const allElements = editorEl.querySelectorAll('[data-slate-node="element"]')
    for (const el of allElements) {
      if (el.textContent?.startsWith(sceneId)) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
  }, [])

  const handleOptimizeApply = useCallback((text: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
    }
    setShowOptimize(false)
  }, [])

  // Script step 的 WebSocket 消息处理
  const handleScriptWsMessage = useCallback((msg: AgentWebSocketMessage) => {
    switch (msg.type) {
      case 'stream_chunk':
        appendStream(msg.data.content, msg.data.agent_name)
        break
      case 'complete':
        finishStreaming()
        setAgentRunning(false)
        setAgentTokens(msg.data.tokens_consumed)
        addAgentMessage({
          id: `complete-${Date.now()}`,
          agentName: 'system',
          role: 'system',
          content: '✅ 生成完成',
          messageType: 'text',
          isStreaming: false,
          timestamp: new Date().toISOString(),
        })
        fetchProject(projectId)
        break
      case 'error':
        finishStreaming()
        setAgentRunning(false)
        addAgentMessage({
          id: `error-${Date.now()}`,
          agentName: 'system',
          role: 'error',
          content: `❌ ${msg.data.message}`,
          messageType: 'text',
          isStreaming: false,
          timestamp: new Date().toISOString(),
        })
        break
      case 'budget_warning':
        setAgentBudgetWarning(msg.data.message)
        break
    }
  }, [appendStream, finishStreaming, setAgentRunning, setAgentTokens, addAgentMessage, setAgentBudgetWarning, projectId, fetchProject])

  // Script step 的发送消息
  const handleScriptSend = useCallback(async (text: string) => {
    addAgentMessage({
      id: `user-${Date.now()}`,
      agentName: 'user',
      role: 'user',
      content: text,
      messageType: 'text',
      isStreaming: false,
      timestamp: new Date().toISOString(),
    })

    try {
      const result = await workflowApi.generateScript(projectId)
      setAgentSession(result.session_id)

      if (wsRef.current) wsRef.current.disconnect()
      wsRef.current = connectAgentWebSocket(result.session_id, {
        onMessage: handleScriptWsMessage,
        onConnectionChange: setAgentConnectionStatus,
      })
    } catch (error) {
      console.error('Failed to generate script:', error)
    }
  }, [projectId, addAgentMessage, setAgentSession, handleScriptWsMessage, setAgentConnectionStatus])

  // Script step AI 审查
  const handleAIReview = useCallback(async () => {
    addAgentMessage({
      id: `user-${Date.now()}`,
      agentName: 'user',
      role: 'user',
      content: '请审查剧本',
      messageType: 'text',
      isStreaming: false,
      timestamp: new Date().toISOString(),
    })
    try {
      const result = await workflowApi.reviewScript(projectId, 'full')
      setAgentSession(result.session_id)
      if (wsRef.current) wsRef.current.disconnect()
      wsRef.current = connectAgentWebSocket(result.session_id, {
        onMessage: handleScriptWsMessage,
        onConnectionChange: setAgentConnectionStatus,
      })
    } catch (error) {
      console.error('AI review failed:', error)
    }
  }, [projectId, addAgentMessage, setAgentSession, handleScriptWsMessage, setAgentConnectionStatus])

  // 组件卸载时断开 WebSocket
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    }
  }, [])

  // 渲染剧本步骤的内容标签
  const renderScriptTabContent = () => {
    switch (activeScriptTab) {
      case 'content':
        return (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ScriptEditor projectId={projectId} script={currentProject?.script || null} />
            {showOptimize && selectedText && (
              <div className="p-8 max-w-3xl mx-auto">
                <OptimizePanel
                  projectId={projectId}
                  selectedText={selectedText}
                  elementType={currentElementType}
                  onClose={() => setShowOptimize(false)}
                  onApply={handleOptimizeApply}
                />
              </div>
            )}
          </div>
        )
      case 'characters':
        return (
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--accent)]" />
                本集出场角色
              </h3>
              {currentProject?.characters && currentProject.characters.length > 0 ? (
                <div className="space-y-3">
                  {currentProject.characters.map((char) => (
                    <div key={char.id} className="p-4 border border-[var(--border)] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-[var(--accent)]">{char.name[0]}</span>
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{char.name}</div>
                          <div className="text-sm text-[var(--text-muted)]">{char.identity || char.role}</div>
                        </div>
                      </div>
                      {char.overview && (
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">{char.overview}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-muted)]">暂无角色数据，请先在「角色」步骤中添加角色。</p>
              )}
            </div>
          </div>
        )
      case 'scenes':
        return (
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[var(--accent)]" />
                场景/布景
              </h3>
              {outlineData?.content?.episodes ? (
                <div className="space-y-4">
                  {outlineData.content.episodes.map((ep: any) => (
                    <div key={ep.episodeNumber} className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <span className="font-medium text-[var(--text-primary)]">第 {ep.episodeNumber} 集：{ep.title}</span>
                      </div>
                      <div className="p-4">
                        <div className="text-sm text-[var(--text-secondary)]">
                          <strong>高光时刻：</strong>{ep.highlight || '未设置'}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-2">
                          <strong>钩子：</strong>{ep.hook || '未设置'}
                        </div>
                        {ep.keyEvents && ep.keyEvents.length > 0 && (
                          <div className="mt-3">
                            <strong className="text-sm text-[var(--text-secondary)]">关键事件：</strong>
                            <ul className="mt-1 space-y-1">
                              {ep.keyEvents.map((event: string, i: number) => (
                                <li key={i} className="text-sm text-[var(--text-muted)] pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent)]">
                                  {event}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-muted)]">暂无大纲数据，请先在「大纲」步骤中生成大纲。</p>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // 渲染当前步骤的内容面板
  const renderStepContent = () => {
    switch (currentStep) {
      case 'worldview':
        return (
          <WorkflowLayout projectId={projectId} step="worldview" onGenerate={handleGenerate}>
            <WorldviewPanel
              projectId={projectId}
              onGenerate={handleGenerate}
              onSkip={() => {
                markCompleted('worldview')
                setCurrentStep('synopsis')
              }}
              onUpload={() => setShowUpload(true)}
            />
          </WorkflowLayout>
        )
      case 'synopsis':
        return (
          <WorkflowLayout projectId={projectId} step="synopsis" onGenerate={handleGenerate}>
            <SynopsisPanel
              projectId={projectId}
              onGenerate={handleGenerate}
              onSkip={() => {
                markCompleted('synopsis')
                setCurrentStep('characters')
              }}
            />
          </WorkflowLayout>
        )
      case 'characters':
        return (
          <WorkflowLayout projectId={projectId} step="characters" onGenerate={handleGenerate}>
            <CharacterPanel
              projectId={projectId}
              characters={currentProject?.characters || []}
              onRefresh={() => fetchProject(projectId)}
            />
          </WorkflowLayout>
        )
      case 'outline':
        return (
          <WorkflowLayout projectId={projectId} step="outline" onGenerate={handleGenerate}>
            <OutlinePanel
              projectId={projectId}
              projectType={currentProject?.format === 'movie' ? 'feature_film' : 'short_drama'}
              onGenerate={handleGenerate}
              onReview={handleAIReview}
            />
          </WorkflowLayout>
        )
      case 'script':
        return (
          <div className="flex h-full">
            {/* 左侧场景导航 */}
            <div className="w-56 flex-shrink-0 border-r border-[var(--border-light)] overflow-y-auto scrollbar-thin bg-[var(--bg-card)]">
              <SceneNav
                onSceneClick={handleSceneClick}
                outlineData={outlineData}
                onExport={() => setShowExport(true)}
              />
            </div>
            {/* 中间编辑器 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <EditorToolbar
                activeTab={activeScriptTab}
                onTabChange={setActiveScriptTab}
                onSave={requestSave}
                onAIGenerate={activeScriptTab === 'content' ? handleScriptSend.bind(null, '请生成剧本') : undefined}
                onAIReview={activeScriptTab === 'content' ? handleAIReview : undefined}
                projectId={projectId}
              />
              {renderScriptTabContent()}
            </div>
            {/* 右侧 AI 对话面板 */}
            <ResizablePanel
              defaultWidth={480}
              minWidth={360}
              storageKey="agent-chat-width"
              side="left"
              className="border-l border-[var(--border-light)]"
            >
              <AgentChat
                projectId={projectId}
                workflowStep="script"
                onSend={handleScriptSend}
              />
            </ResizablePanel>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工作流标签栏 */}
      <WorkflowTabs
        currentStep={currentStep}
        stepStatuses={stepStatuses}
        onStepChange={handleStepChange}
      />

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {renderStepContent()}
      </div>

      {/* 上传对话框 */}
      <UploadDialog
        projectId={projectId}
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => fetchProject(projectId)}
      />

      {/* 导出对话框 */}
      <ExportDialog
        projectId={projectId}
        open={showExport}
        onClose={() => setShowExport(false)}
      />
    </div>
  )
}
