package io.framemind.agent.registry;

import io.framemind.agent.config.AgentDefinition;

import java.util.Map;
import java.util.Optional;

/**
 * Agent 定义注册中心接口。
 * <p>
 * 各业务模块通过 {@code @Bean} 实现此接口，注册自己模块的 Agent 定义。
 * {@code PipelineOrchestrator} 通过注入所有实现并合并为统一映射。
 */
public interface AgentDefinitionRegistry {

    /**
     * 获取所有已注册的 AgentDefinition。
     *
     * @return agentName → AgentDefinition 映射
     */
    Map<String, AgentDefinition> getAllDefinitions();

    /**
     * 获取指定 agent 的定义。
     *
     * @param agentName agent 名称
     * @return AgentDefinition，不存在时返回 Optional.empty()
     */
    default Optional<AgentDefinition> getDefinition(String agentName) {
        return Optional.ofNullable(getAllDefinitions().get(agentName));
    }
}
