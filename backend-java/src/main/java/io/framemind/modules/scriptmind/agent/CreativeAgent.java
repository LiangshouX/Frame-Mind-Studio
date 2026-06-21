package io.framemind.modules.scriptmind.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.orchestration.AgentCallAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

/**
 * 创意对话 Agent：负责引导用户讨论创意和世界观设定。
 * 支持长期记忆、网络搜索和工具调用能力。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CreativeAgent {

    private final AgentCallAdapter agentCallAdapter;
    private final ObjectMapper objectMapper;

    /**
     * 生成世界观设定。
     *
     * @param projectId     项目 ID
     * @param conversationContext 对话上下文（用户输入和之前的讨论）
     * @param existingSetting 已有的世界观设定（可选，用于增量更新）
     * @param onChunk       流式输出回调
     * @return 世界观设定 JSON
     */
    public JsonNode generateWorldSetting(String projectId, String conversationContext,
                                          JsonNode existingSetting, Consumer<String> onChunk) {
        log.info("CreativeAgent generating world setting for project {}", projectId);

        String prompt = buildWorldSettingPrompt(conversationContext, existingSetting);
        AgentDefinition definition = new AgentDefinition(
                "creative",
                "你是「创意总监」Creative Agent。你的职责是：\n"
                        + "1. 引导用户讨论和明确创作创意与世界观设定\n"
                        + "2. 分析题材方向、时代背景、核心冲突、独特卖点\n"
                        + "3. 搜索当前市场上类似题材的作品以避免雷同\n"
                        + "4. 生成结构化的世界观设定文档\n\n"
                        + "输出格式要求：JSON 结构化世界观，包含 genre、style、era、setting、"
                        + "coreConflict、uniqueSellingPoint、worldRules、locations、themes 等字段。\n"
                        + "请始终以 JSON 格式输出，不要包含额外说明文字。",
                8
        );

        try {
            String response = agentCallAdapter.call(definition, prompt, onChunk);
            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("CreativeAgent failed to generate world setting", e);
            return buildFallbackWorldSetting(conversationContext);
        }
    }

    /**
     * 生成梗概。
     *
     * @param projectId       项目 ID
     * @param worldSetting    世界观设定
     * @param conversationContext 对话上下文
     * @param onChunk         流式输出回调
     * @return 梗概 JSON
     */
    public JsonNode generateSynopsis(String projectId, JsonNode worldSetting,
                                      String conversationContext, Consumer<String> onChunk) {
        log.info("CreativeAgent generating synopsis for project {}", projectId);

        String prompt = buildSynopsisPrompt(worldSetting, conversationContext);
        AgentDefinition definition = new AgentDefinition(
                "creative",
                "你是「创意总监」Creative Agent。你的职责是：\n"
                        + "1. 基于世界观设定生成作品的整体梗概\n"
                        + "2. 明确故事主线、核心冲突、主要转折点和结局走向\n"
                        + "3. 确保梗概与世界观设定一致\n\n"
                        + "输出格式要求：JSON 结构化梗概，包含 mainPlot、coreConflict、"
                        + "turningPoints、ending、themes 等字段。\n"
                        + "请始终以 JSON 格式输出，不要包含额外说明文字。",
                5
        );

        try {
            String response = agentCallAdapter.call(definition, prompt, onChunk);
            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("CreativeAgent failed to generate synopsis", e);
            return buildFallbackSynopsis(conversationContext);
        }
    }

    // ─── Prompt Builders ────────────────────────────────────────────

    private String buildWorldSettingPrompt(String conversationContext, JsonNode existingSetting) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("请根据以下对话讨论，生成一份结构化的世界观设定。\n\n");
        prompt.append("## 对话上下文\n").append(conversationContext).append("\n\n");

        if (existingSetting != null && !existingSetting.isNull()) {
            prompt.append("## 已有世界观设定（请在此基础上完善）\n");
            prompt.append(existingSetting.toString()).append("\n\n");
        }

        prompt.append("""
                ## 输出格式要求
                请严格按照以下 JSON schema 输出：

                {
                  "genre": "题材类型",
                  "style": "风格基调",
                  "era": "时代背景",
                  "setting": "世界观设定描述",
                  "coreConflict": "核心冲突",
                  "uniqueSellingPoint": "独特卖点",
                  "worldRules": ["世界观规则1", "规则2"],
                  "locations": [
                    {"name": "地点名称", "description": "地点描述"}
                  ],
                  "themes": ["主题1", "主题2"]
                }

                请只输出 JSON，不要包含额外说明。
                """);
        return prompt.toString();
    }

    private String buildSynopsisPrompt(JsonNode worldSetting, String conversationContext) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("请基于以下世界观设定，生成作品的整体梗概。\n\n");

        if (worldSetting != null && !worldSetting.isNull()) {
            prompt.append("## 世界观设定\n").append(worldSetting.toString()).append("\n\n");
        }

        prompt.append("## 对话上下文\n").append(conversationContext).append("\n\n");

        prompt.append("""
                ## 输出格式要求
                请严格按照以下 JSON schema 输出：

                {
                  "mainPlot": "故事主线描述",
                  "coreConflict": "核心冲突描述",
                  "turningPoints": [
                    "转折点1描述",
                    "转折点2描述",
                    "转折点3描述"
                  ],
                  "ending": "结局走向描述",
                  "themes": ["主题1", "主题2"]
                }

                请只输出 JSON，不要包含额外说明。
                """);
        return prompt.toString();
    }

    // ─── Fallback Builders ──────────────────────────────────────────

    private JsonNode buildFallbackWorldSetting(String conversationContext) {
        var root = objectMapper.createObjectNode();
        root.put("genre", "待确定");
        root.put("style", "待确定");
        root.put("era", "现代");
        root.put("setting", conversationContext != null ? conversationContext.substring(0, Math.min(conversationContext.length(), 200)) : "待设定");
        root.put("coreConflict", "待确定");
        root.put("uniqueSellingPoint", "待确定");
        root.set("worldRules", objectMapper.createArrayNode());
        root.set("locations", objectMapper.createArrayNode());
        root.set("themes", objectMapper.createArrayNode());
        return root;
    }

    private JsonNode buildFallbackSynopsis(String conversationContext) {
        var root = objectMapper.createObjectNode();
        root.put("mainPlot", conversationContext != null ? conversationContext.substring(0, Math.min(conversationContext.length(), 300)) : "待生成");
        root.put("coreConflict", "待确定");
        root.set("turningPoints", objectMapper.createArrayNode());
        root.put("ending", "待确定");
        root.set("themes", objectMapper.createArrayNode());
        return root;
    }
}
