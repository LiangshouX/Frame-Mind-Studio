# Implementation Plan: 测试报告问题修复

**Branch**: `007-bug-fixes-from-testing` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-bug-fixes-from-testing/spec.md`

## Summary

根据全流程测试报告（test_report.md）发现的 13 个问题，系统性修复前端 UI 布局破损、WebSocket 连接失败、设置页标签切换异常、API 路由不一致等问题。核心目标是恢复 AI Agent 实时对话能力并修复所有阻断性 UI 缺陷。

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 (App Router)

**Primary Dependencies**: Tailwind CSS, Zustand, Slate (富文本编辑器), shadcn/ui (Radix + CVA)

**Storage**: PostgreSQL (后端), 客户端状态 Zustand

**Testing**: Playwright (E2E), 手动验证

**Target Platform**: Web (Chrome/Firefox/Safari), 响应式 (375px+)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: WebSocket 连接 < 5s, AI 回复首字 < 3s

**Constraints**: 后端服务需已启动; 不修改后端代码; 仅前端修复

**Scale/Scope**: 13 个 bug 修复, 涉及 ~10 个前端组件文件

## Constitution Check

- [x] 所有代码注释使用中文
- [x] Java 代码使用 Javadoc 格式（本次不涉及 Java 修改）

## Project Structure

### Source Code (relevant files)

```text
frontend/src/
├── app/
│   ├── projects/[id]/
│   │   ├── page.tsx                    # 项目详情页 - 添加 ScriptMind 入口
│   │   └── scriptmind/page.tsx         # ScriptMind 主页面
│   └── settings/page.tsx               # 设置页 - 修复标签切换
├── components/
│   ├── scriptmind/
│   │   ├── workflow-tabs/index.tsx     # 步骤导航条 - 修复移动端
│   │   ├── script-editor/index.tsx     # 剧本编辑器 - 修复 Tab 布局
│   │   └── worldview-panel/index.tsx   # 世界观面板 - 添加保存反馈
│   ├── shared/
│   │   └── agent-chat/index.tsx        # Agent 聊天面板 - 修复 WebSocket
│   └── settings/
│       └── settings-tabs.tsx           # 设置标签页 - 修复切换逻辑
└── lib/
    └── websocket.ts                    # WebSocket 管理 - 添加重连逻辑
```

## Implementation Phases

### Phase 1: WebSocket 连接修复 (P0)

**目标**: 恢复 Agent 面板的实时通信能力

**涉及文件**:
- `frontend/src/components/shared/agent-chat/index.tsx`
- `frontend/src/lib/websocket.ts` (如不存在则创建)

**任务**:
1. 检查当前 WebSocket 连接逻辑，定位连接失败原因
2. 实现指数退避重连机制（最多 5 次）
3. 添加连接状态 UI：未连接时显示重试按钮
4. 实现 Token 计数器更新逻辑

**验证标准**: 后端启动后，Agent 面板 5 秒内显示"已连接"

---

### Phase 2: 剧本编辑器 Tab 布局修复 (P0)

**目标**: 修复"质量评估" Tab 截断问题

**涉及文件**:
- `frontend/src/components/scriptmind/script-editor/index.tsx`
- `frontend/src/components/scriptmind/script-editor/toolbar.tsx`

**任务**:
1. 定位 Tab 栏容器，检查 flex 布局配置
2. 确保 Tab 栏使用 `flex-wrap: nowrap` 或 `overflow-x: auto`
3. 调整 Tab 最小宽度，确保"质量评估"文字完整显示
4. 验证四个 Tab 均可正常点击切换

**验证标准**: 截图检查四个 Tab 横向排列、文字完整

---

### Phase 3: 移动端步骤导航修复 (P0)

**目标**: 移动端步骤名称可见

**涉及文件**:
- `frontend/src/components/scriptmind/workflow-tabs/index.tsx`

**任务**:
1. 检查当前步骤导航的响应式断点
2. 为 375px 宽度添加紧凑布局样式
3. 极窄屏幕（< 320px）下启用横向滚动
4. 确保步骤编号+名称均可见

**验证标准**: 375px 视口下步骤名称完整显示

---

### Phase 4: 项目详情页入口 + 侧边栏 (P1)

**目标**: 添加 ScriptMind 入口按钮，禁用未实现模块

**涉及文件**:
- `frontend/src/app/projects/[id]/page.tsx`

**任务**:
1. 在页面中央区域添加"开始创作"按钮，链接到 `/projects/[id]/scriptmind`
2. 侧边栏"分镜"、"风格"、"动态"、"配音"按钮添加 `disabled` 样式
3. hover 时显示 tooltip "即将推出"

**验证标准**: 项目详情页存在明显入口按钮

---

### Phase 5: 保存操作 Toast 反馈 (P1)

**目标**: 所有保存操作有成功/失败提示

**涉及文件**:
- `frontend/src/components/scriptmind/worldview-panel/index.tsx`
- `frontend/src/components/scriptmind/synopsis-panel/index.tsx`
- `frontend/src/components/scriptmind/outline-panel/index.tsx`
- 可能需要创建通用 Toast 组件

**任务**:
1. 检查是否已有 Toast 组件，如无则创建
2. 在世界观、梗概、大纲的保存按钮回调中添加 Toast 调用
3. 成功=绿色 toast，失败=红色 toast，3 秒自动消失

**验证标准**: 点击保存后出现对应颜色的 toast 提示

---

### Phase 6: 设置页标签切换修复 (P1)

**目标**: MCP Server、Tavily、其他工具标签正确切换

**涉及文件**:
- `frontend/src/components/settings/settings-tabs.tsx`
- `frontend/src/app/settings/page.tsx`

**任务**:
1. 检查标签切换逻辑，定位内容不切换的原因
2. 确保每个标签对应正确的面板组件
3. 切换时保留未保存的表单数据

**验证标准**: 点击各标签内容区正确切换

---

### Phase 7: API 路由统一 (P2)

**目标**: 消除 404 错误

**涉及文件**:
- 前端 API 调用处（需全局搜索 `/api/projects`）
- 后端路由配置（如需调整）

**任务**:
1. 搜索前端所有 `/api/projects` 调用
2. 统一替换为 `/api/v1/projects` 或确认正确前缀
3. 检查后端路由配置，确保一致性

**验证标准**: 控制台无 404 错误

---

## Risk Assessment

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| WebSocket 修复依赖后端服务 | 高 | 先确认后端 WebSocket 端点是否正常 |
| Toast 组件可能与现有 UI 库冲突 | 中 | 优先检查是否已有 shadcn Toast |
| API 路由修改可能影响其他功能 | 中 | 全局搜索确认影响范围 |
| 移动端样式可能影响桌面端 | 低 | 使用媒体查询隔离 |

## Success Criteria Verification

| SC | 验证方法 |
|----|----------|
| SC-001 | 启动后端，打开 ScriptMind，观察连接状态 |
| SC-002 | 发送消息，计时首字回复时间 |
| SC-003 | 375px 视口截图检查步骤导航 |
| SC-004 | 点击所有保存按钮，检查 toast |
| SC-005 | 点击设置页所有标签，检查内容切换 |
| SC-006 | 打开控制台，检查 404 错误数 |
| SC-007 | 从项目列表到 ScriptMind 计步 |
