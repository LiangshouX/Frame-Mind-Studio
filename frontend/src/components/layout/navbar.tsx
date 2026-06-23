'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clapperboard, Settings, Loader2 } from 'lucide-react'
import { useAgentStore } from '@/stores/agent-store'

const STEP_LABELS: Record<string, string> = {
  worldview: '世界观',
  synopsis: '梗概',
  characters: '角色',
  outline: '大纲',
  script: '剧本',
}

export function Navbar() {
  const pathname = usePathname()
  const { sessions, activeTab } = useAgentStore()
  const currentTab = sessions[activeTab]
  const isRunning = currentTab?.isRunning || false

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[var(--bg-card)] border-b border-[var(--border)] z-50 flex items-center px-6 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2.5 mr-8 group">
        <Clapperboard className="h-5 w-5 text-[var(--accent)] transition-transform group-hover:scale-110" />
        <span className="font-display text-base font-bold tracking-tight text-[var(--text-primary)]">Frame Mind Studio</span>
      </Link>

      <div className="flex-1 flex items-center gap-6">
        <Link
          href="/projects"
          className={`text-sm font-medium transition-colors ${
            pathname.startsWith('/projects')
              ? 'text-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          项目
        </Link>
      </div>

      {isRunning && (
        <div className="flex items-center gap-2 mr-4 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/15">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
          <span className="text-sm text-[var(--accent)] font-medium">
            {STEP_LABELS[activeTab] || activeTab} 生成中...
          </span>
        </div>
      )}

      <Link
        href="/settings"
        className={`p-2 rounded-lg transition-colors ${
          pathname === '/settings'
            ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        <Settings className="h-5 w-5" />
      </Link>
    </nav>
  )
}
