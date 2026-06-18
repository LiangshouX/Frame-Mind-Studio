'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { useProjectStore } from '@/stores/project-store'

const GENRE_OPTIONS = ['都市', '复仇', '逆袭', '甜宠', '悬疑', '古风', '搞笑', '科幻', '校园', '职场']
const FORMAT_OPTIONS = [
  { value: 'short_drama', label: '短剧' },
  { value: 'comic', label: '漫画' },
  { value: 'movie', label: '电影' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject, isLoading } = useProjectStore()
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState<string[]>([])
  const [format, setFormat] = useState('short_drama')
  const [description, setDescription] = useState('')

  const toggleGenre = (g: string) => {
    setGenre((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || genre.length === 0) return
    try {
      const project = await createProject({ title: title.trim(), genre, format, description: description.trim() || undefined })
      router.push(`/projects/${project.id}`)
    } catch {}
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-10 text-[var(--text-primary)]">新建项目</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-base font-medium mb-3 text-[var(--text-primary)]">项目标题 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：逆袭女王" className="input" required />
          </div>

          <div>
            <label className="block text-base font-medium mb-3 text-[var(--text-primary)]">题材标签 * (可多选)</label>
            <div className="flex flex-wrap gap-2.5">
              {GENRE_OPTIONS.map((g) => (
                <button key={g} type="button" onClick={() => toggleGenre(g)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                    genre.includes(g)
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-medium shadow-sm'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >{g}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-medium mb-3 text-[var(--text-primary)]">目标形态</label>
            <div className="flex gap-3">
              {FORMAT_OPTIONS.map((f) => (
                <button key={f.value} type="button" onClick={() => setFormat(f.value)}
                  className={`px-5 py-2.5 text-sm rounded-lg border transition-all ${
                    format === f.value
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-medium shadow-sm'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >{f.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-medium mb-3 text-[var(--text-primary)]">项目描述 (可选)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简要描述你的创作想法..." rows={4} className="input resize-none" />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={!title.trim() || genre.length === 0 || isLoading} className="btn btn-primary px-8">
              {isLoading ? '创建中...' : '创建项目'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-ghost">取消</button>
          </div>
        </form>
      </main>
    </>
  )
}
