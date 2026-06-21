package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.OutlineResponse;
import io.framemind.modules.scriptmind.po.OutlinePO;
import io.framemind.modules.scriptmind.repository.OutlineRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 大纲服务，负责大纲的 CRUD 业务操作。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OutlineService {

    private final OutlineRepository outlineRepository;
    private final ProjectRepository projectRepository;

    /**
     * 获取项目的大纲。
     *
     * @param projectId 项目 ID
     * @return 大纲响应（可能为 null）
     */
    @Transactional(readOnly = true)
    public OutlineResponse getOutline(UUID projectId) {
        return outlineRepository.findByProjectId(projectId)
                .map(this::toResponse)
                .orElse(null);
    }

    /**
     * 创建或更新大纲（Upsert 语义）。
     *
     * @param projectId 项目 ID
     * @param content   大纲内容
     * @param format    大纲格式（episode_list / act_structure）
     * @return 大纲响应
     */
    @Transactional
    public OutlineResponse saveOutline(UUID projectId, JsonNode content, String format) {
        OutlinePO outline = outlineRepository.findByProjectId(projectId)
                .orElseGet(() -> {
                    ProjectPO project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
                    return OutlinePO.builder()
                            .project(project)
                            .format(format != null ? format : "episode_list")
                            .build();
                });

        outline.setContent(content);
        if (format != null) {
            outline.setFormat(format);
        }
        outline.setVersion(outline.getVersion() + 1);
        outline = outlineRepository.save(outline);

        log.info("Saved outline for project {}", projectId);
        return toResponse(outline);
    }

    /**
     * 更新单集/单幕大纲。
     *
     * @param projectId     项目 ID
     * @param episodeNumber 集数编号
     * @param episodeContent 新的集数内容
     * @return 大纲响应
     */
    @Transactional
    public OutlineResponse updateEpisode(UUID projectId, int episodeNumber, JsonNode episodeContent) {
        OutlinePO outline = outlineRepository.findByProjectId(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Outline not found for project " + projectId));

        JsonNode content = outline.getContent();
        if (content.isObject() && content.has("episodes")) {
            var episodes = (com.fasterxml.jackson.databind.node.ArrayNode) content.get("episodes");
            boolean found = false;
            for (int i = 0; i < episodes.size(); i++) {
                JsonNode ep = episodes.get(i);
                if (ep.has("episodeNumber") && ep.get("episodeNumber").asInt() == episodeNumber) {
                    episodes.set(i, episodeContent);
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new EntityNotFoundException("Episode " + episodeNumber + " not found in outline");
            }
        }

        outline.setContent(content);
        outline.setVersion(outline.getVersion() + 1);
        outline = outlineRepository.save(outline);

        log.info("Updated episode {} in outline for project {}", episodeNumber, projectId);
        return toResponse(outline);
    }

    /**
     * 删除项目的大纲。
     *
     * @param projectId 项目 ID
     */
    @Transactional
    public void deleteOutline(UUID projectId) {
        outlineRepository.deleteByProjectId(projectId);
        log.info("Deleted outline for project {}", projectId);
    }

    private OutlineResponse toResponse(OutlinePO o) {
        return new OutlineResponse(
                o.getId(),
                o.getProject().getId(),
                o.getContent(),
                o.getFormat(),
                o.getVersion(),
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }
}
