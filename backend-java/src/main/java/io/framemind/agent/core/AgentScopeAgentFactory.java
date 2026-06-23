package io.framemind.agent.core;

import io.agentscope.core.ReActAgent;
import io.agentscope.core.model.Model;
import io.agentscope.core.tool.Toolkit;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.tool.CharacterTool;
import io.framemind.agent.tool.OutlineTool;
import io.framemind.agent.tool.ScriptTool;
import io.framemind.agent.tool.SynopsisTool;
import io.framemind.agent.tool.WebSearchTool;
import io.framemind.core.service.AgentConfigService;
import io.framemind.core.service.ModelRouterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * AgentScope Agent 工厂，负责构建 {@link ReActAgent} 实例。
 * <p>
 * 根据 Agent 配置（全局 + 项目覆盖）构建带有正确工具、系统提示和模型的 Agent。
 * 使用 {@link ModelRouterService} 构建 Model 实例，直接传递给 ReActAgent。
 */
@Slf4j
@Component
public class AgentScopeAgentFactory {

    private final AgentConfigService agentConfigService;
    private final JpaAgentStateStore stateStore;
    private final ModelRouterService modelRouterService;
    private final WebSearchTool webSearchTool;
    private final CharacterTool characterTool;
    private final SynopsisTool synopsisTool;
    private final OutlineTool outlineTool;
    private final ScriptTool scriptTool;

    public AgentScopeAgentFactory(AgentConfigService agentConfigService,
                                  JpaAgentStateStore stateStore,
                                  ModelRouterService modelRouterService,
                                  WebSearchTool webSearchTool,
                                  CharacterTool characterTool,
                                  SynopsisTool synopsisTool,
                                  OutlineTool outlineTool,
                                  ScriptTool scriptTool) {
        this.agentConfigService = agentConfigService;
        this.stateStore = stateStore;
        this.modelRouterService = modelRouterService;
        this.webSearchTool = webSearchTool;
        this.characterTool = characterTool;
        this.synopsisTool = synopsisTool;
        this.outlineTool = outlineTool;
        this.scriptTool = scriptTool;
    }

    /**
     * 构建一个配置好的 ReActAgent 实例。
     *
     * @param projectId  项目 ID（用于加载项目级配置覆盖）
     * @param agentName  Agent 名称（如 creative_agent、synopsis_agent 等）
     * @param definition Agent 定义（系统提示、最大迭代次数等）
     * @param providerId 供应商 ID（可选，为 null 时使用默认）
     * @param modelName  模型名称（可选，为 null 时使用默认）
     * @return 配置好的 ReActAgent
     */
    public ReActAgent buildAgent(java.util.UUID projectId, String agentName,
                                  AgentDefinition definition,
                                  String providerId, String modelName) {
        log.info("构建 Agent: projectId={}, agentName={}, provider={}, model={}",
                projectId, agentName, providerId, modelName);

        // 加载合并后的配置（全局 + 项目覆盖）
        AgentConfigService.MergedAgentConfig config = agentConfigService.loadConfig(projectId, agentName);

        // 构建 Toolkit，注册该 Agent 需要的工具
        Toolkit toolkit = buildToolkit(agentName);

        // 获取系统提示（优先使用项目覆盖）
        String sysPrompt = config.systemPrompt() != null ? config.systemPrompt() : definition.systemPrompt();

        // 构建 Model 实例
        Model model = resolveModel(config, definition, providerId, modelName);
        log.info("使用模型: provider={}, model={}", providerId, modelName);

        // 构建 Agent
        ReActAgent agent = ReActAgent.builder()
                .name(agentName)
                .sysPrompt(sysPrompt)
                .toolkit(toolkit)
                .maxIters(definition.maxIterations())
                .stateStore(stateStore)
                .model(model)
                .build();

        log.info("Agent 构建完成: {}", agentName);
        return agent;
    }

    /**
     * 兼容旧调用方式（不指定模型）。
     */
    public ReActAgent buildAgent(java.util.UUID projectId, String agentName, AgentDefinition definition) {
        return buildAgent(projectId, agentName, definition, null, null);
    }

    /**
     * 解析并构建 Model 实例。
     * 优先级：请求指定 > 配置覆盖 > 默认模型
     */
    private Model resolveModel(AgentConfigService.MergedAgentConfig config,
                                AgentDefinition definition,
                                String requestProviderId, String requestModelName) {
        // 1. 请求中指定的模型（用户在 UI 选择的）
        if (requestProviderId != null && !requestProviderId.isBlank()
                && requestModelName != null && !requestModelName.isBlank()) {
            try {
                return modelRouterService.buildModel(requestProviderId, requestModelName);
            } catch (Exception e) {
                log.warn("请求指定的模型构建失败: {}:{}, 尝试备选", requestProviderId, requestModelName, e);
            }
        }

        // 2. 配置覆盖中的模型
        if (config.modelOverride() != null && !config.modelOverride().isBlank()) {
            try {
                // modelOverride 格式可能是 "provider:model" 或仅 "model"
                String override = config.modelOverride();
                if (override.contains(":")) {
                    String[] parts = override.split(":", 2);
                    return modelRouterService.buildModel(parts[0], parts[1]);
                }
                // 如果没有 provider 前缀，尝试从默认模型获取 provider
                ModelRouterService.ModelSelection defaultSel = modelRouterService.getDefaultModelSelection();
                if (defaultSel != null) {
                    return modelRouterService.buildModel(defaultSel.providerId(), override);
                }
            } catch (Exception e) {
                log.warn("配置覆盖模型构建失败: {}", config.modelOverride(), e);
            }
        }

        // 3. Agent 定义中的模型
        if (definition.modelProvider() != null && definition.modelName() != null) {
            try {
                return modelRouterService.buildModel(definition.modelProvider(), definition.modelName());
            } catch (Exception e) {
                log.warn("Agent 定义模型构建失败: {}:{}", definition.modelProvider(), definition.modelName(), e);
            }
        }

        // 4. 默认模型（首个可用供应商的首个模型）
        ModelRouterService.ModelSelection defaultSel = modelRouterService.getDefaultModelSelection();
        if (defaultSel != null) {
            try {
                return modelRouterService.buildModel(defaultSel.providerId(), defaultSel.modelName());
            } catch (Exception e) {
                log.warn("默认模型构建失败: {}:{}", defaultSel.providerId(), defaultSel.modelName(), e);
            }
        }

        throw new IllegalStateException(
                "没有可用的模型配置。请在设置页面配置至少一个模型供应商的 API Key。");
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
