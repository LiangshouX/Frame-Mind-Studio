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
| **title** | **VARCHAR(200)** | **V4 新增** | 会话标题（自动生成或用户编辑） |
| **title_source** | **VARCHAR(20)** | **V5 新增** | 标题来源：auto（自动生成）/ manual（用户手动编辑） |

**新增索引**:
- `idx_agent_sessions_project_step_created`: `(project_id, workflow_step, created_at DESC)` — 用于会话列表查询

**标题生成规则**:
- 自动生成时：从第一条用户消息中智能提取核心主题，去除常见请求前缀（"请帮我"、"Help me" 等），保留有意义的内容（最多 40 字符）
- 用户手动编辑后：`title_source` 设为 `"manual"`，后续自动生成不再覆盖
- 回退策略：无用户消息或提取失败时，使用时间戳格式（"对话 MM-dd HH:mm"）

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

### SessionTitle 生成逻辑

标题来源通过 `title_source` 列持久化追踪：

| title_source | 含义 | 触发场景 |
|-------------|------|---------|
| `"auto"` | 自动生成 | Agent 对话完成后异步生成；提取首条用户消息核心主题 |
| `"manual"` | 用户手动编辑 | 用户通过 PATCH API 或在 UI 编辑标题 |

自动生成不会覆盖 `title_source = "manual"` 的标题。

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
