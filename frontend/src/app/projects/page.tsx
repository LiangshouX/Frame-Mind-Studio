'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { useProjects } from '@/hooks/use-projects'
import { formatDate } from '@/lib/utils'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Loader2,
  Clapperboard,
  ChevronRight,
  Calendar,
  Layers,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; dot: string }> = {
  draft: { label: '草稿', dot: 'bg-[var(--text-muted)]' },
  in_progress: { label: '进行中', dot: 'bg-[var(--accent)]' },
  review: { label: '审核中', dot: 'bg-amber-500' },
  completed: { label: '已完成', dot: 'bg-emerald-600' },
}

type ViewMode = 'grid' | 'list'

export default function ProjectsPage() {
  const { projects, isLoading, error, addProject } = useProjects()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGenre, setNewGenre] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.genre?.some((g) => g.toLowerCase().includes(q))
    )
  }, [projects, search])

  async function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await addProject({
        title: newTitle,
        genre: newGenre.split(',').map((g) => g.trim()).filter(Boolean),
        targetEpisodes: 20,
        targetDurationMinutes: 2.5,
      })
      setShowCreate(false)
      setNewTitle('')
      setNewGenre('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">
              INT. 项目列表 — 白天
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">我的项目</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {projects.length} 个项目
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium rounded hover:bg-[var(--ink-700)] transition-colors"
              >
                <Plus className="h-4 w-4" />
                新建项目
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索项目名称或题材..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-light)] rounded focus:outline-none focus:border-[var(--text-primary)] transition-colors"
              />
            </div>
            <div className="flex border border-[var(--border-light)] rounded overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-2 transition-colors ${
                  view === 'grid'
                    ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                aria-label="网格视图"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 transition-colors ${
                  view === 'list'
                    ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                aria-label="列表视图"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-[var(--text-muted)] gap-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">加载中...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Clapperboard className="h-12 w-12 text-[var(--border)] mx-auto mb-4" />
              <h2 className="font-display text-lg font-bold mb-2">
                {search ? '没有找到匹配的项目' : '还没有项目'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {search ? '试试其他关键词' : '创建你的第一个短剧项目'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-sm rounded hover:border-[var(--text-primary)] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  新建项目
                </button>
              )}
            </div>
          ) : view === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => {
                const status = statusConfig[project.status] || statusConfig.draft
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block p-5 rounded border border-[var(--border-light)] bg-[var(--bg-card)] hover:border-[var(--border)] hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-display text-base font-bold group-hover:text-[var(--accent)] transition-colors">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span className="text-xs text-[var(--text-muted)]">{status.label}</span>
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {project.genre?.map((g) => (
                        <span
                          key={g}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-secondary)] border border-[var(--border-light)]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {project.targetEpisodes} 集
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.updatedAt || project.updated_at || '')}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            /* List View */
            <div className="border border-[var(--border-light)] rounded overflow-hidden">
              {filtered.map((project, i) => {
                const status = statusConfig[project.status] || statusConfig.draft
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={`group flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-card)] transition-colors ${
                      i > 0 ? 'border-t border-[var(--border-light)]' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-sm font-bold group-hover:text-[var(--accent)] transition-colors truncate">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          <span className="text-xs text-[var(--text-muted)]">{status.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex gap-1.5">
                          {project.genre?.slice(0, 3).map((g) => (
                            <span key={g} className="text-xs text-[var(--text-muted)]">
                              {g}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">·</span>
                        <span className="text-xs text-[var(--text-muted)]">{project.targetEpisodes} 集</span>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                      {formatDate(project.updatedAt || project.updated_at || '')}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Dialog */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded shadow-lg animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase mb-2">
                新建
              </div>
              <h2 className="font-display text-xl font-bold mb-6">创建项目</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                    项目标题
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="例如：逆袭女王"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border-light)] rounded focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                    题材标签
                    <span className="text-[var(--text-muted)] ml-1">(逗号分隔)</span>
                  </label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    placeholder="都市, 复仇, 逆袭"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border-light)] rounded focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || creating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium rounded hover:bg-[var(--ink-700)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
