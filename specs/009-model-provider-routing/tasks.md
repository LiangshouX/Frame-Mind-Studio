# Tasks: Model Provider Routing & Selection

**Input**: Design documents from `/specs/009-model-provider-routing/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup & Foundational Infrastructure

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Update `model-catalog.yml` with correct DeepSeek, DashScope, MiMo provider definitions (remove doubao, kimi)
- [x] T002 Update `FramemindConfigProperties.java` to return `provider_model_config.json` as config file path
- [x] T003 Update `ConfigFileStore.java` — add migration logic: if `config.json` exists and `provider_model_config.json` doesn't, copy old to new
- [x] T004 Create `ModelRouterService.java` in `core/service/` — centralizes model resolution: `getAvailableModels()`, `buildModel(providerId, modelName)`, `testConnectivity(providerId)`
- [x] T005 Update `SettingsController.java` — add `GET /api/v1/settings/available-models` endpoint returning providers with models grouped by provider
- [x] T006 Update `AgentScopeAgentFactory.java` — accept optional `providerId` + `modelName`, use `ModelRouterService.buildModel()` to pass `Model` instance to `ReActAgent.builder().model(Model)`
- [x] T007 Update `PipelineOrchestrator.java` — accept `providerId` + `modelName` in `dispatchToAgent()`, pass to factory
- [x] T008 Update `ProjectAgentController.java` — add `provider_id` + `model_name` optional fields to chat/generate request body, pass to orchestrator
- [x] T009 Update `AgentScopeCallAdapter.java` — use `ModelRouterService.buildModel()` instead of local `buildModel()` method

**Checkpoint**: Backend compiles, `GET /api/v1/settings/available-models` returns correct data, agent calls use correct model

---

## Phase 2: Frontend Types & Store Updates

**Purpose**: Frontend foundation for model selection

- [x] T010 [P] Update `frontend/src/types/settings.ts` — add `AvailableModel`, `ProviderWithModels` interfaces
- [x] T011 [P] Update `frontend/src/types/agent.ts` — add `ModelSelection` interface with `providerId` + `modelName`
- [x] T012 Update `frontend/src/lib/api/settings.ts` — add `getAvailableModels()` API function
- [x] T013 Update `frontend/src/stores/settings-store.ts` — add `availableModels` state and `fetchAvailableModels()` action
- [x] T014 Update `frontend/src/stores/agent-store.ts` — add `modelSelections: Record<WorkflowStep, ModelSelection>` state, `setModelSelection()` action, persist to localStorage
- [x] T015 Update `frontend/src/lib/api/agent-api.ts` — add `providerId` + `modelName` params to `sendChatMessage()` and `triggerGeneration()`

**Checkpoint**: Frontend types and stores compile, API functions accept model selection

---

## Phase 3: US1 — Provider Configuration & Connectivity Validation (Priority: P1)

**Goal**: Users can configure provider API keys and validate connectivity

**Independent Test**: Configure a provider in settings, trigger test, verify result displayed

### Implementation

- [ ] T016 [US1] Update `frontend/src/components/settings/provider-config-form.tsx` — ensure DeepSeek, DashScope, MiMo are listed with correct default base URLs
- [ ] T017 [US1] Update `frontend/src/components/settings/connectivity-test-button.tsx` — display test result with timestamp
- [ ] T018 [US1] Update `frontend/src/components/settings/model-provider-card.tsx` — show "configured" badge when API key exists

**Checkpoint**: Settings page shows all 3 providers, users can configure API keys and test connectivity

---

## Phase 4: US2 — Model List Discovery (Priority: P1)

**Goal**: System shows available models from configured providers

**Independent Test**: Configure a provider, call available-models API, verify correct models returned

### Implementation

- [ ] T019 [US2] Update `frontend/src/components/settings/default-model-selector.tsx` — use `getAvailableModels()` API instead of hardcoded list, show only providers with valid API keys
- [ ] T020 [US2] Add empty state handling — when no providers configured, show prompt to configure in settings

**Checkpoint**: Default model selector shows available models grouped by provider

---

## Phase 5: US3 — Model Selection in Chat Window (Priority: P1)

**Goal**: Users can select provider and model from chat window bottom

**Independent Test**: Open ScriptMind tab, verify model selector appears with pre-selected defaults, change selection, verify persistence

### Implementation

- [x] T021 [US3] Create `frontend/src/components/shared/agent-chat/model-selector.tsx` — two dropdowns (provider + model), pre-selects first available, updates model list on provider change
- [x] T022 [US3] Update `frontend/src/components/shared/agent-chat/index.tsx` — add `ModelSelector` above status bar, wire to agent store's `modelSelections`
- [x] T023 [US3] Update `frontend/src/components/scriptmind/workflow-layout/index.tsx` — pass `providerId` + `modelName` from store to `sendChatMessage()` and `triggerGeneration()`

**Checkpoint**: Chat window shows model selector, selection persists per tab, selected model sent with requests

---

## Phase 6: US4 — Model-Aware Agent Construction (Priority: P1)

**Goal**: Backend uses selected model when building agents

**Independent Test**: Select a model in UI, send message, verify backend log shows correct provider/model

### Implementation

- [ ] T024 [US4] Verify `AgentScopeAgentFactory.buildAgent()` correctly uses `ModelRouterService.buildModel()` when providerId + modelName are provided
- [ ] T025 [US4] Verify `PipelineOrchestrator.dispatchToAgent()` passes providerId + modelName from request to factory
- [ ] T026 [US4] Add error handling — when selected model's API key is missing, return clear error message to frontend

**Checkpoint**: Agent calls use user-selected model, errors are clear when config is missing

---

## Phase 7: US5 — Provider Model Catalog Update (Priority: P2)

**Goal**: Model catalog has correct, up-to-date model lists

**Independent Test**: Verify catalog contains correct models for each provider

### Implementation

- [ ] T027 [P] [US5] Verify `model-catalog.yml` DeepSeek entries: `deepseek-chat`, `deepseek-reasoner`
- [ ] T028 [P] [US5] Verify `model-catalog.yml` DashScope entries: `qwen-max`, `qwen-plus`, `qwen-turbo`
- [ ] T029 [P] [US5] Verify `model-catalog.yml` MiMo entries: `MiMo-v2-pro`, `MiMo-v2-flash`, `MiMo-v2-omni`

**Checkpoint**: All provider models correctly listed in catalog

---

## Phase 8: Polish & Integration

**Purpose**: Final integration, cleanup, validation

- [ ] T030 Update `frontend/src/components/layout/navbar.tsx` — remove any hardcoded model references
- [ ] T031 Verify `~/.framemind/config.json` → `provider_model_config.json` migration works on startup
- [ ] T032 Run `mvn compile` — verify backend compiles clean
- [ ] T033 Run `npm run build` — verify frontend builds clean
- [ ] T034 Run quickstart.md validation scenarios end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately. BLOCKS all user stories.
- **Phase 2 (Frontend Types)**: Can run in parallel with Phase 1 (different codebase).
- **Phase 3-6 (US1-US4)**: Depend on Phase 1 completion. Can run in parallel after Phase 1.
- **Phase 7 (US5)**: Can run in parallel with Phase 1 (just verification).
- **Phase 8 (Polish)**: Depends on all prior phases.

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different files)
- T010, T011 can run in parallel (different type files)
- Phase 2 (frontend) can run in parallel with Phase 1 (backend)
- T027, T028, T029 can run in parallel (just verification)

---

## Implementation Strategy

### MVP First (US1 + US3 + US4)

1. Complete Phase 1: Foundational (T001-T009)
2. Complete Phase 2: Frontend Types (T010-T015)
3. Complete Phase 5: Model Selection UI (T021-T023)
4. Complete Phase 6: Agent Construction (T024-T026)
5. **STOP and VALIDATE**: Test model selection end-to-end
6. Deploy if ready

### Incremental Delivery

1. Foundational → Backend compiles, available-models API works
2. Frontend Types → Types and stores ready
3. US1 → Settings page shows providers with connectivity test
4. US2 → Model list discovery works
5. US3 → Chat window has model selector
6. US4 → Agent uses selected model
7. US5 → Catalog verified
8. Polish → Clean build, migration verified

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
