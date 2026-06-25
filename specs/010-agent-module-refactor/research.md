# Research: Agent Module Architecture Refactor

**Date**: 2026-06-25
**Feature**: [spec.md](./spec.md)

## R1: 模块化 Tool 注册机制

### Decision

采用 **Spring 依赖注入 + 注册接口** 模式。定义 `AgentToolRegistry` 接口，各业务模块通过 `@Configuration` 类注册自己的 `agentName → List<Object>` 映射。`AgentScopeAgentFactory` 从 registry 获取 Tool 列表，不再硬编码。

### Rationale

- AgentScope-Java SDK 的 `@Tool` 注解机制基于 Spring Bean 发现，Tool 类本身就是 `@Component`
- Spring 的 `Map<String, List<Object>>` 注入天然支持多模块注册，且有冲突检测能力
- 与现有 `Map<String, AgentDefinition>` 注入模式一致（`PipelineOrchestrator` 已使用此模式）
- 零额外依赖，纯 Spring 原生能力

### Alternatives Considered

| 方案 | 优点 | 缺点 | 排除原因 |
|---|---|---|---|
| **SPI (ServiceLoader)** | 完全解耦，不依赖 Spring | 需要额外配置文件，调试困难 | 项目已深度使用 Spring，SPI 增加不必要的复杂度 |
| **注解扫描 (@AgentTool)** | 声明式，代码即配置 | 需要自定义注解 + BeanPostProcessor，扫描顺序不确定 | 过度工程化，当前规模不需要 |
| **配置文件 (YAML/JSON)** | 外部化配置 | 类型不安全，反射创建 Tool 实例复杂 | Tool 是 Spring Bean，不应通过配置文件实例化 |
| **保留硬编码 switch** | 最简单 | 违反开闭原则，新模块需改框架代码 | 直接违背 FR-007/FR-012 |

## R2: AgentDefinition 注册机制

### Decision

将 5 个 ScriptMind Agent 定义从 `AgentScopeConfig.agentDefinitions()` 移入 `ScriptMindAgentConfig`（`modules/scriptmind/config/`）。`AgentScopeConfig` 改为收集器——注入所有 `Map<String, AgentDefinition>` Bean 并合并，检测冲突时 fail-fast。

### Rationale

- 与现有 `Map<String, AgentDefinition>` 注入模式完全一致
- Spring 的 `@Bean` 方法天然支持按模块拆分
- `@Primary` 或 `@Qualifier` 可处理潜在冲突，但按 FR-013 要求应 fail-fast
- `AgentScopeConfig` 中的 `agentDefinitions()` Bean 改为注入多个 `AgentDefinition` Map 并合并

### Alternatives Considered

| 方案 | 优点 | 缺点 | 排除原因 |
|---|---|---|---|
| **注解扫描 (@AgentDefinition)** | 声明式 | 需要自定义注解 + 扫描逻辑 | 过度工程化 |
| **每个 Agent 类自注册** | 高内聚 | AgentDefinition 是配置，不是行为；且当前 Agent 类将被删除 | 与清理死代码冲突 |
| **配置文件** | 外部化 | system prompt 大段文本，YAML 可读性差 | 不适合长文本配置 |

## R3: PipelineOrchestrator 清理策略

### Decision

删除全部 7 个 `@Deprecated` 方法。将 `STEP_TO_AGENT` 映射和 `buildGenerationPrompt` 中的业务逻辑迁移到 `ScriptMindAgentConfig` 中作为可配置的 workflow step 定义。

### Rationale

- `@Deprecated` 方法全部委托给 `dispatchToAgent()`，无独立逻辑
- 调用方已全部迁移到 `dispatchToAgent()`（通过 `WorkflowController` 和 `ProjectAgentController`）
- `STEP_TO_AGENT` 和 `buildGenerationPrompt` 包含 ScriptMind 业务语义（workflow step 名称、中文 prompt），应归属模块层

### Alternatives Considered

| 方案 | 优点 | 缺点 | 排除原因 |
|---|---|---|---|
| **保留 @Deprecated 方法** | 向后兼容 | 无实际调用方，增加维护负担 | 已确认无调用方 |
| **移到模块层** | 完全解耦 | `PipelineOrchestrator` 需要通用化 dispatch 机制 | 增加复杂度，当前只需删除 |

## R4: 死代码清理确认

### Decision

删除 `modules/scriptmind/agent/` 下全部 5 个类：`ShowrunnerAgent`、`CreativeAgent`、`CharacterDesignerAgent`、`WorldBuilderAgent`、`ScriptDoctorAgent`。

### Rationale

- 全局搜索确认无任何代码注入或调用这些类
- 它们使用旧的 `AgentCallAdapter.call()` 直接调用模式，已被 ReAct Agent + Tool 模式取代
- Spring 会自动实例化这些 `@Component`，但它们不被任何 Bean 依赖，属于浪费资源的死代码

### Verification

通过以下方式确认无调用方：
- `grep -r "ShowrunnerAgent\|CreativeAgent\|CharacterDesignerAgent\|WorldBuilderAgent\|ScriptDoctorAgent"` 在整个代码库中无匹配（排除自身文件）

## R5: errorJson 工具方法提取

### Decision

将 4 个 Tool 类中重复的 `errorJson()` 方法提取为 `AgentToolRegistry` 或独立工具类中的静态方法。

### Rationale

- 4 个 Tool 中存在完全相同的 `private String errorJson(String message)` 方法
- 提取后减少重复代码，符合 DRY 原则
- 移入模块层后仍需使用，提取为共享工具更合理

## R6: Workflow Step 映射的模块化

### Decision

定义 `WorkflowStepDefinition` 记录：`(stepName, agentName, promptTemplate)`。各业务模块通过配置类注册自己的 workflow step。`PipelineOrchestrator` 从注册表查找 step 定义，不再硬编码。

### Rationale

- `STEP_TO_AGENT` 和 `buildGenerationPrompt()` 是 `PipelineOrchestrator` 中仅有的业务语义
- 提取后 `PipelineOrchestrator` 成为纯框架组件
- 新模块只需注册自己的 step 定义即可接入 workflow

### Alternatives Considered

| 方案 | 优点 | 缺点 | 排除原因 |
|---|---|---|---|
| **保留硬编码** | 简单 | 新模块需改框架代码 | 违反开闭原则 |
| **枚举** | 类型安全 | 不支持模块扩展 | 不支持多模块 |
