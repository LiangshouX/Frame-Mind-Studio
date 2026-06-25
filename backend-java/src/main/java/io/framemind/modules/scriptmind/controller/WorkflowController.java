package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.framemind.agent.orchestration.PipelineOrchestrator;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.modules.scriptmind.dto.CharacterCreateRequest;
import io.framemind.modules.scriptmind.po.ForeshadowPO;
import io.framemind.modules.scriptmind.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 工作流控制器，提供 AI 生成各步骤内容的接口。
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/workflow")
@RequiredArgsConstructor
@Slf4j
public class WorkflowController {

    private final AgentSessionService agentSessionService;
    private final WorldSettingService worldSettingService;
    private final SynopsisService synopsisService;
    private final CharacterService characterService;
    private final OutlineService outlineService;
    private final ScriptService scriptService;
    private final ReviewService reviewService;
    private final ForeshadowService foreshadowService;
    private final PipelineOrchestrator pipelineOrchestrator;
    private final ObjectMapper objectMapper;

    /**
     * AI 生成世界观设定。
     */
    @PostMapping("/generate-world-setting")
    public ResponseEntity<Map<String, String>> generateWorldSetting(@PathVariable UUID projectId) {
        log.info("Generating world setting for project {}", projectId);

        ProjectPO project = agentSessionService.getProjectOrThrow(projectId);
        AgentSessionPO session = agentSessionService.createSession(project, "world_setting", null);
        String sessionId = session.getId().toString();

        // 收集上下文：梗概
        String synopsisContext = null;
        var synopsis = synopsisService.getSynopsis(projectId);
        if (synopsis != null && synopsis.content() != null) {
            synopsisContext = synopsis.content().toString();
        }

        String prompt = synopsisContext != null
                ? "请基于以下梗概生成世界观设定:\n" + synopsisContext
                : "请根据当前项目信息，生成一份完整的世界观设定。";

        pipelineOrchestrator.dispatchToAgent(projectId, "worldview", prompt, null, null, null);

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }

    /**
     * AI 生成梗概。
     */
    @PostMapping("/generate-synopsis")
    public ResponseEntity<Map<String, String>> generateSynopsis(@PathVariable UUID projectId) {
        log.info("Generating synopsis for project {}", projectId);

        ProjectPO project = agentSessionService.getProjectOrThrow(projectId);
        AgentSessionPO session = agentSessionService.createSession(project, "synopsis", null);
        String sessionId = session.getId().toString();

        // 收集上下文：世界观设定
        String worldSettingContext = null;
        var ws = worldSettingService.getWorldSetting(projectId);
        if (ws != null && ws.content() != null) {
            worldSettingContext = ws.content().toString();
        }

        String prompt = worldSettingContext != null
                ? "请基于以下世界观设定生成梗概:\n" + worldSettingContext
                : "请基于当前世界观设定，生成一份完整的作品梗概。";

        pipelineOrchestrator.dispatchToAgent(projectId, "synopsis", prompt, null, null, null);

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }

    /**
     * AI 生成角色。
     */
    @PostMapping("/generate-characters")
    public ResponseEntity<Map<String, String>> generateCharacters(@PathVariable UUID projectId) {
        log.info("Generating characters for project {}", projectId);

        ProjectPO project = agentSessionService.getProjectOrThrow(projectId);
        AgentSessionPO session = agentSessionService.createSession(project, "characters", null);
        String sessionId = session.getId().toString();

        // 收集上下文：世界观设定 + 梗概
        StringBuilder context = new StringBuilder();
        var ws = worldSettingService.getWorldSetting(projectId);
        if (ws != null && ws.content() != null) {
            context.append("## 世界观设定\n").append(ws.content().toString()).append("\n\n");
        }
        var syn = synopsisService.getSynopsis(projectId);
        if (syn != null && syn.content() != null) {
            context.append("## 故事梗概\n").append(syn.content().toString()).append("\n\n");
        }

        String prompt = context.length() > 0
                ? "请根据以下世界观和梗概生成角色:\n" + context
                : "请根据世界观和梗概，设计完整的角色卡片。";

        pipelineOrchestrator.dispatchToAgent(projectId, "characters", prompt, null, null, null);

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }

    /**
     * AI 生成大纲。
     */
    @PostMapping("/generate-outline")
    public ResponseEntity<Map<String, String>> generateOutline(@PathVariable UUID projectId) {
        log.info("Generating outline for project {}", projectId);

        ProjectPO project = agentSessionService.getProjectOrThrow(projectId);
        AgentSessionPO session = agentSessionService.createSession(project, "outline", null);
        String sessionId = session.getId().toString();

        // 收集上下文：世界观设定 + 梗概 + 角色
        StringBuilder context = new StringBuilder();
        var ws = worldSettingService.getWorldSetting(projectId);
        if (ws != null && ws.content() != null) {
            context.append("## 世界观设定\n").append(ws.content().toString()).append("\n\n");
        }
        var syn = synopsisService.getSynopsis(projectId);
        if (syn != null && syn.content() != null) {
            context.append("## 故事梗概\n").append(syn.content().toString()).append("\n\n");
        }
        var characters = characterService.listCharacters(projectId);
        if (characters.items() != null && !characters.items().isEmpty()) {
            context.append("## 角色设定\n").append(objectMapper.valueToTree(characters.items()).toString()).append("\n\n");
        }

        String prompt = context.length() > 0
                ? "请根据以下信息生成故事大纲:\n" + context
                : "请根据世界观、梗概和角色设定，生成一份完整的故事大纲。";

        pipelineOrchestrator.dispatchToAgent(projectId, "outline", prompt, null, null, null);

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }

    /**
     * AI 生成剧本。
     */
    @PostMapping("/generate-script")
    public ResponseEntity<Map<String, String>> generateScript(@PathVariable UUID projectId) {
        log.info("Generating script for project {}", projectId);

        ProjectPO project = agentSessionService.getProjectOrThrow(projectId);
        AgentSessionPO session = agentSessionService.createSession(project, "script", null);
        String sessionId = session.getId().toString();

        // 收集上下文：大纲 + 角色
        StringBuilder context = new StringBuilder();
        var ol = outlineService.getOutline(projectId);
        if (ol != null && ol.content() != null) {
            context.append("## 故事大纲\n").append(ol.content().toString()).append("\n\n");
        }
        var chars = characterService.listCharacters(projectId);
        if (chars.items() != null && !chars.items().isEmpty()) {
            context.append("## 角色设定\n").append(objectMapper.valueToTree(chars.items()).toString()).append("\n\n");
        }

        String prompt = context.length() > 0
                ? "请根据以下大纲和角色生成剧本:\n" + context
                : "请根据大纲结构，逐集生成完整的剧本内容。";

        pipelineOrchestrator.dispatchToAgent(projectId, "script", prompt, null, null, null);

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }

    /**
     * AI 审查剧本。
     */
    @PostMapping("/review")
    public ResponseEntity<Map<String, String>> reviewScript(@PathVariable UUID projectId) {
        log.info("Reviewing script for project {}", projectId);

        ProjectPO project = agentSessionService.getProjectOrThrow(projectId);
        AgentSessionPO session = agentSessionService.createSession(project, "review", null);
        String sessionId = session.getId().toString();

        // 收集上下文：剧本内容
        StringBuilder context = new StringBuilder();
        var scriptOpt = scriptService.getScriptByProjectId(projectId);
        if (scriptOpt.isPresent() && scriptOpt.get().getContent() != null) {
            context.append("## 剧本内容\n").append(scriptOpt.get().getContent().toString()).append("\n\n");
        }

        // 收集伏笔信息
        List<ForeshadowPO> foreshadows = foreshadowService.checkUnresolvedForeshadows(projectId);
        if (!foreshadows.isEmpty()) {
            context.append("## 伏笔列表\n");
            for (ForeshadowPO f : foreshadows) {
                context.append(String.format("- [%s] %s (提示集数: %s, 紧急度: %s)\n",
                        f.getStatus(), f.getPlant(),
                        f.getEpisodeHint() != null ? f.getEpisodeHint() : "未指定",
                        f.getUrgency()));
            }
        }

        String prompt = context.length() > 0
                ? "请审校以下剧本:\n" + context
                : "请审校当前项目的剧本内容。";

        pipelineOrchestrator.dispatchToAgent(projectId, "script", prompt, null, null, null);

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }
}
