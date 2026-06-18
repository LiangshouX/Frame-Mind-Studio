package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record CharacterUpdateRequest(
        String description,
        JsonNode personality,
        String appearance,
        String background,
        String goals,
        JsonNode relationships,
        String dialogueStyle,
        String arc
) {
}
