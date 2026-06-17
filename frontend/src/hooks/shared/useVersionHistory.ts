'use client'
import { useState, useCallback, useEffect } from 'react'
import { listVersions, getVersion, restoreVersion } from '@/lib/api/scriptmind'

export interface VersionEntry {
  id: string
  version_number: number
  change_summary: string
  change_source: string
  created_at: string
}

interface UseVersionHistoryOptions {
  projectId: string
  autoLoad?: boolean
}

interface UseVersionHistoryReturn {
  versions: VersionEntry[]
  total: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  restore: (versionId: string) => Promise<void>
  getVersionDetail: (versionId: string) => Promise<any>
}

export function useVersionHistory({ projectId, autoLoad = true }: UseVersionHistoryOptions): UseVersionHistoryReturn {
  const [versions, setVersions] = useState<VersionEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data: any = await listVersions(projectId)
      setVersions((data.items || []) as VersionEntry[])
      setTotal(data.total || 0)
    } catch (e: any) {
      setError(e.message || '获取版本历史失败')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const restore = useCallback(async (versionId: string) => {
    try {
      await restoreVersion(projectId, versionId)
      await refresh()
    } catch (e: any) {
      setError(e.message || '版本回溯失败')
      throw e
    }
  }, [projectId, refresh])

  const getVersionDetail = useCallback(async (versionId: string) => {
    return getVersion(projectId, versionId)
  }, [projectId])

  useEffect(() => {
    if (autoLoad) refresh()
  }, [autoLoad, refresh])

  return { versions, total, loading, error, refresh, restore, getVersionDetail }
}
