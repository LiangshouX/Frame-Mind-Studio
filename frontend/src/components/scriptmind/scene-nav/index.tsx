'use client'

import { useEditorStore } from '@/stores/editor-store'

interface SceneNavProps {
  onSceneClick?: (sceneId: string) => void
}

export function SceneNav({ onSceneClick }: SceneNavProps) {
  const { sceneList } = useEditorStore()

  if (sceneList.length === 0) return <div className="p-4 text-sm text-[var(--text-muted)]">暂无场景</div>

  return (
    <div className="p-3">
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
