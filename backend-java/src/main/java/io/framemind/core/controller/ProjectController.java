package io.framemind.core.controller;

import io.framemind.core.dto.ProjectCreateRequest;
import io.framemind.core.dto.ProjectListResponse;
import io.framemind.core.dto.ProjectResponse;
import io.framemind.modules.scriptmind.dto.ScriptResponse;
import io.framemind.core.model.Project;
import io.framemind.core.model.ProjectBudget;
import io.framemind.core.repository.ProjectBudgetRepository;
import io.framemind.core.service.ProjectService;
import io.framemind.modules.scriptmind.model.Character;
import io.framemind.modules.scriptmind.model.Foreshadow;
import io.framemind.modules.scriptmind.model.Script;
import io.framemind.modules.scriptmind.repository.CharacterRepository;
import io.framemind.modules.scriptmind.repository.ForeshadowRepository;
import io.framemind.modules.scriptmind.repository.ScriptRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ScriptRepository scriptRepository;
    private final CharacterRepository characterRepository;
    private final ForeshadowRepository foreshadowRepository;
    private final ProjectBudgetRepository projectBudgetRepository;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectCreateRequest request) {
        Project project = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectResponse.from(project));
    }

    @GetMapping
    public ResponseEntity<ProjectListResponse> listProjects() {
        List<Project> projects = projectService.listProjects();
        List<ProjectResponse> items = projects.stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ProjectListResponse(items, items.size()));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable UUID projectId) {
        Project project = projectService.getProject(projectId);

        // Load related data
        Script script = scriptRepository.findByProjectId(projectId).orElse(null);
        List<Character> characters = characterRepository.findByProjectIdOrderByNameAsc(projectId);
        List<Foreshadow> foreshadows = foreshadowRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        ProjectBudget budget = projectBudgetRepository.findByProjectId(projectId).orElse(null);

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

        return ResponseEntity.ok(ProjectResponse.from(
                project, scriptResponse, characters, foreshadows, budgetResponse));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEntityNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "error", "Not Found",
                        "message", ex.getMessage()
                ));
    }
}
