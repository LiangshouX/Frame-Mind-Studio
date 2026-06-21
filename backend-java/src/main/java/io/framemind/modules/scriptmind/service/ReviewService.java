package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.ReviewReportResponse;
import io.framemind.modules.scriptmind.po.ReviewReportPO;
import io.framemind.modules.scriptmind.repository.ReviewReportRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 审查服务，负责审查报告的 CRUD 和问题状态管理。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewReportRepository reviewReportRepository;
    private final ProjectRepository projectRepository;

    /**
     * 获取项目的审查报告列表。
     *
     * @param projectId 项目 ID
     * @param scope     审查范围筛选（可选）
     * @return 审查报告列表
     */
    @Transactional(readOnly = true)
    public List<ReviewReportResponse> getReviewReports(UUID projectId, String scope) {
        List<ReviewReportPO> reports;
        if (scope != null && !scope.isBlank()) {
            reports = reviewReportRepository.findByProjectIdAndScopeOrderByCreatedAtDesc(projectId, scope);
        } else {
            reports = reviewReportRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        }
        return reports.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * 获取单个审查报告。
     *
     * @param reportId 报告 ID
     * @return 审查报告响应
     */
    @Transactional(readOnly = true)
    public ReviewReportResponse getReviewReport(UUID reportId) {
        ReviewReportPO report = reviewReportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Review report not found: " + reportId));
        return toResponse(report);
    }

    /**
     * 创建审查报告。
     *
     * @param projectId     项目 ID
     * @param scope         审查范围（full / episode）
     * @param episodeNumber 审查的集数（scope=episode 时）
     * @param report        审查报告内容
     * @return 审查报告响应
     */
    @Transactional
    public ReviewReportResponse createReviewReport(UUID projectId, String scope,
                                                   Integer episodeNumber, JsonNode report) {
        ProjectPO project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        ReviewReportPO reviewReport = ReviewReportPO.builder()
                .project(project)
                .scope(scope)
                .episodeNumber(episodeNumber)
                .report(report)
                .build();

        reviewReport = reviewReportRepository.save(reviewReport);
        log.info("Created review report for project {} with scope {}", projectId, scope);
        return toResponse(reviewReport);
    }

    /**
     * 更新审查问题状态。
     *
     * @param reportId 报告 ID
     * @param issueId  问题 ID
     * @param status   新状态（accepted / ignored / manual）
     */
    @Transactional
    public void updateIssueStatus(UUID reportId, String issueId, String status) {
        ReviewReportPO report = reviewReportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Review report not found: " + reportId));

        JsonNode reportContent = report.getReport();
        if (reportContent.isObject() && reportContent.has("issues")) {
            var issues = (com.fasterxml.jackson.databind.node.ArrayNode) reportContent.get("issues");
            for (int i = 0; i < issues.size(); i++) {
                JsonNode issue = issues.get(i);
                if (issue.has("id") && issue.get("id").asText().equals(issueId)) {
                    ((com.fasterxml.jackson.databind.node.ObjectNode) issue).put("status", status);
                    break;
                }
            }
            report.setReport(reportContent);
            reviewReportRepository.save(report);
            log.info("Updated issue {} status to {} in report {}", issueId, status, reportId);
        }
    }

    private ReviewReportResponse toResponse(ReviewReportPO r) {
        return new ReviewReportResponse(
                r.getId(),
                r.getProject().getId(),
                r.getScope(),
                r.getEpisodeNumber(),
                r.getReport(),
                r.getCreatedAt()
        );
    }
}
