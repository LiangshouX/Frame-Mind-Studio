'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, FileText, PenTool, Clapperboard, Palette, Zap, Mic, Download } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path?: string
  disabled?: boolean
  children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'scriptmind',
    label: '剧本工厂',
    icon: <PenTool className="h-4 w-4" />,
    children: [
      { id: 'outline', label: '大纲', icon: <FileText className="h-3.5 w-3.5" />, path: '/scriptmind/outline' },
      { id: 'editor', label: '编辑器', icon: <PenTool className="h-3.5 w-3.5" />, path: '/scriptmind' },
    ],
  },
  { id: 'storyboard', label: '分镜', icon: <Clapperboard className="h-4 w-4" />, path: '/storyboard', disabled: true },
  { id: 'styleforge', label: '风格', icon: <Palette className="h-4 w-4" />, path: '/styleforge', disabled: true },
  { id: 'motioncore', label: '动态', icon: <Zap className="h-4 w-4" />, path: '/motioncore', disabled: true },
  { id: 'voicestage', label: '配音', icon: <Mic className="h-4 w-4" />, path: '/voicestage', disabled: true },
  { id: 'export', label: '导出', icon: <Download className="h-4 w-4" />, path: '/export', disabled: true },
]

interface ProjectSidebarProps {
  projectId: string
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname()
  const base = `/projects/${projectId}`

  // Determine which groups should be open based on current path
  const isScriptmindActive = pathname.includes('/scriptmind')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(isScriptmindActive ? ['scriptmind'] : []))

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <nav className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
      <div className="px-4 pt-4 pb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          模块
        </span>
      </div>

      <div className="flex-1 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          if (item.children) {
            // Collapsible group
            const isOpen = openGroups.has(item.id)
            const hasActiveChild = item.children.some((child) => {
              if (!child.path) return false
              const childHref = `${base}${child.path}`
              // For exact match paths (like /scriptmind which is a prefix of /scriptmind/outline)
              if (child.path === '/scriptmind') return pathname === childHref
              return pathname.startsWith(childHref)
            })

            return (
              <div key={item.id}>
                <button
                  onClick={() => toggleGroup(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hasActiveChild
                      ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </span>
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                </button>

                {isOpen && (
                  <div className="ml-5 pl-3 border-l border-[var(--border-light)] space-y-0.5 py-1">
                    {item.children.map((child) => {
                      const href = `${base}${child.path}`
                      const isActive = child.path === '/scriptmind'
                        ? pathname === href || pathname === `${base}/scriptmind`
                        : pathname.startsWith(href)

                      return (
                        <Link
                          key={child.id}
                          href={href}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                            isActive
                              ? 'text-[var(--accent)] font-medium bg-[var(--accent-subtle)]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          {child.icon}
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Single item (disabled or enabled)
          if (item.disabled) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] opacity-40 cursor-not-allowed"
              >
                {item.icon}
                {item.label}
              </div>
            )
          }

          const href = `${base}${item.path}`
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={item.id}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
