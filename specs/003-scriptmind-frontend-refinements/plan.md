# Implementation Plan: ScriptMind 前端功能细化

**Branch**: `003-scriptmind-frontend-refinements` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-scriptmind-frontend-refinements/spec.md`

## Summary

基于 002-scriptmind-frontend 已完成的代码框架，针对 4 个核心功能域的缺陷进行修复和连接：Agent 聊天交互闭环、大纲→剧本的细化流程、剧本编辑器工具栏与自动保存、版本历史面板。

核心修复：
- **Agent 交互**：流式消息结束标记、自动滚动、错误显示、消息持久化
- **大纲细化**：连接 `onRefine` 按钮到 `refineScript` API
- **编辑器保存**：实现 `slateToScript` 反向转换、修复自动保存读取 stale props 的 bug、集成 EditorToolbar
- **版本历史**：新建右侧面板标签页，连接已有的 versions API

## Technical Context

**Language/Version**: TypeScript 5.3+, React 18.3+

**Primary Dependencies**: Next.js 14.2+, shadcn/ui, Tailwind CSS 3.4+, Zustand 5.0+, Slate.js 0.124+, lucide-react

**Storage**: 后端 PostgreSQL（前端不直接访问），前端使用 localStorage 保存草稿

**Testing**: Jest + React Testing Library

**Target Platform**: Web 应用，Chrome/Firefox/Safari/Edge 最新两个版本

**Project Type**: Web application (frontend only)

**Performance Goals**: 流式消息状态切换 <100ms, 场景导航滚动 <300ms, 版本历史加载 <1s

**Constraints**: 仅前端改动，后端 API 契约不变

**Scale/Scope**: 修改约 10 个现有文件，新增 2-3 个组件文件

## Constitution Check

Constitution 文件为模板状态（未填写具体原则），无实质性约束。

## Project Structure

### Documentation (this feature)

```text
specs/003-scriptmind-frontend-refinements/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── checklists/
    └── requirements.md
```

### Files to Modify (by priority)

**P1 — Critical Bug Fixes & Missing Connections:**

```text
frontend/src/
├── stores/
│   └── agent-store.ts                    # Add finishStreaming action
├── hooks/shared/
│   └── use-websocket.ts                  # Call finishStreaming on complete, add error message
├── components/shared/agent-chat/
│   ├── message-list.tsx                  # Add auto-scroll
│   └── input-bar.tsx                     # Add empty-input validation
├── components/scriptmind/script-editor/
│   └── index.tsx                         # Fix auto-save, add slateToScript, wire Ctrl+S
├── app/projects/[id]/
│   ├── page.tsx                          # Pass onRefine to OutlineViewer
│   └── scriptmind/
│       └── page.tsx                      # Add EditorToolbar, OptimizePanel, save wiring
```

**P2 — Feature Connections & New Components:**

```text
frontend/src/
├── components/scriptmind/
│   ├── outline-viewer/index.tsx          # Add loading/error states
│   └── scene-nav/index.tsx               # Add onSceneClick prop
├── components/shared/
│   └── version-history/                  # New: version history panel component
│       └── index.tsx
└── app/projects/[id]/scriptmind/
    └── page.tsx                          # Add right sidebar tabs (characters/foreshadows/versions)
```

**P3 — Code Deduplication:**

```text
frontend/src/
├── hooks/shared/
│   └── use-agent-workbench.ts            # New: shared hook for workbench + outline pages
└── app/projects/[id]/
    └── page.tsx                          # Refactor to use shared hook
```

## Implementation Phases

### Phase 1: Agent 交互闭环修复 (P1)

**Goal**: Agent 聊天体验完整可用

| Task | File | Change |
|:---|:---|:---|
| 1.1 | `stores/agent-store.ts` | 新增 `finishStreaming` action: 遍历 messages 设置 `isStreaming: false` |
| 1.2 | `hooks/shared/use-websocket.ts` | `complete` case 中调用 `finishStreaming()`；`error` case 中调用 `addMessage` 添加错误消息 |
| 1.3 | `components/shared/agent-chat/message-list.tsx` | 添加 `useRef` + `useEffect` 实现自动滚动到最新消息 |
| 1.4 | `components/shared/agent-chat/input-bar.tsx` | 发送时空输入校验（trim 后为空则不发送） |

### Phase 2: 大纲→剧本细化流程 (P1)

**Goal**: 点击"细化为剧本"能正常触发 Agent 任务

| Task | File | Change |
|:---|:---|:---|
| 2.1 | `app/projects/[id]/page.tsx` | 定义 `handleRefine` 回调（调用 `agent.startRefineScript`），传递给 `OutlineViewer` 的 `onRefine` prop |
| 2.2 | `components/scriptmind/outline-viewer/index.tsx` | 添加 loading/error 状态处理 |

### Phase 3: 编辑器工具栏与自动保存修复 (P1)

**Goal**: 编辑器页面显示工具栏，自动保存正确读取当前内容

| Task | File | Change |
|:---|:---|:---|
| 3.1 | `components/scriptmind/script-editor/index.tsx` | 实现 `slateToScript` 函数：将 Slate 节点反向转换为 `ScriptContent` 格式 |
| 3.2 | `components/scriptmind/script-editor/index.tsx` | 修复 `autoSave`：读取 `editor.children` 通过 `slateToScript` 转换后保存 |
| 3.3 | `components/scriptmind/script-editor/index.tsx` | 修复 `Ctrl+S`：触发实际保存（手动保存，附带 `changeSummary`） |
| 3.4 | `app/projects/[id]/scriptmind/page.tsx` | 导入并渲染 `EditorToolbar`，传递 `onSave` prop |
| 3.5 | `stores/editor-store.ts` | 确保 `setSaving` action 在保存流程中被正确调用 |

### Phase 4: 按钮连接与交互修复 (P2)

**Goal**: 所有已实现的按钮和交互正确工作

| Task | File | Change |
|:---|:---|:---|
| 4.1 | `components/scriptmind/scene-nav/index.tsx` | 添加 `onSceneClick` prop，绑定到每个场景按钮的 `onClick` |
| 4.2 | `app/projects/[id]/scriptmind/page.tsx` | 传递 `onSceneClick` 到 `SceneNav`，实现编辑器滚动到目标场景 |
| 4.3 | `app/projects/[id]/scriptmind/page.tsx` | 集成 `OptimizePanel`，通过工具栏"AI 优化"按钮触发 |
| 4.4 | `components/scriptmind/script-editor/optimize.tsx` | `element_type` 改为从外部传入而非硬编码 |

### Phase 5: 版本历史面板 (P2)

**Goal**: 右侧面板新增版本历史标签页

| Task | File | Change |
|:---|:---|:---|
| 5.1 | `components/shared/version-history/index.tsx` | 新建版本历史面板组件（列表、回溯、diff 对比） |
| 5.2 | `app/projects/[id]/scriptmind/page.tsx` | 右侧面板改为标签页切换（角色 / 伏笔 / 版本历史） |
| 5.3 | `components/scriptmind/script-editor/index.tsx` | 手动保存时调用 `updateScript` 附带 `changeSummary` 参数 |

### Phase 6: 代码去重 (P3)

**Goal**: 工作台和大纲页面共享 Agent 交互逻辑

| Task | File | Change |
|:---|:---|:---|
| 6.1 | `hooks/shared/use-agent-workbench.ts` | 新建共享 hook，封装 `startOutlineGeneration`、`startRefineScript`、`submitReview` 和 `handleRefine` |
| 6.2 | `app/projects/[id]/page.tsx` | 重构使用共享 hook |
| 6.3 | `app/projects/[id]/scriptmind/outline/page.tsx` | 重构使用共享 hook |

## Dependencies

```text
Phase 1 (Agent) ──→ Phase 2 (Outline) ──→ Phase 4 (Buttons)
                  └──→ Phase 3 (Editor) ──→ Phase 5 (Versions)
                                            Phase 6 (Dedup) — independent
```

- Phase 1-3 为 P1，可并行启动但 Phase 2 依赖 Phase 1 的 Agent 交互修复
- Phase 4-5 为 P2，在 P1 完成后进行
- Phase 6 为 P3，独立于其他阶段

## Risks

| Risk | Mitigation |
|:---|:---|
| `slateToScript` 转换丢失结构信息 | 单元测试覆盖所有 6 种元素类型的往返转换 |
| 自动保存和手动保存并发冲突 | 手动保存时取消 pending 的自动保存 debounce |
| 版本历史 diff 渲染复杂 | 先实现简单文本 diff，后续可升级为结构化 diff |
