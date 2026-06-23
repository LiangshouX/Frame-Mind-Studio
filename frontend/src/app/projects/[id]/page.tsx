'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * 旧的工作台页面 — 直接重定向到 scriptmind。
 * 保留路由以兼容外部深链接。
 */
export default function ProjectRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  useEffect(() => {
    router.replace(`/projects/${projectId}/scriptmind`)
  }, [projectId, router])

  return null
}
