'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { EmptyState } from '@/components/layout/empty-state'
import { useProjectStore } from '@/stores/project-store'
import { formatDate } from '@/lib/utils/format'
import { Plus, FolderOpen, Trash2 } from 'lucide-react'

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, isLoading, fetchProjects, deleteProject } = useProjectStore()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleDelete = async () => {
    if (!deleteTarget || confirmText !== deleteTarget.title) return
    setDeleting(true)
    try {
      await deleteProject(deleteTarget.id)
      setDeleteTarget(null)
      setConfirmText('')
    } finally { setDeleting(false) }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">项目</h1>
          <Link href="/projects/new" className="btn btn-primary">
            <Plus className="h-5 w-5" />
            新建项目
          </Link>
        </div>

        {isLoading && projects.length === 0 ? (
          <div className="text-center py-24 text-[var(--text-muted)] text-lg">加载中...</div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-16 w-16" />}
            title="还没有项目"
            description="创建你的第一个项目，让 AI Agent 开始帮你写剧本。"
            action={
              <Link href="/projects/new" className="btn btn-primary">
                <Plus className="h-5 w-5" /> 创建第一个项目
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative p-6 card cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}/scriptmind`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display text-lg font-bold truncate flex-1 text-[var(--text-primary)]">{project.title}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: project.id, title: project.title }) }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.genre.map((g) => (
                    <span key={g} className="badge badge-gold">{g}</span>
                  ))}
                </div>
                <div className="text-sm text-[var(--text-muted)]">{formatDate(project.updated_at)}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 max-w-md w-full shadow-strong">
            <h3 className="font-display text-xl font-bold mb-3 text-[var(--text-primary)]">删除项目</h3>
            <p className="text-base text-[var(--text-secondary)] mb-6">
              此操作不可撤销。请输入项目名称 <strong className="text-[var(--text-primary)]">{deleteTarget.title}</strong> 确认删除。
            </p>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="输入项目名称" className="input mb-6" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDeleteTarget(null); setConfirmText('') }} className="btn btn-ghost">取消</button>
              <button onClick={handleDelete} disabled={confirmText !== deleteTarget.title || deleting} className="btn btn-danger">
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
