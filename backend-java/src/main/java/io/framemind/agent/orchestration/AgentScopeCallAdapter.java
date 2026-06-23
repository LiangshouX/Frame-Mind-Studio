package io.framemind.agent.orchestration;

import io.agentscope.core.message.ContentBlock;
import io.agentscope.core.message.Msg;
import io.agentscope.core.message.MsgRole;
import io.agentscope.core.message.TextBlock;
import io.agentscope.core.model.GenerateOptions;
import io.agentscope.core.model.Model;
import io.framemind.agent.config.AgentDefinition;
import io.framemind.core.service.ConfigFileStore;
import io.framemind.core.service.ModelCatalogService;
import io.framemind.core.service.ModelRouterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Consumer;

/**
 * Real implementation of {@link AgentCallAdapter} that uses the AgentScope-Java
 * SDK to invoke LLM models. Uses {@link ModelRouterService} to build Model instances
 * from user configuration.
 * <p>
 * Activated when {@code framemind.agent.adapter=agentscope} (default).
 * The {@link PlaceholderAgentCallAdapter} is used as fallback.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "framemind.agent.adapter", havingValue = "agentscope", matchIfMissing = true)
public class AgentScopeCallAdapter implements AgentCallAdapter {

    private final ModelRouterService modelRouterService;
    private final ConfigFileStore configStore;
    private final ConfigFileStore.DefaultModelEntry defaultModel;

    public AgentScopeCallAdapter(ModelRouterService modelRouterService, ConfigFileStore configStore) {
        this.modelRouterService = modelRouterService;
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
            // Try to use the first available model
            ModelRouterService.ModelSelection defaultSel = modelRouterService.getDefaultModelSelection();
            if (defaultSel != null) {
                providerId = defaultSel.providerId();
                modelName = defaultSel.modelName();
            } else {
                log.warn("No model provider configured for agent '{}', falling back to placeholder", definition.name());
                return callPlaceholder(definition, prompt, onChunk);
            }
        }

        if (modelName == null || modelName.isBlank()) {
            modelName = "default";
        }

        try {
            Model model = modelRouterService.buildModel(providerId, modelName);
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
     * Fallback to placeholder adapter when no model is configured.
     */
    private String callPlaceholder(AgentDefinition definition, String prompt, Consumer<String> onChunk) {
        PlaceholderAgentCallAdapter placeholder = new PlaceholderAgentCallAdapter();
        return placeholder.call(definition, prompt, onChunk);
    }
}
