package io.framemind.core.dto;

public record SettingsRequest(
        String provider,
        String apiKey
) {
}
