package io.framemind.core.dto;

/**
 * Result of a connectivity test for a provider, tool, or MCP server.
 */
public record ConnectivityTestResult(
        String id,
        String result,
        String message,
        String testedAt
) {
}
