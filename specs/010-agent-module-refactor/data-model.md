# Data Model: Agent Module Architecture Refactor

**Date**: 2026-06-25
**Feature**: [spec.md](./spec.md)

> 本次重构不涉及数据库 schema 变更。以下仅描述新增/修改的 Java 接口和类设计。

## 新增接口

### AgentToolRegistry

**包**: `io.framemind.agent.registry`
**职责**: 框架层定义的 Tool 注册中心接口，各业务模块提供实现

```java
public interface AgentToolRegistry {
    /**
     * 获取指定 agent 可用的 Tool 列表
     * @param agentName agent 名称（如 "creative_agent"）
     * @return Tool 对象列表（带有 @Tool 注解的 Bean），空列表表示无 Tool
     */
    List<Object> getToolsForAgent(String agentName);

    /**
     * 获取所有已注册的 agent 名称集合
     * @return 已注册 agent 名称集合
     */
    Set<String> getRegisteredAgentNames();
}
```

### WorkflowStepDefinition

**包**: `io.framemind.agent.registry`
**职责**: 描述一个 workflow step 的配置（不可变记录）

```java
public record WorkflowStepDefinition(
    String stepName,        // workflow step 名称（如 "worldview"、"synopsis"）
    String agentName,       // 对应的 agent 名称（如 "creative_agent"）
    String promptTemplate   // 生成 prompt 的模板（支持 {projectId} 等占位符）
) {}
```

### AgentDefinitionRegistry

**包**: `io.framemind.agent.registry`
**职责**: 框架层定义的 Agent 定义注册中心接口

```java
public interface AgentDefinitionRegistry {
    /**
     * 获取所有已注册的 AgentDefinition
     * @return agentName → AgentDefinition 映射
     */
    Map<String, AgentDefinition> getAllDefinitions();

    /**
     * 获取指定 agent 的定义
     * @param agentName agent 名称
     * @return AgentDefinition，不存在时返回 Optional.empty()
     */
    Optional<AgentDefinition> getDefinition(String agentName);
}
```

## 修改的类

### AgentScopeConfig（agent/config/）

**变更**: 从"直接注册 5 个 agent 定义"改为"收集所有模块注册的定义并合并"

```java
@Configuration
public class AgentScopeConfig {

    /**
     * 收集所有模块注册的 AgentDefinition Bean，合并为统一映射。
     * 检测到同名 agent 时 fail-fast（抛出 IllegalStateException）。
     */
    @Bean
    public Map<String, AgentDefinition> agentDefinitions(
            List<AgentDefinitionRegistry> registries) {
        // 合并所有 registry 的定义
        // 检测冲突 → fail-fast
    }
}
```

### AgentScopeAgentFactory（agent/core/）

**变更**: 移除硬编码的 `buildToolkit()` switch，改为从 `AgentToolRegistry` 获取 Tool

```java
@Component
public class AgentScopeAgentFactory {

    private final AgentToolRegistry toolRegistry;  // 新增依赖
    // 移除: WebSearchTool, CharacterTool, SynopsisTool, OutlineTool, ScriptTool 字段

    /**
     * 构建 agent 的 Tool 列表，从 registry 获取
     */
    private List<Object> buildToolkit(String agentName) {
        return toolRegistry.getToolsForAgent(agentName);
    }
}
```

### PipelineOrchestrator（agent/orchestration/）

**变更**:
1. 删除 7 个 `@Deprecated` 方法
2. `STEP_TO_AGENT` 改为从 `WorkflowStepDefinition` 注册表获取
3. `buildGenerationPrompt` 从注册表获取 prompt 模板

```java
@Service
public class PipelineOrchestrator {

    // 移除: private static final Map<String, String> STEP_TO_AGENT
    // 新增: 注入 Map<String, WorkflowStepDefinition>

    // 删除: executeOutlineGeneration, executeScriptRefinement,
    //       executeFileImport, executeUrlImport, executeCharacterGeneration,
    //       executeScriptGeneration, executeReview, executeOptimization
}
```

## 模块级新增类

### ScriptMindAgentConfig（modules/scriptmind/config/）

**职责**: 注册 ScriptMind 模块的 Agent 定义、Tool 映射和 Workflow Step

```java
@Configuration
public class ScriptMindAgentConfig {

    /** 注册 5 个 ScriptMind agent 定义 */
    @Bean
    public Map<String, AgentDefinition> scriptmindAgentDefinitions() {
        // creative_agent, synopsis_agent, character_agent, outline_agent, script_agent
    }

    /** 注册 agent → Tool 映射 */
    @Bean
    public AgentToolRegistry scriptmindToolRegistry() {
        // creative_agent → [WebSearchTool]
        // synopsis_agent → [SynopsisTool]
        // character_agent → [CharacterTool]
        // outline_agent → [OutlineTool]
        // script_agent → [ScriptTool]
    }

    /** 注册 workflow step 定义 */
    @Bean
    public Map<String, WorkflowStepDefinition> scriptmindWorkflowSteps() {
        // worldview → creative_agent
        // synopsis → synopsis_agent
        // characters → character_agent
        // outline → outline_agent
        // script → script_agent
    }
}
```

### Tool 类移动

| 原位置 | 新位置 |
|---|---|
| `agent/tool/CharacterTool.java` | `modules/scriptmind/tool/CharacterTool.java` |
| `agent/tool/OutlineTool.java` | `modules/scriptmind/tool/OutlineTool.java` |
| `agent/tool/ScriptTool.java` | `modules/scriptmind/tool/ScriptTool.java` |
| `agent/tool/SynopsisTool.java` | `modules/scriptmind/tool/SynopsisTool.java` |

移动时仅修改 package 声明和 import 路径，业务逻辑不变。

### 删除的类

| 文件 | 原因 |
|---|---|
| `modules/scriptmind/agent/ShowrunnerAgent.java` | 死代码，无调用方 |
| `modules/scriptmind/agent/CreativeAgent.java` | 死代码，无调用方 |
| `modules/scriptmind/agent/CharacterDesignerAgent.java` | 死代码，无调用方 |
| `modules/scriptmind/agent/WorldBuilderAgent.java` | 死代码，无调用方 |
| `modules/scriptmind/agent/ScriptDoctorAgent.java` | 死代码，无调用方 |

## 依赖方向验证

重构后的 import 方向：

```
modules/scriptmind/config/ScriptMindAgentConfig
  → agent/config/AgentDefinition          ✅ module → framework
  → agent/registry/AgentToolRegistry      ✅ module → framework
  → modules/scriptmind/tool/*             ✅ module 内部

modules/scriptmind/tool/CharacterTool
  → modules/scriptmind/service/*          ✅ module 内部
  → modules/scriptmind/dto/*              ✅ module 内部

agent/core/AgentScopeAgentFactory
  → agent/registry/AgentToolRegistry      ✅ framework 内部
  → agent/config/AgentDefinition          ✅ framework 内部

agent/orchestration/PipelineOrchestrator
  → agent/registry/WorkflowStepDefinition ✅ framework 内部
  → agent/core/AgentScopeAgentFactory     ✅ framework 内部
  → infrastructure/*                      ✅ framework → infrastructure
```

无反向依赖。✅
