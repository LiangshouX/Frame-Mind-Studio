package io.framemind.modules.scriptmind.dto;

import java.util.List;

public record OptimizeSegmentResponse(
        List<Alternative> alternatives
) {
    public record Alternative(
            String text,
            String style,
            String reason
    ) {
    }
}
