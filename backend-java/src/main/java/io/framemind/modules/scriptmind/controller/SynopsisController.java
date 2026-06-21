package io.framemind.modules.scriptmind.controller;

import io.framemind.modules.scriptmind.dto.SynopsisRequest;
import io.framemind.modules.scriptmind.dto.SynopsisResponse;
import io.framemind.modules.scriptmind.service.SynopsisService;
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
 * 梗概控制器，提供梗概的 CRUD 接口。
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/synopsis")
@RequiredArgsConstructor
public class SynopsisController {

    private final SynopsisService synopsisService;

    /**
     * 获取梗概。
     */
    @GetMapping
    public ResponseEntity<SynopsisResponse> getSynopsis(@PathVariable UUID projectId) {
        SynopsisResponse response = synopsisService.getSynopsis(projectId);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    /**
     * 创建或更新梗概。
     */
    @PutMapping
    public ResponseEntity<SynopsisResponse> saveSynopsis(
            @PathVariable UUID projectId,
            @Valid @RequestBody SynopsisRequest request) {
        return ResponseEntity.ok(synopsisService.saveSynopsis(projectId, request));
    }

    /**
     * 删除梗概。
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteSynopsis(@PathVariable UUID projectId) {
        synopsisService.deleteSynopsis(projectId);
        return ResponseEntity.noContent().build();
    }
}
