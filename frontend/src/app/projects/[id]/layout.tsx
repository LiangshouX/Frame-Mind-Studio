'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { ProjectSidebar } from '@/components/shared/project-sidebar'
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
      <main className="pt-14 flex h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col w-52 flex-shrink-0 border-r border-[var(--border-light)] bg-[var(--bg-card)]">
          <div className="px-4 py-4 border-b border-[var(--border-light)]">
            <h2 className="font-display text-sm font-bold truncate text-[var(--text-primary)]">
              {currentProject?.title || '...'}
            </h2>
          </div>
          <ProjectSidebar projectId={projectId} />
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </>
  )
}
