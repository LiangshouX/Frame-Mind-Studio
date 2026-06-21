# Data Model: ScriptMind 剧本工作流

**Date**: 2026-06-22
**Feature**: 005-scriptmind-workflow
**Reference**: `docs/ScriptsDataModel.md`

## 概述

本数据模型遵循 `docs/ScriptsDataModel.md` 中定义的双轨模型：
- **微短剧模型**（Beat 驱动）：Project → Episode → Scene → Beat → Dialogue
- **传统影视模型**（Block 驱动）：Project → Act → Sequence → Scene → Block

两种模型通过 Project.format 字段区分，ScriptContent 存储在 scripts.content (JSONB) 中。

## 实体关系图

```
┌─────────────┐     1:1      ┌──────────────┐
│  projects   │──────────────│   scripts    │
│             │              │              │
│ id (PK)     │              │ id (PK)      │
│ title       │              │ project_id   │
│ format      │              │ content(JB)  │
│ logline     │              │ format_type  │
│ genre(JB)   │              │ word_count   │
│ description │              │ scene_count  │
│ status      │              │ episode_count│
│ target_eps  │              │ created_at   │
│ created_at  │              │ updated_at   │
│ updated_at  │              └──────────────┘
└──────┬──────┘
       │
       │ 1:N          1:N           1:N          1:N
       ├──────────┌────────────┐ ┌──────────┐ ┌──────────┐
       │          │characters  │ │foreshadows│ │outlines  │
       │          │            │ │          │ │          │
       │          │id (PK)     │ │id (PK)   │ │id (PK)   │
       │          │project_id  │ │project_id│ │project_id│
       │          │name        │ │plant     │ │content(JB│
       │          │gender      │ │payoff    │ │format    │
       │          │role_type   │ │status    │ │version   │
       │          │identity    │ │urgency   │ │created_at│
       │          │persona     │ │char_id   │ │updated_at│
       │          │personality │ │notes     │ └──────────┘
       │          │background  │ │created_at│
       │          │arc         │ │updated_at│ ┌──────────────┐
       │          │overview    │ └──────────┘ │review_reports│
       │          │appearance  │              │              │
       │          │created_at  │ 1:N          │id (PK)       │
       │          │updated_at  │──────────────│project_id    │
       │          └────────────┘              │scope         │
       │                                      │report(JB)    │
       │ 1:N                                  │created_at    │
       ├──────────┌───────────────────┐       └──────────────┘
       │          │world_settings    │
       │          │                  │       ┌──────────────┐
       │          │id (PK)           │  1:N  │synopses      │
       │          │project_id        │───────│              │
       │          │content(JB)       │       │id (PK)       │
       │          │created_at        │       │project_id    │
       │          │updated_at        │       │content(JB)   │
       │          └───────────────────┘       │created_at    │
       │                                      │updated_at    │
       │                                      └──────────────┘
       │
       │ 1:N          1:N
       ├──────────┌──────────────┐
       │          │agent_sessions│
       │          │agent_messages│
       │          │project_budget│
       └──────────└──────────────┘
```

## 实体详细定义

### 1. projects（扩展现有表）

| 字段 | 类型 | 约束 | 说明 | 变更 |
|------|------|------|------|------|
| id | UUID | PK | 项目唯一 ID | 不变 |
| title | VARCHAR(255) | NOT NULL | 项目名称 | 不变 |
| format | VARCHAR(50) | NOT NULL, DEFAULT 'short_drama' | 项目类型：short_drama / feature_film | 不变 |
| logline | TEXT | | 一句话梗概 | **新增** |
| genre | JSONB | NOT NULL, DEFAULT '[]' | 题材标签 | 不变 |
| description | TEXT | | 项目描述 | 不变 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | 项目状态 | 不变 |
| target_episodes | INTEGER | NOT NULL, DEFAULT 20 | 目标集数 | 不变 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 | 不变 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 | 不变 |

**数据模型映射**:
- `format = 'short_drama'` → 微短剧模型（ScriptsDataModel.ShortDramaProject）
- `format = 'feature_film'` → 传统影视模型（ScriptsDataModel.TraditionalScript）

### 2. scripts（扩展现有表）

| 字段 | 类型 | 约束 | 说明 | 变更 |
|------|------|------|------|------|
| id | UUID | PK | 剧本唯一 ID | 不变 |
| project_id | UUID | FK, UNIQUE, NOT NULL | 关联项目 | 不变 |
| title | VARCHAR(255) | NOT NULL | 剧本标题 | 不变 |
| content | JSONB | NOT NULL, DEFAULT '{}' | 剧本内容（遵循 ScriptsDataModel 结构） | 不变 |
| format_type | VARCHAR(50) | NOT NULL, DEFAULT 'fountain' | 格式类型 | 不变 |
| word_count | INTEGER | NOT NULL, DEFAULT 0 | 字数统计 | 不变 |
| scene_count | INTEGER | NOT NULL, DEFAULT 0 | 场景数 | 不变 |
| episode_count | INTEGER | NOT NULL, DEFAULT 0 | 集数 | 不变 |
| version | INTEGER | NOT NULL, DEFAULT 1 | 版本号（用于乐观锁） | 不变 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 | 不变 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 | 不变 |

**content JSONB 结构**（短剧项目）:
```json
{
  "title": "剧名",
  "totalEpisodes": 10,
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "分集标题",
      "highlight": "本集看点",
      "hook": "结尾钩子",
      "targetDurationSeconds": 180,
      "scenes": [
        {
          "sceneId": "s1",
          "intExt": "内景",
          "location": "咖啡馆",
          "time": "日",
          "beats": [
            {
              "beatId": "b1",
              "beatType": "受辱",
              "summary": "节拍简述",
              "visualAction": "画面动作描述",
              "dialogues": [
                {
                  "characterName": "林晚秋",
                  "parenthetical": "愤怒",
                  "line": "台词内容"
                }
              ],
              "emotionArc": "憋屈→爆发"
            }
          ]
        }
      ]
    }
  ]
}
```

**content JSONB 结构**（微电影项目）:
```json
{
  "title": "片名",
  "structureModel": "三幕剧",
  "acts": [
    {
      "actNumber": 1,
      "actName": "建置",
      "actGoal": "建立主角的日常生活和核心冲突",
      "sequences": [
        {
          "sequenceId": "seq1",
          "sequenceName": "触发事件",
          "plotPoint": "核心转折描述",
          "scenes": [
            {
              "sceneId": "s1",
              "slugline": "内景. 咖啡馆 - 日",
              "intExt": "内景",
              "location": "咖啡馆",
              "timeOfDay": "日",
              "charactersPresent": ["林晚秋", "陈昊"],
              "sceneObjective": "揭示两人关系裂痕",
              "blocks": [
                {
                  "blockId": "b1",
                  "blockType": "action",
                  "content": "动作描述文本"
                },
                {
                  "blockId": "b2",
                  "blockType": "character",
                  "content": "林晚秋",
                  "characterName": "林晚秋"
                },
                {
                  "blockId": "b3",
                  "blockType": "dialogue",
                  "content": "台词内容",
                  "characterName": "林晚秋"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 3. world_settings（新增表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 世界观设定唯一 ID |
| project_id | UUID | FK, UNIQUE, NOT NULL | 关联项目（1:1） |
| content | JSONB | NOT NULL, DEFAULT '{}' | 世界观设定内容 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**content JSONB 结构**:
```json
{
  "genre": "末日生存",
  "style": "写实主义",
  "era": "近未来 2030年",
  "setting": "气候灾变后的沿海城市",
  "coreConflict": "资源争夺与人性考验",
  "uniqueSellingPoint": "聚焦普通人在极端环境下的道德抉择",
  "worldRules": ["资源极度匮乏", "社会秩序崩塌", "小型社区自治"],
  "locations": [
    {"name": "废弃商场", "description": "幸存者聚集地"},
    {"name": "海岸线", "description": "资源搜索区域"}
  ],
  "themes": ["生存", "信任", "牺牲"]
}
```

### 4. synopses（新增表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 梗概唯一 ID |
| project_id | UUID | FK, UNIQUE, NOT NULL | 关联项目（1:1） |
| content | JSONB | NOT NULL, DEFAULT '{}' | 梗概内容 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**content JSONB 结构**:
```json
{
  "mainPlot": "故事主线描述",
  "coreConflict": "核心冲突",
  "turningPoints": [
    "转折点1：主角发现真相",
    "转折点2：盟友背叛",
    "转折点3：最终对决"
  ],
  "ending": "结局走向描述",
  "themes": ["主题1", "主题2"]
}
```

### 5. outlines（新增表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 大纲唯一 ID |
| project_id | UUID | FK, UNIQUE, NOT NULL | 关联项目（1:1） |
| content | JSONB | NOT NULL, DEFAULT '{}' | 大纲内容（遵循项目类型的固定格式） |
| format | VARCHAR(50) | NOT NULL | 大纲格式：episode_list / act_structure |
| version | INTEGER | NOT NULL, DEFAULT 1 | 版本号（用于乐观锁） |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**content JSONB 结构**（短剧项目 - episode_list 格式）:
```json
{
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "坠入深渊",
      "highlight": "女主被背叛的震撼开场",
      "hook": "神秘电话暗示更大的阴谋",
      "keyEvents": [
        "发现男友出轨",
        "被公司降职",
        "偶遇神秘贵人"
      ],
      "durationSeconds": 180
    }
  ]
}
```

**content JSONB 结构**（微电影项目 - act_structure 格式）:
```json
{
  "structureModel": "三幕剧",
  "acts": [
    {
      "actNumber": 1,
      "actName": "建置",
      "actGoal": "建立主角日常生活",
      "sequences": [
        {
          "sequenceId": "seq1",
          "sequenceName": "触发事件",
          "plotPoint": "核心转折描述",
          "sceneCount": 3
        }
      ]
    }
  ]
}
```

### 6. review_reports（新增表）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 审查报告唯一 ID |
| project_id | UUID | FK, NOT NULL | 关联项目 |
| scope | VARCHAR(50) | NOT NULL | 审查范围：full / episode |
| episode_number | INTEGER | | 审查的集数（scope=episode 时） |
| report | JSONB | NOT NULL, DEFAULT '{}' | 审查报告内容 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

**report JSONB 结构**:
```json
{
  "overallScore": 82,
  "dimensions": {
    "rhythm": {"score": 78, "status": "warning", "details": "第3集节奏偏慢"},
    "characterConsistency": {"score": 90, "status": "good"},
    "dialogueQuality": {"score": 75, "status": "warning", "details": "部分台词书面化"},
    "foreshadowTracking": {"score": 85, "status": "good"},
    "logicCoherence": {"score": 80, "status": "good"}
  },
  "issues": [
    {
      "id": "issue-1",
      "severity": "medium",
      "location": {"episode": 3, "scene": 2, "beat": 1},
      "description": "反转稍显突兀，铺垫不足",
      "suggestion": "在第2集增加对第3集反转的伏笔铺垫",
      "status": "pending"
    }
  ],
  "foreshadowStatus": {
    "total": 5,
    "resolved": 3,
    "unresolved": 2,
    "details": [
      {"plant": "神秘戒指", "status": "planted", "episode": 1},
      {"plant": "幕后黑手", "status": "resolved", "episode": 5}
    ]
  }
}
```

### 7. characters（扩展现有表）

| 字段 | 类型 | 约束 | 说明 | 变更 |
|------|------|------|------|------|
| id | UUID | PK | 角色唯一 ID | 不变 |
| project_id | UUID | FK, NOT NULL | 关联项目 | 不变 |
| name | VARCHAR(255) | NOT NULL | 角色姓名 | 不变 |
| gender | VARCHAR(20) | | 性别 | **新增** |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'supporting' | 角色类型 | 不变（映射为 roleType） |
| identity | VARCHAR(255) | | 身份定位 | **新增** |
| persona | TEXT | | 人设特征与记忆点（短剧专用） | **新增** |
| description | TEXT | | 角色描述（微电影背景故事与动机） | 不变（映射为 background） |
| personality | JSONB | DEFAULT '[]' | 性格标签 | 不变 |
| appearance | TEXT | | 外貌描述 | 不变 |
| background | TEXT | | 背景故事（微电影专用） | 不变 |
| goals | TEXT | | 目标 | 不变 |
| relationships | JSONB | DEFAULT '[]' | 关系网络 | 不变 |
| dialogue_style | TEXT | | 对白风格 | 不变 |
| arc | TEXT | | 人物成长弧光（微电影专用） | 不变 |
| overview | TEXT | | 人物概述/小传 | **新增** |
| created_at | TIMESTAMP | NOT NULL | 创建时间 | 不变 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 | 不变 |

### 8. foreshadows（不修改）

现有表结构满足 Spec 要求，无需修改。

### 9. agent_sessions / agent_messages / project_budgets（不修改）

现有表结构满足 Spec 要求，无需修改。

## Flyway 迁移计划

### V2__workflow_schema.sql

```sql
-- 1. projects 表增加 logline 字段
ALTER TABLE projects ADD COLUMN logline TEXT;

-- 2. characters 表增加新字段
ALTER TABLE characters ADD COLUMN gender VARCHAR(20);
ALTER TABLE characters ADD COLUMN identity VARCHAR(255);
ALTER TABLE characters ADD COLUMN persona TEXT;
ALTER TABLE characters ADD COLUMN overview TEXT;

-- 3. 新建 world_settings 表
CREATE TABLE world_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. 新建 synopses 表
CREATE TABLE synopses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. 新建 outlines 表
CREATE TABLE outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}',
    format VARCHAR(50) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. 新建 review_reports 表
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL,
    episode_number INTEGER,
    report JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_review_reports_project ON review_reports(project_id, created_at DESC);

-- 7. 删除版本管理相关表（Spec 明确不需要）
DROP TABLE IF EXISTS script_versions CASCADE;
```

## 前后端类型对齐

### Frontend 新增/修改类型

**frontend/src/types/workflow.ts**（新增）:
```typescript
// 工作流步骤定义
export type WorkflowStep = 'worldview' | 'synopsis' | 'characters' | 'outline' | 'script'

// 工作流状态
export interface WorkflowState {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  stepData: Record<WorkflowStep, { status: 'pending' | 'in_progress' | 'completed' }>
}

// 世界观设定
export interface WorldSetting {
  id: string
  project_id: string
  content: WorldSettingContent
  created_at: string
  updated_at: string
}

export interface WorldSettingContent {
  genre: string
  style: string
  era: string
  setting: string
  coreConflict: string
  uniqueSellingPoint: string
  worldRules: string[]
  locations: Array<{ name: string; description: string }>
  themes: string[]
}

// 梗概
export interface Synopsis {
  id: string
  project_id: string
  content: SynopsisContent
  created_at: string
  updated_at: string
}

export interface SynopsisContent {
  mainPlot: string
  coreConflict: string
  turningPoints: string[]
  ending: string
  themes: string[]
}

// 大纲
export interface Outline {
  id: string
  project_id: string
  content: OutlineContent
  format: 'episode_list' | 'act_structure'
  version: number
  created_at: string
  updated_at: string
}

// 审查报告
export interface ReviewReport {
  id: string
  project_id: string
  scope: 'full' | 'episode'
  episode_number?: number
  report: ReviewReportContent
  created_at: string
}

export interface ReviewReportContent {
  overallScore: number
  dimensions: Record<string, { score: number; status: string; details?: string }>
  issues: Array<{
    id: string
    severity: 'high' | 'medium' | 'low'
    location: { episode?: number; scene?: number; beat?: number }
    description: string
    suggestion: string
    status: 'pending' | 'accepted' | 'ignored' | 'manual'
  }>
  foreshadowStatus: {
    total: number
    resolved: number
    unresolved: number
  }
}
```

**shared/types/script.ts**（修改）:
- Character 接口增加 gender、identity、persona、overview 字段
- 确保 ScriptBeat.beatType 包含短剧特有类型：受辱/打脸/掉马甲/误会/反转/悬念
- 增加传统影视 Block 类型支持
