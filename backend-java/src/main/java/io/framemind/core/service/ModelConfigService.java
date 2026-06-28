package io.framemind.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 模型配置服务，集中管理模型选择与配置解析。
 * <p>
 * 读取用户配置（{@link ConfigFileStore}）和目录元数据（{@link ModelCatalogService}），
 * 提供可用模型列表查询和模型配置解析（供传递给 OpenClaw）。
 * <p>
 * 重构自原 ModelRouterService：不再构建 AgentScope Model 实例，
 * 改为返回模型配置信息供 Java 传递给 OpenClaw 引擎。
 */
@Slf4j
@Service
public class ModelConfigService {

    private final ConfigFileStore configStore;
    private final ModelCatalogService catalogService;

    public ModelConfigService(ConfigFileStore configStore, ModelCatalogService catalogService) {
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
     * 解析模型配置（不构建 SDK 实例，仅返回配置信息供传递给 OpenClaw）。
     * <p>
     * 优先级：请求指定 > 默认模型选择。
     * 如果没有任何可用模型配置，返回 null（OpenClaw 将使用自身默认配置）。
     *
     * @param providerId 请求指定的供应商 ID（可选）
     * @param modelName  请求指定的模型名称（可选）
     * @return 模型配置信息，或 null
     */
    public ModelConfig resolveModelConfig(String providerId, String modelName) {
        // 如果请求未指定，使用默认模型
        if (providerId == null || providerId.isBlank()) {
            ModelSelection defaultSelection = getDefaultModelSelection();
            if (defaultSelection == null) {
                log.debug("无可用模型配置，OpenClaw 将使用自身默认配置");
                return null;
            }
            providerId = defaultSelection.providerId();
            modelName = defaultSelection.modelName();
        }

        // 获取目录元数据
        ModelCatalogService.ProviderCatalogEntry catalog = catalogService.getProvider(providerId);
        if (catalog == null) {
            log.warn("未知的模型供应商: {}，OpenClaw 将使用自身默认配置", providerId);
            return null;
        }

        // 获取用户配置
        ConfigFileStore.ProviderEntry userConfig = configStore.getProvider(providerId);
        if (userConfig == null || userConfig.getApiKey() == null || userConfig.getApiKey().isBlank()) {
            log.warn("供应商 '{}' 未配置 API Key，OpenClaw 将使用自身默认配置", providerId);
            return null;
        }

        String apiKey = userConfig.getApiKey();
        String baseUrl = userConfig.getBaseUrl() != null && !userConfig.getBaseUrl().isBlank()
                ? userConfig.getBaseUrl()
                : catalog.getDefaultBaseUrl();

        return new ModelConfig(providerId, modelName, apiKey, baseUrl, catalog.getType());
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

        // 配置完整即认为可连通（实际连通性由 OpenClaw 调用时验证）
        return new ConnectivityTestResult(true, "配置完整");
    }

    // ─── 数据类 ────────────────────────────────────────────────

    /**
     * 模型配置信息（供传递给 OpenClaw）。
     */
    public record ModelConfig(
            String providerId,
            String modelName,
            String apiKey,
            String baseUrl,
            String providerType
    ) {}

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
