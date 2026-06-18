package io.framemind.core.service;

import io.framemind.core.config.FramemindConfigProperties;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads the model provider catalog from {@code model-catalog.yml} on startup
 * and provides lookup methods for provider metadata.
 */
@Slf4j
@Service
public class ModelCatalogService {

    private final FramemindConfigProperties configProperties;
    private final Map<String, ProviderCatalogEntry> providers = new LinkedHashMap<>();

    public ModelCatalogService(FramemindConfigProperties configProperties) {
        this.configProperties = configProperties;
    }

    @PostConstruct
    public void loadCatalog() {
        Yaml yaml = new Yaml();
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("model-catalog.yml")) {
            if (is == null) {
                log.warn("model-catalog.yml not found on classpath — catalog will be empty");
                return;
            }
            Map<String, Object> root = yaml.load(is);
            @SuppressWarnings("unchecked")
            Map<String, Map<String, Object>> providerMap = (Map<String, Map<String, Object>>) root.get("providers");
            if (providerMap == null) {
                log.warn("No 'providers' section in model-catalog.yml");
                return;
            }
            for (Map.Entry<String, Map<String, Object>> entry : providerMap.entrySet()) {
                String id = entry.getKey();
                Map<String, Object> data = entry.getValue();
                @SuppressWarnings("unchecked")
                List<String> models = (List<String>) data.getOrDefault("availableModels", List.of());
                ProviderCatalogEntry provider = new ProviderCatalogEntry(
                        id,
                        (String) data.getOrDefault("name", id),
                        (String) data.getOrDefault("description", ""),
                        (String) data.getOrDefault("type", "OPENAI_COMPATIBLE"),
                        (String) data.getOrDefault("defaultBaseUrl", ""),
                        List.copyOf(models),
                        (String) data.getOrDefault("icon", id)
                );
                providers.put(id, provider);
            }
            log.info("Loaded {} model providers from catalog", providers.size());
        } catch (Exception e) {
            log.error("Failed to load model-catalog.yml", e);
        }
    }

    /**
     * Returns all providers in the catalog (unmodifiable).
     */
    public List<ProviderCatalogEntry> getProviderCatalog() {
        return List.copyOf(providers.values());
    }

    /**
     * Returns a single provider by ID, or null if not found.
     */
    public ProviderCatalogEntry getProvider(String id) {
        return providers.get(id);
    }

    /**
     * Returns the list of provider IDs in the catalog.
     */
    public List<String> getProviderIds() {
        return List.copyOf(providers.keySet());
    }

    /**
     * Immutable provider catalog entry.
     */
    @Getter
    public static class ProviderCatalogEntry {
        private final String id;
        private final String name;
        private final String description;
        private final String type;
        private final String defaultBaseUrl;
        private final List<String> availableModels;
        private final String icon;

        public ProviderCatalogEntry(String id, String name, String description,
                                     String type, String defaultBaseUrl,
                                     List<String> availableModels, String icon) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.type = type;
            this.defaultBaseUrl = defaultBaseUrl;
            this.availableModels = availableModels;
            this.icon = icon;
        }
    }
}
