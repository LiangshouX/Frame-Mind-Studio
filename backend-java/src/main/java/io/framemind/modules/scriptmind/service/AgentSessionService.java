package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.AgentSessionRepository;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.AgentSessionResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Agent 会话服务，负责会话的创建、查询和 HITL 审核。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgentSessionService {

    private final AgentSessionRepository agentSessionRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    /**
     * 根据项目 ID 查找项目，不存在则抛出异常。
     *
     * @param projectId 项目 ID
     * @return 项目持久化对象
     */
    @Transactional(readOnly = true)
    public ProjectPO getProjectOrThrow(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
    }

    /**
     * 创建一个新的 Agent 会话。
     *
     * @param project     所属项目
     * @param sessionType 会话类型
     * @param inputData   输入数据
     * @return 创建的会话持久化对象
     */
    @Transactional
    public AgentSessionPO createSession(ProjectPO project, String sessionType, JsonNode inputData) {
        AgentSessionPO session = new AgentSessionPO();
        session.setProject(project);
        session.setProjectId(project.getId());
        session.setSessionType(sessionType);
        session.setStatus("pending");
        session.setTokensConsumed(0);
        session.setInputData(inputData);
        return agentSessionRepository.save(session);
    }

    /**
     * 根据会话 ID 查询会话。
     *
     * @param sessionId 会话 ID
     * @return 会话响应 DTO，如果不存在则返回空
     */
    @Transactional(readOnly = true)
    public Optional<AgentSessionResponse> getSession(UUID sessionId) {
        return agentSessionRepository.findById(sessionId)
                .map(this::toSessionResponse);
    }

    /**
     * 提交 HITL（Human-In-The-Loop）审核。
     *
     * @param sessionId 会话 ID
     * @param action    审核动作
     * @param feedback  审核反馈（可选）
     */
    @Transactional
    public void submitReview(UUID sessionId, String action, String feedback) {
        AgentSessionPO session = agentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found: " + sessionId));

        ObjectNode reviewData = objectMapper.createObjectNode();
        reviewData.put("review_action", action);
        if (feedback != null) {
            reviewData.put("feedback", feedback);
        }

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

        log.info("HITL 审核已提交, session {}: action={}", sessionId, action);
    }

    /**
     * 将会话持久化对象转换为响应 DTO。
     *
     * @param session 会话持久化对象
     * @return 会话响应 DTO
     */
    private AgentSessionResponse toSessionResponse(AgentSessionPO session) {
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
