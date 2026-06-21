package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * 角色更新请求 DTO。
 */
public record CharacterUpdateRequest(
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
        String overview
) {
}
