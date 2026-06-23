package io.framemind.agent.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.agentscope.core.tool.Tool;
import io.agentscope.core.tool.ToolParam;
import io.framemind.core.service.ConfigFileStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * 网络搜索工具，封装 Tavily API。
 * <p>
 * 供 Agent 通过 @Tool 注解调用，搜索当前市场上的相关内容。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSearchTool {

    private final ConfigFileStore configFileStore;
    private final ObjectMapper objectMapper;

    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Tool(name = "web_search", description = "搜索互联网获取最新信息。输入搜索关键词，返回相关搜索结果摘要。")
    public String webSearch(
            @ToolParam(name = "query", description = "搜索关键词") String query) {

        ConfigFileStore.ToolEntry tavilyConfig = configFileStore.getTool("tavily");
        if (tavilyConfig == null || tavilyConfig.getApiKey() == null) {
            return "错误：Tavily API 未配置，请在设置中配置 Tavily API Key";
        }

        try {
            String apiKey = tavilyConfig.getApiKey();
            String requestBody = objectMapper.writeValueAsString(new TavilyRequest(apiKey, query));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.tavily.com/search"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return formatSearchResults(response.body());
        } catch (Exception e) {
            log.error("Tavily 搜索失败: query={}", query, e);
            return "搜索失败: " + e.getMessage();
        }
    }

    private String formatSearchResults(String rawResponse) {
        if (rawResponse == null) return "搜索无结果";
        try {
            var root = objectMapper.readTree(rawResponse);

            StringBuilder sb = new StringBuilder();
            if (root.has("answer")) {
                sb.append("## 摘要\n").append(root.get("answer").asText()).append("\n\n");
            }
            if (root.has("results")) {
                sb.append("## 搜索结果\n");
                for (var result : root.get("results")) {
                    sb.append("- **").append(result.path("title").asText()).append("**\n");
                    sb.append("  ").append(result.path("content").asText()).append("\n");
                    sb.append("  来源: ").append(result.path("url").asText()).append("\n\n");
                }
            }
            return sb.length() > 0 ? sb.toString() : "搜索无结果";
        } catch (Exception e) {
            log.warn("解析搜索结果失败", e);
            return rawResponse;
        }
    }

    /** Tavily API 请求体 */
    private record TavilyRequest(String api_key, String query, int max_results, boolean include_answer) {
        TavilyRequest(String apiKey, String query) {
            this(apiKey, query, 5, true);
        }
    }
}
