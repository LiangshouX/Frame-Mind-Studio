# Feature Specification: 测试报告问题修复

**Feature Branch**: `007-bug-fixes-from-testing`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "根据 test_report.md 中发现的 13 个问题（3个P0、5个P1、5个P2），制定系统性修复计划"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - WebSocket 实时连接恢复 (Priority: P1)

用户进入 ScriptMind 工作流后，右侧 Agent 面板应自动建立 WebSocket 连接，状态显示"已连接"。用户输入创意想法后，AI Agent 能实时流式回复，Token 计数器动态更新。

**Why this priority**: WebSocket 是整个 AI 协作功能的基础。未连接意味着核心功能瘫痪，但考虑到后端服务可能未启动，此问题的根因需要先确认。

**Independent Test**: 启动后端服务后，打开 ScriptMind 页面，观察 Agent 面板底部状态从"未连接"变为"已连接"，发送消息后收到 AI 回复。

**Acceptance Scenarios**:

1. **Given** 后端服务已启动且 WebSocket 端点可用, **When** 用户打开 ScriptMind 页面, **Then** Agent 面板底部状态在 5 秒内显示"已连接"
2. **Given** WebSocket 已连接, **When** 用户在输入框输入文字并发送, **Then** 3 秒内收到 AI Agent 的流式回复
3. **Given** AI 回复正在进行, **When** 回复完成, **Then** Token 计数器显示本次对话消耗的 Token 数量

---

### User Story 2 - 剧本编辑器 Tab 布局修复 (Priority: P1)

用户在 ScriptMind 步骤5"剧本内容"中，顶部 Tab 栏应横向排列显示"剧本内容"、"角色"、"场景/布景"、"质量评估"四个标签，所有标签文字完整可见且可正常点击切换。

**Why this priority**: "质量评估" Tab 被截断为竖排文字，UI 严重破损，用户无法正常使用该功能。

**Independent Test**: 打开 ScriptMind 步骤5，截图检查四个 Tab 是否横向排列、文字完整、可点击切换。

**Acceptance Scenarios**:

1. **Given** 用户在 ScriptMind 步骤5, **When** 页面加载完成, **Then** 顶部 Tab 栏横向显示四个完整标签
2. **Given** Tab 栏已显示, **When** 用户点击"质量评估", **Then** 内容区切换到质量评估面板且 Tab 高亮状态正确
3. **Given** 用户在任意子 Tab, **When** 点击其他 Tab, **Then** 内容区正确切换且无布局错位

---

### User Story 3 - 移动端步骤导航可用 (Priority: P1)

用户在 375px 宽度的移动设备上访问 ScriptMind，步骤导航条应显示完整的步骤名称或使用紧凑的图标+文字组合，让用户清楚知道自己处于哪个步骤。

**Why this priority**: 移动端步骤名称被截断为纯数字，用户完全无法识别当前步骤，工作流导航失效。

**Independent Test**: 将浏览器视口设为 375x812，打开 ScriptMind，检查步骤条是否显示可识别的步骤信息。

**Acceptance Scenarios**:

1. **Given** 设备宽度为 375px, **When** 用户打开 ScriptMind, **Then** 步骤导航条显示至少步骤编号+简短名称
2. **Given** 步骤导航已显示, **When** 用户点击某步骤, **Then** 该步骤高亮且内容区正确切换

---

### User Story 4 - 项目详情页添加 ScriptMind 入口 (Priority: P2)

用户进入项目详情页（`/projects/[id]`）后，页面中央区域应有一个明显的按钮或链接，引导用户进入 ScriptMind 五步骤工作流。

**Why this priority**: 当前页面只显示引导文案和 Agent 聊天面板，用户不知道如何进入核心工作流。

**Independent Test**: 打开项目详情页，检查是否存在指向 ScriptMind 的可点击入口。

**Acceptance Scenarios**:

1. **Given** 用户在项目详情页, **When** 页面加载完成, **Then** 页面中央区域存在"开始创作"或"进入工作流"按钮
2. **Given** 按钮已显示, **When** 用户点击该按钮, **Then** 页面跳转到 `/projects/[id]/scriptmind`

---

### User Story 5 - 保存操作反馈 (Priority: P2)

用户在世界观、梗概等步骤点击"保存"按钮后，页面应显示 toast 或 snackbar 提示"保存成功"或"保存失败"，持续 2-3 秒后自动消失。

**Why this priority**: 无保存反馈导致用户不确定数据是否已持久化，影响使用信心。

**Independent Test**: 填写表单后点击保存，检查是否出现成功/失败提示。

**Acceptance Scenarios**:

1. **Given** 用户已填写表单, **When** 点击保存按钮, **Then** 2 秒内出现"保存成功"提示
2. **Given** 保存成功提示已显示, **When** 3 秒后, **Then** 提示自动消失

---

### User Story 6 - 设置页标签页功能正常 (Priority: P2)

用户在设置页面点击"MCP Server"、"Tavily 搜索"、"其他工具"标签时，内容区应切换到对应的配置面板，而非停留在模型供应商列表。

**Why this priority**: MCP Server 和其他工具标签页内容不切换，配置功能不可用。

**Independent Test**: 打开设置页，依次点击各标签，检查内容区是否正确切换。

**Acceptance Scenarios**:

1. **Given** 用户在设置页, **When** 点击"MCP Server"标签, **Then** 内容区显示 MCP Server 配置表单
2. **Given** 用户在设置页, **When** 点击"其他工具"标签, **Then** 内容区显示其他工具配置面板

---

### User Story 7 - API 路由统一 (Priority: P2)

前端所有 API 请求应使用统一的路由前缀，消除 `/api/projects` 返回 404 而 `/api/v1/projects` 正常的不一致问题。控制台不再出现大量 404 错误。

**Why this priority**: 路由不一致可能导致前端在某些场景下加载失败，控制台错误影响开发者体验。

**Independent Test**: 打开浏览器控制台，访问项目列表页，检查是否还有 404 错误。

**Acceptance Scenarios**:

1. **Given** 用户打开项目列表页, **When** 页面加载完成, **Then** 控制台无 404 错误
2. **Given** 前端发起 API 请求, **When** 请求到达后端, **Then** 所有请求路由正确匹配

---

### Clarifications

#### Session 2026-06-22

- Q: WebSocket 断开后系统应如何处理重连？ → A: 自动重连（指数退避，最多 5 次），失败后显示"未连接"+手动重试按钮
- Q: 保存成功和失败的 toast 应如何区分？ → A: 成功=绿色 toast，失败=红色 toast，均 3 秒后自动消失
- Q: 分镜、风格、动态、配音这些未实现的模块应如何呈现？ → A: 按钮灰色不可点击，hover 时 tooltip 显示"即将推出"
- Q: 在宽度 < 320px 的设备上，步骤导航应如何显示？ → A: 步骤条横向可滚动，仅显示编号，滑动查看完整名称
- Q: 设置页标签切换时，未保存的表单数据应如何处理？ → A: 保留未保存数据，切换回来后表单内容仍在

### Edge Cases

- WebSocket 连接失败时显示"未连接"状态并提供手动重试按钮
- WebSocket 断开后自动重连（指数退避，最多 5 次），失败后降级为手动重试
- 保存失败时 toast 使用红色样式，3 秒后自动消失
- 移动端步骤导航在极窄屏幕（< 320px）下横向可滚动
- 设置页标签切换时保留未保存的表单数据

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Agent 面板 MUST 在页面加载后 5 秒内建立 WebSocket 连接，状态显示"已连接"
- **FR-002**: WebSocket 连接失败时 MUST 显示"未连接"状态并提供手动重试按钮；断开后 MUST 自动重连（指数退避，最多 5 次），全部失败后降级为手动重试
- **FR-003**: AI 回复 MUST 以流式方式实时显示，Token 计数器 MUST 在回复完成后更新
- **FR-004**: 剧本编辑器顶部 Tab 栏 MUST 横向排列所有标签，文字完整可见
- **FR-005**: "质量评估" Tab MUST 与其他 Tab 保持一致的布局和交互
- **FR-006**: 移动端（375px）步骤导航 MUST 显示步骤编号和名称（可紧凑排列）；极窄屏幕（< 320px）下 MUST 横向可滚动，仅显示编号
- **FR-007**: 项目详情页 MUST 提供明确的"进入 ScriptMind"入口按钮
- **FR-008**: 所有保存操作 MUST 提供 toast 反馈：成功=绿色 toast，失败=红色 toast，均 3 秒后自动消失
- **FR-009**: 设置页所有标签页 MUST 正确切换对应内容面板
- **FR-010**: API 路由 MUST 统一，消除 `/api/projects` 404 问题
- **FR-011**: 控制台 MUST 不再出现因路由不一致导致的 404 错误
- **FR-012**: 项目详情页侧边栏模块（分镜、风格、动态、配音）MUST 灰色不可点击，hover 时 tooltip 显示"即将推出"

### Key Entities

- **WebSocket 连接**: Agent 面板与后端的实时通信通道，状态包括：未连接、连接中、已连接、重连中
- **Toast 提示**: 临时通知组件，显示操作结果，自动消失
- **步骤导航条**: ScriptMind 五步骤的顶部导航，支持步骤切换和状态指示

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Agent 面板 WebSocket 连接成功率达到 95%（后端服务正常时）
- **SC-002**: AI 回复首字延迟不超过 3 秒
- **SC-003**: 移动端步骤导航可识别率 100%（所有步骤名称可见）
- **SC-004**: 保存操作反馈覆盖率 100%（所有保存按钮均有 toast 提示）
- **SC-005**: 设置页标签切换成功率 100%（所有标签均可正确切换内容）
- **SC-006**: 控制台 404 错误数降至 0
- **SC-007**: 用户从项目列表到进入 ScriptMind 工作流的操作步骤不超过 3 步

## Assumptions

- 后端服务（Spring Boot）已正确配置 WebSocket 端点
- 前端 WebSocket 客户端代码已实现但可能未正确连接
- `/api/v1/projects` 是正确的 API 路由前缀
- 设置页 MCP Server 和其他工具标签页的前端组件已存在但未正确挂载
- 移动端适配是本次修复范围，但不需要达到完美的移动端体验
