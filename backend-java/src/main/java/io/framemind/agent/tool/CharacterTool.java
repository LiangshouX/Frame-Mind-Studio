package io.framemind.agent.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.agentscope.core.tool.Tool;
import io.agentscope.core.tool.ToolParam;
import io.framemind.modules.scriptmind.dto.CharacterCreateRequest;
import io.framemind.modules.scriptmind.service.CharacterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 角色管理工具，封装 CharacterService 的 CRUD 和批量操作。
 * <p>
 * 供 Agent 通过 @Tool 注解调用，实现角色的创建、编辑、删除和批量操作。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CharacterTool {

    private final CharacterService characterService;
    private final ObjectMapper objectMapper;

    @Tool(name = "create_character", description = "创建一个新角色。返回创建成功的角色信息 JSON。")
    public String createCharacter(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId,
            @ToolParam(name = "name", description = "角色名称") String name,
            @ToolParam(name = "gender", description = "性别") String gender,
            @ToolParam(name = "role", description = "角色定位：protagonist/antagonist/supporting") String role,
            @ToolParam(name = "identity", description = "身份定位") String identity,
            @ToolParam(name = "persona", description = "人设特征与记忆点") String persona,
            @ToolParam(name = "appearance", description = "外貌描述") String appearance,
            @ToolParam(name = "background", description = "背景故事") String background,
            @ToolParam(name = "personality", description = "性格特征 JSON 数组") String personality,
            @ToolParam(name = "relationships", description = "人物关系 JSON 数组") String relationships,
            @ToolParam(name = "arc", description = "角色弧光/成长轨迹") String arc) {
        try {
            UUID pid = UUID.fromString(projectId);
            var request = new CharacterCreateRequest(
                    name, gender, role, identity, persona, null,
                    parseJsonNode(personality), appearance, background, null,
                    parseJsonNode(relationships), null, arc, null
            );
            var response = characterService.createCharacter(pid, request);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            log.error("创建角色失败: name={}", name, e);
            return errorJson("创建角色失败: " + e.getMessage());
        }
    }

    @Tool(name = "update_character", description = "更新角色的指定字段。支持乐观锁，如果版本冲突返回冲突信息。")
    public String updateCharacter(
            @ToolParam(name = "character_id", description = "角色 ID") String characterId,
            @ToolParam(name = "field", description = "要更新的字段名") String field,
            @ToolParam(name = "value", description = "新值") String value,
            @ToolParam(name = "expected_version", description = "期望的版本号（乐观锁）") int expectedVersion) {
        try {
            var response = characterService.updateCharacterWithVersion(
                    UUID.fromString(characterId), field, value, expectedVersion);
            return objectMapper.writeValueAsString(response);
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException e) {
            log.warn("角色版本冲突: characterId={}", characterId);
            ObjectNode conflict = objectMapper.createObjectNode();
            conflict.put("status", "conflict");
            conflict.put("message", "角色数据已被其他操作修改，请刷新后重试");
            conflict.put("entity_type", "character");
            conflict.put("entity_id", characterId);
            return conflict.toString();
        } catch (Exception e) {
            log.error("更新角色失败: characterId={}", characterId, e);
            return errorJson("更新角色失败: " + e.getMessage());
        }
    }

    @Tool(name = "delete_character", description = "删除指定角色。")
    public String deleteCharacter(
            @ToolParam(name = "character_id", description = "角色 ID") String characterId) {
        try {
            characterService.deleteCharacter(UUID.fromString(characterId));
            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "success");
            result.put("message", "角色已删除");
            return result.toString();
        } catch (Exception e) {
            log.error("删除角色失败: characterId={}", characterId, e);
            return errorJson("删除角色失败: " + e.getMessage());
        }
    }

    @Tool(name = "batch_create_characters", description = "根据描述批量创建角色。输入角色描述列表的 JSON 字符串。")
    public String batchCreateCharacters(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId,
            @ToolParam(name = "characters_json", description = "角色列表 JSON 数组") String charactersJson) {
        try {
            UUID pid = UUID.fromString(projectId);
            var charsNode = objectMapper.readTree(charactersJson);
            var results = objectMapper.createArrayNode();

            for (var charNode : charsNode) {
                try {
                    var request = new CharacterCreateRequest(
                            charNode.path("name").asText(),
                            charNode.path("gender").asText(null),
                            charNode.path("role").asText("supporting"),
                            charNode.path("identity").asText(null),
                            charNode.path("persona").asText(null),
                            charNode.path("description").asText(null),
                            charNode.has("personality") ? charNode.get("personality") : objectMapper.createArrayNode(),
                            charNode.path("appearance").asText(null),
                            charNode.path("background").asText(null),
                            charNode.path("goals").asText(null),
                            charNode.has("relationships") ? charNode.get("relationships") : objectMapper.createArrayNode(),
                            charNode.path("dialogueStyle").asText(null),
                            charNode.path("arc").asText(null),
                            charNode.path("overview").asText(null)
                    );
                    var response = characterService.createCharacter(pid, request);
                    results.add(objectMapper.valueToTree(response));
                } catch (Exception e) {
                    log.warn("批量创建角色中单个失败: name={}", charNode.path("name").asText(), e);
                    ObjectNode err = objectMapper.createObjectNode();
                    err.put("name", charNode.path("name").asText());
                    err.put("error", e.getMessage());
                    results.add(err);
                }
            }

            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "success");
            result.put("created", results.size());
            result.set("characters", results);
            return result.toString();
        } catch (Exception e) {
            log.error("批量创建角色失败", e);
            return errorJson("批量创建角色失败: " + e.getMessage());
        }
    }

    @Tool(name = "batch_delete_characters", description = "批量删除角色。输入角色 ID 列表的 JSON 数组。")
    public String batchDeleteCharacters(
            @ToolParam(name = "character_ids", description = "角色 ID JSON 数组") String characterIds) {
        try {
            var idsNode = objectMapper.readTree(characterIds);
            int deleted = 0;
            for (var idNode : idsNode) {
                try {
                    characterService.deleteCharacter(UUID.fromString(idNode.asText()));
                    deleted++;
                } catch (Exception e) {
                    log.warn("批量删除角色中单个失败: id={}", idNode.asText(), e);
                }
            }
            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "success");
            result.put("deleted", deleted);
            return result.toString();
        } catch (Exception e) {
            log.error("批量删除角色失败", e);
            return errorJson("批量删除角色失败: " + e.getMessage());
        }
    }

    private com.fasterxml.jackson.databind.JsonNode parseJsonNode(String json) {
        if (json == null || json.isBlank()) return objectMapper.createArrayNode();
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return objectMapper.createArrayNode();
        }
    }

    private String errorJson(String message) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("status", "error");
        node.put("message", message);
        return node.toString();
    }
}
