# Feature Specification: Multi-Model Routing & Flexible Integration

**Feature Branch**: `004-multi-model-routing`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "通过 Catalog 机制无缝接入全球主流大模型，用户按需配置，体现在前端里，就是通过/settings路由进入模型配置，除了预留模型配置，还要有MCPServer配置、tavily搜索配置等多种工具配置。这里的模型以国内模型供应商为主，包括DeepSeek、千问、豆包、MiMo、kimi等，后端可以通过yaml文件配置进行预留，但是不得泄露API_KEY，需要用户在前端自行配置，用户配置的文件，可以考虑存储到数据库，或者在 ~/.framemind 路径下写入一个配置文件来持久化，应用启动时扫描该目录，要支持测试是否连通。模型的接通基于 AgentScope-Java框架，模型需要与现有的Agent实现打通"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse & Select Model Provider (Priority: P1)

As a user, I want to visit the Settings page and see a catalog of all available model providers (DeepSeek, Qianwen, Doubao, MiMo, Kimi, etc.) so that I can choose which models to configure for my agents.

**Why this priority**: Without a browsable catalog, users cannot discover what models are available. This is the entry point for all model configuration workflows.

**Independent Test**: Navigate to /settings and verify all pre-configured model providers are displayed with their names, descriptions, and configuration status (configured / not configured).

**Acceptance Scenarios**:

1. **Given** the user is on the /settings page, **When** the Model Configuration tab is selected, **Then** a catalog of all available model providers is displayed, each showing provider name, logo/icon, and a brief description.
2. **Given** a model provider has not been configured yet, **When** the user views the catalog entry, **Then** the entry shows a "Not Configured" status indicator.
3. **Given** a model provider has been configured with a valid API key, **When** the user views the catalog entry, **Then** the entry shows a "Configured" or "Active" status indicator (without revealing the API key).

---

### User Story 2 - Configure Model Provider Credentials (Priority: P1)

As a user, I want to enter and save my API key for a specific model provider so that the system can use that provider's models for agent tasks.

**Why this priority**: Without credential configuration, no model can actually be used. This is the core value delivery of the feature.

**Independent Test**: Select a model provider (e.g., DeepSeek), enter a valid API key, save, and verify the configuration persists across page reloads.

**Acceptance Scenarios**:

1. **Given** the user selects an unconfigured model provider, **When** the configuration form appears, **Then** it shows fields for API Key (required) and optional fields such as Base URL (with a sensible default pre-filled) and model name selection.
2. **Given** the user enters a valid API key and submits, **When** the system validates the input, **Then** the configuration is saved, the provider status changes to "Configured", and the API key is never displayed in plain text afterward.
3. **Given** the user has previously saved a configuration, **When** they revisit the form, **Then** the API key field shows a masked value (e.g., "sk-***abc") and the other fields show their saved values.
4. **Given** the user clears a previously saved API key, **When** they save the form, **Then** the provider status reverts to "Not Configured".

---

### User Story 3 - Test Model Connectivity (Priority: P1)

As a user, I want to test whether my configured model provider is reachable and my credentials are valid before using it in a real agent task.

**Why this priority**: Connectivity testing prevents runtime failures and builds user confidence. It is essential for a good configuration experience.

**Independent Test**: Configure a model provider with a valid API key, click "Test Connection", and verify a success indicator appears. Then enter an invalid key and verify an error is shown.

**Acceptance Scenarios**:

1. **Given** the user has entered an API key for a provider, **When** they click "Test Connection", **Then** the system sends a lightweight request to the provider's API and displays a success or failure result within 10 seconds.
2. **Given** the test succeeds, **When** the result is displayed, **Then** it shows a green success indicator with the model name returned by the provider.
3. **Given** the test fails due to an invalid API key, **When** the result is displayed, **Then** it shows a red error indicator with a human-readable error message (e.g., "Invalid API key").
4. **Given** the test fails due to a network issue, **When** the result is displayed, **Then** it shows a yellow warning indicator with the specific network error (e.g., "Connection timed out").

---

### User Story 4 - Configure Multiple Models per Provider (Priority: P2)

As a user, I want to configure multiple specific models under a single provider (e.g., DeepSeek-V3 and DeepSeek-R1 under DeepSeek) so that I can assign different models to different agent tasks.

**Why this priority**: Many providers offer multiple model tiers. Users need flexibility to pick the right model per task without configuring the provider multiple times.

**Independent Test**: Under a configured provider, add two different model names, save, and verify both appear in the model selection list when creating an agent.

**Acceptance Scenarios**:

1. **Given** a provider is configured with a valid API key, **When** the user opens the provider detail view, **Then** they can see and manage a list of available models for that provider.
2. **Given** the user adds a new model name to the provider, **When** they save, **Then** the model appears in the provider's model list and becomes available for agent assignment.
3. **Given** the user removes a model from the provider, **When** they save, **Then** the model is no longer available for new agent assignments (existing assignments are unaffected).

---

### User Story 5 - Configure MCP Server (Priority: P2)

As a user, I want to configure MCP (Model Context Protocol) server connections in the Settings page so that my agents can use MCP-based tools.

**Why this priority**: MCP servers extend agent capabilities beyond basic model inference. Configuration is needed for tool-augmented workflows.

**Independent Test**: Navigate to the MCP Server configuration section, enter a server URL and credentials, save, and verify the configuration persists.

**Acceptance Scenarios**:

1. **Given** the user is on the Settings page, **When** they select the MCP Server tab, **Then** a configuration form is displayed with fields for server name, server URL, and authentication credentials.
2. **Given** the user enters valid MCP server details and saves, **When** the configuration is persisted, **Then** the server appears in the list of configured MCP servers with its status.
3. **Given** the user wants to test the MCP server connection, **When** they click "Test Connection", **Then** the system verifies the server is reachable and displays the result.

---

### User Story 6 - Configure Tavily Search (Priority: P2)

As a user, I want to configure Tavily search integration in the Settings page so that my agents can perform web searches during task execution.

**Why this priority**: Tavily search is a key tool for information retrieval. Configuration is needed for search-augmented agent workflows.

**Independent Test**: Navigate to the Tavily configuration section, enter an API key, save, and verify the configuration persists and connectivity test passes.

**Acceptance Scenarios**:

1. **Given** the user is on the Settings page, **When** they select the Tavily Search tab, **Then** a configuration form is displayed with fields for API key.
2. **Given** the user enters a valid Tavily API key and saves, **When** the configuration is persisted, **Then** the status shows "Configured" and the key is masked.
3. **Given** the user clicks "Test Connection", **When** the test completes, **Then** a success or failure result is displayed.

---

### User Story 7 - Select Default Model for Agents (Priority: P3)

As a user, I want to set a default model that new agents will use, so I don't have to manually select a model every time I create an agent.

**Why this priority**: Convenience feature that improves workflow efficiency once multiple models are configured.

**Independent Test**: Set a default model in settings, create a new agent, and verify the default model is pre-selected.

**Acceptance Scenarios**:

1. **Given** at least one model provider is configured, **When** the user opens the default model selector, **Then** all configured models across all providers are listed.
2. **Given** the user selects a default model, **When** they create a new agent, **Then** the agent's model field is pre-populated with the selected default.
3. **Given** the user changes the default model, **When** existing agents are not affected, **Then** only new agents use the updated default.

---

### Edge Cases

- What happens when a user enters an API key that has expired or been revoked? The system should display a clear error during connectivity testing, not during a real agent task.
- What happens when the configuration file at `~/.framemind` is corrupted or has invalid JSON? The system should log an error, skip the corrupted entry, and load valid entries. The user should see a warning on the Settings page.
- What happens when a provider's API endpoint is unreachable (network down, firewall)? The connectivity test should report the specific network error and not crash the application.
- What happens when two users on the same machine both configure models? The system should support per-user configuration isolation via the user's home directory.
- What happens when a user tries to configure a model provider that requires additional fields beyond API key (e.g., base URL for self-hosted deployments)? The form should dynamically show relevant fields based on the provider type.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Settings page accessible via the `/settings` route that organizes configuration into tabs: Model Providers, MCP Servers, Tavily Search, and Other Tools.
- **FR-002**: System MUST display a catalog of pre-configured model providers including at minimum: DeepSeek, Qianwen (DashScope), Doubao, MiMo, and Kimi.
- **FR-003**: Each model provider entry MUST show its name, description, configuration status, and a configuration action button.
- **FR-004**: System MUST provide a configuration form for each model provider with at minimum an API Key field (required, masked after saving) and optional fields such as Base URL and model name.
- **FR-005**: System MUST persist user-provided configuration (API keys, custom URLs, selected models) to a configuration file in the user's home directory under `~/.framemind/` in a structured format (e.g., JSON).
- **FR-006**: System MUST scan the `~/.framemind/` configuration directory on application startup and load all valid configurations.
- **FR-007**: System MUST NEVER expose API keys in plain text in the frontend after initial entry — keys must be masked (e.g., "sk-***abc") in all display contexts. Keys are stored as plaintext in the config file; the system MUST set restrictive file permissions (owner read/write only) on the config file at creation.
- **FR-008**: System MUST provide a "Test Connection" action for each configured model provider that sends a lightweight API request and reports success or failure with a human-readable message within 10 seconds.
- **FR-009**: System MUST allow users to configure multiple specific model names under a single provider (e.g., deepseek-chat and deepseek-reasoner under DeepSeek).
- **FR-010**: System MUST integrate configured models with the existing Agent system so that any configured model can be assigned to an agent task.
- **FR-011**: System MUST provide MCP Server configuration with fields for server name, server URL, and authentication credentials.
- **FR-012**: System MUST provide Tavily Search configuration with a field for API key and a connectivity test.
- **FR-013**: System MUST handle configuration file errors gracefully — corrupted or invalid entries should be skipped with a user-visible warning, not crash the application.
- **FR-014**: System MUST allow users to set a default model that is pre-selected when creating new agents.
- **FR-015**: System MUST support deleting or resetting a provider's configuration, reverting its status to "Not Configured".

### Key Entities

- **Model Provider**: Represents a model service vendor (e.g., DeepSeek, Qianwen). Key attributes: provider ID, name, description, type (OpenAI-compatible / DashScope / etc.), default base URL, supported model list, configuration status.
- **Provider Configuration**: A user's saved credentials and preferences for a specific provider. Key attributes: API key (encrypted/masked), custom base URL, selected models, is_default flag, last_tested timestamp, last_test_result.
- **MCP Server Configuration**: A user's saved MCP server connection. Key attributes: server name, server URL, authentication type, credentials, connection status.
- **Tool Configuration**: A user's saved tool integration settings (e.g., Tavily). Key attributes: tool name, API key, configuration parameters, connection status.
- **Configuration File**: The persistent storage at `~/.framemind/config.json` holding all user configurations. Structure: array of provider configurations, tool configurations, and MCP server configurations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure a model provider (enter API key and save) in under 1 minute.
- **SC-002**: Connectivity test completes and displays results within 10 seconds for any configured provider.
- **SC-003**: All 5 primary model providers (DeepSeek, Qianwen, Doubao, MiMo, Kimi) are available in the catalog and individually configurable.
- **SC-004**: API keys are never displayed in plain text after initial entry — verified across all UI contexts (catalog view, detail view, edit form pre-fill).
- **SC-005**: Configuration persists across application restarts — after restarting the application, all saved configurations are automatically loaded without user action.
- **SC-006**: A configured model can be successfully assigned to an agent and used for inference, verified by running a simple agent task.
- **SC-007**: Corrupted configuration entries are handled gracefully — the application starts successfully and shows a warning, with valid entries still loaded.
- **SC-008**: MCP Server and Tavily Search configurations are independently testable and persist across restarts.

## Clarifications

### Session 2026-06-18

- Q: Should API keys be encrypted at rest in the configuration file? → A: Plaintext in file; security relies on OS file permissions (chmod 600). The file at `~/.framemind/config.json` stores API keys as-is. The system MUST set restrictive file permissions (owner read/write only) on creation.

## Assumptions

- The system uses the AgentScope-Java framework for model integration. All model providers that support the OpenAI-compatible API format (DeepSeek, Kimi, MiMo, Doubao) will use `OpenAIChatModel` with appropriate formatters. Qianwen (DashScope) will use `DashScopeChatModel`.
- Configuration persistence uses a single JSON file at `~/.framemind/config.json` rather than a database, for simplicity and portability. The file uses the credential JSON format compatible with AgentScope-Java's `CredentialBase` class hierarchy.
- The frontend is a single-page application with an existing `/settings` route or the ability to add one.
- Users are expected to provide their own API keys — the system does not provide or manage API key procurement.
- The `~/.framemind/` directory is created automatically on first save if it does not exist.
- Model providers beyond the initial 5 (DeepSeek, Qianwen, Doubao, MiMo, Kimi) can be added by extending the provider catalog in a configuration file, without code changes.
- The connectivity test uses a minimal API call (e.g., listing models or a short completion) to validate credentials without incurring significant cost.
- Existing agent functionality continues to work unchanged — this feature adds configuration UI and persistence, and wires configured models into the existing agent-model binding.
