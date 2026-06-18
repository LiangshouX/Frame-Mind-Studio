# Tasks: Multi-Model Routing & Flexible Integration

**Input**: Design documents from `/specs/004-multi-model-routing/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Project initialization, dependency setup, config infrastructure

- [x] T001 Add agentscope-core as local Maven dependency in backend-java/pom.xml (build from backend-java/lib-repo/agentscope-java-main/agentscope-core, install to local repo)
- [x] T002 Create model-catalog.yml in backend-java/src/main/resources/ with provider definitions for DeepSeek, Qianwen, Doubao, MiMo, Kimi (id, name, description, type, defaultBaseUrl, availableModels)
- [x] T003 Create FramemindConfigProperties.java in backend-java/src/main/java/io/framemind/core/config/ with @ConfigurationProperties for framemind.config.path (default ~/.framemind)
- [x] T004 Add framemind.config.path property to backend-java/src/main/resources/application.yml
- [x] T005 [P] Create settings type definitions in frontend/src/types/settings.ts (ProviderInfo, ProviderConfig, ToolConfig, McpServerConfig, ConnectivityTestResult, DefaultModel)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core config persistence and catalog loading — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create ModelCatalogService.java in backend-java/src/main/java/io/framemind/core/service/ — loads model-catalog.yml on startup, provides getProviderCatalog(), getProvider(id) methods
- [x] T007 Create ConfigFileStore.java in backend-java/src/main/java/io/framemind/core/service/ — reads/writes ~/.framemind/config.json with FramemindConfig structure, creates directory/file on first write, sets chmod 600 permissions, handles corrupted JSON gracefully (skip bad entries, log warnings)
- [x] T008 Refactor ApiKeyServiceImpl.java in backend-java/src/main/java/io/framemind/core/service/impl/ — replace ConcurrentHashMap with delegation to ConfigFileStore for persistence across restarts
- [x] T009 [P] Create ProviderConfigRequest.java DTO in backend-java/src/main/java/io/framemind/core/dto/ (apiKey, baseUrl, models, defaultModel)
- [x] T010 [P] Create ProviderConfigResponse.java DTO in backend-java/src/main/java/io/framemind/core/dto/ (id, configured, apiKeyPreview, baseUrl, models, defaultModel, lastTested, lastTestResult, lastTestMessage)
- [x] T011 [P] Create ConnectivityTestResult.java DTO in backend-java/src/main/java/io/framemind/core/dto/ (providerId/toolId/serverId, result enum, message, testedAt)
- [x] T012 Extend settings-store.ts in frontend/src/stores/ — add state and actions for providers, tools, mcpServers, defaultModel; add fetchProviders(), updateProvider(), testProvider(), fetchTools(), updateTool(), testTool(), fetchMcpServers(), updateMcpServer(), testMcpServer(), fetchDefaultModel(), updateDefaultModel()
- [x] T013 Extend settings API client in frontend/src/lib/api/settings.ts — add functions for all new endpoints per contracts/api.md (listProviders, getProvider, updateProvider, deleteProvider, testProvider, listTools, updateTool, deleteTool, testTool, listMcpServers, updateMcpServer, deleteMcpServer, testMcpServer, getDefaultModel, updateDefaultModel)

**Checkpoint**: Foundation ready — config persistence works, catalog loads, API client extended. User story implementation can now begin.

---

## Phase 3: User Story 1 — Browse & Select Model Provider (Priority: P1) 🎯 MVP

**Goal**: Users can visit /settings and see a catalog of all available model providers with configuration status

**Independent Test**: Navigate to /settings, verify 5 provider cards displayed with names, descriptions, and "Not Configured" status badges.

### Implementation for User Story 1

- [x] T014 [P] [US1] Create settings-tabs.tsx in frontend/src/components/settings/ — tab navigation component with 4 tabs: Model Providers, MCP Servers, Tavily Search, Other Tools
- [x] T015 [P] [US1] Create model-provider-card.tsx in frontend/src/components/settings/ — displays provider name, description, icon, configuration status badge (configured/not configured), and action button
- [x] T016 [US1] Add GET /api/v1/settings/providers endpoint in SettingsController.java — returns list of all providers from ModelCatalogService merged with user config status from ConfigFileStore
- [x] T017 [US1] Rewrite frontend/src/app/settings/page.tsx — tabbed layout using settings-tabs, Model Providers tab as default, renders list of model-provider-card components, fetches providers on mount via settings store

**Checkpoint**: User Story 1 complete — settings page shows provider catalog with status badges.

---

## Phase 4: User Story 2 — Configure Model Provider Credentials (Priority: P1)

**Goal**: Users can enter and save API keys for model providers, with masked display after saving

**Independent Test**: Select DeepSeek, enter API key, save, refresh page, verify config persists and key is masked.

### Implementation for User Story 2

- [x] T018 [P] [US2] Create provider-config-form.tsx in frontend/src/components/settings/ — form with API Key field (password input, required), Base URL field (pre-filled default), model list editor (add/remove model names), Save/Cancel/Delete buttons
- [x] T019 [US2] Add PUT /api/v1/settings/providers/{providerId} endpoint in SettingsController.java — validates request, saves to ConfigFileStore, returns masked apiKeyPreview
- [x] T020 [US2] Add DELETE /api/v1/settings/providers/{providerId} endpoint in SettingsController.java — removes provider config from ConfigFileStore, reverts to "Not Configured"
- [x] T021 [US2] Add GET /api/v1/settings/providers/{providerId} endpoint in SettingsController.java — returns full provider config with masked API key
- [x] T022 [US2] Wire provider-config-form into model-provider-card — clicking a card opens the form (dialog or inline expand), form pre-fills from fetched config, save triggers PUT, delete triggers DELETE

**Checkpoint**: User Story 2 complete — users can configure, view, update, and delete provider credentials. API keys masked after save.

---

## Phase 5: User Story 3 — Test Model Connectivity (Priority: P1)

**Goal**: Users can test whether configured providers are reachable and credentials are valid

**Independent Test**: Configure DeepSeek with valid key, click Test Connection, verify green success. Enter invalid key, verify red error.

### Implementation for User Story 3

- [x] T023 Create ConnectivityTestService.java in backend-java/src/main/java/io/framemind/core/service/ — testProvider(providerId) reads config from ConfigFileStore, instantiates AgentScope-Java model via Builder (OpenAIChatModel or DashScopeChatModel based on provider type), sends minimal stream() request, returns ConnectivityTestResult with SUCCESS/AUTH_FAILED/NETWORK_ERROR/TIMEOUT
- [x] T024 Add POST /api/v1/settings/providers/{providerId}/test endpoint in SettingsController.java — calls ConnectivityTestService.testProvider(), saves result to ConfigFileStore, returns ConnectivityTestResult
- [x] T025 [P] Create connectivity-test-button.tsx in frontend/src/components/settings/ — button with loading spinner, calls test endpoint, displays result (green success / red error / yellow warning) with message
- [x] T026 [US3] Wire connectivity-test-button into provider-config-form — shows below the form after config is saved, displays last test result on load

**Checkpoint**: User Story 3 complete — connectivity testing works for all model providers with clear success/error feedback.

---

## Phase 6: User Story 4 — Configure Multiple Models per Provider (Priority: P2)

**Goal**: Users can add/remove specific model names under a configured provider

**Independent Test**: Under DeepSeek, add "deepseek-coder", save, verify it appears in model list.

### Implementation for User Story 4

- [x] T027 [US4] Enhance provider-config-form.tsx in frontend/src/components/settings/ — add model list editor UI: chips/tags for existing models, input field to add new model name, X button to remove, pre-populate with provider's availableModels from catalog
- [x] T028 [US4] Update PUT /api/v1/settings/providers/{providerId} in SettingsController.java — accept and persist models array in ConfigFileStore, validate non-empty
- [x] T029 [US4] Add model selection dropdown to agent creation flow — in the relevant agent creation UI, show a dropdown of all configured models across all providers (from GET /api/v1/settings/providers), grouped by provider

**Checkpoint**: User Story 4 complete — users can manage multiple models per provider and see them in agent creation.

---

## Phase 7: User Story 5 — Configure MCP Server (Priority: P2)

**Goal**: Users can configure MCP server connections in the Settings page

**Independent Test**: Navigate to MCP Servers tab, enter server details, save, verify persistence.

### Implementation for User Story 5

- [x] T030 [P] [US5] Create mcp-server-config.tsx in frontend/src/components/settings/ — MCP Servers tab content: list of configured servers (name, URL, status), Add Server form (name, URL, auth type dropdown, credentials field), Save/Delete buttons per server
- [x] T031 [P] [US5] Create McpServerConfigRequest.java DTO in backend-java/src/main/java/io/framemind/core/dto/ (name, url, authType, credentials)
- [x] T032 [US5] Create ToolConfigService.java in backend-java/src/main/java/io/framemind/core/service/ — CRUD operations for MCP server configs in ConfigFileStore, testMcpConnection(serverId) that attempts HTTP connection to server URL
- [x] T033 [US5] Add MCP server endpoints in SettingsController.java — GET/PUT/DELETE /api/v1/settings/mcp-servers/{serverId}, POST /api/v1/settings/mcp-servers/{serverId}/test
- [x] T034 [US5] Wire mcp-server-config into settings page as the "MCP Servers" tab content

**Checkpoint**: User Story 5 complete — MCP server configuration and connectivity testing works.

---

## Phase 8: User Story 6 — Configure Tavily Search (Priority: P2)

**Goal**: Users can configure Tavily search integration in the Settings page

**Independent Test**: Navigate to Tavily tab, enter API key, save, test connection, verify persistence.

### Implementation for User Story 6

- [x] T035 [P] [US6] Create tavily-config.tsx in frontend/src/components/settings/ — Tavily Search tab content: API key field (password input), Save button, connectivity test button, status display
- [x] T036 [US6] Add Tavily endpoints in SettingsController.java — GET/PUT/DELETE /api/v1/settings/tools/tavily, POST /api/v1/settings/tools/tavily/test (calls Tavily API with test query)
- [x] T037 [US6] Add Tavily connectivity test to ConnectivityTestService.java — testTavily(apiKey) sends a minimal search request to Tavily API, returns ConnectivityTestResult
- [x] T038 [US6] Wire tavily-config into settings page as the "Tavily Search" tab content

**Checkpoint**: User Story 6 complete — Tavily search configuration and connectivity testing works.

---

## Phase 9: User Story 7 — Select Default Model for Agents (Priority: P3)

**Goal**: Users can set a default model that pre-fills when creating new agents

**Independent Test**: Set default to DeepSeek/deepseek-chat, create new agent, verify pre-filled.

### Implementation for User Story 7

- [x] T039 [P] [US7] Create default-model-selector.tsx in frontend/src/components/settings/ — dropdown listing all configured models across all providers, grouped by provider name, shows "No default" option
- [x] T040 [US7] Add default model endpoints in SettingsController.java — GET /api/v1/settings/default-model, PUT /api/v1/settings/default-model (validates provider configured and model in list)
- [x] T041 [US7] Persist defaultModel in ConfigFileStore — top-level field in config.json { provider, model }
- [x] T042 [US7] Wire default-model-selector into settings page (bottom of Model Providers tab or separate section)
- [x] T043 [US7] Pre-populate model field in agent creation UI — when creating a new agent, read default model from settings store and pre-fill the model selector

**Checkpoint**: User Story 7 complete — default model selection persists and pre-fills in agent creation.

---

## Phase 10: Agent Integration — Wire Real Models into Pipeline

**Purpose**: Connect configured models to the existing Agent system via AgentScope-Java

- [x] T044 Create AgentScopeCallAdapter.java in backend-java/src/main/java/io/framemind/agent/orchestration/ — implements AgentCallAdapter, on call(): reads provider config from ModelCatalogService/ConfigFileStore, resolves model class by provider type (OpenAIChatModel for OpenAI-compatible, DashScopeChatModel for DashScope), builds model via Builder with apiKey/modelName/baseUrl from config, calls model.stream() with agent prompt, forwards chunks to onChunk callback
- [x] T045 Update AgentScopeConfig.java in backend-java/src/main/java/io/framemind/agent/config/ — wire AgentScopeCallAdapter as the active adapter (replace PlaceholderAgentCallAdapter), keep placeholder as fallback via @ConditionalOnProperty
- [x] T046 Add per-agent model override support — extend AgentDefinition.java with optional modelProvider and modelName fields, update PipelineOrchestrator to pass these to AgentCallAdapter, update AgentScopeCallAdapter to use per-agent model if specified

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T047 [P] Add error handling and loading states to all settings components — skeleton loaders on initial fetch, toast notifications for save/delete/test success/failure, form validation messages
- [x] T048 [P] Add "Other Tools" tab placeholder in settings-tabs.tsx — empty state with "Coming soon" message for future tool integrations
- [x] T049 Run quickstart.md validation — execute all 10 validation scenarios from specs/004-multi-model-routing/quickstart.md, fix any issues found
- [x] T050 Code cleanup — remove unused imports, ensure consistent naming, verify all API keys are masked in responses

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 3 (needs provider cards to wire form into)
- **Phase 5 (US3)**: Depends on Phase 4 (needs configured provider to test)
- **Phase 6 (US4)**: Depends on Phase 4 (extends provider config form)
- **Phase 7 (US5)**: Depends on Phase 2 (independent of US1-US4)
- **Phase 8 (US6)**: Depends on Phase 2 (independent of US1-US5)
- **Phase 9 (US7)**: Depends on Phase 4 (needs configured providers)
- **Phase 10 (Agent Integration)**: Depends on Phase 2 (needs config persistence)
- **Phase 11 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Depends on US1 (needs provider cards to attach form to)
- **US3 (P1)**: Depends on US2 (needs configured provider to test)
- **US4 (P2)**: Depends on US2 (extends provider config form)
- **US5 (P2)**: Independent of US1-US4 — can start after Phase 2
- **US6 (P2)**: Independent of US1-US5 — can start after Phase 2
- **US7 (P3)**: Depends on US2 (needs configured providers to select default)

### Parallel Opportunities

- T009, T010, T011 (DTOs) can run in parallel
- T014, T015 (settings-tabs, model-provider-card) can run in parallel
- T030, T031 (MCP UI + DTO) can run in parallel
- T035 (Tavily UI) can run in parallel with US5 work
- T039 (default model selector) can run in parallel with US5/US6 work
- US5 and US6 can be developed in parallel (different tabs, different files)
- Phase 10 (Agent Integration) can start in parallel with US1-US7 (different code path)

---

## Parallel Example: After Phase 2 Completes

```bash
# These can all run in parallel:
Task T014: "Create settings-tabs.tsx"
Task T015: "Create model-provider-card.tsx"
Task T030: "Create mcp-server-config.tsx"       # US5 - independent
Task T031: "Create McpServerConfigRequest.java"  # US5 - independent
Task T035: "Create tavily-config.tsx"            # US6 - independent
Task T044: "Create AgentScopeCallAdapter.java"   # Agent integration - independent
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T013)
3. Complete Phase 3: US1 — Provider Catalog (T014-T017)
4. Complete Phase 4: US2 — Provider Config (T018-T022)
5. Complete Phase 5: US3 — Connectivity Test (T023-T026)
6. **STOP and VALIDATE**: Test US1-US3 via quickstart scenarios 1-5
7. Deploy/demo if ready — users can configure and test model providers

### Incremental Delivery

1. Setup + Foundational → Config persistence works
2. US1+US2+US3 → **MVP!** Model provider configuration complete
3. US4 → Multiple models per provider
4. US5 → MCP Server configuration (parallel with US6)
5. US6 → Tavily Search configuration (parallel with US5)
6. US7 → Default model selection
7. Phase 10 → Real agent integration with AgentScope-Java
8. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- PlaceholderAgentCallAdapter remains as fallback — real integration in Phase 10
