package io.framemind.modules.scriptmind.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.framemind.modules.scriptmind.dto.OutlineResponse;
import io.framemind.modules.scriptmind.service.OutlineService;
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

import java.util.Map;
import java.util.UUID;

/**
 * 大纲控制器，提供大纲的 CRUD 接口。
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/outline")
@RequiredArgsConstructor
public class OutlineController {

    private final OutlineService outlineService;
    private final ObjectMapper objectMapper;

    /**
     * 获取大纲。
     */
    @GetMapping
    public ResponseEntity<OutlineResponse> getOutline(@PathVariable UUID projectId) {
        OutlineResponse response = outlineService.getOutline(projectId);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    /**
     * 创建或更新大纲（全量覆盖）。
     */
    @PutMapping
    public ResponseEntity<OutlineResponse> saveOutline(
            @PathVariable UUID projectId,
            @Valid @RequestBody Map<String, Object> request) {
        // 将 Map 转换为 JsonNode，避免 ClassCastException
        JsonNode content = objectMapper.valueToTree(request.get("content"));
        String format = (String) request.get("format");
        return ResponseEntity.ok(outlineService.saveOutline(projectId, content, format));
    }

    /**
     * 更新单集大纲。
     */
    @PutMapping("/episodes/{episodeNumber}")
    public ResponseEntity<OutlineResponse> updateEpisode(
            @PathVariable UUID projectId,
            @PathVariable int episodeNumber,
            @Valid @RequestBody JsonNode episodeContent) {
        return ResponseEntity.ok(outlineService.updateEpisode(projectId, episodeNumber, episodeContent));
    }

    /**
     * 删除大纲。
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteOutline(@PathVariable UUID projectId) {
        outlineService.deleteOutline(projectId);
        return ResponseEntity.noContent().build();
    }
}
