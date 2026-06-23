package io.framemind.core.service;

import io.agentscope.core.model.DashScopeChatModel;
import io.agentscope.core.model.Model;
import io.agentscope.core.model.OpenAIChatModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 模型路由服务，集中管理模型解析和构建。
 * <p>
 * 读取用户配置（{@link ConfigFileStore}）和目录元数据（{@link ModelCatalogService}），
 * 提供可用模型列表查询和 AgentScope {@link Model} 实例构建。
 */
@Slf4j
@Service
public class ModelRouterService {

    private final ConfigFileStore configStore;
    private final ModelCatalogService catalogService;

    public ModelRouterService(ConfigFileStore configStore, ModelCatalogService catalogService) {
        this.configStore = configStore;
        this.catalogService = catalogService;
    }

    /**
     * 获取所有可用模型（按供应商分组）。
     * 仅返回已配置 API Key 的供应商的模型。
     */
    public List<ProviderWithModels> getAvailableModels() {
        List<ProviderWithModels> result = new ArrayList<>();

        for (ModelCatalogService.ProviderCatalogEntry catalog : catalogService.getProviderCatalog()) {
            String providerId = catalog.getId();
            ConfigFileStore.ProviderEntry userConfig = configStore.getProvider(providerId);

            boolean hasApiKey = userConfig != null
                    && userConfig.getApiKey() != null
                    && !userConfig.getApiKey().isBlank();

            List<ModelInfo> models = new ArrayList<>();
            // 使用用户配置的模型列表，如果没有则使用目录默认列表
            List<String> modelNames = (userConfig != null && userConfig.getModels() != null
                    && !userConfig.getModels().isEmpty())
                    ? userConfig.getModels()
                    : catalog.getAvailableModels();

            for (String modelName : modelNames) {
                models.add(new ModelInfo(modelName, modelName));
            }

            result.add(new ProviderWithModels(
                    providerId,
                    catalog.getName(),
                    catalog.getType(),
                    hasApiKey,
                    models
            ));
        }

        return result;
    }

    /**
     * 获取首个可用的模型选择（第一个有 API Key 的供应商的第一个模型）。
     */
    public ModelSelection getDefaultModelSelection() {
        for (ProviderWithModels provider : getAvailableModels()) {
            if (provider.available() && !provider.models().isEmpty()) {
                return new ModelSelection(provider.providerId(), provider.models().get(0).modelId());
            }
        }
        return null;
    }

    /**
     * 构建 AgentScope Model 实例。
     *
     * @param providerId 供应商 ID（如 "deepseek"、"dashscope"、"mimo"）
     * @param modelName  模型名称（如 "deepseek-chat"、"qwen-max"）
     * @return 构建好的 Model 实例
     * @throws IllegalArgumentException 如果供应商未配置或 API Key 缺失
     */
    public Model buildModel(String providerId, String modelName) {
        // 获取目录元数据
        ModelCatalogService.ProviderCatalogEntry catalog = catalogService.getProvider(providerId);
        if (catalog == null) {
            throw new IllegalArgumentException("未知的模型供应商: " + providerId);
        }

        // 获取用户配置
        ConfigFileStore.ProviderEntry userConfig = configStore.getProvider(providerId);
        if (userConfig == null || userConfig.getApiKey() == null || userConfig.getApiKey().isBlank()) {
            throw new IllegalArgumentException("供应商 '" + providerId + "' 未配置 API Key，请在设置页面配置");
        }

        String apiKey = userConfig.getApiKey();
        String baseUrl = userConfig.getBaseUrl() != null && !userConfig.getBaseUrl().isBlank()
                ? userConfig.getBaseUrl()
                : catalog.getDefaultBaseUrl();

        log.info("构建 Model: provider={}, model={}, baseUrl={}", providerId, modelName, baseUrl);

        return switch (catalog.getType()) {
            case "DASHSCOPE" -> DashScopeChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName)
                    .baseUrl(baseUrl)
                    .stream(true)
                    .build();
            case "OPENAI_COMPATIBLE" -> OpenAIChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName)
                    .baseUrl(baseUrl)
                    .stream(true)
                    .build();
            default -> OpenAIChatModel.builder()
                    .apiKey(apiKey)
                    .modelName(modelName)
                    .baseUrl(baseUrl)
                    .stream(true)
                    .build();
        };
    }

    /**
     * 测试供应商连通性。
     *
     * @param providerId 供应商 ID
     * @return 测试结果
     */
    public ConnectivityTestResult testConnectivity(String providerId) {
        ModelCatalogService.ProviderCatalogEntry catalog = catalogService.getProvider(providerId);
        if (catalog == null) {
            return new ConnectivityTestResult(false, "未知的供应商: " + providerId);
        }

        ConfigFileStore.ProviderEntry userConfig = configStore.getProvider(providerId);
        if (userConfig == null || userConfig.getApiKey() == null || userConfig.getApiKey().isBlank()) {
            return new ConnectivityTestResult(false, "未配置 API Key");
        }

        try {
            // 尝试构建 Model 实例来验证配置
            String modelName = catalog.getAvailableModels().isEmpty() ? "default" : catalog.getAvailableModels().get(0);
            buildModel(providerId, modelName);
            return new ConnectivityTestResult(true, "连接成功");
        } catch (Exception e) {
            return new ConnectivityTestResult(false, "连接失败: " + e.getMessage());
        }
    }

    // ─── 数据类 ────────────────────────────────────────────────

    /**
     * 供应商及其可用模型。
     */
    public record ProviderWithModels(
            String providerId,
            String providerName,
            String type,
            boolean available,
            List<ModelInfo> models
    ) {}

    /**
     * 模型信息。
     */
    public record ModelInfo(
            String modelId,
            String displayName
    ) {}

    /**
     * 模型选择（供应商 + 模型）。
     */
    public record ModelSelection(
            String providerId,
            String modelName
    ) {}

    /**
     * 连通性测试结果。
     */
    public record ConnectivityTestResult(
            boolean success,
            String message
    ) {}
}
