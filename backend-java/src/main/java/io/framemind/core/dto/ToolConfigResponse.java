package io.framemind.core.dto;

/**
 * Response containing a tool's configuration and status.
 */
public record ToolConfigResponse(
        String toolId,
        String name,
        boolean configured,
        String apiKeyPreview,
        String lastTested,
        String lastTestResult,
        String lastTestMessage
) {
}
