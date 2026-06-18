'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MODULES = [
  { id: 'scriptmind', label: '剧本工厂', path: '/scriptmind' },
  { id: 'storyboard', label: '分镜', path: '/storyboard', disabled: true },
  { id: 'styleforge', label: '风格', path: '/styleforge', disabled: true },
  { id: 'motioncore', label: '动态', path: '/motioncore', disabled: true },
  { id: 'voicestage', label: '配音', path: '/voicestage', disabled: true },
  { id: 'export', label: '导出', path: '/export', disabled: true },
]

interface PipelineNavProps { projectId: string }

export function PipelineNav({ projectId }: PipelineNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
      {MODULES.map((mod) => {
        const href = `/projects/${projectId}${mod.path}`
        const isActive = pathname.startsWith(href)

        if (mod.disabled) {
          return <span key={mod.id} className="px-4 py-2 text-sm text-[var(--text-muted)] opacity-40 cursor-not-allowed whitespace-nowrap">{mod.label}</span>
        }

        return (
          <Link key={mod.id} href={href}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              isActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >{mod.label}</Link>
        )
      })}
    </div>
  )
}
