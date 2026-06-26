# Tasks: ScriptMind Chat History Storage

**Input**: Design documents from `/specs/012-scriptmind-chat-history-storage/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/agent-session-api.md

**Tests**: 未明确要求 TDD，测试任务不包含在内。

**Organization**: 按用户故事分组，支持独立实现和测试。

## V2 修正任务（2026-06-26）

初版实现存在以下问题，V2 进行了修正：

- [x] T032 [V2] 新增 Flyway 迁移 `V5__fix_session_management.sql`：在 `agent_sessions` 表新增 `title_source` 列（VARCHAR 20, default 'auto'）
- [x] T033 [V2] 更新 `AgentSessionPO.java`：新增 `titleSource` 字段
- [x] T034 [V2] 重构 `AgentSessionService.createSession()`：新增重载方法接受 `workflowStep` 和 `agentName` 参数
- [x] T035 [V2] 改进 `AgentSessionService.generateTitle()`：智能核心主题提取（去除常见请求前缀），添加 `titleSource` 标记；`extractTitleFromMessage()` 辅助方法
- [x] T036 [V2] 修复 `AgentSessionService.updateTitle()`：设置 `titleSource = "manual"`
- [x] T037 [V2] 修复 `ProjectAgentController` REST API 路径：`/session-list` → `/sessions`、`/session-create` → `POST /sessions` 等
- [x] T038 [V2] 修复 `ProjectAgentController.createSession()`：正确传递 `workflowStep`，通过 `STEP_TO_AGENT` 映射确定 `agentName`
- [x] T039 [V2] 重构 `PipelineOrchestrator.createSession()`：委托给 `AgentSessionService.createSession()`，消除代码重复
- [x] T040 [V2] 前端 API 路径同步：`agent-api.ts` 中所有端点路径更新为 RESTful 格式
- [x] T041 [V2] 修复 `agent-store.ts` 的 `removeSession()`：删除活跃会话后自动加载替换会话的消息
- [x] T042 [V2] 添加 `wsDisconnectVersion` 信号机制：会话切换时自动断开旧 WebSocket；`switchSession`、`createNewSession` 调用 `signalWsDisconnect()`
- [x] T043 [V2] 更新 `workflow-layout`：监听 `wsDisconnectVersion` 并断开 WebSocket；移除未使用的 `getChatHistory` 导入

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3, US4）

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 数据库迁移、PO 类更新、共享类型更新

- [x] T001 创建 Flyway 迁移文件 `backend-java/src/main/resources/db/migration/V4__chat_history_storage.sql`：在 `agent_sessions` 表新增 `title` 列（VARCHAR 200, nullable），新增复合索引 `(project_id, workflow_step, created_at DESC)`
- [x] T002 [P] 更新 `backend-java/src/main/java/io/framemind/infrastructure/po/AgentSessionPO.java`：新增 `title` 字段（String, nullable），添加 getter/setter
- [x] T003 [P] 更新 `shared/types/agent.ts`：在 `AgentSession` 接口新增 `title?: string` 和 `messageCount?: number` 字段
- [x] T004 [P] 更新 `frontend/src/types/agent.ts`：在 `AgentSession` 接口同步新增 `title` 和 `message_count` 字段

---

## Phase 2: Foundational (阻塞性前置条件)

**Purpose**: 后端会话管理核心能力 — 所有用户故事依赖此阶段

**⚠️ CRITICAL**: 此阶段完成前不能开始任何用户故事

- [x] T005 更新 `backend-java/src/main/java/io/framemind/infrastructure/repository/AgentSessionRepository.java`：新增 `findByProjectIdAndWorkflowStepOrderByCreatedAtDesc(UUID projectId, String workflowStep, Pageable pageable)` 分页查询方法；新增 `countByProjectIdAndWorkflowStep(UUID projectId, String workflowStep)` 计数方法
- [x] T006 更新 `backend-java/src/main/java/io/framemind/infrastructure/repository/AgentMessageRepository.java`：新增 `countBySessionId(UUID sessionId)` 计数方法
- [x] T007 在 `backend-java/src/main/java/io/framemind/modules/scriptmind/service/AgentSessionService.java` 新增方法：`listSessions(UUID projectId, String workflowStep, int page, int size)` 返回分页会话列表；`getSessionDetail(UUID sessionId)` 返回含消息列表的会话详情；`deleteSession(UUID sessionId)` 删除会话及其消息；`updateTitle(UUID sessionId, String title)` 更新标题
- [x] T008 在 `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/ProjectAgentController.java` 新增 REST 端点：`GET /sessions` (分页列表)、`GET /sessions/{sessionId}` (详情)、`POST /sessions` (创建)、`PATCH /sessions/{sessionId}/title` (更新标题)、`DELETE /sessions/{sessionId}` (删除)。参照 `contracts/agent-session-api.md`
- [x] T009 修改 `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/ProjectAgentController.java` 的 `chat()` 方法：接受可选 `session_id` 参数，有值时复用指定会话，无值时创建新会话

**Checkpoint**: 基础设施就绪 — 可以开始用户故事实现

---

## Phase 3: User Story 1 — 会话隔离 (Priority: P1) 🎯 MVP

**Goal**: 每次用户发起新对话时创建独立会话，AI 上下文不混杂

**Independent Test**: 在同一 workflow step 创建两个对话，验证消息各自独立，AI 只看到当前会话的上下文

### Implementation for User Story 1

- [x] T010 [US1] 重构 `backend-java/src/main/java/io/framemind/agent/orchestration/PipelineOrchestrator.java`：将 `findOrCreateSession()` 改为 `createSession()`（始终创建新会话）；修改 `dispatchToAgent()` 接受可选 `sessionId` 参数，有值时查找并复用指定会话，无值时调用 `createSession()`
- [x] T011 [US1] 更新 `frontend/src/stores/agent-store.ts`：在 `TabSession` 接口新增 `sessionId: string | null` 和 `title: string | null`；新增 `sessionsByTab: Record<WorkflowStep, Array<{id: string, title: string | null, createdAt: string}>>` 存储会话列表；新增 `loadSessionList(workflowStep)` action 从 API 加载会话列表；新增 `switchSession(sessionId)` action 切换当前会话
- [x] T012 [US1] 更新 `frontend/src/lib/api/agent-api.ts`：新增 `listSessions(projectId, workflowStep, page, size)` 调用 `GET /sessions`；新增 `getSessionDetail(projectId, sessionId)` 调用 `GET /sessions/{sessionId}`；新增 `createSession(projectId, workflowStep)` 调用 `POST /sessions`；修改 `sendChatMessage()` 新增可选 `sessionId` 参数
- [x] T013 [US1] 更新 `frontend/src/stores/agent-store.ts` 的 `sendChat` 逻辑：发送消息时携带当前 `sessionId`；接收 `session_id` 响应后更新 `sessionId`；在 `setActiveTab()` 时自动加载该 step 的会话列表
- [x] T014 [US1] 在 `frontend/src/stores/agent-store.ts` 新增 localStorage 持久化：存储每个 step 的 `activeSessionId`，页面刷新时恢复上次查看的会话

**Checkpoint**: 用户可以创建独立对话，每个对话的 AI 上下文互不干扰

---

## Phase 4: User Story 2 — 历史对话浏览与选择 (Priority: P2)

**Goal**: 用户可以在右侧边栏浏览、选择、切换、删除历史对话

**Independent Test**: 创建多个对话后，右侧边栏显示列表，点击可加载历史，可删除会话

### Implementation for User Story 2

- [x] T015 [P] [US2] 创建 `frontend/src/components/scriptmind/ChatHistorySidebar.tsx`：右侧面板组件，包含会话列表（标题 + 时间戳）、"新建对话"按钮、每个会话的删除按钮（带二次确认）；列表支持分页/滚动加载；与 Agent 配置面板通过 tab 切换共用空间
- [x] T016 [US2] 在 `frontend/src/components/scriptmind/` 中找到现有的 Agent 配置面板容器，修改为 tab 切换结构：tab 1 = "对话历史"（ChatHistorySidebar），tab 2 = "Agent 配置"（现有面板）
- [x] T017 [US2] 实现 `ChatHistorySidebar` 的会话切换逻辑：点击会话 → 调用 `switchSession(sessionId)` → 从 API 加载消息历史 → 渲染到聊天区域；切换时断开旧 WebSocket 并连接新会话
- [x] T018 [US2] 实现 `ChatHistorySidebar` 的删除逻辑：点击删除 → 弹出确认对话框 → 确认后调用 `DELETE /sessions/{sessionId}` → 从列表移除；若删除的是当前活跃会话，自动切换到列表中第一个会话或创建新会话
- [x] T019 [US2] 实现 `ChatHistorySidebar` 的"新建对话"按钮：点击 → 调用 `POST /sessions` → 创建新会话 → 切换到空聊天视图 → 清空当前消息
- [x] T020 [US2] 更新 `frontend/src/stores/agent-store.ts` 的 `switchSession()`：调用 `getSessionDetail()` 加载完整消息历史 → 转换为 `AgentMessageUI[]` → 替换当前 tab 的 messages → 连接新会话的 WebSocket

**Checkpoint**: 用户可以浏览历史列表、切换对话、删除会话、创建新对话

---

## Phase 5: User Story 3 — 自动生成标题 (Priority: P3)

**Goal**: 每个会话在首次对话完成后自动生成有意义的标题

**Independent Test**: 发送消息并等待回复后，会话列表中显示自动生成的标题；手动编辑后标题不被覆盖

### Implementation for User Story 3

- [x] T021 [US3] 在 `backend-java/src/main/java/io/framemind/agent/hook/StreamingHook.java` 的 `onComplete()` 方法中：流式完成后异步调用标题生成逻辑 — 取用户第一条消息前 50 字符作为标题，更新到 `agent_sessions.title`；失败时回退到时间戳格式（如 "对话 06-25 10:30"）
- [x] T022 [US3] 在 `backend-java/src/main/java/io/framemind/modules/scriptmind/service/AgentSessionService.java` 新增 `generateTitle(UUID sessionId)` 方法：查询会话的第一条用户消息 → 截取前 50 字符 → 更新 title 字段；新增 `isAutoGenerated(UUID sessionId)` 检查标题是否为自动生成（通过对比时间戳格式或新增 `title_source` 标记）
- [x] T023 [US3] 在 `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/ProjectAgentController.java` 的 `updateTitle()` 端点中：标记用户手动设置的标题为 "manual" 来源，防止被自动覆盖
- [x] T024 [US3] 在 `ChatHistorySidebar.tsx` 中实现标题编辑：双击标题进入编辑模式 → 调用 `PATCH /sessions/{sessionId}/title` → 保存后退出编辑模式；自动生成的标题显示为灰色/斜体以区分

**Checkpoint**: 会话自动生成标题，用户可手动编辑且不被覆盖

---

## Phase 6: User Story 4 — 消息 Block 结构保真 (Priority: P4)

**Goal**: 重载会话时保持 AgentScope Block 的原始类型（ThinkingBlock, ToolUseBlock, ToolResultBlock）

**Independent Test**: 发送触发工具调用的消息 → 重启后端 → 加载会话 → 验证工具调用和思考块仍显示为结构化块

### Implementation for User Story 4

- [x] T025 [US4] 重构 `backend-java/src/main/java/io/framemind/agent/core/JpaAgentStateStore.java` 的 `save()` 方法：将每条 `Msg` 的完整 `content`（`List<ContentBlock>`）序列化为 JSON 存入 `metadata` 列，而非仅保存文本内容；`content` 列保存 `getTextContent()` 的值作为搜索/显示备用
- [x] T026 [US4] 重构 `backend-java/src/main/java/io/framemind/agent/core/JpaAgentStateStore.java` 的 `toMsg()` 方法：根据 `messageType` 从 `metadata` JSON 反序列化对应的 `ContentBlock` 类型 — "thinking" → `ThinkingBlock`，"tool_call" → `ToolUseBlock`，"tool_result" → `ToolResultBlock`，"text" → `TextBlock`；无 metadata 时回退到 `TextBlock`（兼容旧数据）
- [x] T027 [US4] 重构 `backend-java/src/main/java/io/framemind/agent/core/JpaAgentStateStore.java` 的 `resolveMessageType()` 方法：检查所有 `ContentBlock` 而非仅第一个，支持一条消息包含多个 block 类型的情况；将多 block 消息的类型设为 "text"（主类型），具体 block 信息存储在 metadata 中

**Checkpoint**: 会话重载后消息的 block 类型完整保留，AI 上下文质量不退化

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 边界处理、兼容性、验证

- [x] T028 [P] 处理 legacy 数据兼容：在 `AgentSessionService` 的 `listSessions()` 和 `getSessionDetail()` 中，title 为 null 时返回 "未命名对话" 作为回退；`JpaAgentStateStore.toMsg()` 中 metadata 为 null 时回退到 TextBlock
- [x] T029 [P] 在 `frontend/src/components/scriptmind/ChatHistorySidebar.tsx` 中处理空状态：无会话时显示引导文案 "暂无对话记录，点击上方按钮开始新对话"
- [ ] T030 运行 `quickstart.md` 中的 6 个验证场景，确保所有功能端到端正常
- [x] T031 更新 `frontend/src/lib/api/agent-api.ts` 中 `getChatHistory()` 方法：适配新的会话列表 API，或标记为废弃（deprecated）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，立即开始
- **Foundational (Phase 2)**: 依赖 Phase 1 完成 — 阻塞所有用户故事
- **US1 (Phase 3)**: 依赖 Phase 2 — 核心隔离能力
- **US2 (Phase 4)**: 依赖 Phase 1 (API 需要 title 字段)；可与 Phase 3 并行（如果 API 已就绪）
- **US3 (Phase 5)**: 依赖 Phase 2 (需要会话管理能力)；可与 Phase 3/4 并行
- **US4 (Phase 6)**: 依赖 Phase 2；完全独立于 US1/US2/US3
- **Polish (Phase 7)**: 依赖所有用户故事完成

### User Story Dependencies

- **US1 (P1)**: 无前置故事依赖 — Phase 2 完成后即可开始
- **US2 (P2)**: 可与 US1 并行（API 层面独立），但 UI 集成需要 US1 的 store 变更
- **US3 (P3)**: 完全独立于 US1/US2，仅依赖 Phase 2
- **US4 (P4)**: 完全独立于 US1/US2/US3，仅依赖 Phase 2

### Within Each User Story

- 先后端（API/Service），后前端（Store/UI）
- Store 变更先于 UI 组件
- 核心实现先于边界处理

### Parallel Opportunities

- Phase 1 中 T002/T003/T004 可并行（不同文件）
- Phase 2 中 T005/T006 可并行（不同 Repository）
- Phase 3~6 之间可并行（不同文件，不同关注点）
- Phase 7 中 T028/T029 可并行

---

## Parallel Example: User Story 1

```bash
# 后端先完成（T010）
Task: "重构 PipelineOrchestrator 会话创建逻辑"

# 前端可并行准备 API 客户端（T012）
Task: "更新 agent-api.ts 新增会话 API"

# Store 变更（T011, T013, T014）顺序执行
Task: "更新 agent-store.ts 多会话管理"
Task: "更新发送消息逻辑携带 sessionId"
Task: "新增 localStorage 持久化"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: 数据库迁移 + PO 更新
2. 完成 Phase 2: 后端会话管理 API
3. 完成 Phase 3: 前端会话隔离
4. **STOP and VALIDATE**: 验证独立对话功能
5. 可部署/演示

### Incremental Delivery

1. Phase 1 + Phase 2 → 基础就绪
2. + Phase 3 (US1) → 会话隔离可用 → **MVP**
3. + Phase 4 (US2) → 历史浏览可用
4. + Phase 5 (US3) → 自动标题可用
5. + Phase 6 (US4) → Block 保真可用
6. + Phase 7 → 边界处理和验证

### 推荐实施顺序

由于本项目为单人开发，建议按优先级顺序串行执行：**Phase 1 → 2 → 3 → 4 → 5 → 6 → 7**。US3 和 US4 可以根据实际情况调整顺序（两者完全独立）。

---

## Notes

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签将任务映射到用户故事
- 每个用户故事应可独立完成和测试
- 每完成一个 task 或逻辑组后提交 git
- 在任何 checkpoint 停下来验证当前故事
