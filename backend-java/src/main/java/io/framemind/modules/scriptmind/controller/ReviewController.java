package io.framemind.modules.scriptmind.controller;

import io.framemind.modules.scriptmind.dto.ReviewReportResponse;
import io.framemind.modules.scriptmind.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 审查报告控制器，提供审查报告的查询和问题状态更新接口。
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/review-reports")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * 获取审查报告列表。
     */
    @GetMapping
    public ResponseEntity<List<ReviewReportResponse>> getReviewReports(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String scope) {
        return ResponseEntity.ok(reviewService.getReviewReports(projectId, scope));
    }

    /**
     * 获取单个审查报告。
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ReviewReportResponse> getReviewReport(
            @PathVariable UUID projectId,
            @PathVariable UUID reportId) {
        return ResponseEntity.ok(reviewService.getReviewReport(reportId));
    }

    /**
     * 更新审查问题状态。
     */
    @PatchMapping("/{reportId}/issues/{issueId}")
    public ResponseEntity<Void> updateIssueStatus(
            @PathVariable UUID projectId,
            @PathVariable UUID reportId,
            @PathVariable String issueId,
            @RequestBody Map<String, String> request) {
        reviewService.updateIssueStatus(reportId, issueId, request.get("status"));
        return ResponseEntity.ok().build();
    }
}
