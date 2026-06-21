package io.framemind.core.service.dto;

import java.util.List;

public record ProjectListResponse(
        List<ProjectResponse> items,
        int total
) {
}
