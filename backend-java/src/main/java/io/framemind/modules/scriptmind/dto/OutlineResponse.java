package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 大纲响应。
 *
 * @param id        大纲 ID
 * @param projectId 关联项目 ID
 * @param content   大纲内容
 * @param format    大纲格式（episode_list / act_structure）
 * @param version   版本号
 * @param createdAt 创建时间
 * @param updatedAt 更新时间
 */
public record OutlineResponse(
        UUID id,
        UUID projectId,
        JsonNode content,
        String format,
        int version,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
