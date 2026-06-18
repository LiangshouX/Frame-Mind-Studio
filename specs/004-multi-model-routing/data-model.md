# Data Model: Multi-Model Routing & Flexible Integration

**Date**: 2026-06-18 | **Feature**: 004-multi-model-routing

## Entities

### ModelProvider (catalog definition — read-only, from model-catalog.yml)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique provider identifier (e.g., "deepseek", "qianwen") |
| name | string | Display name (e.g., "DeepSeek", "通义千问") |
| description | string | Brief description of the provider |
| type | enum | `OPENAI_COMPATIBLE`, `DASHSCOPE`, `ANTHROPIC`, `GEMINI`, `OLLAMA` |
| defaultBaseUrl | string | Default API endpoint URL |
| availableModels | list<string> | Pre-defined model names for this provider |
| icon | string | Icon identifier or URL |

### ProviderConfig (user configuration — persisted in config.json)

| Field | Type | Description |
|-------|------|-------------|
| providerId | string | FK to ModelProvider.id |
| apiKey | string | User's API key (plaintext, file permission protected) |
| baseUrl | string | Custom base URL (overrides default if set) |
| models | list<string> | User-configured model names |
| defaultModel | string | Default model for this provider |
| lastTested | datetime | Last connectivity test timestamp |
| lastTestResult | enum | `SUCCESS`, `AUTH_FAILED`, `NETWORK_ERROR`, `TIMEOUT`, `UNKNOWN_ERROR` |
| lastTestMessage | string | Human-readable test result message |

### ToolConfig (user configuration — persisted in config.json)

| Field | Type | Description |
|-------|------|-------------|
| toolId | string | Unique tool identifier (e.g., "tavily") |
| apiKey | string | Tool API key (plaintext, file permission protected) |
| parameters | map<string, string> | Additional tool-specific parameters |
| lastTested | datetime | Last connectivity test timestamp |
| lastTestResult | enum | Same as ProviderConfig.lastTestResult |
| lastTestMessage | string | Human-readable test result message |

### McpServerConfig (user configuration — persisted in config.json)

| Field | Type | Description |
|-------|------|-------------|
| serverId | string | Unique server identifier |
| name | string | Display name |
| url | string | Server endpoint URL |
| authType | enum | `NONE`, `BEARER`, `BASIC`, `API_KEY` |
| credentials | string | Auth credentials (token, password, etc.) |
| lastTested | datetime | Last connectivity test timestamp |
| lastTestResult | enum | Same as ProviderConfig.lastTestResult |
| lastTestMessage | string | Human-readable test result message |

### FramemindConfig (root config file structure)

| Field | Type | Description |
|-------|------|-------------|
| version | int | Config schema version (starts at 1) |
| providers | map<string, ProviderConfig> | Provider configurations keyed by provider ID |
| tools | map<string, ToolConfig> | Tool configurations keyed by tool ID |
| mcpServers | map<string, McpServerConfig> | MCP server configurations keyed by server ID |
| defaultModel | object | Global default model reference `{ provider, model }` |

## Relationships

```
FramemindConfig (1) ──contains──> (N) ProviderConfig
FramemindConfig (1) ──contains──> (N) ToolConfig
FramemindConfig (1) ──contains──> (N) McpServerConfig
ProviderConfig (N) ──references──> (1) ModelProvider (via providerId)
```

## State Transitions

### ProviderConfig status flow

```
[Not Configured] ──user enters API key──> [Configured, untested]
[Configured, untested] ──test connection──> [Configured, SUCCESS]
[Configured, untested] ──test fails──> [Configured, AUTH_FAILED/NETWORK_ERROR/...]
[Configured, any] ──user clears API key──> [Not Configured]
[Configured, any] ──user updates key──> [Configured, untested]
```

## Validation Rules

- `apiKey`: Required, non-blank for a provider to be considered configured
- `baseUrl`: Must be a valid URL if provided; defaults to provider's `defaultBaseUrl`
- `models`: Must be non-empty list when provider is configured; each entry must be non-blank
- `url` (MCP server): Required, valid URL
- All timestamps: ISO 8601 format
