package io.framemind.core.service.dto;

import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.modules.scriptmind.dto.ScriptResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String title,
        List<String> genre,
        String format,
        String description,
        String status,
        int targetEpisodes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        ScriptResponse script,
        List<Object> characters,
        List<Object> foreshadows,
        ProjectBudgetResponse budget
) {
    public static ProjectResponse from(ProjectPO project) {
        return new ProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getGenre(),
                project.getFormat(),
                project.getDescription(),
                project.getStatus(),
                project.getTargetEpisodes(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                null,
                List.of(),
                List.of(),
                null
        );
    }

    public static ProjectResponse from(ProjectPO project,
                                        ScriptResponse script,
                                        List<?> characters,
                                        List<?> foreshadows,
                                        ProjectBudgetResponse budget) {
        return new ProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getGenre(),
                project.getFormat(),
                project.getDescription(),
                project.getStatus(),
                project.getTargetEpisodes(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                script,
                List.copyOf(characters),
                List.copyOf(foreshadows),
                budget
        );
    }

    public record ProjectBudgetResponse(
            UUID id,
            long tokenLimit,
            long tokensUsed,
            String warningThreshold
    ) {}
}
