package io.framemind.core.service;

import io.framemind.core.service.dto.ProjectCreateRequest;
import io.framemind.core.service.dto.ProjectResponse;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.po.ProjectBudgetPO;
import io.framemind.infrastructure.repository.ProjectBudgetRepository;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.ScriptResponse;
import io.framemind.modules.scriptmind.po.CharacterPO;
import io.framemind.modules.scriptmind.po.ForeshadowPO;
import io.framemind.modules.scriptmind.po.ScriptPO;
import io.framemind.modules.scriptmind.repository.CharacterRepository;
import io.framemind.modules.scriptmind.repository.ForeshadowRepository;
import io.framemind.modules.scriptmind.repository.ScriptRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * 项目服务，负责项目的创建、查询和删除等核心业务操作。
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectBudgetRepository projectBudgetRepository;
    private final ScriptRepository scriptRepository;
    private final CharacterRepository characterRepository;
    private final ForeshadowRepository foreshadowRepository;

    /**
     * 获取所有项目列表，按更新时间降序排列。
     *
     * @return 项目列表
     */
    @Transactional(readOnly = true)
    public List<ProjectPO> listProjects() {
        return projectRepository.findAllByOrderByUpdatedAtDesc();
    }

    /**
     * 根据 ID 获取单个项目。
     *
     * @param id 项目 ID
     * @return 项目实体
     * @throws EntityNotFoundException 项目不存在时抛出
     */
    @Transactional(readOnly = true)
    public ProjectPO getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + id));
    }

    /**
     * 获取项目详情，包含关联的剧本、角色、伏笔和预算信息。
     *
     * @param projectId 项目 ID
     * @return 项目详情响应对象
     */
    @Transactional(readOnly = true)
    public ProjectResponse getProjectDetail(UUID projectId) {
        ProjectPO project = getProject(projectId);

        ScriptPO script = scriptRepository.findByProjectId(projectId).orElse(null);
        List<CharacterPO> characters = characterRepository.findByProjectIdOrderByNameAsc(projectId);
        List<ForeshadowPO> foreshadows = foreshadowRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        ProjectBudgetPO budget = projectBudgetRepository.findByProjectId(projectId).orElse(null);

        ScriptResponse scriptResponse = script != null ? new ScriptResponse(
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
        ) : null;

        ProjectResponse.ProjectBudgetResponse budgetResponse = budget != null
                ? new ProjectResponse.ProjectBudgetResponse(
                        budget.getId(),
                        budget.getTokenLimit(),
                        budget.getTokensUsed(),
                        budget.getWarningThreshold() != null ? budget.getWarningThreshold().toPlainString() : "0.80")
                : null;

        return ProjectResponse.from(project, scriptResponse, characters, foreshadows, budgetResponse);
    }

    /**
     * 创建新项目，并自动创建关联的预算记录。
     *
     * @param request 项目创建请求
     * @return 创建后的项目实体
     */
    @Transactional
    public ProjectPO createProject(ProjectCreateRequest request) {
        ProjectPO project = new ProjectPO();
        project.setTitle(request.title());
        project.setGenre(request.genre());
        if (request.format() != null) {
            project.setFormat(request.format());
        }
        project.setDescription(request.description());
        if (request.targetEpisodes() > 0) {
            project.setTargetEpisodes(request.targetEpisodes());
        }

        ProjectPO savedProject = projectRepository.save(project);

        // 为新项目自动创建预算记录
        ProjectBudgetPO budget = new ProjectBudgetPO();
        budget.setProject(savedProject);
        projectBudgetRepository.save(budget);

        return savedProject;
    }

    /**
     * 根据 ID 删除项目。
     *
     * @param id 项目 ID
     * @throws EntityNotFoundException 项目不存在时抛出
     */
    @Transactional
    public void deleteProject(UUID id) {
        ProjectPO project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + id));
        projectRepository.delete(project);
    }
}
