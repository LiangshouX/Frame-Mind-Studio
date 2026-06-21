package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 世界观设定响应。
 *
 * @param id        设定 ID
 * @param projectId 关联项目 ID
 * @param content   世界观设定内容
 * @param createdAt 创建时间
 * @param updatedAt 更新时间
 */
public record WorldSettingResponse(
        UUID id,
        UUID projectId,
        JsonNode content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
