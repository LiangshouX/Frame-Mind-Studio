package io.framemind.agent.registry;

import java.util.List;
import java.util.Set;

/**
 * Agent Tool 注册中心接口。
 * <p>
 * 各业务模块通过 {@code @Bean} 实现此接口，将 agent 名称映射到对应的 Tool 列表。
 * {@code AgentScopeAgentFactory} 从此注册中心获取 Tool，不再硬编码映射关系。
 */
public interface AgentToolRegistry {

    /**
     * 获取指定 agent 可用的 Tool 列表。
     *
     * @param agentName agent 名称（如 "creative_agent"）
     * @return Tool 对象列表（带有 @Tool 注解的 Bean），空列表表示无 Tool
     */
    List<Object> getToolsForAgent(String agentName);

    /**
     * 获取所有已注册的 agent 名称集合。
     *
     * @return 已注册 agent 名称集合
     */
    Set<String> getRegisteredAgentNames();
}
