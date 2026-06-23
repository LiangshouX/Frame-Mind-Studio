package io.framemind.agent.orchestration;

import com.fasterxml.jackson.databind.JsonNode;
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
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.AgentSessionRepository;
import io.framemind.infrastructure.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * ScriptMind 工作流编排器。
 * <p>
 * 负责按 workflowStep 将用户消息分发给对应的 Agent，并通过 WebSocket 流式推送结果。
 * <p>
 * 每个 workflowStep 对应一个专用 Agent：
 * <ul>
 *   <li>worldview → creative_agent</li>
 *   <li>synopsis → synopsis_agent</li>
 *   <li>characters → character_agent</li>
 *   <li>outline → outline_agent</li>
 *   <li>script → script_agent</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineOrchestrator {

    private final Map<String, AgentDefinition> agentDefinitions;
    private final AgentScopeAgentFactory agentFactory;
    private final AgentEventBridge eventBridge;
    private final StreamingHook streamingHook;
    private final BudgetHook budgetHook;
    private final AgentSessionRepository sessionRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    /** workflowStep → agentName 映射 */
    private static final Map<String, String> STEP_TO_AGENT = Map.of(
            "worldview", "creative_agent",
            "synopsis", "synopsis_agent",
            "characters", "character_agent",
            "outline", "outline_agent",
            "script", "script_agent"
    );

    /**
     * 分发消息到对应 Agent 并流式推送结果。
     *
     * @param projectId     项目 ID
     * @param workflowStep  工作流步骤
     * @param userMessage   用户消息
     * @return 会话 ID
     */
    @Async
    @Transactional
    public CompletableFuture<String> dispatchToAgent(UUID projectId, String workflowStep,
                                                     String userMessage) {
        String agentName = STEP_TO_AGENT.get(workflowStep);
        if (agentName == null) {
            return CompletableFuture.failedFuture(
                    new IllegalArgumentException("未知的工作流步骤: " + workflowStep));
        }

        log.info("分发到 Agent: projectId={}, step={}, agent={}", projectId, workflowStep, agentName);

        // 查找或创建会话
        AgentSessionPO session = findOrCreateSession(projectId, workflowStep, agentName);

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

            // 构建 Agent
            ReActAgent agent = agentFactory.buildAgent(projectId, agentName, definition);

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
     * @return 会话 ID
     */
    @Async
    @Transactional
    public CompletableFuture<String> generateAction(UUID projectId, String workflowStep,
                                                    String action) {
        String prompt = buildGenerationPrompt(workflowStep, action, projectId);
        return dispatchToAgent(projectId, workflowStep, prompt);
    }

    // ─── 会话管理 ────────────────────────────────────────────────

    /**
     * 查找或创建指定 workflowStep 的会话。
     */
    private AgentSessionPO findOrCreateSession(UUID projectId, String workflowStep, String agentName) {
        // 查找该 workflowStep 的最新会话
        Optional<AgentSessionPO> existing = sessionRepository
                .findByProjectIdAndWorkflowStepOrderByCreatedAtDesc(projectId, workflowStep)
                .stream()
                .findFirst();

        if (existing.isPresent()) {
            return existing.get();
        }

        // 创建新会话
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

    // ─── 提示词构建 ────────────────────────────────────────────────

    private String buildGenerationPrompt(String workflowStep, String action, UUID projectId) {
        return switch (workflowStep) {
            case "worldview" -> """
                    请根据当前项目信息，生成一份完整的世界观设定。
                    包含：题材类型、风格基调、时代背景、世界观设定描述、核心冲突、独特卖点、世界观规则、关键地点、主题。
                    请以结构化方式输出。
                    """;
            case "synopsis" -> """
                    请基于当前世界观设定，生成一份完整的作品梗概。
                    包含：故事主线、核心冲突、主要转折点、结局走向、主题。
                    """;
            case "characters" -> """
                    请根据世界观和梗概，设计完整的角色卡片。
                    每个角色包含：名称、性别、角色定位、身份、人设、外貌、背景、性格、关系、弧光。
                    至少设计 3-6 个角色。
                    """;
            case "outline" -> """
                    请根据世界观、梗概和角色设定，生成一份完整的故事大纲。
                    短剧格式：包含集数规划、每集场景、节拍设计。
                    电影格式：包含幕结构、序列、场景。
                    """;
            case "script" -> """
                    请根据大纲结构，逐集生成完整的剧本内容。
                    每集包含：场景标题、时间地点、动作描写、对白。
                    """;
            default -> "请根据当前上下文进行创作。";
        };
    }

    // ─── 旧接口兼容（保留但标记为 @Deprecated）────────────────────

    @Deprecated
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeOutlineGeneration(
            String sessionId, UUID projectId, String input, String stylePreset, int targetEpisodes) {
        log.warn("executeOutlineGeneration 已废弃，请使用 dispatchToAgent");
        String prompt = String.format("请生成结构化大纲。创意输入: %s, 风格: %s, 集数: %d",
                input, stylePreset != null ? stylePreset : "默认", targetEpisodes);
        return dispatchToAgent(projectId, "worldview", prompt)
                .thenApply(sid -> AgentOrchestrationResult.success(sid, null, 0))
                .exceptionally(e -> AgentOrchestrationResult.failure(sessionId, e.getMessage()));
    }

    @Deprecated
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeScriptRefinement(
            String sessionId, UUID projectId, String outlineContent) {
        log.warn("executeScriptRefinement 已废弃，请使用 dispatchToAgent");
        return dispatchToAgent(projectId, "script", "请精修以下剧本:\n" + outlineContent)
                .thenApply(sid -> AgentOrchestrationResult.success(sid, null, 0))
                .exceptionally(e -> AgentOrchestrationResult.failure(sessionId, e.getMessage()));
    }

    @Deprecated
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeFileImport(
            String sessionId, UUID projectId, String fileContent, String fileName) {
        log.warn("executeFileImport 已废弃，请使用 dispatchToAgent");
        return dispatchToAgent(projectId, "worldview", "请导入文件: " + fileName + "\n" + fileContent)
                .thenApply(sid -> AgentOrchestrationResult.success(sid, null, 0))
                .exceptionally(e -> AgentOrchestrationResult.failure(sessionId, e.getMessage()));
    }

    @Deprecated
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeUrlImport(
            String sessionId, UUID projectId, String url) {
        log.warn("executeUrlImport 已废弃，请使用 dispatchToAgent");
        return dispatchToAgent(projectId, "worldview", "请从 URL 导入: " + url)
                .thenApply(sid -> AgentOrchestrationResult.success(sid, null, 0))
                .exceptionally(e -> AgentOrchestrationResult.failure(sessionId, e.getMessage()));
    }

    @Deprecated
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeCharacterGeneration(
            String sessionId, UUID projectId, String worldSetting, String synopsis) {
        log.warn("executeCharacterGeneration 已废弃，请使用 dispatchToAgent");
        return dispatchToAgent(projectId, "characters",
                String.format("请根据世界观和梗概生成角色。\n世界观: %s\n梗概: %s", worldSetting, synopsis))
                .thenApply(sid -> AgentOrchestrationResult.success(sid, null, 0))
                .exceptionally(e -> AgentOrchestrationResult.failure(sessionId, e.getMessage()));
    }

    @Deprecated
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeScriptGeneration(
            String sessionId, UUID projectId, String outline, String characters) {
        log.warn("executeScriptGeneration 已废弃，请使用 dispatchToAgent");
        return dispatchToAgent(projectId, "script",
                String.format("请根据大纲和角色生成剧本。\n大纲: %s\n角色: %s", outline, characters))
                .thenApply(sid -> AgentOrchestrationResult.success(sid, null, 0))
                .exceptionally(e -> AgentOrchestrationResult.failure(sessionId, e.getMessage()));
    }

    @Deprecated
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeReview(
            String sessionId, UUID projectId, String scriptContent, String foreshadowInfo) {
        log.warn("executeReview 已废弃，请使用 dispatchToAgent");
        return dispatchToAgent(projectId, "script", "请审校以下剧本:\n" + scriptContent)
                .thenApply(sid -> AgentOrchestrationResult.success(sid, null, 0))
                .exceptionally(e -> AgentOrchestrationResult.failure(sessionId, e.getMessage()));
    }

    @Deprecated
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeOptimization(
            String sessionId, UUID projectId, String text, String elementType, String context) {
        log.warn("executeOptimization 已废弃，请使用 dispatchToAgent");
        return dispatchToAgent(projectId, "script",
                String.format("请优化以下%s片段:\n%s", elementType, text))
                .thenApply(sid -> AgentOrchestrationResult.success(sid, null, 0))
                .exceptionally(e -> AgentOrchestrationResult.failure(sessionId, e.getMessage()));
    }
}
