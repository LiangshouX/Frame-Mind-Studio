package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

public record ScriptResponse(
        UUID id,
        UUID projectId,
        String title,
        JsonNode content,
        String formatType,
        int wordCount,
        int sceneCount,
        int episodeCount,
        int version,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
