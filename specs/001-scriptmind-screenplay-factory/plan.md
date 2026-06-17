# Implementation Plan: ScriptMind 剧本工厂

**Branch**: `001-scriptmind-screenplay-factory` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-scriptmind-screenplay-factory/spec.md`

## Summary

ScriptMind 剧本工厂是灵镜创影的创作起点模块，负责将用户的创意想法（一句话梗概、大纲文本、小说文件、网页 URL）通过多 Agent 协作转化为结构化的标准剧本。核心能力包括：AI Agent 协作生成大纲（Showrunner → WorldBuilder → CharacterDesigner → ScriptDoctor）、专业剧本编辑器（6 种元素类型 + Tab 切换）、多集管理与伏笔追踪、版本控制与历史回溯、质量评估仪表盘、API 成本控制。

技术方案采用前后端分离架构：前端 Next.js 14 + shadcn/ui + Tailwind CSS，后端 FastAPI + LangChain/LangGraph Agent 编排，存储层 PostgreSQL（业务数据）+ ChromaDB（向量记忆），通过 Docker Compose 一键部署。初始版本为单用户本地部署，无认证机制。

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.3+ (frontend)

**Primary Dependencies**: FastAPI 0.110+, SQLAlchemy 2.0+, LangChain/LangGraph (DeepAgents), Next.js 14+, shadcn/ui, Tailwind CSS 3.4+, Zustand

**Storage**: PostgreSQL 16+ (业务数据), ChromaDB (向量记忆/项目记忆), Redis 7+ (会话缓存/任务队列), MinIO (资产文件存储)

**Testing**: pytest (backend), Jest + React Testing Library (frontend)

**Target Platform**: Docker Compose (本地部署), Linux containers

**Project Type**: Web application (frontend + backend)

**Performance Goals**: 大纲生成 <60s, 文件导入 <120s, 编辑器交互 <50ms, 版本回溯 <5s, 质量指标计算 <3s

**Constraints**: 单用户本地部署, 无认证机制, 用户自配 API Key, Docker 一键部署

**Scale/Scope**: 单用户, 8-100 集/项目, 50 万字文件上限, 100 版本历史

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 文件为模板状态（未填写具体原则），无实质性约束。跳过门控检查。

## Project Structure

### Documentation (this feature)

```text
specs/001-scriptmind-screenplay-factory/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-contracts.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

采用**领域驱动的模块化架构**，每个 Pipeline 阶段（ScriptMind、StoryboardAI、StyleForge 等）为独立模块，共享基础设施层。当前仅实现 ScriptMind 模块，其余模块以占位目录预留。

```text
frontend/                                  # Next.js 14 App Router
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # 全局布局
│   │   ├── page.tsx                       # 首页/Dashboard
│   │   ├── projects/                      # 项目管理（共享）
│   │   │   ├── page.tsx                   # 项目列表
│   │   │   ├── [projectId]/
│   │   │   │   ├── page.tsx               # 项目详情/工作台
│   │   │   │   ├── scriptmind/            # ScriptMind 模块页面
│   │   │   │   │   ├── page.tsx           # 剧本编辑器
│   │   │   │   │   ├── outline/           # 大纲生成
│   │   │   │   │   └── import/            # 文件/URL 导入
│   │   │   │   ├── storyboard/            # [预留] StoryboardAI
│   │   │   │   ├── styleforge/            # [预留] StyleForge
│   │   │   │   ├── motioncore/            # [预留] MotionCore
│   │   │   │   ├── voicestage/            # [预留] VoiceStage
│   │   │   │   └── export/                # [预留] Export
│   │   │   └── new/                       # 新建项目
│   │   ├── settings/                      # 全局设置（API Key 等）
│   │   └── api/                           # Next.js API routes (BFF)
│   ├── components/
│   │   ├── ui/                            # shadcn/ui 基础组件
│   │   ├── layout/                        # 布局组件（Sidebar, Header）
│   │   ├── shared/                        # 跨模块共享组件
│   │   │   ├── agent-chat/                # Agent 交互面板（通用）
│   │   │   ├── quality-dashboard/         # 质量仪表盘（通用）
│   │   │   ├── version-history/           # 版本历史（通用）
│   │   │   └── pipeline-nav/              # Pipeline 阶段导航
│   │   └── scriptmind/                    # ScriptMind 专属组件
│   │       ├── script-editor/             # 剧本编辑器组件
│   │       ├── outline-viewer/            # 大纲查看器
│   │       ├── character-panel/           # 角色面板
│   │       ├── foreshadow-tracker/        # 伏笔追踪面板
│   │       └── style-preset-picker/       # 风格预设选择器
│   ├── hooks/
│   │   ├── shared/                        # 通用 hooks
│   │   │   ├── useAgentSession.ts         # Agent 会话管理
│   │   │   ├── useWebSocket.ts            # WebSocket 连接
│   │   │   └── useVersionHistory.ts       # 版本历史
│   │   └── scriptmind/                    # ScriptMind 专属 hooks
│   │       ├── useScriptEditor.ts         # 编辑器状态
│   │       └── useQualityMetrics.ts       # 质量指标
│   ├── stores/
│   │   ├── project-store.ts               # 项目状态（Zustand）
│   │   ├── agent-store.ts                 # Agent 会话状态
│   │   └── settings-store.ts              # 设置状态
│   ├── lib/
│   │   ├── api/                           # API 客户端
│   │   │   ├── client.ts                  # fetch 封装
│   │   │   ├── projects.ts                # 项目 API
│   │   │   ├── scriptmind.ts              # ScriptMind API
│   │   │   └── settings.ts                # 设置 API
│   │   └── utils/                         # 工具函数
│   └── types/
│       ├── project.ts                     # 项目类型
│       ├── script.ts                      # 剧本类型
│       └── agent.ts                       # Agent 类型
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── Dockerfile

backend/                                   # FastAPI 后端
├── app/
│   ├── main.py                            # FastAPI 入口，挂载所有模块路由
│   ├── core/                              # 基础设施层（所有模块共享）
│   │   ├── config.py                      # 全局配置管理
│   │   ├── database.py                    # 数据库连接池
│   │   ├── security.py                    # API Key 加密存储
│   │   ├── ai_gateway/                    # AI 模型网关（共享）
│   │   │   ├── __init__.py
│   │   │   ├── catalog.py                 # 模型目录与路由
│   │   │   ├── provider.py                # LLM Provider 抽象
│   │   │   └── budget.py                  # Token 预算中间件
│   │   ├── agent/                         # Agent 框架层（共享）
│   │   │   ├── __init__.py
│   │   │   ├── base.py                    # Agent 基类
│   │   │   ├── orchestrator.py            # Agent 编排器（StateGraph）
│   │   │   ├── memory/                    # 记忆系统
│   │   │   │   ├── chroma_store.py        # ChromaDB 项目记忆
│   │   │   │   └── working_memory.py      # 工作记忆
│   │   │   └── tools/                     # Agent 工具（共享）
│   │   │       ├── web_search.py          # 联网搜索
│   │   │       └── format_converter.py    # 格式转换
│   │   ├── models/                        # 共享数据库模型
│   │   │   ├── __init__.py
│   │   │   ├── project.py                 # Project 模型
│   │   │   └── agent_session.py           # AgentSession / AgentMessage
│   │   ├── schemas/                       # 共享 Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── project.py
│   │   │   └── agent.py
│   │   └── api/                           # 共享 API 路由
│   │       ├── __init__.py
│   │       ├── v1/
│   │       │   ├── __init__.py
│   │       │   ├── projects.py            # 项目 CRUD
│   │       │   ├── settings.py            # 配置管理
│   │       │   └── router.py              # 汇总路由注册
│   │       └── websocket.py               # WebSocket 端点
│   │
│   └── modules/                           # 领域模块（每个 Pipeline 阶段一个）
│       ├── __init__.py
│       ├── scriptmind/                    # ===== ScriptMind 剧本工厂 =====
│       │   ├── __init__.py
│       │   ├── router.py                  # 模块路由注册
│       │   ├── models/                    # 模块数据模型
│       │   │   ├── __init__.py
│       │   │   ├── script.py              # Script / ScriptEpisode / ScriptScene / ScriptBeat
│       │   │   ├── character.py           # Character
│       │   │   ├── foreshadow.py          # Foreshadow
│       │   │   └── version.py             # ScriptVersion
│       │   ├── schemas/                   # 模块 Pydantic schemas
│       │   │   ├── __init__.py
│       │   │   ├── script.py
│       │   │   ├── character.py
│       │   │   └── foreshadow.py
│       │   ├── services/                  # 模块业务逻辑
│       │   │   ├── __init__.py
│       │   │   ├── script_service.py      # 剧本 CRUD + 版本控制
│       │   │   ├── import_service.py      # 文件/URL 导入
│       │   │   ├── quality_service.py     # 质量评估
│       │   │   └── foreshadow_service.py  # 伏笔追踪
│       │   ├── agents/                    # 模块专属 Agent
│       │   │   ├── __init__.py
│       │   │   ├── showrunner.py          # Showrunner Agent
│       │   │   ├── world_builder.py       # WorldBuilder Agent
│       │   │   ├── character_designer.py  # CharacterDesigner Agent
│       │   │   └── script_doctor.py       # ScriptDoctor Agent
│       │   ├── tools/                     # 模块专属工具
│       │   │   ├── __init__.py
│       │   │   └── logic_checker.py       # 逻辑校验
│       │   └── api/                       # 模块 API 端点
│       │       ├── __init__.py
│       │       ├── scripts.py             # 剧本 CRUD
│       │       ├── agent.py               # Agent 任务
│       │       ├── characters.py          # 角色管理
│       │       ├── foreshadows.py         # 伏笔管理
│       │       └── quality.py             # 质量评估
│       │
│       ├── storyboard/                    # [预留] StoryboardAI 智能分镜
│       │   └── __init__.py
│       ├── styleforge/                    # [预留] StyleForge 形象工坊
│       │   └── __init__.py
│       ├── motioncore/                    # [预留] MotionCore 视频合成
│       │   └── __init__.py
│       ├── voicestage/                    # [预留] VoiceStage 声演剧场
│       │   └── __init__.py
│       └── export/                        # [预留] Export 导出
│           └── __init__.py
│
├── alembic/                               # 数据库迁移
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py                        # 共享 fixtures
│   ├── unit/
│   │   ├── core/                          # 基础设施单元测试
│   │   └── modules/
│   │       └── scriptmind/                # ScriptMind 模块单元测试
│   ├── integration/
│   │   └── modules/
│   │       └── scriptmind/
│   └── contract/
│       └── api/
│           └── v1/
├── pyproject.toml
├── Dockerfile
└── docker-compose.yml                     # 完整服务编排

shared/                                    # 前后端共享类型定义
├── types/
│   ├── project.ts                         # 项目共享类型
│   ├── script.ts                          # 剧本共享类型
│   └── agent.ts                           # Agent 共享类型
└── constants/
    └── pipeline.ts                        # Pipeline 阶段常量
```

**Structure Decision**: 采用**领域驱动的模块化架构**（Domain-Driven Modular Architecture）。

- **`core/`**：基础设施层，包含数据库、AI 网关、Agent 框架、共享模型等所有模块共用的组件。新增模块时直接复用，无需重复实现。
- **`modules/`**：领域层，每个 Pipeline 阶段为独立模块，内部包含自己的 models、schemas、services、agents、tools、api。模块间通过 `core/` 共享基础设施，模块内高内聚、模块间低耦合。
- **前端 `components/shared/` 与 `components/scriptmind/`**：共享组件（Agent 面板、版本历史、质量仪表盘）可被未来模块复用，ScriptMind 专属组件独立组织。
- **扩展性**：新增 StoryboardAI 时，只需在 `modules/storyboard/` 下实现，并在前端 `app/projects/[projectId]/storyboard/` 添加页面，无需改动现有代码。
