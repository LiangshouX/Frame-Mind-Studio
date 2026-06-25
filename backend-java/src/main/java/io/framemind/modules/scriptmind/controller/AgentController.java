package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.agent.orchestration.PipelineOrchestrator;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.modules.scriptmind.dto.AgentSessionResponse;
import io.framemind.modules.scriptmind.dto.ImportUrlRequest;
import io.framemind.modules.scriptmind.dto.OptimizeSegmentRequest;
import io.framemind.modules.scriptmind.dto.OptimizeSegmentResponse;
import io.framemind.modules.scriptmind.dto.OutlineRequest;
import io.framemind.modules.scriptmind.dto.RefineScriptRequest;
import io.framemind.modules.scriptmind.dto.ReviewRequest;
import io.framemind.modules.scriptmind.service.AgentSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Agent 控制器，提供 AI Agent 相关的异步任务接口。
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/agent")
@RequiredArgsConstructor
public class AgentController {

    private final PipelineOrchestrator pipelineOrchestrator;
    private final AgentSessionService agentSessionService;
    private final ObjectMapper objectMapper;

    /**
     * 生成结构化大纲。返回 202 及会话信息。
     *
     * @param request 大纲生成请求
     * @return 会话 ID 和 WebSocket 连接信息
     */
    @PostMapping("/generate-outline")
    public ResponseEntity<Map<String, Object>> generateOutline(@Valid @RequestBody OutlineRequest request) {
        ProjectPO project = agentSessionService.getProjectOrThrow(request.projectId());

        ObjectNode inputData = objectMapper.createObjectNode()
                .put("inputType", request.inputType())
                .put("inputContent", request.inputContent());
        if (request.stylePreset() != null) inputData.put("stylePreset", request.stylePreset());
        if (request.targetEpisodes() != null) inputData.put("targetEpisodes", request.targetEpisodes());
        AgentSessionPO session = agentSessionService.createSession(project, "outline_generate", inputData);

        String prompt = String.format("请生成结构化大纲。创意输入: %s, 风格: %s, 集数: %d",
                request.inputContent(),
                request.stylePreset() != null ? request.stylePreset() : "默认",
                request.targetEpisodes() != null ? request.targetEpisodes() : 3);
        pipelineOrchestrator.dispatchToAgent(request.projectId(), "worldview", prompt, null, null, null);

        return ResponseEntity.accepted().body(Map.of(
                "session_id", session.getId().toString(),
                "websocket_url", "/ws/agent/session/" + session.getId(),
                "status", "pending"
        ));
    }

    /**
     * 从大纲精修剧本。返回 202 及会话信息。
     *
     * @param request 剧本精修请求
     * @return 会话 ID 和 WebSocket 连接信息
     */
    @PostMapping("/refine-script")
    public ResponseEntity<Map<String, Object>> refineScript(@Valid @RequestBody RefineScriptRequest request) {
        ProjectPO project = agentSessionService.getProjectOrThrow(request.projectId());

        ObjectNode inputData = objectMapper.createObjectNode()
                .put("inputType", request.inputType())
                .put("inputContent", request.inputContent());
        AgentSessionPO session = agentSessionService.createSession(project, "script_refine", inputData);

        pipelineOrchestrator.dispatchToAgent(request.projectId(), "script",
                "请精修以下剧本:\n" + request.inputContent(), null, null, null);

        return ResponseEntity.accepted().body(Map.of(
                "session_id", session.getId().toString(),
                "websocket_url", "/ws/agent/session/" + session.getId(),
                "status", "pending"
        ));
    }

    /**
     * 导入文件并转换为剧本格式。返回 202 及会话信息。
     *
     * @param file      上传的文件
     * @param projectId 项目 ID
     * @return 会话 ID 和 WebSocket 连接信息
     */
    @PostMapping("/import-file")
    public ResponseEntity<Map<String, Object>> importFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectId") UUID projectId) {

        ProjectPO project = agentSessionService.getProjectOrThrow(projectId);

        String fileContent;
        try {
            fileContent = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("读取上传文件失败", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to read uploaded file: " + e.getMessage()
            ));
        }

        ObjectNode inputData = objectMapper.createObjectNode()
                .put("filename", file.getOriginalFilename())
                .put("size", file.getSize());
        AgentSessionPO session = agentSessionService.createSession(project, "import_file", inputData);

        pipelineOrchestrator.dispatchToAgent(projectId, "worldview",
                "请导入文件: " + file.getOriginalFilename() + "\n" + fileContent, null, null, null);

        return ResponseEntity.accepted().body(Map.of(
                "session_id", session.getId().toString(),
                "websocket_url", "/ws/agent/session/" + session.getId(),
                "status", "pending"
        ));
    }

    /**
     * 从 URL 导入内容并转换为剧本格式。返回 202 及会话信息。
     *
     * @param request URL 导入请求
     * @return 会话 ID 和 WebSocket 连接信息
     */
    @PostMapping("/import-url")
    public ResponseEntity<Map<String, Object>> importUrl(@Valid @RequestBody ImportUrlRequest request) {
        ProjectPO project = agentSessionService.getProjectOrThrow(request.projectId());

        ObjectNode inputData = objectMapper.createObjectNode()
                .put("url", request.url());
        AgentSessionPO session = agentSessionService.createSession(project, "import_url", inputData);

        pipelineOrchestrator.dispatchToAgent(request.projectId(), "worldview",
                "请从 URL 导入: " + request.url(), null, null, null);

        return ResponseEntity.accepted().body(Map.of(
                "session_id", session.getId().toString(),
                "websocket_url", "/ws/agent/session/" + session.getId(),
                "status", "pending"
        ));
    }

    /**
     * 优化指定的剧本片段。异步执行，返回会话信息。
     *
     * @param request 片段优化请求
     * @return 优化响应
     */
    @PostMapping("/optimize-segment")
    public ResponseEntity<OptimizeSegmentResponse> optimizeSegment(
            @Valid @RequestBody OptimizeSegmentRequest request) {

        ProjectPO project = agentSessionService.getProjectOrThrow(request.projectId());
        ObjectNode inputData = objectMapper.createObjectNode()
                .put("text", request.text())
                .put("elementType", request.elementType() != null ? request.elementType() : "dialogue");
        if (request.context() != null) inputData.put("context", request.context());
        AgentSessionPO session = agentSessionService.createSession(project, "optimize_segment", inputData);

        pipelineOrchestrator.dispatchToAgent(request.projectId(), "script",
                String.format("请优化以下%s片段:\n%s",
                        request.elementType() != null ? request.elementType() : "dialogue",
                        request.text()),
                null, null, null);

        return ResponseEntity.accepted().body(new OptimizeSegmentResponse(
                java.util.List.of(new OptimizeSegmentResponse.Alternative(
                        request.text(),
                        "processing",
                        "优化处理中，请通过 session " + session.getId() + " 查询结果"
                ))
        ));
    }

    /**
     * 查询 Agent 会话状态和结果。
     *
     * @param sessionId 会话 ID
     * @return 会话信息
     */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<AgentSessionResponse> getSession(@PathVariable UUID sessionId) {
        return agentSessionService.getSession(sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 提交 HITL（Human-In-The-Loop）审核。
     *
     * @param sessionId 会话 ID
     * @param request   审核请求
     * @return 审核结果
     */
    @PostMapping("/sessions/{sessionId}/review")
    public ResponseEntity<Map<String, Object>> submitReview(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ReviewRequest request) {

        agentSessionService.submitReview(sessionId, request.action(), request.feedback());

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId.toString(),
                "action", request.action(),
                "status", "reviewed"
        ));
    }
}
