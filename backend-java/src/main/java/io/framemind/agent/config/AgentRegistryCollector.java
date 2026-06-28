package io.framemind.agent.config;

import io.framemind.agent.registry.AgentDefinitionRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Agent 定义注册收集器。
 * <p>
 * 收集所有 {@link AgentDefinitionRegistry} Bean 并合并为统一的
 * {@code Map<String, AgentDefinition>} Bean，供 {@link io.framemind.agent.orchestration.PipelineOrchestrator} 使用。
 * <p>
 * 替代原 AgentScopeConfig（已随 AgentScope SDK 移除）。
 */
@Slf4j
@Configuration
public class AgentRegistryCollector {

    /**
     * 收集所有模块注册的 Agent 定义并合并为统一映射。
     * <p>
     * 如果多个模块注册了同名 agent，将抛出 {@link IllegalStateException} 快速失败。
     *
     * @param registries 所有 AgentDefinitionRegistry Bean 列表
     * @return agentName → AgentDefinition 映射
     */
    @Bean
    public Map<String, AgentDefinition> agentDefinitions(List<AgentDefinitionRegistry> registries) {
        Map<String, AgentDefinition> merged = new LinkedHashMap<>();

        for (AgentDefinitionRegistry registry : registries) {
            for (Map.Entry<String, AgentDefinition> entry : registry.getAllDefinitions().entrySet()) {
                String agentName = entry.getKey();
                if (merged.containsKey(agentName)) {
                    throw new IllegalStateException(
                            "Agent 定义冲突：'" + agentName + "' 被多个模块注册");
                }
                merged.put(agentName, entry.getValue());
            }
        }

        log.info("已注册 {} 个 Agent 定义: {}", merged.size(), merged.keySet());
        return merged;
    }
}
