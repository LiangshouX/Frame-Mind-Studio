package io.framemind.agent.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * OpenClaw → Java 的同步事件请求体。
 * <p>
 * OpenClaw 在处理任务过程中，通过 Webhook 推送实时事件到 Java。
 *
 * @param sessionId 会话 ID
 * @param taskId    任务 ID
 * @param eventId   幂等键（唯一事件标识）
 * @param event     事件类型
 * @param timestamp 事件时间戳（ISO 8601）
 * @param data      事件数据
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SyncEventRequest(
        String sessionId,
        String taskId,
        String eventId,
        String event,
        String timestamp,
        SyncEventData data
) {
    /**
     * 同步事件的数据载荷。
     *
     * @param role      消息角色（user / assistant）
     * @param content   消息内容
     * @param toolName  工具名称（tool.call / tool.result 事件）
     * @param toolInput 工具输入参数
     * @param toolOutput 工具执行输出
     * @param blockId   块 ID（用于 thinking_block / tool_call 等）
     * @param metadata  额外元数据
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SyncEventData(
            String role,
            String content,
            String toolName,
            String toolInput,
            String toolOutput,
            String blockId,
            JsonNode metadata
    ) {}
}
