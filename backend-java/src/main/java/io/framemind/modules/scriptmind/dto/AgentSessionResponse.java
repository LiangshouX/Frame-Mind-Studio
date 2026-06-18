package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

public record AgentSessionResponse(
        UUID id,
        String sessionType,
        String status,
        int tokensConsumed,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        JsonNode outputData
) {
}
