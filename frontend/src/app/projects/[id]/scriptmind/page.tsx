'use client'

import { useParams } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { ScriptEditor } from '@/components/scriptmind/script-editor'
import { CharacterPanel } from '@/components/scriptmind/character-panel'
import { ForeshadowTracker } from '@/components/scriptmind/foreshadow-tracker'
import { SceneNav } from '@/components/scriptmind/scene-nav'

export default function ScriptmindPage() {
  const params = useParams()
  const projectId = params.id as string
  const { currentProject } = useProjectStore()

  return (
    <div className="flex h-[calc(100vh-7rem)]">
      <div className="w-56 flex-shrink-0 border-r border-[var(--border-light)] overflow-y-auto scrollbar-thin bg-[var(--bg-card)]">
        <SceneNav />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ScriptEditor projectId={projectId} script={currentProject?.script || null} />
      </div>
      <div className="w-80 flex-shrink-0 border-l border-[var(--border-light)] overflow-y-auto scrollbar-thin bg-[var(--bg-card)]">
        <div className="p-5 space-y-6">
          <CharacterPanel projectId={projectId} characters={currentProject?.characters || []} />
          <ForeshadowTracker projectId={projectId} foreshadows={currentProject?.foreshadows || []} />
        </div>
      </div>
    </div>
  )
}
