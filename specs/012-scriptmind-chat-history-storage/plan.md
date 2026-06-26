# Implementation Plan: ScriptMind Chat History Storage

**Branch**: `012-scriptmind-chat-history-storage` | **Date**: 2026-06-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-scriptmind-chat-history-storage/spec.md`

## Summary

优化 ScriptMind 模块的 Agent 对话聊天记录存储，解决四个核心问题：会话不隔离、无历史回溯、无自动标题、消息结构不匹配 AgentScope Block。通过两次数据库迁移（V4: 增加 `title` 字段，V5: 增加 `title_source` 字段）、重构会话管理逻辑（统一 `AgentSessionService.createSession()`）、新增 RESTful 会话列表/删除 API、修复消息序列化保真度、前端新增右侧边栏对话历史面板来实现。

## V2 修正（2026-06-26）

基于初版实现的不足，V2 修正了以下问题：

1. **REST API 路径规范化**：将非 RESTful 的 `/session-list`、`/session-create` 等路径改为标准的 `/sessions`、`POST /sessions` 等
2. **会话创建修复**：`AgentSessionService.createSession()` 新增支持 `workflowStep`/`agentName` 参数的重载；`ProjectAgentController.createSession()` 现在正确传递 workflow_step
3. **标题生成改进**：从原始截取 50 字符改为智能核心主题提取（去除常见请求前缀），新增 `title_source` 列追踪标题来源
4. **WebSocket 生命周期**：Session 切换时自动断开旧 WebSocket 连接，删除活跃会话后自动加载替换会话的消息
5. **代码去重**：`PipelineOrchestrator` 不再自己创建 session PO，统一委托给 `AgentSessionService`

## Technical Context

**Language/Version**: Java 17 (backend), TypeScript 5.x (frontend)

**Primary Dependencies**: Spring Boot 3.2.5, Spring Data JPA, AgentScope-Java SDK, Next.js 14, Zustand, Tailwind CSS

**Storage**: PostgreSQL (Flyway migrations), JSONB columns for metadata/input_data/output_data

**Testing**: JUnit 5 + Mockito (backend), Vitest (frontend)

**Target Platform**: Web application (Linux server backend + browser frontend)

**Project Type**: Web application (frontend + backend + shared types)

**Performance Goals**: 会话列表渲染 <1s (100+ sessions), 历史加载 <3s, 标题生成 <5s

**Constraints**: 遵循三层架构 (Adapter → Service → Infrastructure), Flyway 增量迁移, 不破坏现有数据

**Scale/Scope**: 单用户项目级别，每个 workflow step 数十到数百个会话

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

宪法文件 (`constitution.md`) 为占位符，无具体约束。按照项目 `CLAUDE.md` 中的架构规则检查：

- ✅ 三层架构访问方向：Adapter → Service → Infrastructure
- ✅ DTO 属于 Service 层
- ✅ 数据库模型以 PO 结尾
- ✅ 功能模块自包含结构
- ✅ Agent 模块独立，不受分层限制

无需违规豁免。

## Project Structure

### Documentation (this feature)

```text
specs/012-scriptmind-chat-history-storage/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── agent-session-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
backend-java/
├── src/main/java/io/framemind/
│   ├── infrastructure/
│   │   ├── po/AgentSessionPO.java          # 新增 title 字段
│   │   ├── po/AgentMessagePO.java          # 无需变更
│   │   └── repository/AgentSessionRepository.java  # 新增查询方法
│   ├── core/
│   │   ├── adapter/ProjectAgentController.java  # 新增会话列表/删除端点
│   │   └── service/AgentSessionService.java     # 新增业务逻辑方法
│   └── agent/
│       ├── orchestration/PipelineOrchestrator.java  # 重构会话创建逻辑
│       ├── core/JpaAgentStateStore.java            # 修复 block 类型保真
│       └── hook/SessionTitleHook.java              # 新增：自动生成标题
├── src/main/resources/db/migration/
│   ├── V4__chat_history_storage.sql        # 新增：title 列 + 索引
│   └── V5__fix_session_management.sql      # 新增：title_source 列
└── src/test/java/...

frontend/src/
├── components/scriptmind/
│   └── ChatHistorySidebar.tsx              # 新增：右侧对话历史边栏
├── stores/agent-store.ts                   # 重构：支持多会话管理
├── lib/api/agent-api.ts                    # 新增：会话列表/删除/标题 API
└── types/agent.ts                          # 更新：AgentSession 类型

shared/types/agent.ts                       # 更新：AgentSession 类型
```

**Structure Decision**: 采用现有 web application 结构（Option 2），在后端三层架构内扩展，前端在现有 components/scriptmind/ 下新增组件。

## Complexity Tracking

> 无宪法违规，无需豁免记录。
