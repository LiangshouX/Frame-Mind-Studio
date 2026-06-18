package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.modules.scriptmind.dto.ScriptResponse;
import io.framemind.modules.scriptmind.dto.ScriptUpdateRequest;
import io.framemind.modules.scriptmind.model.Script;
import io.framemind.modules.scriptmind.service.ScriptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/script")
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;

    /**
     * GET /api/v1/projects/{projectId}/script
     * Get the script for a project.
     */
    @GetMapping
    public ResponseEntity<ScriptResponse> getScript(@PathVariable UUID projectId) {
        return scriptService.getScriptByProjectId(projectId)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PATCH /api/v1/projects/{projectId}/script
     * Update script content. Auto-creates a version snapshot.
     */
    @PatchMapping
    public ResponseEntity<ScriptResponse> updateScript(
            @PathVariable UUID projectId,
            @Valid @RequestBody ScriptUpdateRequest request) {

        Script script = scriptService.updateScript(projectId, request.content(), request.changeSummary());
        return ResponseEntity.ok(toResponse(script));
    }

    // ─── Mapper ─────────────────────────────────────────────────────

    private ScriptResponse toResponse(Script script) {
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
