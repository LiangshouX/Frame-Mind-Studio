package io.framemind.modules.scriptmind.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ImportFileRequest(
        @NotNull UUID projectId
) {
}
