package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.modules.scriptmind.agent.CreativeAgent;
import io.framemind.modules.scriptmind.dto.WorldSettingRequest;
import io.framemind.modules.scriptmind.dto.SynopsisRequest;
import io.framemind.modules.scriptmind.service.WorldSettingService;
import io.framemind.modules.scriptmind.service.SynopsisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    private final CreativeAgent creativeAgent;
    private final WorldSettingService worldSettingService;
    private final SynopsisService synopsisService;

    /**
     * AI 生成世界观设定。
     */
    @PostMapping("/generate-world-setting")
    public ResponseEntity<Map<String, String>> generateWorldSetting(@PathVariable UUID projectId) {
        log.info("Generating world setting for project {}", projectId);

        try {
            JsonNode result = creativeAgent.generateWorldSetting(
                    projectId.toString(), "用户请求生成世界观设定", null, chunk -> {});

            if (result != null && !result.isMissingNode()) {
                worldSettingService.saveWorldSetting(projectId, new WorldSettingRequest(result));
                log.info("World setting saved for project {}", projectId);
            }
        } catch (Exception e) {
            log.error("AI generation failed for world setting", e);
            return ResponseEntity.ok(Map.of(
                    "session_id", UUID.randomUUID().toString(),
                    "websocket_url", "/ws/agent/" + projectId,
                    "status", "error",
                    "message", e.getMessage()
            ));
        }

        return ResponseEntity.ok(Map.of(
                "session_id", UUID.randomUUID().toString(),
                "websocket_url", "/ws/agent/" + projectId,
                "status", "completed"
        ));
    }

    /**
     * AI 生成梗概。
     */
    @PostMapping("/generate-synopsis")
    public ResponseEntity<Map<String, String>> generateSynopsis(@PathVariable UUID projectId) {
        log.info("Generating synopsis for project {}", projectId);

        try {
            // 先获取世界观设定作为上下文
            JsonNode worldSetting = null;
            var ws = worldSettingService.getWorldSetting(projectId);
            if (ws != null) {
                worldSetting = ws.content();
            }

            JsonNode result = creativeAgent.generateSynopsis(
                    projectId.toString(), worldSetting, "用户请求生成梗概", chunk -> {});

            if (result != null && !result.isMissingNode()) {
                synopsisService.saveSynopsis(projectId, new SynopsisRequest(result));
                log.info("Synopsis saved for project {}", projectId);
            }
        } catch (Exception e) {
            log.error("AI generation failed for synopsis", e);
            return ResponseEntity.ok(Map.of(
                    "session_id", UUID.randomUUID().toString(),
                    "websocket_url", "/ws/agent/" + projectId,
                    "status", "error",
                    "message", e.getMessage()
            ));
        }

        return ResponseEntity.ok(Map.of(
                "session_id", UUID.randomUUID().toString(),
                "websocket_url", "/ws/agent/" + projectId,
                "status", "completed"
        ));
    }

    /**
     * AI 生成角色。
     */
    @PostMapping("/generate-characters")
    public ResponseEntity<Map<String, String>> generateCharacters(@PathVariable UUID projectId) {
        log.info("Generating characters for project {}", projectId);
        // TODO: 接入 AgentScope-Java 角色生成
        return ResponseEntity.ok(Map.of(
                "session_id", UUID.randomUUID().toString(),
                "websocket_url", "/ws/agent/" + projectId,
                "status", "pending"
        ));
    }

    /**
     * AI 生成大纲。
     */
    @PostMapping("/generate-outline")
    public ResponseEntity<Map<String, String>> generateOutline(@PathVariable UUID projectId) {
        log.info("Generating outline for project {}", projectId);
        // TODO: 接入 AgentScope-Java 大纲生成
        return ResponseEntity.ok(Map.of(
                "session_id", UUID.randomUUID().toString(),
                "websocket_url", "/ws/agent/" + projectId,
                "status", "pending"
        ));
    }

    /**
     * AI 生成剧本。
     */
    @PostMapping("/generate-script")
    public ResponseEntity<Map<String, String>> generateScript(@PathVariable UUID projectId) {
        log.info("Generating script for project {}", projectId);
        // TODO: 接入 AgentScope-Java 剧本生成
        return ResponseEntity.ok(Map.of(
                "session_id", UUID.randomUUID().toString(),
                "websocket_url", "/ws/agent/" + projectId,
                "status", "pending"
        ));
    }

    /**
     * AI 审查剧本。
     */
    @PostMapping("/review")
    public ResponseEntity<Map<String, String>> reviewScript(@PathVariable UUID projectId) {
        log.info("Reviewing script for project {}", projectId);
        // TODO: 接入 AgentScope-Java 审查
        return ResponseEntity.ok(Map.of(
                "session_id", UUID.randomUUID().toString(),
                "websocket_url", "/ws/agent/" + projectId,
                "status", "pending"
        ));
    }
}
