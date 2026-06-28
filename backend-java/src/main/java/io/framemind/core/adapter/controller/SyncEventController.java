package io.framemind.core.adapter.controller;

import io.framemind.agent.client.SyncEventProcessor;
import io.framemind.agent.client.SyncEventRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * OpenClaw 会话同步 Webhook 接收端点。
 * <p>
 * OpenClaw 通过 POST /api/v1/internal/sync/session 推送实时事件。
 * Java 接收后：持久化 → WebSocket 转发 → 更新会话状态。
 * <p>
 * 幂等设计：相同 eventId 不重复处理。
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/internal/sync")
@RequiredArgsConstructor
public class SyncEventController {

    private final SyncEventProcessor syncEventProcessor;

    /**
     * 接收 OpenClaw 推送的同步事件。
     *
     * @param event 同步事件请求体
     * @return 确认响应
     */
    @PostMapping("/session")
    public ResponseEntity<Map<String, String>> sync(@RequestBody SyncEventRequest event) {
        log.debug("收到 OpenClaw 同步事件: session={}, event={}, eventId={}",
                event.sessionId(), event.event(), event.eventId());

        syncEventProcessor.process(event);

        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
