package io.framemind.agent.orchestration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.agent.hook.BudgetHook;
import io.framemind.agent.hook.StreamingHook;
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
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Orchestrates the multi-agent screenplay pipeline.
 * <p>
 * The pipeline runs four stages in sequence:
 * <ol>
 *   <li><b>Showrunner</b> -- parses creative input and generates a structured outline</li>
 *   <li><b>World Builder</b> -- constructs the story bible and world setting</li>
 *   <li><b>Character Designer</b> -- designs character cards with arcs and relationships</li>
 *   <li><b>Script Doctor</b> -- reviews the combined output for quality</li>
 * </ol>
 * <p>
 * Progress is streamed to the client in real-time via {@link StreamingHook}.
 * Token consumption is tracked and enforced via {@link BudgetHook}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineOrchestrator {

    private final Map<String, AgentDefinition> agentDefinitions;
    private final AgentCallAdapter agentCallAdapter;
    private final StreamingHook streamingHook;
    private final BudgetHook budgetHook;
    private final AgentSessionRepository sessionRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    /**
     * Pipeline stage execution order.
     */
    private static final List<String> OUTLINE_PIPELINE_STAGES = List.of(
            "showrunner", "world_builder", "character_designer", "script_doctor"
    );

    // -----------------------------------------------------------------------
    //  Outline Generation
    // -----------------------------------------------------------------------

    /**
     * Execute the full outline generation pipeline asynchronously.
     *
     * @param sessionId       the agent session id (created by the API layer)
     * @param projectId       the project this pipeline operates on
     * @param input           the user's creative input text
     * @param stylePreset     optional style preset (e.g. "revenge", "romance")
     * @param targetEpisodes  the desired number of episodes
     * @return a {@link CompletableFuture} that completes with the orchestration result
     */
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeOutlineGeneration(
            String sessionId,
            UUID projectId,
            String input,
            String stylePreset,
            int targetEpisodes) {

        log.info("Starting outline generation pipeline: session={}, project={}, episodes={}",
                sessionId, projectId, targetEpisodes);

        updateSessionStatus(sessionId, "running");

        try {
            int totalTokens = 0;
            ObjectNode pipelineOutput = objectMapper.createObjectNode();

            // --- Stage 1: Showrunner ---
            String showrunnerPrompt = buildShowrunnerPrompt(input, stylePreset, targetEpisodes);
            String showrunnerOutput = executeStage(sessionId, "showrunner", showrunnerPrompt);
            totalTokens += estimateTokens(showrunnerOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(showrunnerOutput), sessionId);
            pipelineOutput.set("outline", parseJsonSafe(showrunnerOutput));

            // --- Stage 2: World Builder ---
            String worldBuilderPrompt = buildWorldBuilderPrompt(showrunnerOutput);
            String worldBuilderOutput = executeStage(sessionId, "world_builder", worldBuilderPrompt);
            totalTokens += estimateTokens(worldBuilderOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(worldBuilderOutput), sessionId);
            pipelineOutput.set("world_setting", parseJsonSafe(worldBuilderOutput));

            // --- Stage 3: Character Designer ---
            String characterPrompt = buildCharacterDesignerPrompt(showrunnerOutput, worldBuilderOutput);
            String characterOutput = executeStage(sessionId, "character_designer", characterPrompt);
            totalTokens += estimateTokens(characterOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(characterOutput), sessionId);
            pipelineOutput.set("characters", parseJsonSafe(characterOutput));

            // --- Stage 4: Script Doctor Review ---
            String reviewPrompt = buildScriptDoctorPrompt(showrunnerOutput, worldBuilderOutput, characterOutput);
            String reviewOutput = executeStage(sessionId, "script_doctor", reviewPrompt);
            totalTokens += estimateTokens(reviewOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(reviewOutput), sessionId);
            pipelineOutput.set("quality_review", parseJsonSafe(reviewOutput));

            // --- Complete ---
            streamingHook.onComplete(sessionId, pipelineOutput, totalTokens);
            updateSessionCompleted(sessionId, pipelineOutput, totalTokens);

            log.info("Outline generation completed: session={}, tokens={}", sessionId, totalTokens);
            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.success(sessionId, pipelineOutput, totalTokens));

        } catch (Exception e) {
            log.error("Outline generation failed: session={}", sessionId, e);
            streamingHook.onError(sessionId, "PIPELINE_ERROR", e.getMessage());
            updateSessionFailed(sessionId, e.getMessage());
            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.failure(sessionId, e.getMessage()));
        }
    }

    // -----------------------------------------------------------------------
    //  Script Refinement
    // -----------------------------------------------------------------------

    /**
     * Execute script refinement: take an outline and produce a detailed script.
     */
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeScriptRefinement(
            String sessionId, UUID projectId, String outlineContent) {

        log.info("Starting script refinement: session={}, project={}", sessionId, projectId);
        updateSessionStatus(sessionId, "running");

        try {
            int totalTokens = 0;
            ObjectNode pipelineOutput = objectMapper.createObjectNode();

            // Showrunner expands the outline into full script beats
            String expandPrompt = "请将以下大纲扩展为详细的剧本节拍（beat sheet）：\n\n" + outlineContent;
            String expandedOutput = executeStage(sessionId, "showrunner", expandPrompt);
            totalTokens += estimateTokens(expandedOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(expandedOutput), sessionId);
            pipelineOutput.set("script_beats", parseJsonSafe(expandedOutput));

            // Script Doctor reviews the expanded script
            String reviewPrompt = "请审校以下剧本节拍的质量，检查节奏和逻辑：\n\n" + expandedOutput;
            String reviewOutput = executeStage(sessionId, "script_doctor", reviewPrompt);
            totalTokens += estimateTokens(reviewOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(reviewOutput), sessionId);
            pipelineOutput.set("quality_review", parseJsonSafe(reviewOutput));

            streamingHook.onComplete(sessionId, pipelineOutput, totalTokens);
            updateSessionCompleted(sessionId, pipelineOutput, totalTokens);

            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.success(sessionId, pipelineOutput, totalTokens));

        } catch (Exception e) {
            log.error("Script refinement failed: session={}", sessionId, e);
            streamingHook.onError(sessionId, "REFINEMENT_ERROR", e.getMessage());
            updateSessionFailed(sessionId, e.getMessage());
            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.failure(sessionId, e.getMessage()));
        }
    }

    // -----------------------------------------------------------------------
    //  File Import
    // -----------------------------------------------------------------------

    /**
     * Execute file import: parse uploaded file content into screenplay format.
     */
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeFileImport(
            String sessionId, UUID projectId, String fileContent, String fileName) {

        log.info("Starting file import: session={}, project={}, file={}", sessionId, projectId, fileName);
        updateSessionStatus(sessionId, "running");

        try {
            int totalTokens = 0;
            ObjectNode pipelineOutput = objectMapper.createObjectNode();

            String importPrompt = "请将以下文件内容解析并转换为标准剧本格式。文件名: "
                    + fileName + "\n\n内容:\n" + fileContent;
            String importOutput = executeStage(sessionId, "showrunner", importPrompt);
            totalTokens += estimateTokens(importOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(importOutput), sessionId);
            pipelineOutput.set("imported_script", parseJsonSafe(importOutput));

            streamingHook.onComplete(sessionId, pipelineOutput, totalTokens);
            updateSessionCompleted(sessionId, pipelineOutput, totalTokens);

            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.success(sessionId, pipelineOutput, totalTokens));

        } catch (Exception e) {
            log.error("File import failed: session={}", sessionId, e);
            streamingHook.onError(sessionId, "IMPORT_ERROR", e.getMessage());
            updateSessionFailed(sessionId, e.getMessage());
            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.failure(sessionId, e.getMessage()));
        }
    }

    // -----------------------------------------------------------------------
    //  URL Import
    // -----------------------------------------------------------------------

    /**
     * Execute URL import: fetch content from URL and convert to screenplay format.
     */
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeUrlImport(
            String sessionId, UUID projectId, String url) {

        log.info("Starting URL import: session={}, project={}, url={}", sessionId, projectId, url);
        updateSessionStatus(sessionId, "running");

        try {
            int totalTokens = 0;
            ObjectNode pipelineOutput = objectMapper.createObjectNode();

            String importPrompt = "请从以下 URL 抓取内容并转换为标准剧本格式: " + url;
            String importOutput = executeStage(sessionId, "showrunner", importPrompt);
            totalTokens += estimateTokens(importOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(importOutput), sessionId);
            pipelineOutput.set("imported_script", parseJsonSafe(importOutput));

            streamingHook.onComplete(sessionId, pipelineOutput, totalTokens);
            updateSessionCompleted(sessionId, pipelineOutput, totalTokens);

            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.success(sessionId, pipelineOutput, totalTokens));

        } catch (Exception e) {
            log.error("URL import failed: session={}", sessionId, e);
            streamingHook.onError(sessionId, "IMPORT_ERROR", e.getMessage());
            updateSessionFailed(sessionId, e.getMessage());
            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.failure(sessionId, e.getMessage()));
        }
    }

    // -----------------------------------------------------------------------
    //  Segment Optimization
    // -----------------------------------------------------------------------

    /**
     * Execute segment optimization: improve a selected piece of dialogue or action.
     */
    @Async
    @Transactional
    public CompletableFuture<AgentOrchestrationResult> executeOptimization(
            String sessionId, UUID projectId, String text, String elementType, String context) {

        log.info("Starting segment optimization: session={}, project={}, type={}", sessionId, projectId, elementType);
        updateSessionStatus(sessionId, "running");

        try {
            int totalTokens = 0;
            ObjectNode pipelineOutput = objectMapper.createObjectNode();

            String optimizePrompt = String.format(
                    "请优化以下剧本片段。元素类型: %s\n上下文: %s\n原文:\n%s\n\n"
                            + "请提供 2-3 个优化方案，每个方案包含优化文本、风格标签和理由。",
                    elementType, context != null ? context : "无", text);

            String optimizeOutput = executeStage(sessionId, "script_doctor", optimizePrompt);
            totalTokens += estimateTokens(optimizeOutput);
            budgetHook.consumeTokens(projectId, estimateTokens(optimizeOutput), sessionId);
            pipelineOutput.set("optimization_result", parseJsonSafe(optimizeOutput));

            streamingHook.onComplete(sessionId, pipelineOutput, totalTokens);
            updateSessionCompleted(sessionId, pipelineOutput, totalTokens);

            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.success(sessionId, pipelineOutput, totalTokens));

        } catch (Exception e) {
            log.error("Segment optimization failed: session={}", sessionId, e);
            streamingHook.onError(sessionId, "OPTIMIZATION_ERROR", e.getMessage());
            updateSessionFailed(sessionId, e.getMessage());
            return CompletableFuture.completedFuture(
                    AgentOrchestrationResult.failure(sessionId, e.getMessage()));
        }
    }

    // -----------------------------------------------------------------------
    //  Internal Helpers
    // -----------------------------------------------------------------------

    /**
     * Execute a single pipeline stage: notify start, call the agent, notify completion.
     *
     * @return the full response text from the agent
     */
    private String executeStage(String sessionId, String stageName, String prompt) {
        AgentDefinition definition = agentDefinitions.get(stageName);
        if (definition == null) {
            throw new IllegalStateException("Unknown agent stage: " + stageName);
        }

        streamingHook.onStageStart(sessionId, stageName, "started");

        String response = agentCallAdapter.call(definition, prompt, chunk -> {
            streamingHook.onStreamChunk(sessionId, stageName, chunk);
        });

        streamingHook.onStageStart(sessionId, stageName, "completed");
        return response;
    }

    // -----------------------------------------------------------------------
    //  Prompt Builders
    // -----------------------------------------------------------------------

    private String buildShowrunnerPrompt(String input, String stylePreset, int targetEpisodes) {
        return String.format(
                "请根据以下创意输入生成结构化故事大纲。\n\n"
                        + "创意输入:\n%s\n\n"
                        + "风格预设: %s\n"
                        + "目标集数: %d\n\n"
                        + "请输出 JSON 格式的大纲，包含 title, theme, logline, episode_list, hook_design 等字段。",
                input,
                stylePreset != null ? stylePreset : "默认",
                targetEpisodes);
    }

    private String buildWorldBuilderPrompt(String outlineJson) {
        return "请根据以下故事大纲构建完整的世界观设定：\n\n"
                + outlineJson
                + "\n\n请输出 JSON 格式的世界观设定，包含 setting, locations, rules, timeline 等字段。";
    }

    private String buildCharacterDesignerPrompt(String outlineJson, String worldJson) {
        return "请根据以下故事大纲和世界观设定设计角色卡片：\n\n"
                + "## 故事大纲\n" + outlineJson + "\n\n"
                + "## 世界观\n" + worldJson
                + "\n\n请输出 JSON 数组格式的角色卡片，每个角色包含 name, role, personality, "
                + "appearance, background, goal, arc, relationships 等字段。";
    }

    private String buildScriptDoctorPrompt(String outlineJson, String worldJson, String characterJson) {
        return "请审校以下剧本创意的整体质量：\n\n"
                + "## 故事大纲\n" + outlineJson + "\n\n"
                + "## 世界观\n" + worldJson + "\n\n"
                + "## 角色\n" + characterJson
                + "\n\n请输出 JSON 格式的审校报告，包含 overall_score, strengths, issues, suggestions, "
                + "foreshadow_status 等字段。";
    }

    // -----------------------------------------------------------------------
    //  Session Persistence Helpers
    // -----------------------------------------------------------------------

    private void updateSessionStatus(String sessionId, String status) {
        try {
            UUID id = UUID.fromString(sessionId);
            sessionRepository.findById(id).ifPresent(session -> {
                session.setStatus(status);
                if ("running".equals(status)) {
                    session.setStartedAt(LocalDateTime.now());
                }
                sessionRepository.save(session);
            });
        } catch (IllegalArgumentException e) {
            log.warn("Invalid session id format: {}", sessionId);
        }
    }

    private void updateSessionCompleted(String sessionId, JsonNode outputData, int tokensConsumed) {
        try {
            UUID id = UUID.fromString(sessionId);
            sessionRepository.findById(id).ifPresent(session -> {
                session.setStatus("completed");
                session.setOutputData(outputData);
                session.setTokensConsumed(tokensConsumed);
                session.setCompletedAt(LocalDateTime.now());
                sessionRepository.save(session);
            });
        } catch (IllegalArgumentException e) {
            log.warn("Invalid session id format: {}", sessionId);
        }
    }

    private void updateSessionFailed(String sessionId, String errorMessage) {
        try {
            UUID id = UUID.fromString(sessionId);
            sessionRepository.findById(id).ifPresent(session -> {
                session.setStatus("failed");
                ObjectNode errorOutput = objectMapper.createObjectNode();
                errorOutput.put("error", errorMessage);
                session.setOutputData(errorOutput);
                session.setCompletedAt(LocalDateTime.now());
                sessionRepository.save(session);
            });
        } catch (IllegalArgumentException e) {
            log.warn("Invalid session id format: {}", sessionId);
        }
    }

    // -----------------------------------------------------------------------
    //  Utility
    // -----------------------------------------------------------------------

    /**
     * Estimate token count from text (rough approximation: ~1.3 tokens per Chinese character,
     * ~0.75 tokens per English word).
     */
    private int estimateTokens(String text) {
        if (text == null || text.isEmpty()) return 0;
        // Simple heuristic: count characters and multiply
        int chineseChars = 0;
        int otherChars = 0;
        for (char c : text.toCharArray()) {
            if (Character.UnicodeScript.of(c) == Character.UnicodeScript.HAN) {
                chineseChars++;
            } else {
                otherChars++;
            }
        }
        return (int) (chineseChars * 1.3 + otherChars * 0.4);
    }

    /**
     * Parse a string as JSON, falling back to a plain-text JSON node if parsing fails.
     */
    private JsonNode parseJsonSafe(String text) {
        try {
            return objectMapper.readTree(text);
        } catch (Exception e) {
            // Not valid JSON -- wrap as a plain text node
            return objectMapper.valueToTree(Map.of("text", text));
        }
    }
}
