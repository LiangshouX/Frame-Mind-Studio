'use client'
import { useState, useCallback, useEffect } from 'react'
import { getQualityMetrics } from '@/lib/api/scriptmind'
import type { QualityMetrics } from '@/types/script'

interface UseQualityMetricsOptions {
  projectId: string
  autoLoad?: boolean
}

interface UseQualityMetricsReturn {
  metrics: QualityMetrics | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useQualityMetrics({ projectId, autoLoad = true }: UseQualityMetricsOptions): UseQualityMetricsReturn {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data: any = await getQualityMetrics(projectId)
      // Transform backend snake_case to frontend camelCase
      setMetrics({
        hookStrength: data.hook_strength || data.hookStrength || { value: 0, target: 1, status: 'pending', details: '' },
        rhythmCurve: data.rhythm_curve || data.rhythmCurve || { value: 0, target: 0.3, status: 'pending', details: '' },
        characterBalance: data.character_balance || data.characterBalance || { value: 0, targetRange: [0.4, 0.6], status: 'pending', details: '' },
        dialogueRatio: data.dialogue_ratio || data.dialogueRatio || { value: 0, targetRange: [0.3, 0.5], status: 'pending', details: '' },
        sceneDiversity: data.scene_diversity || data.sceneDiversity || { value: 0, target: 0.6, status: 'pending', details: '' },
        overallScore: data.overall_score || data.overallScore || 0,
      })
    } catch (e: any) {
      setError(e.message || '获取质量指标失败')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (autoLoad) refresh()
  }, [autoLoad, refresh])

  return { metrics, loading, error, refresh }
}
