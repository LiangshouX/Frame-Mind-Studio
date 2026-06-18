package io.framemind.modules.scriptmind.controller;

import io.framemind.modules.scriptmind.dto.QualityMetricsResponse;
import io.framemind.modules.scriptmind.service.QualityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/script/quality")
@RequiredArgsConstructor
public class QualityController {

    private final QualityService qualityService;

    /**
     * GET /api/v1/projects/{projectId}/script/quality
     * Get quality metrics for a project's script.
     */
    @GetMapping
    public ResponseEntity<QualityMetricsResponse> getQualityMetrics(@PathVariable UUID projectId) {
        return ResponseEntity.ok(qualityService.computeQualityMetrics(projectId));
    }
}
