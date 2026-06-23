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
  modelName?: string
): Promise<{ session_id: string; websocket_url: string }> {
  return apiFetch(`/projects/${projectId}/agent/chat`, {
    method: 'POST',
    body: JSON.stringify({
      workflow_step: workflowStep,
      message,
      preset,
      provider_id: providerId,
      model_name: modelName,
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

/** 获取指定工作流步骤的聊天历史 */
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
