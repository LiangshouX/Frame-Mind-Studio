package io.framemind.agent.config;

import java.util.List;
import java.util.Map;

/**
 * AI Agent 定义（适配 OpenClaw 格式）。
 *
 * @param name         唯一 agent 标识符（如 "creative_agent"、"script_agent"）
 * @param systemPrompt 系统提示词，决定 agent 的行为
 * @param taskType     OpenClaw 任务类型（worldview / synopsis / characters / outline / script）
 * @param skills       OpenClaw 需要使用的 skills 列表
 * @param agentParams  传递给 OpenClaw 的额外参数（如 max_iterations）
 */
public record AgentDefinition(
        String name,
        String systemPrompt,
        String taskType,
        List<String> skills,
        Map<String, Object> agentParams
) {
    /**
     * 向后兼容的三参数构造器（从原 AgentDefinition 迁移）。
     *
     * @param name          agent 名称
     * @param systemPrompt  系统提示词
     * @param maxIterations 最大迭代次数（存入 agentParams）
     */
    public AgentDefinition(String name, String systemPrompt, int maxIterations) {
        this(name, systemPrompt, name, List.of(), Map.of("max_iterations", maxIterations));
    }

    /**
     * 向后兼容的五参数构造器（保留 modelProvider/modelName 兼容）。
     *
     * @param name          agent 名称
     * @param systemPrompt  系统提示词
     * @param maxIterations 最大迭代次数
     * @param modelProvider 已废弃，忽略
     * @param modelName     已废弃，忽略
     */
    public AgentDefinition(String name, String systemPrompt, int maxIterations,
                           String modelProvider, String modelName) {
        this(name, systemPrompt, name, List.of(), Map.of("max_iterations", maxIterations));
    }
}
