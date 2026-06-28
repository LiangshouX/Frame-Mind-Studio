package io.framemind.agent.client;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * OpenClaw 任务同步响应 DTO。
 *
 * @param taskId      任务 ID
 * @param sessionId   会话 ID
 * @param status      状态：success / error / timeout
 * @param result      结构化结果
 * @param usedSkills  本次使用的 skills 列表
 * @param tokenUsage  token 消耗统计
 */
public record OpenClawTaskResponse(
        String taskId,
        String sessionId,
        String status,
        JsonNode result,
        List<String> usedSkills,
        TokenUsage tokenUsage
) {
    /**
     * Token 消耗统计。
     *
     * @param promptTokens     输入 token 数
     * @param completionTokens 输出 token 数
     * @param totalTokens      总 token 数
     */
    public record TokenUsage(int promptTokens, int completionTokens, int totalTokens) {}
}
