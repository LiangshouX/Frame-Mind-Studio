package io.framemind.modules.scriptmind.controller;

import io.framemind.modules.scriptmind.dto.CharacterCreateRequest;
import io.framemind.modules.scriptmind.dto.CharacterListResponse;
import io.framemind.modules.scriptmind.dto.CharacterResponse;
import io.framemind.modules.scriptmind.dto.CharacterUpdateRequest;
import io.framemind.modules.scriptmind.service.CharacterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

/**
 * 角色控制器，提供角色的查询、创建、更新和删除接口。
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    /**
     * 获取指定项目下的所有角色。
     */
    @GetMapping
    public ResponseEntity<CharacterListResponse> listCharacters(@PathVariable UUID projectId) {
        return ResponseEntity.ok(characterService.listCharacters(projectId));
    }

    /**
     * 创建新角色。
     */
    @PostMapping
    public ResponseEntity<CharacterResponse> createCharacter(
            @PathVariable UUID projectId,
            @Valid @RequestBody CharacterCreateRequest request) {
        CharacterResponse response = characterService.createCharacter(projectId, request);
        return ResponseEntity.created(URI.create("/api/v1/projects/" + projectId + "/characters/" + response.id()))
                .body(response);
    }

    /**
     * 更新角色信息。
     */
    @PatchMapping("/{characterId}")
    public ResponseEntity<CharacterResponse> updateCharacter(
            @PathVariable UUID projectId,
            @PathVariable UUID characterId,
            @Valid @RequestBody CharacterUpdateRequest request) {
        return ResponseEntity.ok(characterService.updateCharacter(projectId, characterId, request));
    }

    /**
     * 删除角色。
     */
    @DeleteMapping("/{characterId}")
    public ResponseEntity<Void> deleteCharacter(
            @PathVariable UUID projectId,
            @PathVariable UUID characterId) {
        characterService.deleteCharacter(projectId, characterId);
        return ResponseEntity.noContent().build();
    }
}
