package io.framemind.agent.orchestration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.agentscope.core.ReActAgent;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.message.Msg;
import io.agentscope.core.message.MsgRole;
import io.agentscope.core.message.TextBlock;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.core.AgentEventBridge;
import io.framemind.agent.core.AgentScopeAgentFactory;
import io.framemind.agent.hook.BudgetHook;
import io.framemind.agent.hook.StreamingHook;
import io.framemind.agent.registry.WorkflowStepDefinition;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.AgentSessionRepository;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.service.AgentSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * 通用工作流编排器。
 * <p>
 * 负责按 workflowStep 将用户消息分发给对应的 Agent，并通过 WebSocket 流式推送结果。
 * <p>
 * workflowStep → agent 的映射通过 {@link WorkflowStepDefinition} 注册表获取，
 * 由各业务模块自行注册（如 ScriptMind 的 worldview→creative_agent 等）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineOrchestrator {

    private final Map<String, AgentDefinition> agentDefinitions;
    private final Map<String, WorkflowStepDefinition> workflowStepDefinitions;
    private final AgentScopeAgentFactory agentFactory;
    private final AgentEventBridge eventBridge;
    private final StreamingHook streamingHook;
    private final BudgetHook budgetHook;
    private final AgentSessionRepository sessionRepository;
    private final ProjectRepository projectRepository;
    private final AgentSessionService agentSessionService;
    private final ObjectMapper objectMapper;

    /**
     * 分发消息到对应 Agent 并流式推送结果。
     *
     * @param projectId     项目 ID
     * @param workflowStep  工作流步骤
     * @param userMessage   用户消息
     * @param providerId    供应商 ID（可选，为 null 时使用默认）
     * @param modelName     模型名称（可选，为 null 时使用默认）
     * @param sessionId     会话 ID（可选，为 null 时创建新会话）
     * @return 会话 ID
     */
    @Async
    @Transactional
    public CompletableFuture<String> dispatchToAgent(UUID projectId, String workflowStep,
                                                     String userMessage,
                                                     String providerId, String modelName,
                                                     String sessionId) {
        WorkflowStepDefinition stepDef = workflowStepDefinitions.get(workflowStep);
        if (stepDef == null) {
            return CompletableFuture.failedFuture(
                    new IllegalArgumentException("未知的工作流步骤: " + workflowStep));
        }
        String agentName = stepDef.agentName();

        log.info("分发到 Agent: projectId={}, step={}, agent={}, provider={}, model={}, sessionId={}",
                projectId, workflowStep, agentName, providerId, modelName, sessionId);

        // 查找指定会话或创建新会话
        AgentSessionPO session;
        if (sessionId != null && !sessionId.isBlank()) {
            session = sessionRepository.findById(UUID.fromString(sessionId))
                    .orElseThrow(() -> new IllegalArgumentException("会话不存在: " + sessionId));
        } else {
            session = createSession(projectId, workflowStep, agentName);
        }

        try {
            // 更新会话状态
            session.setStatus("running");
            session.setStartedAt(LocalDateTime.now());
            sessionRepository.save(session);

            String sessionId = session.getId().toString();

            // 获取 Agent 定义
            AgentDefinition definition = agentDefinitions.get(agentName);
            if (definition == null) {
                throw new IllegalStateException("未找到 Agent 定义: " + agentName);
            }

            // 构建 Agent（使用用户选择的模型）
            ReActAgent agent = agentFactory.buildAgent(projectId, agentName, definition, providerId, modelName);

            // 构建用户消息
            Msg userMsg = Msg.builder()
                    .name("user")
                    .role(MsgRole.USER)
                    .content(TextBlock.builder().text(userMessage).build())
                    .build();

            // 创建 RuntimeContext，传入 sessionId 以便状态持久化
            RuntimeContext runtimeContext = RuntimeContext.builder()
                    .sessionId(sessionId)
                    .build();

            // 调用 Agent 并桥接事件流
            eventBridge.bridge(sessionId, agentName, agent.streamEvents(userMsg, runtimeContext), tokensConsumed -> {
                // 完成回调
                budgetHook.consumeTokens(projectId, tokensConsumed, sessionId);
                session.setStatus("completed");
                session.setCompletedAt(LocalDateTime.now());
                session.setTokensConsumed(tokensConsumed);
                sessionRepository.save(session);

                // 自动生成会话标题
                try {
                    agentSessionService.generateTitle(UUID.fromString(sessionId));
                } catch (Exception e) {
                    log.warn("自动生成标题失败: sessionId={}", sessionId, e);
                }
            });

            return CompletableFuture.completedFuture(sessionId);

        } catch (Exception e) {
            log.error("Agent 调用失败: session={}, step={}", session.getId(), workflowStep, e);
            streamingHook.onError(session.getId().toString(), "AGENT_ERROR", e.getMessage());
            session.setStatus("failed");
            session.setCompletedAt(LocalDateTime.now());
            sessionRepository.save(session);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * 触发 "AI一键生成" 功能。
     *
     * @param projectId    项目 ID
     * @param workflowStep 工作流步骤
     * @param action       生成动作
     * @param providerId   供应商 ID（可选）
     * @param modelName    模型名称（可选）
     * @return 会话 ID
     */
    @Async
    @Transactional
    public CompletableFuture<String> generateAction(UUID projectId, String workflowStep,
                                                    String action,
                                                    String providerId, String modelName) {
        WorkflowStepDefinition stepDef = workflowStepDefinitions.get(workflowStep);
        if (stepDef == null) {
            return CompletableFuture.failedFuture(
                    new IllegalArgumentException("未知的工作流步骤: " + workflowStep));
        }
        return dispatchToAgent(projectId, workflowStep, stepDef.promptTemplate(), providerId, modelName, null);
    }

    // ─── 会话管理 ────────────────────────────────────────────────

    /**
     * 创建新的会话（始终创建新会话，不再复用）。
     */
    private AgentSessionPO createSession(UUID projectId, String workflowStep, String agentName) {
        ProjectPO project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + projectId));

        AgentSessionPO session = new AgentSessionPO();
        session.setProject(project);
        session.setSessionType("chat");
        session.setWorkflowStep(workflowStep);
        session.setAgentName(agentName);
        session.setStatus("pending");

        ObjectNode inputData = objectMapper.createObjectNode();
        inputData.put("workflow_step", workflowStep);
        inputData.put("agent_name", agentName);
        session.setInputData(inputData);

        return sessionRepository.save(session);
    }
}
