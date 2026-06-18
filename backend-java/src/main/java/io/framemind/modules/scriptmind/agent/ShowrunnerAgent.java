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
 * Showrunner agent: responsible for parsing creative input and generating
 * structured story outlines with episodes, scenes, and beats.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ShowrunnerAgent {

    private final AgentCallAdapter agentCallAdapter;
    private final ObjectMapper objectMapper;

    /**
     * Generate a structured outline from creative input content.
     *
     * @param inputContent   the raw creative input (idea, synopsis, uploaded text, etc.)
     * @param stylePreset    optional style preset (e.g. "revenge", "romance", "suspense")
     * @param targetEpisodes desired number of episodes
     * @param onChunk        streaming callback for partial output
     * @return a JsonNode representing the structured outline (ScriptContent schema)
     */
    public JsonNode generateOutline(String inputContent, String stylePreset,
                                     int targetEpisodes, Consumer<String> onChunk) {
        log.info("ShowrunnerAgent generating outline: style={}, episodes={}", stylePreset, targetEpisodes);

        String prompt = buildOutlinePrompt(inputContent, stylePreset, targetEpisodes);
        AgentDefinition definition = new AgentDefinition(
                "showrunner",
                "你是一位资深影视编剧总监（Showrunner），擅长将创意转化为结构化的剧本大纲。"
                        + "你精通短剧叙事节奏，擅长设计钩子、反转和情感高潮。"
                        + "请始终以 JSON 格式输出，严格遵循给定的 schema。",
                5
        );

        try {
            String response = agentCallAdapter.call(definition, prompt, onChunk);
            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("ShowrunnerAgent failed to generate outline", e);
            return buildFallbackOutline(inputContent, targetEpisodes);
        }
    }

    /**
     * Parse raw input content into a structured format ready for outline generation.
     *
     * @param inputContent the raw input text
     * @param inputType    the type of input ("idea", "synopsis", "uploaded_text")
     * @return a JsonNode representing the parsed input
     */
    public JsonNode parseInput(String inputContent, String inputType) {
        log.info("ShowrunnerAgent parsing input: type={}", inputType);

        String prompt = buildParsePrompt(inputContent, inputType);
        AgentDefinition definition = new AgentDefinition(
                "showrunner",
                "你是一位资深编剧助手，负责解析和结构化原始创意输入，以便后续大纲生成使用。",
                3
        );

        try {
            String response = agentCallAdapter.call(definition, prompt, chunk -> {});
            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("ShowrunnerAgent failed to parse input", e);
            return buildFallbackParsedInput(inputContent, inputType);
        }
    }

    // ─── Prompt Builders ────────────────────────────────────────────

    private String buildOutlinePrompt(String inputContent, String stylePreset, int targetEpisodes) {
        return String.format("""
                请根据以下创意输入生成一份结构化的剧本大纲。

                ## 创意输入
                %s

                ## 参数要求
                - 风格预设: %s
                - 目标集数: %d 集

                ## 输出格式要求
                请严格按照以下 JSON schema 输出，不要包含任何额外说明文字：

                {
                  "title": "剧集标题",
                  "totalEpisodes": %d,
                  "episodes": [
                    {
                      "episodeNumber": 1,
                      "title": "集标题",
                      "scenes": [
                        {
                          "sceneId": "S01E01_SC01",
                          "location": "场景地点",
                          "time": "日/夜",
                          "beats": [
                            {
                              "beatId": "S01E01_SC01_B01",
                              "type": "action/dialogue/scene_heading/cliffhanger/revelation/turning_point",
                              "content": "节拍内容描述",
                              "character": null,
                              "emotion": "情绪标签"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }

                ## 创作要求
                1. 每集至少 3-5 个场景
                2. 每个场景包含 3-6 个节拍（beat）
                3. 每集结尾设置钩子（cliffhanger）
                4. 注重节奏感：铺垫-发展-高潮-余韵
                5. 角色弧线要贯穿全剧
                6. 确保 sceneId 和 beatId 具有唯一性和可追溯性
                """,
                inputContent,
                stylePreset != null ? stylePreset : "默认（根据内容自动判断）",
                targetEpisodes,
                targetEpisodes);
    }

    private String buildParsePrompt(String inputContent, String inputType) {
        return String.format("""
                请解析以下创意输入内容，将其结构化以便后续大纲生成。

                ## 输入类型
                %s

                ## 原始内容
                %s

                ## 输出要求
                请以 JSON 格式输出结构化解析结果：

                {
                  "inputType": "%s",
                  "mainTheme": "核心主题",
                  "protagonist": "主角描述",
                  "conflict": "核心冲突",
                  "setting": "时代/背景设定",
                  "tone": "基调风格",
                  "keyElements": ["关键元素1", "关键元素2"],
                  "suggestedEpisodes": 建议集数,
                  "summary": "内容摘要"
                }

                请只输出 JSON，不要包含额外说明。
                """,
                describeInputType(inputType),
                inputContent,
                inputType);
    }

    private String describeInputType(String inputType) {
        return switch (inputType != null ? inputType : "idea") {
            case "idea" -> "创意点子 -- 简短的核心创意描述";
            case "synopsis" -> "故事梗概 -- 较为完整的故事概述";
            case "uploaded_text" -> "上传文本 -- 可能包含完整或部分故事内容";
            default -> inputType;
        };
    }

    // ─── Fallback Builders ──────────────────────────────────────────

    private JsonNode buildFallbackOutline(String inputContent, int targetEpisodes) {
        var root = objectMapper.createObjectNode();
        root.put("title", "未命名剧本");
        root.put("totalEpisodes", targetEpisodes);

        var episodes = objectMapper.createArrayNode();
        for (int i = 1; i <= targetEpisodes; i++) {
            var episode = objectMapper.createObjectNode();
            episode.put("episodeNumber", i);
            episode.put("title", "第" + i + "集");

            var scenes = objectMapper.createArrayNode();
            var scene = objectMapper.createObjectNode();
            scene.put("sceneId", String.format("S01E%02d_SC01", i));
            scene.put("location", "待定");
            scene.put("time", "日");

            var beats = objectMapper.createArrayNode();
            var beat = objectMapper.createObjectNode();
            beat.put("beatId", String.format("S01E%02d_SC01_B01", i));
            beat.put("type", "scene_heading");
            beat.put("content", i == 1 ? inputContent.substring(0, Math.min(inputContent.length(), 200)) : "待生成");
            beat.putNull("character");
            beat.put("emotion", "neutral");
            beats.add(beat);

            scene.set("beats", beats);
            scenes.add(scene);
            episode.set("scenes", scenes);
            episodes.add(episode);
        }
        root.set("episodes", episodes);
        return root;
    }

    private JsonNode buildFallbackParsedInput(String inputContent, String inputType) {
        var root = objectMapper.createObjectNode();
        root.put("inputType", inputType != null ? inputType : "idea");
        root.put("mainTheme", "待分析");
        root.put("protagonist", "待确定");
        root.put("conflict", "待确定");
        root.put("setting", "待确定");
        root.put("tone", "待确定");
        root.set("keyElements", objectMapper.createArrayNode());
        root.put("suggestedEpisodes", 3);
        root.put("summary", inputContent.substring(0, Math.min(inputContent.length(), 500)));
        return root;
    }
}
