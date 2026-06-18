package io.framemind.modules.scriptmind.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ImportUrlRequest(
        @NotNull UUID projectId,
        @NotBlank String url
) {
}
