# Tasks: ScriptMind 前端功能细化

**Input**: Design documents from `/specs/003-scriptmind-frontend-refinements/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

---

## Phase 1: Agent 交互闭环修复 (US1 — P1) 🎯 MVP

**Goal**: Agent 聊天体验完整可用 — 流式消息正确结束、自动滚动、错误显示

**Independent Test**: 输入梗概 → 流式输出 → 完成后"输出中..."消失 → 消息自动滚动 → API 失败时显示错误

### Implementation

- [X] T001 [US1] 在 `frontend/src/stores/agent-store.ts` 中新增 `finishStreaming` action：遍历 `messages` 数组，将所有 `isStreaming: true` 的消息设为 `isStreaming: false`
- [X] T002 [US1] 在 `frontend/src/hooks/shared/use-websocket.ts` 的 `complete` case 中调用 `store.finishStreaming()`，替换原有的 `// mark all streaming messages as done` 注释
- [X] T003 [US1] 在 `frontend/src/hooks/shared/use-websocket.ts` 的 `error` case 中调用 `store.addMessage()` 添加一条 `role: 'error'` 的系统错误消息，内容为 WebSocket 接收到的错误文本
- [X] T004 [US1] 在 `frontend/src/components/shared/agent-chat/message-list.tsx` 中添加 `useRef` 引用滚动容器和底部哨兵元素，通过 `useEffect` 监听 `messages` 变化自动滚动到底部
- [X] T005 [US1] 在 `frontend/src/components/shared/agent-chat/input-bar.tsx` 的 `onSubmit` 中添加空输入校验：`trim()` 后为空则不发送

**Checkpoint**: Agent 聊天交互闭环完成 — 流式输出、自动滚动、错误显示均可用

---

## Phase 2: 大纲→剧本细化流程 (US2 — P1)

**Goal**: 点击"细化为剧本"能正常触发 Agent 任务

**Independent Test**: 大纲已生成 → 点击"细化为剧本" → Agent 面板启动生成任务 → 阶段进度显示

**Depends on**: Phase 1 (Agent 交互修复)

### Implementation

- [X] T006 [US2] 在 `frontend/src/app/projects/[id]/page.tsx` 中定义 `handleRefine` 回调，调用 `agent.startRefineScript(outlineContent)`，传递给 `<OutlineViewer onRefine={handleRefine} />`
- [X] T007 [US2] 在 `frontend/src/components/scriptmind/outline-viewer/index.tsx` 中添加 loading 状态（骨架屏）和 error 状态（错误提示 + 重试按钮），处理 `content` 为 null/undefined 的情况

**Checkpoint**: 大纲→剧本细化流程打通

---

## Phase 3: 编辑器工具栏与自动保存修复 (US3 — P1)

**Goal**: 编辑器页面显示工具栏，自动保存正确读取当前内容，Ctrl+S 触发保存

**Independent Test**: 编辑器输入内容 → 工具栏显示元素类型 → 按 Ctrl+S 保存 → 刷新后内容保留

### Implementation

- [X] T008 [US3] 在 `frontend/src/components/scriptmind/script-editor/index.tsx` 中实现 `slateToScript` 函数：遍历 `editor.children`，根据节点类型（`scene_heading`/`action`/`character`/`dialogue`/`parenthetical`/`transition`）重建 `ScriptContent` 层级结构（episodes → scenes → beats）
- [X] T009 [US3] 在 `frontend/src/components/scriptmind/script-editor/index.tsx` 中修复 `autoSave`：使用 `useRef` 持有 editor 实例引用，debounce 回调中通过 `editorRef.current.children` 和 `slateToScript` 获取当前内容后调用 `scriptsApi.updateScript`
- [X] T010 [US3] 在 `frontend/src/components/scriptmind/script-editor/index.tsx` 中修复 `Ctrl+S`：`handleKeyDown` 中拦截 Ctrl+S 后调用手动保存函数（非 autoSave），附带 `changeSummary` 参数
- [X] T011 [US3] 在 `frontend/src/stores/editor-store.ts` 中确保 `setSaving(true/false)` 在保存流程中被正确调用：保存开始时 `setSaving(true)`，成功/失败时 `setSaving(false)`
- [X] T012 [US3] 在 `frontend/src/app/projects/[id]/scriptmind/page.tsx` 中导入 `EditorToolbar` 组件，渲染在编辑器上方，传递 `onSave` prop（调用 `scriptsApi.updateScript`）

**Checkpoint**: 编辑器工具栏可见，自动保存和手动保存均正确工作

---

## Phase 4: 按钮连接与交互修复 (US4/US5 — P2)

**Goal**: SceneNav 点击滚动、OptimizePanel 可访问

**Independent Test**: 点击场景 → 编辑器滚动 → 选中文本 → AI 优化面板展开

**Depends on**: Phase 3 (编辑器工具栏)

### Implementation

- [X] T013 [P] [US5] 在 `frontend/src/components/scriptmind/scene-nav/index.tsx` 中添加 `onSceneClick: (sceneId: string) => void` prop，绑定到每个场景按钮的 `onClick`
- [X] T014 [US5] 在 `frontend/src/app/projects/[id]/scriptmind/page.tsx` 中传递 `onSceneClick` 到 `SceneNav`，回调中通过 `document.querySelector` 或 Slate API 滚动到目标场景元素
- [X] T015 [US5] 在 `frontend/src/app/projects/[id]/scriptmind/page.tsx` 中集成 `OptimizePanel`：添加 `showOptimize` 状态，工具栏"AI 优化"按钮切换该状态，传递 `selectedText` 和 `onApply` 回调
- [X] T016 [P] [US5] 在 `frontend/src/components/scriptmind/script-editor/optimize.tsx` 中将 `element_type` 改为从 prop 传入（新增 `elementType` prop），替换硬编码的 `'dialogue'`

**Checkpoint**: 所有已实现的按钮和交互正确工作

---

## Phase 5: 版本历史面板 (US6 — P2)

**Goal**: 右侧面板新增版本历史标签页，支持列表、回溯、diff

**Independent Test**: 手动保存 → 版本历史显示 → 选择版本回溯 → 选择两版本对比

**Depends on**: Phase 3 (编辑器保存)

### Implementation

- [X] T017 [US6] 新建 `frontend/src/components/shared/version-history/index.tsx`：版本历史面板组件，调用 `versionsApi.listVersions` 显示版本列表，支持选择版本回溯（`restoreVersion`）和两版本 diff 对比（`compareVersions`）
- [X] T018 [US6] 在 `frontend/src/app/projects/[id]/scriptmind/page.tsx` 中将右侧面板改为标签页切换：使用 `useState<'characters' | 'foreshadows' | 'versions'>` 管理当前标签，条件渲染 `CharacterPanel` / `ForeshadowTracker` / `VersionHistory`
- [X] T019 [US6] 在 `frontend/src/components/scriptmind/script-editor/index.tsx` 中确保手动保存时调用 `scriptsApi.updateScript` 附带 `changeSummary` 参数（用户输入或自动生成的变更摘要）

**Checkpoint**: 版本历史面板可用，手动保存创建版本快照

---

## Phase 6: 代码去重 (US8 — P3)

**Goal**: 工作台和大纲页面共享 Agent 交互逻辑

**Independent Test**: 两个页面的 Agent 交互行为完全一致

### Implementation

- [X] T020 [P] [US8] 新建 `frontend/src/hooks/shared/use-agent-workbench.ts`：封装 `useAgentSession` 的结果加上 `handleSend`、`handleApprove`、`handleRevise`、`handleRefine` 回调逻辑
- [X] T021 [US8] 在 `frontend/src/app/projects/[id]/page.tsx` 中重构使用 `useAgentWorkbench` hook，移除重复的回调定义
- [X] T022 [US8] 在 `frontend/src/app/projects/[id]/scriptmind/outline/page.tsx` 中重构使用 `useAgentWorkbench` hook，移除重复的回调定义

**Checkpoint**: 代码去重完成，两个页面行为一致

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (US1: Agent) ──→ Phase 2 (US2: Outline)
                       ├──→ Phase 3 (US3: Editor) ──→ Phase 4 (US5: Buttons)
                                                     ──→ Phase 5 (US6: Versions)
                       Phase 6 (US8: Dedup) — independent
```

- Phase 1 无依赖，立即开始
- Phase 2 依赖 Phase 1（Agent 交互修复后才能测试细化流程）
- Phase 3 无强依赖，可与 Phase 1 并行
- Phase 4 依赖 Phase 3（需要工具栏集成后才能连接按钮）
- Phase 5 依赖 Phase 3（需要保存功能正确后才能创建版本）
- Phase 6 独立，可随时进行

### Parallel Opportunities

- T001, T002, T004, T005 可并行（不同文件）
- T008, T009, T010 可并行（同一文件的不同函数，但建议顺序执行）
- T013, T016 可并行（不同文件）
- T020 独立于其他任务

---

## Implementation Strategy

### MVP First (Phase 1 Only)

1. Complete Phase 1: Agent 交互闭环修复
2. **STOP and VALIDATE**: Agent 聊天交互完整可用
3. 可作为独立 demo 展示

### Incremental Delivery

1. Phase 1 → Agent 聊天可用（MVP）
2. Phase 2 → 大纲→剧本流程打通
3. Phase 3 → 编辑器保存正确
4. Phase 4+5 → 按钮和版本历史
5. Phase 6 → 代码清理

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each phase is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
