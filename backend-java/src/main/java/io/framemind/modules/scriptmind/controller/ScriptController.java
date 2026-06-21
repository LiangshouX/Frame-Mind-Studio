package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.modules.scriptmind.dto.ScriptResponse;
import io.framemind.modules.scriptmind.po.ScriptPO;
import io.framemind.modules.scriptmind.service.ScriptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 剧本控制器，提供剧本的查询和更新接口。
 * 新内容直接覆盖旧内容，不保留历史版本。
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/script")
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;

    /**
     * 获取剧本。
     */
    @GetMapping
    public ResponseEntity<ScriptResponse> getScript(@PathVariable UUID projectId) {
        return scriptService.getScriptByProjectId(projectId)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 全量覆盖剧本内容。
     */
    @PutMapping
    public ResponseEntity<ScriptResponse> updateScript(
            @PathVariable UUID projectId,
            @Valid @RequestBody JsonNode content) {
        ScriptPO script = scriptService.updateScript(projectId, content);
        return ResponseEntity.ok(toResponse(script));
    }

    /**
     * 全量覆盖剧本内容（兼容 PATCH 请求）。
     */
    @PatchMapping
    public ResponseEntity<ScriptResponse> patchScript(
            @PathVariable UUID projectId,
            @Valid @RequestBody JsonNode content) {
        ScriptPO script = scriptService.updateScript(projectId, content);
        return ResponseEntity.ok(toResponse(script));
    }

    /**
     * 更新单集剧本内容。
     */
    @PutMapping("/episodes/{episodeNumber}")
    public ResponseEntity<ScriptResponse> updateEpisode(
            @PathVariable UUID projectId,
            @PathVariable int episodeNumber,
            @Valid @RequestBody JsonNode episodeContent) {
        ScriptPO script = scriptService.updateEpisode(projectId, episodeNumber, episodeContent);
        return ResponseEntity.ok(toResponse(script));
    }

    // ─── Mapper ─────────────────────────────────────────────────────

    private ScriptResponse toResponse(ScriptPO script) {
        return new ScriptResponse(
                script.getId(),
                script.getProject().getId(),
                script.getTitle(),
                script.getContent(),
                script.getFormatType(),
                script.getWordCount(),
                script.getSceneCount(),
                script.getEpisodeCount(),
                script.getVersion(),
                script.getCreatedAt(),
                script.getUpdatedAt()
        );
    }
}
