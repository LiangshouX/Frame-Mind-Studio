# Implementation Plan: ScriptMind 剧本工作流

**Branch**: `005-scriptmind-workflow` | **Date**: 2026-06-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-scriptmind-workflow/spec.md`

## Summary

将 ScriptMind 从现有的"单页编辑器 + 侧边栏"模式重构为"5-Tab 工作流"模式。用户通过标签导航依次完成创意及世界观、梗概、角色、大纲、剧本内容五个步骤，每个步骤支持 AI 对话生成和手动编辑。同时移除版本管理功能（Spec 明确不需要），扩展数据模型支持传统影视（微电影）双轨结构。

## Technical Context

**Language/Version**: Java 17 (Spring Boot 3.2.5), TypeScript (Next.js 14)

**Primary Dependencies**: Spring Data JPA, Flyway, AgentScope-Java SDK, Zustand, Tailwind CSS, shadcn/ui

**Storage**: PostgreSQL (JSONB for content), Redis (session/cache)

**Testing**: JUnit 5 + Spring Boot Test (backend), Jest (frontend)

**Target Platform**: Docker (postgres + redis + backend + frontend)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: AI 首次响应 < 3s, 标签页切换 < 1s, 编辑器切换 < 50ms

**Constraints**: 单用户本地部署, 无认证, 内容直接覆盖不保留历史版本

**Scale/Scope**: 单用户, 10 集短剧完整工作流 < 2 小时

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 条款 | 状态 | 说明 |
|------|------|------|
| 注释语言规范 | ✅ 通过 | 所有新增代码使用中文注释，Java 使用 Javadoc 格式 |
| 三层架构 | ✅ 通过 | Controller → Service → Repository，DTO 在 Service 层 |
| 包结构 | ✅ 通过 | 使用 modules/scriptmind/ 自包含结构 |
| PO 命名 | ✅ 通过 | 所有数据库模型以 PO 结尾 |
| 功能模块自包含 | ✅ 通过 | scriptmind 模块包含自己的 controller/service/dto/po/repository |

## Project Structure

### Documentation (this feature)

```text
specs/005-scriptmind-workflow/
├── plan.md              # 本文件
├── research.md          # Phase 0: 现有实现分析
├── data-model.md        # Phase 1: 数据模型设计
├── quickstart.md        # Phase 1: 验证指南
├── contracts/
│   └── workflow-api.md  # Phase 1: API 契约
└── tasks.md             # Phase 2: 任务分解（由 /speckit-tasks 生成）
```

### Source Code (repository root)

```text
backend-java/src/main/java/io/framemind/
├── infrastructure/
│   ├── po/
│   │   ├── ProjectPO.java              # 修改: 增加 logline 字段
│   │   ├── AgentMessagePO.java         # 不变
│   │   ├── AgentSessionPO.java         # 不变
│   │   └── ProjectBudgetPO.java        # 不变
│   └── repository/                     # 不变
├── core/
│   ├── adapter/controller/
│   │   └── ProjectController.java      # 修改: 响应增加工作流状态
│   ├── service/
│   │   └── ProjectService.java         # 修改: 增加工作流状态查询
│   └── config/                         # 不变
├── modules/scriptmind/
│   ├── po/
│   │   ├── ScriptPO.java               # 不变
│   │   ├── CharacterPO.java            # 修改: 增加 gender/identity/persona/overview
│   │   ├── ForeshadowPO.java           # 不变
│   │   ├── WorldSettingPO.java         # 新增
│   │   ├── SynopsisPO.java             # 新增
│   │   ├── OutlinePO.java              # 新增
│   │   └── ReviewReportPO.java         # 新增
│   ├── repository/
│   │   ├── WorldSettingRepository.java # 新增
│   │   ├── SynopsisRepository.java     # 新增
│   │   ├── OutlineRepository.java      # 新增
│   │   └── ReviewReportRepository.java # 新增
│   ├── dto/                            # 新增各步骤 Request/Response
│   ├── service/
│   │   ├── ScriptService.java          # 重构: 移除版本管理
│   │   ├── CharacterService.java       # 修改: 增加 create/delete
│   │   ├── WorldSettingService.java    # 新增
│   │   ├── SynopsisService.java        # 新增
│   │   ├── OutlineService.java         # 新增
│   │   ├── ReviewService.java          # 新增
│   │   └── ExportService.java          # 新增
│   ├── controller/
│   │   ├── WorkflowController.java     # 新增
│   │   ├── ExportController.java       # 新增
│   │   └── CharacterController.java    # 修改: 增加 POST/DELETE
│   └── agent/
│       └── CreativeAgent.java          # 新增
├── agent/orchestration/
│   └── PipelineOrchestrator.java       # 修改: 增加工作流步骤编排
└── (删除: VersionController, ScriptVersionPO, ScriptVersionRepository)

backend-java/src/main/resources/db/migration/
└── V2__workflow_schema.sql             # 新增

frontend/src/
├── app/projects/[id]/scriptmind/
│   ├── page.tsx                        # 重构: 5-Tab 工作流
│   ├── outline/page.tsx                # 删除
│   └── import/page.tsx                 # 删除
├── components/scriptmind/
│   ├── workflow-tabs/index.tsx         # 新增
│   ├── worldview-panel/index.tsx       # 新增
│   ├── synopsis-panel/index.tsx        # 新增
│   ├── outline-panel/index.tsx         # 新增
│   ├── review-panel/index.tsx          # 新增
│   ├── ai-chat-panel/index.tsx         # 新增
│   └── character-panel/index.tsx       # 修改
├── stores/
│   ├── project-store.ts                # 修改
│   └── workflow-store.ts               # 新增
├── lib/api/
│   └── workflow.ts                     # 新增
└── types/
    └── workflow.ts                     # 新增
```

**Structure Decision**: 遵循项目现有的 Web application 结构（backend-java + frontend），在 modules/scriptmind/ 下自包含所有功能。

## Implementation Phases

### Phase 1: 数据模型与基础设施

**目标**: 建立工作流的数据基础，确保前后端数据结构一致。

**任务**:
1. 创建 V2 Flyway 迁移
2. 新增/修改 PO 类
3. 新增/修改 Repository
4. 删除 ScriptVersionPO, ScriptVersionRepository, VersionController
5. 重构 ScriptService（移除版本管理逻辑）
6. 新增前端类型定义（workflow.ts）
7. 修改 shared/types/script.ts（增加传统影视模型）

**依赖**: 无
**输出**: 数据库 schema 就绪，PO/Repository 层就绪

### Phase 2: 工作流后端 API

**目标**: 实现工作流各步骤的 CRUD API 和 Agent 编排。

**任务**:
1. 新增 Service: WorldSettingService, SynopsisService, OutlineService, ReviewService, ExportService
2. 修改 CharacterService: 增加 create/delete
3. 新增 Controller: WorkflowController, ExportController
4. 修改 CharacterController: 增加 POST/DELETE
5. 修改 AgentController: 增加工作流步骤 API
6. 新增 DTO
7. 修改 PipelineOrchestrator: 增加工作流步骤编排
8. 新增 CreativeAgent 定义

**依赖**: Phase 1
**输出**: 所有后端 API 就绪

### Phase 3: 前端工作流 UI

**目标**: 重构前端页面为 5-Tab 工作流结构。

**任务**:
1. 新增 workflow-store
2. 新增 WorkflowTabs 组件
3. 重构 scriptmind/page.tsx
4. 新增各 Tab 面板组件
5. 新增 AiChatPanel 组件
6. 新增 workflow.ts API 客户端
7. 删除旧页面

**依赖**: Phase 2
**输出**: 前端 5-Tab 工作流就绪

### Phase 4: 集成与优化

**目标**: 端到端联调，确保工作流完整可用。

**任务**:
1. 前后端联调
2. WebSocket 流式输出联调
3. 文件导入整合
4. 内容导出验证
5. 审查报告全流程验证
6. 跨步骤上下文传递验证
7. 性能优化

**依赖**: Phase 3
**输出**: 功能完整可用

## Complexity Tracking

> No Constitution violations detected. All design decisions comply with project governance.
