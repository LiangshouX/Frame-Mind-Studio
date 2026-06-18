package io.framemind.modules.scriptmind.controller;

import io.framemind.modules.scriptmind.dto.DiffResponse;
import io.framemind.modules.scriptmind.dto.VersionDetailResponse;
import io.framemind.modules.scriptmind.dto.VersionListResponse;
import io.framemind.modules.scriptmind.model.Script;
import io.framemind.modules.scriptmind.service.ScriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/script/versions")
@RequiredArgsConstructor
public class VersionController {

    private final ScriptService scriptService;

    /**
     * GET /api/v1/projects/{projectId}/script/versions
     * List version history for a project's script.
     */
    @GetMapping
    public ResponseEntity<VersionListResponse> listVersions(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(scriptService.getVersionHistory(projectId, limit, offset));
    }

    /**
     * GET /api/v1/projects/{projectId}/script/versions/{versionId}
     * Get a specific version by version number.
     */
    @GetMapping("/{versionId}")
    public ResponseEntity<VersionDetailResponse> getVersion(
            @PathVariable UUID projectId,
            @PathVariable int versionId) {
        return ResponseEntity.ok(scriptService.getVersion(projectId, versionId));
    }

    /**
     * POST /api/v1/projects/{projectId}/script/versions/{versionId}/restore
     * Restore the script to a specific version.
     */
    @PostMapping("/{versionId}/restore")
    public ResponseEntity<Map<String, Object>> restoreVersion(
            @PathVariable UUID projectId,
            @PathVariable int versionId) {
        Script script = scriptService.restoreVersion(projectId, versionId);
        return ResponseEntity.ok(Map.of(
                "id", script.getId(),
                "version", script.getVersion(),
                "message", "Restored from version " + versionId
        ));
    }

    /**
     * GET /api/v1/projects/{projectId}/script/versions/compare
     * Compare two versions of a script.
     */
    @GetMapping("/compare")
    public ResponseEntity<DiffResponse> compareVersions(
            @PathVariable UUID projectId,
            @RequestParam("from_version") int fromVersion,
            @RequestParam("to_version") int toVersion) {
        return ResponseEntity.ok(scriptService.computeDiff(projectId, fromVersion, toVersion));
    }
}
