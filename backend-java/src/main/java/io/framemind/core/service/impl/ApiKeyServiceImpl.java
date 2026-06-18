package io.framemind.core.service.impl;

import io.framemind.core.dto.SettingsRequest;
import io.framemind.core.dto.SettingsResponse;
import io.framemind.core.service.ApiKeyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class ApiKeyServiceImpl implements ApiKeyService {

    private static final List<String> SUPPORTED_PROVIDERS = List.of(
            "dashscope", "openai", "anthropic", "deepseek"
    );

    private final Map<String, String> apiKeyStore = new ConcurrentHashMap<>();

    public ApiKeyServiceImpl(
            @Value("${framemind.api-keys.dashscope:}") String dashscopeKey,
            @Value("${framemind.api-keys.openai:}") String openaiKey,
            @Value("${framemind.api-keys.anthropic:}") String anthropicKey,
            @Value("${framemind.api-keys.deepseek:}") String deepseekKey
    ) {
        if (!dashscopeKey.isBlank()) apiKeyStore.put("dashscope", dashscopeKey);
        if (!openaiKey.isBlank()) apiKeyStore.put("openai", openaiKey);
        if (!anthropicKey.isBlank()) apiKeyStore.put("anthropic", anthropicKey);
        if (!deepseekKey.isBlank()) apiKeyStore.put("deepseek", deepseekKey);
    }

    @Override
    public List<SettingsResponse> listApiKeys() {
        List<SettingsResponse> result = new ArrayList<>();
        for (String provider : SUPPORTED_PROVIDERS) {
            String key = apiKeyStore.get(provider);
            boolean configured = key != null && !key.isBlank();
            String preview = configured ? maskKey(key) : "";
            result.add(new SettingsResponse(provider, preview, configured));
        }
        return result;
    }

    @Override
    public SettingsResponse saveApiKey(SettingsRequest request) {
        String provider = request.provider().toLowerCase();
        apiKeyStore.put(provider, request.apiKey());
        log.info("API key updated for provider: {}", provider);
        return new SettingsResponse(provider, maskKey(request.apiKey()), true);
    }

    /**
     * Masks the API key, showing only the last 4 characters.
     * Example: "sk-abc12345def1" -> "sk-...ef1" (if 4 chars: "sk-...f1")
     */
    private String maskKey(String key) {
        if (key == null || key.length() <= 4) {
            return "****";
        }
        String suffix = key.substring(key.length() - 4);
        return "...".concat(suffix);
    }
}
