'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown, Film, Hash, List } from 'lucide-react'

interface SceneEntry {
  id: string
  label: string
  sceneNumber: number
  episodeNumber?: number
}

interface SceneNavProps {
  scenes: SceneEntry[]
  activeSceneId: string | null
  onSceneClick: (sceneId: string) => void
  className?: string
}

/** Group scenes by episode number. Scenes without episode go into "未分组". */
function groupByEpisode(scenes: SceneEntry[]): Map<number | string, SceneEntry[]> {
  const groups = new Map<number | string, SceneEntry[]>()
  for (const scene of scenes) {
    const key = scene.episodeNumber ?? 'ungrouped'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(scene)
  }
  return groups
}

export function SceneNav({ scenes, activeSceneId, onSceneClick, className }: SceneNavProps) {
  const [collapsedEps, setCollapsedEps] = useState<Set<number | string>>(new Set())

  const groups = groupByEpisode(scenes)
  const hasEpisodes = scenes.some((s) => s.episodeNumber != null)

  const toggleEpisode = (ep: number | string) => {
    setCollapsedEps((prev) => {
      const next = new Set(prev)
      if (next.has(ep)) next.delete(ep)
      else next.add(ep)
      return next
    })
  }

  return (
    <div className={cn('flex flex-col h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-light)]', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-light)]">
        <List className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        <span className="font-mono text-xs tracking-[0.1em] text-[var(--text-muted)] uppercase">
          场景导航
        </span>
        <span className="ml-auto font-mono text-xs text-[var(--text-muted)]">
          {scenes.length}
        </span>
      </div>

      {/* Scene list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {scenes.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Film className="h-5 w-5 text-[var(--border)] mx-auto mb-2" />
            <p className="text-xs text-[var(--text-muted)]">暂无场景</p>
          </div>
        ) : hasEpisodes ? (
          // Grouped by episode
          Array.from(groups.entries()).map(([epNum, epScenes]) => {
            const isCollapsed = collapsedEps.has(epNum)
            const isUngrouped = epNum === 'ungrouped'

            return (
              <div key={String(epNum)}>
                {/* Episode header */}
                <button
                  onClick={() => toggleEpisode(epNum)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" />
                  )}
                  {isUngrouped ? '未分组' : `第 ${epNum} 集`}
                  <span className="ml-auto font-mono text-[0.625rem] text-[var(--text-muted)]">
                    {epScenes.length} 场
                  </span>
                </button>

                {/* Scenes under episode */}
                {!isCollapsed &&
                  epScenes.map((scene) => (
                    <SceneItem
                      key={scene.id}
                      scene={scene}
                      isActive={scene.id === activeSceneId}
                      onClick={() => onSceneClick(scene.id)}
                    />
                  ))}
              </div>
            )
          })
        ) : (
          // Flat list (no episodes)
          scenes.map((scene) => (
            <SceneItem
              key={scene.id}
              scene={scene}
              isActive={scene.id === activeSceneId}
              onClick={() => onSceneClick(scene.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SceneItem({
  scene,
  isActive,
  onClick,
}: {
  scene: SceneEntry
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 pl-7 pr-3 py-1.5 text-left transition-colors group',
        isActive
          ? 'bg-[var(--accent-light)] text-[var(--accent)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
      )}
    >
      {/* Scene number badge */}
      <span
        className={cn(
          'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[0.625rem] font-mono font-bold',
          isActive
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-light)]'
        )}
      >
        {scene.sceneNumber}
      </span>

      {/* Scene label — truncated */}
      <span className="flex-1 text-xs truncate">
        {scene.label || `场景 ${scene.sceneNumber}`}
      </span>
    </button>
  )
}
