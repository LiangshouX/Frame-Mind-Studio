# Data Model: ScriptMind 剧本工厂

**Date**: 2026-06-16
**Feature**: ScriptMind 剧本工厂

## Entity Relationship Diagram

```
Project (1) ──── (1) Script
Project (1) ──── (N) Character
Project (1) ──── (N) Foreshadow
Project (1) ──── (1) ProjectBudget
Script  (1) ──── (N) ScriptVersion
Script  (1) ──── (N) ScriptEpisode
ScriptEpisode (1) ──── (N) ScriptScene
ScriptScene (1) ──── (N) ScriptBeat
Project (1) ──── (N) AgentSession
AgentSession (1) ──── (N) AgentMessage
```

## Entities

### Project

项目是 ScriptMind 的顶层容器，一个项目对应一个剧本。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 项目唯一标识 |
| title | VARCHAR(255) | NOT NULL | 项目标题 |
| genre | JSONB | NOT NULL | 题材标签列表，如 ["都市", "复仇"] |
| format | VARCHAR(50) | NOT NULL, DEFAULT 'short_drama' | 目标形态：short_drama / comic / movie |
| description | TEXT | NULLABLE | 项目描述 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 最后更新时间 |

### Script

剧本是项目的核心内容实体，包含完整的剧集结构。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 剧本唯一标识 |
| project_id | UUID | FK → Project.id, UNIQUE | 所属项目（1:1） |
| title | VARCHAR(255) | NOT NULL | 剧本标题 |
| total_episodes | INTEGER | NOT NULL, CHECK (8-100) | 总集数 |
| style_preset | VARCHAR(50) | NULLABLE | 风格预设：sweet / suspense / revenge / ancient / marvel / comedy |
| content | JSONB | NOT NULL, DEFAULT '{}' | 完整剧本内容（ScriptContent 结构） |
| current_version | INTEGER | NOT NULL, DEFAULT 1 | 当前版本号 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 最后更新时间 |

### ScriptVersion

版本快照，记录每次编辑的剧本状态。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 版本唯一标识 |
| script_id | UUID | FK → Script.id, NOT NULL | 所属剧本 |
| version_number | INTEGER | NOT NULL | 版本编号（自增） |
| content | JSONB | NOT NULL | 该版本的完整剧本内容 |
| change_summary | VARCHAR(500) | NULLABLE | 变更摘要（AI 修改或手动编辑） |
| change_source | VARCHAR(20) | NOT NULL | 变更来源：ai / manual / import |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

**Indexes**: (script_id, version_number) UNIQUE

### ScriptEpisode

剧集，剧本中的单集。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 剧集唯一标识 |
| script_id | UUID | FK → Script.id, NOT NULL | 所属剧本 |
| episode_number | INTEGER | NOT NULL | 集数编号 |
| title | VARCHAR(255) | NOT NULL | 集标题 |
| duration_minutes | DECIMAL(4,1) | NOT NULL, DEFAULT 2.5 | 目标时长（分钟） |
| summary | TEXT | NULLABLE | 剧情摘要 |
| key_events | JSONB | DEFAULT '[]' | 关键事件列表 |
| cliffhanger | TEXT | NULLABLE | 结尾钩子 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 最后更新时间 |

**Indexes**: (script_id, episode_number) UNIQUE

### ScriptScene

场景，单集中的一个场景。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 场景唯一标识 |
| episode_id | UUID | FK → ScriptEpisode.id, NOT NULL | 所属剧集 |
| scene_id | VARCHAR(50) | NOT NULL | 场景编号（如 S01E01_SC01） |
| location | VARCHAR(255) | NOT NULL | 地点 |
| time | VARCHAR(100) | NOT NULL | 时间（如 "日/夜/黄昏"） |
| mood_tags | JSONB | DEFAULT '[]' | 情绪标签 |
| characters_present | JSONB | DEFAULT '[]' | 在场角色 ID 列表 |
| scene_order | INTEGER | NOT NULL | 场景在集内的顺序 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

**Indexes**: (episode_id, scene_order)

### ScriptBeat

节拍，场景中的最小叙事单元。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 节拍唯一标识 |
| scene_id | UUID | FK → ScriptScene.id, NOT NULL | 所属场景 |
| beat_id | VARCHAR(50) | NOT NULL | 节拍编号 |
| type | VARCHAR(20) | NOT NULL, CHECK IN ('action','dialogue','emotion','transition') | 元素类型 |
| content | TEXT | NOT NULL | 内容文本 |
| character | VARCHAR(100) | NULLABLE | 对白角色名（type=dialogue 时必填） |
| emotion | VARCHAR(50) | NULLABLE | 情绪标注 |
| camera_suggestion | TEXT | NULLABLE | 镜头建议 |
| duration_seconds | DECIMAL(5,1) | NULLABLE | 预估时长 |
| beat_order | INTEGER | NOT NULL | 节拍在场景内的顺序 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

**Indexes**: (scene_id, beat_order)

### Character

角色档案。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 角色唯一标识 |
| project_id | UUID | FK → Project.id, NOT NULL | 所属项目 |
| name | VARCHAR(100) | NOT NULL | 角色名 |
| role_type | VARCHAR(20) | NOT NULL, CHECK IN ('protagonist','antagonist','supporting','minor') | 角色类型 |
| description | TEXT | NULLABLE | 角色描述 |
| appearance | TEXT | NULLABLE | 外貌描述 |
| personality | JSONB | DEFAULT '[]' | 性格标签列表 |
| relationships | JSONB | DEFAULT '{}' | 与其他角色的关系 |
| character_arc | TEXT | NULLABLE | 角色弧光描述 |
| visual_prompt | TEXT | NULLABLE | 视觉生成 Prompt |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

**Indexes**: (project_id, name) UNIQUE

### Foreshadow

伏笔记录。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 伏笔唯一标识 |
| project_id | UUID | FK → Project.id, NOT NULL | 所属项目 |
| content | TEXT | NOT NULL | 伏笔内容描述 |
| planted_episode | INTEGER | NOT NULL | 埋设集数 |
| resolved | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否已回收 |
| resolved_episode | INTEGER | NULLABLE | 回收集数 |
| related_characters | JSONB | DEFAULT '[]' | 关联角色 ID 列表 |
| importance | VARCHAR(10) | NOT NULL, DEFAULT 'medium', CHECK IN ('high','medium','low') | 重要性 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

**Indexes**: (project_id, resolved)

### ProjectBudget

项目 Token 预算与用量。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 预算唯一标识 |
| project_id | UUID | FK → Project.id, UNIQUE | 所属项目（1:1） |
| token_limit | BIGINT | NOT NULL, DEFAULT 1000000 | Token 上限 |
| tokens_used | BIGINT | NOT NULL, DEFAULT 0 | 已用 Token 数 |
| warning_threshold | DECIMAL(3,2) | NOT NULL, DEFAULT 0.80 | 警告阈值（0-1） |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

### AgentSession

Agent 会话记录。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 会话唯一标识 |
| project_id | UUID | FK → Project.id, NOT NULL | 所属项目 |
| session_type | VARCHAR(50) | NOT NULL | 会话类型：outline_generate / script_refine / import / optimize |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | 状态：pending / running / completed / failed |
| input_data | JSONB | NOT NULL | 输入数据 |
| output_data | JSONB | NULLABLE | 输出结果 |
| tokens_consumed | INTEGER | NOT NULL, DEFAULT 0 | 本次会话消耗的 Token 数 |
| started_at | TIMESTAMP | NULLABLE | 开始时间 |
| completed_at | TIMESTAMP | NULLABLE | 完成时间 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

### AgentMessage

Agent 会话中的消息记录，用于流式输出和调试。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 消息唯一标识 |
| session_id | UUID | FK → AgentSession.id, NOT NULL | 所属会话 |
| agent_name | VARCHAR(50) | NOT NULL | Agent 名称：showrunner / world_builder / character_designer / script_doctor |
| role | VARCHAR(20) | NOT NULL | 角色：agent / user / system |
| content | TEXT | NOT NULL | 消息内容 |
| message_order | INTEGER | NOT NULL | 消息顺序 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

**Indexes**: (session_id, message_order)

## JSON Schema: ScriptContent

剧本内容的完整 JSON 结构，存储在 Script.content 字段中：

```json
{
  "title": "逆袭女王",
  "totalEpisodes": 20,
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "命运的转折",
      "durationMinutes": 2.5,
      "scenes": [
        {
          "sceneId": "S01E01_SC01",
          "location": "现代都市·CBD写字楼·办公室",
          "time": "日",
          "moodTags": ["压抑", "紧张"],
          "charactersPresent": ["char_001", "char_002"],
          "beats": [
            {
              "beatId": "S01E01_SC01_B01",
              "type": "action",
              "content": "林晚秋坐在工位前，电脑屏幕上显示着被驳回的方案。",
              "character": null,
              "emotion": "压抑",
              "cameraSuggestion": "近景，缓慢推近到电脑屏幕",
              "durationSeconds": 3
            },
            {
              "beatId": "S01E01_SC01_B02",
              "type": "dialogue",
              "content": "这个方案不行，推翻重来。",
              "character": "陈昊",
              "emotion": "轻蔑",
              "cameraSuggestion": "中景，正反打",
              "durationSeconds": 2
            }
          ]
        }
      ]
    }
  ]
}
```

## ChromaDB Collections

### story_bible (设定集)

```
Collection: story_bible
Document: 设定文本
Metadata:
  - project_id: string
  - type: "world_setting" | "plot_point" | "theme"
  - category: string (如 "time_period", "location", "social_structure")
  - importance: "high" | "medium" | "low"
  - episode_range: string (如 "1-20")
ID: setting_{uuid}
```

### characters (角色档案)

```
Collection: characters
Document: 角色描述文本
Metadata:
  - project_id: string
  - character_id: string
  - character_name: string
  - role_type: "protagonist" | "antagonist" | "supporting" | "minor"
  - importance: "high" | "medium" | "low"
ID: char_{uuid}_desc
```

### foreshadows (伏笔)

```
Collection: foreshadows
Document: 伏笔内容描述
Metadata:
  - project_id: string
  - foreshadow_id: string
  - planted_episode: int
  - resolved: bool
  - resolved_episode: int | null
  - related_characters: string[]
  - importance: "high" | "medium" | "low"
ID: foreshadow_{uuid}
```
