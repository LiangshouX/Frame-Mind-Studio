package io.framemind.modules.scriptmind.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record VersionResponse(
        UUID id,
        int version,
        String message,
        LocalDateTime createdAt
) {
}
