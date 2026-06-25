# Data Model: ScriptMind Chat History Storage

**Date**: 2026-06-25

## Entity Changes

### AgentSession (agent_sessions)

| 字段 | 类型 | 变更 | 说明 |
|------|------|------|------|
| id | UUID PK | 无变更 | 主键 |
| project_id | UUID FK | 无变更 | 关联项目 |
| session_type | VARCHAR(50) | 无变更 | 会话类型 |
| status | VARCHAR(20) | 无变更 | pending/running/completed/failed |
| input_data | JSONB | 无变更 | 输入数据 |
| output_data | JSONB | 无变更 | 输出数据 |
| tokens_consumed | INT | 无变更 | Token 消耗 |
| workflow_step | VARCHAR(50) | 无变更 | 工作流步骤 |
| agent_name | VARCHAR(50) | 无变更 | Agent 名称 |
| started_at | TIMESTAMP | 无变更 | 开始时间 |
| completed_at | TIMESTAMP | 无变更 | 完成时间 |
| created_at | TIMESTAMP | 无变更 | 创建时间 |
| **title** | **VARCHAR(200)** | **新增** | 会话标题（自动生成或用户编辑） |

**新增索引**:
- `idx_agent_sessions_project_step_created`: `(project_id, workflow_step, created_at DESC)` — 用于会话列表查询

**状态转换**:
```
pending → running → completed
                  → failed
```

### AgentMessage (agent_messages)

无 schema 变更。现有 `message_type` 和 `metadata` 列已满足 Block 结构存储需求。

**关键行为变更**:
- `save()` 路径：多 block 消息的完整结构序列化到 `metadata` JSONB
- `load()` 路径：根据 `messageType` 重建对应的 AgentScope ContentBlock 类型

### 新增：SessionTitle 生成逻辑

非持久化实体，仅作为标题生成的中间数据结构：

```
SessionTitle:
  - source: "auto" | "manual"
  - text: String (≤200 chars)
  - generatedAt: LocalDateTime
```

## 关系图

```
Project (1) ──── (N) AgentSession
                        │
                        │ 1:N
                        ▼
                   AgentMessage
                        │
                        │ metadata JSONB
                        ▼
                   ContentBlock[]
                   ├── TextBlock
                   ├── ThinkingBlock
                   ├── ToolUseBlock
                   └── ToolResultBlock
```

## 数据量估算

- 每个项目 × 每个 workflow step: 数十到数百个会话
- 每个会话: 数条到数十条消息
- 每条消息: 1-5 个 content block
- 总数据量: 小规模，单表百万行以内
