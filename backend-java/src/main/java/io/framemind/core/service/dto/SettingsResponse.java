package io.framemind.core.service.dto;

public record SettingsResponse(
        String provider,
        String keyPreview,
        boolean configured
) {
}
