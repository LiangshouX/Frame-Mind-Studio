package io.framemind.modules.scriptmind.dto;

public record QualityMetricsResponse(
        MetricDetail hookStrength,
        MetricDetail rhythmCurve,
        MetricDetail characterBalance,
        MetricDetail dialogueRatio,
        MetricDetail sceneDiversity,
        ForeshadowStatus foreshadowStatus,
        int overallScore
) {
    public record MetricDetail(
            double value,
            double target,
            String status,
            String details
    ) {
    }

    public record ForeshadowStatus(
            int total,
            int resolved,
            int unresolved,
            String status,
            String details
    ) {
    }
}
