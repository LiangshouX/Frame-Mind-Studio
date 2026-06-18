'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/stores/project-store'
import { formatDate, formatWordCount } from '@/lib/utils/format'
import { FileText, Upload } from 'lucide-react'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const { currentProject } = useProjectStore()

  if (!currentProject) {
    return <div className="flex items-center justify-center min-h-[50vh] text-[var(--text-muted)] text-lg">加载中...</div>
  }

  const modules = [
    { title: '剧本工厂', description: 'AI Agent 协作生成大纲，专业编辑器打磨剧本', icon: FileText, href: `/projects/${projectId}/scriptmind`, primary: true },
    { title: '导入文件', description: '从小说文件或网页 URL 导入内容', icon: Upload, href: `/projects/${projectId}/scriptmind/import` },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold mb-3 text-[var(--text-primary)]">{currentProject.title}</h1>
        <div className="flex items-center gap-4 text-base text-[var(--text-secondary)]">
          <span className="text-[var(--accent)] font-medium">{currentProject.genre.join(' · ')}</span>
          <span className="text-[var(--border)]">|</span>
          <span>{currentProject.target_episodes} 集</span>
          <span className="text-[var(--border)]">|</span>
          <span>更新于 {formatDate(currentProject.updated_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map((mod) => (
          <Link key={mod.title} href={mod.href}
            className={`group p-8 rounded-xl border transition-all ${
              mod.primary
                ? 'border-[var(--accent)]/20 bg-[var(--accent-subtle)] hover:border-[var(--accent)] hover:shadow-medium'
                : 'card'
            }`}
          >
            <mod.icon className={`h-8 w-8 mb-4 ${mod.primary ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
            <h3 className="font-display text-xl font-bold mb-2 text-[var(--text-primary)]">{mod.title}</h3>
            <p className="text-base text-[var(--text-secondary)]">{mod.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '状态', value: currentProject.status },
          { label: '字数', value: formatWordCount(currentProject.script?.word_count || 0) },
          { label: '角色', value: currentProject.characters?.length || 0 },
          { label: 'Token 用量', value: currentProject.budget ? `${Math.round(currentProject.budget.tokens_used / 1000)}k` : '0' },
        ].map((item) => (
          <div key={item.label} className="p-5 card">
            <div className="text-sm text-[var(--text-muted)] mb-2">{item.label}</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
