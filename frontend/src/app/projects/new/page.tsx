'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { createProject } from '@/lib/api/projects'

const GENRE_OPTIONS = ['都市', '复仇', '逆袭', '甜宠', '言情', '悬疑', '推理', '古装', '仙侠', '科幻', '喜剧', '日常']

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const project = await createProject({ title, genre: selectedGenres, description })
      router.push(`/projects/${project.id}`)
    } catch (e) {
      console.error(e)
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-8">新建项目</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">项目标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：逆袭女王"
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">题材标签</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                    selectedGenres.includes(g)
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">项目描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="简要描述你的项目..."
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="w-full px-5 py-2.5 bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? '创建中...' : '创建项目'}
          </button>
        </div>
      </main>
    </>
  )
}
