package io.framemind.agent.orchestration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.agent.client.OpenClawTaskClient;
import io.framemind.agent.client.OpenClawTaskRequest;
import io.framemind.agent.client.OpenClawTaskResponse;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.hook.BudgetHook;
import io.framemind.agent.hook.StreamingHook;
import io.framemind.agent.registry.WorkflowStepDefinition;
import io.framemind.core.service.ModelConfigService;
import io.framemind.infrastructure.po.AgentMessagePO;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.po.OpenClawTaskPO;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.AgentMessageRepository;
import io.framemind.infrastructure.repository.AgentSessionRepository;
import io.framemind.infrastructure.repository.OpenClawTaskRepository;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.service.AgentSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * 通用工作流编排器。
 * <p>
 * 负责按 workflowStep 将用户消息分发给对应的 OpenClaw Agent，
 * 通过 OpenClaw Webhooks 插件发起任务，并通过 WebSocket 流式推送结果。
 * <p>
 * 通信流程：Java → OpenClaw Webhook (create_flow → run_task → poll → finish_flow)
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
    private final OpenClawTaskClient openClawClient;
    private final AgentMessageHistoryBuilder historyBuilder;
    private final ModelConfigService modelConfigService;
    private final StreamingHook streamingHook;
    private final BudgetHook budgetHook;
    private final AgentSessionRepository sessionRepository;
    private final AgentMessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final OpenClawTaskRepository openClawTaskRepository;
    private final AgentSessionService agentSessionService;
    private final ObjectMapper objectMapper;

    /**
     * 分发消息到对应 OpenClaw Agent（通过 Webhooks 插件）并推送结果到 WebSocket。
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

        log.info("分发到 OpenClaw Agent: projectId={}, step={}, agent={}, provider={}, model={}, sessionId={}",
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

            String actualSessionId = session.getId().toString();

            // 获取 Agent 定义
            AgentDefinition definition = agentDefinitions.get(agentName);
            if (definition == null) {
                throw new IllegalStateException("未找到 Agent 定义: " + agentName);
            }

            // 解析模型配置（传递给 OpenClaw）
            ModelConfigService.ModelConfig modelConfig =
                    modelConfigService.resolveModelConfig(providerId, modelName);

            // 构建对话历史
            List<OpenClawTaskRequest.ChatMessage> history =
                    historyBuilder.buildHistory(session.getId(), 20);

            // 构建 OpenClaw 请求参数
            String taskId = UUID.randomUUID().toString();
            Map<String, Object> parameters = new LinkedHashMap<>();
            parameters.put("project_id", projectId.toString());
            parameters.put("agent_name", agentName);
            parameters.put("system_prompt", definition.systemPrompt());
            parameters.put("task_type", definition.taskType());
            if (definition.skills() != null && !definition.skills().isEmpty()) {
                parameters.put("skills", definition.skills());
            }
            if (definition.agentParams() != null) {
                parameters.putAll(definition.agentParams());
            }

            // 传递模型配置（可选，未配置时 OpenClaw 使用自身默认）
            if (modelConfig != null) {
                parameters.put("model_provider", modelConfig.providerId());
                parameters.put("model_name", modelConfig.modelName());
                parameters.put("api_key", modelConfig.apiKey());
                parameters.put("base_url", modelConfig.baseUrl());
                parameters.put("provider_type", modelConfig.providerType());
            }

            // 构建任务请求
            OpenClawTaskRequest request = new OpenClawTaskRequest(
                    actualSessionId,
                    taskId,
                    definition.taskType(),
                    userMessage,
                    parameters,
                    history
            );

            // 记录任务到 openclaw_tasks 表
            OpenClawTaskPO taskPO = new OpenClawTaskPO();
            taskPO.setSession(session);
            taskPO.setTaskId(taskId);
            taskPO.setTaskType(definition.taskType());
            taskPO.setAgentName(agentName);
            taskPO.setStatus("running");
            taskPO.setStartedAt(LocalDateTime.now());
            try {
                taskPO.setRequestPayload(objectMapper.valueToTree(request));
            } catch (Exception e) {
                log.debug("序列化请求载荷失败", e);
            }
            openClawTaskRepository.save(taskPO);

            // 调用 OpenClaw Webhook（同步等待最终结果）
            OpenClawTaskResponse response = openClawClient.submitTask(request);

            // 提取助手回复文本
            String assistantContent = extractAssistantContent(response);

            // 推送流式输出到 WebSocket
            if (assistantContent != null && !assistantContent.isBlank()) {
                streamingHook.onStreamChunk(actualSessionId, agentName, assistantContent);

                // 持久化助手消息
                persistAssistantMessage(session, taskId, agentName, assistantContent);
            }

            // 推送完成事件到 WebSocket
            int totalTokens = response.tokenUsage() != null ? response.tokenUsage().totalTokens() : 0;
            streamingHook.onComplete(actualSessionId, response.result(), totalTokens);

            // 处理完成响应
            session.setStatus("completed");
            session.setCompletedAt(LocalDateTime.now());

            // Token 消耗
            if (totalTokens > 0) {
                session.setTokensConsumed(totalTokens);
                try {
                    budgetHook.consumeTokens(projectId, totalTokens, actualSessionId);
                } catch (Exception e) {
                    log.warn("预算扣减失败: sessionId={}", actualSessionId, e);
                }
            }
            sessionRepository.save(session);

            // 更新任务记录
            taskPO.setStatus("completed");
            taskPO.setCompletedAt(LocalDateTime.now());
            if (response.result() != null) {
                taskPO.setResponsePayload(response.result());
            }
            if (response.tokenUsage() != null) {
                taskPO.setTokenUsage(objectMapper.valueToTree(response.tokenUsage()));
            }
            if (response.usedSkills() != null) {
                taskPO.setUsedSkills(objectMapper.valueToTree(response.usedSkills()));
            }
            openClawTaskRepository.save(taskPO);

            // 自动生成会话标题
            try {
                agentSessionService.generateTitle(UUID.fromString(actualSessionId));
            } catch (Exception e) {
                log.warn("自动生成标题失败: sessionId={}", actualSessionId, e);
            }

            return CompletableFuture.completedFuture(actualSessionId);

        } catch (Exception e) {
            log.error("OpenClaw Agent 调用失败: session={}, step={}", session.getId(), workflowStep, e);
            streamingHook.onError(session.getId().toString(), "OPENCLAW_ERROR", e.getMessage());
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
     * 创建新的会话（委托给 AgentSessionService，始终创建新会话，不再复用）。
     */
    private AgentSessionPO createSession(UUID projectId, String workflowStep, String agentName) {
        ProjectPO project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + projectId));

        ObjectNode inputData = objectMapper.createObjectNode();
        inputData.put("workflow_step", workflowStep);
        inputData.put("agent_name", agentName);

        return agentSessionService.createSession(project, "chat", workflowStep, agentName, inputData);
    }

    // ─── 结果处理 ────────────────────────────────────────────────

    /**
     * 从 OpenClaw 响应中提取助手回复文本。
     */
    private String extractAssistantContent(OpenClawTaskResponse response) {
        if (response.result() == null) return null;

        var result = response.result();

        // 纯文本
        if (result.isTextual()) return result.asText();

        // result.output
        if (result.has("output")) {
            var output = result.get("output");
            return output.isTextual() ? output.asText() : output.toString();
        }

        // result.content
        if (result.has("content")) {
            var content = result.get("content");
            return content.isTextual() ? content.asText() : content.toString();
        }

        // result.text
        if (result.has("text")) {
            var text = result.get("text");
            return text.isTextual() ? text.asText() : text.toString();
        }

        // 兜底：整个 JSON 序列化
        return result.toString();
    }

    /**
     * 持久化助手消息到 agent_messages 表。
     */
    private void persistAssistantMessage(AgentSessionPO session, String taskId,
                                          String agentName, String content) {
        try {
            AgentMessagePO message = new AgentMessagePO();
            message.setSession(session);
            message.setRole("assistant");
            message.setContent(content);
            message.setMessageType("text");
            message.setAgentName(agentName);
            message.setTaskId(taskId);

            int maxOrder = messageRepository
                    .findMaxMessageOrderBySessionId(session.getId())
                    .orElse(-1);
            message.setMessageOrder(maxOrder + 1);

            messageRepository.save(message);
        } catch (Exception e) {
            log.warn("持久化助手消息失败: sessionId={}", session.getId(), e);
        }
    }
}
