'use client'

import { useEffect, useState } from 'react'
import { QualityMetrics } from '@/types/quality'
import * as qualityApi from '@/lib/api/quality'
import { MetricCard } from './metric-card'
import { ScoreRing } from './score-ring'

interface QualityDashboardProps {
  projectId: string
}

export function QualityDashboard({ projectId }: QualityDashboardProps) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await qualityApi.getQualityMetrics(projectId)
        setMetrics(data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) return <div className="text-sm text-[var(--text-muted)] p-4">加载中...</div>
  if (!metrics) return <div className="text-sm text-[var(--text-muted)] p-4">暂无质量数据</div>

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--text-muted)] uppercase tracking-wide font-medium">质量评估</div>
        <ScoreRing score={metrics.overall_score} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="钩子强度" metric={metrics.hook_strength} />
        <MetricCard label="节奏曲线" metric={metrics.rhythm_curve} />
        <MetricCard label="角色均衡" metric={metrics.character_balance} />
        <MetricCard label="对白占比" metric={metrics.dialogue_ratio} />
        <MetricCard label="场景多样性" metric={metrics.scene_diversity} />
        <div className={`p-4 rounded-xl border ${metrics.foreshadow_status.status === 'warning' ? 'border-[var(--warning)]/30 bg-[var(--warning-bg)]' : 'border-[var(--border-light)] bg-[var(--bg-card)]'}`}>
          <div className="text-sm text-[var(--text-muted)] mb-2 font-medium">伏笔状态</div>
          <div className="text-2xl font-bold">{metrics.foreshadow_status.resolved}/{metrics.foreshadow_status.total}</div>
          <div className="text-sm text-[var(--text-muted)] mt-2">{metrics.foreshadow_status.details}</div>
        </div>
      </div>
    </div>
  )
}
