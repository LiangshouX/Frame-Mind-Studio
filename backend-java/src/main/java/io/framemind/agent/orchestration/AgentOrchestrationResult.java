package io.framemind.agent.orchestration;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Immutable result returned by a completed agent orchestration pipeline.
 *
 * @param sessionId       the agent session identifier
 * @param status          terminal status: "completed" or "failed"
 * @param outputData      the structured output produced by the pipeline
 * @param tokensConsumed  total tokens consumed across all agent stages
 */
public record AgentOrchestrationResult(
        String sessionId,
        String status,
        JsonNode outputData,
        int tokensConsumed
) {

    /**
     * Factory method for a successful result.
     */
    public static AgentOrchestrationResult success(String sessionId, JsonNode outputData, int tokensConsumed) {
        return new AgentOrchestrationResult(sessionId, "completed", outputData, tokensConsumed);
    }

    /**
     * Factory method for a failed result.
     */
    public static AgentOrchestrationResult failure(String sessionId, String errorMessage) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.node.ObjectNode errorNode = mapper.createObjectNode();
        errorNode.put("error", errorMessage);
        return new AgentOrchestrationResult(sessionId, "failed", errorNode, 0);
    }
}
