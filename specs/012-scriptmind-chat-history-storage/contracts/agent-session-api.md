# API Contract: Agent Session Management

**Base URL**: `/api/v1/projects/{projectId}/agent`

> **Note**: 早期实现使用了非 RESTful 路径（`/session-list`、`/session-create` 等），
> V2 已修正为以下 RESTful 端点。旧端点 `/history/{workflowStep}` 保留作为兼容。

## 1. 获取会话列表

**GET** `/sessions?workflow_step={step}&page={page}&size={size}`

**Query Parameters**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| workflow_step | string | 是 | 工作流步骤 (worldview/synopsis/characters/outline/script) |
| page | int | 否 | 页码，默认 0 |
| size | int | 否 | 每页数量，默认 20 |

**Response 200**:
```json
{
  "content": [
    {
      "id": "uuid",
      "workflow_step": "outline",
      "agent_name": "outline_agent",
      "status": "completed",
      "title": "主角背景故事讨论",
      "tokens_consumed": 1234,
      "created_at": "2026-06-25T10:30:00",
      "message_count": 8
    }
  ],
  "total_elements": 15,
  "total_pages": 1,
  "number": 0
}
```

---

## 2. 获取单个会话详情（含消息）

**GET** `/sessions/{sessionId}`

**Response 200**:
```json
{
  "id": "uuid",
  "workflow_step": "outline",
  "agent_name": "outline_agent",
  "status": "completed",
  "title": "主角背景故事讨论",
  "tokens_consumed": 1234,
  "created_at": "2026-06-25T10:30:00",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "请帮我设计主角的背景故事",
      "message_type": "text",
      "metadata": null,
      "message_order": 1,
      "created_at": "2026-06-25T10:30:00"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "好的，让我思考一下...",
      "message_type": "thinking",
      "metadata": { "thinking": "用户需要一个有深度的主角背景..." },
      "message_order": 2,
      "created_at": "2026-06-25T10:30:01"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "以下是主角背景故事的设计方案...",
      "message_type": "text",
      "metadata": null,
      "message_order": 3,
      "created_at": "2026-06-25T10:30:05"
    }
  ]
}
```

---

## 3. 创建新会话

**POST** `/sessions`

**Request Body**:
```json
{
  "workflow_step": "outline"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "workflow_step": "outline",
  "agent_name": "outline_agent",
  "status": "pending",
  "title": null,
  "created_at": "2026-06-25T11:00:00"
}
```

---

## 4. 更新会话标题

**PATCH** `/sessions/{sessionId}/title`

**Request Body**:
```json
{
  "title": "用户自定义标题"
}
```

**Response 200**:
```json
{
  "id": "uuid",
  "title": "用户自定义标题"
}
```

---

## 5. 删除会话

**DELETE** `/sessions/{sessionId}`

**Response 204**: No Content

---

## 6. 发送消息（修改现有端点）

**POST** `/chat`

**Request Body** (新增 `session_id` 字段):
```json
{
  "workflow_step": "outline",
  "message": "请帮我设计主角的背景故事",
  "session_id": "uuid-可选-为空则创建新会话"
}
```

**Response 202** (不变):
```json
{
  "session_id": "uuid",
  "websocket_url": "ws://localhost:8080/ws/agent/{session_id}"
}
```

---

## 错误响应

**404 Not Found**:
```json
{
  "error": "SESSION_NOT_FOUND",
  "message": "会话不存在: {sessionId}"
}
```

**400 Bad Request**:
```json
{
  "error": "INVALID_WORKFLOW_STEP",
  "message": "无效的工作流步骤: {step}"
}
```
