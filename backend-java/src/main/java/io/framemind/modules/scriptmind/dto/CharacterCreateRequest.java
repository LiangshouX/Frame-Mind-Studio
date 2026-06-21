package io.framemind.modules.scriptmind.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;

/**
 * 角色创建请求。
 *
 * @param name       角色姓名（必填）
 * @param gender     性别
 * @param role       角色类型（protagonist/antagonist/supporting/minor）
 * @param identity   身份定位
 * @param persona    人设特征与记忆点（短剧专用）
 * @param description 角色描述
 * @param personality 性格标签（JSON 数组）
 * @param appearance  外貌描述
 * @param background  背景故事
 * @param goals       目标
 * @param relationships 关系网络（JSON）
 * @param dialogueStyle 对白风格
 * @param arc         人物成长弧光
 * @param overview    人物概述/小传
 */
public record CharacterCreateRequest(
        @NotBlank(message = "角色姓名不能为空")
        String name,
        String gender,
        String role,
        String identity,
        String persona,
        String description,
        JsonNode personality,
        String appearance,
        String background,
        String goals,
        JsonNode relationships,
        String dialogueStyle,
        String arc,
        String overview
) {
}
