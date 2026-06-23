# Research: ScriptMind Agent Enhancement

**Date**: 2026-06-23
**Feature**: 008-scriptmind-agent-enhancement

## R1: AgentScope Java Integration Strategy

### Decision
Use AgentScope `ReActAgent` directly (not the current `AgentCallAdapter` wrapper pattern). Each of the 5 tabs gets its own `ReActAgent` instance built via `ReActAgent.builder()`. Streaming uses `streamEvents()` returning `Flux<AgentEvent>` for fine-grained event emission.

### Rationale
- The current `AgentCallAdapter.call()` returns a single aggregated `String`, losing tool-call, thinking, and structured-output granularity.
- AgentScope's `streamEvents()` emits 28+ typed events (`TextBlockDeltaEvent`, `ToolCallStartEvent`, `ThinkingBlockDeltaEvent`, etc.) which map directly to the new WebSocket message types needed for collapsible blocks.
- `ReActAgent` natively handles multi-turn conversation via `AgentState.contextMutable()` (conversation buffer), eliminating the need for manual prompt construction.
- Tools are registered via `@Tool` annotations on plain Java objects, injected through `Toolkit.registerTool()`.

### Alternatives Considered
1. **Keep `AgentCallAdapter` wrapper, extend it** — Rejected: adds an unnecessary abstraction layer that blocks access to AgentScope's event system and tool mechanism.
2. **Use AgentScope's `agentscope-harness` module** — Rejected: harness adds channel/gateway/session management infrastructure that duplicates FrameMind's existing WebSocket/session system. Core module is sufficient.

## R2: Spring Boot Version Compatibility

### Decision
Keep Spring Boot `3.2.5`. Use `agentscope-core` module only (not `agentscope-harness` or Spring Boot starters). Import AgentScope's dependency BOM to align transitive dependency versions.

### Rationale
- `agentscope-core` does not depend on Spring Boot — it uses Reactor Core, Jackson, OkHttp directly.
- The Spring Boot version mismatch (3.2.5 vs AgentScope's 4.0.4) only matters for starters/extensions that depend on Spring APIs.
- Importing the AgentScope BOM ensures Jackson, Reactor, OkHttp versions are coordinated.
- If transitive conflicts arise, explicit version overrides in the FrameMind POM can resolve them.

### Alternatives Considered
1. **Upgrade to Spring Boot 4.0.4** — Rejected: massive migration effort, out of scope for this feature.
2. **Use `agentscope-core:2.0.0-RC3` (current)** — Rejected: stale version lacks `streamEvents()`, `@Tool` annotations, and the modern event system.

## R3: Agent-to-Tab Mapping & Tool Design

### Decision
5 dedicated `ReActAgent` instances, one per tab:

| Tab | Agent Name | Tools |
|-----|-----------|-------|
| Worldview | `creative_agent` | `web_search` (Tavily) |
| Synopsis | `synopsis_agent` | `save_synopsis`, `load_worldview` |
| Characters | `character_agent` | `create_character`, `update_character`, `delete_character`, `batch_create_characters`, `batch_delete_characters` |
| Outline | `outline_agent` | `save_outline`, `load_characters`, `load_synopsis`, `load_worldview` |
| Script | `script_agent` | `save_scene`, `load_outline`, `check_consistency` |

Each agent's `@Tool` methods call the existing service layer (`CharacterService`, `SynopsisService`, etc.) for persistence, ensuring data consistency.

### Rationale
- 1:1 mapping simplifies isolation — each agent has its own `AgentState`, conversation buffer, and tool set.
- Tools wrap existing service methods, reusing transaction management and validation logic.
- `web_search` tool integrates Tavily (already configured in settings).

## R4: Agent Config Two-Layer Architecture

### Decision
- **Global defaults**: Stored in `~/.framemind/agents/{agent-name}.json` (new files alongside existing `config.json`).
- **Project-level overrides**: Stored in new `agent_config_overrides` database table (JSONB `config` column).
- **Merge semantics**: Project-level overrides deep-merge over global defaults at agent build time.
- **Hot reload**: `AgentConfigService` watches filesystem changes and rebuilds agents on modification.

### Rationale
- Filesystem storage for globals matches the existing `ConfigFileStore` pattern.
- Database storage for project-level enables per-project customization without filesystem pollution.
- Deep-merge allows partial overrides (e.g., only change `sysPrompt` without duplicating tools).

## R5: Database Schema Extension Strategy

### Decision
Extend existing tables via new Flyway migration `V3`:
- `agent_sessions`: Add `workflow_step` (varchar(50)), `agent_name` (varchar(50))
- `agent_messages`: Add `message_type` (varchar(20)), `metadata` (JSONB)
- New `agent_config_overrides` table: `id`, `project_id` FK, `agent_name`, `config` (JSONB), `version`, `created_at`, `updated_at`
- `characters` table: Add `version` (integer, default 1) for optimistic locking

### Rationale
- Extending existing tables avoids data duplication and migration complexity.
- `workflow_step` enables per-tab session isolation (each tab's chat is a separate session).
- `message_type` enables the frontend to render collapsible blocks (tool_call, thinking, skill).
- Optimistic locking on `characters` prevents silent data loss from concurrent edits.

## R6: WebSocket Message Protocol Enhancement

### Decision
Extend the WebSocket message protocol with new event types that map to AgentScope's `AgentEvent` hierarchy:

| AgentScope Event | WebSocket Type | Frontend Rendering |
|-----------------|---------------|-------------------|
| `TextBlockDeltaEvent` | `stream_chunk` | Append to current message |
| `ThinkingBlockStart/Delta/End` | `thinking_block` | Collapsible thinking block |
| `ToolCallStart/Delta/End` | `tool_call` | Collapsible tool call block |
| `ToolResultStart/End` | `tool_result` | Collapsible tool result block |
| `AgentEndEvent` | `complete` | Finalize message |
| Error events | `error` | Error display |

### Rationale
- Direct mapping from AgentScope events to WebSocket messages eliminates the current lossy `String.call()` → chunk pipeline.
- Frontend receives structured data for each block type, enabling proper collapsible rendering.

## R7: AgentScope Local Build & Install

### Decision
Install `agentscope-core` to the local Maven repository from the `.lib-repo` source before building FrameMind:
```bash
cd .lib-repo/agentscope-java-main
mvn install -pl agentscope-dependencies-bom,agentscope-distribution/agentscope-bom,agentscope-core -DskipTests
```

### Rationale
- The local source (`2.0.0-SNAPSHOT`) has the latest `ReActAgent`, `streamEvents()`, `@Tool` support.
- `2.0.0-RC3` (currently in FrameMind POM) is too old for this feature's requirements.
- Local install avoids publishing to remote repositories.

## R8: Multi-Turn Conversation Persistence

### Decision
Use AgentScope's `AgentStateStore` interface to persist `AgentState` (conversation buffer) to the database. Implement `JpaAgentStateStore` backed by the `agent_messages` table.

### Rationale
- AgentScope natively manages conversation context in `AgentState.contextMutable()`.
- Persisting via `AgentStateStore` means the framework handles context loading/saving automatically on each `call()`.
- This replaces the current manual prompt construction with embedded conversation history.

### Alternatives Considered
1. **Manual prompt construction with history injection** — Rejected: error-prone, duplicates AgentScope's built-in conversation management.
2. **Filesystem-based state store** — Rejected: doesn't scale, no queryability, conflicts with multi-user scenarios.
