package io.framemind.agent.client;

import java.util.List;
import java.util.Map;

/**
 * 发往 OpenClaw 的任务请求 DTO。
 *
 * @param sessionId  会话 ID（Java 生成）
 * @param taskId     任务 ID（Java 生成）
 * @param taskType   任务类型：worldview / synopsis / characters / outline / script
 * @param prompt     用户 prompt
 * @param parameters 业务参数（project_id, agent_name, system_prompt, model_* 等）
 * @param history    历史对话（最近 N 轮）
 */
public record OpenClawTaskRequest(
        String sessionId,
        String taskId,
        String taskType,
        String prompt,
        Map<String, Object> parameters,
        List<ChatMessage> history
) {
    /**
     * 单条对话消息。
     *
     * @param role    角色（user / assistant）
     * @param content 消息内容
     */
    public record ChatMessage(String role, String content) {}
}
