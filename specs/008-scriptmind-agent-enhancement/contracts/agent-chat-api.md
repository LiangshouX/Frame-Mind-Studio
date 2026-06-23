# Agent Chat API Contract

**Date**: 2026-06-23
**Feature**: 008-scriptmind-agent-enhancement

## Overview

This contract defines the REST API and WebSocket protocol for the enhanced ScriptMind agent chat system.

## REST Endpoints

### POST `/api/v1/projects/{projectId}/agent/chat`

Send a message to the agent for a specific workflow tab. Creates or reuses a chat session.

**Request**:
```json
{
  "workflow_step": "worldview",
  "message": "帮我构思一个科幻题材的短剧创意",
  "preset": "suspense"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_step` | string | Yes | `worldview`/`synopsis`/`characters`/`outline`/`script` |
| `message` | string | Yes | User message content |
| `preset` | string | No | Style preset: `sweet`/`suspense`/`revenge`/`ancient`/`marvel`/`comedy` |

**Response**: `202 Accepted`
```json
{
  "session_id": "uuid",
  "websocket_url": "/ws/agent/{session_id}"
}
```

### POST `/api/v1/projects/{projectId}/agent/generate`

Trigger an AI generation action (the "AI一键生成" button). Sends a pre-configured prompt to the agent.

**Request**:
```json
{
  "workflow_step": "characters",
  "action": "generate_all"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_step` | string | Yes | Target workflow step |
| `action` | string | Yes | Generation action (step-specific) |

**Step-specific actions**:
- `worldview`: `generate_concept`
- `synopsis`: `generate_synopsis`
- `characters`: `generate_all`
- `outline`: `generate_outline`
- `script`: `generate_script`

**Response**: `202 Accepted`
```json
{
  "session_id": "uuid",
  "websocket_url": "/ws/agent/{session_id}"
}
```

### GET `/api/v1/projects/{projectId}/agent/sessions/{workflowStep}`

Get chat history for a specific workflow step.

**Response**: `200 OK`
```json
{
  "session_id": "uuid",
  "workflow_step": "worldview",
  "agent_name": "creative_agent",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "帮我构思一个科幻题材",
      "message_type": "text",
      "metadata": null,
      "message_order": 1,
      "created_at": "2026-06-23T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "基于当前市场趋势分析...",
      "message_type": "text",
      "metadata": null,
      "message_order": 2,
      "created_at": "2026-06-23T10:00:05Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "",
      "message_type": "tool_call",
      "metadata": {
        "tool_name": "web_search",
        "tool_input": {"query": "2026年热门科幻短剧"},
        "status": "completed"
      },
      "message_order": 3,
      "created_at": "2026-06-23T10:00:06Z"
    }
  ],
  "created_at": "2026-06-23T10:00:00Z",
  "updated_at": "2026-06-23T10:05:00Z"
}
```

### Agent Configuration Endpoints

#### GET `/api/v1/projects/{projectId}/agent/config/{agentName}`

Get merged agent configuration (global defaults + project overrides).

**Response**: `200 OK`
```json
{
  "agent_name": "creative_agent",
  "system_prompt": "...",
  "skills": ["web_search"],
  "rules": ["输出JSON格式"],
  "model_override": null,
  "is_project_override": true,
  "version": 3
}
```

#### PUT `/api/v1/projects/{projectId}/agent/config/{agentName}`

Save project-level agent configuration override.

**Request**:
```json
{
  "system_prompt": "自定义系统提示词...",
  "skills": ["web_search", "market_analysis"],
  "rules": ["输出JSON格式", "每次不超过500字"],
  "model_override": "deepseek/deepseek-chat"
}
```

**Response**: `200 OK`
```json
{
  "agent_name": "creative_agent",
  "version": 4,
  "updated_at": "2026-06-23T10:10:00Z"
}
```

#### DELETE `/api/v1/projects/{projectId}/agent/config/{agentName}`

Delete project-level override (revert to global defaults).

**Response**: `204 No Content`

## WebSocket Protocol

### Connection

```
ws://localhost:8080/ws/agent/{session_id}
```

### Message Envelope

All messages follow this envelope:
```json
{
  "type": "<message_type>",
  "data": { ... }
}
```

### Server → Client Messages

#### `stream_chunk` — Streaming text content
```json
{
  "type": "stream_chunk",
  "data": {
    "agent_name": "creative_agent",
    "content": "基于当前市场",
    "delta": true
  }
}
```

#### `thinking_block` — Agent reasoning (collapsible)
```json
{
  "type": "thinking_block",
  "data": {
    "agent_name": "creative_agent",
    "block_id": "uuid",
    "status": "start|delta|end",
    "content": "用户想要科幻题材，我需要考虑..."
  }
}
```

#### `tool_call` — Tool invocation (collapsible)
```json
{
  "type": "tool_call",
  "data": {
    "agent_name": "creative_agent",
    "block_id": "uuid",
    "status": "start|delta|end",
    "tool_name": "web_search",
    "tool_input": {"query": "2026年科幻短剧趋势"},
    "tool_result": "搜索结果..."
  }
}
```

#### `tool_result` — Tool execution result
```json
{
  "type": "tool_result",
  "data": {
    "agent_name": "creative_agent",
    "block_id": "uuid",
    "tool_name": "web_search",
    "output": "搜索结果内容..."
  }
}
```

#### `complete` — Generation finished
```json
{
  "type": "complete",
  "data": {
    "session_id": "uuid",
    "tokens_consumed": 1500,
    "agent_name": "creative_agent"
  }
}
```

#### `error` — Error occurred
```json
{
  "type": "error",
  "data": {
    "error_code": "RATE_LIMIT_EXCEEDED",
    "message": "API调用频率超限，请稍后重试"
  }
}
```

#### `budget_warning` — Token budget warning
```json
{
  "type": "budget_warning",
  "data": {
    "tokens_used": 800000,
    "token_limit": 1000000,
    "threshold": 0.8
  }
}
```

#### `conflict_detected` — Concurrent edit conflict
```json
{
  "type": "conflict_detected",
  "data": {
    "entity_type": "character",
    "entity_id": "uuid",
    "current_version": 5,
    "expected_version": 4,
    "message": "角色数据已被修改，请选择保留版本"
  }
}
```
