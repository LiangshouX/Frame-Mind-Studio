# Implementation Plan: ScriptMind Agent Enhancement & Chat UI Optimization

**Branch**: `008-scriptmind-agent-enhancement` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-scriptmind-agent-enhancement/spec.md`

## Summary

Replace the current multi-agent pipeline architecture with 5 dedicated AgentScope `ReActAgent` instances (one per ScriptMind workflow tab). Each agent uses `@Tool`-annotated methods for data operations and `streamEvents()` for fine-grained WebSocket streaming. The frontend chat window is rebuilt to support collapsible thinking/tool blocks, agent configuration via drawer, and per-tab chat history persistence. Database schema is extended via Flyway migration V3.

## Technical Context

**Language/Version**: Java 17, TypeScript 5.x

**Primary Dependencies**: AgentScope Java 2.0.0-SNAPSHOT (local build from `.lib-repo/agentscope-java-main`), Spring Boot 3.2.5, Next.js 14, Zustand, Reactor Core

**Storage**: PostgreSQL 15+ (JSONB columns), filesystem (`~/.framemind/agents/`)

**Testing**: JUnit 5 + Spring Boot Test (backend), Playwright (frontend E2E)

**Target Platform**: Windows/macOS/Linux desktop (local dev server)

**Project Type**: Web application (Spring Boot backend + Next.js frontend)

**Performance Goals**: <500ms first-token latency, <10s character creation via agent tool

**Constraints**: AgentScope core module only (no Spring Boot starters — version mismatch with SB 3.2.5 vs AgentScope's SB 4.0.4). Existing WebSocket infrastructure must be preserved. Data consistency is critical — no data loss, no duplication, no redundancy.

**Scale/Scope**: Single-user local application, 5 agent tabs, ~50 functional requirements

## Constitution Check

Project constitution is a template with no specific principles defined. No gates to check.

## Project Structure

### Documentation (this feature)

```text
specs/008-scriptmind-agent-enhancement/
├── plan.md                # This file
├── spec.md                # Feature specification
├── research.md            # Phase 0: research findings (8 decisions)
├── data-model.md          # Phase 1: data model changes
├── quickstart.md          # Phase 1: validation guide
├── contracts/
│   └── agent-chat-api.md  # Phase 1: REST + WebSocket API contract
└── tasks.md               # Phase 2: implementation tasks (via /speckit-tasks)
```

### Source Code (repository root)

```text
backend-java/src/main/java/io/framemind/
├── agent/                              # REWRITE: Agent infrastructure
│   ├── config/
│   │   ├── AgentDefinition.java        # KEEP
│   │   └── AgentScopeConfig.java       # REWRITE: 5 tab-aligned agent defs
│   ├── core/                           # NEW: AgentScope integration
│   │   ├── AgentScopeAgentFactory.java # Builds ReActAgent instances
│   │   ├── AgentEventBridge.java       # AgentEvent → WebSocket messages
│   │   └── JpaAgentStateStore.java     # AgentState persistence
│   ├── tool/                           # NEW: @Tool implementations
│   │   ├── WebSearchTool.java          # Tavily web search
│   │   ├── CharacterTool.java          # Character CRUD tools
│   │   ├── SynopsisTool.java           # Synopsis save/load
│   │   ├── OutlineTool.java            # Outline save/load
│   │   └── ScriptTool.java            # Script save/consistency check
│   ├── hook/
│   │   ├── StreamingHook.java          # MODIFY: new message types
│   │   └── BudgetHook.java             # KEEP
│   └── orchestration/
│       ├── AgentCallAdapter.java       # DEPRECATE
│       ├── AgentScopeCallAdapter.java  # DEPRECATE
│       ├── PlaceholderAgentCallAdapter.java # DEPRECATE
│       └── PipelineOrchestrator.java   # REWRITE: tab-based dispatch
├── core/
│   ├── adapter/
│   │   ├── AgentController.java        # MODIFY: new chat/config endpoints
│   │   └── AgentWebSocketHandler.java  # MODIFY: new message types
│   ├── service/
│   │   ├── ConfigFileStore.java        # MODIFY: agent config methods
│   │   └── AgentConfigService.java     # NEW: two-layer config merge
│   └── config/
│       └── WebSocketConfig.java        # KEEP
├── modules/scriptmind/
│   ├── agent/                          # REWRITE: all 5 agents
│   │   ├── CreativeAgent.java          # REWRITE → ReActAgent
│   │   ├── SynopsisAgent.java          # NEW
│   │   ├── CharacterAgent.java         # NEW
│   │   ├── OutlineAgent.java           # NEW
│   │   └── ScriptAgent.java            # NEW
│   ├── controller/                     # KEEP: existing CRUD controllers
│   └── service/                        # KEEP: existing services
└── infrastructure/po/
    ├── AgentSessionPO.java             # MODIFY: +workflowStep, +agentName
    ├── AgentMessagePO.java             # MODIFY: +messageType, +metadata
    ├── AgentConfigOverridePO.java       # NEW
    └── CharacterPO.java                # MODIFY: +version

backend-java/src/main/resources/db/migration/
└── V3__agent_enhancement.sql           # NEW

frontend/src/
├── components/shared/agent-chat/
│   ├── index.tsx                        # REWRITE
│   ├── message-list.tsx                 # REWRITE: collapsible blocks
│   ├── collapsible-block.tsx            # NEW
│   ├── input-bar.tsx                    # MODIFY
│   ├── stage-indicator.tsx              # DELETE
│   └── agent-config-drawer.tsx          # NEW
├── components/scriptmind/
│   └── workflow-layout/index.tsx        # MODIFY
├── stores/
│   ├── agent-store.ts                   # REWRITE
│   └── agent-config-store.ts            # NEW
├── types/
│   └── agent.ts                         # REWRITE
└── lib/api/
    └── agent-api.ts                     # MODIFY
```

**Structure Decision**: Extends existing layered architecture. Agent infrastructure rebuilt in-place under `agent/`, new tools in `agent/tool/`, ScriptMind module agents rewritten under `modules/scriptmind/agent/`.

---

## Phase 0: Foundation & Infrastructure

### Task 0.1: Install AgentScope Core to Local Maven Repo
Build `agentscope-core:2.0.0-SNAPSHOT` from `.lib-repo/agentscope-java-main/` and install to local Maven repo. Update `backend-java/pom.xml` version.
**Verification**: `./mvnw compile` succeeds.

### Task 0.2: Database Migration V3
Create `V3__agent_enhancement.sql` — extend `agent_sessions` (+workflow_step, +agent_name), `agent_messages` (+message_type, +metadata), create `agent_config_overrides`, add `version` to `characters`.
**Verification**: `./mvnw flyway:migrate` succeeds.

### Task 0.3: Update JPA Entities
Modify `AgentSessionPO`, `AgentMessagePO`, `CharacterPO`. Create `AgentConfigOverridePO`.
**Verification**: App starts without schema validation errors.

### Task 0.4: Implement JpaAgentStateStore
Implement `AgentStateStore` backed by `agent_messages`. Handles `AgentState.context` (List<Msg>) serialization.
**Verification**: Unit test — state round-trip.

---

## Phase 1: Agent Infrastructure

### Task 1.1: Create AgentScopeAgentFactory
Builds `ReActAgent` from `AgentConfiguration`. Reads merged config, registers tools, sets state store.
**Verification**: Unit test — correct agent construction.

### Task 1.2: Create AgentEventBridge
Converts `AgentEvent` stream → WebSocket JSON messages. Maps TextBlockDelta→stream_chunk, ThinkingBlock→thinking_block, ToolCall→tool_call, etc.
**Verification**: Unit test — event mapping.

### Task 1.3: Implement Tool Classes
`@Tool`-annotated: WebSearchTool, CharacterTool (CRUD + batch), SynopsisTool, OutlineTool, ScriptTool. Each wraps existing service with optimistic locking.
**Verification**: Unit test each tool.

### Task 1.4: Implement AgentConfigService
Two-layer merge: global filesystem + project DB overrides. Hot reload on filesystem change.
**Verification**: Unit test — merge semantics.

### Task 1.5: Rewrite PipelineOrchestrator
Tab-based dispatch: `dispatchToAgent(projectId, workflowStep, message)`. Single-agent invocation via `streamEvents()`.
**Verification**: Integration test — full chat flow.

---

## Phase 2: Backend API Layer

### Task 2.1: New REST Endpoints
Per contracts/agent-chat-api.md: `/agent/chat`, `/agent/generate`, `/agent/sessions/{step}`, `/agent/config/{name}` (CRUD).
**Verification**: Compile + manual endpoint test.

### Task 2.2: Update StreamingHook
New methods: `onThinkingBlock`, `onToolCall`, `onToolResult`, `onConflictDetected`. Remove old `STAGE_LABELS`.
**Verification**: Unit test — JSON output.

### Task 2.3: Remove Deprecated Code
Deprecate `AgentCallAdapter` + implementations. Remove old agent wrappers. Clean `AgentScopeConfig`.
**Verification**: `./mvnw compile` succeeds.

---

## Phase 3: Frontend Chat Window

### Task 3.1: Update Agent Types
Rewrite `types/agent.ts` — remove AgentStage, add MessageType, CollapsibleBlock, new WS message types.
**Verification**: `tsc` compiles.

### Task 3.2: Rewrite Agent Store
Per-tab sessions, collapsible blocks state, remove stage/label logic.
**Verification**: Unit test.

### Task 3.3: Build CollapsibleBlock Component
Three variants (thinking/tool/skill), default collapsed, click to expand.
**Verification**: Manual test.

### Task 3.4: Rewrite MessageList
Render user/assistant/error messages with inline collapsible blocks.
**Verification**: Manual test.

### Task 3.5: Remove StageIndicator, Update InputBar
Delete `stage-indicator.tsx`. Remove style presets from input bar.
**Verification**: `npm run build` succeeds.

### Task 3.6: Build AgentConfigDrawer
Drawer with system prompt, skills, rules fields. Save/delete/restore-defaults.
**Verification**: Manual test.

### Task 3.7: Rewrite AgentChat Index
Remove StageIndicator, add config button, use per-tab sessions.
**Verification**: Manual test — worldview chat works.

---

## Phase 4: Frontend Integration

### Task 4.1: Update WorkflowLayout
New REST endpoints, handle new WS message types, pass workflowStep.
**Verification**: Manual test — end-to-end worldview flow.

### Task 4.2: Update Content Panels
"AI一键生成" → `/agent/generate`. Content refresh on `complete`.
**Verification**: Manual test — each panel.

### Task 4.3: Update Script Editor
Sidebar outline nodes, click→inject context, AI generation with per-section loading.
**Verification**: Manual test — script tab.

### Task 4.4: Update API Client
New functions for all new endpoints.
**Verification**: `tsc` compiles.

---

## Phase 5: Testing & Integration

### Task 5.1: Backend Unit Tests
Factory, EventBridge, Tools, ConfigService, StateStore.
### Task 5.2: Backend Integration Tests
Full chat flow, tool execution, config merge, conflict detection.
### Task 5.3: Frontend E2E Tests
Quickstart V1-V6 as Playwright tests.
### Task 5.4: Build Verification
`./mvnw clean package` + `npm run build && npm run lint` — zero errors.

---

## Dependency Graph

```
Phase 0:  0.1 (AgentScope) ──┐
          0.2 (DB migration) ─┤
          0.3 (JPA entities) ← 0.2
          0.4 (StateStore)   ← 0.3

Phase 1:  1.1 (Factory)     ← 0.1, 0.4
          1.2 (EventBridge)  ← 0.1
          1.3 (Tools)        ← 0.3
          1.4 (ConfigService)← 0.3
          1.5 (Orchestrator) ← 1.1, 1.2, 1.3

Phase 2:  2.1 (REST API)    ← 1.5
          2.2 (StreamingHook)← 1.2
          2.3 (Cleanup)      ← 2.1

Phase 3:  3.1 (Types)        (independent)
          3.2 (Store)        ← 3.1
          3.3 (Collapsible)  ← 3.1
          3.4 (MessageList)  ← 3.2, 3.3
          3.5 (Remove SI)    ← 3.4
          3.6 (ConfigDrawer) ← 3.1
          3.7 (AgentChat)    ← 3.4, 3.5, 3.6

Phase 4:  4.1 (WorkflowLayout)← 3.7
          4.2 (ContentPanels) ← 4.1
          4.3 (ScriptEditor)  ← 4.1
          4.4 (APIClient)     ← 3.1

Phase 5:  5.1 (BE tests)    ← Phase 2
          5.2 (BE integ)     ← 5.1
          5.3 (FE E2E)       ← Phase 4
          5.4 (Build verify)  ← 5.1, 5.3
```

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| AgentScope 2.0.0-SNAPSHOT API instability | Pin to local build, abstract behind factory |
| Spring Boot 3.2.5 vs AgentScope dependency conflicts | Core module only, explicit POM overrides |
| Data loss during concurrent tool calls | Optimistic locking on all mutable entities |
| WebSocket message ordering | AgentScope `streamEvents()` preserves order within call |
| Agent config hot-reload race conditions | `ReentrantReadWriteLock` in ConfigService |
