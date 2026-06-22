package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.framemind.agent.orchestration.PipelineOrchestrator;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.modules.scriptmind.dto.SynopsisRequest;
import io.framemind.modules.scriptmind.dto.WorldSettingRequest;
import io.framemind.modules.scriptmind.po.ForeshadowPO;
import io.framemind.modules.scriptmind.po.ScriptPO;
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

        // 执行世界观生成流水线
        String finalSynopsisContext = synopsisContext;
        pipelineOrchestrator.executeOutlineGeneration(
                sessionId, projectId,
                finalSynopsisContext != null ? finalSynopsisContext : "用户请求生成世界观设定",
                null, 1
        ).thenAccept(result -> {
            if ("completed".equals(result.status()) && result.outputData().has("world_setting")) {
                JsonNode worldSetting = result.outputData().get("world_setting");
                worldSettingService.saveWorldSetting(projectId, new WorldSettingRequest(worldSetting));
                log.info("World setting saved for project {}", projectId);
            }
        });

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

        // 执行梗概生成流水线
        String finalWorldSettingContext = worldSettingContext;
        pipelineOrchestrator.executeOutlineGeneration(
                sessionId, projectId,
                "用户请求生成梗概" + (finalWorldSettingContext != null ? "\n\n世界观设定:\n" + finalWorldSettingContext : ""),
                null, 1
        ).thenAccept(result -> {
            if ("completed".equals(result.status()) && result.outputData().has("outline")) {
                JsonNode synopsisContent = result.outputData().get("outline");
                synopsisService.saveSynopsis(projectId, new SynopsisRequest(synopsisContent));
                log.info("Synopsis saved for project {}", projectId);
            }
        });

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
        String worldSetting = null;
        var ws = worldSettingService.getWorldSetting(projectId);
        if (ws != null && ws.content() != null) {
            worldSetting = ws.content().toString();
        }

        String synopsis = null;
        var syn = synopsisService.getSynopsis(projectId);
        if (syn != null && syn.content() != null) {
            synopsis = syn.content().toString();
        }

        // 异步执行角色生成流水线
        String finalWorldSetting = worldSetting;
        String finalSynopsis = synopsis;
        pipelineOrchestrator.executeCharacterGeneration(sessionId, projectId, finalWorldSetting, finalSynopsis)
                .thenAccept(result -> {
                    if ("completed".equals(result.status()) && result.outputData().has("characters")) {
                        JsonNode charactersNode = result.outputData().get("characters");
                        saveCharactersFromAgent(projectId, charactersNode);
                        log.info("Characters saved for project {}", projectId);
                    }
                });

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

        // 异步执行大纲生成流水线
        pipelineOrchestrator.executeOutlineGeneration(
                sessionId, projectId,
                context.length() > 0 ? context.toString() : "用户请求生成大纲",
                null, 8
        ).thenAccept(result -> {
            if ("completed".equals(result.status()) && result.outputData().has("outline")) {
                JsonNode outlineContent = result.outputData().get("outline");
                outlineService.saveOutline(projectId, outlineContent, "episode_list");
                log.info("Outline saved for project {}", projectId);
            }
        });

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
        String outline = null;
        var ol = outlineService.getOutline(projectId);
        if (ol != null && ol.content() != null) {
            outline = ol.content().toString();
        }

        String characters = null;
        var chars = characterService.listCharacters(projectId);
        if (chars.items() != null && !chars.items().isEmpty()) {
            characters = objectMapper.valueToTree(chars.items()).toString();
        }

        // 异步执行剧本生成流水线
        String finalOutline = outline;
        String finalCharacters = characters;
        pipelineOrchestrator.executeScriptGeneration(sessionId, projectId, finalOutline, finalCharacters)
                .thenAccept(result -> {
                    if ("completed".equals(result.status()) && result.outputData().has("script")) {
                        JsonNode scriptContent = result.outputData().get("script");
                        scriptService.updateScript(projectId, scriptContent);
                        log.info("Script saved for project {}", projectId);
                    }
                });

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
        String scriptContent = null;
        var scriptOpt = scriptService.getScriptByProjectId(projectId);
        if (scriptOpt.isPresent() && scriptOpt.get().getContent() != null) {
            scriptContent = scriptOpt.get().getContent().toString();
        }

        // 收集伏笔信息
        StringBuilder foreshadowInfo = new StringBuilder();
        List<ForeshadowPO> foreshadows = foreshadowService.checkUnresolvedForeshadows(projectId);
        if (!foreshadows.isEmpty()) {
            foreshadowInfo.append("## 伏笔列表\n");
            for (ForeshadowPO f : foreshadows) {
                foreshadowInfo.append(String.format("- [%s] %s (提示集数: %s, 紧急度: %s)\n",
                        f.getStatus(), f.getPlant(),
                        f.getEpisodeHint() != null ? f.getEpisodeHint() : "未指定",
                        f.getUrgency()));
            }
        }

        // 异步执行审查流水线
        String finalScriptContent = scriptContent;
        String finalForeshadowInfo = foreshadowInfo.toString();
        pipelineOrchestrator.executeReview(sessionId, projectId, finalScriptContent, finalForeshadowInfo)
                .thenAccept(result -> {
                    if ("completed".equals(result.status()) && result.outputData().has("review_report")) {
                        JsonNode reportContent = result.outputData().get("review_report");
                        reviewService.createReviewReport(projectId, "full", null, reportContent);
                        log.info("Review report saved for project {}", projectId);
                    }
                });

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }

    // ─── 私有辅助方法 ───────────────────────────────────────────────

    /**
     * 解析 Agent 返回的角色 JSON 并保存到数据库。
     */
    private void saveCharactersFromAgent(UUID projectId, JsonNode charactersNode) {
        if (!charactersNode.isArray()) {
            log.warn("Characters node is not an array, skipping save");
            return;
        }

        for (JsonNode charNode : charactersNode) {
            try {
                var request = new io.framemind.modules.scriptmind.dto.CharacterCreateRequest(
                        getTextSafe(charNode, "name"),
                        getTextSafe(charNode, "gender"),
                        getTextSafe(charNode, "role"),
                        getTextSafe(charNode, "identity"),
                        null, // persona (短剧专用)
                        null, // description
                        getArraySafe(charNode, "personality"),
                        getTextSafe(charNode, "appearance"),
                        getTextSafe(charNode, "background"),
                        getTextSafe(charNode, "goal"),
                        getArraySafe(charNode, "relationships"),
                        getTextSafe(charNode, "dialogueStyle"),
                        getTextSafe(charNode, "arc"),
                        getTextSafe(charNode, "overview")
                );
                characterService.createCharacter(projectId, request);
            } catch (Exception e) {
                log.warn("Failed to save character from agent output: {}", e.getMessage());
            }
        }
    }

    private String getTextSafe(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asText();
        }
        return null;
    }

    private JsonNode getArraySafe(JsonNode node, String field) {
        if (node.has(field) && node.get(field).isArray()) {
            return node.get(field);
        }
        return objectMapper.createArrayNode();
    }
}
