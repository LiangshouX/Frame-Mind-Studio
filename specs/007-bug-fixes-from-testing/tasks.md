# Tasks: 测试报告问题修复

**Input**: Design documents from `/specs/007-bug-fixes-from-testing/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: WebSocket 连接修复 (P0) 🎯 MVP

**Goal**: 恢复 Agent 面板的实时通信能力

**Independent Test**: 启动后端后，打开 ScriptMind 页面，Agent 面板 5 秒内显示"已连接"

### Implementation for US1 - WebSocket 实时连接

- [x] T001 [US1] 检查 `frontend/src/components/shared/agent-chat/index.tsx` 中 WebSocket 连接逻辑，定位连接失败原因
- [x] T002 [US1] 检查 `frontend/src/lib/websocket.ts` 是否存在，如不存在则创建 WebSocket 管理模块
- [x] T003 [US1] 在 `frontend/src/lib/websocket.ts` 中实现指数退避重连机制（最多 5 次，间隔 1s/2s/4s/8s/16s）
- [x] T004 [US1] 在 `frontend/src/components/shared/agent-chat/index.tsx` 中添加连接状态 UI：未连接时显示红色"未连接"状态 + 手动重试按钮
- [x] T005 [US1] 在 `frontend/src/components/shared/agent-chat/index.tsx` 中实现 Token 计数器更新逻辑（AI 回复完成后更新）
- [x] T006 [US1] 添加 WebSocket 连接状态到 Zustand store（如不存在则创建）

**Checkpoint**: Agent 面板可自动连接后端 WebSocket，断开后自动重连

---

## Phase 2: 剧本编辑器 Tab 布局修复 (P0)

**Goal**: 修复"质量评估" Tab 截断问题

**Independent Test**: 打开 ScriptMind 步骤5，截图检查四个 Tab 横向排列、文字完整

### Implementation for US2 - Tab 布局修复

- [x] T007 [P] [US2] 检查 `frontend/src/components/scriptmind/script-editor/toolbar.tsx` 中 Tab 栏容器的 flex 布局配置
- [x] T008 [P] [US2] 修改 Tab 栏样式：确保 `flex-wrap: nowrap` + `overflow-x: auto`
- [x] T009 [P] [US2] 调整 Tab 最小宽度（min-width: 80px），确保"质量评估"文字完整显示
- [x] T010 [US2] 验证四个 Tab（剧本内容、角色、场景/布景、质量评估）均可正常点击切换

**Checkpoint**: 四个 Tab 横向排列、文字完整、可正常切换

---

## Phase 3: 移动端步骤导航修复 (P0)

**Goal**: 移动端步骤名称可见

**Independent Test**: 375px 视口下步骤名称完整显示

### Implementation for US3 - 移动端导航

- [x] T011 [P] [US3] 检查 `frontend/src/components/scriptmind/workflow-tabs/index.tsx` 中响应式断点配置
- [x] T012 [P] [US3] 为 375px 宽度添加紧凑布局样式：步骤编号+简短名称横向排列
- [x] T013 [P] [US3] 极窄屏幕（< 320px）下启用 `overflow-x: auto` 横向滚动
- [x] T014 [US3] 验证 375px 和 320px 视口下步骤导航正常显示

**Checkpoint**: 移动端步骤导航可识别，用户清楚知道自己在哪个步骤

---

## Phase 4: 项目详情页入口 + 侧边栏 (P1)

**Goal**: 添加 ScriptMind 入口按钮，禁用未实现模块

**Independent Test**: 项目详情页存在明显入口按钮

### Implementation for US4 - ScriptMind 入口

- [x] T015 [P] [US4] 在 `frontend/src/app/projects/[id]/page.tsx` 页面中央区域添加"开始创作"按钮
- [x] T016 [P] [US4] 按钮链接到 `/projects/${projectId}/scriptmind`
- [x] T017 [US4] 侧边栏"分镜"、"风格"、"动态"、"配音"按钮添加 `disabled` 样式（灰色 + cursor-not-allowed）
- [x] T018 [US4] hover 时显示 tooltip "即将推出"

**Checkpoint**: 用户从项目详情页可一键进入 ScriptMind 工作流

---

## Phase 5: 保存操作 Toast 反馈 (P1)

**Goal**: 所有保存操作有成功/失败提示

**Independent Test**: 点击保存后出现对应颜色的 toast 提示

### Implementation for US5 - Toast 反馈

- [x] T019 [P] [US5] 检查项目中是否已有 Toast 组件（shadcn/ui toast 或自定义）
- [x] T020 [P] [US5] 如无 Toast 组件，在 `frontend/src/components/shared/` 下创建通用 Toast 组件（成功=绿色，失败=红色，3 秒自动消失）
- [x] T021 [US5] 在 `frontend/src/components/scriptmind/worldview-panel/index.tsx` 保存回调中添加 Toast 调用
- [x] T022 [US5] 在 `frontend/src/components/scriptmind/synopsis-panel/index.tsx` 保存回调中添加 Toast 调用
- [x] T023 [US5] 在 `frontend/src/components/scriptmind/outline-panel/index.tsx` 保存回调中添加 Toast 调用

**Checkpoint**: 所有保存操作均有 toast 反馈

---

## Phase 6: 设置页标签切换修复 (P1)

**Goal**: MCP Server、Tavily、其他工具标签正确切换

**Independent Test**: 点击设置页所有标签，内容区正确切换

### Implementation for US6 - 设置页标签

- [x] T024 [P] [US6] 检查 `frontend/src/components/settings/settings-tabs.tsx` 中标签切换逻辑
- [x] T025 [P] [US6] 确保每个标签（模型供应商、MCP Server、Tavily 搜索、其他工具）对应正确的面板组件
- [x] T026 [US6] 修复标签切换时内容不变化的问题
- [x] T027 [US6] 确保切换标签时保留未保存的表单数据

**Checkpoint**: 设置页所有标签可正常切换，内容正确显示

---

## Phase 7: API 路由统一 (P2)

**Goal**: 消除 404 错误

**Independent Test**: 控制台无 404 错误

### Implementation for US7 - API 路由

- [x] T028 [P] [US7] 全局搜索前端所有 `/api/projects` 调用
- [x] T029 [P] [US7] 确认 `/api/v1/projects` 是正确的路由前缀
- [x] T030 [US7] 将所有 `/api/projects` 替换为 `/api/v1/projects`（或统一为正确前缀）
- [x] T031 [US7] 检查后端路由配置，确保 `/api/projects` 和 `/api/v1/projects` 一致性

**Checkpoint**: 控制台无 404 错误

---

## Phase 8: 验证与清理

**Goal**: 全流程验证，确保所有修复生效

- [x] T032 启动后端服务，运行完整 E2E 测试脚本 `test_e2e.py`
- [x] T033 截图验证所有修复项（WebSocket、Tab 布局、移动端、Toast、设置页）
- [x] T034 清理临时测试文件（test_recon.py, test_deep.py, test_deep2.py, test_full_flow.py, test_e2e.py）
- [x] T035 更新 `test_report.md` 标记已修复项

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (WebSocket)**: 无依赖，可立即开始
- **Phase 2-3 (UI 修复)**: 无依赖，可并行执行
- **Phase 4 (入口)**: 无依赖，可并行执行
- **Phase 5 (Toast)**: 依赖 Phase 1（WebSocket 修复后保存功能才完整）
- **Phase 6 (设置页)**: 无依赖，可并行执行
- **Phase 7 (API 路由)**: 无依赖，可并行执行
- **Phase 8 (验证)**: 依赖所有前置 Phase 完成

### Parallel Opportunities

- Phase 1, 2, 3, 4, 6, 7 可全部并行执行（不同文件，无依赖）
- Phase 5 需等 Phase 1 完成后执行

### Execution Strategy

**推荐执行顺序**: Phase 1 → Phase 2+3+4+6+7（并行） → Phase 5 → Phase 8

**总任务数**: 35 个
**预计耗时**: 4-6 小时（单人）/ 2-3 小时（并行）
