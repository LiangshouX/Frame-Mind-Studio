# API Contract: Available Models

**Endpoint**: `GET /api/v1/settings/available-models`

**Description**: Returns the list of models from all configured providers, grouped by provider.

## Response

```json
{
  "providers": [
    {
      "provider_id": "deepseek",
      "provider_name": "DeepSeek",
      "type": "OPENAI_COMPATIBLE",
      "available": true,
      "models": [
        {
          "model_id": "deepseek-chat",
          "display_name": "deepseek-chat"
        },
        {
          "model_id": "deepseek-reasoner",
          "display_name": "deepseek-reasoner"
        }
      ]
    },
    {
      "provider_id": "qianwen",
      "provider_name": "通义千问",
      "type": "DASHSCOPE",
      "available": true,
      "models": [
        {
          "model_id": "qwen-max",
          "display_name": "qwen-max"
        },
        {
          "model_id": "qwen-plus",
          "display_name": "qwen-plus"
        }
      ]
    }
  ]
}
```

## Fields

| Field | Type | Description |
|---|---|---|
| providers | array | List of configured providers |
| providers[].provider_id | string | Provider identifier |
| providers[].provider_name | string | Provider display name |
| providers[].type | string | Provider type (DASHSCOPE or OPENAI_COMPATIBLE) |
| providers[].available | boolean | Whether provider has a valid API key configured |
| providers[].models | array | List of available models |
| providers[].models[].model_id | string | Model identifier |
| providers[].models[].display_name | string | Model display name |

---

**Endpoint**: `POST /api/v1/projects/{projectId}/agent/chat`

**Updated Request Body**:

```json
{
  "message": "用户消息",
  "workflow_step": "worldview",
  "provider_id": "deepseek",
  "model_name": "deepseek-chat"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| message | string | yes | User message text |
| workflow_step | string | yes | Workflow step (worldview/synopsis/characters/outline/script) |
| provider_id | string | no | Selected provider ID (uses default if omitted) |
| model_name | string | no | Selected model name (uses default if omitted) |
