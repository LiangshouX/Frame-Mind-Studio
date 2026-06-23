package io.framemind.agent.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.agentscope.core.tool.Tool;
import io.agentscope.core.tool.ToolParam;
import io.framemind.modules.scriptmind.service.OutlineService;
import io.framemind.modules.scriptmind.service.ScriptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 剧本工具，封装 ScriptService。
 * <p>
 * 供 Agent 通过 @Tool 注解调用，保存剧本内容、加载大纲上下文和检查一致性。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScriptTool {

    private final ScriptService scriptService;
    private final OutlineService outlineService;
    private final ObjectMapper objectMapper;

    @Tool(name = "save_scene_content", description = "保存指定集数的剧本内容。")
    public String saveSceneContent(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId,
            @ToolParam(name = "episode_number", description = "集数") int episodeNumber,
            @ToolParam(name = "content", description = "场景内容 JSON 字符串") String content) {
        try {
            UUID pid = UUID.fromString(projectId);
            var contentNode = objectMapper.readTree(content);
            scriptService.updateEpisode(pid, episodeNumber, contentNode);
            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "success");
            result.put("message", String.format("第%d集内容已保存", episodeNumber));
            return result.toString();
        } catch (Exception e) {
            log.error("保存场景内容失败: projectId={}, ep={}", projectId, episodeNumber, e);
            return errorJson("保存场景内容失败: " + e.getMessage());
        }
    }

    @Tool(name = "load_outline_context", description = "加载当前项目的大纲结构，作为剧本创作的框架参考。")
    public String loadOutlineContext(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId) {
        try {
            UUID pid = UUID.fromString(projectId);
            var outline = outlineService.getOutline(pid);
            if (outline == null || outline.content() == null) {
                return "该项目暂无大纲，请先完成大纲创作。";
            }
            return objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(outline.content());
        } catch (Exception e) {
            log.error("加载大纲上下文失败: projectId={}", projectId, e);
            return "加载大纲失败: " + e.getMessage();
        }
    }

    @Tool(name = "check_consistency", description = "检查指定集数之后的剧本一致性，查找矛盾之处。")
    public String checkConsistency(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId,
            @ToolParam(name = "from_episode", description = "从第几集开始检查") int fromEpisode) {
        try {
            UUID pid = UUID.fromString(projectId);
            var scriptOpt = scriptService.getScriptByProjectId(pid);
            if (scriptOpt.isEmpty()) {
                return "该项目暂无剧本内容。";
            }
            return objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(scriptOpt.get().getContent());
        } catch (Exception e) {
            log.error("检查一致性失败: projectId={}", projectId, e);
            return "检查一致性失败: " + e.getMessage();
        }
    }

    private String errorJson(String message) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("status", "error");
        node.put("message", message);
        return node.toString();
    }
}
