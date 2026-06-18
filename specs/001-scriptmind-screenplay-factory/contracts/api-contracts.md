# API Contracts: ScriptMind 剧本工厂

**Date**: 2026-06-16
**Feature**: ScriptMind 剧本工厂
**Updated**: 2026-06-18 — 后端从 FastAPI 迁移至 Spring Boot

## Base URL

```
http://localhost:8080/api/v1
```

## WebSocket Endpoint

```
ws://localhost:8080/ws/agent/{session_id}
```

## Authentication

初始版本无认证机制。后续版本将引入 JWT 认证。

---

## 1. 项目管理 (Projects)

### POST /projects

创建新项目。

**Request**:
```json
{
  "title": "逆袭女王",
  "genre": ["都市", "复仇", "逆袭"],
  "format": "short_drama",
  "description": "一个现代都市复仇短剧"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "title": "逆袭女王",
  "genre": ["都市", "复仇", "逆袭"],
  "format": "short_drama",
  "description": "一个现代都市复仇短剧",
  "status": "draft",
  "target_episodes": 20,
  "created_at": "2026-06-16T10:00:00Z",
  "updated_at": "2026-06-16T10:00:00Z"
}
```

### GET /projects

获取项目列表。

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "逆袭女王",
      "genre": ["都市", "复仇"],
      "format": "short_drama",
      "status": "in_progress",
      "target_episodes": 20,
      "created_at": "2026-06-16T10:00:00Z",
      "updated_at": "2026-06-16T10:00:00Z"
    }
  ],
  "total": 1
}
```

### GET /projects/{project_id}

获取项目详情。

**Response** (200):
```json
{
  "id": "uuid",
  "title": "逆袭女王",
  "genre": ["都市", "复仇", "逆袭"],
  "format": "short_drama",
  "description": "一个现代都市复仇短剧",
  "status": "in_progress",
  "target_episodes": 20,
  "script": { ... },
  "characters": [ ... ],
  "foreshadows": [ ... ],
  "budget": {
    "token_limit": 1000000,
    "tokens_used": 150000,
    "warning_threshold": 0.80
  },
  "created_at": "2026-06-16T10:00:00Z",
  "updated_at": "2026-06-16T10:00:00Z"
}
```

### DELETE /projects/{project_id}

删除项目。

**Response** (204): No Content

---

## 2. 剧本管理 (Scripts)

### GET /projects/{project_id}/script

获取项目的剧本内容。

**Response** (200):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "逆袭女王",
  "content": { ... },
  "format_type": "fountain",
  "word_count": 15000,
  "scene_count": 45,
  "episode_count": 20,
  "version": 5,
  "created_at": "2026-06-16T10:00:00Z",
  "updated_at": "2026-06-16T10:30:00Z"
}
```

### PATCH /projects/{project_id}/script

更新剧本内容（手动编辑）。

**Request**:
```json
{
  "content": { ... },
  "change_summary": "修改第1集对白"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "content": { ... },
  "version": 6,
  "updated_at": "2026-06-16T10:35:00Z"
}
```

---

## 3. 版本管理 (Versions)

### GET /projects/{project_id}/script/versions

获取版本历史列表。

**Query Parameters**:
- `limit` (int, default 20): 返回数量
- `offset` (int, default 0): 偏移量

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "version": 5,
      "message": "修改第1集对白",
      "created_at": "2026-06-16T10:35:00Z"
    },
    {
      "id": "uuid",
      "version": 4,
      "message": "AI 优化第1集节奏",
      "created_at": "2026-06-16T10:30:00Z"
    }
  ],
  "total": 5
}
```

### GET /projects/{project_id}/script/versions/{version_id}

获取特定版本的完整内容。

**Response** (200):
```json
{
  "id": "uuid",
  "version": 4,
  "content": { ... },
  "message": "AI 优化第1集节奏",
  "created_at": "2026-06-16T10:30:00Z"
}
```

### POST /projects/{project_id}/script/versions/{version_id}/restore

回溯到指定版本。

**Response** (200):
```json
{
  "id": "uuid",
  "content": { ... },
  "version": 7,
  "updated_at": "2026-06-16T10:40:00Z"
}
```

### GET /projects/{project_id}/script/versions/compare

对比两个版本的差异。

**Query Parameters**:
- `from_version` (int): 起始版本号
- `to_version` (int): 目标版本号

**Response** (200):
```json
{
  "from_version": 3,
  "to_version": 5,
  "diff": {
    "episodes_added": [],
    "episodes_removed": [],
    "episodes_modified": [
      {
        "episode_number": 1,
        "scenes_modified": [
          {
            "scene_id": "S01E01_SC01",
            "beats_added": [],
            "beats_removed": [],
            "beats_modified": [
              {
                "beat_id": "S01E01_SC01_B02",
                "field": "content",
                "old_value": "这个方案不行。",
                "new_value": "这个方案不行，推翻重来。"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 4. Agent 任务 (Agent)

### POST /agent/generate-outline

生成剧本大纲。

**Request**:
```json
{
  "project_id": "uuid",
  "input_type": "one_sentence",
  "input_content": "写一个现代都市复仇短剧，女主被渣男背叛后逆袭",
  "style_preset": "revenge",
  "target_episodes": 20
}
```

**Response** (202 Accepted):
```json
{
  "session_id": "uuid",
  "status": "pending",
  "websocket_url": "ws://localhost:8080/ws/agent/{session_id}"
}
```

### POST /agent/refine-script

将大纲细化为完整剧本。

**Request**:
```json
{
  "project_id": "uuid",
  "input_type": "outline",
  "input_content": "第1集: ...\n第2集: ..."
}
```

**Response** (202 Accepted):
```json
{
  "session_id": "uuid",
  "status": "pending",
  "websocket_url": "ws://localhost:8080/ws/agent/{session_id}"
}
```

### POST /agent/import-file

导入文件并转换为剧本。

**Request**: multipart/form-data
- `file`: 文件内容
- `project_id`: 项目 ID

**Response** (202 Accepted):
```json
{
  "session_id": "uuid",
  "status": "pending",
  "websocket_url": "ws://localhost:8080/ws/agent/{session_id}"
}
```

### POST /agent/import-url

从 URL 抓取内容并转换为剧本。

**Request**:
```json
{
  "project_id": "uuid",
  "url": "https://example.com/story"
}
```

**Response** (202 Accepted):
```json
{
  "session_id": "uuid",
  "status": "pending",
  "websocket_url": "ws://localhost:8080/ws/agent/{session_id}"
}
```

### POST /agent/optimize-segment

AI 优化选中的剧本段落。

**Request**:
```json
{
  "project_id": "uuid",
  "text": "这个方案不行，推翻重来。",
  "element_type": "dialogue",
  "context": "第1集第1场，陈昊对林晚秋说"
}
```

**Response** (200):
```json
{
  "alternatives": [
    {
      "text": "这种方案也拿得出手？重做。",
      "style": "direct",
      "reason": "更直接的表达，增强冲突感"
    },
    {
      "text": "晚秋，你觉得这个方案能过审吗？",
      "style": "indirect",
      "reason": "用反问暗示不满，增加层次感"
    }
  ]
}
```

### GET /agent/sessions/{session_id}

获取 Agent 会话状态。

**Response** (200):
```json
{
  "id": "uuid",
  "session_type": "outline_generate",
  "status": "completed",
  "tokens_consumed": 5000,
  "started_at": "2026-06-16T10:00:00Z",
  "completed_at": "2026-06-16T10:01:00Z",
  "output_data": { ... }
}
```

### POST /agent/sessions/{session_id}/review

提交人类审核反馈。

**Request**:
```json
{
  "action": "approve",
  "feedback": null
}
```

或

```json
{
  "action": "revise",
  "feedback": "第3集反转不够强烈，需要加强"
}
```

**Response** (200):
```json
{
  "session_id": "uuid",
  "status": "running",
  "message": "正在根据反馈重新生成..."
}
```

---

## 5. 角色管理 (Characters)

### GET /projects/{project_id}/characters

获取项目角色列表。

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "林晚秋",
      "role": "protagonist",
      "description": "28岁，互联网公司产品经理",
      "personality": ["坚韧", "聪明", "隐忍"],
      "created_at": "2026-06-16T10:00:00Z"
    }
  ],
  "total": 5
}
```

### PATCH /projects/{project_id}/characters/{character_id}

更新角色信息。

**Request**:
```json
{
  "description": "28岁，互联网公司高级产品经理",
  "personality": ["坚韧", "聪明", "隐忍", "果断"]
}
```

**Response** (200): 更新后的角色对象

---

## 6. 伏笔管理 (Foreshadows)

### GET /projects/{project_id}/foreshadows

获取项目伏笔列表。

**Query Parameters**:
- `status` (string, optional): 筛选状态 (planted/resolved)

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "plant": "晚秋在公司电梯里捡到一枚刻有'LQ'的戒指",
      "payoff": null,
      "episode_hint": 1,
      "status": "planted",
      "urgency": "high",
      "character_id": "char_001",
      "created_at": "2026-06-16T10:00:00Z"
    }
  ],
  "total": 3
}
```

### PATCH /projects/{project_id}/foreshadows/{foreshadow_id}

更新伏笔状态（手动标记回收）。

**Request**:
```json
{
  "status": "resolved",
  "payoff": "第15集晚秋发现戒指是母亲遗物"
}
```

**Response** (200): 更新后的伏笔对象

---

## 7. 质量评估 (Quality)

### GET /projects/{project_id}/script/quality

获取剧本质量评估指标。

**Response** (200):
```json
{
  "hook_strength": {
    "value": 0.95,
    "target": 1.0,
    "status": "warning",
    "details": "第12集缺少结尾钩子"
  },
  "rhythm_curve": {
    "value": 0.35,
    "target": 0.3,
    "status": "pass",
    "details": "节奏波动合理"
  },
  "character_balance": {
    "value": 0.52,
    "target_range": [0.4, 0.6],
    "status": "pass",
    "details": "主角出场占比52%"
  },
  "dialogue_ratio": {
    "value": 0.42,
    "target_range": [0.3, 0.5],
    "status": "pass",
    "details": "对白占比42%"
  },
  "scene_diversity": {
    "value": 0.65,
    "target": 0.6,
    "status": "pass",
    "details": "场景多样性良好"
  },
  "foreshadow_status": {
    "total": 5,
    "resolved": 3,
    "unresolved": 2,
    "status": "warning",
    "details": "2个伏笔尚未回收"
  },
  "overall_score": 78
}
```

---

## 8. 配置管理 (Settings)

### GET /settings/api-keys

获取已配置的 API Key 列表（脱敏）。

**Response** (200):
```json
{
  "items": [
    {
      "provider": "openai",
      "key_preview": "sk-...abc1",
      "configured": true
    },
    {
      "provider": "dashscope",
      "key_preview": "sk-...xyz9",
      "configured": true
    }
  ]
}
```

### PUT /settings/api-keys

配置 API Key。

**Request**:
```json
{
  "provider": "anthropic",
  "api_key": "sk-ant-..."
}
```

**Response** (200):
```json
{
  "provider": "anthropic",
  "key_preview": "sk-...def2",
  "configured": true
}
```

### GET /settings/models

获取可用模型列表。

**Response** (200):
```json
{
  "items": [
    {
      "id": "qwen-max",
      "provider": "dashscope",
      "name": "通义千问 Max",
      "use_case": "主力创作模型",
      "configured": true
    },
    {
      "id": "gpt-4o",
      "provider": "openai",
      "name": "GPT-4o",
      "use_case": "复杂推理",
      "configured": true
    }
  ]
}
```

---

## WebSocket Messages

### Agent Progress Messages

**Stage Update** (Agent 阶段切换):
```json
{
  "type": "stage_update",
  "data": {
    "stage": "showrunner",
    "stage_label": "主笔编剧",
    "status": "started"
  }
}
```

**Stream Chunk** (Agent 流式输出):
```json
{
  "type": "stream_chunk",
  "data": {
    "stage": "showrunner",
    "content": "正在生成故事大纲..."
  }
}
```

**HITL Prompt** (人类审核请求):
```json
{
  "type": "hitl_prompt",
  "data": {
    "stage": "human_review",
    "stage_label": "人类审核",
    "content": "大纲已生成，请审核：...",
    "options": ["approve", "revise", "manual_edit"]
  }
}
```

**Complete** (任务完成):
```json
{
  "type": "complete",
  "data": {
    "session_id": "uuid",
    "result": { ... },
    "tokens_consumed": 5000
  }
}
```

**Error** (任务失败):
```json
{
  "type": "error",
  "data": {
    "session_id": "uuid",
    "error_code": "RATE_LIMIT_EXCEEDED",
    "message": "API 调用频率超限，请稍后重试"
  }
}
```

**Budget Warning** (预算警告):
```json
{
  "type": "budget_warning",
  "data": {
    "tokens_used": 800000,
    "token_limit": 1000000,
    "threshold": 0.80,
    "message": "Token 用量已达到预算的 80%"
  }
}
```
