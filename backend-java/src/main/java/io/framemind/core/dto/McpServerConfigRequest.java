package io.framemind.core.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request to save or update an MCP server configuration.
 */
public record McpServerConfigRequest(
        @NotBlank String name,
        @NotBlank String url,
        String authType,
        String credentials
) {
}
