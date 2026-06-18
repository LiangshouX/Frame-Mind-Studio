package io.framemind.agent.hook;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.core.websocket.AgentWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Handles streaming agent output to clients via WebSocket.
 * <p>
 * All messages follow the JSON envelope defined in the API contracts:
 * <pre>
 * {
 *   "type": "&lt;message_type&gt;",
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

    /**
     * Known stage labels (Chinese) keyed by stage identifier.
     */
    private static final Map<String, String> STAGE_LABELS = Map.of(
            "showrunner", "主笔编剧",
            "world_builder", "世界观架构师",
            "character_designer", "角色设计师",
            "script_doctor", "剧本医生",
            "human_review", "人类审核"
    );

    /**
     * Notify clients that a pipeline stage has started.
     *
     * @param sessionId the agent session id
     * @param stage     the stage identifier (e.g. "showrunner")
     * @param status    the stage status (e.g. "started", "completed")
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
     * Stream a chunk of agent output to the client.
     *
     * @param sessionId the agent session id
     * @param stage     the producing stage identifier
     * @param content   the text chunk
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
     * Notify clients that the pipeline has completed successfully.
     *
     * @param sessionId       the agent session id
     * @param result          the final output data (will be serialized as JSON)
     * @param tokensConsumed  total tokens consumed across all stages
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
     * Notify clients that the pipeline encountered an error.
     *
     * @param sessionId the agent session id
     * @param errorCode a machine-readable error code (e.g. "RATE_LIMIT_EXCEEDED")
     * @param message   a human-readable description
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
     * Notify clients that the project is approaching its token budget limit.
     *
     * @param sessionId  the agent session id
     * @param tokensUsed cumulative tokens used for the project
     * @param tokenLimit the project's hard token limit
     * @param threshold  the warning threshold ratio (e.g. 0.80)
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
     * Notify clients that a human-in-the-loop review is required.
     *
     * @param sessionId the agent session id
     * @param content   the content to be reviewed
     * @param options   available review actions
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
