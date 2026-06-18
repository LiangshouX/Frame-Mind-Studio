'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { PipelineNav } from '@/components/shared/pipeline-nav'
import { useProjectStore } from '@/stores/project-store'

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const projectId = params.id as string
  const { currentProject, fetchProject } = useProjectStore()

  useEffect(() => {
    if (projectId) fetchProject(projectId)
  }, [projectId, fetchProject])

  return (
    <>
      <Navbar />
      <main className="pt-14">
        <div className="border-b border-[var(--border-light)] bg-[var(--bg-card)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-8">
            <h2 className="font-display text-lg font-bold truncate max-w-[240px]">
              {currentProject?.title || '...'}
            </h2>
            <PipelineNav projectId={projectId} />
          </div>
        </div>
        {children}
      </main>
    </>
  )
}
