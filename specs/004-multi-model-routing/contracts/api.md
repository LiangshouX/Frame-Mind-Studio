# API Contracts: Multi-Model Routing & Flexible Integration

**Date**: 2026-06-18 | **Feature**: 004-multi-model-routing

Base URL: `/api/v1/settings`

---

## Model Provider Endpoints

### GET /api/v1/settings/providers

List all available model providers with their catalog info and configuration status.

**Response** `200 OK`:
```json
[
  {
    "id": "deepseek",
    "name": "DeepSeek",
    "description": "DeepSeek AI models",
    "type": "OPENAI_COMPATIBLE",
    "defaultBaseUrl": "https://api.deepseek.com",
    "availableModels": ["deepseek-chat", "deepseek-reasoner"],
    "configured": true,
    "lastTestResult": "SUCCESS"
  }
]
```

### GET /api/v1/settings/providers/{providerId}

Get detailed configuration for a specific provider.

**Response** `200 OK`:
```json
{
  "id": "deepseek",
  "name": "DeepSeek",
  "configured": true,
  "apiKeyPreview": "sk-***abc",
  "baseUrl": "https://api.deepseek.com",
  "models": ["deepseek-chat", "deepseek-reasoner"],
  "defaultModel": "deepseek-chat",
  "lastTested": "2026-06-18T10:00:00Z",
  "lastTestResult": "SUCCESS",
  "lastTestMessage": "Connection successful"
}
```

**Response** `404 Not Found`: Provider does not exist in catalog.

### PUT /api/v1/settings/providers/{providerId}

Save or update provider configuration.

**Request**:
```json
{
  "apiKey": "sk-...",
  "baseUrl": "https://api.deepseek.com",
  "models": ["deepseek-chat", "deepseek-reasoner"],
  "defaultModel": "deepseek-chat"
}
```

**Response** `200 OK`:
```json
{
  "id": "deepseek",
  "configured": true,
  "apiKeyPreview": "sk-***abc",
  "message": "Configuration saved"
}
```

**Validation**: `apiKey` required, non-blank. `baseUrl` must be valid URL if provided. `models` must be non-empty.

### DELETE /api/v1/settings/providers/{providerId}

Reset provider configuration (revert to "Not Configured").

**Response** `200 OK`:
```json
{
  "id": "deepseek",
  "configured": false,
  "message": "Configuration reset"
}
```

### POST /api/v1/settings/providers/{providerId}/test

Test connectivity to a configured provider.

**Response** `200 OK`:
```json
{
  "providerId": "deepseek",
  "result": "SUCCESS",
  "message": "Connection successful. Model: deepseek-chat",
  "testedAt": "2026-06-18T10:00:00Z"
}
```

**Response** `200 OK` (failure):
```json
{
  "providerId": "deepseek",
  "result": "AUTH_FAILED",
  "message": "Invalid API key",
  "testedAt": "2026-06-18T10:00:00Z"
}
```

**Response** `400 Bad Request`: Provider not configured (no API key set).

---

## Tool Configuration Endpoints (Tavily, etc.)

### GET /api/v1/settings/tools

List all configured tools.

**Response** `200 OK`:
```json
[
  {
    "toolId": "tavily",
    "name": "Tavily Search",
    "configured": true,
    "apiKeyPreview": "tvly-***xyz",
    "lastTestResult": "SUCCESS"
  }
]
```

### PUT /api/v1/settings/tools/{toolId}

Save or update tool configuration.

**Request**:
```json
{
  "apiKey": "tvly-...",
  "parameters": {}
}
```

**Response** `200 OK`:
```json
{
  "toolId": "tavily",
  "configured": true,
  "apiKeyPreview": "tvly-***xyz",
  "message": "Configuration saved"
}
```

### DELETE /api/v1/settings/tools/{toolId}

Reset tool configuration.

**Response** `200 OK`

### POST /api/v1/settings/tools/{toolId}/test

Test tool connectivity.

**Response** `200 OK`:
```json
{
  "toolId": "tavily",
  "result": "SUCCESS",
  "message": "Tavily API accessible",
  "testedAt": "2026-06-18T10:00:00Z"
}
```

---

## MCP Server Configuration Endpoints

### GET /api/v1/settings/mcp-servers

List all configured MCP servers.

**Response** `200 OK`:
```json
[
  {
    "serverId": "my-server",
    "name": "My MCP Server",
    "url": "http://localhost:3000",
    "authType": "BEARER",
    "configured": true,
    "lastTestResult": "SUCCESS"
  }
]
```

### PUT /api/v1/settings/mcp-servers/{serverId}

Save or update MCP server configuration.

**Request**:
```json
{
  "name": "My MCP Server",
  "url": "http://localhost:3000",
  "authType": "BEARER",
  "credentials": "token-..."
}
```

**Response** `200 OK`

### DELETE /api/v1/settings/mcp-servers/{serverId}

Delete MCP server configuration.

**Response** `200 OK`

### POST /api/v1/settings/mcp-servers/{serverId}/test

Test MCP server connectivity.

**Response** `200 OK`:
```json
{
  "serverId": "my-server",
  "result": "SUCCESS",
  "message": "Server reachable",
  "testedAt": "2026-06-18T10:00:00Z"
}
```

---

## Default Model Endpoints

### GET /api/v1/settings/default-model

Get the current default model.

**Response** `200 OK`:
```json
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "displayName": "DeepSeek / deepseek-chat"
}
```

**Response** `200 OK` (no default set):
```json
{
  "provider": null,
  "model": null,
  "displayName": null
}
```

### PUT /api/v1/settings/default-model

Set the default model.

**Request**:
```json
{
  "provider": "deepseek",
  "model": "deepseek-chat"
}
```

**Response** `200 OK`

**Validation**: Provider must be configured. Model must be in provider's model list.
