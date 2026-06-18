package io.framemind.core.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

/**
 * Request to save or update a tool configuration (e.g., Tavily).
 */
public record ToolConfigRequest(
        @NotBlank String apiKey,
        Map<String, String> parameters
) {
}
