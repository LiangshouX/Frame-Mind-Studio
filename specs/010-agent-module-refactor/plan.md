# Implementation Plan: Agent Module Architecture Refactor

**Branch**: `010-agent-module-refactor` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-agent-module-refactor/spec.md`

## Summary

重构后端 `agent/` 包，消除其对 `modules/scriptmind/` 的反向依赖。核心策略：(1) 将 4 个业务 Tool 从 `agent/tool/` 移入 `modules/scriptmind/tool/`；(2) 将 5 个 Agent 定义从 `agent/config/AgentScopeConfig` 迁移到模块层；(3) 用 Spring 依赖注入 + `AgentToolRegistry` 接口替代 `AgentScopeAgentFactory` 中的硬编码 switch；(4) 清理 5 个死代码 Agent 类和 7 个 `@Deprecated` 方法。

## Technical Context

**Language/Version**: Java 17, Spring Boot 3.2.5

**Primary Dependencies**: Spring Data JPA, AgentScope-Java SDK, Lombok, Flyway

**Storage**: PostgreSQL (via JPA), schema 不变

**Testing**: JUnit 5 + Spring Boot Test (`mvnw test`)

**Target Platform**: JVM (Spring Boot application)

**Project Type**: Web service (REST API + WebSocket)

**Performance Goals**: 无变更——纯结构重构，不改变运行时行为

**Constraints**:
- 不变更任何 API endpoint 的 URL、请求参数、响应格式
- 不变更数据库 schema（Flyway migration 不变）
- 不涉及前端代码变更
- 依赖方向严格：`modules/` → `agent/` → `core/`，禁止反向

**Scale/Scope**: 105 个 Java 文件中约 15 个需要移动/修改/删除

## Constitution Check

*Constitution 文件为模板占位符，无具体治理约束。跳过 gate 检查。*

## Project Structure

### Documentation (this feature)

```text
specs/010-agent-module-refactor/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: design decisions
├── data-model.md        # Phase 1: entity & interface design
├── quickstart.md        # Phase 1: validation guide
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
backend-java/src/main/java/io/framemind/
├── agent/                           # 通用 Agent 框架（重构后不含业务代码）
│   ├── config/
│   │   ├── AgentDefinition.java     # 不变
│   │   └── AgentScopeConfig.java    # 修改：移除 ScriptMind agent 定义，改为收集模块注册
│   ├── core/
│   │   ├── AgentEventBridge.java    # 不变
│   │   ├── AgentScopeAgentFactory.java  # 修改：移除硬编码 switch，改为从 registry 获取 Tool
│   │   └── JpaAgentStateStore.java  # 不变
│   ├── hook/
│   │   ├── BudgetHook.java          # 不变
│   │   └── StreamingHook.java       # 不变
│   ├── orchestration/
│   │   ├── AgentCallAdapter.java    # 不变
│   │   ├── AgentOrchestrationResult.java  # 不变
│   │   ├── AgentScopeCallAdapter.java     # 不变
│   │   ├── PipelineOrchestrator.java      # 修改：移除 @Deprecated 方法和 STEP_TO_AGENT 硬编码
│   │   └── PlaceholderAgentCallAdapter.java  # 不变
│   ├── registry/                    # 新增：模块化注册接口
│   │   ├── AgentToolRegistry.java   # 新增：Tool 注册中心接口
│   │   └── AgentToolRegistration.java  # 新增：注册记录
│   └── tool/
│       └── WebSearchTool.java       # 不变（通用 Tool）
│
├── modules/scriptmind/              # ScriptMind 业务模块（重构后自包含）
│   ├── agent/                       # 删除：5 个死代码 Agent 类
│   ├── config/                      # 新增：模块级 Agent 定义配置
│   │   └── ScriptMindAgentConfig.java  # 新增
│   ├── controller/                  # 不变
│   ├── dto/                         # 不变
│   ├── po/                          # 不变
│   ├── repository/                  # 不变
│   ├── service/                     # 不变
│   └── tool/                        # 新增：从 agent/tool/ 移入
│       ├── CharacterTool.java       # 从 agent/tool/ 移入
│       ├── OutlineTool.java         # 从 agent/tool/ 移入
│       ├── ScriptTool.java          # 从 agent/tool/ 移入
│       └── SynopsisTool.java        # 从 agent/tool/ 移入
│
├── core/                            # 不变
└── infrastructure/                  # 不变
```

**Structure Decision**: 采用 Web application 结构（backend-java），本次重构仅涉及 `agent/` 和 `modules/scriptmind/` 两个包的内部结构调整。

## Complexity Tracking

> 无 Constitution 违规需要 justify。
