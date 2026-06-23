# Feature Specification: Model Provider Routing & Selection

**Feature Branch**: `009-model-provider-routing`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "后端的模型调用不通，需要完成模型路由能力。模型配置存储在 ~/.framemind/provider_model_config.json，系统需要识别能调通的模型列表，在前端 chat 窗口底部默认填充首个可用供应商和模型，支持下拉框选择模型，将选中的模型用于构建 Agent。"

## Background

The system currently has a model provider configuration system (`~/.framemind/config.json`) and a static model catalog (`model-catalog.yml`). However, the AgentScope ReActAgent cannot successfully call models because:

1. The `AgentScopeAgentFactory` passes a model ID string (e.g., `"dashscope:qwen-max"`) to `ReActAgent.builder().model()`, but the AgentScope SDK's `ModelRegistry` cannot resolve it without proper provider registration.
2. The user's actual API keys and base URLs in the config file are not being used by the AgentScope SDK's built-in model resolution.
3. There is no way for users to select which provider/model to use for agent calls from the chat interface.

The system needs a model routing layer that reads provider configurations, validates connectivity, and exposes available models to both the backend agent factory and the frontend chat UI.

## Clarifications

### Session 2026-06-23

- Q: Config file naming? → A: Rename from `config.json` to `provider_model_config.json` for clarity
- Q: Which providers to support? → A: DeepSeek, 阿里云百炼 (DashScope), MiMo (小米) — all OpenAI-compatible
- Q: How to determine "available" models? → A: System tests connectivity on startup/on-demand; only models with valid API key + successful test are "available"
- Q: Where does the model selector appear? → A: At the bottom of the chat window, above the status bar, with provider and model dropdowns

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Provider Configuration & Connectivity Validation (Priority: P1)

As a user, I want to configure my model provider API keys and base URLs, and have the system validate which providers are actually reachable, so that I know which models I can use.

**Why this priority**: Without validated provider connectivity, no AI features work. This is the foundation for all model-dependent functionality.

**Independent Test**: Can be tested by configuring a provider with a valid API key, triggering connectivity test, and verifying the test result is recorded.

**Acceptance Scenarios**:

1. **Given** the user has configured a DeepSeek API key in the settings page, **When** the system tests connectivity, **Then** the test result (success/fail) and timestamp are recorded and displayed.
2. **Given** the user has configured a DashScope API key with a custom base URL, **When** the system tests connectivity, **Then** the custom base URL is used instead of the default.
3. **Given** a provider's API key is missing or invalid, **When** the system tests connectivity, **Then** the test fails with a clear error message and the provider is marked as unavailable.
4. **Given** the application starts up, **When** provider configs are loaded, **Then** the system identifies which providers have valid API keys configured (connectivity test can be triggered on-demand).

---

### User Story 2 - Model List Discovery (Priority: P1)

As a user, I want the system to show me which models are available from my configured providers, so that I can choose which model to use for AI conversations.

**Why this priority**: Users need to see what models they can actually use before they can select one.

**Independent Test**: Can be tested by configuring a provider with a valid API key, then requesting the available models list and verifying it returns the correct models.

**Acceptance Scenarios**:

1. **Given** the user has configured DashScope with a valid API key, **When** they view the available models, **Then** the list shows DashScope models (qwen-max, qwen-plus, qwen-turbo, etc.).
2. **Given** the user has configured both DeepSeek and DashScope, **When** they view available models, **Then** models from both providers are shown, grouped by provider.
3. **Given** a provider is configured but connectivity test failed, **When** the user views available models, **Then** that provider's models are shown but marked as unavailable.
4. **Given** no providers are configured, **When** the user views available models, **Then** an empty state is shown with a prompt to configure a provider in settings.

---

### User Story 3 - Model Selection in Chat Window (Priority: P1)

As a user, I want to select which provider and model to use from the chat window, so that I can switch models without leaving the conversation context.

**Why this priority**: Model selection is the core UX requirement — users need to choose models per conversation/session.

**Independent Test**: Can be tested by opening a ScriptMind tab, verifying the model selector shows available providers/models, selecting a different model, and confirming the selection persists.

**Acceptance Scenarios**:

1. **Given** the user opens a ScriptMind chat tab, **When** the chat window loads, **Then** the bottom of the chat shows a model selector with the first available provider and its first model pre-selected.
2. **Given** the model selector is visible, **When** the user clicks the provider dropdown, **Then** all configured providers with valid API keys are listed.
3. **Given** the user selects a different provider, **When** the provider changes, **Then** the model dropdown updates to show that provider's available models.
4. **Given** the user selects a specific model, **When** they send a chat message, **Then** the selected model is used for the agent call.
5. **Given** the user has selected a model for the "worldview" tab, **When** they switch to the "synopsis" tab, **Then** the synopsis tab shows its own model selector (can be a different model).
6. **Given** the user refreshes the page, **When** the chat window reloads, **Then** the previously selected model for each tab is restored.

---

### User Story 4 - Model-Aware Agent Construction (Priority: P1)

As a developer, I want the `AgentScopeAgentFactory` to use the user-selected model when building `ReActAgent` instances, so that agents actually call the correct LLM.

**Why this priority**: This is the backend integration that makes model selection functional — without it, the selector is cosmetic.

**Independent Test**: Can be tested by selecting a model in the UI, sending a chat message, and verifying the backend log shows the correct provider/model being used.

**Acceptance Scenarios**:

1. **Given** the user has selected "deepseek:deepseek-chat" for the worldview tab, **When** they send a message, **Then** the `AgentScopeAgentFactory` builds the agent with the DeepSeek model and API key.
2. **Given** the user has selected "dashscope:qwen-max" for the synopsis tab, **When** they send a message, **Then** the agent uses the DashScope model with the correct base URL.
3. **Given** no model is explicitly selected, **When** an agent is built, **Then** the system uses the global default model from config.
4. **Given** the selected model's provider API key is missing, **When** an agent call is attempted, **Then** the system returns a clear error message to the user.

---

### User Story 5 - Provider Model Catalog Update (Priority: P2)

As a user, I want the system to have up-to-date model lists for each provider, so that I can see and select the latest models.

**Why this priority**: Static model lists become outdated. Users should see the models they actually have access to.

**Independent Test**: Can be tested by verifying the model catalog contains the correct models for each provider.

**Acceptance Scenarios**:

1. **Given** the model catalog lists DeepSeek models, **When** the user views DeepSeek models, **Then** they see `deepseek-chat` and `deepseek-reasoner`.
2. **Given** the model catalog lists DashScope models, **When** the user views DashScope models, **Then** they see `qwen-max`, `qwen-plus`, `qwen-turbo` and other available models.
3. **Given** the model catalog lists MiMo models, **When** the user views MiMo models, **Then** they see `MiMo-v2-pro`, `MiMo-v2-flash`, `MiMo-v2-omni`.

## Functional Requirements

### FR-1: Provider Configuration Storage

- The system stores provider configurations (API key, base URL, model list, default model) in `~/.framemind/provider_model_config.json`.
- The configuration file uses snake_case JSON naming.
- Each provider entry contains: `api_key`, `base_url`, `models` (list), `default_model`, `last_tested`, `last_test_result`, `last_test_message`.
- The system supports multiple providers simultaneously.

### FR-2: Provider Connectivity Testing

- The system can test connectivity to each configured provider.
- A test sends a minimal API request to verify the API key and base URL are valid.
- Test results (success/fail, message, timestamp) are persisted in the provider config.
- Users can trigger tests manually from the settings page.

### FR-3: Model Catalog

- The system maintains a built-in catalog of known providers and their default models.
- The catalog defines: provider ID, display name, provider type, default base URL, available models list.
- Supported providers: DeepSeek, DashScope (阿里云百炼), MiMo (小米).
- The catalog can be extended without code changes.

### FR-4: Available Models API

- The system provides an API endpoint that returns the list of available models.
- A model is "available" when its provider has a valid API key configured.
- The response groups models by provider.
- Each entry includes: provider ID, provider name, model ID, display name.

### FR-5: Model Selection in Chat UI

- The chat window displays a model selector at the bottom, above the status bar.
- The selector has two dropdowns: provider and model.
- The first available provider and its first model are pre-selected by default.
- Changing the provider updates the model dropdown.
- The selection is persisted per workflow tab (worldview, synopsis, characters, outline, script).

### FR-6: Model-Aware Agent Building

- The `AgentScopeAgentFactory` accepts a model specification (provider + model name).
- The factory resolves the provider's API key and base URL from the config.
- The factory builds the appropriate AgentScope `Model` instance (DashScopeChatModel or OpenAIChatModel) based on provider type.
- The built model is passed to the `ReActAgent` builder.

### FR-7: Config File Migration

- The config file is renamed from `config.json` to `provider_model_config.json`.
- On startup, if the old file exists and the new one does not, the system migrates automatically.
- The old file is preserved (not deleted) after migration.

## Key Entities

- **Provider Configuration**: API key, base URL, model list, default model, test results
- **Model Catalog Entry**: Provider ID, name, type, default base URL, available models
- **Model Selection State**: Per-tab provider + model choice, persisted in local storage or agent config

## Assumptions

- All three providers (DeepSeek, DashScope, MiMo) use OpenAI-compatible API format.
- The AgentScope SDK's `DashScopeChatModel` and `OpenAIChatModel` builders accept custom `baseUrl` parameters.
- Users have their own API keys for these providers.
- The `provider_model_config.json` file structure is backward-compatible with the existing `config.json` format (same `providers` map structure).

## Out of Scope

- Automatic API key rotation or refresh.
- Model performance benchmarking or recommendation.
- Cost tracking or budget enforcement per model.
- Support for non-OpenAI-compatible providers (e.g., proprietary APIs).
- Dynamic model list fetching from provider APIs (model lists are statically defined in the catalog).

## Success Criteria

1. Users can configure API keys for DeepSeek, DashScope, and MiMo in the settings page.
2. The system validates provider connectivity and displays test results.
3. The chat window shows a model selector with available providers and models.
4. The first available provider and model are pre-selected by default.
5. Selecting a model and sending a message successfully calls the correct LLM.
6. Model selections persist per workflow tab across page refreshes.
7. The config file is successfully renamed to `provider_model_config.json` with automatic migration.
