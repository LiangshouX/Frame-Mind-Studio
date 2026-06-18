package io.framemind.core.dto;

import io.framemind.core.model.Project;

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
        Object script,
        List<Object> characters,
        List<Object> foreshadows,
        ProjectBudgetResponse budget
) {
    public static ProjectResponse from(Project project) {
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
                null, // script loaded separately
                List.of(), // characters loaded separately
                List.of(), // foreshadows loaded separately
                null  // budget loaded separately
        );
    }

    public record ProjectBudgetResponse(
            UUID id,
            long tokenLimit,
            long tokensUsed,
            String warningThreshold
    ) {}
}
