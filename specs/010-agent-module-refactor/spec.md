# Feature Specification: Agent Module Architecture Refactor

**Feature Branch**: `010-agent-module-refactor`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "按照架构检测结果，重构后端 Agent 模块，修复 `agent/` 包对 `modules/scriptmind/` 的反向依赖，清理死代码，使模块真正自包含"

## Clarifications

### Session 2026-06-25

- Q: 如果两个模块注册了同名的 Agent 定义，系统应如何处理？ → A: 启动时快速失败（fail-fast），拒绝启动并记录冲突的模块名和 agent 名称。模块应使用不同的前缀避免冲突，碰撞视为开发者错误。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 消除 agent/ 对业务模块的反向依赖 (Priority: P1)

作为开发者，我希望 `agent/` 包是一个纯粹的通用 Agent 框架，不依赖任何业务模块（如 `modules/scriptmind/`），这样当新增业务模块（如 `modules/comicmind/`）时，框架层可以被直接复用而无需修改。

**Why this priority**: 这是最核心的架构违规。`agent/tool/` 下的 5 个 Tool 类直接 import 了 `modules/scriptmind/service/` 和 `modules/scriptmind/dto/`，导致通用框架层与业务模块耦合。这违背了"模块自包含"的设计初衷，使得框架层无法被其他模块复用。

**Independent Test**: 可以通过检查 `agent/` 包的 import 语句验证——不应存在任何对 `modules/` 的 import。新增一个空的 `modules/testmodule/` 包后，`agent/` 包应能独立编译。

**Acceptance Scenarios**:

1. **Given** `agent/tool/` 下的 Tool 类存在, **When** 检查其 import 语句, **Then** 不应包含任何对 `modules/*/service/` 或 `modules/*/dto/` 的 import
2. **Given** `agent/config/` 下的 Agent 定义, **When** 检查其内容, **Then** 不应包含任何 ScriptMind 业务特定的 agent 定义（如 `creative_agent`、`synopsis_agent` 等）
3. **Given** `agent/orchestration/PipelineOrchestrator`, **When** 检查其方法, **Then** 不应包含任何 `@Deprecated` 的业务语义方法（如 `executeOutlineGeneration`）
4. **Given** 新增一个空的业务模块 `modules/testmodule/`, **When** 编译 `agent/` 包, **Then** 编译成功，无对 scriptmind 的隐式依赖

---

### User Story 2 - 将业务 Tool 移入对应模块 (Priority: P1)

作为开发者，我希望 ScriptMind 业务相关的 Tool（CharacterTool、SynopsisTool、OutlineTool、ScriptTool）被移入 `modules/scriptmind/` 包下，由模块自行管理和提供，而非放在通用框架层。

**Why this priority**: 与 P1 共同解决依赖方向问题。Tool 是 Agent 与业务逻辑的桥梁，业务 Tool 应归属于对应的业务模块。

**Independent Test**: 可以通过检查 `modules/scriptmind/` 包下是否包含 Tool 类，以及 `agent/tool/` 下是否只剩通用 Tool（如 WebSearchTool）来验证。

**Acceptance Scenarios**:

1. **Given** 重构完成, **When** 检查 `modules/scriptmind/` 包, **Then** 包含 CharacterTool、SynopsisTool、OutlineTool、ScriptTool
2. **Given** 重构完成, **When** 检查 `agent/tool/` 包, **Then** 只包含通用 Tool（WebSearchTool），不包含任何业务 Tool
3. **Given** 重构完成, **When** 前端调用 ScriptMind workflow, **Then** Agent 仍能正常调用对应的 Tool 执行业务操作，功能无退化

---

### User Story 3 - 清理 modules/scriptmind/agent/ 下的死代码 (Priority: P2)

作为开发者，我希望 `modules/scriptmind/agent/` 下的 5 个未被使用的 Agent 类（ShowrunnerAgent、CreativeAgent、CharacterDesignerAgent、WorldBuilderAgent、ScriptDoctorAgent）被清理，避免维护混淆。

**Why this priority**: 这些类是旧的"直接调用 AgentCallAdapter"模式的遗留代码，已被新的"ReAct Agent + Tool"模式取代。它们虽然有完整的实现，但没有任何代码注入或调用它们，是死代码。

**Independent Test**: 可以通过全局搜索验证这 5 个类名不在任何 Controller、Service 或配置中被引用。

**Acceptance Scenarios**:

1. **Given** 重构完成, **When** 检查 `modules/scriptmind/agent/` 目录, **Then** 该目录不存在或为空（5 个 Agent 类已被删除或迁移）
2. **Given** 重构完成, **When** 执行 `mvnw compile`, **Then** 编译成功，无任何编译错误或未解析的引用
3. **Given** 重构完成, **When** 全局搜索 `ShowrunnerAgent`、`CreativeAgent` 等类名, **Then** 不存在对这些已删除类的引用

---

### User Story 4 - 将 Agent 定义迁入模块层 (Priority: P2)

作为开发者，我希望 ScriptMind 业务相关的 Agent 定义（creative_agent、synopsis_agent、character_agent、outline_agent、script_agent）从 `agent/config/AgentScopeConfig` 迁移到 `modules/scriptmind/` 包下，由模块自行注册。

**Why this priority**: Agent 定义包含业务特定的 system prompt 和迭代次数配置，应归属于业务模块。放在通用框架层会导致多模块扩展时定义混杂。

**Independent Test**: 可以通过检查 `agent/config/` 下不再包含 ScriptMind 特定的 agent 定义，且 `modules/scriptmind/` 下有自己的 agent 配置类来验证。

**Acceptance Scenarios**:

1. **Given** 重构完成, **When** 检查 `agent/config/AgentScopeConfig`, **Then** 不包含 ScriptMind 业务特定的 agent 定义
2. **Given** 重构完成, **When** 检查 `modules/scriptmind/` 包, **Then** 存在一个配置类注册 ScriptMind 相关的 Agent 定义
3. **Given** 重构完成, **When** 启动应用, **Then** 所有 Agent 定义正确加载，PipelineOrchestrator 能正常分发请求

---

### User Story 5 - AgentScopeAgentFactory 支持模块化 Tool 注册 (Priority: P2)

作为开发者，我希望 AgentScopeAgentFactory 中 agent → tool 的映射关系不再硬编码，而是通过配置或注册机制由各业务模块提供自己的 Tool 映射。

**Why this priority**: 硬编码的映射关系使得新增业务模块时必须修改框架层代码，违反开闭原则。

**Independent Test**: 可以通过检查 `AgentScopeAgentFactory` 不再包含硬编码的 agent → tool 映射，且应用启动后各 agent 仍能正确获取对应的 tool 来验证。

**Acceptance Scenarios**:

1. **Given** 重构完成, **When** 检查 `AgentScopeAgentFactory`, **Then** 不包含硬编码的 agent name → Tool class 映射
2. **Given** 重构完成, **When** 业务模块注册自己的 Tool, **Then** AgentScopeAgentFactory 能自动发现并注入对应的 Tool
3. **Given** 重构完成, **When** 启动应用并调用 workflow, **Then** 各 Agent 正确获得其 Tool，功能无退化

---

### Edge Cases

- 如果业务模块未注册任何 Tool，Agent 应以无 Tool 模式正常运行（纯对话模式）
- 如果两个模块注册了同名的 Agent 定义，应用启动时 MUST 快速失败（fail-fast），记录冲突的模块名和 agent 名称，拒绝启动。模块应使用不同前缀避免命名碰撞，碰撞视为开发者错误
- 重构过程中如果 Flyway migration 不变，数据库中的 session 记录应保持兼容

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `agent/` 包 MUST 不包含任何对 `modules/*/` 的 import 依赖
- **FR-002**: `agent/tool/` 下 MUST 只保留通用 Tool（WebSearchTool），业务 Tool MUST 移入对应的 `modules/*/` 包
- **FR-003**: `modules/scriptmind/` MUST 包含 ScriptMind 业务相关的 Tool 类（CharacterTool、SynopsisTool、OutlineTool、ScriptTool）
- **FR-004**: `modules/scriptmind/agent/` 下的 5 个未使用 Agent 类 MUST 被删除（ShowrunnerAgent、CreativeAgent、CharacterDesignerAgent、WorldBuilderAgent、ScriptDoctorAgent）
- **FR-005**: `agent/config/` MUST 不包含 ScriptMind 业务特定的 Agent 定义
- **FR-006**: `modules/scriptmind/` MUST 有自己的配置类注册 ScriptMind 相关的 Agent 定义和 Tool 映射
- **FR-007**: `AgentScopeAgentFactory` MUST 支持模块化 Tool 注册，不硬编码 agent → tool 映射
- **FR-008**: `PipelineOrchestrator` MUST 不包含 `@Deprecated` 的业务语义方法
- **FR-009**: 重构后所有现有功能 MUST 保持不变（ScriptMind workflow、Agent chat、CRUD 操作等）
- **FR-010**: 重构后应用 MUST 能通过 `mvnw compile` 和 `mvnw test` 编译和测试通过
- **FR-011**: 依赖方向 MUST 严格遵循：`modules/scriptmind/` → `agent/` → `core/`，禁止反向依赖
- **FR-012**: `AgentScopeAgentFactory` 中的 Tool 注册机制 MUST 支持扩展——新增业务模块时只需在模块内注册，无需修改 `agent/` 包代码
- **FR-013**: 如果两个模块注册了同名的 Agent 定义，应用 MUST 在启动时快速失败（fail-fast），记录冲突的模块名和 agent 名称

### Key Entities

- **AgentDefinition**: Agent 的元数据定义（名称、system prompt、迭代次数、模型配置），应可由各业务模块自行注册
- **Tool（AgentScope @Tool）**: Agent 可调用的工具，分为通用 Tool（框架层）和业务 Tool（模块层）
- **AgentScopeAgentFactory**: Agent 实例工厂，负责组装 Agent 与其 Tool 集合，应支持模块化注册
- **PipelineOrchestrator**: Agent 编排器，负责根据 workflow step 分发请求，应为纯框架组件

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `agent/` 包对 `modules/` 包的 import 数量为 0
- **SC-002**: `modules/scriptmind/agent/` 下的死代码类数量从 5 个降为 0 个
- **SC-003**: 重构后所有现有测试通过率 100%，无功能退化
- **SC-004**: 重构后编译通过，无新增编译警告
- **SC-005**: 新增业务模块时，只需在模块内注册 Agent 定义和 Tool，无需修改 `agent/` 包代码（可通过创建一个最小测试模块验证）
- **SC-006**: `agent/config/` 和 `agent/tool/` 下的 ScriptMind 特定代码数量为 0

## Assumptions

- 本次重构为纯代码结构调整，不涉及数据库 schema 变更（Flyway migration 不变）
- 本次重构不改变任何 API endpoint 的 URL、请求参数和响应格式
- 本次重构不涉及前端代码变更
- AgentScope-Java SDK 支持动态注册 Tool（通过 `@Tool` 注解和依赖注入机制）
- 重构过程中保持 Git 历史可追溯，采用逐步迁移而非一次性重写
- WebSearchTool 作为通用 Tool 留在 `agent/tool/` 下是合理的（它不依赖任何业务模块）
