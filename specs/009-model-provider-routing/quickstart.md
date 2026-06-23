# Quickstart: Model Provider Routing & Selection

**Date**: 2026-06-23
**Feature**: 009-model-provider-routing

## Prerequisites

- Java 17+, Maven 3.8+
- Node.js 18+, npm
- PostgreSQL running (Docker or local)
- At least one provider API key (DeepSeek, DashScope, or MiMo)

## Setup

### 1. Configure a Provider

Edit `~/.framemind/provider_model_config.json`:

```json
{
  "version": 1,
  "providers": {
    "qianwen": {
      "api_key": "sk-your-dashscope-api-key",
      "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "models": ["qwen-max", "qwen-plus", "qwen-turbo"]
    }
  }
}
```

### 2. Start Backend

```bash
cd backend-java
mvn spring-boot:run
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

## Validation Scenarios

### Scenario 1: Provider Configuration Loads

1. Open `~/.framemind/provider_model_config.json` and verify it has at least one provider with an API key.
2. Start the backend.
3. Call `GET http://localhost:8080/api/v1/settings/available-models`.
4. **Expected**: Response contains the configured provider with `available: true` and its models.

### Scenario 2: Model Selector Appears in Chat

1. Open the frontend at `http://localhost:3000`.
2. Navigate to any project → ScriptMind → any tab (e.g., Worldview).
3. **Expected**: The chat window bottom shows a model selector with provider and model dropdowns. The first available provider and model are pre-selected.

### Scenario 3: Model Selection Persists Per Tab

1. Select "DeepSeek" + "deepseek-chat" in the Worldview tab.
2. Switch to the Synopsis tab.
3. Select "DashScope" + "qwen-max" in the Synopsis tab.
4. Switch back to Worldview.
5. **Expected**: Worldview still shows "DeepSeek" + "deepseek-chat".

### Scenario 4: Agent Uses Selected Model

1. Select "DashScope" + "qwen-max" in the Worldview tab.
2. Send a message: "帮我构思一个科幻故事的世界观".
3. **Expected**: Backend log shows `Building Model: provider=qianwen, model=qwen-max`. Agent responds successfully.

### Scenario 5: Config File Migration

1. Rename existing `~/.framemind/config.json` back to its original name (if migrated).
2. Start the backend.
3. **Expected**: `~/.framemind/provider_model_config.json` is created with the same content as `config.json`. Old file is preserved.

### Scenario 6: Connectivity Test

1. Open Settings → Providers.
2. Click "Test" on a configured provider.
3. **Expected**: Test result (success/fail) is displayed with timestamp.
