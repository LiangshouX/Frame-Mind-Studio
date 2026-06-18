package io.framemind.modules.scriptmind.controller;

import io.framemind.modules.scriptmind.dto.CharacterListResponse;
import io.framemind.modules.scriptmind.dto.CharacterResponse;
import io.framemind.modules.scriptmind.dto.CharacterUpdateRequest;
import io.framemind.modules.scriptmind.model.Character;
import io.framemind.modules.scriptmind.repository.CharacterRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterRepository characterRepository;

    /**
     * GET /api/v1/projects/{projectId}/characters
     * List all characters for a project.
     */
    @GetMapping
    public ResponseEntity<CharacterListResponse> listCharacters(@PathVariable UUID projectId) {
        List<Character> characters = characterRepository.findByProjectIdOrderByNameAsc(projectId);
        List<CharacterResponse> items = characters.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new CharacterListResponse(items, items.size()));
    }

    /**
     * PATCH /api/v1/projects/{projectId}/characters/{characterId}
     * Update a character's details.
     */
    @PatchMapping("/{characterId}")
    public ResponseEntity<CharacterResponse> updateCharacter(
            @PathVariable UUID projectId,
            @PathVariable UUID characterId,
            @Valid @RequestBody CharacterUpdateRequest request) {

        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new EntityNotFoundException("Character not found: " + characterId));

        if (!character.getProject().getId().equals(projectId)) {
            throw new EntityNotFoundException("Character " + characterId + " does not belong to project " + projectId);
        }

        if (request.description() != null) {
            character.setDescription(request.description());
        }
        if (request.personality() != null) {
            character.setPersonality(request.personality());
        }
        if (request.appearance() != null) {
            character.setAppearance(request.appearance());
        }
        if (request.background() != null) {
            character.setBackground(request.background());
        }
        if (request.goals() != null) {
            character.setGoals(request.goals());
        }
        if (request.relationships() != null) {
            character.setRelationships(request.relationships());
        }
        if (request.dialogueStyle() != null) {
            character.setDialogueStyle(request.dialogueStyle());
        }
        if (request.arc() != null) {
            character.setArc(request.arc());
        }

        character = characterRepository.save(character);
        return ResponseEntity.ok(toResponse(character));
    }

    // ─── Mapper ─────────────────────────────────────────────────────

    private CharacterResponse toResponse(Character c) {
        return new CharacterResponse(
                c.getId(),
                c.getName(),
                c.getRole(),
                c.getDescription(),
                c.getPersonality(),
                c.getAppearance(),
                c.getBackground(),
                c.getGoals(),
                c.getRelationships(),
                c.getDialogueStyle(),
                c.getArc(),
                c.getCreatedAt()
        );
    }
}
