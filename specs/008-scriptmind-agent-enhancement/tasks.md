# Tasks: ScriptMind Agent Enhancement & Chat UI Optimization

**Input**: Design documents from `/specs/008-scriptmind-agent-enhancement/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/agent-chat-api.md

**Tests**: Not explicitly requested — test tasks omitted. Validation via quickstart.md scenarios at end.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US7)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend-java/src/main/java/io/framemind/`
- **Frontend**: `frontend/src/`
- **Migration**: `backend-java/src/main/resources/db/migration/`
- **Shared types**: `shared/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, extend database schema, update JPA entities

- [x] T001 Install agentscope-core to local Maven repo from `.lib-repo/agentscope-java-main/` (run `mvn install -pl agentscope-dependencies-bom,agentscope-distribution/agentscope-bom,agentscope-core -DskipTests`) and update `backend-java/pom.xml` to version `2.0.0-SNAPSHOT`
- [x] T002 Create Flyway migration `backend-java/src/main/resources/db/migration/V3__agent_enhancement.sql`: add `workflow_step VARCHAR(50)`, `agent_name VARCHAR(50)` to `agent_sessions`; add `message_type VARCHAR(20) DEFAULT 'text'`, `metadata JSONB` to `agent_messages`; create `agent_config_overrides` table (id UUID PK, project_id UUID FK, agent_name VARCHAR(50), config JSONB, version INT DEFAULT 1, created_at TIMESTAMP, updated_at TIMESTAMP, UNIQUE(project_id, agent_name)); add `version INT DEFAULT 1` to `characters`
- [x] T003 [P] Update `infrastructure/po/AgentSessionPO.java`: add `workflowStep` (String), `agentName` (String) fields with JPA column annotations
- [x] T004 [P] Update `infrastructure/po/AgentMessagePO.java`: add `messageType` (String, default "text"), `metadata` (JsonNode, JSONB column) fields
- [x] T005 [P] Update `infrastructure/po/CharacterPO.java`: add `version` (Integer, default 1) field with `@Version` annotation for optimistic locking
- [x] T006 [P] Create `infrastructure/po/AgentConfigOverridePO.java`: JPA entity with `id`, `project` (ManyToOne→ProjectPO), `agentName`, `config` (JsonNode, JSONB), `version`, `createdAt`, `updatedAt`; add unique constraint on `(project_id, agent_name)`
- [x] T007 [P] Create `infrastructure/repository/AgentConfigOverrideRepository.java`: Spring Data JPA repository with `findByProjectIdAndAgentName()`, `deleteByProjectIdAndAgentName()`

**Checkpoint**: Database schema extended, JPA entities compile, app starts without schema errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core agent infrastructure — MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create `agent/core/AgentScopeAgentFactory.java`: factory that builds `ReActAgent` instances from `AgentConfiguration`; reads merged config (global + project override) via `AgentConfigService`; builds `ReActAgent.builder()` with name, sysPrompt, model (from ConfigFileStore), toolkit (with registered tools), maxIters, JpaAgentStateStore; supports `buildAgent(projectId, agentName)` returning a configured `ReActAgent`
- [x] T009 Create `agent/core/AgentEventBridge.java`: converts `Flux<AgentEvent>` from `streamEvents()` to WebSocket JSON messages via `AgentWebSocketHandler`; maps `TextBlockDeltaEvent`→`stream_chunk`, `ThinkingBlockStart/Delta/End`→`thinking_block`, `ToolCallStart/Delta/End`→`tool_call`, `ToolResultStart/End`→`tool_result`, `AgentEndEvent`→`complete`, errors→`error`; each mapping produces the JSON envelope `{"type": "...", "data": {...}}`
- [x] T010 [P] Create `agent/core/JpaAgentStateStore.java`: implements AgentScope's `AgentStateStore` interface; persists `AgentState` (conversation buffer as `List<Msg>`) to `agent_messages` table; `save(userId, sessionId, state)` serializes each Msg to an AgentMessagePO row; `load(userId, sessionId)` deserializes rows back to AgentState; `exists(userId, sessionId)` checks for rows
- [x] T011 [P] Create `agent/tool/WebSearchTool.java`: `@Tool`-annotated class wrapping Tavily API; method `web_search(@ToolParam(query) String query)` returns search results as formatted string; injects existing Tavily config from `ConfigFileStore`
- [x] T012 [P] Create `agent/tool/CharacterTool.java`: `@Tool`-annotated class wrapping `CharacterService`; methods: `create_character(name, gender, role, identity, persona, appearance, background, personality, relationships, arc)`, `update_character(characterId, field, value, expectedVersion)` with optimistic locking, `delete_character(characterId)`, `batch_create_characters(description)` parses description to create multiple, `batch_delete_characters(characterIds)`; each method returns success/failure JSON string
- [x] T013 [P] Create `agent/tool/SynopsisTool.java`: `@Tool`-annotated class; methods: `save_synopsis(content)` saves to SynopsisService, `load_worldview_context(projectId)` returns current world setting as context string
- [x] T014 [P] Create `agent/tool/OutlineTool.java`: `@Tool`-annotated class; methods: `save_outline(content, format)` saves to OutlineService with format validation, `load_synopsis_context(projectId)`, `load_characters_context(projectId)` returns character list as context
- [x] T015 [P] Create `agent/tool/ScriptTool.java`: `@Tool`-annotated class; methods: `save_scene_content(episodeNumber, sceneNumber, content)` saves to ScriptService, `load_outline_context(projectId)` returns outline structure, `check_consistency(projectId, fromEpisode)` checks subsequent episodes for contradictions
- [x] T016 Create `core/service/AgentConfigService.java`: two-layer config merge service; `loadConfig(projectId, agentName)` reads global from `~/.framemind/agents/{agent-name}.json`, reads project override from `AgentConfigOverrideRepository`, deep-merges (project wins); `saveProjectOverride(projectId, agentName, config)` upserts to DB with optimistic locking; `deleteProjectOverride(projectId, agentName)` reverts to global; `watchGlobalConfig()` watches filesystem for hot reload using `ScheduledExecutorService` polling
- [x] T017 Rewrite `agent/orchestration/PipelineOrchestrator.java`: replace multi-stage pipelines with `dispatchToAgent(projectId, workflowStep, userMessage, onChunk)` that creates/reuses AgentSessionPO (keyed by projectId+workflowStep), builds agent via `AgentScopeAgentFactory`, calls `agent.streamEvents()`, pipes through `AgentEventBridge`; add `generateAction(projectId, workflowStep, action)` for "AI一键生成" with step-specific pre-configured prompts
- [x] T018 Update `agent/hook/StreamingHook.java`: add methods `onThinkingBlock(sessionId, blockId, status, content)`, `onToolCall(sessionId, blockId, status, toolName, toolInput, toolResult)`, `onToolResult(sessionId, blockId, toolName, output)`, `onConflictDetected(sessionId, entityType, entityId, currentVersion, expectedVersion)`; remove `STAGE_LABELS` map
- [x] T019 Update `core/adapter/AgentController.java`: add endpoints per contracts/agent-chat-api.md — `POST /api/v1/projects/{projectId}/agent/chat`, `POST /api/v1/projects/{projectId}/agent/generate`, `GET /api/v1/projects/{projectId}/agent/sessions/{workflowStep}`, `GET/PUT/DELETE /api/v1/projects/{projectId}/agent/config/{agentName}`; all delegate to `PipelineOrchestrator` and `AgentConfigService`

**Checkpoint**: Backend compiles, agent can be invoked via REST, WebSocket messages stream correctly

---

## Phase 3: User Story 1 — Interactive Creative Ideation via Worldview Tab (Priority: P1) 🎯 MVP

**Goal**: User can have multi-turn conversation with worldview agent, receive streaming responses with collapsible thinking/tool blocks, and trigger "AI一键生成"

**Independent Test**: Open Worldview tab, send messages, verify streaming + multi-turn memory + collapsible blocks

### Implementation for User Story 1

- [x] T020 [US1] Rewrite `agent/config/AgentScopeConfig.java`: replace old 5-agent map with new tab-aligned definitions (`creative_agent`, `synopsis_agent`, `character_agent`, `outline_agent`, `script_agent`); each has Chinese system prompt, appropriate maxIters, null model (resolved at runtime); remove old `showrunner`/`world_builder`/`character_designer`/`script_doctor`/`creative` entries
- [x] T021 [US1] Create `modules/scriptmind/agent/CreativeAgent.java`: rewrite using `AgentScopeAgentFactory` to build a `ReActAgent` for worldview tab; registers `WebSearchTool`; system prompt guides creative ideation with multi-turn memory; method `chat(projectId, userMessage, onChunk)` delegates to factory-built agent
- [x] T022 [US1] Rewrite `frontend/src/types/agent.ts`: remove `AgentStage` union and `AGENT_STAGES`; add `MessageType = 'text' | 'tool_call' | 'tool_result' | 'thinking' | 'skill'`; add `CollapsibleBlock { id, type, toolName?, content, isCollapsed, status }`; update `AgentWebSocketMessage` union with `ThinkingBlockMessage`, `ToolCallMessage`, `ToolResultMessage`; add `AgentConfig` interface
- [x] T023 [US1] Rewrite `frontend/src/stores/agent-store.ts`: remove `stage`/`stageLabel` state; add `collapsibleBlocks: CollapsibleBlock[]`; add `sessions: Record<string, { messages, isRunning, isStreaming }>` keyed by workflowStep; update `appendStream` to handle new message types; add `addCollapsibleBlock`, `updateCollapsibleBlock`, `toggleBlockCollapse` actions; add `activeTab` tracking
- [x] T024 [US1] Create `frontend/src/components/shared/agent-chat/collapsible-block.tsx`: renders collapsible card with header (icon + title + toggle chevron); three variants — thinking (brain icon, purple), tool_call (wrench icon, blue), skill (sparkle icon, amber); default collapsed, click to expand; shows tool name and brief summary when collapsed, full content when expanded
- [x] T025 [US1] Rewrite `frontend/src/components/shared/agent-chat/message-list.tsx`: remove agent stage color/label logic; render user messages right-aligned blue, assistant messages left-aligned gray; inline `CollapsibleBlock` components for tool_call/thinking/skill message types; error messages red background; auto-scroll on new messages; streaming indicator on last message
- [x] T026 [US1] Delete `frontend/src/components/shared/agent-chat/stage-indicator.tsx` and remove all imports/references to it from `index.tsx` and other files
- [x] T027 [US1] Update `frontend/src/components/shared/agent-chat/input-bar.tsx`: remove style preset chips (STYLE_PRESETS imports and rendering), keep textarea + send button; Enter submits, Shift+Enter newline
- [x] T028 [US1] Rewrite `frontend/src/components/shared/agent-chat/index.tsx`: remove `StageIndicator` composition; add gear icon button in header that opens `AgentConfigDrawer`; accept `workflowStep` prop to determine agent/session; pass `onGenerate` callback prop for "AI一键生成"; compose `MessageList` + `InputBar` + `BudgetWarning` + new config button
- [x] T029 [US1] Update `frontend/src/components/scriptmind/workflow-layout/index.tsx`: use per-tab session management from agent store; call `POST /api/v1/projects/{projectId}/agent/chat` instead of old generation APIs; handle new WebSocket message types (`thinking_block`, `tool_call`, `tool_result`); pass `workflowStep="worldview"` to `AgentChat`; wire "AI一键生成" to `POST /api/v1/projects/{projectId}/agent/generate`
- [x] T030 [US1] Update `frontend/src/components/scriptmind/worldview-panel/index.tsx`: "AI一键生成" button triggers agent chat via workflow layout's `onGenerate` callback instead of direct API call; content refreshes when agent `complete` message received
- [x] T031 [US1] Update `frontend/src/lib/websocket/stomp-client.ts`: add handler types for new message types (`ThinkingBlockMessage`, `ToolCallMessage`, `ToolResultMessage`); no structural changes needed — just extend the handler union type
- [x] T032 [US1] Update `frontend/src/lib/api/agent-api.ts`: add `sendChatMessage(projectId, workflowStep, message, preset?)`, `triggerGeneration(projectId, workflowStep, action)`, `getChatHistory(projectId, workflowStep)` functions calling new endpoints

**Checkpoint**: Worldview tab fully functional — streaming chat, collapsible blocks, multi-turn memory, AI一键生成

---

## Phase 4: User Story 2 — Agent Configuration via Drawer (Priority: P1)

**Goal**: User can configure each tab's agent via drawer, changes persist and hot-reload

**Independent Test**: Open config drawer, modify system prompt, save, verify agent uses new prompt

### Implementation for User Story 2

- [x] T033 [P] [US2] Create `frontend/src/stores/agent-config-store.ts`: Zustand store with `configs: Record<string, AgentConfig>`, `isLoading`, `isDirty`; actions: `fetchConfig(projectId, agentName)`, `saveConfig(projectId, agentName, config)`, `deleteConfig(projectId, agentName)`, `updateLocalConfig(agentName, partial)`
- [x] T034 [US2] Create `frontend/src/components/shared/agent-chat/agent-config-drawer.tsx`: slide-in drawer from right with Shadcn Sheet component; fields — system prompt (textarea), skills (tag input array), rules (tag input array), model override (dropdown from settings providers); Save button → PUT endpoint, Delete button → DELETE endpoint (revert to global), shows current source indicator (global/project override)
- [x] T035 [US2] Integrate `AgentConfigDrawer` into `AgentChat` index component: gear icon button in chat header opens drawer; pass current `workflowStep` and `projectId` to drawer; on save, trigger agent rebuild via `AgentConfigService` hot reload

**Checkpoint**: Agent config drawer works — edit, save, hot-reload, revert to defaults

---

## Phase 5: User Story 3 — Synopsis Generation and Refinement (Priority: P2)

**Goal**: Agent generates synopsis from worldview, supports interactive refinement

**Independent Test**: Complete worldview, navigate to Synopsis tab, trigger generation, verify output matches SynopsisContent model

### Implementation for User Story 3

- [ ] T036 [P] [US3] Create `modules/scriptmind/agent/SynopsisAgent.java`: `ReActAgent` for synopsis tab; registers `SynopsisTool` (save_synopsis, load_worldview_context); system prompt guides synopsis generation from worldview data; method `chat(projectId, userMessage, onChunk)`
- [ ] T037 [US3] Update `frontend/src/components/scriptmind/workflow-layout/index.tsx`: add `workflowStep="synopsis"` case — calls synopsis agent, passes worldview data as context
- [ ] T038 [US3] Update `frontend/src/components/scriptmind/synopsis-panel/index.tsx`: "AI一键生成" triggers agent chat; form refreshes when agent saves synopsis via tool; manual edits persist via existing SynopsisService

**Checkpoint**: Synopsis tab functional — AI generation from worldview, interactive refinement, form editing

---

## Phase 6: User Story 4 — Character Management via Agent Tools (Priority: P2)

**Goal**: Agent creates/edits/deletes characters via tools, character cards display correctly

**Independent Test**: Ask agent to create character, verify card appears; batch create, verify multiple cards; concurrent edit triggers conflict prompt

### Implementation for User Story 4

- [ ] T039 [P] [US4] Create `modules/scriptmind/agent/CharacterAgent.java`: `ReActAgent` for characters tab; registers `CharacterTool` (all 5 CRUD+batch tools); system prompt guides character design with structured output
- [ ] T040 [US4] Update `frontend/src/components/scriptmind/workflow-layout/index.tsx`: add `workflowStep="characters"` case
- [ ] T041 [US4] Update `frontend/src/components/scriptmind/character-panel/index.tsx`: refresh character card list when agent `complete` message received; show conflict resolution dialog on `conflict_detected` WebSocket message; optimistic locking UI — show version badge on cards
- [ ] T042 [US4] Update `CharacterService.java` and `CharacterController.java`: add version check on update (`WHERE version = expectedVersion`); return 409 Conflict on version mismatch with current and expected versions in response body

**Checkpoint**: Character tab functional — agent CRUD via tools, batch operations, conflict detection

---

## Phase 7: User Story 5 — Outline Generation with Format Awareness (Priority: P2)

**Goal**: Agent generates format-aware outlines (short_drama vs movie), comic shows "暂不支持"

**Independent Test**: Generate outline for short_drama → episode/scene/beat; movie → act/sequence/scene; comic → "暂不支持"

### Implementation for User Story 5

- [ ] T043 [P] [US5] Create `modules/scriptmind/agent/OutlineAgent.java`: `ReActAgent` for outline tab; registers `OutlineTool` (save_outline, load_synopsis_context, load_characters_context); system prompt reads project format and generates appropriate structure; includes "暂不支持" response for comic format
- [ ] T044 [US5] Update `frontend/src/components/scriptmind/workflow-layout/index.tsx`: add `workflowStep="outline"` case; check project format before allowing generation
- [ ] T045 [US5] Update `frontend/src/components/scriptmind/outline-panel/index.tsx`: "AI一键生成" triggers agent chat; for comic format projects, show "暂不支持" banner and disable generation button; outline form refreshes when agent saves via tool

**Checkpoint**: Outline tab functional — format-aware generation, comic format blocked gracefully

---

## Phase 8: User Story 6 — Script Writing with Outline-Driven Navigation (Priority: P3)

**Goal**: Script tab navigated by outline, AI generation with per-section progress, consistency checking

**Independent Test**: Click outline node → editor scrolls + context injected; AI生成剧本 → per-section loading; optimize section → consistency check

### Implementation for User Story 6

- [ ] T046 [P] [US6] Create `modules/scriptmind/agent/ScriptAgent.java`: `ReActAgent` for script tab; registers `ScriptTool` (save_scene_content, load_outline_context, check_consistency); system prompt generates screenplay per outline structure
- [ ] T047 [US6] Update `frontend/src/components/scriptmind/script-editor/index.tsx` and `scene-nav/index.tsx`: clicking outline node scrolls editor to section and injects `"[第X集第Y幕] 请优化以下内容："` into agent chat input; "AI生成剧本" triggers sequential generation — each section shows loading indicator in sidebar, updates to completed on `complete` message
- [ ] T048 [US6] Update `frontend/src/components/scriptmind/workflow-layout/index.tsx`: add `workflowStep="script"` case; handle sequential multi-section generation (multiple agent calls in sequence, tracking progress per section)
- [ ] T049 [US6] Update `frontend/src/components/scriptmind/script-editor/toolbar.tsx`: "AI生成剧本" button triggers sequential generation; show overall progress bar; disable button during generation

**Checkpoint**: Script tab functional — outline navigation, sequential generation with progress, consistency checking

---

## Phase 9: User Story 7 — Persistent Agent Chat Across Tabs (Priority: P3)

**Goal**: Each tab maintains independent chat history, persists across sessions

**Independent Test**: Send messages in Worldview, switch to Characters (empty), switch back (history preserved); close app, reopen, history loaded

### Implementation for User Story 7

- [ ] T050 [US7] Update `frontend/src/stores/agent-store.ts`: implement per-tab session loading — on tab switch, call `getChatHistory(projectId, workflowStep)` and populate store; cache loaded sessions to avoid redundant API calls
- [ ] T051 [US7] Update `frontend/src/components/scriptmind/workflow-layout/index.tsx`: on mount, load chat history for current workflowStep; on workflowStep change, save current tab state and load new tab's history
- [ ] T052 [US7] Verify `JpaAgentStateStore` correctly persists and restores conversation buffer across backend restarts — integration test scenario from quickstart.md V6

**Checkpoint**: Chat history persists per-tab, survives app restart

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, deprecation, build verification, quickstart validation

- [ ] T053 [P] Deprecate old agent infrastructure: mark `AgentCallAdapter`, `AgentScopeCallAdapter`, `PlaceholderAgentCallAdapter` with `@Deprecated`; remove old agent wrappers (`ShowrunnerAgent`, `WorldBuilderAgent`, `CharacterDesignerAgent`, `ScriptDoctorAgent`) — replaced by new tab-aligned agents
- [ ] T054 [P] Remove unused frontend constants: delete `constants/agent-stages.ts` (AGENT_STAGES no longer used), clean up `constants/style-presets.ts` references in agent-chat
- [ ] T055 [P] Update `shared/types/agent.ts` shared types: remove `AgentStage` type, update `SessionType` to include new workflow step values, ensure frontend and backend types align
- [ ] T056 Run quickstart.md validation scenarios V1-V6: verify all 6 scenarios pass end-to-end (worldview chat, config drawer, character tools, format-aware outline, script generation, chat persistence)
- [ ] T057 Build verification: `cd backend-java && ./mvnw clean package -DskipTests=false` succeeds; `cd frontend && npm run build && npm run lint` succeeds; zero errors in both

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001-T007) — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 (T008-T019)
- **Phase 4 (US2)**: Depends on Phase 2; partially depends on US1 (T028 AgentChat index)
- **Phase 5 (US3)**: Depends on Phase 2; depends on US1 (T029 workflow-layout)
- **Phase 6 (US4)**: Depends on Phase 2; depends on US1 (T029 workflow-layout)
- **Phase 7 (US5)**: Depends on Phase 2; depends on US1 (T029 workflow-layout)
- **Phase 8 (US6)**: Depends on Phase 2 + US5 (outline must exist)
- **Phase 9 (US7)**: Depends on Phase 2 + US1 (chat infrastructure)
- **Phase 10 (Polish)**: Depends on all user stories

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                        ↓
              ┌─────────┼─────────┐
              ↓         ↓         ↓
            US1(P1)   US2(P1)   US3-US5(P2)
              ↓         ↓         ↓
              └────┬────┘    US6(P3) depends on US5
                   ↓              ↓
                 US7(P3)     Phase 10 (Polish)
```

### Within Each User Story

- Backend agent class before frontend integration
- Types/store before UI components
- Core components before panel integration
- Panel integration before end-to-end testing

### Parallel Opportunities

- T003-T007 (JPA entities + repo) can all run in parallel
- T010-T015 (tools + state store) can all run in parallel
- T033 (config store) and T034 (config drawer) can run in parallel
- T036, T039, T043, T046 (new agent classes) can all run in parallel
- T053-T055 (cleanup tasks) can all run in parallel

---

## Parallel Example: Phase 2 Tools

```bash
# Launch all tool implementations in parallel (T010-T015):
Task: "Create JpaAgentStateStore in agent/core/JpaAgentStateStore.java"
Task: "Create WebSearchTool in agent/tool/WebSearchTool.java"
Task: "Create CharacterTool in agent/tool/CharacterTool.java"
Task: "Create SynopsisTool in agent/tool/SynopsisTool.java"
Task: "Create OutlineTool in agent/tool/OutlineTool.java"
Task: "Create ScriptTool in agent/tool/ScriptTool.java"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T019)
3. Complete Phase 3: US1 — Worldview Chat (T020-T032)
4. **STOP and VALIDATE**: Test worldview tab end-to-end
5. This delivers: working agent chat with streaming, collapsible blocks, multi-turn memory

### Incremental Delivery

1. Setup + Foundational → Agent infrastructure ready
2. + US1 → Worldview chat works (MVP!)
3. + US2 → Agent config drawer works
4. + US3 → Synopsis generation works
5. + US4 → Character management via tools works
6. + US5 → Outline generation works
7. + US6 → Script writing works
8. + US7 → Chat persistence works
9. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Data consistency is critical — optimistic locking on all mutable entities
- AgentScope 2.0.0-SNAPSHOT must be installed to local Maven repo before backend compiles
