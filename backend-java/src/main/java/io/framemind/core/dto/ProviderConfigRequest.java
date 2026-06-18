package io.framemind.core.dto;

import java.util.List;

/**
 * Request to save or update a model provider configuration.
 * {@code apiKey} is optional on update — if null/blank/placeholder, the existing key is kept.
 */
public record ProviderConfigRequest(
        String apiKey,
        String baseUrl,
        List<String> models,
        String defaultModel
) {
}
