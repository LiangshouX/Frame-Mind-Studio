package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.agent.orchestration.PipelineOrchestrator;
import io.framemind.core.model.AgentSession;
import io.framemind.core.model.Project;
import io.framemind.core.repository.AgentSessionRepository;
import io.framemind.core.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.AgentSessionResponse;
import io.framemind.modules.scriptmind.dto.ImportUrlRequest;
import io.framemind.modules.scriptmind.dto.OptimizeSegmentRequest;
import io.framemind.modules.scriptmind.dto.OptimizeSegmentResponse;
import io.framemind.modules.scriptmind.dto.OutlineRequest;
import io.framemind.modules.scriptmind.dto.RefineScriptRequest;
import io.framemind.modules.scriptmind.dto.ReviewRequest;
import jakarta.persistence.EntityNotFoundException;
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
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/v1/agent")
@RequiredArgsConstructor
public class AgentController {

    private final PipelineOrchestrator pipelineOrchestrator;
    private final AgentSessionRepository agentSessionRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    /**
     * POST /api/v1/agent/generate-outline
     * Generate a structured outline from creative input. Returns 202 with session info.
     */
    @PostMapping("/generate-outline")
    public ResponseEntity<Map<String, Object>> generateOutline(@Valid @RequestBody OutlineRequest request) {
        Project project = getProjectOrThrow(request.projectId());

        // Create session record
        ObjectNode inputData = objectMapper.createObjectNode()
                .put("inputType", request.inputType())
                .put("inputContent", request.inputContent());
        if (request.stylePreset() != null) inputData.put("stylePreset", request.stylePreset());
        if (request.targetEpisodes() != null) inputData.put("targetEpisodes", request.targetEpisodes());
        AgentSession session = createSession(project, "outline_generate", inputData);

        // Trigger pipeline asynchronously
        pipelineOrchestrator.executeOutlineGeneration(
                session.getId().toString(),
                request.projectId(),
                request.inputContent(),
                request.stylePreset(),
                request.targetEpisodes() != null ? request.targetEpisodes() : 3
        );

        return ResponseEntity.accepted().body(Map.of(
                "session_id", session.getId().toString(),
                "websocket_url", "/ws/agent/session/" + session.getId(),
                "status", "pending"
        ));
    }

    /**
     * POST /api/v1/agent/refine-script
     * Refine an existing script from outline. Returns 202 with session info.
     */
    @PostMapping("/refine-script")
    public ResponseEntity<Map<String, Object>> refineScript(@Valid @RequestBody RefineScriptRequest request) {
        Project project = getProjectOrThrow(request.projectId());

        ObjectNode inputData = objectMapper.createObjectNode()
                .put("inputType", request.inputType())
                .put("inputContent", request.inputContent());
        AgentSession session = createSession(project, "script_refine", inputData);

        pipelineOrchestrator.executeScriptRefinement(
                session.getId().toString(),
                request.projectId(),
                request.inputContent()
        );

        return ResponseEntity.accepted().body(Map.of(
                "session_id", session.getId().toString(),
                "websocket_url", "/ws/agent/session/" + session.getId(),
                "status", "pending"
        ));
    }

    /**
     * POST /api/v1/agent/import-file
     * Import a file and convert to screenplay format. Returns 202 with session info.
     */
    @PostMapping("/import-file")
    public ResponseEntity<Map<String, Object>> importFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("projectId") UUID projectId) {

        Project project = getProjectOrThrow(projectId);

        String fileContent;
        try {
            fileContent = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Failed to read uploaded file", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to read uploaded file: " + e.getMessage()
            ));
        }

        ObjectNode inputData = objectMapper.createObjectNode()
                .put("filename", file.getOriginalFilename())
                .put("size", file.getSize());
        AgentSession session = createSession(project, "import_file", inputData);

        pipelineOrchestrator.executeFileImport(
                session.getId().toString(),
                projectId,
                fileContent,
                file.getOriginalFilename()
        );

        return ResponseEntity.accepted().body(Map.of(
                "session_id", session.getId().toString(),
                "websocket_url", "/ws/agent/session/" + session.getId(),
                "status", "pending"
        ));
    }

    /**
     * POST /api/v1/agent/import-url
     * Import content from a URL and convert to screenplay format. Returns 202 with session info.
     */
    @PostMapping("/import-url")
    public ResponseEntity<Map<String, Object>> importUrl(@Valid @RequestBody ImportUrlRequest request) {
        Project project = getProjectOrThrow(request.projectId());

        ObjectNode inputData = objectMapper.createObjectNode()
                .put("url", request.url());
        AgentSession session = createSession(project, "import_url", inputData);

        pipelineOrchestrator.executeUrlImport(
                session.getId().toString(),
                request.projectId(),
                request.url()
        );

        return ResponseEntity.accepted().body(Map.of(
                "session_id", session.getId().toString(),
                "websocket_url", "/ws/agent/session/" + session.getId(),
                "status", "pending"
        ));
    }

    /**
     * POST /api/v1/agent/optimize-segment
     * Optimize a specific script segment. Runs synchronously, returns alternatives.
     */
    @PostMapping("/optimize-segment")
    public ResponseEntity<OptimizeSegmentResponse> optimizeSegment(
            @Valid @RequestBody OptimizeSegmentRequest request) {

        // For synchronous optimization, we create a session and run via the orchestrator's
        // optimization path. Since the orchestrator is async, we use a session-based approach
        // but return immediately for this simpler operation.
        Project project = getProjectOrThrow(request.projectId());
        ObjectNode inputData = objectMapper.createObjectNode()
                .put("text", request.text())
                .put("elementType", request.elementType() != null ? request.elementType() : "dialogue");
        if (request.context() != null) inputData.put("context", request.context());
        AgentSession session = createSession(project, "optimize_segment", inputData);

        // Trigger optimization pipeline (it returns a CompletableFuture but we can
        // let it run in the background and return a 202 for consistency)
        pipelineOrchestrator.executeOptimization(
                session.getId().toString(),
                request.projectId(),
                request.text(),
                request.elementType() != null ? request.elementType() : "dialogue",
                request.context()
        );

        // For segment optimization, return 200 with session info for polling
        // The actual alternatives will be available in the session output once complete
        return ResponseEntity.accepted().body(new OptimizeSegmentResponse(
                java.util.List.of(new OptimizeSegmentResponse.Alternative(
                        request.text(),
                        "processing",
                        "优化处理中，请通过 session " + session.getId() + " 查询结果"
                ))
        ));
    }

    /**
     * GET /api/v1/agent/sessions/{sessionId}
     * Get the status and result of an agent session.
     */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<AgentSessionResponse> getSession(@PathVariable UUID sessionId) {
        return agentSessionRepository.findById(sessionId)
                .map(this::toSessionResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/v1/agent/sessions/{sessionId}/review
     * Submit a human-in-the-loop review for a session.
     */
    @PostMapping("/sessions/{sessionId}/review")
    public ResponseEntity<Map<String, Object>> submitReview(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ReviewRequest request) {

        AgentSession session = agentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found: " + sessionId));

        // Store the review action in the session's output data
        ObjectNode reviewData = objectMapper.createObjectNode();
        reviewData.put("review_action", request.action());
        if (request.feedback() != null) {
            reviewData.put("feedback", request.feedback());
        }

        // Update session output with review info
        JsonNode existingOutput = session.getOutputData();
        ObjectNode updatedOutput;
        if (existingOutput != null && existingOutput.isObject()) {
            updatedOutput = (ObjectNode) existingOutput.deepCopy();
        } else {
            updatedOutput = objectMapper.createObjectNode();
        }
        updatedOutput.set("human_review", reviewData);
        session.setOutputData(updatedOutput);
        session.setStatus("completed");
        agentSessionRepository.save(session);

        log.info("HITL review submitted for session {}: action={}", sessionId, request.action());

        return ResponseEntity.ok(Map.of(
                "session_id", sessionId.toString(),
                "action", request.action(),
                "status", "reviewed"
        ));
    }

    // ─── Private Helpers ────────────────────────────────────────────

    private Project getProjectOrThrow(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
    }

    private AgentSession createSession(Project project, String sessionType, JsonNode inputData) {
        AgentSession session = new AgentSession();
        session.setProject(project);
        session.setProjectId(project.getId());
        session.setSessionType(sessionType);
        session.setStatus("pending");
        session.setTokensConsumed(0);
        session.setInputData(inputData);
        return agentSessionRepository.save(session);
    }

    private AgentSessionResponse toSessionResponse(AgentSession session) {
        return new AgentSessionResponse(
                session.getId(),
                session.getSessionType(),
                session.getStatus(),
                session.getTokensConsumed(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getOutputData()
        );
    }
}
