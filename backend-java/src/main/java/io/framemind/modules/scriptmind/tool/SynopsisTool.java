package io.framemind.modules.scriptmind.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.agentscope.core.tool.Tool;
import io.agentscope.core.tool.ToolParam;
import io.framemind.agent.registry.AgentToolHelper;
import io.framemind.modules.scriptmind.dto.SynopsisRequest;
import io.framemind.modules.scriptmind.service.SynopsisService;
import io.framemind.modules.scriptmind.service.WorldSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 梗概工具，封装 SynopsisService 和 WorldSettingService。
 * <p>
 * 供 Agent 通过 @Tool 注解调用，保存梗概和加载世界观上下文。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SynopsisTool {

    private final SynopsisService synopsisService;
    private final WorldSettingService worldSettingService;
    private final ObjectMapper objectMapper;

    @Tool(name = "save_synopsis", description = "保存作品梗概。将生成的梗概内容保存到数据库。")
    public String saveSynopsis(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId,
            @ToolParam(name = "content", description = "梗概内容 JSON 字符串") String content) {
        try {
            UUID pid = UUID.fromString(projectId);
            var contentNode = objectMapper.readTree(content);
            var request = new SynopsisRequest(contentNode);
            synopsisService.saveSynopsis(pid, request);
            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "success");
            result.put("message", "梗概已保存");
            return result.toString();
        } catch (Exception e) {
            log.error("保存梗概失败: projectId={}", projectId, e);
            return AgentToolHelper.errorJson("保存梗概失败: " + e.getMessage());
        }
    }

    @Tool(name = "load_worldview_context", description = "加载当前项目的世界观设定，作为生成梗概的上下文参考。")
    public String loadWorldviewContext(
            @ToolParam(name = "project_id", description = "项目 ID") String projectId) {
        try {
            UUID pid = UUID.fromString(projectId);
            var worldSetting = worldSettingService.getWorldSetting(pid);
            if (worldSetting == null || worldSetting.content() == null) {
                return "该项目暂无世界观设定，请先完成世界观创作。";
            }
            return objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(worldSetting.content());
        } catch (Exception e) {
            log.error("加载世界观上下文失败: projectId={}", projectId, e);
            return "加载世界观失败: " + e.getMessage();
        }
    }
}
