# Feature Specification: ScriptMind 前端功能细化

**Feature Branch**: `003-scriptmind-frontend-refinements`

**Created**: 2026-06-18

**Status**: Draft

**Input**: 基于 002-scriptmind-frontend 的实现，针对 Agent 交互、大纲呈现、剧本编辑器与保存、按钮布局四个核心区域进行功能细化和缺陷修复

## Clarifications

### Session 2026-06-18

- Q: `slateToScript` 转换时如何处理 beat 级别元数据（moodTags、cameraSuggestion 等）？→ A: 仅保留文本内容和结构（episodes → scenes → beats + 元素类型），元数据通过独立面板（非编辑器内）编辑，保存时与文本内容合并
- Q: 自动保存是否创建版本快照？→ A: 仅手动保存（Ctrl+S / 保存按钮）创建版本快照，自动保存只保存内容不创建快照
- Q: 版本历史面板放在页面什么位置？→ A: 右侧面板中以标签页形式切换（角色 / 伏笔 / 版本历史）

## Background

002-scriptmind-frontend 已完成基础框架搭建，但通过代码审查发现多个关键功能存在断裂（dead code）、缺失连接、严重 bug 等问题。本文档将这些缺陷按功能域组织为用户故事，确保每个修复都可独立测试和验证。

## User Scenarios & Testing

### User Story 1 — Agent 聊天交互闭环 (Priority: P1)

用户在工作台页面的 Agent 面板中输入梗概，发送后看到 Agent 阶段进度和流式输出，输出完成后消息状态自动标记为已完成，新消息自动滚动到可见区域。如果 API 调用失败，用户在聊天界面中看到错误提示而非静默失败。

**Why this priority**: Agent 交互是 ScriptMind 的核心入口。当前实现存在流式消息永不结束、无错误反馈、无自动滚动等缺陷，导致用户体验断裂。

**Independent Test**: 输入一句话梗概 → 看到 4 阶段进度 → 流式输出内容 → 输出完成后消息标记为已完成 → 新消息自动滚入视图。模拟 API 失败时，聊天界面显示错误消息。

**Acceptance Scenarios**:

1. **Given** 用户在 Agent 面板输入梗概并点击发送，**When** Agent 开始输出，**Then** 消息列表自动滚动到最新内容，无需用户手动滚动
2. **Given** Agent 流式输出完成，**When** 后端发送 `complete` 消息，**Then** 最后一条流式消息的 `isStreaming` 标记被移除，显示为普通消息
3. **Given** Agent API 调用失败（网络错误、500 错误等），**When** 前端捕获异常，**Then** 聊天界面显示一条系统错误消息（红色背景），说明失败原因
4. **Given** 用户导航离开工作台页面后返回，**When** 页面重新加载，**Then** 聊天历史通过 API 从后端恢复（非内存丢失）
5. **Given** 用户在审核节点点击"提交修改"但未输入反馈，**When** 系统检测到空输入，**Then** 提示用户输入修改意见，不发送请求

---

### User Story 2 — 大纲查看与细化操作 (Priority: P1)

用户在大纲查看器中查看 AI 生成的结构化大纲，可以逐集展开查看详情。当大纲确认后，用户点击"细化为剧本"按钮，系统启动 Agent 将大纲转化为标准剧本格式。

**Why this priority**: "细化为剧本"是从大纲到编辑器的关键桥梁。当前该按钮因 `onRefine` prop 未连接而完全不可用，阻塞了整个创作流程。

**Independent Test**: 查看大纲 → 逐集展开/折叠 → 点击"细化为剧本" → 系统发起 refineScript API 调用 → Agent 进度显示 → 完成后跳转到编辑器。

**Acceptance Scenarios**:

1. **Given** 项目已有定稿大纲，**When** 用户在工作台页面查看大纲，**Then** 大纲顶部显示"细化为剧本"操作按钮
2. **Given** 用户点击"细化为剧本"，**When** 按钮被点击，**Then** 系统调用 `refineScript` API，Agent 面板显示生成进度
3. **Given** 大纲内容正在加载中，**When** 项目数据尚未从后端返回，**Then** 大纲查看器显示骨架屏加载状态，而非空白
4. **Given** 大纲内容加载失败，**When** API 返回错误，**Then** 大纲查看器显示错误状态和"重试"按钮
5. **Given** 大纲已生成但用户想修改后再细化，**When** 用户在 Agent 面板输入修改反馈，**Then** 系统重新生成修订版大纲，大纲查看器更新显示

---

### User Story 3 — 剧本编辑器工具栏与保存 (Priority: P1)

用户在剧本编辑器中编写内容时，顶部工具栏显示当前元素类型、保存状态和操作按钮。用户可以通过工具栏切换元素类型、手动保存（创建版本快照）、触发 AI 优化建议。Ctrl+S 快捷键触发保存。

**Why this priority**: EditorToolbar 组件已实现但从未渲染到页面中，导致用户看不到元素类型指示、无法手动保存、无法使用 AI 优化。自动保存存在严重 bug（保存的是原始内容而非用户编辑内容）。

**Independent Test**: 在编辑器中输入内容 → 工具栏显示当前元素类型 → 按 Tab 切换类型 → 工具栏同步更新 → 按 Ctrl+S 触发保存 → 状态显示"保存中..." → 保存成功后显示"已保存"。

**Acceptance Scenarios**:

1. **Given** 用户在编辑器中输入内容，**When** 内容发生变化，**Then** 工具栏显示"未保存"状态，保存按钮可点击
2. **Given** 用户按 Ctrl+S 或点击保存按钮，**When** 保存触发，**Then** 工具栏显示"保存中..."状态，保存按钮显示加载动画并禁用
3. **Given** 保存成功完成，**When** 后端返回成功响应，**Then** 工具栏显示"已保存"状态，editorStore 的 `isDirty` 重置为 false
4. **Given** 保存失败（网络错误、后端错误），**When** 前端捕获异常，**Then** 工具栏显示"保存失败"状态（红色），用户可点击重试
5. **Given** 用户按 Tab 键切换元素类型，**When** 类型切换完成，**Then** 工具栏中的元素类型选择器同步高亮当前类型
6. **Given** 用户点击工具栏中的元素类型按钮，**When** 按钮被点击，**Then** 当前光标所在段落切换为该元素类型
7. **Given** 用户在编辑器中选中一段文本，**When** 点击工具栏中的"AI 优化"按钮，**Then** 侧面板展开显示优化建议

---

### User Story 4 — 自动保存正确性修复 (Priority: P1)

用户编辑剧本时，系统以 30 秒防抖间隔自动保存。自动保存必须保存当前编辑器中的实际内容（而非组件挂载时的原始内容），保存失败时需通知用户。

**Why this priority**: 当前自动保存实现存在严重 bug —— `autoSave` 函数通过闭包捕获了 `script?.content`（组件挂载时的 props），而非当前 Slate 编辑器状态。这意味着每次自动保存都会用原始内容覆盖用户编辑。

**Independent Test**: 在编辑器中输入新内容 → 等待 30 秒自动保存 → 刷新页面 → 验证新内容被保留（而非被原始内容覆盖）。

**Acceptance Scenarios**:

1. **Given** 用户在编辑器中输入了新内容，**When** 30 秒自动保存触发，**Then** 保存的是当前 Slate 编辑器中的实际内容，而非组件挂载时的原始内容
2. **Given** 自动保存需要将 Slate 节点转换为后端 API 期望的 `ScriptContent` 格式，**When** 转换执行，**Then** 元素类型和场景结构完整保留，beat 级别元数据通过独立面板管理并在保存时合并
3. **Given** 自动保存失败，**When** API 返回错误，**Then** 编辑器底部显示非阻塞的错误提示（toast），告知用户保存失败
4. **Given** 用户有未保存的修改，**When** 用户尝试离开页面，**Then** 浏览器显示确认对话框，提示有未保存的更改
5. **Given** 用户连续编辑多个段落，**When** 30 秒内有多次修改，**Then** 只触发一次保存（防抖），保存最新的完整内容

---

### User Story 5 — 按钮连接与交互修复 (Priority: P2)

所有已实现但未连接的按钮和交互功能需要正确接入。包括：场景导航的滚动定位、大纲的"细化为剧本"按钮、编辑器的 AI 优化面板。

**Why this priority**: 多个组件已实现完整 UI 但因 prop 未传递或事件未绑定而无法使用。这些是低成本高价值的修复。

**Independent Test**: 点击场景导航中的某个场景 → 编辑器滚动到对应场景 → 选中文本后点击 AI 优化 → 显示优化建议面板。

**Acceptance Scenarios**:

1. **Given** 编辑器中有多个场景，**When** 用户点击左侧 SceneNav 中的某个场景按钮，**Then** 编辑器自动滚动到该场景标题位置，并高亮显示
2. **Given** SceneNav 中的场景列表，**When** 用户在编辑器中编辑导致场景变化，**Then** SceneNav 中的场景编号和标题同步更新
3. **Given** 用户在编辑器中选中一段文本，**When** 点击"AI 优化"按钮（工具栏中），**Then** OptimizePanel 在编辑器右侧展开，显示加载状态
4. **Given** OptimizePanel 显示了优化建议，**When** 用户点击某个建议的"应用"按钮，**Then** 编辑器中选中的文本被替换为建议内容
5. **Given** 用户在大纲查看器中，**When** 大纲内容已加载，**Then** "细化为剧本"按钮可见且可点击

---

### User Story 6 — 版本历史面板 (Priority: P2)

用户在编辑器页面查看版本历史列表，可以回溯到某个历史版本，或对比两个版本的差异。手动保存时自动创建版本快照。

**Why this priority**: 版本 API 已完整实现（listVersions、getVersion、restoreVersion、compareVersions），但没有任何 UI 组件使用这些 API。创作过程需要版本控制保障。

**Independent Test**: 编辑剧本 → 手动保存 → 再次编辑并保存 → 打开版本历史 → 选择两个版本对比 → 查看差异高亮 → 回溯到早期版本。

**Acceptance Scenarios**:

1. **Given** 用户手动保存剧本（Ctrl+S 或保存按钮），**When** 保存成功，**Then** 系统创建一个版本快照（附带变更摘要），版本历史列表更新。自动保存不创建快照
2. **Given** 用户打开版本历史面板，**When** 版本列表加载完成，**Then** 显示按时间倒序的版本列表，每条显示版本号、时间和变更摘要
3. **Given** 用户选择一个历史版本，**When** 点击"回溯到此版本"，**Then** 编辑器内容恢复到该版本状态，当前版本作为新快照保留
4. **Given** 用户选择两个版本，**When** 点击"对比差异"，**Then** 以高亮方式展示两个版本之间的增删改差异
5. **Given** 版本历史列表为空，**When** 用户打开面板，**Then** 显示空状态提示

---

### User Story 7 — 编辑器页面布局完善 (Priority: P2)

剧本编辑器页面需要包含完整的工具栏、场景导航、编辑器主体、角色面板和伏笔追踪面板。所有组件正确集成，布局合理。

**Why this priority**: 当前 scriptmind 页面缺少工具栏，导致编辑器功能不完整。

**Independent Test**: 进入编辑器页面 → 看到顶部工具栏 → 左侧场景导航 → 中间编辑器 → 右侧角色和伏笔面板。

**Acceptance Scenarios**:

1. **Given** 用户进入剧本编辑器页面，**When** 页面加载完成，**Then** 顶部显示 EditorToolbar（元素类型选择器、保存状态、保存按钮、AI 优化按钮）
2. **Given** EditorToolbar 显示，**When** 编辑器内容为空，**Then** 工具栏仍正常显示，元素类型选择器默认选中 action
3. **Given** 用户在编辑器页面，**When** 右侧面板展开，**Then** 面板顶部显示标签页切换（角色 / 伏笔 / 版本历史），选中标签的内容在下方显示，各标签可独立滚动

---

### User Story 8 — 工作台与大纲页去重 (Priority: P3)

工作台页面和大纲页面共享相同的 Agent 交互逻辑，应提取为共享 hook 或高阶组件，减少代码重复。

**Why this priority**: 代码重复增加维护成本，但不影响功能。优先级低于功能修复。

**Independent Test**: 修改共享逻辑后，两个页面的行为保持一致。

**Acceptance Scenarios**:

1. **Given** 工作台页面和大纲页面都使用 Agent 交互，**When** 共享逻辑提取后，**Then** 两个页面的行为完全一致
2. **Given** 共享 hook 封装了 Agent 会话管理，**When** 任一页面调用，**Then** 状态管理、API 调用、WebSocket 连接行为统一

---

### Edge Cases

- 用户在 Agent 流式输出过程中刷新页面，如何处理？→ 消息历史通过 API 从后端恢复，WebSocket 重新连接
- 自动保存和手动保存同时触发，如何处理？→ 手动保存优先（同时创建版本快照），自动保存的 debounce 重置，不重复创建快照
- 用户在两个标签页同时编辑同一剧本，保存时如何处理？→ 后端最后写入策略，前端在保存冲突时提示用户刷新
- 大纲内容格式不符合预期（后端返回异常），如何处理？→ 大纲查看器显示解析错误提示，不崩溃
- 版本回溯后用户想撤销回溯，如何处理？→ 回溯前的版本已作为快照保留，用户可再次回溯到该版本

## Requirements

### Functional Requirements

**Agent 交互修复**

- **FR-001**: Agent 消息列表 MUST 在新消息到达时自动滚动到最新内容
- **FR-002**: Agent 流式输出完成后，最后一条消息的 `isStreaming` 标记 MUST 被移除
- **FR-003**: Agent API 调用失败时，聊天界面 MUST 显示一条系统错误消息（不静默失败）
- **FR-004**: 用户返回工作台页面时，Agent 聊天历史 MUST 通过 API 从后端恢复
- **FR-005**: 审核面板的"提交修改"按钮 MUST 在用户未输入反馈时禁用或提示

**大纲呈现修复**

- **FR-006**: 大纲查看器的"细化为剧本"按钮 MUST 通过 `onRefine` prop 连接到 `refineScript` API
- **FR-007**: 大纲查看器 MUST 在内容加载时显示骨架屏或加载状态
- **FR-008**: 大纲查看器 MUST 在内容加载失败时显示错误状态和重试按钮

**编辑器工具栏与保存**

- **FR-009**: 剧本编辑器页面 MUST 渲染 `EditorToolbar` 组件，显示元素类型选择器、保存状态和保存按钮
- **FR-010**: Ctrl+S 快捷键 MUST 触发实际保存操作（调用 `updateScript` API）
- **FR-011**: 保存按钮 MUST 在 `isDirty` 为 true 时可点击，保存过程中显示加载状态
- **FR-012**: 工具栏中的元素类型选择器 MUST 与编辑器当前光标位置的元素类型同步
- **FR-013**: 点击工具栏中的元素类型按钮 MUST 将当前段落切换为该类型
- **FR-014**: 工具栏中的"AI 优化"按钮 MUST 在有选中文本时触发 `OptimizePanel` 展开

**自动保存修复**

- **FR-015**: 自动保存 MUST 读取当前 Slate 编辑器状态（`editor.children`），而非组件挂载时的 props
- **FR-016**: 自动保存 MUST 将 Slate 节点转换为后端 API 期望的 `ScriptContent` 格式（保留 episodes、scenes、beats 结构和元素类型），beat 级别元数据（moodTags、cameraSuggestion 等）通过独立面板编辑，保存时与文本内容合并后提交
- **FR-017**: 自动保存失败时 MUST 显示非阻塞错误提示
- **FR-018**: 用户有未保存修改时离开页面 MUST 触发 `beforeunload` 确认对话框

**按钮连接修复**

- **FR-019**: SceneNav 中的场景按钮 MUST 有 `onClick` 事件，点击时编辑器滚动到对应场景
- **FR-020**: OptimizePanel MUST 在编辑器页面中可访问（通过工具栏按钮或右键菜单触发）
- **FR-021**: SceneNav 的场景列表 MUST 随编辑器内容变化同步更新

**版本历史**

- **FR-022**: 手动保存（Ctrl+S 或保存按钮）MUST 创建版本快照（调用 `updateScript` 时附带 `changeSummary`），自动保存仅保存内容不创建快照
- **FR-023**: 版本历史面板 MUST 显示版本列表（按时间倒序），每条包含版本号、时间和变更摘要
- **FR-024**: 版本历史面板 MUST 支持选择任意版本进行回溯
- **FR-025**: 版本历史面板 MUST 支持选择两个版本进行 diff 对比

**页面布局**

- **FR-026**: 剧本编辑器页面 MUST 包含顶部工具栏、左侧场景导航、中间编辑器、右侧面板（标签页切换：角色 / 伏笔 / 版本历史）
- **FR-027**: 工作台页面和大纲页面的 Agent 交互逻辑 MUST 提取为共享 hook

### Key Entities

- **AgentMessage**: Agent 聊天消息，需增加 `isError` 类型区分错误消息
- **ScriptContent**: 剧本结构化数据（episodes → scenes → beats），Slate 节点需可逆转换为此格式
- **ScriptVersion**: 版本快照，关联到手动保存操作

## Success Criteria

### Measurable Outcomes

- **SC-001**: Agent 流式输出完成后，消息状态在 100ms 内从"输出中"变为"已完成"
- **SC-002**: 自动保存的内容与用户当前编辑内容 100% 一致（无回归到旧内容）
- **SC-003**: 所有已实现但未连接的按钮（EditorToolbar、OptimizePanel、onRefine、SceneNav onClick）在修复后全部可交互
- **SC-004**: 保存操作（自动或手动）失败时，用户在 5 秒内看到错误提示
- **SC-005**: 版本历史面板在 100 个版本以内时加载时间不超过 1 秒
- **SC-006**: 场景导航点击后，编辑器在 300ms 内滚动到目标场景位置

## Assumptions

- 后端 API 契约不变，前端修复仅影响前端代码
- 002-spec 中定义的所有技术栈保持不变
- 版本历史功能使用已有的 `versions.ts` API，不新增后端接口
- `slateToScript` 转换函数需新增，但仅在前端实现，不涉及后端改动
- WebSocket 通信协议以当前后端实现为准（纯 WebSocket，非 STOMP）
