'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Clapperboard, Palette, Film, Mic2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  { id: 'scriptmind', label: '剧本工厂', href: '/scriptmind', icon: FileText },
  { id: 'storyboard', label: '智能分镜', href: '/storyboard', icon: Clapperboard, disabled: true },
  { id: 'styleforge', label: '形象工坊', href: '/styleforge', icon: Palette, disabled: true },
  { id: 'motioncore', label: '视频合成', href: '/motioncore', icon: Film, disabled: true },
  { id: 'voicestage', label: '声演剧场', href: '/voicestage', icon: Mic2, disabled: true },
  { id: 'export', label: '导出', href: '/export', icon: Download, disabled: true },
]

interface PipelineNavProps {
  projectId: string
}

export function PipelineNav({ projectId }: PipelineNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-light)] bg-[var(--bg-card)] overflow-x-auto">
      {STAGES.map((stage, i) => {
        const href = `/projects/${projectId}${stage.href}`
        const isActive = pathname.includes(stage.href)
        const Icon = stage.icon
        return (
          <div key={stage.id} className="flex items-center">
            {i > 0 && <div className="w-4 h-px bg-[var(--border)] mx-1" />}
            {stage.disabled ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--text-muted)] cursor-not-allowed opacity-50">
                <Icon className="h-3.5 w-3.5" />
                {stage.label}
              </span>
            ) : (
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors',
                  isActive
                    ? 'bg-[var(--accent-light)] text-[var(--accent)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)]'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {stage.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
