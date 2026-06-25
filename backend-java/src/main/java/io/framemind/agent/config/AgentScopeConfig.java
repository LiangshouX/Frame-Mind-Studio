package io.framemind.agent.config;

import io.framemind.agent.registry.AgentDefinitionRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Agent 定义收集器配置类。
 * <p>
 * 收集所有模块注册的 {@link AgentDefinitionRegistry} Bean，合并为统一的 Agent 定义映射。
 * 检测到同名 agent 时 fail-fast（抛出 {@link IllegalStateException}），避免运行时歧义。
 */
@Slf4j
@Configuration
public class AgentScopeConfig {

    /**
     * 收集所有模块注册的 AgentDefinition，合并为统一映射。
     *
     * @param registries 所有模块注册的 AgentDefinitionRegistry 实现
     * @return agentName → AgentDefinition 映射
     * @throws IllegalStateException 如果检测到同名 agent 定义冲突
     */
    @Bean
    public Map<String, AgentDefinition> agentDefinitions(List<AgentDefinitionRegistry> registries) {
        Map<String, AgentDefinition> merged = new HashMap<>();

        for (AgentDefinitionRegistry registry : registries) {
            Map<String, AgentDefinition> definitions = registry.getAllDefinitions();
            for (Map.Entry<String, AgentDefinition> entry : definitions.entrySet()) {
                String agentName = entry.getKey();
                AgentDefinition newDef = entry.getValue();

                if (merged.containsKey(agentName)) {
                    AgentDefinition existing = merged.get(agentName);
                    throw new IllegalStateException(
                            String.format("Agent 定义冲突: '%s' 被多个模块注册。" +
                                            "已注册: %s, 冲突来源: %s。请使用不同的 agent 名称前缀避免冲突。",
                                    agentName,
                                    existing.getClass().getSimpleName(),
                                    newDef.getClass().getSimpleName()));
                }

                merged.put(agentName, newDef);
                log.debug("注册 Agent 定义: {} (来自 {})", agentName, registry.getClass().getSimpleName());
            }
        }

        log.info("共注册 {} 个 Agent 定义: {}", merged.size(), merged.keySet());
        return Map.copyOf(merged);
    }
}
