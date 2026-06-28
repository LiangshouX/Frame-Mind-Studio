package io.framemind.agent.hook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.core.adapter.AgentWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

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

    // ─── 新增方法（Agent Enhancement）────────────────────────────────

    /**
     * 推送思考块事件。
     */
    public void onThinkingBlock(String sessionId, String blockId, String status, String content) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "thinking_block");

        ObjectNode data = root.putObject("data");
        data.put("block_id", blockId);
        data.put("status", status);
        data.put("content", content);

        send(sessionId, root);
    }

    /**
     * 推送工具调用事件。
     */
    public void onToolCall(String sessionId, String blockId, String status,
                           String toolName, String toolInput, String toolResult) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "tool_call");

        ObjectNode data = root.putObject("data");
        data.put("block_id", blockId);
        data.put("status", status);
        data.put("tool_name", toolName);
        if (toolInput != null) data.put("tool_input", toolInput);
        if (toolResult != null) data.put("tool_result", toolResult);

        send(sessionId, root);
    }

    /**
     * 推送工具执行结果事件。
     */
    public void onToolResult(String sessionId, String blockId, String toolName, String output) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "tool_result");

        ObjectNode data = root.putObject("data");
        data.put("block_id", blockId);
        data.put("tool_name", toolName);
        data.put("output", output);

        send(sessionId, root);
    }

    /**
     * 推送冲突检测事件。
     */
    public void onConflictDetected(String sessionId, String entityType, String entityId,
                                   int currentVersion, int expectedVersion) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "conflict_detected");

        ObjectNode data = root.putObject("data");
        data.put("entity_type", entityType);
        data.put("entity_id", entityId);
        data.put("current_version", currentVersion);
        data.put("expected_version", expectedVersion);
        data.put("message", String.format("%s 数据已被修改（当前版本 %d，期望版本 %d），请选择保留版本",
                entityType, currentVersion, expectedVersion));

        send(sessionId, root);
    }

    // ─── 保留的原有方法 ──────────────────────────────────────────────

    /**
     * 向客户端推送一段 Agent 输出流。
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
     */
    public void onComplete(String sessionId, Object result, int tokensConsumed) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "complete");

        ObjectNode data = root.putObject("data");
        data.put("session_id", sessionId);
        data.put("tokens_consumed", tokensConsumed);
        if (result != null) {
            data.set("result", objectMapper.valueToTree(result));
        }

        send(sessionId, root);
        log.info("Pipeline complete: session={}, tokens={}", sessionId, tokensConsumed);
    }

    /**
     * 通知客户端流水线遇到错误。
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
     */
    public void onHitlPrompt(String sessionId, String content, String... options) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "hitl_prompt");

        ObjectNode data = root.putObject("data");
        data.put("content", content);

        ArrayNode optionsArray = data.putArray("options");
        for (String option : options) {
            optionsArray.add(option);
        }

        send(sessionId, root);
        log.info("HITL prompt sent: session={}", sessionId);
    }

    /**
     * 直接发送原始 JSON 消息（用于 SyncEventProcessor）。
     */
    public void sendRawMessage(String sessionId, String json) {
        webSocketHandler.sendMessageToSession(sessionId, json);
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
