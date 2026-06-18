package io.framemind.core.dto;

import java.util.List;

public record ProjectListResponse(
        List<ProjectResponse> items,
        int total
) {
}
