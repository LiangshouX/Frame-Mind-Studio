/**
 * 工作流 API 客户端
 * 提供工作流各步骤的 CRUD 操作和 AI 生成接口
 */

import { apiFetch } from './client'
import type {
  WorldSetting,
  WorldSettingContent,
  Synopsis,
  SynopsisContent,
  Outline,
  OutlineContent,
  ReviewReport,
  OptimizeSuggestion,
} from '@/types/workflow'

// ─── 世界观设定 ──────────────────────────────────────────────────

/** 获取世界观设定（404 表示尚未创建，返回 null） */
export async function getWorldSetting(projectId: string): Promise<WorldSetting | null> {
  try {
    return await apiFetch<WorldSetting>(`/projects/${projectId}/world-setting`)
  } catch (error: any) {
    if (error?.status === 404) return null
    return null
  }
}

/** 创建或更新世界观设定 */
export async function saveWorldSetting(
  projectId: string,
  content: WorldSettingContent
): Promise<WorldSetting> {
  return apiFetch<WorldSetting>(`/projects/${projectId}/world-setting`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

// ─── 梗概 ────────────────────────────────────────────────────────

/** 获取梗概（404 表示尚未创建，返回 null） */
export async function getSynopsis(projectId: string): Promise<Synopsis | null> {
  try {
    return await apiFetch<Synopsis>(`/projects/${projectId}/synopsis`)
  } catch (error: any) {
    if (error?.status === 404) return null
    return null
  }
}

/** 创建或更新梗概 */
export async function saveSynopsis(
  projectId: string,
  content: SynopsisContent
): Promise<Synopsis> {
  return apiFetch<Synopsis>(`/projects/${projectId}/synopsis`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  })
}

// ─── 大纲 ────────────────────────────────────────────────────────

/** 获取大纲（404 表示尚未创建，返回 null） */
export async function getOutline(projectId: string): Promise<Outline | null> {
  try {
    return await apiFetch<Outline>(`/projects/${projectId}/outline`)
  } catch (error: any) {
    // 404 表示大纲尚未创建，静默处理
    if (error?.status === 404) return null
    // 其他错误也返回 null，由 UI 展示空状态
    return null
  }
}

/** 创建或更新大纲（全量覆盖） */
export async function saveOutline(
  projectId: string,
  content: OutlineContent,
  format: 'episode_list' | 'act_structure'
): Promise<Outline> {
  return apiFetch<Outline>(`/projects/${projectId}/outline`, {
    method: 'PUT',
    body: JSON.stringify({ content, format }),
  })
}

/** 更新单集大纲 */
export async function updateOutlineEpisode(
  projectId: string,
  episodeNumber: number,
  episodeContent: Record<string, unknown>
): Promise<Outline> {
  return apiFetch<Outline>(`/projects/${projectId}/outline/episodes/${episodeNumber}`, {
    method: 'PUT',
    body: JSON.stringify(episodeContent),
  })
}

// ─── 审查报告 ────────────────────────────────────────────────────

/** 获取审查报告列表 */
export async function getReviewReports(
  projectId: string,
  scope?: 'full' | 'episode'
): Promise<ReviewReport[]> {
  const params = scope ? `?scope=${scope}` : ''
  return apiFetch<ReviewReport[]>(`/projects/${projectId}/review-reports${params}`)
}

/** 获取单个审查报告 */
export async function getReviewReport(
  projectId: string,
  reportId: string
): Promise<ReviewReport> {
  return apiFetch<ReviewReport>(`/projects/${projectId}/review-reports/${reportId}`)
}

/** 更新审查问题状态 */
export async function updateReviewIssueStatus(
  projectId: string,
  reportId: string,
  issueId: string,
  status: 'accepted' | 'ignored' | 'manual'
): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/review-reports/${reportId}/issues/${issueId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ─── AI 工作流生成 ────────────────────────────────────────────────

/** AI 生成世界观设定 */
export async function generateWorldSetting(projectId: string): Promise<{
  session_id: string
  websocket_url: string
}> {
  return apiFetch(`/projects/${projectId}/workflow/generate-world-setting`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/** AI 生成梗概 */
export async function generateSynopsis(projectId: string): Promise<{
  session_id: string
  websocket_url: string
}> {
  return apiFetch(`/projects/${projectId}/workflow/generate-synopsis`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/** AI 生成角色 */
export async function generateCharacters(projectId: string): Promise<{
  session_id: string
  websocket_url: string
}> {
  return apiFetch(`/projects/${projectId}/workflow/generate-characters`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/** AI 生成大纲 */
export async function generateOutline(projectId: string): Promise<{
  session_id: string
  websocket_url: string
}> {
  return apiFetch(`/projects/${projectId}/workflow/generate-outline`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/** AI 生成剧本 */
export async function generateScript(
  projectId: string,
  episodeNumber?: number
): Promise<{ session_id: string; websocket_url: string }> {
  return apiFetch(`/projects/${projectId}/workflow/generate-script`, {
    method: 'POST',
    body: JSON.stringify({ episode_number: episodeNumber }),
  })
}

/** AI 审查剧本 */
export async function reviewScript(
  projectId: string,
  scope: 'full' | 'episode',
  episodeNumber?: number
): Promise<{ session_id: string; websocket_url: string }> {
  return apiFetch(`/projects/${projectId}/workflow/review`, {
    method: 'POST',
    body: JSON.stringify({ scope, episode_number: episodeNumber }),
  })
}

/** AI 优化选中文本 */
export async function optimizeText(
  projectId: string,
  selectedText: string,
  elementType: string
): Promise<{ suggestions: OptimizeSuggestion[] }> {
  return apiFetch(`/projects/${projectId}/workflow/optimize`, {
    method: 'POST',
    body: JSON.stringify({ selected_text: selectedText, element_type: elementType }),
  })
}

// ─── 内容导出 ────────────────────────────────────────────────────

/** 导出为 JSON */
export async function exportJson(projectId: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/projects/${projectId}/export/json`)
}

/** 导出为 Fountain（返回纯文本，不用 apiFetch 的 JSON 解析） */
export async function exportFountain(projectId: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/projects/${projectId}/export/fountain`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}
