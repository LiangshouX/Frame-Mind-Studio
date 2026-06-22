'use client'

import { useEditorStore } from '@/stores/editor-store'
import { ChevronDown, ChevronRight, Download } from 'lucide-react'
import { useState } from 'react'

interface SceneNavProps {
  onSceneClick?: (sceneId: string) => void
  outlineData?: any
  onExport?: () => void
}

export function SceneNav({ onSceneClick, outlineData, onExport }: SceneNavProps) {
  const { sceneList } = useEditorStore()
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set([1]))

  // 优先使用大纲数据，回退到 Slate 内容提取
  const episodes = outlineData?.content?.episodes || []
  const hasOutline = episodes.length > 0

  const toggleEpisode = (epNum: number) => {
    setExpandedEpisodes((prev) => {
      const next = new Set(prev)
      if (next.has(epNum)) {
        next.delete(epNum)
      } else {
        next.add(epNum)
      }
      return next
    })
  }

  if (!hasOutline && sceneList.length === 0) {
    return (
      <div className="p-3">
        {onExport && (
          <button
            onClick={onExport}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mb-3 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
        )}
        <div className="p-4 text-sm text-[var(--text-muted)]">暂无场景</div>
      </div>
    )
  }

  // 如果有大纲数据，使用大纲结构
  if (hasOutline) {
    return (
      <div className="p-3">
        {onExport && (
          <button
            onClick={onExport}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mb-3 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
        )}
        <div className="text-sm text-[var(--accent)] uppercase tracking-wide mb-3 px-2 font-medium">场景导航</div>
        {episodes.map((ep: any) => (
          <div key={ep.episodeNumber} className="mb-2">
            <button
              onClick={() => toggleEpisode(ep.episodeNumber)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              {expandedEpisodes.has(ep.episodeNumber) ? (
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              )}
              <span className="font-mono text-[var(--accent)] font-bold">EP{ep.episodeNumber}</span>
              <span className="text-[var(--text-secondary)] truncate">{ep.title}</span>
            </button>
            {expandedEpisodes.has(ep.episodeNumber) && (
              <div className="ml-6 mt-1 space-y-1">
                {/* 显示该集的关键事件作为场景节点 */}
                {ep.keyEvents && ep.keyEvents.length > 0 ? (
                  ep.keyEvents.map((event: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => onSceneClick?.(`EP${ep.episodeNumber}-E${i + 1}`)}
                      className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-secondary)] truncate"
                    >
                      {event}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-1.5 text-xs text-[var(--text-muted)]">暂无场景</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // 回退：使用 Slate 内容提取的场景列表
  return (
    <div className="p-3">
      {onExport && (
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mb-3 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
        >
          <Download className="h-3.5 w-3.5" />
          导出
        </button>
      )}
      <div className="text-sm text-[var(--accent)] uppercase tracking-wide mb-3 px-2 font-medium">场景导航</div>
      {sceneList.map((scene) => (
        <button
          key={scene.sceneId}
          onClick={() => onSceneClick?.(scene.sceneId)}
          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
        >
          <span className="font-mono text-[var(--accent)] mr-2 font-bold">{scene.sceneId}</span>
          <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{scene.location}</span>
        </button>
      ))}
    </div>
  )
}
