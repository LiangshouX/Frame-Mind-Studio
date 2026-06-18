package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

public record CharacterResponse(
        UUID id,
        String name,
        String role,
        String description,
        JsonNode personality,
        String appearance,
        String background,
        String goals,
        JsonNode relationships,
        String dialogueStyle,
        String arc,
        LocalDateTime createdAt
) {
}
