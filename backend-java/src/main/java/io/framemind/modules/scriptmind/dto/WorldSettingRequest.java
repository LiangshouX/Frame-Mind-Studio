package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

/**
 * 世界观设定保存请求。
 *
 * @param content 世界观设定内容（JSONB）
 */
public record WorldSettingRequest(
        @NotNull(message = "内容不能为空")
        JsonNode content
) {
}
