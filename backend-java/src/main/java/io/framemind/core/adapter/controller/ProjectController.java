package io.framemind.core.adapter.controller;

import io.framemind.core.service.dto.ProjectCreateRequest;
import io.framemind.core.service.dto.ProjectListResponse;
import io.framemind.core.service.dto.ProjectResponse;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.core.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 项目控制器，提供项目的 CRUD 接口。
 */
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * 创建新项目。
     *
     * @param request 项目创建请求
     * @return 创建的项目信息
     */
    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectCreateRequest request) {
        ProjectPO project = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProjectResponse.from(project));
    }

    /**
     * 获取项目列表。
     *
     * @return 项目列表
     */
    @GetMapping
    public ResponseEntity<ProjectListResponse> listProjects() {
        List<ProjectPO> projects = projectService.listProjects();
        List<ProjectResponse> items = projects.stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ProjectListResponse(items, items.size()));
    }

    /**
     * 获取项目详情，包含关联的剧本、角色、伏笔和预算。
     *
     * @param projectId 项目 ID
     * @return 项目详情
     */
    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(projectService.getProjectDetail(projectId));
    }

    /**
     * 删除项目。
     *
     * @param projectId 项目 ID
     */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }
}
