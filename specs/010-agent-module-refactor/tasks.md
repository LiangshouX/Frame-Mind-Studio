# Tasks: Agent Module Architecture Refactor

**Input**: Design documents from `/specs/010-agent-module-refactor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 未显式要求 TDD，不生成测试任务。通过 `mvnw test` 做回归验证。

**Organization**: 按 User Story 分组，支持独立实施和验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件，无依赖）
- **[Story]**: 所属 User Story（US1-US5）
- 包含精确文件路径

---

## Phase 1: Setup — 创建注册接口包

**Purpose**: 创建 `agent/registry/` 包和核心接口，为后续所有 User Story 奠定基础

- [X] T001 创建目录 `backend-java/src/main/java/io/framemind/agent/registry/`
- [X] T002 创建 `AgentToolRegistry` 接口在 `agent/registry/AgentToolRegistry.java`，定义 `getToolsForAgent(String agentName)` 和 `getRegisteredAgentNames()` 方法
- [X] T003 创建 `AgentDefinitionRegistry` 接口在 `agent/registry/AgentDefinitionRegistry.java`，定义 `getAllDefinitions()` 和 `getDefinition(String agentName)` 方法
- [X] T004 创建 `WorkflowStepDefinition` 不可变记录在 `agent/registry/WorkflowStepDefinition.java`，包含 `stepName`、`agentName`、`promptTemplate` 字段

**Checkpoint**: 注册接口就绪，所有后续 Phase 可以引用

---

## Phase 2: Foundational — 创建 errorJson 工具方法

**Purpose**: 提取重复的工具方法，为 Tool 移动做准备

- [X] T005 创建 `AgentToolHelper` 工具类在 `agent/registry/AgentToolHelper.java`，包含静态方法 `errorJson(String message)` 返回 `{"status":"error","message":"..."}` JSON 字符串

**Checkpoint**: 基础工具就绪

---

## Phase 3: User Story 1 + User Story 2 — 消除反向依赖 & 移动业务 Tool (Priority: P1) 🎯 MVP

**Goal**: 将 4 个业务 Tool 从 `agent/tool/` 移入 `modules/scriptmind/tool/`，消除 `agent/` 对 `modules/scriptmind/` 的反向依赖

**Independent Test**: `grep -r "import io.framemind.modules" backend-java/src/main/java/io/framemind/agent/` 返回 0 匹配；`ls agent/tool/` 只有 WebSearchTool.java

### 移动 Tool 文件

- [X] T006 [P] [US2] 移动 `agent/tool/CharacterTool.java` → `modules/scriptmind/tool/CharacterTool.java`，更新 package 声明为 `io.framemind.modules.scriptmind.tool`，将 `errorJson()` 调用替换为 `AgentToolHelper.errorJson()`，删除私有 `errorJson()` 方法
- [X] T007 [P] [US2] 移动 `agent/tool/OutlineTool.java` → `modules/scriptmind/tool/OutlineTool.java`，更新 package 声明，替换 `errorJson()`
- [X] T008 [P] [US2] 移动 `agent/tool/ScriptTool.java` → `modules/scriptmind/tool/ScriptTool.java`，更新 package 声明，替换 `errorJson()`
- [X] T009 [P] [US2] 移动 `agent/tool/SynopsisTool.java` → `modules/scriptmind/tool/SynopsisTool.java`，更新 package 声明，替换 `errorJson()`

### 修改框架层引用

- [X] T010 [US1] 修改 `agent/core/AgentScopeAgentFactory.java`：(1) 移除对 4 个业务 Tool 的直接注入字段（CharacterTool、SynopsisTool、OutlineTool、ScriptTool），改为注入 `AgentToolRegistry`；(2) 将 `buildToolkit(String agentName)` 方法的硬编码 switch 替换为 `toolRegistry.getToolsForAgent(agentName)` 调用
- [X] T011 [US1] 修改 `agent/config/AgentScopeConfig.java`：将 `agentDefinitions()` Bean 方法改为注入 `List<AgentDefinitionRegistry>`，合并所有 registry 的定义，检测同名冲突时抛出 `IllegalStateException`（fail-fast）

**Checkpoint**: `agent/` 包对 `modules/` 的 import 数量为 0；4 个业务 Tool 在 `modules/scriptmind/tool/` 下；AgentScopeAgentFactory 通过 registry 获取 Tool

---

## Phase 4: User Story 3 — 清理死代码 (Priority: P2)

**Goal**: 删除 `modules/scriptmind/agent/` 下 5 个未使用的 Agent 类

**Independent Test**: `ls modules/scriptmind/agent/` 目录不存在或为空；`grep -r "ShowrunnerAgent\|CreativeAgent\|CharacterDesignerAgent\|WorldBuilderAgent\|ScriptDoctorAgent"` 在整个 src/ 下无匹配

- [X] T012 [P] [US3] 删除 `modules/scriptmind/agent/ShowrunnerAgent.java`
- [X] T013 [P] [US3] 删除 `modules/scriptmind/agent/CreativeAgent.java`
- [X] T014 [P] [US3] 删除 `modules/scriptmind/agent/CharacterDesignerAgent.java`
- [X] T015 [P] [US3] 删除 `modules/scriptmind/agent/WorldBuilderAgent.java`
- [X] T016 [P] [US3] 删除 `modules/scriptmind/agent/ScriptDoctorAgent.java`
- [X] T017 [US3] 如果 `modules/scriptmind/agent/` 目录为空，删除该目录

**Checkpoint**: `modules/scriptmind/agent/` 目录不存在或为空；全局搜索无残留引用

---

## Phase 5: User Story 4 + User Story 5 — Agent 定义迁移 & 模块化注册 (Priority: P2)

**Goal**: 将 ScriptMind Agent 定义迁入模块层，实现模块化 Tool/Agent/WorkflowStep 注册，清理 PipelineOrchestrator

**Independent Test**: `grep "creative_agent\|synopsis_agent" agent/config/AgentScopeConfig.java` 无匹配；`AgentScopeAgentFactory` 中无 switch 语句；`PipelineOrchestrator` 中无 @Deprecated 方法

### 模块级配置

- [X] T018 [US4] 创建 `modules/scriptmind/config/ScriptMindAgentConfig.java`，实现以下 Bean：(1) `@Bean Map<String, AgentDefinition> scriptmindAgentDefinitions()` — 注册 5 个 agent 定义（creative_agent、synopsis_agent、character_agent、outline_agent、script_agent），system prompt 从 `AgentScopeConfig` 迁移过来；(2) `@Bean AgentToolRegistry scriptmindToolRegistry()` — 返回匿名实现，将 agent 名称映射到对应的 Tool Bean 列表；(3) `@Bean Map<String, WorkflowStepDefinition> scriptmindWorkflowSteps()` — 注册 5 个 workflow step（worldview→creative_agent 等），prompt 模板从 `PipelineOrchestrator.buildGenerationPrompt()` 迁移过来

### 清理 AgentScopeConfig

- [X] T019 [US4] 修改 `agent/config/AgentScopeConfig.java`：移除原 `agentDefinitions()` 方法中的 5 个内联 AgentDefinition，改为收集所有 `AgentDefinitionRegistry` Bean 并合并，检测同名冲突时 fail-fast

### 清理 PipelineOrchestrator

- [X] T020 [US5] 修改 `agent/orchestration/PipelineOrchestrator.java`：(1) 删除 `STEP_TO_AGENT` 静态常量，改为注入 `Map<String, WorkflowStepDefinition>`；(2) 删除 `buildGenerationPrompt()` 方法，改为从 WorkflowStepDefinition 获取 promptTemplate；(3) 删除全部 7 个 `@Deprecated` 方法（executeOutlineGeneration、executeScriptRefinement、executeFileImport、executeUrlImport、executeCharacterGeneration、executeScriptGeneration、executeReview、executeOptimization）

**Checkpoint**: AgentScopeConfig 只作为收集器；PipelineOrchestrator 为纯框架组件；ScriptMindAgentConfig 包含所有业务配置

---

## Phase 6: Polish & 验证

**Purpose**: 最终清理和回归验证

- [X] T021 删除旧的 `agent/tool/CharacterTool.java`、`agent/tool/OutlineTool.java`、`agent/tool/ScriptTool.java`、`agent/tool/SynopsisTool.java`（如果移动后原文件仍存在）
- [X] T022 [P] 执行 `cd backend-java && ./mvnw compile`，确认编译通过，无错误
- [X] T023 [P] 执行 `cd backend-java && ./mvnw test`，确认所有测试通过，无功能退化
- [X] T024 执行 quickstart.md 中的验证场景 V1-V7，逐项确认通过
- [X] T025 [P] 检查 `agent/` 包下无任何 `import io.framemind.modules`（SC-001）
- [X] T026 [P] 检查 `agent/config/` 和 `agent/tool/` 下无 ScriptMind 特定代码（SC-006）

**Checkpoint**: 所有 FR 和 SC 验证通过，重构完成

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1（T002 接口就绪）
- **Phase 3 (US1+US2)**: 依赖 Phase 1 + 2（需要 AgentToolRegistry 接口和 AgentToolHelper）
- **Phase 4 (US3)**: 无强依赖，可与 Phase 3 并行
- **Phase 5 (US4+US5)**: 依赖 Phase 3（需要 Tool 已移动到模块层）
- **Phase 6 (Polish)**: 依赖 Phase 3 + 4 + 5 全部完成

### User Story Dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Foundational)
        └─→ Phase 3 (US1+US2) ──┐
              ┌──────────────────┘
              ├─→ Phase 4 (US3) ←── 可与 Phase 3 并行
              └─→ Phase 5 (US4+US5)
                    └─→ Phase 6 (Polish)
```

### Within Each Phase

- Phase 1: T002 → T003 → T004（接口创建有序，但可并行）
- Phase 3: T006-T009（Tool 移动）可并行 → T010-T011（修改引用）顺序执行
- Phase 4: T012-T016（删除文件）全部可并行 → T017（清理目录）
- Phase 5: T018 → T019 → T020（配置创建 → 清理旧配置 → 清理 Orchestrator）
- Phase 6: T022-T026 可并行

---

## Parallel Opportunities

### Phase 3 (US1+US2)

```bash
# 并行移动 4 个 Tool 文件：
Task T006: "移动 CharacterTool.java"
Task T007: "移动 OutlineTool.java"
Task T008: "移动 ScriptTool.java"
Task T009: "移动 SynopsisTool.java"
```

### Phase 4 (US3)

```bash
# 并行删除 5 个死代码文件：
Task T012: "删除 ShowrunnerAgent.java"
Task T013: "删除 CreativeAgent.java"
Task T014: "删除 CharacterDesignerAgent.java"
Task T015: "删除 WorldBuilderAgent.java"
Task T016: "删除 ScriptDoctorAgent.java"
```

### Phase 6 (Polish)

```bash
# 并行验证：
Task T022: "mvnw compile"
Task T023: "mvnw test"
Task T025: "检查 agent/ 无 modules import"
Task T026: "检查 agent/ 无 ScriptMind 特定代码"
```

---

## Implementation Strategy

### MVP First (Phase 1 → 2 → 3)

1. 完成 Phase 1: 创建注册接口
2. 完成 Phase 2: 创建 errorJson 工具
3. 完成 Phase 3: 移动 Tool + 修改引用
4. **停止并验证**: `grep -r "import io.framemind.modules" agent/` 返回 0 匹配
5. `mvnw compile` 通过

### 增量交付

1. Phase 1+2+3 → 消除反向依赖（核心目标达成）
2. + Phase 4 → 清理死代码
3. + Phase 5 → 完整模块化（Agent 定义 + Workflow Step + Pipeline 清理）
4. + Phase 6 → 最终验证

### 每个任务后

- `mvnw compile` 确认编译通过
- 遇到问题立即回滚该任务的改动
- Phase 3 完成后做一次完整的 `mvnw test` 回归

---

## Notes

- 所有文件移动操作使用 `git mv` 保留历史
- package 声明和 import 更新在移动时同步完成
- `@Component` 注解保持不变（Spring 自动发现）
- 不修改任何 Controller、Service、DTO、PO、Repository 类
- 不修改数据库 Flyway migration
- 不修改前端代码
