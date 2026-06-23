package io.framemind.modules.scriptmind.service;

import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.CharacterCreateRequest;
import io.framemind.modules.scriptmind.dto.CharacterListResponse;
import io.framemind.modules.scriptmind.dto.CharacterResponse;
import io.framemind.modules.scriptmind.dto.CharacterUpdateRequest;
import io.framemind.modules.scriptmind.po.CharacterPO;
import io.framemind.modules.scriptmind.repository.CharacterRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 角色服务，负责角色的查询、创建、更新和删除操作。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final ProjectRepository projectRepository;

    /**
     * 获取指定项目下的所有角色列表。
     *
     * @param projectId 项目 ID
     * @return 角色列表响应 DTO
     */
    @Transactional(readOnly = true)
    public CharacterListResponse listCharacters(UUID projectId) {
        List<CharacterPO> characters = characterRepository.findByProjectIdOrderByNameAsc(projectId);
        List<CharacterResponse> items = characters.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new CharacterListResponse(items, items.size());
    }

    /**
     * 创建新角色。
     *
     * @param projectId 项目 ID
     * @param request   创建请求
     * @return 创建后的角色响应 DTO
     */
    @Transactional
    public CharacterResponse createCharacter(UUID projectId, CharacterCreateRequest request) {
        ProjectPO project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        CharacterPO character = CharacterPO.builder()
                .project(project)
                .name(request.name())
                .gender(request.gender())
                .role(request.role() != null ? request.role() : "supporting")
                .identity(request.identity())
                .persona(request.persona())
                .description(request.description())
                .personality(request.personality())
                .appearance(request.appearance())
                .background(request.background())
                .goals(request.goals())
                .relationships(request.relationships())
                .dialogueStyle(request.dialogueStyle())
                .arc(request.arc())
                .overview(request.overview())
                .build();

        character = characterRepository.save(character);
        log.info("Created character '{}' for project {}", request.name(), projectId);
        return toResponse(character);
    }

    /**
     * 更新角色信息。
     *
     * @param projectId   项目 ID
     * @param characterId 角色 ID
     * @param request     更新请求
     * @return 更新后的角色响应 DTO
     */
    @Transactional
    public CharacterResponse updateCharacter(UUID projectId, UUID characterId, CharacterUpdateRequest request) {
        CharacterPO character = characterRepository.findById(characterId)
                .orElseThrow(() -> new EntityNotFoundException("Character not found: " + characterId));

        if (!character.getProject().getId().equals(projectId)) {
            throw new EntityNotFoundException("Character " + characterId + " does not belong to project " + projectId);
        }

        if (request.name() != null) {
            character.setName(request.name());
        }
        if (request.gender() != null) {
            character.setGender(request.gender());
        }
        if (request.role() != null) {
            character.setRole(request.role());
        }
        if (request.identity() != null) {
            character.setIdentity(request.identity());
        }
        if (request.persona() != null) {
            character.setPersona(request.persona());
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
        if (request.overview() != null) {
            character.setOverview(request.overview());
        }

        character = characterRepository.save(character);
        log.info("Updated character {}", characterId);
        return toResponse(character);
    }

    /**
     * 按 ID 更新角色单个字段（带乐观锁）。
     *
     * @param characterId     角色 ID
     * @param field           字段名
     * @param value           新值
     * @param expectedVersion 期望版本号
     * @return 更新后的角色响应
     * @throws org.springframework.orm.ObjectOptimisticLockingFailureException 版本冲突时抛出
     */
    @Transactional
    public CharacterResponse updateCharacterWithVersion(UUID characterId, String field,
                                                        String value, int expectedVersion) {
        CharacterPO character = characterRepository.findById(characterId)
                .orElseThrow(() -> new EntityNotFoundException("Character not found: " + characterId));

        // 设置字段值
        switch (field) {
            case "name" -> character.setName(value);
            case "gender" -> character.setGender(value);
            case "role" -> character.setRole(value);
            case "identity" -> character.setIdentity(value);
            case "persona" -> character.setPersona(value);
            case "description" -> character.setDescription(value);
            case "appearance" -> character.setAppearance(value);
            case "background" -> character.setBackground(value);
            case "goals" -> character.setGoals(value);
            case "dialogueStyle" -> character.setDialogueStyle(value);
            case "arc" -> character.setArc(value);
            case "overview" -> character.setOverview(value);
            default -> throw new IllegalArgumentException("不支持的字段: " + field);
        }

        // 设置期望版本号，JPA @Version 会自动检查
        character.setVersion(expectedVersion);
        character = characterRepository.save(character);
        log.info("Updated character {} field '{}' with version check", characterId, field);
        return toResponse(character);
    }

    /**
     * 按 ID 删除角色（无需 projectId）。
     *
     * @param characterId 角色 ID
     */
    @Transactional
    public void deleteCharacter(UUID characterId) {
        CharacterPO character = characterRepository.findById(characterId)
                .orElseThrow(() -> new EntityNotFoundException("Character not found: " + characterId));
        characterRepository.delete(character);
        log.info("Deleted character {}", characterId);
    }

    /**
     * 删除角色。
     *
     * @param projectId   项目 ID
     * @param characterId 角色 ID
     */
    @Transactional
    public void deleteCharacter(UUID projectId, UUID characterId) {
        CharacterPO character = characterRepository.findById(characterId)
                .orElseThrow(() -> new EntityNotFoundException("Character not found: " + characterId));

        if (!character.getProject().getId().equals(projectId)) {
            throw new EntityNotFoundException("Character " + characterId + " does not belong to project " + projectId);
        }

        characterRepository.delete(character);
        log.info("Deleted character {} from project {}", characterId, projectId);
    }

    /**
     * 将角色持久化对象转换为响应 DTO。
     *
     * @param c 角色持久化对象
     * @return 角色响应 DTO
     */
    private CharacterResponse toResponse(CharacterPO c) {
        return new CharacterResponse(
                c.getId(),
                c.getName(),
                c.getGender(),
                c.getRole(),
                c.getIdentity(),
                c.getPersona(),
                c.getDescription(),
                c.getPersonality(),
                c.getAppearance(),
                c.getBackground(),
                c.getGoals(),
                c.getRelationships(),
                c.getDialogueStyle(),
                c.getArc(),
                c.getOverview(),
                c.getCreatedAt()
        );
    }
}
