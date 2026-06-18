package io.framemind.modules.scriptmind.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewRequest(
        @NotBlank String action,
        String feedback
) {
}
