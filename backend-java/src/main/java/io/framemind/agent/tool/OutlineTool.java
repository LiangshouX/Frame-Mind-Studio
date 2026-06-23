package io.framemind.agent.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.agentscope.core.tool.Tool;
import io.agentscope.core.tool.ToolParam;
import io.framemind.modules.scriptmind.service.CharacterService;
import io.framemind.modules.scriptmind.service.OutlineService;
import io.framemind.modules.scriptmind.service.SynopsisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 大纲工具，封装 OutlineService。
 * <p>
 * 供 Agent 通过 @Tool 注解调用，保存大纲和加载上下文。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OutlineTool {

    private final OutlineService outlineService;
    private final SynopsisService synopsisService;
    private final CharacterService characterService;
    private final ObjectMapper objectMapper;

    @Tool(name = "save_outline", description = "保存作品大纲。支持 episode_list 和 act_structure 两种格式。")
    public String saveOutline(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId,
            @ToolParam(name = "content", description = "大纲内容 JSON 字符串") String content,
            @ToolParam(name = "format", description = "大纲格式：episode_list（短剧）或 act_structure（电影）") String format) {
        try {
            UUID pid = UUID.fromString(projectId);
            var contentNode = objectMapper.readTree(content);
            outlineService.saveOutline(pid, contentNode, format);
            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "success");
            result.put("message", "大纲已保存");
            result.put("format", format);
            return result.toString();
        } catch (Exception e) {
            log.error("保存大纲失败: projectId={}", projectId, e);
            return errorJson("保存大纲失败: " + e.getMessage());
        }
    }

    @Tool(name = "load_synopsis_context", description = "加载当前项目的梗概，作为生成大纲的上下文参考。")
    public String loadSynopsisContext(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId) {
        try {
            UUID pid = UUID.fromString(projectId);
            var synopsis = synopsisService.getSynopsis(pid);
            if (synopsis == null || synopsis.content() == null) {
                return "该项目暂无梗概，请先完成梗概创作。";
            }
            return objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(synopsis.content());
        } catch (Exception e) {
            log.error("加载梗概上下文失败: projectId={}", projectId, e);
            return "加载梗概失败: " + e.getMessage();
        }
    }

    @Tool(name = "load_characters_context", description = "加载当前项目的角色列表，作为生成大纲的上下文参考。")
    public String loadCharactersContext(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId) {
        try {
            UUID pid = UUID.fromString(projectId);
            var characters = characterService.listCharacters(pid);
            if (characters == null || characters.items().isEmpty()) {
                return "该项目暂无角色，请先完成角色设计。";
            }
            return objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(characters);
        } catch (Exception e) {
            log.error("加载角色上下文失败: projectId={}", projectId, e);
            return "加载角色失败: " + e.getMessage();
        }
    }

    private String errorJson(String message) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("status", "error");
        node.put("message", message);
        return node.toString();
    }
}
