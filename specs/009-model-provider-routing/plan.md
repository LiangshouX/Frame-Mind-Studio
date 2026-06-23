# Implementation Plan: Model Provider Routing & Selection

**Branch**: `009-model-provider-routing` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-model-provider-routing/spec.md`

## Summary

The AgentScope ReActAgent cannot call models because `AgentScopeAgentFactory` passes a model ID string (e.g., `"dashscope:qwen-max"`) to `ReActAgent.builder().model()`, but the AgentScope SDK's `ModelRegistry` has no registered providers with the user's actual API keys and base URLs. The fix is to build `Model` instances directly (like `AgentScopeCallAdapter` already does) and pass them to the `ReActAgent` builder instead of string IDs. Additionally, the config file is renamed, the model catalog is updated, and a model selector is added to the chat UI.

## Technical Context

**Language/Version**: Java 17 (backend), TypeScript 5.x (frontend)

**Primary Dependencies**: Spring Boot 3.2.5, AgentScope-Java 2.0.0-RC3, Next.js 14, Zustand

**Storage**: PostgreSQL (JPA/Flyway), filesystem (`~/.framemind/provider_model_config.json`)

**Testing**: JUnit 5 (backend), manual frontend testing

**Target Platform**: Web application (Spring Boot + Next.js)

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Standard web app response times

**Constraints**: AgentScope SDK version locked to `2.0.0-RC3`

**Scale/Scope**: Single-user local application

## Constitution Check

*No project-specific constitution configured. Skipping gate check.*

## Project Structure

### Documentation (this feature)

```text
specs/009-model-provider-routing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (repository root)

```text
backend-java/src/main/java/io/framemind/
├── core/
│   ├── config/
│   │   └── FramemindConfigProperties.java    # UPDATE: config file path
│   ├── service/
│   │   ├── ConfigFileStore.java              # UPDATE: config migration
│   │   ├── ModelCatalogService.java          # UPDATE: catalog refresh
│   │   └── ModelRouterService.java           # NEW: model routing + build Model instances
│   └── adapter/controller/
│       └── SettingsController.java           # UPDATE: available models endpoint
├── agent/
│   ├── core/
│   │   └── AgentScopeAgentFactory.java       # UPDATE: use ModelRouterService
│   └── orchestration/
│       ├── PipelineOrchestrator.java         # UPDATE: pass model selection
│       └── AgentScopeCallAdapter.java        # UPDATE: use ModelRouterService
└── resources/
    └── model-catalog.yml                     # UPDATE: correct provider data

frontend/src/
├── components/shared/agent-chat/
│   ├── index.tsx                             # UPDATE: add model selector
│   └── model-selector.tsx                    # NEW: provider + model dropdowns
├── lib/api/
│   ├── settings.ts                           # UPDATE: available models API
│   └── agent-api.ts                          # UPDATE: pass model selection
├── stores/
│   ├── settings-store.ts                     # UPDATE: available models state
│   └── agent-store.ts                        # UPDATE: per-tab model selection
└── types/
    ├── settings.ts                           # UPDATE: available models types
    └── agent.ts                              # UPDATE: model selection types
```

**Structure Decision**: Web application structure (Option 2) — backend-java + frontend.

## Research (Phase 0)

### RQ-1: How does `ReActAgent.builder().model()` work?

The `ReActAgent` builder has two overloads:
- `model(String modelId)` — delegates to `ModelRegistry.resolve(modelId)` which uses built-in regex patterns (e.g., `dashscope:(.+)`) to create models from env vars only
- `model(Model model)` — accepts a pre-built `Model` instance directly

**Decision**: Use `model(Model)` with a pre-built instance from `ModelRouterService`. This bypasses `ModelRegistry` entirely and uses the user's configured API keys/base URLs.

**Rationale**: `ModelRegistry` reads API keys from env vars and has no way to use the user's config file. Building `Model` instances directly (as `AgentScopeCallAdapter` already does) gives full control.

### RQ-2: How does `AgentScopeCallAdapter.buildModel()` work?

It switches on `catalog.getType()`:
- `"DASHSCOPE"` → `DashScopeChatModel.builder().apiKey(key).modelName(name).baseUrl(url).stream(true).build()`
- `"OPENAI_COMPATIBLE"` → `OpenAIChatModel.builder().apiKey(key).modelName(name).baseUrl(url).stream(true).build()`

**Decision**: Extract this logic into a shared `ModelRouterService` that both `AgentScopeCallAdapter` and `AgentScopeAgentFactory` can use.

### RQ-3: What models should be in the catalog?

Based on ProviderRefDoc.md:

| Provider | Type | Base URL | Models |
|---|---|---|---|
| DeepSeek | OPENAI_COMPATIBLE | `https://api.deepseek.com` | deepseek-chat, deepseek-reasoner |
| DashScope (百炼) | DASHSCOPE | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-max, qwen-plus, qwen-turbo |
| MiMo | OPENAI_COMPATIBLE | `https://api.xiaomimimo.com/v1` | MiMo-v2-pro, MiMo-v2-flash, MiMo-v2-omni |

**Decision**: Update `model-catalog.yml` with these exact values. Remove unused providers (doubao, kimi) to reduce confusion.

### RQ-4: How to pass model selection from frontend to backend?

The `ProjectAgentController.chat()` endpoint currently accepts `(projectId, workflowStep, message)`. The model selection needs to be passed alongside.

**Decision**: Add `providerId` and `modelName` optional parameters to the chat/generate request body. The frontend sends the currently selected model with each request.

## Design Decisions (Phase 1)

### DD-1: ModelRouterService

New `@Service` that centralizes model resolution:
- `getAvailableModels()` — returns models grouped by provider (only providers with API keys configured)
- `buildModel(providerId, modelName)` — builds an AgentScope `Model` instance using provider config from `ConfigFileStore` + catalog metadata from `ModelCatalogService`
- `testConnectivity(providerId)` — sends a minimal API call to verify the provider works

### DD-2: Config file migration

`FramemindConfigProperties.getConfigFilePath()` returns `provider_model_config.json`. Add migration in `ConfigFileStore.init()`: if old `config.json` exists and new file doesn't, copy old → new. Keep old file as backup.

### DD-3: Frontend model selector component

New `ModelSelector` component: two `<select>` dropdowns (provider, model). Placed in `AgentChat` above the status bar. Fetches available models from `GET /api/v1/settings/available-models` on mount.

### DD-4: Per-tab model persistence

Store `{providerId, modelName}` per workflow tab in `agent-store` (Zustand). Persist to `localStorage`. On chat send, include in request body. On page load, restore from store.

### DD-5: Agent factory model override

`AgentScopeAgentFactory.buildAgent()` gains an optional `providerId` + `modelName` parameter. When provided, it calls `ModelRouterService.buildModel()` and passes the `Model` instance to `ReActAgent.builder().model(Model)`. Falls back to default model if not provided.
