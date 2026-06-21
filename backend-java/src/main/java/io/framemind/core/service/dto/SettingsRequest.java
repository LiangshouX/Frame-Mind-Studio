package io.framemind.core.service.dto;

public record SettingsRequest(
        String provider,
        String apiKey
) {
}
