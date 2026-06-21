# API Contracts: ScriptMind 剧本工作流

**Date**: 2026-06-22
**Base URL**: `/api/v1`

## 概述

所有 API 遵循现有项目的约定：
- JSON 格式，snake_case 属性命名
- UUID 作为实体 ID
- 错误响应统一格式：`{"error": "message", "code": "ERROR_CODE"}`

## 1. 项目管理

### POST /projects
创建新项目。

**Request**:
```json
{
  "title": "都市逆袭",
  "format": "short_drama",
  "genre": ["都市", "复仇"],
  "logline": "女主被渣男背叛后逆袭",
  "description": "可选描述"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "title": "都市逆袭",
  "format": "short_drama",
  "genre": ["都市", "复仇"],
  "logline": "女主被渣男背叛后逆袭",
  "status": "draft",
  "target_episodes": 20,
  "created_at": "2026-06-22T10:00:00Z",
  "updated_at": "2026-06-22T10:00:00Z"
}
```

### GET /projects/{projectId}
获取项目详情，包含所有工作流步骤的数据。

**Response** (200):
```json
{
  "id": "uuid",
  "title": "都市逆袭",
  "format": "short_drama",
  "logline": "女主被渣男背叛后逆袭",
  "genre": ["都市", "复仇"],
  "status": "draft",
  "world_setting": { "id": "uuid", "content": {...} },
  "synopsis": { "id": "uuid", "content": {...} },
  "characters": [{ "id": "uuid", "name": "林晚秋", ... }],
  "outline": { "id": "uuid", "content": {...} },
  "script": { "id": "uuid", "content": {...} },
  "workflow_state": {
    "current_step": "characters",
    "completed_steps": ["worldview", "synopsis"],
    "step_data": {
      "worldview": { "status": "completed" },
      "synopsis": { "status": "completed" },
      "characters": { "status": "in_progress" },
      "outline": { "status": "pending" },
      "script": { "status": "pending" }
    }
  }
}
```

## 2. 世界观设定

### GET /projects/{projectId}/world-setting
获取世界观设定。

**Response** (200):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "content": {
    "genre": "末日生存",
    "style": "写实主义",
    "era": "近未来",
    "setting": "气候灾变后的沿海城市",
    "coreConflict": "资源争夺与人性考验",
    "uniqueSellingPoint": "聚焦普通人的道德抉择",
    "worldRules": ["资源匮乏", "社会秩序崩塌"],
    "locations": [{"name": "废弃商场", "description": "幸存者聚集地"}],
    "themes": ["生存", "信任"]
  },
  "created_at": "2026-06-22T10:00:00Z",
  "updated_at": "2026-06-22T10:00:00Z"
}
```

### PUT /projects/{projectId}/world-setting
创建或更新世界观设定（全量覆盖）。

**Request**:
```json
{
  "content": {
    "genre": "末日生存",
    "style": "写实主义",
    ...
  }
}
```

**Response** (200): 同 GET 响应。

## 3. 梗概

### GET /projects/{projectId}/synopsis
获取梗概。

**Response** (200):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "content": {
    "mainPlot": "故事主线描述",
    "coreConflict": "核心冲突",
    "turningPoints": ["转折点1", "转折点2"],
    "ending": "结局走向",
    "themes": ["主题1"]
  },
  "created_at": "2026-06-22T10:00:00Z",
  "updated_at": "2026-06-22T10:00:00Z"
}
```

### PUT /projects/{projectId}/synopsis
创建或更新梗概（全量覆盖）。

## 4. 角色

### GET /projects/{projectId}/characters
获取项目所有角色。

**Response** (200):
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "林晚秋",
      "gender": "女",
      "role_type": "protagonist",
      "identity": "互联网产品经理",
      "persona": "坚韧不拔的逆袭女王",
      "personality": ["坚韧", "聪明", "果断"],
      "appearance": "短发干练",
      "background": "普通家庭出身",
      "arc": "从隐忍到爆发",
      "overview": "人物小传全文..."
    }
  ],
  "total": 3
}
```

### POST /projects/{projectId}/characters
创建新角色。

**Request**:
```json
{
  "name": "林晚秋",
  "gender": "女",
  "role_type": "protagonist",
  "identity": "互联网产品经理",
  "persona": "坚韧不拔的逆袭女王",
  "personality": ["坚韧", "聪明"],
  "appearance": "短发干练",
  "overview": "人物小传..."
}
```

### PATCH /projects/{projectId}/characters/{characterId}
更新角色。

### DELETE /projects/{projectId}/characters/{characterId}
删除角色。

## 5. 大纲

### GET /projects/{projectId}/outline
获取大纲。

**Response** (200):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "format": "episode_list",
  "content": {
    "episodes": [
      {
        "episodeNumber": 1,
        "title": "坠入深渊",
        "highlight": "震撼开场",
        "hook": "神秘电话暗示阴谋",
        "keyEvents": ["发现出轨", "被降职"],
        "durationSeconds": 180
      }
    ]
  },
  "version": 1,
  "created_at": "2026-06-22T10:00:00Z",
  "updated_at": "2026-06-22T10:00:00Z"
}
```

### PUT /projects/{projectId}/outline
创建或更新大纲（全量覆盖）。

### PUT /projects/{projectId}/outline/episodes/{episodeNumber}
更新单集大纲（局部更新）。

## 6. 剧本内容

### GET /projects/{projectId}/script
获取完整剧本。

**Response** (200): 同现有 ScriptController 响应。

### PUT /projects/{projectId}/script
全量覆盖剧本内容。

### PUT /projects/{projectId}/script/episodes/{episodeNumber}
更新单集剧本内容。

## 7. AI Agent 工作流

### POST /projects/{projectId}/workflow/generate-world-setting
AI 生成世界观设定。

**Request**:
```json
{
  "conversation_id": "uuid (可选，继续已有对话)"
}
```

**Response** (202):
```json
{
  "session_id": "uuid",
  "websocket_url": "/ws/agent/session/uuid",
  "status": "pending"
}
```

### POST /projects/{projectId}/workflow/generate-synopsis
AI 生成梗概。

### POST /projects/{projectId}/workflow/generate-characters
AI 生成角色。

### POST /projects/{projectId}/workflow/generate-outline
AI 生成大纲。

### POST /projects/{projectId}/workflow/generate-script
AI 生成剧本。

**Request**:
```json
{
  "episode_number": 1
}
```

### POST /projects/{projectId}/workflow/review
AI 审查剧本。

**Request**:
```json
{
  "scope": "full",
  "episode_number": null
}
```

或逐集审查：
```json
{
  "scope": "episode",
  "episode_number": 3
}
```

### POST /projects/{projectId}/workflow/optimize
AI 优化选中文本。

**Request**:
```json
{
  "selected_text": "选中的文本内容",
  "element_type": "dialogue",
  "context": "所在场景的上下文信息"
}
```

**Response** (200):
```json
{
  "suggestions": [
    {"id": "s1", "text": "改写方案1", "style": "口语化"},
    {"id": "s2", "text": "改写方案2", "style": "文学化"},
    {"id": "s3", "text": "改写方案3", "style": "戏剧化"}
  ]
}
```

## 8. 审查报告

### GET /projects/{projectId}/review-reports
获取审查报告列表。

**Query Params**: `scope` (full/episode), `episode_number`

### GET /projects/{projectId}/review-reports/{reportId}
获取单个审查报告详情。

### PATCH /projects/{projectId}/review-reports/{reportId}/issues/{issueId}
更新审查问题状态（采纳/忽略/手动修改）。

## 9. 文件导入

### POST /projects/{projectId}/import/file
上传并解析文件。

**Request**: multipart/form-data with `file` field

**Response** (202):
```json
{
  "session_id": "uuid",
  "websocket_url": "/ws/agent/session/uuid",
  "status": "pending"
}
```

### POST /projects/{projectId}/import/url
从 URL 抓取并解析。

**Request**:
```json
{
  "url": "https://example.com/story"
}
```

## 10. 内容导出

### GET /projects/{projectId}/export/json
导出为 JSON 格式（遵循 ScriptsDataModel 结构）。

### GET /projects/{projectId}/export/fountain
导出为 Fountain 格式。

## 11. Agent 对话（WebSocket）

### WebSocket /ws/agent/session/{sessionId}
Agent 流式输出连接。

**服务端消息格式**:
```json
{
  "type": "chunk",
  "content": "流式文本片段",
  "agent_name": "showrunner"
}
```

```json
{
  "type": "stage_change",
  "stage": "world_builder",
  "label": "世界观架构师"
}
```

```json
{
  "type": "content_inject",
  "target": "world_setting",
  "content": { ... }
}
```

```json
{
  "type": "review_prompt",
  "content": "生成的审查内容",
  "requires_approval": true
}
```

```json
{
  "type": "complete",
  "session_id": "uuid"
}
```

```json
{
  "type": "error",
  "message": "错误描述"
}
```
