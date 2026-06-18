package io.framemind.core.controller;

import io.framemind.core.dto.ModelInfo;
import io.framemind.core.dto.SettingsRequest;
import io.framemind.core.dto.SettingsResponse;
import io.framemind.core.service.ApiKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final ApiKeyService apiKeyService;

    private static final List<ModelInfo> MODEL_CATALOG = List.of(
            new ModelInfo("qwen-max", "dashscope", "通义千问 Max", "主力创作模型", true),
            new ModelInfo("gpt-4o", "openai", "GPT-4o", "复杂推理", true),
            new ModelInfo("claude-sonnet-4-6", "anthropic", "Claude Sonnet", "创意写作", true),
            new ModelInfo("deepseek-chat", "deepseek", "DeepSeek Chat", "性价比方案", true)
    );

    @GetMapping("/api-keys")
    public ResponseEntity<List<SettingsResponse>> listApiKeys() {
        List<SettingsResponse> keys = apiKeyService.listApiKeys();
        return ResponseEntity.ok(keys);
    }

    @PutMapping("/api-keys")
    public ResponseEntity<SettingsResponse> saveApiKey(
            @Valid @RequestBody SettingsRequest request) {
        SettingsResponse response = apiKeyService.saveApiKey(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/models")
    public ResponseEntity<List<ModelInfo>> listModels() {
        return ResponseEntity.ok(MODEL_CATALOG);
    }
}
