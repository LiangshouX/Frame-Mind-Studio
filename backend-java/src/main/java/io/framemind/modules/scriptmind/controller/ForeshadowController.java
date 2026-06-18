package io.framemind.modules.scriptmind.controller;

import io.framemind.modules.scriptmind.dto.ForeshadowListResponse;
import io.framemind.modules.scriptmind.dto.ForeshadowResponse;
import io.framemind.modules.scriptmind.dto.ForeshadowUpdateRequest;
import io.framemind.modules.scriptmind.service.ForeshadowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/foreshadows")
@RequiredArgsConstructor
public class ForeshadowController {

    private final ForeshadowService foreshadowService;

    /**
     * GET /api/v1/projects/{projectId}/foreshadows
     * List foreshadows with optional status filter.
     */
    @GetMapping
    public ResponseEntity<ForeshadowListResponse> listForeshadows(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(foreshadowService.listForeshadows(projectId, status));
    }

    /**
     * PATCH /api/v1/projects/{projectId}/foreshadows/{foreshadowId}
     * Update a foreshadow's status, payoff, or notes.
     */
    @PatchMapping("/{foreshadowId}")
    public ResponseEntity<ForeshadowResponse> updateForeshadow(
            @PathVariable UUID projectId,
            @PathVariable UUID foreshadowId,
            @Valid @RequestBody ForeshadowUpdateRequest request) {
        return ResponseEntity.ok(foreshadowService.updateForeshadow(foreshadowId, request));
    }
}
