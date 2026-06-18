package io.framemind.core.service;

import io.framemind.core.dto.ProjectCreateRequest;
import io.framemind.core.dto.ProjectResponse;
import io.framemind.core.model.Project;
import io.framemind.core.model.ProjectBudget;
import io.framemind.core.repository.ProjectBudgetRepository;
import io.framemind.core.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectBudgetRepository projectBudgetRepository;

    public ProjectService(ProjectRepository projectRepository,
                          ProjectBudgetRepository projectBudgetRepository) {
        this.projectRepository = projectRepository;
        this.projectBudgetRepository = projectBudgetRepository;
    }

    @Transactional(readOnly = true)
    public List<Project> listProjects() {
        return projectRepository.findAllByOrderByUpdatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + id));
    }

    @Transactional
    public Project createProject(ProjectCreateRequest request) {
        Project project = new Project();
        project.setTitle(request.title());
        project.setGenre(request.genre());
        if (request.format() != null) {
            project.setFormat(request.format());
        }
        project.setDescription(request.description());
        if (request.targetEpisodes() > 0) {
            project.setTargetEpisodes(request.targetEpisodes());
        }

        Project savedProject = projectRepository.save(project);

        // Auto-create a budget record for the new project
        ProjectBudget budget = new ProjectBudget();
        budget.setProject(savedProject);
        projectBudgetRepository.save(budget);

        return savedProject;
    }

    @Transactional
    public void deleteProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + id));
        projectRepository.delete(project);
    }
}
