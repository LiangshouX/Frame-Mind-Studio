package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.framemind.agent.orchestration.PipelineOrchestrator;
import io.framemind.core.service.AgentConfigService;
import io.framemind.infrastructure.po.AgentMessagePO;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.repository.AgentMessageRepository;
import io.framemind.infrastructure.repository.AgentSessionRepository;
import io.framemind.modules.scriptmind.service.AgentSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 项目级 Agent 控制器，提供 Agent 聊天、生成和配置接口。
 * <p>
 * 路径格式：/api/v1/projects/{projectId}/agent/*
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/projects/{projectId}/agent")
@RequiredArgsConstructor
public class ProjectAgentController {

    private final PipelineOrchestrator pipelineOrchestrator;
    private final AgentConfigService agentConfigService;
    private final AgentSessionService agentSessionService;
    private final AgentSessionRepository sessionRepository;
    private final AgentMessageRepository messageRepository;
    private final ObjectMapper objectMapper;

    /**
     * 发送聊天消息到 Agent。
     * <p>
     * 如果请求中包含 session_id，则复用指定会话；否则创建新会话。
     */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @PathVariable UUID projectId,
            @Valid @RequestBody ChatRequest request) {

        log.info("Agent chat: projectId={}, step={}, provider={}, model={}, sessionId={}, message={}",
                projectId, request.workflowStep(), request.providerId(), request.modelName(),
                request.sessionId(),
                request.message().substring(0, Math.min(50, request.message().length())));

        String sessionId = pipelineOrchestrator
                .dispatchToAgent(projectId, request.workflowStep(), request.message(),
                        request.providerId(), request.modelName(), request.sessionId())
                .join();

        return ResponseEntity.accepted().body(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }

    /**
     * 触发 AI 一键生成。
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generate(
            @PathVariable UUID projectId,
            @Valid @RequestBody GenerateRequest request) {

        log.info("Agent generate: projectId={}, step={}, provider={}, model={}, action={}",
                projectId, request.workflowStep(), request.providerId(), request.modelName(),
                request.action());

        String sessionId = pipelineOrchestrator
                .generateAction(projectId, request.workflowStep(), request.action(),
                        request.providerId(), request.modelName())
                .join();

        return ResponseEntity.accepted().body(Map.of(
                "session_id", sessionId,
                "websocket_url", "/ws/agent/" + sessionId
        ));
    }

    /**
     * 获取指定工作流步骤的聊天历史（已废弃，返回最新会话作为兼容）。
     *
     * @deprecated 请使用 GET /sessions?workflow_step=xxx 获取会话列表，
     *             再使用 GET /sessions/{sessionId} 获取会话详情
     */
    @Deprecated
    @GetMapping("/history/{workflowStep}")
    public ResponseEntity<Map<String, Object>> getChatHistory(
            @PathVariable UUID projectId,
            @PathVariable String workflowStep) {

        List<AgentSessionPO> sessions = sessionRepository
                .findByProjectIdAndWorkflowStepOrderByCreatedAtDesc(projectId, workflowStep);

        if (sessions.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        AgentSessionPO session = sessions.get(0);
        List<AgentMessagePO> messages = messageRepository
                .findBySessionIdOrderByMessageOrderAsc(session.getId());

        List<Map<String, Object>> messageDtos = messages.stream()
                .map(msg -> {
                    Map<String, Object> dto = new java.util.LinkedHashMap<>();
                    dto.put("id", msg.getId().toString());
                    dto.put("role", msg.getRole());
                    dto.put("content", msg.getContent());
                    dto.put("message_type", msg.getMessageType());
                    dto.put("metadata", msg.getMetadata());
                    dto.put("message_order", msg.getMessageOrder());
                    dto.put("created_at", msg.getCreatedAt().toString());
                    return dto;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("session_id", session.getId().toString());
        result.put("workflow_step", session.getWorkflowStep());
        result.put("agent_name", session.getAgentName());
        result.put("messages", messageDtos);
        result.put("created_at", session.getCreatedAt().toString());

        return ResponseEntity.ok(result);
    }

    // ─── 会话管理端点 ────────────────────────────────────────────────

    /** workflowStep → agentName 映射 */
    private static final Map<String, String> STEP_TO_AGENT = Map.of(
            "worldview", "creative_agent",
            "synopsis", "synopsis_agent",
            "characters", "character_agent",
            "outline", "outline_agent",
            "script", "script_agent"
    );

    /**
     * 分页获取会话列表。
     * GET /sessions?workflow_step={step}&page={page}&size={size}
     */
    @GetMapping("/sessions")
    public ResponseEntity<Page<Map<String, Object>>> listSessions(
            @PathVariable UUID projectId,
            @RequestParam String workflowStep,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<Map<String, Object>> sessions = agentSessionService
                .listSessions(projectId, workflowStep, page, size);
        return ResponseEntity.ok(sessions);
    }

    /**
     * 获取单个会话详情（含消息列表）。
     * GET /sessions/{sessionId}
     */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSessionDetail(
            @PathVariable UUID projectId,
            @PathVariable UUID sessionId) {

        return agentSessionService.getSessionDetail(sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 创建新会话。
     * POST /sessions
     */
    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> createSession(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateSessionRequest request) {

        String agentName = STEP_TO_AGENT.getOrDefault(request.workflowStep(), "unknown");

        AgentSessionPO session = agentSessionService.createSession(
                agentSessionService.getProjectOrThrow(projectId),
                "chat",
                request.workflowStep(),
                agentName,
                null);

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("id", session.getId().toString());
        result.put("workflow_step", request.workflowStep());
        result.put("agent_name", agentName);
        result.put("status", session.getStatus());
        result.put("title", session.getTitle());
        result.put("created_at", session.getCreatedAt() != null ? session.getCreatedAt().toString() : null);

        return ResponseEntity.ok(result);
    }

    /**
     * 更新会话标题。
     * PATCH /sessions/{sessionId}/title
     */
    @PatchMapping("/sessions/{sessionId}/title")
    public ResponseEntity<Map<String, Object>> updateTitle(
            @PathVariable UUID projectId,
            @PathVariable UUID sessionId,
            @Valid @RequestBody UpdateTitleRequest request) {

        agentSessionService.updateTitle(sessionId, request.title());

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("id", sessionId.toString());
        result.put("title", request.title());
        return ResponseEntity.ok(result);
    }

    /**
     * 删除会话。
     * DELETE /sessions/{sessionId}
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable UUID projectId,
            @PathVariable UUID sessionId) {

        agentSessionService.deleteSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 获取 Agent 配置（合并后）。
     */
    @GetMapping("/config/{agentName}")
    public ResponseEntity<AgentConfigService.MergedAgentConfig> getConfig(
            @PathVariable UUID projectId,
            @PathVariable String agentName) {

        AgentConfigService.MergedAgentConfig config = agentConfigService.loadConfig(projectId, agentName);
        return ResponseEntity.ok(config);
    }

    /**
     * 保存 Agent 配置覆盖。
     */
    @PutMapping("/config/{agentName}")
    public ResponseEntity<Map<String, Object>> saveConfig(
            @PathVariable UUID projectId,
            @PathVariable String agentName,
            @Valid @RequestBody JsonNode config) {

        int version = agentConfigService.saveProjectOverride(projectId, agentName, config);

        return ResponseEntity.ok(Map.of(
                "agent_name", agentName,
                "version", version,
                "updated_at", LocalDateTime.now().toString()
        ));
    }

    /**
     * 删除 Agent 配置覆盖（恢复全局默认）。
     */
    @DeleteMapping("/config/{agentName}")
    public ResponseEntity<Void> deleteConfig(
            @PathVariable UUID projectId,
            @PathVariable String agentName) {

        agentConfigService.deleteProjectOverride(projectId, agentName);
        return ResponseEntity.noContent().build();
    }

    // ─── Request DTOs ────────────────────────────────────────────────

    /** 聊天请求 */
    public record ChatRequest(
            String workflowStep,
            String message,
            String preset,
            String providerId,
            String modelName,
            String sessionId
    ) {}

    /** 生成请求 */
    public record GenerateRequest(
            String workflowStep,
            String action,
            String providerId,
            String modelName
    ) {}

    /** 创建会话请求 */
    public record CreateSessionRequest(
            String workflowStep
    ) {}

    /** 更新标题请求 */
    public record UpdateTitleRequest(
            String title
    ) {}
}
