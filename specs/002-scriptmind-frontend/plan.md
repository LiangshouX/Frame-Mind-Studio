# Implementation Plan: ScriptMind 前端重建

**Branch**: `002-scriptmind-frontend` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-scriptmind-frontend/spec.md`

## Summary

ScriptMind 前端重建是对 `frontend/` 目录的彻底清除与从零重建。基于 001-scriptmind-screenplay-factory 的完整 spec（API Contracts、Data Model），使用 Next.js 14 + shadcn/ui + Tailwind CSS + Zustand + Slate.js 技术栈，构建一个专业短剧创作工作台。

核心能力包括：首页与项目管理、Agent 交互面板（实时流式输出 + 人类审核）、专业剧本编辑器（6 种元素类型 + Tab 切换）、大纲查看器、角色管理面板、伏笔追踪面板、版本控制与历史回溯、质量评估仪表盘、文件/URL 导入、全局设置。

关键设计决策：
- **先清后建**：首先完全删除 `frontend/src/` 下所有现有代码，从空项目结构开始重建
- **API 契约不变**：前端完全遵循 001 spec 的 API Contracts，不做任何修改
- **领域驱动的组件架构**：每个功能域（scriptmind、shared、layout）为独立模块，共享 UI 基础组件
- **WebSocket 实时通信**：通过 STOMP/SockJS 连接接收 Agent 任务进度，支持自动重连
- **30 秒防抖自动保存**：编辑器内容防丢，手动保存触发版本快照

## Technical Context

**Language/Version**: TypeScript 5.3+, React 18.3+

**Primary Dependencies**: Next.js 14.2+, shadcn/ui, Tailwind CSS 3.4+, Zustand 5.0+, Slate.js 0.124+, lucide-react, class-variance-authority, clsx, tailwind-merge

**Storage**: 后端 PostgreSQL（前端不直接访问），前端使用 localStorage 保存草稿和用户偏好

**Testing**: Jest + React Testing Library（单元/组件测试），Playwright（E2E 测试）

**Target Platform**: Web 应用，支持 Chrome/Firefox/Safari/Edge 最新两个版本，移动端（375px+）可用

**Project Type**: Web application (frontend only, 后端由 001 spec 覆盖)

**Performance Goals**: 页面加载 <2s, 编辑器交互 <50ms, Agent 流式输出延迟 <500ms, 版本历史加载 <1s, 质量指标更新 <3s

**Constraints**: 单用户本地部署, 无认证机制, 中文界面, 现有代码完全清除重建

**Scale/Scope**: 单用户, 50 个项目, 100 集/项目, 100 版本历史, 6 种编辑器元素类型

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 文件为模板状态（未填写具体原则），无实质性约束。跳过门控检查。

## Project Structure

### Documentation (this feature)

```text
specs/002-scriptmind-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── frontend-api-client.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

前端采用**领域驱动的模块化架构**，按功能域组织代码，共享 UI 基础设施层。

```text
frontend/                                  # Next.js 14 App Router（完全重建）
├── src/
│   ├── app/                               # Next.js App Router 页面
│   │   ├── layout.tsx                     # 全局布局（字体、CSS 变量、全局 provider）
│   │   ├── page.tsx                       # 首页/Dashboard
│   │   ├── globals.css                    # 全局样式（CSS 变量、字体、基础样式）
│   │   ├── error.tsx                      # 全局错误边界
│   │   ├── not-found.tsx                  # 404 页面
│   │   ├── projects/                      # 项目管理
│   │   │   ├── page.tsx                   # 项目列表页
│   │   │   ├── new/                       # 新建项目
│   │   │   │   └── page.tsx
│   │   │   └── [id]/                      # 项目详情/工作台
│   │   │       ├── layout.tsx             # 项目布局（导航栏 + 内容区）
│   │   │       ├── page.tsx               # 项目工作台主页
│   │   │       └── scriptmind/            # ScriptMind 模块页面
│   │   │           ├── page.tsx           # 剧本编辑器
│   │   │           ├── outline/           # 大纲生成
│   │   │           │   └── page.tsx
│   │   │           └── import/            # 文件/URL 导入
│   │   │               └── page.tsx
│   │   └── settings/                      # 全局设置
│   │       └── page.tsx
│   │
│   ├── components/                        # 组件库
│   │   ├── ui/                            # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── separator.tsx
│   │   │   └── skeleton.tsx
│   │   ├── layout/                        # 布局组件
│   │   │   ├── navbar.tsx                 # 全局导航栏（含 Agent 进度指示器）
│   │   │   ├── sidebar.tsx                # 侧边栏
│   │   │   ├── error-boundary.tsx         # 错误边界
│   │   │   ├── loading.tsx                # 加载状态
│   │   │   ├── empty-state.tsx            # 空状态引导
│   │   │   └── backend-offline.tsx        # 后端不可用全屏页
│   │   ├── shared/                        # 跨模块共享组件
│   │   │   ├── agent-chat/                # Agent 交互面板
│   │   │   │   ├── index.tsx              # 面板主组件
│   │   │   │   ├── message-list.tsx       # 消息列表（流式输出）
│   │   │   │   ├── stage-indicator.tsx    # Agent 阶段指示器
│   │   │   │   ├── input-bar.tsx          # 输入栏
│   │   │   │   ├── review-panel.tsx       # 人类审核面板
│   │   │   │   └── budget-warning.tsx     # 预算警告
│   │   │   ├── quality-dashboard/         # 质量仪表盘
│   │   │   │   ├── index.tsx
│   │   │   │   ├── metric-card.tsx        # 单项指标卡片
│   │   │   │   └── score-ring.tsx         # 总分环形图
│   │   │   ├── version-history/           # 版本历史
│   │   │   │   ├── index.tsx
│   │   │   │   └── diff-viewer.tsx        # Diff 对比查看器
│   │   │   └── pipeline-nav/              # Pipeline 阶段导航
│   │   │       └── index.tsx
│   │   └── scriptmind/                    # ScriptMind 专属组件
│   │       ├── script-editor/             # 剧本编辑器组件
│   │       │   ├── index.tsx              # 编辑器主组件
│   │       │   ├── editor-element.tsx     # 自定义 Slate Element 渲染
│   │       │   ├── toolbar.tsx            # 编辑器工具栏
│   │       │   └── optimize.tsx           # AI 优化建议面板
│   │       ├── outline-viewer/            # 大纲查看器
│   │       │   └── index.tsx
│   │       ├── character-panel/           # 角色面板
│   │       │   └── index.tsx
│   │       ├── foreshadow-tracker/        # 伏笔追踪面板
│   │       │   └── index.tsx
│   │       ├── scene-nav/                 # 场景导航侧边栏
│   │       │   └── index.tsx
│   │       └── style-preset-picker/       # 风格预设选择器
│   │           └── index.tsx
│   │
│   ├── hooks/                             # 自定义 Hooks
│   │   ├── shared/
│   │   │   ├── use-agent-session.ts       # Agent 会话管理
│   │   │   ├── use-websocket.ts           # WebSocket 连接（含自动重连）
│   │   │   └── use-version-history.ts     # 版本历史
│   │   └── scriptmind/
│   │       ├── use-script-editor.ts       # 编辑器状态管理
│   │       └── use-quality-metrics.ts     # 质量指标
│   │
│   ├── stores/                            # Zustand 状态管理
│   │   ├── project-store.ts               # 项目列表状态
│   │   ├── agent-store.ts                 # Agent 会话状态
│   │   ├── editor-store.ts                # 编辑器状态
│   │   └── settings-store.ts              # 设置状态
│   │
│   ├── lib/                               # 工具库
│   │   ├── api/                           # API 客户端
│   │   │   ├── client.ts                  # fetch 封装（错误处理、超时、重试）
│   │   │   ├── projects.ts                # 项目 API
│   │   │   ├── scripts.ts                 # 剧本 API
│   │   │   ├── agent.ts                   # Agent API
│   │   │   ├── characters.ts              # 角色 API
│   │   │   ├── foreshadows.ts             # 伏笔 API
│   │   │   ├── versions.ts                # 版本 API
│   │   │   ├── quality.ts                 # 质量评估 API
│   │   │   └── settings.ts                # 设置 API
│   │   ├── utils/
│   │   │   ├── cn.ts                      # className 合并工具
│   │   │   ├── debounce.ts                # 防抖工具
│   │   │   └── format.ts                  # 格式化工具（日期、字数等）
│   │   └── websocket/
│   │       └── stomp-client.ts            # STOMP WebSocket 客户端封装
│   │
│   ├── types/                             # TypeScript 类型定义
│   │   ├── index.ts                       # 类型导出入口
│   │   ├── project.ts                     # 项目类型
│   │   ├── script.ts                      # 剧本类型（ScriptContent、Episode、Scene、Beat）
│   │   ├── character.ts                   # 角色类型
│   │   ├── foreshadow.ts                  # 伏笔类型
│   │   ├── agent.ts                       # Agent 类型（Session、Message、Stage）
│   │   ├── version.ts                     # 版本类型
│   │   ├── quality.ts                     # 质量指标类型
│   │   └── api.ts                         # API 响应通用类型
│   │
│   └── constants/                         # 常量定义
│       ├── element-types.ts               # 编辑器元素类型常量
│       ├── agent-stages.ts                # Agent 阶段常量
│       └── style-presets.ts               # 风格预设常量
│
├── public/                                # 静态资源
│   └── fonts/                             # 自定义字体
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── postcss.config.js
└── Dockerfile
```

**Structure Decision**: 采用**领域驱动的模块化前端架构**。

- **`app/`**：Next.js App Router 页面，按功能域组织路由。每个页面是独立的 Server Component，复杂交互部分提取为 Client Component。
- **`components/ui/`**：shadcn/ui 基础组件层，所有业务组件基于此构建。新增组件遵循 shadcn/ui 的变体模式（class-variance-authority）。
- **`components/layout/`**：全局布局组件，包括导航栏（含 Agent 进度指示器）、错误边界、后端离线页等。
- **`components/shared/`**：跨模块共享的业务组件（Agent 交互面板、质量仪表盘、版本历史），可在多个页面复用。
- **`components/scriptmind/`**：ScriptMind 模块专属组件（剧本编辑器、大纲查看器、角色面板等），高内聚、独立于其他模块。
- **`hooks/`**：自定义 Hooks，分为共享 hooks（WebSocket、Agent 会话）和 ScriptMind 专属 hooks（编辑器、质量指标）。
- **`stores/`**：Zustand 状态管理，每个关注点一个 store，支持持久化（localStorage）。
- **`lib/api/`**：API 客户端层，每个业务域一个模块，统一错误处理和超时重试。
- **`types/`**：TypeScript 类型定义，与后端 Data Model 对齐。

**扩展性**：新增 StoryboardAI 模块时，只需在 `app/projects/[id]/storyboard/` 添加页面，在 `components/storyboard/` 添加专属组件，无需改动现有代码。
