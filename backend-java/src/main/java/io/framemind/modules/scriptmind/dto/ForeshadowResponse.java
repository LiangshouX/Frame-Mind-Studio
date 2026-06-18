package io.framemind.modules.scriptmind.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ForeshadowResponse(
        UUID id,
        String plant,
        String payoff,
        Integer episodeHint,
        String status,
        String urgency,
        String characterId,
        String notes,
        LocalDateTime createdAt
) {
}
