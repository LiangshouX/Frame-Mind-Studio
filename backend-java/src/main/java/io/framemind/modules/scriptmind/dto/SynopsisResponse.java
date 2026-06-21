package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 梗概响应。
 *
 * @param id        梗概 ID
 * @param projectId 关联项目 ID
 * @param content   梗概内容
 * @param createdAt 创建时间
 * @param updatedAt 更新时间
 */
public record SynopsisResponse(
        UUID id,
        UUID projectId,
        JsonNode content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
