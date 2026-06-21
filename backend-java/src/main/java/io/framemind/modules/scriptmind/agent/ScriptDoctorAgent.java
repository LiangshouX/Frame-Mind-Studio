package io.framemind.modules.scriptmind.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.orchestration.AgentCallAdapter;
import io.framemind.modules.scriptmind.dto.OptimizeSegmentResponse;
import io.framemind.modules.scriptmind.po.ForeshadowPO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * Script Doctor agent: reviews script content for quality, consistency,
 * and provides optimization suggestions. Also handles segment-level optimization.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScriptDoctorAgent {

    private final AgentCallAdapter agentCallAdapter;
    private final ObjectMapper objectMapper;

    /**
     * Review a script for quality issues and provide suggestions.
     *
     * @param scriptContent the full script content (ScriptContent JSON)
     * @param foreshadows   list of foreshadow elements to check for resolution
     * @param onChunk       streaming callback for partial output
     * @return a JsonNode containing the review report
     */
    public JsonNode reviewScript(JsonNode scriptContent, List<ForeshadowPO> foreshadows,
                                  Consumer<String> onChunk) {
        log.info("ScriptDoctorAgent reviewing script, foreshadows={}", foreshadows.size());

        String prompt = buildReviewPrompt(scriptContent, foreshadows);
        AgentDefinition definition = new AgentDefinition(
                "script_doctor",
                "你是一位资深剧本审校专家（Script Doctor），专门负责评估剧本质量、发现逻辑漏洞、"
                        + "优化叙事节奏、检查伏笔回收情况。你的审校报告必须具体、有建设性，并给出可操作的修改建议。"
                        + "请始终以 JSON 格式输出。",
                5
        );

        try {
            String response = agentCallAdapter.call(definition, prompt, onChunk);
            return objectMapper.readTree(response);
        } catch (Exception e) {
            log.error("ScriptDoctorAgent failed to review script", e);
            return buildFallbackReview();
        }
    }

    /**
     * Optimize a specific segment (dialogue, action, scene heading, etc.).
     *
     * @param text        the original text to optimize
     * @param elementType the type of element ("dialogue", "action", "scene_heading", etc.)
     * @param context     surrounding context for the segment
     * @param onChunk     streaming callback for partial output
     * @return an OptimizeSegmentResponse with alternative suggestions
     */
    public OptimizeSegmentResponse optimizeSegment(String text, String elementType,
                                                    String context, Consumer<String> onChunk) {
        log.info("ScriptDoctorAgent optimizing segment: type={}", elementType);

        String prompt = buildOptimizePrompt(text, elementType, context);
        AgentDefinition definition = new AgentDefinition(
                "script_doctor",
                "你是一位剧本润色专家，擅长优化剧本中的具体片段。"
                        + "你需要提供 2-3 个不同风格的优化方案，每个方案都要说明优化理由。"
                        + "请始终以 JSON 格式输出。",
                3
        );

        try {
            String response = agentCallAdapter.call(definition, prompt, onChunk);
            JsonNode result = objectMapper.readTree(response);
            return parseOptimizeResponse(result);
        } catch (Exception e) {
            log.error("ScriptDoctorAgent failed to optimize segment", e);
            return buildFallbackOptimizeResponse(text);
        }
    }

    // ─── Prompt Builders ────────────────────────────────────────────

    private String buildReviewPrompt(JsonNode scriptContent, List<ForeshadowPO> foreshadows) {
        StringBuilder foreshadowInfo = new StringBuilder();
        if (!foreshadows.isEmpty()) {
            foreshadowInfo.append("\n## 伏笔列表\n");
            for (ForeshadowPO f : foreshadows) {
                foreshadowInfo.append(String.format("- [%s] %s (提示集数: %s, 紧急度: %s)\n",
                        f.getStatus(),
                        f.getPlant(),
                        f.getEpisodeHint() != null ? f.getEpisodeHint() : "未指定",
                        f.getUrgency()));
            }
        }

        return String.format("""
                请审校以下剧本的整体质量，提供详细的审校报告。

                ## 剧本内容
                %s
                %s

                ## 输出格式要求
                请严格按照以下 JSON schema 输出：

                {
                  "overall_score": 85,
                  "strengths": [
                    "优点1: 具体描述",
                    "优点2: 具体描述"
                  ],
                  "issues": [
                    {
                      "severity": "high/medium/low",
                      "location": "问题所在位置（集数/场景/节拍）",
                      "category": "逻辑/节奏/角色/对白/伏笔/结构",
                      "description": "问题详细描述",
                      "suggestion": "修改建议"
                    }
                  ],
                  "suggestions": [
                    "全局建议1: 具体可操作的改进方向",
                    "全局建议2: 具体可操作的改进方向"
                  ],
                  "foreshadow_status": {
                    "total": %d,
                    "resolved": 已回收数,
                    "unresolved": 未回收数,
                    "unresolved_list": ["未回收伏笔描述1", "未回收伏笔描述2"],
                    "recommendations": ["伏笔回收建议"]
                  },
                  "rhythm_analysis": {
                    "pacing": "节奏评价",
                    "tension_curve": "张力曲线评价",
                    "suggestions": ["节奏优化建议"]
                  }
                }

                ## 审校要点
                1. 检查情节逻辑是否自洽
                2. 评估叙事节奏是否合理（是否前松后紧或前紧后松）
                3. 检查角色行为是否符合其设定
                4. 评估对白质量（是否自然、有特色）
                5. 检查伏笔的埋设和回收情况
                6. 发现潜在的剧情漏洞
                7. 评分范围 0-100，60 以下为不合格，60-75 为合格，75-85 为良好，85 以上为优秀

                请只输出 JSON，不要包含额外说明。
                """,
                scriptContent.toString(),
                foreshadowInfo.toString(),
                foreshadows.size());
    }

    private String buildOptimizePrompt(String text, String elementType, String context) {
        return String.format("""
                请优化以下剧本片段。

                ## 元素类型
                %s

                ## 上下文
                %s

                ## 原文
                %s

                ## 输出格式要求
                请严格按照以下 JSON schema 输出：

                {
                  "alternatives": [
                    {
                      "text": "优化后的文本",
                      "style": "风格标签（如：口语化/文学化/幽默/紧张/煽情）",
                      "reason": "优化理由说明"
                    }
                  ]
                }

                ## 要求
                1. 提供 2-3 个不同风格的优化方案
                2. 保持原文的核心意思不变
                3. 根据元素类型调整语言风格：
                   - dialogue（对白）：注重口语化、角色特色
                   - action（动作）：注重画面感、节奏感
                   - scene_heading（场景标题）：注重简洁规范
                   - 其他：根据上下文自动判断
                4. 每个方案必须有明确的优化理由
                5. 请只输出 JSON，不要包含额外说明
                """,
                elementType != null ? elementType : "dialogue",
                context != null ? context : "无特定上下文",
                text);
    }

    // ─── Response Parsers ───────────────────────────────────────────

    private OptimizeSegmentResponse parseOptimizeResponse(JsonNode result) {
        List<OptimizeSegmentResponse.Alternative> alternatives = new ArrayList<>();

        if (result.has("alternatives") && result.get("alternatives").isArray()) {
            for (JsonNode alt : result.get("alternatives")) {
                alternatives.add(new OptimizeSegmentResponse.Alternative(
                        alt.has("text") ? alt.get("text").asText("") : "",
                        alt.has("style") ? alt.get("style").asText("") : "默认",
                        alt.has("reason") ? alt.get("reason").asText("") : ""
                ));
            }
        }

        if (alternatives.isEmpty()) {
            // Try parsing as a flat structure
            if (result.has("text")) {
                alternatives.add(new OptimizeSegmentResponse.Alternative(
                        result.get("text").asText(""),
                        result.has("style") ? result.get("style").asText("默认") : "默认",
                        result.has("reason") ? result.get("reason").asText("") : ""
                ));
            }
        }

        return new OptimizeSegmentResponse(alternatives);
    }

    // ─── Fallback Builders ──────────────────────────────────────────

    private JsonNode buildFallbackReview() {
        var root = objectMapper.createObjectNode();
        root.put("overall_score", 60);

        var strengths = objectMapper.createArrayNode();
        strengths.add("剧本基本框架完整");
        root.set("strengths", strengths);

        var issues = objectMapper.createArrayNode();
        var issue = objectMapper.createObjectNode();
        issue.put("severity", "low");
        issue.put("location", "整体");
        issue.put("category", "结构");
        issue.put("description", "自动审校未能完成详细分析，建议人工复审");
        issue.put("suggestion", "请检查剧本结构和角色一致性");
        issues.add(issue);
        root.set("issues", issues);

        var suggestions = objectMapper.createArrayNode();
        suggestions.add("建议进行人工审校以获取更详细的反馈");
        root.set("suggestions", suggestions);

        var foreshadowStatus = objectMapper.createObjectNode();
        foreshadowStatus.put("total", 0);
        foreshadowStatus.put("resolved", 0);
        foreshadowStatus.put("unresolved", 0);
        foreshadowStatus.set("unresolved_list", objectMapper.createArrayNode());
        foreshadowStatus.set("recommendations", objectMapper.createArrayNode());
        root.set("foreshadow_status", foreshadowStatus);

        return root;
    }

    private OptimizeSegmentResponse buildFallbackOptimizeResponse(String originalText) {
        List<OptimizeSegmentResponse.Alternative> alternatives = new ArrayList<>();
        alternatives.add(new OptimizeSegmentResponse.Alternative(
                originalText,
                "保持原文",
                "自动优化未能生成替代方案，建议人工调整"
        ));
        return new OptimizeSegmentResponse(alternatives);
    }
}
