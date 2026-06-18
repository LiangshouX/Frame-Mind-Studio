package io.framemind.agent.config;

/**
 * Immutable definition of an AI agent within the FrameMind pipeline.
 *
 * @param name           unique agent identifier (e.g. "showrunner", "world_builder")
 * @param systemPrompt   the system prompt that governs the agent's behaviour
 * @param maxIterations  maximum ReAct iterations the agent may perform per invocation
 */
public record AgentDefinition(
        String name,
        String systemPrompt,
        int maxIterations
) {}
