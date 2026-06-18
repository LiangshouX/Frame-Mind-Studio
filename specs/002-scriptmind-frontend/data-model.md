# Data Model: ScriptMind 前端

**Date**: 2026-06-18
**Feature**: ScriptMind 前端重建
**Reference**: 后端实体定义见 `specs/001-scriptmind-screenplay-factory/data-model.md`

## Overview

前端数据模型与后端 Data Model 对齐，使用 TypeScript 类型定义。前端不直接操作数据库，所有数据通过 REST API 获取和更新。前端额外定义了 UI 状态模型（编辑器状态、Agent 交互状态等）。

## Entity Types (与后端对齐)

### Project

```typescript
interface Project {
  id: string;                    // UUID
  title: string;
  genre: string[];               // 题材标签列表
  format: 'short_drama' | 'comic' | 'movie';
  description: string | null;
  status: 'draft' | 'in_progress' | 'review' | 'completed';
  target_episodes: number;
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
}
```

### Script

```typescript
interface Script {
  id: string;                    // UUID
  project_id: string;            // UUID
  title: string;
  content: ScriptContent;        // 完整剧本内容
  format_type: string;           // 'fountain'
  word_count: number;
  scene_count: number;
  episode_count: number;
  version: number;
  created_at: string;
  updated_at: string;
}
```

### ScriptContent (剧本内容结构)

```typescript
interface ScriptContent {
  title: string;
  totalEpisodes: number;
  episodes: ScriptEpisode[];
}

interface ScriptEpisode {
  episodeNumber: number;
  title: string;
  durationMinutes: number;
  scenes: ScriptScene[];
}

interface ScriptScene {
  sceneId: string;               // e.g., 'S01E01_SC01'
  location: string;
  time: string;                  // '日' | '夜' | '黄昏' | etc.
  moodTags: string[];
  charactersPresent: string[];   // character IDs
  beats: ScriptBeat[];
}

interface ScriptBeat {
  beatId: string;                // e.g., 'S01E01_SC01_B01'
  type: 'action' | 'dialogue' | 'emotion' | 'transition';
  content: string;
  character: string | null;      // character name
  emotion: string | null;
  cameraSuggestion: string | null;
  durationSeconds: number | null;
}
```

### Character

```typescript
interface Character {
  id: string;                    // UUID
  project_id: string;            // UUID
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string | null;
  personality: string[];         // 性格标签
  appearance: string | null;
  background: string | null;
  goals: string | null;
  relationships: CharacterRelationship[];
  dialogue_style: string | null;
  arc: string | null;
  created_at: string;
  updated_at: string;
}

interface CharacterRelationship {
  character_id: string;
  relationship: string;          // e.g., '恋人', '对手', '师徒'
}
```

### Foreshadow

```typescript
interface Foreshadow {
  id: string;                    // UUID
  project_id: string;            // UUID
  plant: string;                 // 伏笔埋设内容
  payoff: string | null;         // 伏笔回收内容
  episode_hint: number | null;   // 提示集数
  status: 'planted' | 'resolved';
  urgency: 'high' | 'medium' | 'low';
  character_id: string | null;   // 关联角色 ID
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

### ScriptVersion

```typescript
interface ScriptVersion {
  id: string;                    // UUID
  script_id: string;             // UUID
  version: number;
  content: ScriptContent;
  message: string | null;        // 变更摘要
  created_at: string;
}
```

### ProjectBudget

```typescript
interface ProjectBudget {
  id: string;                    // UUID
  project_id: string;            // UUID
  token_limit: number;
  tokens_used: number;
  warning_threshold: number;     // 0-1
  created_at: string;
  updated_at: string;
}
```

### AgentSession

```typescript
interface AgentSession {
  id: string;                    // UUID
  project_id: string;            // UUID
  session_type: 'outline_generate' | 'script_refine' | 'import' | 'optimize';
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  tokens_consumed: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}
```

### AgentMessage

```typescript
interface AgentMessage {
  id: string;                    // UUID
  session_id: string;            // UUID
  agent_name: 'showrunner' | 'world_builder' | 'character_designer' | 'script_doctor';
  role: 'agent' | 'user' | 'system';
  content: string;
  message_order: number;
  created_at: string;
}
```

## Quality Metrics

```typescript
interface QualityMetrics {
  hook_strength: MetricItem;
  rhythm_curve: MetricItem;
  character_balance: MetricItem;
  dialogue_ratio: MetricItem;
  scene_diversity: MetricItem;
  foreshadow_status: ForeshadowStatus;
  overall_score: number;
}

interface MetricItem {
  value: number;
  target: number | null;
  target_range: [number, number] | null;
  status: 'pass' | 'warning';
  details: string;
}

interface ForeshadowStatus {
  total: number;
  resolved: number;
  unresolved: number;
  status: 'pass' | 'warning';
  details: string;
}
```

## WebSocket Messages

```typescript
// Agent 阶段切换
interface StageUpdateMessage {
  type: 'stage_update';
  data: {
    stage: string;
    stage_label: string;
    status: 'started' | 'completed';
  };
}

// Agent 流式输出
interface StreamChunkMessage {
  type: 'stream_chunk';
  data: {
    stage: string;
    content: string;
  };
}

// 人类审核请求
interface HitlPromptMessage {
  type: 'hitl_prompt';
  data: {
    stage: string;
    stage_label: string;
    content: string;
    options: string[];
  };
}

// 任务完成
interface CompleteMessage {
  type: 'complete';
  data: {
    session_id: string;
    result: Record<string, unknown>;
    tokens_consumed: number;
  };
}

// 任务失败
interface ErrorMessage {
  type: 'error';
  data: {
    session_id: string;
    error_code: string;
    message: string;
  };
}

// 预算警告
interface BudgetWarningMessage {
  type: 'budget_warning';
  data: {
    tokens_used: number;
    token_limit: number;
    threshold: number;
    message: string;
  };
}

type AgentWebSocketMessage =
  | StageUpdateMessage
  | StreamChunkMessage
  | HitlPromptMessage
  | CompleteMessage
  | ErrorMessage
  | BudgetWarningMessage;
```

## UI State Models (前端专属)

### Editor State

```typescript
interface EditorState {
  currentElementType: ElementType;  // 当前元素类型
  sceneList: SceneNavItem[];        // 场景导航列表
  isDirty: boolean;                 // 是否有未保存的修改
  lastSavedAt: string | null;       // 最后自动保存时间
  isSaving: boolean;                // 是否正在保存
}

type ElementType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition';

interface SceneNavItem {
  sceneId: string;
  sceneNumber: number;
  location: string;
  episodeNumber: number;
}
```

### Agent Interaction State

```typescript
interface AgentInteractionState {
  sessionId: string | null;
  stage: string | null;             // 当前 Agent 阶段
  stageLabel: string | null;        // 阶段中文标签
  messages: AgentMessageUI[];       // 消息列表
  isRunning: boolean;               // Agent 是否正在执行
  isReviewing: boolean;             // 是否在人类审核节点
  reviewContent: string | null;     // 审核内容预览
  tokensConsumed: number;           // Token 消耗量
  budgetWarning: string | null;     // 预算警告消息
  connectionStatus: ConnectionStatus;
}

interface AgentMessageUI {
  id: string;
  agentName: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  isStreaming: boolean;             // 是否正在流式输出
  timestamp: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
```

### Project List State

```typescript
interface ProjectListState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}
```

### Settings State

```typescript
interface SettingsState {
  apiKeys: ApiKeyConfig[];
  models: ModelConfig[];
  isLoading: boolean;
}

interface ApiKeyConfig {
  provider: string;
  key_preview: string;
  configured: boolean;
}

interface ModelConfig {
  id: string;
  provider: string;
  name: string;
  use_case: string;
  configured: boolean;
}
```

## Local Storage Schema

```typescript
// 编辑器草稿缓存
// Key: draft:{project_id}
// Value: ScriptContent (JSON)
interface DraftCache {
  projectId: string;
  content: ScriptContent;
  savedAt: string;               // ISO 8601
}

// 用户偏好
// Key: user-preferences
interface UserPreferences {
  editorAutoSave: boolean;
  editorAutoSaveInterval: number; // ms, default 30000
  theme: 'light' | 'dark' | 'system';
}
```
