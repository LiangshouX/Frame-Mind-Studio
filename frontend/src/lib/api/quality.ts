import { apiFetch } from './client'
import { QualityMetrics } from '@/types/quality'

export async function getQualityMetrics(projectId: string): Promise<QualityMetrics> {
  return apiFetch<QualityMetrics>(`/projects/${projectId}/script/quality`)
}
