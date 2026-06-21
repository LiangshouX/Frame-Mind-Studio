package io.framemind.modules.scriptmind.service;

import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.SynopsisRequest;
import io.framemind.modules.scriptmind.dto.SynopsisResponse;
import io.framemind.modules.scriptmind.po.SynopsisPO;
import io.framemind.modules.scriptmind.repository.SynopsisRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 梗概服务，负责梗概的 CRUD 业务操作。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SynopsisService {

    private final SynopsisRepository synopsisRepository;
    private final ProjectRepository projectRepository;

    /**
     * 获取项目的梗概。
     *
     * @param projectId 项目 ID
     * @return 梗概响应（可能为 null）
     */
    @Transactional(readOnly = true)
    public SynopsisResponse getSynopsis(UUID projectId) {
        return synopsisRepository.findByProjectId(projectId)
                .map(this::toResponse)
                .orElse(null);
    }

    /**
     * 创建或更新梗概（Upsert 语义）。
     *
     * @param projectId 项目 ID
     * @param request   保存请求
     * @return 梗概响应
     */
    @Transactional
    public SynopsisResponse saveSynopsis(UUID projectId, SynopsisRequest request) {
        SynopsisPO synopsis = synopsisRepository.findByProjectId(projectId)
                .orElseGet(() -> {
                    ProjectPO project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
                    return SynopsisPO.builder()
                            .project(project)
                            .build();
                });

        synopsis.setContent(request.content());
        synopsis = synopsisRepository.save(synopsis);

        log.info("Saved synopsis for project {}", projectId);
        return toResponse(synopsis);
    }

    /**
     * 删除项目的梗概。
     *
     * @param projectId 项目 ID
     */
    @Transactional
    public void deleteSynopsis(UUID projectId) {
        synopsisRepository.deleteByProjectId(projectId);
        log.info("Deleted synopsis for project {}", projectId);
    }

    private SynopsisResponse toResponse(SynopsisPO s) {
        return new SynopsisResponse(
                s.getId(),
                s.getProject().getId(),
                s.getContent(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
