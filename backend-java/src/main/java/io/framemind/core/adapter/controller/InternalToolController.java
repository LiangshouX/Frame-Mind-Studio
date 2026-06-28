package io.framemind.core.adapter.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.framemind.core.service.ConfigFileStore;
import io.framemind.modules.scriptmind.dto.CharacterListResponse;
import io.framemind.modules.scriptmind.dto.OutlineResponse;
import io.framemind.modules.scriptmind.dto.SynopsisResponse;
import io.framemind.modules.scriptmind.dto.WorldSettingResponse;
import io.framemind.modules.scriptmind.po.ScriptPO;
import io.framemind.modules.scriptmind.service.CharacterService;
import io.framemind.modules.scriptmind.service.OutlineService;
import io.framemind.modules.scriptmind.service.ScriptService;
import io.framemind.modules.scriptmind.service.SynopsisService;
import io.framemind.modules.scriptmind.service.WorldSettingService;
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
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * 内部工具控制器，为 OpenClaw Skills 提供 REST API 接口。
 * <p>
 * 包含聚合上下文加载、Tavily 网络搜索、剧本保存与一致性检查等功能。
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/internal/tools")
@RequiredArgsConstructor
public class InternalToolController {

    private final WorldSettingService worldSettingService;
    private final SynopsisService synopsisService;
    private final CharacterService characterService;
    private final OutlineService outlineService;
    private final ScriptService scriptService;
    private final ConfigFileStore configFileStore;
    private final ObjectMapper objectMapper;

    private static final String TAVILY_API_URL = "https://api.tavily.com/search";

    // ─── 聚合上下文加载 ──────────────────────────────────────────────

    /**
     * 聚合上下文加载器，根据请求的 sections 参数返回项目的各维度内容。
     * <p>
     * 支持的 sections: worldview, synopsis, characters, outline
     *
     * @param projectId 项目 ID
     * @param sections  逗号分隔的 section 名称列表
     * @return 包含各 section 数据的聚合响应
     */
    @GetMapping("/context/{projectId}")
    public ResponseEntity<ContextResponse> getContext(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "worldview,synopsis,characters,outline") String sections) {

        List<String> requestedSections = Arrays.asList(sections.split(","));
        Map<String, Object> data = new LinkedHashMap<>();

        for (String section : requestedSections) {
            switch (section.trim().toLowerCase()) {
                case "worldview" -> {
                    WorldSettingResponse ws = worldSettingService.getWorldSetting(projectId);
                    data.put("worldview", ws != null ? ws.content() : null);
                }
                case "synopsis" -> {
                    SynopsisResponse syn = synopsisService.getSynopsis(projectId);
                    data.put("synopsis", syn != null ? syn.content() : null);
                }
                case "characters" -> {
                    CharacterListResponse chars = characterService.listCharacters(projectId);
                    data.put("characters", chars.items());
                }
                case "outline" -> {
                    OutlineResponse outline = outlineService.getOutline(projectId);
                    data.put("outline", outline != null ? outline.content() : null);
                }
                default -> log.warn("未知的 context section: {}", section);
            }
        }

        return ResponseEntity.ok(new ContextResponse(projectId, data));
    }

    // ─── Tavily 网络搜索 ─────────────────────────────────────────────

    /**
     * Tavily 网络搜索接口，接收搜索请求并调用 Tavily API 返回结果。
     *
     * @param request 搜索请求，包含 query 和可选的 max_results
     * @return Tavily API 的原始响应
     */
    @PostMapping("/web-search")
    public ResponseEntity<?> webSearch(@RequestBody WebSearchRequest request) {
        ConfigFileStore.ToolEntry tavilyConfig = configFileStore.getTool("tavily");
        if (tavilyConfig == null || tavilyConfig.getApiKey() == null) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("TAVILY_NOT_CONFIGURED", "Tavily API 未配置，请在设置中配置 Tavily API Key"));
        }

        try {
            String apiKey = tavilyConfig.getApiKey();

            // 构建 Tavily 请求体
            Map<String, Object> tavilyBody = new LinkedHashMap<>();
            tavilyBody.put("api_key", apiKey);
            tavilyBody.put("query", request.query());
            tavilyBody.put("max_results", request.maxResults() != null ? request.maxResults() : 5);
            tavilyBody.put("include_answer", true);

            // 使用 WebClient 调用 Tavily API
            WebClient webClient = WebClient.builder()
                    .baseUrl(TAVILY_API_URL)
                    .build();

            String responseBody = webClient.post()
                    .header("Content-Type", "application/json")
                    .bodyValue(tavilyBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            // 将原始 JSON 响应解析后返回
            JsonNode result = objectMapper.readTree(responseBody);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Tavily 搜索失败: query={}", request.query(), e);
            return ResponseEntity.internalServerError().body(
                    new ErrorResponse("SEARCH_FAILED", "搜索失败: " + e.getMessage()));
        }
    }

    // ─── 剧本保存场景 ────────────────────────────────────────────────

    /**
     * 保存场景内容，将指定集数的剧本内容持久化。
     *
     * @param request 保存请求，包含 project_id、episode_number 和 content
     * @return 保存结果
     */
    @PostMapping("/script/save-scene")
    public ResponseEntity<?> saveScene(@RequestBody SaveSceneRequest request) {
        try {
            UUID projectId = UUID.fromString(request.projectId());
            scriptService.updateEpisode(projectId, request.episodeNumber(), request.content());

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", String.format("第%d集内容已保存", request.episodeNumber())
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("INVALID_PROJECT_ID", "无效的项目 ID: " + request.projectId()));
        } catch (Exception e) {
            log.error("保存场景内容失败: projectId={}, ep={}", request.projectId(), request.episodeNumber(), e);
            return ResponseEntity.internalServerError().body(
                    new ErrorResponse("SAVE_FAILED", "保存场景内容失败: " + e.getMessage()));
        }
    }

    // ─── 一致性检查 ──────────────────────────────────────────────────

    /**
     * 检查剧本一致性，返回指定项目的剧本内容供一致性分析。
     *
     * @param request 一致性检查请求，包含 project_id 和可选的 from_episode
     * @return 剧本内容数据
     */
    @PostMapping("/script/check-consistency")
    public ResponseEntity<?> checkConsistency(@RequestBody CheckConsistencyRequest request) {
        try {
            UUID projectId = UUID.fromString(request.projectId());
            Optional<ScriptPO> scriptOpt = scriptService.getScriptByProjectId(projectId);

            if (scriptOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "status", "empty",
                        "message", "该项目暂无剧本内容"
                ));
            }

            ScriptPO script = scriptOpt.get();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "title", script.getTitle(),
                    "version", script.getVersion(),
                    "content", script.getContent()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("INVALID_PROJECT_ID", "无效的项目 ID: " + request.projectId()));
        } catch (Exception e) {
            log.error("一致性检查失败: projectId={}", request.projectId(), e);
            return ResponseEntity.internalServerError().body(
                    new ErrorResponse("CONSISTENCY_CHECK_FAILED", "一致性检查失败: " + e.getMessage()));
        }
    }

    // ─── 内部 Request / Response Records ─────────────────────────────

    /** 聚合上下文响应 */
    public record ContextResponse(UUID projectId, Map<String, Object> data) {}

    /** 网络搜索请求 */
    public record WebSearchRequest(String query, Integer maxResults) {}

    /** 保存场景请求 */
    public record SaveSceneRequest(String projectId, int episodeNumber, JsonNode content) {}

    /** 一致性检查请求 */
    public record CheckConsistencyRequest(String projectId, Integer fromEpisode) {}

    /** 错误响应 */
    public record ErrorResponse(String code, String message) {}
}
