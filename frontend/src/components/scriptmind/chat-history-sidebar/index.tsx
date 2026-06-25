'use client'

import { useState, useCallback } from 'react'
import { useAgentStore } from '@/stores/agent-store'
import { updateSessionTitle } from '@/lib/api/agent-api'
import type { WorkflowStep } from '@/types/agent'

interface ChatHistorySidebarProps {
  projectId: string
  workflowStep: WorkflowStep
  /** 新建对话回调 */
  onNewChat: () => void
}

/**
 * 对话历史侧边栏组件。
 * 显示当前 workflow step 的会话列表，支持切换、新建、删除、编辑标题。
 */
export function ChatHistorySidebar({ projectId, workflowStep, onNewChat }: ChatHistorySidebarProps) {
  const {
    sessionsByTab,
    sessionListLoading,
    loadSessionList,
    switchSession,
    removeSession,
    updateSessionTitleLocal,
    sessions,
  } = useAgentStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sessionList = sessionsByTab[workflowStep] || []
  const currentSessionId = sessions[workflowStep]?.sessionId

  // 切换会话
  const handleSwitch = useCallback(async (sessionId: string) => {
    if (sessionId === currentSessionId) return
    await switchSession(projectId, sessionId, workflowStep)
  }, [projectId, workflowStep, currentSessionId, switchSession])

  // 开始编辑标题
  const handleStartEdit = useCallback((sessionId: string, currentTitle: string | null) => {
    setEditingId(sessionId)
    setEditingTitle(currentTitle || '')
  }, [])

  // 保存标题
  const handleSaveTitle = useCallback(async (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null)
      return
    }
    try {
      await updateSessionTitle(projectId, sessionId, editingTitle.trim())
      updateSessionTitleLocal(workflowStep, sessionId, editingTitle.trim())
    } catch {
      // 静默失败
    }
    setEditingId(null)
  }, [projectId, workflowStep, editingTitle, updateSessionTitleLocal])

  // 确认删除
  const handleConfirmDelete = useCallback(async (sessionId: string) => {
    await removeSession(projectId, sessionId, workflowStep)
    setDeletingId(null)
  }, [projectId, workflowStep, removeSession])

  // 格式化时间
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      if (isToday) {
        return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部：新建对话按钮 */}
      <div className="p-3 border-b border-[var(--border-light)]">
        <button
          onClick={onNewChat}
          className="w-full px-3 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
        >
          + 新建对话
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sessionListLoading ? (
          <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
            加载中...
          </div>
        ) : sessionList.length === 0 ? (
          <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">
            暂无对话记录，点击上方按钮开始新对话
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessionList.map((item) => {
              const isActive = item.id === currentSessionId
              const isEditing = editingId === item.id
              const isDeleting = deletingId === item.id

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[var(--bg-accent)] text-[var(--text-accent)]'
                      : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                  }`}
                  onClick={() => !isEditing && !isDeleting && handleSwitch(item.id)}
                >
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveTitle(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle(item.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full text-sm bg-transparent border border-[var(--border)] rounded px-1 py-0.5 outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="text-sm font-medium truncate">
                        {item.title || '未命名对话'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {formatTime(item.createdAt)}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {item.messageCount} 条消息
                        </span>
                      </div>
                    </>
                  )}

                  {/* 操作按钮（hover 显示） */}
                  {!isEditing && (
                    <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(item.id, item.title)
                        }}
                        className="p-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded"
                        title="编辑标题"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingId(item.id)
                        }}
                        className="p-1 text-xs text-[var(--text-tertiary)] hover:text-red-500 rounded"
                        title="删除对话"
                      >
                        🗑️
                      </button>
                    </div>
                  )}

                  {/* 删除确认 */}
                  {isDeleting && (
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-2 bg-[var(--bg-primary)] rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-[var(--text-secondary)]">确认删除？</span>
                      <button
                        onClick={() => handleConfirmDelete(item.id)}
                        className="px-2 py-0.5 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        删除
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-0.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded hover:bg-[var(--bg-tertiary)]"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
