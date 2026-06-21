package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 角色响应 DTO。
 */
public record CharacterResponse(
        UUID id,
        String name,
        String gender,
        String role,
        String identity,
        String persona,
        String description,
        JsonNode personality,
        String appearance,
        String background,
        String goals,
        JsonNode relationships,
        String dialogueStyle,
        String arc,
        String overview,
        LocalDateTime createdAt
) {
}
