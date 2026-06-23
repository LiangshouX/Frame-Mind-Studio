# Research: Model Provider Routing & Selection

**Date**: 2026-06-23
**Feature**: 009-model-provider-routing

## Research Findings

### 1. AgentScope SDK Model Resolution

**Current Problem**: `AgentScopeAgentFactory` calls `builder.model("dashscope:qwen-max")` which delegates to `ModelRegistry.resolve()`. The `ModelRegistry` is a static utility class with built-in regex patterns that create models from environment variables only (e.g., `DASHSCOPE_API_KEY`). It has no way to read from the user's config file.

**Solution**: Use `builder.model(Model model)` overload instead. Build `Model` instances directly using the same approach as `AgentScopeCallAdapter.buildModel()`.

**Evidence**:
- `ReActAgent.java` line 3674: `public Builder model(Model model)` — accepts pre-built instance
- `ReActAgent.java` line 3691: `public Builder model(String modelId)` — delegates to ModelRegistry
- `ModelRegistry.java` line 44-106: built-in providers read from env vars only

---

### 2. AgentScopeCallAdapter Model Building

**Finding**: `AgentScopeCallAdapter.buildModel()` already correctly builds models from config:

```java
return switch (catalog.getType()) {
    case "DASHSCOPE" -> DashScopeChatModel.builder()
            .apiKey(apiKey).modelName(modelName).baseUrl(baseUrl).stream(true).build();
    case "OPENAI_COMPATIBLE" -> OpenAIChatModel.builder()
            .apiKey(apiKey).modelName(modelName).baseUrl(baseUrl).stream(true).build();
    default -> OpenAIChatModel.builder()
            .apiKey(apiKey).modelName(modelName).baseUrl(baseUrl).stream(true).build();
};
```

**Decision**: Extract this into a shared `ModelRouterService` to avoid duplication.

---

### 3. Provider API Compatibility

**DeepSeek**:
- Base URL: `https://api.deepseek.com`
- OpenAI-compatible: Yes (uses `/v1/chat/completions`)
- Models: `deepseek-chat`, `deepseek-reasoner`
- AgentScope model class: `OpenAIChatModel`

**DashScope (阿里云百炼)**:
- Base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- OpenAI-compatible: Yes (compatible mode)
- Models: `qwen-max`, `qwen-plus`, `qwen-turbo`
- AgentScope model class: `DashScopeChatModel` (has native DashScope support)

**MiMo (小米)**:
- Base URL: `https://api.xiaomimimo.com/v1`
- OpenAI-compatible: Yes
- Models: `MiMo-v2-pro`, `MiMo-v2-flash`, `MiMo-v2-omni`
- AgentScope model class: `OpenAIChatModel`

---

### 4. Config File Structure

**Current**: `~/.framemind/config.json` with `FramemindConfig` structure:
```json
{
  "version": 1,
  "providers": {
    "qianwen": {
      "api_key": "sk-...",
      "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "models": ["qwen-max", "qwen-plus", "qwen-turbo"],
      "default_model": "",
      "last_tested": "...",
      "last_test_result": "SUCCESS",
      "last_test_message": "Connection successful"
    }
  },
  "tools": {},
  "mcp_servers": {},
  "default_model": {}
}
```

**Decision**: Rename to `provider_model_config.json`. Structure remains backward-compatible. Migration copies old file to new location.

---

### 5. Frontend State Management

**Current**: `agent-store.ts` manages per-tab sessions with `sessions: Record<WorkflowStep, TabSession>`. The `TabSession` has `messages`, `isRunning`, `isStreaming`.

**Decision**: Add `selectedProvider` and `selectedModel` fields to `TabSession`. Persist to `localStorage` via Zustand's `persist` middleware.
