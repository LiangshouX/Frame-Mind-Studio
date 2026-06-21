package io.framemind.agent.hook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.core.adapter.AgentWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 流式推送 Hook，负责将 Agent 输出通过 WebSocket 实时推送给客户端。
 *
 * <p>所有消息遵循 JSON 信封格式：
 * <pre>
 * {
 *   "type": "&lt;消息类型&gt;",
 *   "data": { ... }
 * }
 * </pre>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StreamingHook {

    private final AgentWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    /** 已知阶段标识到中文标签的映射。 */
    private static final Map<String, String> STAGE_LABELS = Map.of(
            "showrunner", "主笔编剧",
            "world_builder", "世界观架构师",
            "character_designer", "角色设计师",
            "script_doctor", "剧本医生",
            "human_review", "人类审核"
    );

    /**
     * 通知客户端某个流水线阶段已开始。
     *
     * @param sessionId Agent 会话 ID
     * @param stage     阶段标识（如 "showrunner"）
     * @param status    阶段状态（如 "started"、"completed"）
     */
    public void onStageStart(String sessionId, String stage, String status) {
        String stageLabel = STAGE_LABELS.getOrDefault(stage, stage);

        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "stage_update");

        ObjectNode data = root.putObject("data");
        data.put("stage", stage);
        data.put("stage_label", stageLabel);
        data.put("status", status);

        send(sessionId, root);
        log.debug("Stage update sent: session={}, stage={}, status={}", sessionId, stage, status);
    }

    /**
     * 向客户端推送一段 Agent 输出流。
     *
     * @param sessionId Agent 会话 ID
     * @param stage     产出该内容的阶段标识
     * @param content   文本片段
     */
    public void onStreamChunk(String sessionId, String stage, String content) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "stream_chunk");

        ObjectNode data = root.putObject("data");
        data.put("stage", stage);
        data.put("content", content);

        send(sessionId, root);
    }

    /**
     * 通知客户端流水线已成功完成。
     *
     * @param sessionId      Agent 会话 ID
     * @param result         最终输出数据（将序列化为 JSON）
     * @param tokensConsumed 所有阶段消耗的总 token 数
     */
    public void onComplete(String sessionId, Object result, int tokensConsumed) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "complete");

        ObjectNode data = root.putObject("data");
        data.put("session_id", sessionId);
        data.put("tokens_consumed", tokensConsumed);
        data.set("result", objectMapper.valueToTree(result));

        send(sessionId, root);
        log.info("Pipeline complete: session={}, tokens={}", sessionId, tokensConsumed);
    }

    /**
     * 通知客户端流水线遇到错误。
     *
     * @param sessionId Agent 会话 ID
     * @param errorCode 机器可读的错误码（如 "RATE_LIMIT_EXCEEDED"）
     * @param message   人类可读的错误描述
     */
    public void onError(String sessionId, String errorCode, String message) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "error");

        ObjectNode data = root.putObject("data");
        data.put("session_id", sessionId);
        data.put("error_code", errorCode);
        data.put("message", message);

        send(sessionId, root);
        log.warn("Pipeline error: session={}, code={}, message={}", sessionId, errorCode, message);
    }

    /**
     * 通知客户端项目的 token 预算即将耗尽。
     *
     * @param sessionId  Agent 会话 ID
     * @param tokensUsed 项目累计已使用的 token 数
     * @param tokenLimit 项目的 token 硬上限
     * @param threshold  警告阈值比例（如 0.80）
     */
    public void onBudgetWarning(String sessionId, long tokensUsed, long tokenLimit, double threshold) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "budget_warning");

        ObjectNode data = root.putObject("data");
        data.put("tokens_used", tokensUsed);
        data.put("token_limit", tokenLimit);
        data.put("threshold", threshold);
        data.put("message", String.format("Token 用量已达到预算的 %.0f%%", threshold * 100));

        send(sessionId, root);
        log.warn("Budget warning: session={}, used={}/{} (threshold={})",
                sessionId, tokensUsed, tokenLimit, threshold);
    }

    /**
     * 通知客户端需要进行人工审核（HITL）。
     *
     * @param sessionId Agent 会话 ID
     * @param content   待审核的内容
     * @param options   可选的审核动作
     */
    public void onHitlPrompt(String sessionId, String content, String... options) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "hitl_prompt");

        ObjectNode data = root.putObject("data");
        data.put("stage", "human_review");
        data.put("stage_label", STAGE_LABELS.getOrDefault("human_review", "人类审核"));
        data.put("content", content);

        ArrayNode optionsArray = data.putArray("options");
        for (String option : options) {
            optionsArray.add(option);
        }

        send(sessionId, root);
        log.info("HITL prompt sent: session={}", sessionId);
    }

    private void send(String sessionId, ObjectNode message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            webSocketHandler.sendMessageToSession(sessionId, json);
        } catch (Exception e) {
            log.error("Failed to send WebSocket message for session {}", sessionId, e);
        }
    }
}
