# Data Model: ScriptMind Agent Enhancement

**Date**: 2026-06-23
**Feature**: 008-scriptmind-agent-enhancement

## Entity Changes

### Modified: `agent_sessions`

Extends existing table to support per-tab chat sessions.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK (existing) |
| `project_id` | UUID | NO | | FK → projects (existing) |
| `session_type` | varchar(50) | NO | | (existing) |
| `status` | varchar(20) | NO | 'pending' | (existing) |
| `input_data` | JSONB | YES | | (existing) |
| `output_data` | JSONB | YES | | (existing) |
| `tokens_consumed` | int | NO | 0 | (existing) |
| `started_at` | timestamp | YES | | (existing) |
| `completed_at` | timestamp | YES | | (existing) |
| `created_at` | timestamp | NO | now() | (existing) |
| **`workflow_step`** | varchar(50) | YES | | **NEW** — `worldview`/`synopsis`/`characters`/`outline`/`script` |
| **`agent_name`** | varchar(50) | YES | | **NEW** — `creative_agent`/`synopsis_agent`/`character_agent`/`outline_agent`/`script_agent` |

**New Index**: `idx_agent_sessions_project_workflow` on `(project_id, workflow_step)` for per-tab session lookup.

### Modified: `agent_messages`

Extends existing table to support rich message types.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK (existing) |
| `session_id` | UUID | NO | | FK → agent_sessions (existing) |
| `agent_name` | varchar(50) | NO | | (existing) |
| `role` | varchar(20) | NO | | `user`/`assistant`/`tool`/`system` (existing) |
| `content` | text | NO | | (existing) |
| `message_order` | int | NO | | (existing) |
| `created_at` | timestamp | NO | now() | (existing) |
| **`message_type`** | varchar(20) | YES | 'text' | **NEW** — `text`/`tool_call`/`tool_result`/`thinking`/`skill` |
| **`metadata`** | JSONB | YES | | **NEW** — collapsible block data (tool name, thinking content, etc.) |

### New: `agent_config_overrides`

Project-level agent configuration overrides.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `project_id` | UUID | NO | | FK → projects |
| `agent_name` | varchar(50) | NO | | Agent identifier |
| `config` | JSONB | NO | | Override config (systemPrompt, skills, rules, modelOverride) |
| `version` | int | NO | 1 | Optimistic lock version |
| `created_at` | timestamp | NO | now() | |
| `updated_at` | timestamp | NO | now() | |

**Unique Constraint**: `(project_id, agent_name)` — one override per agent per project.

### Modified: `characters`

Add optimistic locking field.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| (all existing columns) | | | | |
| **`version`** | int | NO | 1 | **NEW** — optimistic lock version |

## New Entity: `AgentConfiguration` (filesystem + DB merge)

Not a database entity — a composite view assembled at runtime.

```json
{
  "agentName": "creative_agent",
  "description": "世界观创作助手",
  "systemPrompt": "你是一位专业的影视创意顾问...",
  "skills": ["web_search", "market_analysis"],
  "rules": ["输出必须为JSON格式", "每次回复不超过500字"],
  "modelOverride": null,
  "maxIters": 10
}
```

**Storage**:
- Global defaults: `~/.framemind/agents/{agent-name}.json`
- Project overrides: `agent_config_overrides.config` JSONB column
- Merge: project config deep-merges over global defaults

## AgentScope State Mapping

### `AgentState` → Database

AgentScope's `AgentState` (conversation buffer, session metadata) maps to:

| AgentState Field | Database Location |
|-----------------|-------------------|
| `sessionId` | `agent_sessions.id` |
| `context` (List<Msg>) | `agent_messages` (one row per Msg) |
| `summary` | `agent_sessions.output_data.summary` |
| `curIter` | Not persisted (runtime only) |

### `Msg` → `agent_messages` Row

| Msg Field | Column |
|-----------|--------|
| `id` | `id` |
| `role` (MsgRole) | `role` |
| `content` (List<ContentBlock>) | `content` (JSON serialized) |
| `metadata` | `metadata` |
| `timestamp` | `created_at` |

### `ContentBlock` Type → `message_type`

| ContentBlock Class | `message_type` value |
|-------------------|---------------------|
| `TextBlock` | `text` |
| `ThinkingBlock` | `thinking` |
| `ToolUseBlock` | `tool_call` |
| `ToolResultBlock` | `tool_result` |

## State Transitions

### AgentSession Status
```
pending → running → completed
                  → failed
```

### Character Version (Optimistic Locking)
```
Read: SELECT ... WHERE id = ? → get current version N
Write: UPDATE ... SET version = N+1 WHERE id = ? AND version = N
Conflict: 0 rows affected → prompt user to resolve
```

## Relationships

```
Project 1──* AgentSession (via project_id)
AgentSession 1──* AgentMessage (via session_id)
Project 1──* AgentConfigOverride (via project_id, unique per agent_name)
Project 1──* Character (via project_id, with optimistic locking)
```
