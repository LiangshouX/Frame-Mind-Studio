/**
 * Agent Chat API 客户端
 * 提供 Agent 聊天、生成、配置等接口
 */

import { apiFetch } from './client'
import type { AgentConfig, AgentSession, WorkflowStep } from '@/types/agent'

// ─── 聊天消息 ──────────────────────────────────────────────────

/** 发送聊天消息到 Agent */
export async function sendChatMessage(
  projectId: string,
  workflowStep: WorkflowStep,
  message: string,
  preset?: string,
  providerId?: string,
  modelName?: string,
  sessionId?: string
): Promise<{ session_id: string; websocket_url: string }> {
  return apiFetch(`/projects/${projectId}/agent/chat`, {
    method: 'POST',
    body: JSON.stringify({
      workflow_step: workflowStep,
      message,
      preset,
      provider_id: providerId,
      model_name: modelName,
      session_id: sessionId,
    }),
  })
}

/** 触发 AI 一键生成 */
export async function triggerGeneration(
  projectId: string,
  workflowStep: WorkflowStep,
  action: string,
  providerId?: string,
  modelName?: string
): Promise<{ session_id: string; websocket_url: string }> {
  return apiFetch(`/projects/${projectId}/agent/generate`, {
    method: 'POST',
    body: JSON.stringify({
      workflow_step: workflowStep,
      action,
      provider_id: providerId,
      model_name: modelName,
    }),
  })
}

/** 获取指定工作流步骤的聊天历史（兼容旧接口） */
export async function getChatHistory(
  projectId: string,
  workflowStep: WorkflowStep
): Promise<AgentSession | null> {
  try {
    return await apiFetch<AgentSession>(
      `/projects/${projectId}/agent/sessions/${workflowStep}`
    )
  } catch (error: any) {
    if (error?.status === 404) return null
    return null
  }
}

// ─── 会话管理 ──────────────────────────────────────────────────

/** 会话列表项 */
export interface SessionListItem {
  id: string
  workflow_step: WorkflowStep
  agent_name: string
  status: string
  title: string | null
  tokens_consumed: number
  message_count: number
  created_at: string
}

/** 分页会话列表响应 */
export interface SessionListPage {
  content: SessionListItem[]
  total_elements: number
  total_pages: number
  number: number
}

/** 获取会话列表（分页） */
export async function listSessions(
  projectId: string,
  workflowStep: WorkflowStep,
  page: number = 0,
  size: number = 20
): Promise<SessionListPage> {
  return apiFetch<SessionListPage>(
    `/projects/${projectId}/agent/session-list?workflow_step=${workflowStep}&page=${page}&size=${size}`
  )
}

/** 获取单个会话详情（含消息列表） */
export async function getSessionDetail(
  projectId: string,
  sessionId: string
): Promise<AgentSession | null> {
  try {
    return await apiFetch<AgentSession>(
      `/projects/${projectId}/agent/session-detail/${sessionId}`
    )
  } catch (error: any) {
    if (error?.status === 404) return null
    return null
  }
}

/** 创建新会话 */
export async function createSession(
  projectId: string,
  workflowStep: WorkflowStep
): Promise<{ id: string; workflow_step: string; status: string; title: string | null; created_at: string }> {
  return apiFetch(`/projects/${projectId}/agent/session-create`, {
    method: 'POST',
    body: JSON.stringify({ workflow_step: workflowStep }),
  })
}

/** 更新会话标题 */
export async function updateSessionTitle(
  projectId: string,
  sessionId: string,
  title: string
): Promise<{ id: string; title: string }> {
  return apiFetch(`/projects/${projectId}/agent/session-title/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

/** 删除会话 */
export async function deleteSession(
  projectId: string,
  sessionId: string
): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/agent/session-delete/${sessionId}`, {
    method: 'DELETE',
  })
}

// ─── Agent 配置 ────────────────────────────────────────────────

/** 获取 Agent 配置（合并后） */
export async function getAgentConfig(
  projectId: string,
  agentName: string
): Promise<AgentConfig> {
  return apiFetch<AgentConfig>(`/projects/${projectId}/agent/config/${agentName}`)
}

/** 保存 Agent 配置覆盖 */
export async function saveAgentConfig(
  projectId: string,
  agentName: string,
  config: {
    system_prompt: string
    skills: string[]
    rules: string[]
    model_override?: string
  }
): Promise<{ agent_name: string; version: number; updated_at: string }> {
  return apiFetch(`/projects/${projectId}/agent/config/${agentName}`, {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}

/** 删除 Agent 配置覆盖（恢复全局默认） */
export async function deleteAgentConfig(
  projectId: string,
  agentName: string
): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/agent/config/${agentName}`, {
    method: 'DELETE',
  })
}
