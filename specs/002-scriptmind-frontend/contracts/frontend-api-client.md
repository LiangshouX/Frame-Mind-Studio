# Frontend API Client Contract

**Date**: 2026-06-18
**Feature**: ScriptMind 前端重建
**Reference**: 后端 API 定义见 `specs/001-scriptmind-screenplay-factory/contracts/api-contracts.md`

## Overview

本文档定义前端 API 客户端层的接口契约。前端通过 REST API 和 WebSocket 与后端交互。所有 API 端点、请求/响应格式完全遵循 001 spec 的 API Contracts，本文档仅定义前端侧的函数签名和错误处理策略。

## Base Configuration

```typescript
const API_BASE_URL = 'http://localhost:8080/api/v1';
const WS_BASE_URL = 'ws://localhost:8080/ws/agent';
const DEFAULT_TIMEOUT = 30_000;      // 30 秒
const UPLOAD_TIMEOUT = 120_000;      // 120 秒（文件上传）
const MAX_RETRIES = 3;               // 429 错误最大重试次数
const RETRY_BASE_DELAY = 1_000;      // 重试基础延迟 1 秒
```

## Error Handling

```typescript
// 统一错误类型
class ApiError extends Error {
  constructor(
    message: string,
    public status: number | null,    // HTTP 状态码，网络错误时为 null
    public code: string,             // 错误码
    public retryable: boolean        // 是否可重试
  ) {
    super(message);
  }
}

// 错误码定义
type ErrorCode =
  | 'NETWORK_ERROR'          // 网络不可达
  | 'TIMEOUT'                // 请求超时
  | 'RATE_LIMITED'           // 429 速率限制
  | 'NOT_FOUND'              // 404 资源不存在
  | 'VALIDATION_ERROR'       // 400 请求参数错误
  | 'SERVER_ERROR'           // 5xx 服务器错误
  | 'UNKNOWN';               // 未知错误

// 后端不可达检测
function isBackendOffline(error: ApiError): boolean {
  return error.status === null && error.code === 'NETWORK_ERROR';
}
```

## Retry Strategy

```typescript
// 429 错误自动重试
// 策略：指数退避，基础延迟 1 秒，最大重试 3 次
// 延迟公式：RETRY_BASE_DELAY * 2^(attempt-1)
// 第 1 次重试：1 秒
// 第 2 次重试：2 秒
// 第 3 次重试：4 秒
```

## API Functions

### Projects

```typescript
// 创建项目
// POST /projects
async function createProject(request: {
  title: string;
  genre: string[];
  format: 'short_drama' | 'comic' | 'movie';
  description?: string;
}): Promise<Project>

// 获取项目列表
// GET /projects
async function listProjects(): Promise<{
  items: Project[];
  total: number;
}>

// 获取项目详情
// GET /projects/{project_id}
async function getProject(projectId: string): Promise<ProjectDetail>

// 删除项目
// DELETE /projects/{project_id}
async function deleteProject(projectId: string): Promise<void>

// ProjectDetail 包含关联数据
interface ProjectDetail extends Project {
  script: Script | null;
  characters: Character[];
  foreshadows: Foreshadow[];
  budget: ProjectBudget;
}
```

### Scripts

```typescript
// 获取项目剧本
// GET /projects/{project_id}/script
async function getScript(projectId: string): Promise<Script>

// 更新剧本内容（手动编辑）
// PATCH /projects/{project_id}/script
async function updateScript(
  projectId: string,
  request: {
    content: ScriptContent;
    change_summary?: string;    // 有此字段时创建版本快照
  }
): Promise<Script>
```

### Agent

```typescript
// 生成大纲
// POST /agent/generate-outline
async function generateOutline(request: {
  project_id: string;
  input_type: 'one_sentence' | 'outline_text' | 'paste';
  input_content: string;
  style_preset?: string;
  target_episodes?: number;
}): Promise<{
  session_id: string;
  status: string;
  websocket_url: string;
}>

// 细化剧本
// POST /agent/refine-script
async function refineScript(request: {
  project_id: string;
  input_type: 'outline';
  input_content: string;
}): Promise<{
  session_id: string;
  status: string;
  websocket_url: string;
}>

// 文件导入
// POST /agent/import-file
async function importFile(
  projectId: string,
  file: File
): Promise<{
  session_id: string;
  status: string;
  websocket_url: string;
}>

// URL 导入
// POST /agent/import-url
async function importUrl(request: {
  project_id: string;
  url: string;
}): Promise<{
  session_id: string;
  status: string;
  websocket_url: string;
}>

// AI 优化段落
// POST /agent/optimize-segment
async function optimizeSegment(request: {
  project_id: string;
  text: string;
  element_type: string;
  context?: string;
}): Promise<{
  alternatives: Array<{
    text: string;
    style: string;
    reason: string;
  }>
}>

// 获取 Agent 会话状态
// GET /agent/sessions/{session_id}
async function getAgentSession(sessionId: string): Promise<AgentSession>

// 提交人类审核
// POST /agent/sessions/{session_id}/review
async function submitReview(
  sessionId: string,
  request: {
    action: 'approve' | 'revise';
    feedback?: string;
  }
): Promise<{
  session_id: string;
  status: string;
  message: string;
}>
```

### Characters

```typescript
// 获取角色列表
// GET /projects/{project_id}/characters
async function listCharacters(projectId: string): Promise<{
  items: Character[];
  total: number;
}>

// 更新角色
// PATCH /projects/{project_id}/characters/{character_id}
async function updateCharacter(
  projectId: string,
  characterId: string,
  request: Partial<Character>
): Promise<Character>
```

### Foreshadows

```typescript
// 获取伏笔列表
// GET /projects/{project_id}/foreshadows
async function listForeshadows(
  projectId: string,
  status?: 'planted' | 'resolved'
): Promise<{
  items: Foreshadow[];
  total: number;
}>

// 更新伏笔
// PATCH /projects/{project_id}/foreshadows/{foreshadow_id}
async function updateForeshadow(
  projectId: string,
  foreshadowId: string,
  request: Partial<Foreshadow>
): Promise<Foreshadow>
```

### Versions

```typescript
// 获取版本历史
// GET /projects/{project_id}/script/versions
async function listVersions(
  projectId: string,
  limit?: number,
  offset?: number
): Promise<{
  items: ScriptVersion[];
  total: number;
}>

// 获取特定版本
// GET /projects/{project_id}/script/versions/{version_id}
async function getVersion(
  projectId: string,
  versionId: string
): Promise<ScriptVersion>

// 回溯到指定版本
// POST /projects/{project_id}/script/versions/{version_id}/restore
async function restoreVersion(
  projectId: string,
  versionId: string
): Promise<Script>

// 版本对比
// GET /projects/{project_id}/script/versions/compare
async function compareVersions(
  projectId: string,
  fromVersion: number,
  toVersion: number
): Promise<{
  from_version: number;
  to_version: number;
  diff: VersionDiff;
}>
```

### Quality

```typescript
// 获取质量评估
// GET /projects/{project_id}/script/quality
async function getQualityMetrics(projectId: string): Promise<QualityMetrics>
```

### Settings

```typescript
// 获取 API Key 列表
// GET /settings/api-keys
async function listApiKeys(): Promise<{
  items: ApiKeyConfig[];
}>

// 配置 API Key
// PUT /settings/api-keys
async function updateApiKey(request: {
  provider: string;
  api_key: string;
}): Promise<ApiKeyConfig>

// 获取可用模型
// GET /settings/models
async function listModels(): Promise<{
  items: ModelConfig[];
}>
```

## WebSocket Client

```typescript
// 连接 WebSocket
function connectAgentWebSocket(
  sessionId: string,
  handlers: {
    onStageUpdate: (data: StageUpdateMessage['data']) => void;
    onStreamChunk: (data: StreamChunkMessage['data']) => void;
    onHitlPrompt: (data: HitlPromptMessage['data']) => void;
    onComplete: (data: CompleteMessage['data']) => void;
    onError: (data: ErrorMessage['data']) => void;
    onBudgetWarning: (data: BudgetWarningMessage['data']) => void;
    onConnectionChange: (status: ConnectionStatus) => void;
  }
): WebSocketConnection

interface WebSocketConnection {
  disconnect: () => void;
  isConnected: () => boolean;
}

// 自动重连配置
// 初始延迟：1 秒
// 最大延迟：30 秒
// 退避策略：指数退避 (delay * 2)
// 最大重试次数：无限（直到手动断开）
```

## Health Check

```typescript
// 后端健康检查
// GET http://localhost:8080/actuator/health
async function checkBackendHealth(): Promise<boolean>
// 返回 true 表示后端可达，抛出 ApiError 表示不可达
```
