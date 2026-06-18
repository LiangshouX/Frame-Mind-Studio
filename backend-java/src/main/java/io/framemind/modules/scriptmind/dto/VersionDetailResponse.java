package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

public record VersionDetailResponse(
        UUID id,
        int version,
        JsonNode content,
        String message,
        LocalDateTime createdAt
) {
}
