package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.WorldSettingRequest;
import io.framemind.modules.scriptmind.dto.WorldSettingResponse;
import io.framemind.modules.scriptmind.po.WorldSettingPO;
import io.framemind.modules.scriptmind.repository.WorldSettingRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 世界观设定服务，负责世界观的 CRUD 业务操作。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorldSettingService {

    private final WorldSettingRepository worldSettingRepository;
    private final ProjectRepository projectRepository;

    /**
     * 获取项目的世界观设定。
     *
     * @param projectId 项目 ID
     * @return 世界观设定响应（可能为 null）
     */
    @Transactional(readOnly = true)
    public WorldSettingResponse getWorldSetting(UUID projectId) {
        return worldSettingRepository.findByProjectId(projectId)
                .map(this::toResponse)
                .orElse(null);
    }

    /**
     * 创建或更新世界观设定（Upsert 语义）。
     *
     * @param projectId 项目 ID
     * @param request   保存请求
     * @return 世界观设定响应
     */
    @Transactional
    public WorldSettingResponse saveWorldSetting(UUID projectId, WorldSettingRequest request) {
        WorldSettingPO worldSetting = worldSettingRepository.findByProjectId(projectId)
                .orElseGet(() -> {
                    ProjectPO project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
                    return WorldSettingPO.builder()
                            .project(project)
                            .build();
                });

        worldSetting.setContent(request.content());
        worldSetting = worldSettingRepository.save(worldSetting);

        log.info("Saved world setting for project {}", projectId);
        return toResponse(worldSetting);
    }

    /**
     * 删除项目的世界观设定。
     *
     * @param projectId 项目 ID
     */
    @Transactional
    public void deleteWorldSetting(UUID projectId) {
        worldSettingRepository.deleteByProjectId(projectId);
        log.info("Deleted world setting for project {}", projectId);
    }

    private WorldSettingResponse toResponse(WorldSettingPO ws) {
        return new WorldSettingResponse(
                ws.getId(),
                ws.getProject().getId(),
                ws.getContent(),
                ws.getCreatedAt(),
                ws.getUpdatedAt()
        );
    }
}
