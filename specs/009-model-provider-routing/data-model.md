# Data Model: Model Provider Routing & Selection

**Date**: 2026-06-23
**Feature**: 009-model-provider-routing

## Entities

### Provider Configuration (filesystem)

Stored in `~/.framemind/provider_model_config.json` under `providers` map.

| Field | Type | Description |
|---|---|---|
| api_key | string | Provider API key |
| base_url | string | API base URL (overrides catalog default) |
| models | string[] | User-configured model list |
| default_model | string | Default model for this provider |
| last_tested | ISO 8601 | Last connectivity test timestamp |
| last_test_result | string | "SUCCESS" or "FAIL" |
| last_test_message | string | Test result message |

### Model Catalog Entry (classpath)

Defined in `model-catalog.yml`, loaded by `ModelCatalogService`.

| Field | Type | Description |
|---|---|---|
| id | string | Provider identifier (e.g., "deepseek") |
| name | string | Display name (e.g., "DeepSeek") |
| description | string | Provider description |
| type | string | "DASHSCOPE" or "OPENAI_COMPATIBLE" |
| defaultBaseUrl | string | Default API base URL |
| availableModels | string[] | Known model list |
| icon | string | Icon identifier |

### Available Model (API response)

Returned by `GET /api/v1/settings/available-models`.

| Field | Type | Description |
|---|---|---|
| provider_id | string | Provider identifier |
| provider_name | string | Provider display name |
| model_id | string | Model identifier (e.g., "deepseek-chat") |
| display_name | string | Model display name |
| available | boolean | Whether provider has valid API key |

### Model Selection (frontend state)

Stored per workflow tab in `agent-store`.

| Field | Type | Description |
|---|---|---|
| providerId | string | Selected provider ID |
| modelName | string | Selected model name |

## Relationships

```
ModelCatalogService (static catalog)
    └── ProviderCatalogEntry[]
            │
            ▼
ConfigFileStore (user config)
    └── ProviderEntry{}
            │
            ▼
ModelRouterService (merged view)
    └── AvailableModel[]
            │
            ├──→ AgentScopeAgentFactory (builds Model instance)
            └──→ SettingsController (API response)
```

## State Transitions

### Provider State

```
[Not Configured] → [Configured] → [Tested: SUCCESS]
                                 → [Tested: FAIL]
```

### Model Selection State

```
[None] → [Default: first available provider + first model]
       → [User Selected: specific provider + model]
```
