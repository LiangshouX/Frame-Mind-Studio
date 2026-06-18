package io.framemind.core.websocket;

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
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AgentWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(AgentWebSocketHandler.class);

    private final Map<String, Set<WebSocketSession>> sessionsByProject = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = extractSessionId(session);
        if (sessionId == null) {
            log.warn("WebSocket connection rejected: no session_id in URI path ({})", session.getUri());
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        sessionsByProject.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("WebSocket connected: session_id={}, sessionId={}", sessionId, session.getId());
    }

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
            log.info("WebSocket disconnected: session_id={}, sessionId={}, status={}",
                    sessionId, session.getId(), status);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String sessionId = extractSessionId(session);
        log.debug("Received message on session {}: {}", sessionId, message.getPayload());
        // Client messages are not expected to be processed in v1.
        // This handler primarily pushes agent messages to the client.
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String sessionId = extractSessionId(session);

        // Connection resets from client disconnection are expected during page navigation
        if (isClientDisconnect(exception)) {
            log.debug("WebSocket client disconnected: session_id={}", sessionId);
        } else {
            log.error("WebSocket transport error on session {}: {}", sessionId, exception.getMessage(), exception);
        }

        if (session.isOpen()) {
            try {
                session.close(CloseStatus.NORMAL);
            } catch (Exception e) {
                log.debug("Error closing WebSocket session: {}", e.getMessage());
            }
        }
    }

    /**
     * Checks if the exception is a client-side disconnection (connection reset, broken pipe, etc.)
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

    public void sendMessageToSession(String sessionId, String message) {
        Set<WebSocketSession> sessions = sessionsByProject.get(sessionId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("No active WebSocket sessions for session_id={}", sessionId);
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
                    log.error("Failed to send WebSocket message to session {}: {}",
                            ws.getId(), e.getMessage(), e);
                }
            }
        }
    }

    public void broadcastToSession(String sessionId, Object data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            sendMessageToSession(sessionId, json);
        } catch (Exception e) {
            log.error("Failed to serialize broadcast data for session {}: {}",
                    sessionId, e.getMessage(), e);
        }
    }

    /**
     * Extracts the session_id from the WebSocket URI path.
     * Expected format: /ws/agent/{session_id}
     */
    private String extractSessionId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) {
            return null;
        }
        String path = uri.getPath();
        String[] segments = path.split("/");
        // Path: /ws/agent/{session_id} -> segments: ["", "ws", "agent", "{session_id}"]
        if (segments.length >= 4) {
            return segments[3];
        }
        return null;
    }
}
