import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '项目详情 | AI-DramaForge',
  description: '查看和编辑短剧项目',
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
