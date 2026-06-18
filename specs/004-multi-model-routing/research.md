# Research: Multi-Model Routing & Flexible Integration

**Date**: 2026-06-18 | **Feature**: 004-multi-model-routing

## R1: How to integrate AgentScope-Java as a Maven dependency

**Decision**: Add agentscope-core as a local JAR dependency via Maven's `systemPath` or install it to the local Maven repo.

**Rationale**: The SDK is vendored at `backend-java/lib-repo/agentscope-java-main/`. It's a multi-module Maven project. The simplest approach is to build and install `agentscope-core` to the local Maven repo, then reference it as a normal dependency in the project's `pom.xml`.

**Alternatives considered**:
- `systemPath` in `<dependency>` — works but IDEs sometimes struggle with it
- Maven submodule `<modules>` — too invasive, changes project structure
- Publish to a private repo — overkill for a vendored library

## R2: How to map providers to AgentScope-Java model classes

**Decision**: Use a YAML catalog (`model-catalog.yml`) that maps each provider to its model class, formatter, and default base URL. At runtime, `ModelCatalogService` reads the catalog and instantiates the correct model builder.

**Rationale**: AgentScope-Java already has a `ModelRegistry` with regex-based factory patterns (e.g., `"openai:(.+)"`, `"dashscope:(.+)"`). However, it relies on env vars for API keys. We need to inject user-configured keys at runtime. The Builder pattern on each model class (e.g., `DashScopeChatModel.builder().apiKey(...).modelName(...).build()`) is the right integration point.

**Mapping**:

| Provider | Model Class | Formatter | Base URL |
|----------|------------|-----------|----------|
| DeepSeek | OpenAIChatModel | DeepSeekFormatter | https://api.deepseek.com |
| Qianwen | DashScopeChatModel | DashScopeFormatter | https://dashscope.aliyuncs.com/compatible-mode/v1 |
| Doubao | OpenAIChatModel | OpenAIChatFormatter | https://ark.cn-beijing.volces.com/api/v3 |
| MiMo | OpenAIChatModel | OpenAIChatFormatter | https://api.xiaomi.com/v1 (placeholder) |
| Kimi | OpenAIChatModel | OpenAIChatFormatter | https://api.moonshot.cn/v1 |

**Alternatives considered**:
- Use `ModelRegistry.resolve()` with env vars — rejected because we need runtime key injection, not startup env vars
- Hard-code provider mappings in Java — rejected because it requires code changes to add providers

## R3: Config file format and structure

**Decision**: Single JSON file at `~/.framemind/config.json` using a structure compatible with AgentScope-Java's `CredentialBase` class hierarchy.

**Rationale**: The credential classes (`OpenAICredential`, `DashScopeCredential`, `DeepSeekCredential`, etc.) already use Jackson annotations for JSON serialization. Reusing this format means we can deserialize credentials directly and pass them to model builders.

**Structure**:
```json
{
  "version": 1,
  "providers": {
    "deepseek": {
      "type": "openai_compatible",
      "api_key": "sk-...",
      "base_url": "https://api.deepseek.com",
      "models": ["deepseek-chat", "deepseek-reasoner"],
      "default_model": "deepseek-chat",
      "last_tested": "2026-06-18T10:00:00Z",
      "last_test_result": "success"
    }
  },
  "tools": {
    "tavily": {
      "api_key": "tvly-...",
      "last_tested": "...",
      "last_test_result": "..."
    }
  },
  "mcp_servers": {
    "my-server": {
      "url": "http://localhost:3000",
      "auth_type": "bearer",
      "credentials": "...",
      "last_tested": "...",
      "last_test_result": "..."
    }
  },
  "default_model": {
    "provider": "deepseek",
    "model": "deepseek-chat"
  }
}
```

**Alternatives considered**:
- Separate files per provider — more complex file management, harder to load atomically
- YAML format — user's original request mentioned YAML, but AgentScope-Java credentials use Jackson/JSON natively
- Database storage — overkill for single-user local config; file is more portable

## R4: Connectivity test strategy

**Decision**: For each provider, send a minimal API call using the AgentScope-Java model's `stream()` method with a single short message, then cancel after first chunk. For Tavily, call the search API with a test query. For MCP servers, attempt a WebSocket/SSE connection.

**Rationale**: AgentScope-Java models already support streaming. A minimal completion request validates: (1) network reachability, (2) API key validity, (3) model name validity. Cancelling after the first chunk minimizes cost.

**Alternatives considered**:
- List models API — not all providers support this (DeepSeek does, DashScope doesn't have a clean listing endpoint)
- Health/ping endpoint — not standardized across providers
- Full completion — wastes tokens for a validation check

## R5: How to wire configured models into the Agent pipeline

**Decision**: Create `AgentScopeCallAdapter` implementing `AgentCallAdapter`. On each call, it reads the provider config from `ModelCatalogService`, instantiates the appropriate model via its Builder, and invokes `model.stream()`. The `AgentDefinition` is extended with an optional `modelProvider` + `modelName` field to support per-agent model assignment.

**Rationale**: The `AgentCallAdapter` interface is the existing abstraction point. `PipelineOrchestrator` already calls `agentCallAdapter.call(definition, prompt, onChunk)` for every agent invocation. A new implementation that uses real AgentScope-Java models is the cleanest integration path — no changes to the orchestrator needed.

**Alternatives considered**:
- Modify `PlaceholderAgentCallAdapter` — rejected, keeps placeholder as clean fallback
- Use `ModelRegistry` directly — rejected, doesn't support runtime key injection
- Spring `@Qualifier` per agent — too rigid, doesn't support user-configured model selection

## R6: Frontend settings page architecture

**Decision**: Rewrite `/settings/page.tsx` with a tabbed layout using 4 tabs: Model Providers, MCP Servers, Tavily Search, Other Tools. Each tab is a separate component. The Zustand `settings-store` is extended to manage all config types.

**Rationale**: The existing settings page is a flat list. The spec requires organizing into tabs (FR-001). The existing Zustand pattern is already established — extend it rather than introducing a new state management approach.

**Alternatives considered**:
- Sub-routes (`/settings/models`, `/settings/mcp`) — over-engineered for a config page
- Single-page scroll — doesn't scale as more tool types are added
- React Context instead of Zustand — inconsistent with existing pattern
