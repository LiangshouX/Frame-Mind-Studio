package io.framemind.core.dto;

public record ModelInfo(
        String id,
        String provider,
        String name,
        String useCase,
        boolean configured
) {
}
