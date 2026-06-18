package io.framemind.modules.scriptmind.dto;

import java.util.List;

public record ForeshadowListResponse(
        List<ForeshadowResponse> items,
        int total,
        long unresolved
) {
}
