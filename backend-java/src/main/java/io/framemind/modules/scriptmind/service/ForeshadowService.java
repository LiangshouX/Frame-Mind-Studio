package io.framemind.modules.scriptmind.service;

import io.framemind.core.model.Project;
import io.framemind.core.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.ForeshadowListResponse;
import io.framemind.modules.scriptmind.dto.ForeshadowResponse;
import io.framemind.modules.scriptmind.dto.ForeshadowUpdateRequest;
import io.framemind.modules.scriptmind.model.Foreshadow;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class ForeshadowService {

    private final ForeshadowRepository foreshadowRepository;
    private final ProjectRepository projectRepository;

    // ─── Read Methods ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ForeshadowListResponse listForeshadows(UUID projectId, String status) {
        List<Foreshadow> foreshadows;
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

    @Transactional(readOnly = true)
    public List<Foreshadow> checkUnresolvedForeshadows(UUID projectId) {
        return foreshadowRepository.findByProjectIdAndStatusOrderByCreatedAtDesc(projectId, "planted");
    }

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

    // ─── Write Methods ──────────────────────────────────────────────

    @Transactional
    public ForeshadowResponse createForeshadow(UUID projectId, String plant, Integer episodeHint,
                                                String urgency, String characterId) {
        if (plant == null || plant.isBlank()) {
            throw new IllegalArgumentException("Plant description must not be null or blank");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        Foreshadow foreshadow = Foreshadow.builder()
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

    @Transactional
    public ForeshadowResponse updateForeshadow(UUID foreshadowId, ForeshadowUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Update request must not be null");
        }

        Foreshadow foreshadow = foreshadowRepository.findById(foreshadowId)
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

    // ─── Mapping ────────────────────────────────────────────────────

    private ForeshadowResponse toResponse(Foreshadow f) {
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
