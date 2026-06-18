# Implementation Plan: ScriptMind 剧本工厂

**Branch**: `001-scriptmind-screenplay-factory` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-scriptmind-screenplay-factory/spec.md`

## Summary

ScriptMind 剧本工厂是灵镜创影的创作起点模块，负责将用户的创意想法（一句话梗概、大纲文本、小说文件、网页 URL）通过多 Agent 协作转化为结构化的标准剧本。核心能力包括：AI Agent 协作生成大纲（Showrunner → WorldBuilder → CharacterDesigner → ScriptDoctor）、专业剧本编辑器（6 种元素类型 + Tab 切换）、多集管理与伏笔追踪、版本控制与历史回溯、质量评估仪表盘、API 成本控制。

技术方案采用前后端分离架构：前端 Next.js 14 + shadcn/ui + Tailwind CSS，后端 Spring Boot 3.x + AgentScope-Java（ReAct Agent 编排），存储层 PostgreSQL（业务数据）+ Redis（缓存/会话），通过 Docker Compose 一键部署。初始版本为单用户本地部署，无认证机制。

## Technical Context

**Language/Version**: Java 17+ (backend), TypeScript 5.3+ (frontend)

**Primary Dependencies**: Spring Boot 3.x, AgentScope-Java 1.0.12 (io.agentscope:agentscope), Spring Data JPA, Spring WebSocket, Next.js 14+, shadcn/ui, Tailwind CSS 3.4+, Zustand

**Storage**: PostgreSQL 16+ (业务数据), Redis 7+ (会话缓存/任务队列)

**Testing**: JUnit 5 + Mockito (backend), Jest + React Testing Library (frontend)

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
frontend/                                  # Next.js 14 App Router（保持不变）
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

backend/                                   # Spring Boot 后端
├── pom.xml                                # Maven 构建文件
├── src/main/java/io/framemind/
│   ├── FrameMindApplication.java          # Spring Boot 入口
│   ├── core/                              # 基础设施层（所有模块共享）
│   │   ├── config/                        # 全局配置
│   │   │   ├── DatabaseConfig.java        # 数据库配置
│   │   │   ├── RedisConfig.java           # Redis 配置
│   │   │   ├── WebSocketConfig.java       # WebSocket 配置
│   │   │   └── SecurityConfig.java        # API Key 加密配置
│   │   ├── model/                         # 共享 JPA 实体
│   │   │   ├── Project.java
│   │   │   ├── ProjectBudget.java
│   │   │   ├── AgentSession.java
│   │   │   └── AgentMessage.java
│   │   ├── repository/                    # 共享 Repository
│   │   │   ├── ProjectRepository.java
│   │   │   ├── AgentSessionRepository.java
│   │   │   └── AgentMessageRepository.java
│   │   ├── service/                       # 共享服务
│   │   │   ├── ProjectService.java
│   │   │   └── ApiKeyService.java         # Fernet 加密 API Key
│   │   ├── controller/                    # 共享 REST 控制器
│   │   │   ├── ProjectController.java
│   │   │   └── SettingsController.java
│   │   ├── dto/                           # 共享 DTO
│   │   │   ├── ProjectCreateRequest.java
│   │   │   ├── ProjectResponse.java
│   │   │   └── ProjectListResponse.java
│   │   └── websocket/                     # WebSocket 端点
│   │       └── AgentWebSocketHandler.java
│   │
│   ├── agent/                             # Agent 编排层（共享）
│   │   ├── config/                        # Agent 配置
│   │   │   └── AgentScopeConfig.java      # AgentScope-Java 配置
│   │   ├── orchestration/                 # 多 Agent 编排
│   │   │   ├── PipelineOrchestrator.java  # 流水线编排器
│   │   │   └── StageResult.java           # 阶段结果
│   │   ├── hook/                          # Hook 实现
│   │   │   ├── StreamingHook.java         # 流式输出 Hook
│   │   │   ├── BudgetHook.java            # Token 预算 Hook
│   │   │   └── HitlHook.java              # 人类审核 Hook
│   │   └── tool/                          # Agent 工具
│   │       ├── ScriptQueryTool.java       # 剧本查询工具
│   │       └── ForeshadowCheckTool.java   # 伏笔检查工具
│   │
│   └── modules/                           # 领域模块
│       ├── scriptmind/                    # ===== ScriptMind 剧本工厂 =====
│       │   ├── model/                     # JPA 实体
│       │   │   ├── Script.java
│       │   │   ├── ScriptVersion.java
│       │   │   ├── Character.java
│       │   │   └── Foreshadow.java
│       │   ├── repository/                # Spring Data Repository
│       │   │   ├── ScriptRepository.java
│       │   │   ├── ScriptVersionRepository.java
│       │   │   ├── CharacterRepository.java
│       │   │   └── ForeshadowRepository.java
│       │   ├── service/                   # 业务逻辑
│       │   │   ├── ScriptService.java     # 剧本 CRUD + 版本控制
│       │   │   ├── ImportService.java     # 文件/URL 导入
│       │   │   ├── QualityService.java    # 质量评估
│       │   │   └── ForeshadowService.java # 伏笔追踪
│       │   ├── agent/                     # 模块专属 Agent 定义
│       │   │   ├── ShowrunnerAgent.java   # Showrunner Agent
│       │   │   ├── WorldBuilderAgent.java # WorldBuilder Agent
│       │   │   ├── CharacterDesignerAgent.java
│       │   │   └── ScriptDoctorAgent.java
│       │   ├── controller/                # REST 控制器
│       │   │   ├── ScriptController.java
│       │   │   ├── AgentController.java
│       │   │   ├── CharacterController.java
│       │   │   ├── ForeshadowController.java
│       │   │   └── QualityController.java
│       │   └── dto/                       # 模块 DTO
│       │       ├── ScriptResponse.java
│       │       ├── GenerateOutlineRequest.java
│       │       └── OptimizeSegmentRequest.java
│       │
│       ├── storyboard/                    # [预留] StoryboardAI
│       ├── styleforge/                    # [预留] StyleForge
│       ├── motioncore/                    # [预留] MotionCore
│       ├── voicestage/                    # [预留] VoiceStage
│       └── export/                        # [预留] Export
│
├── src/main/resources/
│   ├── application.yml                    # Spring Boot 配置
│   ├── application-dev.yml                # 开发环境配置
│   └── db/migration/                      # Flyway 数据库迁移
│       └── V1__init_schema.sql
│
├── src/test/java/io/framemind/            # 测试
│   ├── core/
│   └── modules/scriptmind/
│
├── Dockerfile
└── docker-compose.yml                     # 完整服务编排
```

**Structure Decision**: 采用**领域驱动的模块化架构**（Domain-Driven Modular Architecture）。

- **`core/`**：基础设施层，包含数据库、Agent 编排、WebSocket、共享模型等所有模块共用的组件。新增模块时直接复用，无需重复实现。
- **`modules/`**：领域层，每个 Pipeline 阶段为独立模块，内部包含自己的 model、repository、service、agent、controller、dto。模块间通过 `core/` 共享基础设施，模块内高内聚、模块间低耦合。
- **AgentScope-Java 集成**：每个 Agent 封装为 `ReActAgent` 实例，通过 `SubAgentTool` 实现 Supervisor → SubAgent 委托。`PipelineOrchestrator` 编排 Showrunner → WorldBuilder → CharacterDesigner → ScriptDoctor 流水线。
- **扩展性**：新增 StoryboardAI 时，只需在 `modules/storyboard/` 下实现，并在前端 `app/projects/[projectId]/storyboard/` 添加页面，无需改动现有代码。
