package io.framemind.agent.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.agentscope.core.event.AgentEndEvent;
import io.agentscope.core.event.AgentEvent;
import io.agentscope.core.event.TextBlockDeltaEvent;
import io.agentscope.core.event.ThinkingBlockDeltaEvent;
import io.agentscope.core.event.ThinkingBlockEndEvent;
import io.agentscope.core.event.ThinkingBlockStartEvent;
import io.agentscope.core.event.ToolCallDeltaEvent;
import io.agentscope.core.event.ToolCallEndEvent;
import io.agentscope.core.event.ToolCallStartEvent;
import io.agentscope.core.event.ToolResultEndEvent;
import io.agentscope.core.event.ToolResultStartEvent;
import io.framemind.agent.hook.StreamingHook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

/**
 * Agent 事件桥接器，将 AgentScope 的 {@link AgentEvent} 流转换为 WebSocket JSON 消息。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentEventBridge {

    private final StreamingHook streamingHook;
    private final ObjectMapper objectMapper;

    /**
     * 订阅 AgentEvent 流并转换为 WebSocket 消息推送给客户端。
     */
    public void bridge(String sessionId, String agentName, Flux<AgentEvent> eventFlux,
                       Consumer<Integer> onComplete) {
        AtomicReference<String> currentThinkingBlockId = new AtomicReference<>();
        AtomicReference<StringBuilder> thinkingContent = new AtomicReference<>(new StringBuilder());

        eventFlux.subscribe(
                event -> {
                    try {
                        handleEvent(sessionId, agentName, event,
                                currentThinkingBlockId, thinkingContent);
                    } catch (Exception e) {
                        log.error("处理 AgentEvent 失败: type={}, session={}",
                                event.getClass().getSimpleName(), sessionId, e);
                    }
                },
                error -> {
                    log.error("AgentEvent 流错误: session={}", sessionId, error);
                    streamingHook.onError(sessionId, "AGENT_ERROR", error.getMessage());
                },
                () -> {
                    log.info("AgentEvent 流完成: session={}", sessionId);
                    streamingHook.onComplete(sessionId, "done", 0);
                    onComplete.accept(0);
                }
        );
    }

    private void handleEvent(String sessionId, String agentName, AgentEvent event,
                             AtomicReference<String> currentThinkingBlockId,
                             AtomicReference<StringBuilder> thinkingContent) {

        if (event instanceof TextBlockDeltaEvent textDelta) {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "stream_chunk");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("content", textDelta.getDelta() != null ? textDelta.getDelta() : "");
            data.put("delta", true);
            sendWebSocket(sessionId, root);

        } else if (event instanceof ThinkingBlockStartEvent) {
            String blockId = UUID.randomUUID().toString();
            currentThinkingBlockId.set(blockId);
            thinkingContent.set(new StringBuilder());
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "thinking_block");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("block_id", blockId);
            data.put("status", "start");
            data.put("content", "");
            sendWebSocket(sessionId, root);

        } else if (event instanceof ThinkingBlockDeltaEvent thinkingDelta) {
            String delta = thinkingDelta.getDelta() != null ? thinkingDelta.getDelta() : "";
            thinkingContent.get().append(delta);
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "thinking_block");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("block_id", currentThinkingBlockId.get());
            data.put("status", "delta");
            data.put("content", delta);
            sendWebSocket(sessionId, root);

        } else if (event instanceof ThinkingBlockEndEvent) {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "thinking_block");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("block_id", currentThinkingBlockId.get());
            data.put("status", "end");
            data.put("content", thinkingContent.get().toString());
            sendWebSocket(sessionId, root);
            currentThinkingBlockId.set(null);

        } else if (event instanceof ToolCallStartEvent toolStart) {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "tool_call");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("block_id", UUID.randomUUID().toString());
            data.put("status", "start");
            data.put("tool_name", toolStart.getToolCallName() != null ? toolStart.getToolCallName() : "");
            sendWebSocket(sessionId, root);

        } else if (event instanceof ToolCallDeltaEvent toolDelta) {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "tool_call");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("status", "delta");
            data.put("tool_name", toolDelta.getToolCallName() != null ? toolDelta.getToolCallName() : "");
            sendWebSocket(sessionId, root);

        } else if (event instanceof ToolCallEndEvent toolEnd) {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "tool_call");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("status", "end");
            data.put("tool_name", toolEnd.getToolCallName() != null ? toolEnd.getToolCallName() : "");
            sendWebSocket(sessionId, root);

        } else if (event instanceof ToolResultStartEvent resultStart) {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "tool_result");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("block_id", UUID.randomUUID().toString());
            data.put("tool_name", resultStart.getToolCallName() != null ? resultStart.getToolCallName() : "");
            data.put("status", "start");
            sendWebSocket(sessionId, root);

        } else if (event instanceof ToolResultEndEvent resultEnd) {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("type", "tool_result");
            ObjectNode data = root.putObject("data");
            data.put("agent_name", agentName);
            data.put("tool_name", resultEnd.getToolCallName() != null ? resultEnd.getToolCallName() : "");
            data.put("output", resultEnd.getState() != null ? resultEnd.getState().toString() : "");
            data.put("status", "end");
            sendWebSocket(sessionId, root);

        } else if (event instanceof AgentEndEvent) {
            log.info("Agent 执行完成: session={}, agent={}", sessionId, agentName);
        }
    }

    private void sendWebSocket(String sessionId, ObjectNode message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            streamingHook.sendRawMessage(sessionId, json);
        } catch (Exception e) {
            log.error("发送 WebSocket 消息失败: session={}", sessionId, e);
        }
    }
}
