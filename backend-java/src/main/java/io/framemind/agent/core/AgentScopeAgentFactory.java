package io.framemind.agent.core;

import io.agentscope.core.ReActAgent;
import io.agentscope.core.tool.Toolkit;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.tool.CharacterTool;
import io.framemind.agent.tool.OutlineTool;
import io.framemind.agent.tool.ScriptTool;
import io.framemind.agent.tool.SynopsisTool;
import io.framemind.agent.tool.WebSearchTool;
import io.framemind.core.service.AgentConfigService;
import io.framemind.core.service.ConfigFileStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * AgentScope Agent 工厂，负责构建 {@link ReActAgent} 实例。
 * <p>
 * 根据 Agent 配置（全局 + 项目覆盖）构建带有正确工具、系统提示和模型的 Agent。
 */
@Slf4j
@Component
public class AgentScopeAgentFactory {

    private final AgentConfigService agentConfigService;
    private final JpaAgentStateStore stateStore;
    private final WebSearchTool webSearchTool;
    private final CharacterTool characterTool;
    private final SynopsisTool synopsisTool;
    private final OutlineTool outlineTool;
    private final ScriptTool scriptTool;
    private final ConfigFileStore configFileStore;

    public AgentScopeAgentFactory(AgentConfigService agentConfigService,
                                  JpaAgentStateStore stateStore,
                                  WebSearchTool webSearchTool,
                                  CharacterTool characterTool,
                                  SynopsisTool synopsisTool,
                                  OutlineTool outlineTool,
                                  ScriptTool scriptTool,
                                  ConfigFileStore configFileStore) {
        this.agentConfigService = agentConfigService;
        this.stateStore = stateStore;
        this.webSearchTool = webSearchTool;
        this.characterTool = characterTool;
        this.synopsisTool = synopsisTool;
        this.outlineTool = outlineTool;
        this.scriptTool = scriptTool;
        this.configFileStore = configFileStore;
    }

    /**
     * 构建一个配置好的 ReActAgent 实例。
     *
     * @param projectId 项目 ID（用于加载项目级配置覆盖）
     * @param agentName Agent 名称（如 creative_agent、synopsis_agent 等）
     * @param definition Agent 定义（系统提示、最大迭代次数等）
     * @return 配置好的 ReActAgent
     */
    public ReActAgent buildAgent(java.util.UUID projectId, String agentName, AgentDefinition definition) {
        log.info("构建 Agent: projectId={}, agentName={}", projectId, agentName);

        // 加载合并后的配置（全局 + 项目覆盖）
        AgentConfigService.MergedAgentConfig config = agentConfigService.loadConfig(projectId, agentName);

        // 构建 Toolkit，注册该 Agent 需要的工具
        Toolkit toolkit = buildToolkit(agentName);

        // 获取系统提示（优先使用项目覆盖）
        String sysPrompt = config.systemPrompt() != null ? config.systemPrompt() : definition.systemPrompt();

        // 构建 Agent
        ReActAgent.Builder builder = ReActAgent.builder()
                .name(agentName)
                .sysPrompt(sysPrompt)
                .toolkit(toolkit)
                .maxIters(definition.maxIterations())
                .stateStore(stateStore);

        // 设置模型：优先使用配置覆盖，其次使用 Agent 定义的默认模型
        String modelId = resolveModelId(config, definition);
        builder.model(modelId);
        log.debug("使用模型: {}", modelId);

        ReActAgent agent = builder.build();
        log.info("Agent 构建完成: {}", agentName);
        return agent;
    }

    /**
     * 解析模型 ID：优先使用配置覆盖，其次使用 Agent 定义的默认模型。
     * 如果都没有，使用 dashscope:qwen-max 作为兜底。
     */
    private String resolveModelId(AgentConfigService.MergedAgentConfig config,
                                   AgentDefinition definition) {
        // 1. 项目级/全局配置覆盖
        if (config.modelOverride() != null && !config.modelOverride().isBlank()) {
            return config.modelOverride();
        }

        // 2. Agent 定义中的模型
        if (definition.modelProvider() != null && definition.modelName() != null) {
            return definition.modelProvider() + ":" + definition.modelName();
        }
        if (definition.modelName() != null) {
            return definition.modelName();
        }

        // 3. 兜底默认模型
        return "dashscope:qwen-max";
    }

    /**
     * 根据 Agent 名称构建对应的 Toolkit，注册相应的工具。
     */
    private Toolkit buildToolkit(String agentName) {
        Toolkit toolkit = new Toolkit();

        switch (agentName) {
            case "creative_agent" -> {
                toolkit.registerTool(webSearchTool);
            }
            case "synopsis_agent" -> {
                toolkit.registerTool(synopsisTool);
            }
            case "character_agent" -> {
                toolkit.registerTool(characterTool);
            }
            case "outline_agent" -> {
                toolkit.registerTool(outlineTool);
            }
            case "script_agent" -> {
                toolkit.registerTool(scriptTool);
            }
            default -> {
                log.warn("未知 Agent 名称，注册所有工具: {}", agentName);
                toolkit.registerTool(webSearchTool);
                toolkit.registerTool(characterTool);
                toolkit.registerTool(synopsisTool);
                toolkit.registerTool(outlineTool);
                toolkit.registerTool(scriptTool);
            }
        }

        return toolkit;
    }
}
