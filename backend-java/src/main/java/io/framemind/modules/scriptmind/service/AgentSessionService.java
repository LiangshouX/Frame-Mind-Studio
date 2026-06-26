package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.infrastructure.po.AgentMessagePO;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.AgentMessageRepository;
import io.framemind.infrastructure.repository.AgentSessionRepository;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.AgentSessionResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final AgentMessageRepository agentMessageRepository;
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
     * 创建一个新的 Agent 会话（带 workflowStep 和 agentName）。
     *
     * @param project      所属项目
     * @param sessionType  会话类型
     * @param workflowStep 工作流步骤
     * @param agentName    Agent 名称
     * @param inputData    输入数据
     * @return 创建的会话持久化对象
     */
    @Transactional
    public AgentSessionPO createSession(ProjectPO project, String sessionType,
                                        String workflowStep, String agentName, JsonNode inputData) {
        AgentSessionPO session = new AgentSessionPO();
        session.setProject(project);
        session.setProjectId(project.getId());
        session.setSessionType(sessionType);
        session.setWorkflowStep(workflowStep);
        session.setAgentName(agentName);
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
     * 分页查询指定项目和工作流步骤的会话列表。
     *
     * @param projectId    项目 ID
     * @param workflowStep 工作流步骤
     * @param page         页码（从 0 开始）
     * @param size         每页数量
     * @return 分页结果，包含会话摘要信息
     */
    @Transactional(readOnly = true)
    public Page<Map<String, Object>> listSessions(UUID projectId, String workflowStep, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<AgentSessionPO> sessions = agentSessionRepository
                .findByProjectIdAndWorkflowStepOrderByCreatedAtDesc(projectId, workflowStep, pageRequest);

        return sessions.map(session -> {
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("id", session.getId().toString());
            summary.put("workflow_step", session.getWorkflowStep());
            summary.put("agent_name", session.getAgentName());
            summary.put("status", session.getStatus());
            summary.put("title", session.getTitle());
            summary.put("title_source", session.getTitleSource() != null ? session.getTitleSource() : "auto");
            summary.put("tokens_consumed", session.getTokensConsumed());
            summary.put("created_at", session.getCreatedAt() != null ? session.getCreatedAt().toString() : null);
            long msgCount = agentMessageRepository.countBySessionId(session.getId());
            summary.put("message_count", msgCount);
            return summary;
        });
    }

    /**
     * 获取会话详情（含消息列表）。
     *
     * @param sessionId 会话 ID
     * @return 会话详情，包含消息列表；不存在时返回空
     */
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getSessionDetail(UUID sessionId) {
        return agentSessionRepository.findById(sessionId).map(session -> {
            List<AgentMessagePO> messages = agentMessageRepository
                    .findBySessionIdOrderByMessageOrderAsc(sessionId);

            List<Map<String, Object>> messageDtos = messages.stream()
                    .map(msg -> {
                        Map<String, Object> dto = new LinkedHashMap<>();
                        dto.put("id", msg.getId().toString());
                        dto.put("role", msg.getRole());
                        dto.put("content", msg.getContent());
                        dto.put("message_type", msg.getMessageType());
                        dto.put("metadata", msg.getMetadata());
                        dto.put("message_order", msg.getMessageOrder());
                        dto.put("created_at", msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : null);
                        return dto;
                    })
                    .toList();

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", session.getId().toString());
            result.put("workflow_step", session.getWorkflowStep());
            result.put("agent_name", session.getAgentName());
            result.put("status", session.getStatus());
            result.put("title", session.getTitle());
            result.put("title_source", session.getTitleSource() != null ? session.getTitleSource() : "auto");
            result.put("tokens_consumed", session.getTokensConsumed());
            result.put("created_at", session.getCreatedAt() != null ? session.getCreatedAt().toString() : null);
            result.put("messages", messageDtos);
            return result;
        });
    }

    /**
     * 删除会话及其所有消息。
     *
     * @param sessionId 会话 ID
     */
    @Transactional
    public void deleteSession(UUID sessionId) {
        if (!agentSessionRepository.existsById(sessionId)) {
            throw new EntityNotFoundException("会话不存在: " + sessionId);
        }
        agentMessageRepository.deleteBySessionId(sessionId);
        agentSessionRepository.deleteById(sessionId);
        log.info("会话已删除: sessionId={}", sessionId);
    }

    /**
     * 更新会话标题（用户手动编辑）。
     *
     * @param sessionId 会话 ID
     * @param title     新标题
     */
    @Transactional
    public void updateTitle(UUID sessionId, String title) {
        AgentSessionPO session = agentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("会话不存在: " + sessionId));
        session.setTitle(title);
        session.setTitleSource("manual");
        agentSessionRepository.save(session);
        log.info("会话标题已手动更新: sessionId={}, title={}", sessionId, title);
    }

    /**
     * 自动生成会话标题。
     * <p>
     * 从第一条用户消息中智能提取核心主题作为标题：
     * <ol>
     *   <li>去除常见的中英文请求前缀（"请帮我"、"Help me" 等）</li>
     *   <li>截取核心主题（最多 40 字符）</li>
     *   <li>添加适当的后缀使其更像标题</li>
     * </ol>
     * 如果标题已被用户手动设置，则不覆盖。
     * 失败时回退到时间戳格式。
     *
     * @param sessionId 会话 ID
     */
    @Transactional
    public void generateTitle(UUID sessionId) {
        AgentSessionPO session = agentSessionRepository.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("会话不存在: " + sessionId));

        // 如果是用户手动设置的标题，不覆盖
        if ("manual".equals(session.getTitleSource())) {
            return;
        }

        try {
            // 获取第一条用户消息
            List<AgentMessagePO> messages = agentMessageRepository
                    .findBySessionIdOrderByMessageOrderAsc(sessionId);

            String title = messages.stream()
                    .filter(m -> "user".equals(m.getRole()))
                    .findFirst()
                    .map(m -> {
                        String content = m.getContent() != null ? m.getContent() : "";
                        return extractTitleFromMessage(content);
                    })
                    .orElse(null);

            // 如果没有用户消息，使用时间戳格式
            if (title == null || title.isBlank()) {
                title = "对话 " + java.time.format.DateTimeFormatter
                        .ofPattern("MM-dd HH:mm")
                        .format(java.time.LocalDateTime.now());
            }

            session.setTitle(title);
            session.setTitleSource("auto");
            agentSessionRepository.save(session);
            log.info("会话标题已自动生成: sessionId={}, title={}", sessionId, title);

        } catch (Exception e) {
            // 回退到时间戳格式
            try {
                String fallbackTitle = "对话 " + java.time.format.DateTimeFormatter
                        .ofPattern("MM-dd HH:mm")
                        .format(java.time.LocalDateTime.now());
                session.setTitle(fallbackTitle);
                session.setTitleSource("auto");
                agentSessionRepository.save(session);
                log.warn("标题自动生成失败，使用回退标题: sessionId={}, title={}", sessionId, fallbackTitle);
            } catch (Exception ex) {
                log.error("标题生成完全失败: sessionId={}", sessionId, ex);
            }
        }
    }

    /**
     * 从用户消息中智能提取标题。
     * <p>
     * 去除常见前缀，保留核心主题内容。
     */
    private String extractTitleFromMessage(String content) {
        if (content == null || content.isBlank()) return null;

        String trimmed = content.trim();

        // 去除常见中文请求前缀
        String[] zhPrefixes = {
                "请帮我设计", "请帮我写", "请帮我创建", "请帮我生成", "请帮我构思",
                "请帮我", "请设计", "请写", "请创建", "请生成", "请构思",
                "帮我设计", "帮我写", "帮我创建", "帮我生成", "帮我构思",
                "帮我", "我想要", "我需要", "我想", "我要",
                "能不能", "可否", "可以", "麻烦", "辛苦"
        };
        for (String prefix : zhPrefixes) {
            if (trimmed.startsWith(prefix)) {
                trimmed = trimmed.substring(prefix.length()).trim();
                break;
            }
        }

        // 去除常见英文请求前缀
        String[] enPrefixes = {
                "Help me design ", "Help me write ", "Help me create ", "Help me generate ",
                "Help me ", "Please help me design ", "Please help me write ", "Please help me ",
                "Please design ", "Please write ", "Please create ", "Please generate ",
                "I want to ", "I need to ", "I would like to ",
                "Can you help me ", "Can you ", "Could you ",
                "Design ", "Write ", "Create ", "Generate ",
        };
        for (String prefix : enPrefixes) {
            if (trimmed.startsWith(prefix)) {
                trimmed = trimmed.substring(prefix.length()).trim();
                break;
            }
        }

        // 去除开头的标点符号（包括中英文标点）
        trimmed = trimmed.replaceAll("^[\\p{P}\\p{S}\\s]+", "").trim();

        // 如果去前缀后为空，回退到原始截取
        if (trimmed.isEmpty()) {
            trimmed = content.trim();
        }

        // 截取核心主题（最多 40 字符），尝试在句末标点处截断
        if (trimmed.length() > 40) {
            int cutPoint = -1;
            for (char c : new char[]{'。', '！', '？', '.', '!', '?', '；', ';', '，', ','}) {
                int idx = trimmed.lastIndexOf(c, 40);
                if (idx > 15) { // 至少保留 15 个字符
                    cutPoint = idx + 1;
                    break;
                }
            }
            if (cutPoint > 0) {
                trimmed = trimmed.substring(0, cutPoint).trim();
            } else {
                trimmed = trimmed.substring(0, 40).trim();
            }
        }

        // 确保标题以完整字符结尾（不在词中间截断）
        if (trimmed.length() > 30) {
            // 尝试在最后一个空格或标点处截断
            int lastBreak = -1;
            for (int i = Math.min(trimmed.length() - 1, 35); i >= 20; i--) {
                char c = trimmed.charAt(i);
                if (c == ' ' || c == '，' || c == ',' || c == '的' || c == '了' || c == '、') {
                    lastBreak = i + 1;
                    break;
                }
            }
            if (lastBreak > 0) {
                trimmed = trimmed.substring(0, lastBreak).trim();
            }
        }

        return trimmed.isEmpty() ? null : trimmed;
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
