package io.framemind.modules.scriptmind.controller;

import io.framemind.modules.scriptmind.dto.WorldSettingRequest;
import io.framemind.modules.scriptmind.dto.WorldSettingResponse;
import io.framemind.modules.scriptmind.service.WorldSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 世界观设定控制器，提供世界观的 CRUD 接口。
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/world-setting")
@RequiredArgsConstructor
public class WorldSettingController {

    private final WorldSettingService worldSettingService;

    /**
     * 获取世界观设定。
     */
    @GetMapping
    public ResponseEntity<WorldSettingResponse> getWorldSetting(@PathVariable UUID projectId) {
        WorldSettingResponse response = worldSettingService.getWorldSetting(projectId);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    /**
     * 创建或更新世界观设定。
     */
    @PutMapping
    public ResponseEntity<WorldSettingResponse> saveWorldSetting(
            @PathVariable UUID projectId,
            @Valid @RequestBody WorldSettingRequest request) {
        return ResponseEntity.ok(worldSettingService.saveWorldSetting(projectId, request));
    }

    /**
     * 删除世界观设定。
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteWorldSetting(@PathVariable UUID projectId) {
        worldSettingService.deleteWorldSetting(projectId);
        return ResponseEntity.noContent().build();
    }
}
