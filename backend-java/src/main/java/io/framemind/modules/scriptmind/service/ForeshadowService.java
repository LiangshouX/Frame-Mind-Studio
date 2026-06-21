package io.framemind.modules.scriptmind.service;

import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.ForeshadowListResponse;
import io.framemind.modules.scriptmind.dto.ForeshadowResponse;
import io.framemind.modules.scriptmind.dto.ForeshadowUpdateRequest;
import io.framemind.modules.scriptmind.po.ForeshadowPO;
import io.framemind.modules.scriptmind.repository.ForeshadowRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 伏笔服务，负责伏笔的创建、查询、更新和统计等业务操作。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ForeshadowService {

    private final ForeshadowRepository foreshadowRepository;
    private final ProjectRepository projectRepository;

    // ─── 读取方法 ───────────────────────────────────────────────────

    /**
     * 获取项目的伏笔列表，支持按状态筛选。
     *
     * @param projectId 项目 ID
     * @param status    伏笔状态筛选条件（可选）
     * @return 伏笔列表响应
     */
    @Transactional(readOnly = true)
    public ForeshadowListResponse listForeshadows(UUID projectId, String status) {
        List<ForeshadowPO> foreshadows;
        if (status != null && !status.isBlank()) {
            foreshadows = foreshadowRepository.findByProjectIdAndStatusOrderByCreatedAtDesc(projectId, status);
        } else {
            foreshadows = foreshadowRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        }

        List<ForeshadowResponse> items = foreshadows.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        long unresolved = foreshadowRepository.countByProjectIdAndStatus(projectId, "planted")
                + foreshadowRepository.countByProjectIdAndStatus(projectId, "hinted");

        return new ForeshadowListResponse(items, items.size(), unresolved);
    }

    /**
     * 检查项目中未解决的伏笔（状态为"planted"的伏笔）。
     *
     * @param projectId 项目 ID
     * @return 未解决的伏笔列表
     */
    @Transactional(readOnly = true)
    public List<ForeshadowPO> checkUnresolvedForeshadows(UUID projectId) {
        return foreshadowRepository.findByProjectIdAndStatusOrderByCreatedAtDesc(projectId, "planted");
    }

    /**
     * 获取项目的伏笔统计信息，包括总数、已回收数和待回收数。
     *
     * @param projectId 项目 ID
     * @return 统计信息（包含 total、resolved、unresolved 字段）
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getForeshadowStats(UUID projectId) {
        long total = foreshadowRepository.findByProjectIdOrderByCreatedAtDesc(projectId).size();
        long resolved = foreshadowRepository.countByProjectIdAndStatus(projectId, "resolved");
        long unresolved = total - resolved;

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("resolved", resolved);
        stats.put("unresolved", unresolved);
        return stats;
    }

    // ─── 写入方法 ──────────────────────────────────────────────────

    /**
     * 创建新伏笔。
     *
     * @param projectId    项目 ID
     * @param plant        伏笔描述
     * @param episodeHint  提示集数
     * @param urgency      紧急程度
     * @param characterId  关联角色 ID
     * @return 创建后的伏笔响应
     */
    @Transactional
    public ForeshadowResponse createForeshadow(UUID projectId, String plant, Integer episodeHint,
                                                String urgency, String characterId) {
        if (plant == null || plant.isBlank()) {
            throw new IllegalArgumentException("Plant description must not be null or blank");
        }

        ProjectPO project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        ForeshadowPO foreshadow = ForeshadowPO.builder()
                .project(project)
                .plant(plant)
                .episodeHint(episodeHint)
                .urgency(urgency != null ? urgency : "medium")
                .characterId(characterId)
                .status("planted")
                .build();

        foreshadow = foreshadowRepository.save(foreshadow);
        log.info("Created foreshadow {} for project {}", foreshadow.getId(), projectId);
        return toResponse(foreshadow);
    }

    /**
     * 更新伏笔信息。
     *
     * @param foreshadowId 伏笔 ID
     * @param request      更新请求
     * @return 更新后的伏笔响应
     */
    @Transactional
    public ForeshadowResponse updateForeshadow(UUID foreshadowId, ForeshadowUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Update request must not be null");
        }

        ForeshadowPO foreshadow = foreshadowRepository.findById(foreshadowId)
                .orElseThrow(() -> new EntityNotFoundException("Foreshadow not found: " + foreshadowId));

        if (request.status() != null) {
            foreshadow.setStatus(request.status());
        }
        if (request.payoff() != null) {
            foreshadow.setPayoff(request.payoff());
        }
        if (request.notes() != null) {
            foreshadow.setNotes(request.notes());
        }

        foreshadow = foreshadowRepository.save(foreshadow);
        log.info("Updated foreshadow {}", foreshadowId);
        return toResponse(foreshadow);
    }

    // ─── 映射转换 ────────────────────────────────────────────────────

    private ForeshadowResponse toResponse(ForeshadowPO f) {
        return new ForeshadowResponse(
                f.getId(),
                f.getPlant(),
                f.getPayoff(),
                f.getEpisodeHint(),
                f.getStatus(),
                f.getUrgency(),
                f.getCharacterId(),
                f.getNotes(),
                f.getCreatedAt()
        );
    }
}
