package io.framemind.core.service;

import io.framemind.core.dto.ConnectivityTestResult;
import io.framemind.core.dto.McpServerConfigRequest;
import io.framemind.core.dto.ToolConfigRequest;
import io.framemind.core.dto.ToolConfigResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing tool configurations (Tavily, MCP servers, etc.)
 * persisted in the config file store.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ToolConfigService {

    private final ConfigFileStore configStore;
    private final ConnectivityTestService connectivityTestService;

    // --- Tool (Tavily, etc.) ---

    public List<ToolConfigResponse> listTools() {
        List<ToolConfigResponse> result = new ArrayList<>();
        // Tavily is always listed
        ConfigFileStore.ToolEntry tavily = configStore.getTool("tavily");
        boolean configured = tavily != null && tavily.getApiKey() != null && !tavily.getApiKey().isBlank();
        String preview = configured ? maskKey(tavily.getApiKey()) : "";
        result.add(new ToolConfigResponse(
                "tavily", "Tavily Search", configured, preview,
                tavily != null ? tavily.getLastTested() : null,
                tavily != null ? tavily.getLastTestResult() : "UNTESTED",
                tavily != null ? tavily.getLastTestMessage() : ""
        ));
        return result;
    }

    public ToolConfigResponse updateTool(String toolId, ToolConfigRequest request) {
        ConfigFileStore.ToolEntry entry = configStore.getTool(toolId);
        if (entry == null) {
            entry = new ConfigFileStore.ToolEntry();
        }
        entry.setApiKey(request.apiKey());
        if (request.parameters() != null) {
            entry.setParameters(request.parameters());
        }
        entry.setLastTestResult("UNTESTED");
        entry.setLastTestMessage("");
        configStore.putTool(toolId, entry);

        String name = "tavily".equals(toolId) ? "Tavily Search" : toolId;
        return new ToolConfigResponse(toolId, name, true, maskKey(request.apiKey()),
                entry.getLastTested(), entry.getLastTestResult(), entry.getLastTestMessage());
    }

    public void deleteTool(String toolId) {
        configStore.removeTool(toolId);
    }

    public ConnectivityTestResult testTool(String toolId) {
        ConfigFileStore.ToolEntry entry = configStore.getTool(toolId);
        if (entry == null || entry.getApiKey() == null || entry.getApiKey().isBlank()) {
            return new ConnectivityTestResult(toolId, "UNKNOWN_ERROR", "Tool not configured", Instant.now().toString());
        }

        ConnectivityTestResult result;
        if ("tavily".equals(toolId)) {
            result = connectivityTestService.testTavily(entry.getApiKey());
        } else {
            result = new ConnectivityTestResult(toolId, "UNKNOWN_ERROR", "Unknown tool: " + toolId, Instant.now().toString());
        }

        // Save test result
        entry.setLastTested(result.testedAt());
        entry.setLastTestResult(result.result());
        entry.setLastTestMessage(result.message());
        configStore.putTool(toolId, entry);

        return result;
    }

    // --- MCP Servers ---

    public List<Map<String, Object>> listMcpServers() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, ConfigFileStore.McpServerEntry> e : configStore.getMcpServers().entrySet()) {
            ConfigFileStore.McpServerEntry entry = e.getValue();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("serverId", e.getKey());
            item.put("name", entry.getName());
            item.put("url", entry.getUrl());
            item.put("authType", entry.getAuthType() != null ? entry.getAuthType() : "NONE");
            item.put("configured", true);
            item.put("lastTested", entry.getLastTested());
            item.put("lastTestResult", entry.getLastTestResult() != null ? entry.getLastTestResult() : "UNTESTED");
            item.put("lastTestMessage", entry.getLastTestMessage() != null ? entry.getLastTestMessage() : "");
            result.add(item);
        }
        return result;
    }

    public Map<String, Object> updateMcpServer(String serverId, McpServerConfigRequest request) {
        ConfigFileStore.McpServerEntry entry = configStore.getMcpServer(serverId);
        if (entry == null) {
            entry = new ConfigFileStore.McpServerEntry();
        }
        entry.setName(request.name());
        entry.setUrl(request.url());
        entry.setAuthType(request.authType() != null ? request.authType() : "NONE");
        entry.setCredentials(request.credentials());
        entry.setLastTestResult("UNTESTED");
        entry.setLastTestMessage("");
        configStore.putMcpServer(serverId, entry);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("serverId", serverId);
        result.put("name", entry.getName());
        result.put("url", entry.getUrl());
        result.put("authType", entry.getAuthType());
        result.put("configured", true);
        result.put("message", "Configuration saved");
        return result;
    }

    public void deleteMcpServer(String serverId) {
        configStore.removeMcpServer(serverId);
    }

    public ConnectivityTestResult testMcpServer(String serverId) {
        ConfigFileStore.McpServerEntry entry = configStore.getMcpServer(serverId);
        if (entry == null) {
            return new ConnectivityTestResult(serverId, "UNKNOWN_ERROR", "MCP server not configured", Instant.now().toString());
        }

        ConnectivityTestResult result = connectivityTestService.testMcpServer(
                entry.getUrl(), entry.getAuthType(), entry.getCredentials());

        // Save test result
        entry.setLastTested(result.testedAt());
        entry.setLastTestResult(result.result());
        entry.setLastTestMessage(result.message());
        configStore.putMcpServer(serverId, entry);

        return result;
    }

    private String maskKey(String key) {
        if (key == null || key.length() <= 4) return "****";
        return "..." + key.substring(key.length() - 4);
    }
}
