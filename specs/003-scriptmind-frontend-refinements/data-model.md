# Data Model: ScriptMind 前端功能细化

**Date**: 2026-06-18 | **Feature**: [spec.md](./spec.md)

## Entities

### AgentMessage (修改)

聊天消息，新增错误消息类型。

| Field | Type | Description |
|:---|:---|:---|
| id | string | 消息唯一 ID |
| agentName | string | Agent 名称（showrunner, world_builder 等） |
| role | 'agent' \| 'user' \| 'system' \| 'error' | 消息角色，新增 `error` 类型 |
| content | string | 消息文本内容 |
| isStreaming | boolean | 是否正在流式输出 |
| timestamp | number | 消息时间戳 |

**Changes**: `role` 新增 `'error'` 值，用于在聊天界面显示 API 错误消息（红色背景）。

---

### ScriptContent (无变更，但新增转换)

剧本结构化数据，后端 API 格式。

| Field | Type | Description |
|:---|:---|:---|
| title | string | 剧本标题 |
| totalEpisodes | number | 总集数 |
| episodes | Episode[] | 集列表 |

**Episode**:
| Field | Type | Description |
|:---|:---|:---|
| episodeNumber | number | 集编号 |
| title | string | 集标题 |
| summary | string | 集摘要 |
| scenes | Scene[] | 场景列表 |

**Scene**:
| Field | Type | Description |
|:---|:---|:---|
| sceneId | string | 场景 ID |
| heading | string | 场景标题（如 "INT. OFFICE - DAY"） |
| beats | Beat[] | 节拍列表 |

**Beat**:
| Field | Type | Description |
|:---|:---|:---|
| type | 'action' \| 'dialogue' \| 'transition' | 节拍类型 |
| content | string | 文本内容 |
| characterName | string? | 角色名（dialogue 类型时） |
| moodTags | string[]? | 情绪标签（元数据，编辑器不处理） |
| cameraSuggestion | string? | 镜头建议（元数据，编辑器不处理） |
| durationSeconds | number? | 预估时长（元数据，编辑器不处理） |
| emotion | string? | 情感标注（元数据，编辑器不处理） |

**Note**: `slateToScript` 转换仅处理文本内容和结构（type、content、characterName），元数据字段（moodTags 等）通过独立面板管理，保存时合并。

---

### SlateNode (前端内部)

Slate.js 编辑器节点，前端内部表示。

| Field | Type | Description |
|:---|:---|:---|
| type | string | 元素类型：scene_heading, action, character, dialogue, parenthetical, transition |
| children | CustomText[] | 文本内容 |

**CustomText**:
| Field | Type | Description |
|:---|:---|:---|
| text | string | 文本内容 |

**转换规则 (slateToScript)**:
- `scene_heading` → 新建 Scene，heading = 文本内容
- `action` → 新建 Beat，type = 'action'
- `character` + 下一个 `dialogue` → 合并为 Beat，type = 'dialogue'，characterName = character 文本
- `dialogue`（无前导 character）→ Beat，type = 'dialogue'
- `transition` → Beat，type = 'transition'
- `parenthetical` → 合并到前一个 dialogue Beat 的 content 中

---

### ScriptVersion (新增 UI)

版本历史记录，对应后端 API 返回格式。

| Field | Type | Description |
|:---|:---|:---|
| versionId | string | 版本 ID |
| versionNumber | number | 版本号 |
| createdAt | string | 创建时间（ISO 8601） |
| changeSummary | string | 变更摘要（手动保存时用户提供或自动生成） |

---

### EditorTab (新增)

右侧面板标签页状态。

| Value | Description |
|:---|:---|
| 'characters' | 角色面板 |
| 'foreshadows' | 伏笔追踪面板 |
| 'versions' | 版本历史面板 |
