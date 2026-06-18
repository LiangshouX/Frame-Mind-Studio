package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotNull;

public record ScriptUpdateRequest(
        @NotNull JsonNode content,
        String changeSummary
) {
}
