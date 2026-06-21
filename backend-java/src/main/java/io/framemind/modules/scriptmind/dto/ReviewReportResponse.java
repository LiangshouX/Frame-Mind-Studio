package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 审查报告响应。
 *
 * @param id            报告 ID
 * @param projectId     关联项目 ID
 * @param scope         审查范围（full / episode）
 * @param episodeNumber 审查的集数（scope=episode 时）
 * @param report        审查报告内容
 * @param createdAt     创建时间
 */
public record ReviewReportResponse(
        UUID id,
        UUID projectId,
        String scope,
        Integer episodeNumber,
        JsonNode report,
        LocalDateTime createdAt
) {
}
