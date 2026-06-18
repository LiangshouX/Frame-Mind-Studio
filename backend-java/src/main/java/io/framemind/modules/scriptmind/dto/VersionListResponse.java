package io.framemind.modules.scriptmind.dto;

import java.util.List;

public record VersionListResponse(
        List<VersionResponse> items,
        int total
) {
}
