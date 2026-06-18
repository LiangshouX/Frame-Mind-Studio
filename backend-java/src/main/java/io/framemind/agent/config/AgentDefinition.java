package io.framemind.agent.config;

/**
 * Immutable definition of an AI agent within the FrameMind pipeline.
 *
 * @param name           unique agent identifier (e.g. "showrunner", "world_builder")
 * @param systemPrompt   the system prompt that governs the agent's behaviour
 * @param maxIterations  maximum ReAct iterations the agent may perform per invocation
 * @param modelProvider  optional provider override (e.g. "deepseek"); null = use default
 * @param modelName      optional model name override (e.g. "deepseek-chat"); null = use provider default
 */
public record AgentDefinition(
        String name,
        String systemPrompt,
        int maxIterations,
        String modelProvider,
        String modelName
) {
    /**
     * Convenience constructor without model overrides (backward compatible).
     */
    public AgentDefinition(String name, String systemPrompt, int maxIterations) {
        this(name, systemPrompt, maxIterations, null, null);
    }
}
