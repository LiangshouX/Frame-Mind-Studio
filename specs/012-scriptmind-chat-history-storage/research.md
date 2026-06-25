# Research: ScriptMind Chat History Storage

**Date**: 2026-06-25

## R1: 会话隔离机制

**Decision**: 修改 `PipelineOrchestrator.findOrCreateSession()` 为 `createSession()`，每次用户发起新对话时始终创建新会话。前端通过显式"新建对话"按钮触发，后端不再自动复用最近会话。

**Rationale**:
- 当前 `findOrCreateSession()` 基于 `(projectId, workflowStep)` 查找最新会话并复用，导致所有对话混在一个 session 中
- 新方案：前端携带 `sessionId` 参数（可选），有值时复用指定会话，无值时创建新会话
- 这样既支持"继续对话"（P2 需求），又支持"新建对话"（P1 需求）

**Alternatives considered**:
- 方案 B：在数据库层面为每个会话添加 `is_active` 标记 → 增加复杂度，且无法解决上下文混杂问题
- 方案 C：通过 `message_order` 范围隔离 → 破坏性大，需要重写所有查询

## R2: 会话标题存储

**Decision**: 在 `agent_sessions` 表新增 `title` 列（VARCHAR 200），支持自动/手动生成。

**Rationale**:
- 标题是会话的核心元数据，必须持久化到数据库
- VARCHAR 200 足够容纳中英文标题
- 与现有 `session_type`、`status` 等字段同级

**Alternatives considered**:
- 方案 B：存储在 `input_data` JSONB 中 → 查询不便，无法排序/搜索
- 方案 C：单独建 `session_titles` 表 → 过度设计，一对一关系无需分表

## R3: 消息 Block 类型保真

**Decision**: 重构 `JpaAgentStateStore.toMsg()` 方法，根据 `messageType` 字段重建对应的 AgentScope `ContentBlock` 类型，而非统一用 `TextBlock` 包装。

**Rationale**:
- 当前 `toMsg()` 始终创建 `TextBlock`，导致 `ThinkingBlock`、`ToolUseBlock`、`ToolResultBlock` 在重载后丢失类型信息
- 修复后：thinking 消息 → `ThinkingBlock`，tool_call → `ToolUseBlock`，tool_result → `ToolResultBlock`，text → `TextBlock`
- 同时需要在 `save()` 方法中正确序列化多 block 消息的完整结构到 `metadata` 列

**Alternatives considered**:
- 方案 B：将每个 block 存为独立的消息记录 → 改变消息语义，一条 Msg 可能变成多条记录
- 方案 C：只修复 save 路径，load 保持 TextBlock → 仍然丢失结构信息，不可接受

## R4: 自动生成标题时机

**Decision**: 在 `AgentEventBridge` 监听到 `AgentEndEvent`（流式完成）后，异步触发标题生成。取用户第一条消息的前 50 字符作为标题，失败时回退到时间戳格式。

**Rationale**:
- AgentEndEvent 标志着一次完整对话结束，是生成标题的最佳时机
- 简单方案（截取用户消息）足够满足 90% 场景，无需额外 LLM 调用
- 异步执行不阻塞主流程

**Alternatives considered**:
- 方案 B：调用 LLM 生成摘要标题 → 增加延迟和成本，且当前场景不需要
- 方案 C：在第一条消息发送时立即生成 → 可能基于不完整信息生成标题

## R5: 前端会话管理架构

**Decision**: 扩展 `agent-store.ts`，在每个 `TabSession` 中增加 `sessionId` 和 `title` 字段，支持多会话列表和切换。右侧面板与 Agent 配置面板共用空间，通过 tab 切换。

**Rationale**:
- 保持现有 tab-based 架构不变，每个 workflow step 仍然独立
- 在每个 step 内部增加会话列表管理
- localStorage 持久化 `activeSessionId` 以支持页面刷新恢复

**Alternatives considered**:
- 方案 B：完全替换为新的会话管理 store → 风险过大，破坏现有功能
- 方案 C：使用独立的 `session-store` → 增加状态同步复杂度
