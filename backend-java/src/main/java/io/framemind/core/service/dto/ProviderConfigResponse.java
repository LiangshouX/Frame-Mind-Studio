package io.framemind.core.service.dto;

import java.util.List;

/**
 * Response containing a model provider's configuration and status.
 */
public record ProviderConfigResponse(
        String id,
        String name,
        boolean configured,
        String apiKeyPreview,
        String baseUrl,
        List<String> models,
        String defaultModel,
        String lastTested,
        String lastTestResult,
        String lastTestMessage
) {
}
