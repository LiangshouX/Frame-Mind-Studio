'use client'

import { useState, useCallback, useEffect } from 'react'
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
import { EditorToolbar } from '@/components/scriptmind/script-editor/toolbar'
import { OptimizePanel } from '@/components/scriptmind/script-editor/optimize'
import { SceneNav } from '@/components/scriptmind/scene-nav'
import { AgentChat } from '@/components/shared/agent-chat'
import { useEditorStore } from '@/stores/editor-store'

export default function ScriptmindPage() {
  const params = useParams()
  const projectId = params.id as string
  const { currentProject } = useProjectStore()
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

  // 初始化工作流状态
  useEffect(() => {
    useWorkflowStore.getState().initialize()
  }, [])

  const handleStepChange = useCallback((step: WorkflowStep) => {
    setCurrentStep(step)
  }, [setCurrentStep])

  const handleGenerate = useCallback(() => {
    // AI 生成完成后的回调
    markCompleted(currentStep)
  }, [currentStep, markCompleted])

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

  // 渲染当前步骤的内容面板
  const renderStepContent = () => {
    switch (currentStep) {
      case 'worldview':
        return <WorldviewPanel projectId={projectId} onGenerate={handleGenerate} />
      case 'synopsis':
        return <SynopsisPanel projectId={projectId} onGenerate={handleGenerate} />
      case 'characters':
        return (
          <CharacterPanel
            projectId={projectId}
            characters={currentProject?.characters || []}
          />
        )
      case 'outline':
        return (
          <OutlinePanel
            projectId={projectId}
            projectType={currentProject?.format === 'movie' ? 'feature_film' : 'short_drama'}
            onGenerate={handleGenerate}
          />
        )
      case 'script':
        return (
          <div className="flex h-full">
            {/* 左侧场景导航 */}
            <div className="w-56 flex-shrink-0 border-r border-[var(--border-light)] overflow-y-auto scrollbar-thin bg-[var(--bg-card)]">
              <SceneNav onSceneClick={handleSceneClick} />
            </div>
            {/* 中间编辑器 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <EditorToolbar onSave={requestSave} />
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
            </div>
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
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：步骤内容面板 */}
        <div className="flex-1 overflow-hidden">
          {renderStepContent()}
        </div>

        {/* 右侧：AI 对话面板（剧本步骤时显示） */}
        {currentStep === 'script' && (
          <div className="w-[400px] flex-shrink-0 border-l border-[var(--border-light)]">
            <AgentChat
              projectId={projectId}
              onSend={async (message) => {
                // 发送消息到 AI
                console.log('Send message:', message)
              }}
              onApprove={async () => {
                // 审批 AI 输出
                console.log('Approve')
              }}
              onRevise={async (feedback) => {
                // 修订反馈
                console.log('Revise:', feedback)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
