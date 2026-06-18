package io.framemind.core.dto;

public record SettingsResponse(
        String provider,
        String keyPreview,
        boolean configured
) {
}
