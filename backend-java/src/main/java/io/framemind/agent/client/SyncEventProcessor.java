package io.framemind.agent.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.agent.hook.BudgetHook;
import io.framemind.agent.hook.StreamingHook;
import io.framemind.core.adapter.AgentWebSocketHandler;
import io.framemind.infrastructure.po.AgentMessagePO;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.repository.AgentMessageRepository;
import io.framemind.infrastructure.repository.AgentSessionRepository;
import io.framemind.modules.scriptmind.service.AgentSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OpenClaw 同步事件处理器。
 * <p>
 * 接收 OpenClaw 推送的 Webhook 事件，执行以下操作：
 * <ol>
 *   <li>幂等校验（eventId 去重）</li>
 *   <li>事件类型映射：OpenClaw event → WebSocket JSON</li>
 *   <li>消息持久化到 agent_messages 表</li>
 *   <li>通过 StreamingHook 推送到前端 WebSocket</li>
 *   <li>完成/错误事件触发会话状态更新和预算扣减</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SyncEventProcessor {

    private final AgentWebSocketHandler webSocketHandler;
    private final StreamingHook streamingHook;
    private final AgentMessageRepository messageRepository;
    private final AgentSessionRepository sessionRepository;
    private final AgentSessionService agentSessionService;
    private final BudgetHook budgetHook;
    private final ObjectMapper objectMapper;

    /** 已处理事件 ID 缓存（幂等去重） */
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

    /**
     * 处理来自 OpenClaw 的同步事件。
     *
     * @param event 同步事件请求
     */
    @Transactional
    public void process(SyncEventRequest event) {
        // 幂等校验
        if (event.eventId() != null && !processedEventIds.add(event.eventId())) {
            log.debug("重复事件，跳过: eventId={}", event.eventId());
            return;
        }

        log.debug("处理 OpenClaw 事件: session={}, task={}, event={}, eventId={}",
                event.sessionId(), event.taskId(), event.event(), event.eventId());

        try {
            switch (event.event()) {
                case "message.assistant" -> handleAssistantMessage(event);
                case "task.thinking" -> handleThinkingBlock(event);
                case "tool.call" -> handleToolCall(event);
                case "tool.result" -> handleToolResult(event);
                case "task.complete" -> handleTaskComplete(event);
                case "task.error" -> handleTaskError(event);
                case "task.received" -> log.debug("任务已接收: taskId={}", event.taskId());
                default -> log.warn("未知的 OpenClaw 事件类型: {}", event.event());
            }
        } catch (Exception e) {
            log.error("处理 OpenClaw 事件失败: event={}, sessionId={}",
                    event.event(), event.sessionId(), e);
        }
    }

    /**
     * 处理 AI 助手消息（流式文本输出）。
     */
    private void handleAssistantMessage(SyncEventRequest event) {
        String content = event.data() != null ? event.data().content() : "";
        if (content == null || content.isEmpty()) {
            return;
        }

        // 构建 WebSocket 消息（与 AgentEventBridge 格式一致）
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "stream_chunk");
        ObjectNode data = root.putObject("data");
        data.put("content", content);
        data.put("delta", true);

        sendWebSocket(event.sessionId(), root);

        // 持久化消息（追加到当前会话）
        persistMessage(event.sessionId(), event.taskId(), "assistant", content, "text");
    }

    /**
     * 处理思考块事件。
     */
    private void handleThinkingBlock(SyncEventRequest event) {
        String blockId = event.data() != null && event.data().blockId() != null
                ? event.data().blockId() : UUID.randomUUID().toString();
        String content = event.data() != null ? event.data().content() : "";
        String status = "delta"; // 默认 delta

        streamingHook.onThinkingBlock(event.sessionId(), blockId, status,
                content != null ? content : "");
    }

    /**
     * 处理工具调用事件。
     */
    private void handleToolCall(SyncEventRequest event) {
        String blockId = event.data() != null && event.data().blockId() != null
                ? event.data().blockId() : UUID.randomUUID().toString();
        String toolName = event.data() != null ? event.data().toolName() : "";
        String toolInput = event.data() != null ? event.data().toolInput() : null;

        streamingHook.onToolCall(event.sessionId(), blockId, "start",
                toolName != null ? toolName : "", toolInput, null);
    }

    /**
     * 处理工具执行结果事件。
     */
    private void handleToolResult(SyncEventRequest event) {
        String blockId = event.data() != null && event.data().blockId() != null
                ? event.data().blockId() : UUID.randomUUID().toString();
        String toolName = event.data() != null ? event.data().toolName() : "";
        String toolOutput = event.data() != null ? event.data().toolOutput() : "";

        streamingHook.onToolResult(event.sessionId(), blockId,
                toolName != null ? toolName : "", toolOutput != null ? toolOutput : "");
    }

    /**
     * 处理任务完成事件。
     */
    private void handleTaskComplete(SyncEventRequest event) {
        log.info("OpenClaw 任务完成: sessionId={}, taskId={}", event.sessionId(), event.taskId());

        try {
            UUID sessionId = UUID.fromString(event.sessionId());

            // 更新会话状态
            sessionRepository.findById(sessionId).ifPresent(session -> {
                session.setStatus("completed");
                session.setCompletedAt(LocalDateTime.now());

                // 从元数据中提取 token 消耗
                if (event.data() != null && event.data().metadata() != null) {
                    var metadata = event.data().metadata();
                    int totalTokens = metadata.has("total_tokens")
                            ? metadata.get("total_tokens").asInt(0) : 0;
                    session.setTokensConsumed(totalTokens);

                    // 预算扣减
                    if (totalTokens > 0) {
                        try {
                            UUID projectId = session.getProject().getId();
                            budgetHook.consumeTokens(projectId, totalTokens, event.sessionId());
                        } catch (Exception e) {
                            log.warn("预算扣减失败: sessionId={}", event.sessionId(), e);
                        }
                    }
                }

                sessionRepository.save(session);

                // 自动生成会话标题
                try {
                    agentSessionService.generateTitle(sessionId);
                } catch (Exception e) {
                    log.warn("自动生成标题失败: sessionId={}", event.sessionId(), e);
                }
            });

            // 推送完成事件到 WebSocket
            streamingHook.onComplete(event.sessionId(), "done", 0);

        } catch (Exception e) {
            log.error("处理任务完成事件失败: sessionId={}", event.sessionId(), e);
        }
    }

    /**
     * 处理任务错误事件。
     */
    private void handleTaskError(SyncEventRequest event) {
        String errorMessage = event.data() != null ? event.data().content() : "未知错误";
        log.error("OpenClaw 任务错误: sessionId={}, taskId={}, error={}",
                event.sessionId(), event.taskId(), errorMessage);

        try {
            UUID sessionId = UUID.fromString(event.sessionId());
            sessionRepository.findById(sessionId).ifPresent(session -> {
                session.setStatus("failed");
                session.setCompletedAt(LocalDateTime.now());
                sessionRepository.save(session);
            });
        } catch (Exception e) {
            log.error("更新会话状态失败: sessionId={}", event.sessionId(), e);
        }

        // 推送错误事件到 WebSocket
        streamingHook.onError(event.sessionId(), "OPENCLAW_ERROR", errorMessage);
    }

    /**
     * 持久化消息到 agent_messages 表。
     */
    private void persistMessage(String sessionId, String taskId, String role,
                                String content, String messageType) {
        try {
            UUID sessionUuid = UUID.fromString(sessionId);

            // 查找关联的会话
            AgentSessionPO session = sessionRepository.findById(sessionUuid).orElse(null);
            if (session == null) {
                log.warn("消息持久化跳过：会话不存在 sessionId={}", sessionId);
                return;
            }

            AgentMessagePO message = new AgentMessagePO();
            message.setSession(session);
            message.setRole(role);
            message.setContent(content);
            message.setMessageType(messageType);
            message.setAgentName(session.getAgentName() != null ? session.getAgentName() : "openclaw");

            // 计算消息顺序
            int maxOrder = messageRepository
                    .findMaxMessageOrderBySessionId(sessionUuid)
                    .orElse(-1);
            message.setMessageOrder(maxOrder + 1);

            messageRepository.save(message);
        } catch (Exception e) {
            log.warn("持久化消息失败: sessionId={}", sessionId, e);
        }
    }

    /**
     * 通过 WebSocket 发送 JSON 消息。
     */
    private void sendWebSocket(String sessionId, ObjectNode message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            webSocketHandler.sendMessageToSession(sessionId, json);
        } catch (Exception e) {
            log.error("发送 WebSocket 消息失败: session={}", sessionId, e);
        }
    }
}
