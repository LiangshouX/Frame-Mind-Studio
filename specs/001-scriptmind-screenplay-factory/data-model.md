# Data Model: ScriptMind 剧本工厂

**Date**: 2026-06-16
**Feature**: ScriptMind 剧本工厂
**Updated**: 2026-06-18 — ORM 从 SQLAlchemy 迁移至 Spring Data JPA，移除 ChromaDB 依赖

## Entity Relationship Diagram

```
Project (1) ──── (1) Script
Project (1) ──── (N) Character
Project (1) ──── (N) Foreshadow
Project (1) ──── (1) ProjectBudget
Script  (1) ──── (N) ScriptVersion
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
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | 项目状态：draft / in_progress / review / completed |
| target_episodes | INTEGER | NOT NULL, DEFAULT 20 | 目标集数 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 最后更新时间 |

### Script

剧本是项目的核心内容实体，包含完整的剧集结构。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 剧本唯一标识 |
| project_id | UUID | FK → Project.id, UNIQUE | 所属项目（1:1） |
| title | VARCHAR(255) | NOT NULL | 剧本标题 |
| content | JSONB | NOT NULL, DEFAULT '{}' | 完整剧本内容（ScriptContent 结构） |
| format_type | VARCHAR(50) | NOT NULL, DEFAULT 'fountain' | 格式类型 |
| word_count | INTEGER | NOT NULL, DEFAULT 0 | 字数 |
| scene_count | INTEGER | NOT NULL, DEFAULT 0 | 场景数 |
| episode_count | INTEGER | NOT NULL, DEFAULT 0 | 集数 |
| version | INTEGER | NOT NULL, DEFAULT 1 | 当前版本号 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 最后更新时间 |

### ScriptVersion

版本快照，记录每次编辑的剧本状态。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 版本唯一标识 |
| script_id | UUID | FK → Script.id, NOT NULL | 所属剧本 |
| version | INTEGER | NOT NULL | 版本编号（自增） |
| content | JSONB | NOT NULL | 该版本的完整剧本内容 |
| message | VARCHAR(500) | NULLABLE | 变更摘要 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

**Indexes**: (script_id, version) UNIQUE

### Character

角色档案。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 角色唯一标识 |
| project_id | UUID | FK → Project.id, NOT NULL | 所属项目 |
| name | VARCHAR(255) | NOT NULL | 角色名 |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'supporting' | 角色类型：protagonist / antagonist / supporting / minor |
| description | TEXT | NULLABLE | 角色描述 |
| personality | JSONB | DEFAULT '[]' | 性格标签列表 |
| appearance | TEXT | NULLABLE | 外貌描述 |
| background | TEXT | NULLABLE | 背景故事 |
| goals | TEXT | NULLABLE | 角色目标 |
| relationships | JSONB | DEFAULT '[]' | 与其他角色的关系 |
| dialogue_style | TEXT | NULLABLE | 对白风格 |
| arc | TEXT | NULLABLE | 角色弧光描述 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

**Indexes**: (project_id, name) UNIQUE

### Foreshadow

伏笔记录。

| Field | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | UUID | PK, auto-generated | 伏笔唯一标识 |
| project_id | UUID | FK → Project.id, NOT NULL | 所属项目 |
| plant | TEXT | NOT NULL | 伏笔埋设内容 |
| payoff | TEXT | NULLABLE | 伏笔回收内容 |
| episode_hint | INTEGER | NULLABLE | 提示集数 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'planted' | 状态：planted / resolved |
| urgency | VARCHAR(20) | NOT NULL, DEFAULT 'medium' | 重要性：high / medium / low |
| character_id | VARCHAR(36) | NULLABLE | 关联角色 ID |
| notes | TEXT | NULLABLE | 备注 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

**Indexes**: (project_id, status)

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

## JPA Entity Mapping Notes

### JSONB 字段映射

使用 Hibernate 6 的 `@Type(JsonType.class)` 或自定义 `AttributeConverter` 映射 JSONB 字段：

```java
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> genre;
}
```

### UUID 主键策略

使用 `GenerationType.UUID` 自动生成 UUID 主键，与 PostgreSQL 的 `gen_random_uuid()` 一致。

### 关系映射

```java
// Project → Script (1:1)
@OneToOne(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
private Script script;

// Project → Character (1:N)
@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Character> characters = new ArrayList<>();

// Project → AgentSession (1:N)
@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
private List<AgentSession> agentSessions = new ArrayList<>();
```

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

## ChromaDB → PostgreSQL 迁移说明

原方案使用 ChromaDB 存储向量记忆（story_bible、characters、foreshadows collections）。新方案移除 ChromaDB 依赖，改为：

1. **设定集 / 角色档案 / 伏笔记录**：直接存储在 PostgreSQL 的 JSONB 字段中，通过 JPA Repository 查询
2. **语义检索**：如需语义搜索能力，可后续集成 pgvector 扩展，或使用 AgentScope-Java 的 `LongTermMemory` 接口对接外部向量数据库
3. **Agent 记忆**：使用 AgentScope-Java 内置的 `InMemoryMemory`（短期）和 `LongTermMemory`（长期）管理
