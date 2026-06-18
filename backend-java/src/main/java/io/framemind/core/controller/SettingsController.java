package io.framemind.core.controller;

import io.framemind.core.config.FramemindConfigProperties;
import io.framemind.core.dto.*;
import io.framemind.core.service.ApiKeyService;
import io.framemind.core.service.ConfigFileStore;
import io.framemind.core.service.ConnectivityTestService;
import io.framemind.core.service.ModelCatalogService;
import io.framemind.core.service.ToolConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final ApiKeyService apiKeyService;
    private final ModelCatalogService catalogService;
    private final ConfigFileStore configStore;
    private final ConnectivityTestService connectivityTestService;
    private final ToolConfigService toolConfigService;
    private final FramemindConfigProperties configProperties;

    // --- Legacy endpoints (kept for backward compat) ---

    private static final List<ModelInfo> MODEL_CATALOG = List.of(
            new ModelInfo("qwen-max", "dashscope", "通义千问 Max", "主力创作模型", true),
            new ModelInfo("gpt-4o", "openai", "GPT-4o", "复杂推理", true),
            new ModelInfo("claude-sonnet-4-6", "anthropic", "Claude Sonnet", "创意写作", true),
            new ModelInfo("deepseek-chat", "deepseek", "DeepSeek Chat", "性价比方案", true)
    );

    @GetMapping("/api-keys")
    public ResponseEntity<List<SettingsResponse>> listApiKeys() {
        return ResponseEntity.ok(apiKeyService.listApiKeys());
    }

    @PutMapping("/api-keys")
    public ResponseEntity<SettingsResponse> saveApiKey(@Valid @RequestBody SettingsRequest request) {
        return ResponseEntity.ok(apiKeyService.saveApiKey(request));
    }

    @GetMapping("/models")
    public ResponseEntity<List<ModelInfo>> listModels() {
        return ResponseEntity.ok(MODEL_CATALOG);
    }

    // --- Provider endpoints ---

    @GetMapping("/providers")
    public ResponseEntity<List<ProviderConfigResponse>> listProviders() {
        List<ProviderConfigResponse> result = new ArrayList<>();
        for (ModelCatalogService.ProviderCatalogEntry catalog : catalogService.getProviderCatalog()) {
            ConfigFileStore.ProviderEntry config = configStore.getProvider(catalog.getId());
            boolean configured = config != null && config.getApiKey() != null && !config.getApiKey().isBlank();
            String preview = configured ? maskKey(config.getApiKey()) : "";
            String lastTested = config != null ? config.getLastTested() : null;
            String lastTestResult = config != null ? config.getLastTestResult() : "UNTESTED";
            String lastTestMessage = config != null ? config.getLastTestMessage() : "";
            List<String> models = (config != null && config.getModels() != null && !config.getModels().isEmpty())
                    ? config.getModels()
                    : catalog.getAvailableModels();
            String defaultModel = config != null ? config.getDefaultModel() : null;

            result.add(new ProviderConfigResponse(
                    catalog.getId(),
                    catalog.getName(),
                    configured,
                    preview,
                    catalog.getDefaultBaseUrl(),
                    models,
                    defaultModel,
                    lastTested,
                    lastTestResult,
                    lastTestMessage
            ));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/providers/{providerId}")
    public ResponseEntity<ProviderConfigResponse> getProvider(@PathVariable String providerId) {
        ModelCatalogService.ProviderCatalogEntry catalog = catalogService.getProvider(providerId);
        if (catalog == null) {
            return ResponseEntity.notFound().build();
        }
        ConfigFileStore.ProviderEntry config = configStore.getProvider(providerId);
        boolean configured = config != null && config.getApiKey() != null && !config.getApiKey().isBlank();
        String preview = configured ? maskKey(config.getApiKey()) : "";
        List<String> models = (config != null && config.getModels() != null && !config.getModels().isEmpty())
                ? config.getModels()
                : catalog.getAvailableModels();

        return ResponseEntity.ok(new ProviderConfigResponse(
                catalog.getId(),
                catalog.getName(),
                configured,
                preview,
                config != null && config.getBaseUrl() != null ? config.getBaseUrl() : catalog.getDefaultBaseUrl(),
                models,
                config != null ? config.getDefaultModel() : null,
                config != null ? config.getLastTested() : null,
                config != null ? config.getLastTestResult() : "UNTESTED",
                config != null ? config.getLastTestMessage() : ""
        ));
    }

    @PutMapping("/providers/{providerId}")
    public ResponseEntity<ProviderConfigResponse> updateProvider(
            @PathVariable String providerId,
            @Valid @RequestBody ProviderConfigRequest request) {
        ModelCatalogService.ProviderCatalogEntry catalog = catalogService.getProvider(providerId);
        if (catalog == null) {
            return ResponseEntity.notFound().build();
        }

        ConfigFileStore.ProviderEntry entry = configStore.getProvider(providerId);
        boolean isNew = (entry == null);
        if (entry == null) {
            entry = new ConfigFileStore.ProviderEntry();
        }

        // New provider requires an API key
        if (isNew && (request.apiKey() == null || request.apiKey().isBlank())) {
            return ResponseEntity.badRequest().build();
        }

        // Update API key only if a real one is provided
        if (request.apiKey() != null && !request.apiKey().isBlank()) {
            entry.setApiKey(request.apiKey());
        }
        // Always update other fields
        entry.setBaseUrl(request.baseUrl() != null ? request.baseUrl() : catalog.getDefaultBaseUrl());
        if (request.models() != null && !request.models().isEmpty()) {
            entry.setModels(request.models());
        } else if (isNew || entry.getModels() == null || entry.getModels().isEmpty()) {
            entry.setModels(catalog.getAvailableModels());
        }
        if (request.defaultModel() != null) {
            entry.setDefaultModel(request.defaultModel());
        }
        // Reset test status on config change
        entry.setLastTestResult("UNTESTED");
        entry.setLastTestMessage("");
        configStore.putProvider(providerId, entry);

        return ResponseEntity.ok(new ProviderConfigResponse(
                catalog.getId(),
                catalog.getName(),
                true,
                maskKey(entry.getApiKey()),
                entry.getBaseUrl() != null ? entry.getBaseUrl() : catalog.getDefaultBaseUrl(),
                entry.getModels() != null && !entry.getModels().isEmpty() ? entry.getModels() : catalog.getAvailableModels(),
                entry.getDefaultModel(),
                entry.getLastTested(),
                entry.getLastTestResult(),
                entry.getLastTestMessage()
        ));
    }

    @DeleteMapping("/providers/{providerId}")
    public ResponseEntity<Map<String, Object>> deleteProvider(@PathVariable String providerId) {
        configStore.removeProvider(providerId);
        return ResponseEntity.ok(Map.of("id", providerId, "configured", false, "message", "Configuration reset"));
    }

    @PostMapping("/providers/{providerId}/test")
    public ResponseEntity<ConnectivityTestResult> testProvider(@PathVariable String providerId) {
        ConfigFileStore.ProviderEntry config = configStore.getProvider(providerId);
        if (config == null || config.getApiKey() == null || config.getApiKey().isBlank()) {
            return ResponseEntity.badRequest().body(
                    new ConnectivityTestResult(providerId, "UNKNOWN_ERROR", "Provider not configured", Instant.now().toString()));
        }
        ConnectivityTestResult result = connectivityTestService.testProvider(providerId);
        // Save test result
        config.setLastTested(result.testedAt());
        config.setLastTestResult(result.result());
        config.setLastTestMessage(result.message());
        configStore.putProvider(providerId, config);
        return ResponseEntity.ok(result);
    }

    // --- Tool endpoints (Tavily, etc.) ---

    @GetMapping("/tools")
    public ResponseEntity<List<ToolConfigResponse>> listTools() {
        return ResponseEntity.ok(toolConfigService.listTools());
    }

    @PutMapping("/tools/{toolId}")
    public ResponseEntity<ToolConfigResponse> updateTool(
            @PathVariable String toolId,
            @Valid @RequestBody ToolConfigRequest request) {
        return ResponseEntity.ok(toolConfigService.updateTool(toolId, request));
    }

    @DeleteMapping("/tools/{toolId}")
    public ResponseEntity<Map<String, Object>> deleteTool(@PathVariable String toolId) {
        toolConfigService.deleteTool(toolId);
        return ResponseEntity.ok(Map.of("toolId", toolId, "configured", false));
    }

    @PostMapping("/tools/{toolId}/test")
    public ResponseEntity<ConnectivityTestResult> testTool(@PathVariable String toolId) {
        return ResponseEntity.ok(toolConfigService.testTool(toolId));
    }

    // --- MCP Server endpoints ---

    @GetMapping("/mcp-servers")
    public ResponseEntity<List<Map<String, Object>>> listMcpServers() {
        return ResponseEntity.ok(toolConfigService.listMcpServers());
    }

    @PutMapping("/mcp-servers/{serverId}")
    public ResponseEntity<Map<String, Object>> updateMcpServer(
            @PathVariable String serverId,
            @Valid @RequestBody McpServerConfigRequest request) {
        return ResponseEntity.ok(toolConfigService.updateMcpServer(serverId, request));
    }

    @DeleteMapping("/mcp-servers/{serverId}")
    public ResponseEntity<Map<String, Object>> deleteMcpServer(@PathVariable String serverId) {
        toolConfigService.deleteMcpServer(serverId);
        return ResponseEntity.ok(Map.of("serverId", serverId, "configured", false));
    }

    @PostMapping("/mcp-servers/{serverId}/test")
    public ResponseEntity<ConnectivityTestResult> testMcpServer(@PathVariable String serverId) {
        return ResponseEntity.ok(toolConfigService.testMcpServer(serverId));
    }

    // --- Default model endpoints ---

    @GetMapping("/default-model")
    public ResponseEntity<Map<String, String>> getDefaultModel() {
        ConfigFileStore.DefaultModelEntry dm = configStore.getDefaultModel();
        if (dm == null || dm.getProvider() == null) {
            return ResponseEntity.ok(Map.of("provider", "", "model", "", "displayName", ""));
        }
        ModelCatalogService.ProviderCatalogEntry catalog = catalogService.getProvider(dm.getProvider());
        String displayName = (catalog != null ? catalog.getName() : dm.getProvider()) + " / " + dm.getModel();
        return ResponseEntity.ok(Map.of("provider", dm.getProvider(), "model", dm.getModel(), "displayName", displayName));
    }

    @PutMapping("/default-model")
    public ResponseEntity<Void> updateDefaultModel(@RequestBody Map<String, String> request) {
        ConfigFileStore.DefaultModelEntry entry = new ConfigFileStore.DefaultModelEntry();
        entry.setProvider(request.get("provider"));
        entry.setModel(request.get("model"));
        configStore.setDefaultModel(entry);
        return ResponseEntity.ok().build();
    }

    // --- Utility ---

    private String maskKey(String key) {
        if (key == null || key.length() <= 4) return "****";
        return "..." + key.substring(key.length() - 4);
    }
}
