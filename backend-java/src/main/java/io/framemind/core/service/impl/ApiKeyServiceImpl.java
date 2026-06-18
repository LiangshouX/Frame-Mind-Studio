package io.framemind.core.service.impl;

import io.framemind.core.dto.SettingsRequest;
import io.framemind.core.dto.SettingsResponse;
import io.framemind.core.service.ApiKeyService;
import io.framemind.core.service.ConfigFileStore;
import io.framemind.core.service.ModelCatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * API key service backed by {@link ConfigFileStore} for persistent storage.
 * <p>
 * Reads and writes provider API keys through the config file at
 * {@code ~/.framemind/config.json}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyServiceImpl implements ApiKeyService {

    private final ConfigFileStore configStore;
    private final ModelCatalogService catalogService;

    @Override
    public List<SettingsResponse> listApiKeys() {
        List<SettingsResponse> result = new ArrayList<>();
        for (String providerId : catalogService.getProviderIds()) {
            ConfigFileStore.ProviderEntry entry = configStore.getProvider(providerId);
            boolean configured = entry != null && entry.getApiKey() != null && !entry.getApiKey().isBlank();
            String preview = configured ? maskKey(entry.getApiKey()) : "";
            result.add(new SettingsResponse(providerId, preview, configured));
        }
        return result;
    }

    @Override
    public SettingsResponse saveApiKey(SettingsRequest request) {
        String provider = request.provider().toLowerCase();
        ConfigFileStore.ProviderEntry existing = configStore.getProvider(provider);
        if (existing == null) {
            existing = new ConfigFileStore.ProviderEntry();
        }
        existing.setApiKey(request.apiKey());
        configStore.putProvider(provider, existing);
        log.info("API key updated for provider: {}", provider);
        return new SettingsResponse(provider, maskKey(request.apiKey()), true);
    }

    /**
     * Masks the API key, showing only the last 4 characters.
     */
    private String maskKey(String key) {
        if (key == null || key.length() <= 4) {
            return "****";
        }
        String suffix = key.substring(key.length() - 4);
        return "...".concat(suffix);
    }
}
