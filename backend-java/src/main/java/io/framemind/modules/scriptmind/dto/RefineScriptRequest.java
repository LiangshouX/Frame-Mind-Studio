package io.framemind.modules.scriptmind.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RefineScriptRequest(
        @NotNull UUID projectId,
        @NotBlank String inputType,
        @NotBlank String inputContent
) {
}
