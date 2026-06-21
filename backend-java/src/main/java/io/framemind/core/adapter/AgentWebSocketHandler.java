package io.framemind.core.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Agent WebSocket 处理器，负责管理 WebSocket 连接生命周期，
 * 并向客户端推送 Agent 消息。
 *
 * <p>路径格式：/ws/agent/{session_id}</p>
 */
@Component
public class AgentWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(AgentWebSocketHandler.class);

    /** 按 session_id 分组的 WebSocket 会话集合 */
    private final Map<String, Set<WebSocketSession>> sessionsByProject = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * WebSocket 连接建立后的回调。
     * 从 URI 路径中提取 session_id 并将会话加入对应分组。
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = extractSessionId(session);
        if (sessionId == null) {
            log.warn("WebSocket 连接被拒绝：URI 路径中缺少 session_id ({})", session.getUri());
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        sessionsByProject.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("WebSocket 已连接: session_id={}, sessionId={}", sessionId, session.getId());
    }

    /**
     * WebSocket 连接关闭后的回调。
     * 从对应分组中移除该会话。
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = extractSessionId(session);
        if (sessionId != null) {
            Set<WebSocketSession> sessions = sessionsByProject.get(sessionId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    sessionsByProject.remove(sessionId);
                }
            }
            log.info("WebSocket 已断开: session_id={}, sessionId={}, status={}",
                    sessionId, session.getId(), status);
        }
    }

    /**
     * 收到客户端文本消息的回调。
     * 当前版本不处理客户端消息，仅用于日志记录。
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String sessionId = extractSessionId(session);
        log.debug("收到 session {} 的消息: {}", sessionId, message.getPayload());
    }

    /**
     * WebSocket 传输错误处理。
     * 客户端断开连接（如页面导航）属于正常情况，仅记录调试日志。
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String sessionId = extractSessionId(session);

        if (isClientDisconnect(exception)) {
            log.debug("WebSocket 客户端断开连接: session_id={}", sessionId);
        } else {
            log.error("WebSocket 传输错误, session {}: {}", sessionId, exception.getMessage(), exception);
        }

        if (session.isOpen()) {
            try {
                session.close(CloseStatus.NORMAL);
            } catch (Exception e) {
                log.debug("关闭 WebSocket 会话时出错: {}", e.getMessage());
            }
        }
    }

    /**
     * 判断异常是否为客户端主动断开连接（Connection reset、Broken pipe 等）。
     *
     * @param exception 异常对象
     * @return 如果是客户端断开则返回 true
     */
    private boolean isClientDisconnect(Throwable exception) {
        Throwable cause = exception;
        while (cause != null) {
            String msg = cause.getMessage();
            if (msg != null && (
                    msg.contains("Connection reset") ||
                    msg.contains("你的主机中的软件中止了一个已建立的连接") ||
                    msg.contains("Broken pipe") ||
                    msg.contains("Connection closed"))) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    /**
     * 向指定 session_id 的所有 WebSocket 客户端发送消息。
     *
     * @param sessionId 会话 ID
     * @param message   待发送的 JSON 字符串
     */
    public void sendMessageToSession(String sessionId, String message) {
        Set<WebSocketSession> sessions = sessionsByProject.get(sessionId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("session_id={} 没有活跃的 WebSocket 会话", sessionId);
            return;
        }

        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession ws : sessions) {
            if (ws.isOpen()) {
                try {
                    synchronized (ws) {
                        ws.sendMessage(textMessage);
                    }
                } catch (IOException e) {
                    log.error("向 WebSocket 会话 {} 发送消息失败: {}",
                            ws.getId(), e.getMessage(), e);
                }
            }
        }
    }

    /**
     * 向指定 session_id 的所有客户端广播对象数据（自动序列化为 JSON）。
     *
     * @param sessionId 会话 ID
     * @param data      待广播的数据对象
     */
    public void broadcastToSession(String sessionId, Object data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            sendMessageToSession(sessionId, json);
        } catch (Exception e) {
            log.error("序列化广播数据失败, session {}: {}",
                    sessionId, e.getMessage(), e);
        }
    }

    /**
     * 从 WebSocket URI 路径中提取 session_id。
     * 期望路径格式：/ws/agent/{session_id}
     *
     * @param session WebSocket 会话
     * @return session_id，如果路径不匹配则返回 null
     */
    private String extractSessionId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) {
            return null;
        }
        String path = uri.getPath();
        String[] segments = path.split("/");
        if (segments.length >= 4) {
            return segments[3];
        }
        return null;
    }
}
