export interface QualityMetrics {
  hook_strength: MetricItem
  rhythm_curve: MetricItem
  character_balance: MetricItem
  dialogue_ratio: MetricItem
  scene_diversity: MetricItem
  foreshadow_status: ForeshadowStatus
  overall_score: number
}

export interface MetricItem {
  value: number
  target: number | null
  target_range: [number, number] | null
  status: 'pass' | 'warning'
  details: string
}

export interface ForeshadowStatus {
  total: number
  resolved: number
  unresolved: number
  status: 'pass' | 'warning'
  details: string
}
