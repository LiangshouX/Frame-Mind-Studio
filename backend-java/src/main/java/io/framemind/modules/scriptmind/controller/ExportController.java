package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.modules.scriptmind.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 导出控制器，提供剧本内容的 JSON 和 Fountain 格式导出接口。
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    /**
     * 导出为 JSON 格式。
     */
    @GetMapping("/json")
    public ResponseEntity<JsonNode> exportJson(@PathVariable UUID projectId) {
        return ResponseEntity.ok(exportService.exportJson(projectId));
    }

    /**
     * 导出为 Fountain 格式。
     */
    @GetMapping("/fountain")
    public ResponseEntity<String> exportFountain(@PathVariable UUID projectId) {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(exportService.exportFountain(projectId));
    }
}
