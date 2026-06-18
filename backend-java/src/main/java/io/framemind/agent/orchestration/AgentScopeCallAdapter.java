package io.framemind.agent.orchestration;

import io.agentscope.core.message.ContentBlock;
import io.agentscope.core.message.Msg;
import io.agentscope.core.message.MsgRole;
import io.agentscope.core.message.TextBlock;
import io.agentscope.core.model.DashScopeChatModel;
import io.agentscope.core.model.GenerateOptions;
import io.agentscope.core.model.Model;
import io.agentscope.core.model.OpenAIChatModel;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.core.service.ConfigFileStore;
import io.framemind.core.service.ModelCatalogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Consumer;

/**
 * Real implementation of {@link AgentCallAdapter} that uses the AgentScope-Java
 * SDK to invoke LLM models. Reads provider configuration from the config file
 * store and instantiates the appropriate model class based on provider type.
 * <p>
 * Activated when {@code framemind.agent.adapter=agentscope} (default).
 * The {@link PlaceholderAgentCallAdapter} is used as fallback.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "framemind.agent.adapter", havingValue = "agentscope", matchIfMissing = true)
public class AgentScopeCallAdapter implements AgentCallAdapter {

    private final ModelCatalogService catalogService;
    private final ConfigFileStore configStore;
    private final ConfigFileStore.DefaultModelEntry defaultModel;

    public AgentScopeCallAdapter(ModelCatalogService catalogService, ConfigFileStore configStore) {
        this.catalogService = catalogService;
        this.configStore = configStore;
        this.defaultModel = configStore.getDefaultModel();
    }

    @Override
    public String call(AgentDefinition definition, String prompt, Consumer<String> onChunk) {
        // Resolve which provider/model to use
        String providerId = definition.modelProvider() != null ? definition.modelProvider()
                : (defaultModel != null && defaultModel.getProvider() != null ? defaultModel.getProvider() : null);
        String modelName = definition.modelName() != null ? definition.modelName()
                : (defaultModel != null && defaultModel.getModel() != null ? defaultModel.getModel() : null);

        if (providerId == null || providerId.isBlank()) {
            log.warn("No model provider configured for agent '{}', falling back to placeholder", definition.name());
            return callPlaceholder(definition, prompt, onChunk);
        }

        ConfigFileStore.ProviderEntry providerConfig = configStore.getProvider(providerId);
        if (providerConfig == null || providerConfig.getApiKey() == null || providerConfig.getApiKey().isBlank()) {
            log.warn("Provider '{}' not configured for agent '{}', falling back to placeholder", providerId, definition.name());
            return callPlaceholder(definition, prompt, onChunk);
        }

        ModelCatalogService.ProviderCatalogEntry catalog = catalogService.getProvider(providerId);
        if (catalog == null) {
            log.warn("Provider '{}' not found in catalog for agent '{}', falling back to placeholder", providerId, definition.name());
            return callPlaceholder(definition, prompt, onChunk);
        }

        // Resolve model name
        if (modelName == null || modelName.isBlank()) {
            List<String> models = providerConfig.getModels() != null && !providerConfig.getModels().isEmpty()
                    ? providerConfig.getModels()
                    : catalog.getAvailableModels();
            modelName = models.isEmpty() ? "default" : models.get(0);
        }

        try {
            Model model = buildModel(catalog, providerConfig, modelName);
            log.info("Agent '{}' calling provider '{}' model '{}'", definition.name(), providerId, modelName);

            // Build messages using AgentScope Msg builder
            Msg sysMsg = Msg.builder().role(MsgRole.SYSTEM).textContent(definition.systemPrompt()).build();
            Msg userMsg = Msg.builder().role(MsgRole.USER).textContent(prompt).build();

            // Call model with streaming
            GenerateOptions options = GenerateOptions.builder().build();
            StringBuilder fullResponse = new StringBuilder();

            model.stream(List.of(sysMsg, userMsg), List.of(), options)
                    .doOnNext(response -> {
                        // Extract text from ChatResponse content blocks
                        String text = response.getContent().stream()
                                .filter(TextBlock.class::isInstance)
                                .map(TextBlock.class::cast)
                                .map(TextBlock::getText)
                                .reduce("", String::concat);
                        if (!text.isEmpty()) {
                            fullResponse.append(text);
                            onChunk.accept(text);
                        }
                    })
                    .doOnError(error -> {
                        log.error("Model stream error for agent '{}': {}", definition.name(), error.getMessage());
                        onChunk.accept("\n[Error: " + error.getMessage() + "]");
                    })
                    .blockLast(); // Block until complete (we're in a sync context)

            return fullResponse.toString();
        } catch (Exception e) {
            log.error("Failed to call model for agent '{}': {}", definition.name(), e.getMessage(), e);
            return callPlaceholder(definition, prompt, onChunk);
        }
    }

    /**
     * Builds the appropriate AgentScope Model instance based on provider type.
     */
    private Model buildModel(ModelCatalogService.ProviderCatalogEntry catalog,
                              ConfigFileStore.ProviderEntry config,
                              String modelName) {
        String apiKey = config.getApiKey();
        String baseUrl = config.getBaseUrl() != null ? config.getBaseUrl() : catalog.getDefaultBaseUrl();

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
     * Fallback to placeholder adapter when no model is configured.
     */
    private String callPlaceholder(AgentDefinition definition, String prompt, Consumer<String> onChunk) {
        PlaceholderAgentCallAdapter placeholder = new PlaceholderAgentCallAdapter();
        return placeholder.call(definition, prompt, onChunk);
    }
}
