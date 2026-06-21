package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

/**
 * 梗概保存请求。
 *
 * @param content 梗概内容（JSONB）
 */
public record SynopsisRequest(
        @NotNull(message = "内容不能为空")
        JsonNode content
) {
}
