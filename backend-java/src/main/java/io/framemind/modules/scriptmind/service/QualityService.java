package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.modules.scriptmind.dto.QualityMetricsResponse;
import io.framemind.modules.scriptmind.po.CharacterPO;
import io.framemind.modules.scriptmind.po.ForeshadowPO;
import io.framemind.modules.scriptmind.po.ScriptPO;
import io.framemind.modules.scriptmind.repository.CharacterRepository;
import io.framemind.modules.scriptmind.repository.ForeshadowRepository;
import io.framemind.modules.scriptmind.repository.ScriptRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 质量评估服务，负责计算剧本的各项质量指标，包括钩子强度、节奏曲线、角色均衡、对白比例和场景多样性。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QualityService {

    private final ScriptRepository scriptRepository;
    private final CharacterRepository characterRepository;
    private final ForeshadowRepository foreshadowRepository;

    /**
     * 计算项目的剧本质量指标。
     *
     * @param projectId 项目 ID
     * @return 质量指标响应，包含各项评分和伏笔状态
     */
    @Transactional(readOnly = true)
    public QualityMetricsResponse computeQualityMetrics(UUID projectId) {
        ScriptPO script = scriptRepository.findByProjectId(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Script not found for project " + projectId));

        JsonNode content = script.getContent();
        JsonNode episodes = (content != null && content.isObject() && content.has("episodes"))
                ? content.get("episodes") : null;

        if (episodes == null || !episodes.isArray() || episodes.isEmpty()) {
            return emptyMetrics("No script content available");
        }

        // 查询角色和伏笔信息以进行更丰富的分析
        List<CharacterPO> characters = characterRepository.findByProjectIdOrderByNameAsc(projectId);
        List<ForeshadowPO> foreshadows = foreshadowRepository.findByProjectIdOrderByCreatedAtDesc(projectId);

        double hookStrength = computeHookStrength(episodes);
        double rhythmCurve = computeRhythmCurve(episodes);
        double characterBalance = computeCharacterBalance(episodes, characters);
        double dialogueRatio = computeDialogueRatio(episodes);
        double sceneDiversity = computeSceneDiversity(episodes);

        // 伏笔状态（来自数据库）
        long totalForeshadows = foreshadows.size();
        long resolvedForeshadows = foreshadowRepository.countByProjectIdAndStatus(projectId, "resolved");
        long unresolvedForeshadows = totalForeshadows - resolvedForeshadows;
        String foreshadowStatusText = unresolvedForeshadows == 0 ? "good" : "needs_attention";
        String foreshadowDetails = String.format("共 %d 条伏笔，已回收 %d 条，待回收 %d 条",
                totalForeshadows, resolvedForeshadows, unresolvedForeshadows);

        // 综合评分：加权平均（0-100）
        // 权重：钩子=25，节奏=15，角色=20，对白=15，多样性=10，伏笔=15
        double foreshadowScore = totalForeshadows > 0
                ? (double) resolvedForeshadows / totalForeshadows : 1.0;
        double overall = (
                hookStrength * 25 +
                rhythmCurve * 15 +
                characterBalance * 20 +
                dialogueRatio * 15 +
                sceneDiversity * 10 +
                foreshadowScore * 15
        );
        int overallScore = (int) Math.round(overall);
        overallScore = Math.max(0, Math.min(100, overallScore));

        return new QualityMetricsResponse(
                new QualityMetricsResponse.MetricDetail(hookStrength, 80, metricStatus(hookStrength, 80), "钩子强度 - 每集结尾悬念/钩子存在度"),
                new QualityMetricsResponse.MetricDetail(rhythmCurve, 70, metricStatus(rhythmCurve, 70), "节奏曲线 - 动作/对白/转场分布方差"),
                new QualityMetricsResponse.MetricDetail(characterBalance, 75, metricStatus(characterBalance, 75), "角色均衡 - 主角对白占比 (目标 0.4-0.6)"),
                new QualityMetricsResponse.MetricDetail(dialogueRatio, 60, metricStatus(dialogueRatio, 60), "对白比例 - 对白元素占比 (目标 0.3-0.5)"),
                new QualityMetricsResponse.MetricDetail(sceneDiversity, 70, metricStatus(sceneDiversity, 70), "场景多样性 - 独立场景地点数/总场景数"),
                new QualityMetricsResponse.ForeshadowStatus(
                        (int) totalForeshadows, (int) resolvedForeshadows, (int) unresolvedForeshadows,
                        foreshadowStatusText, foreshadowDetails),
                overallScore
        );
    }

    // ─── 指标计算方法 ────────────────────────────────────────────────

    /**
     * 计算钩子强度：检查每集是否有悬念、钩子或以对白/情感/转场结尾（0-100 分）。
     */
    private double computeHookStrength(JsonNode episodes) {
        if (!episodes.isArray() || episodes.isEmpty()) return 50.0;

        int totalEpisodes = episodes.size();
        int episodesWithHooks = 0;

        for (JsonNode ep : episodes) {
            boolean hasHook = false;

            // 检查显式的 cliffhanger 字段
            if (ep.has("cliffhanger") && !ep.get("cliffhanger").asText("").isBlank()) {
                hasHook = true;
            }

            // 检查钩子类型的 beat（cliffhanger、revelation、turning_point）
            if (!hasHook) {
                JsonNode scenes = ep.get("scenes");
                if (scenes != null && scenes.isArray()) {
                    for (JsonNode scene : scenes) {
                        JsonNode beats = scene.get("beats");
                        if (beats != null && beats.isArray()) {
                            for (JsonNode beat : beats) {
                                String type = beat.has("type") ? beat.get("type").asText("") : "";
                                if ("cliffhanger".equals(type) || "revelation".equals(type)
                                        || "turning_point".equals(type)) {
                                    hasHook = true;
                                    break;
                                }
                            }
                        }
                        if (hasHook) break;
                    }
                }
            }

            // 检查最后一场的最后一个 beat 是否暗示钩子
            if (!hasHook) {
                JsonNode scenes = ep.get("scenes");
                if (scenes != null && scenes.isArray() && scenes.size() > 0) {
                    JsonNode lastScene = scenes.get(scenes.size() - 1);
                    JsonNode beats = lastScene.get("beats");
                    if (beats != null && beats.isArray() && beats.size() > 0) {
                        JsonNode lastBeat = beats.get(beats.size() - 1);
                        String type = lastBeat.has("type") ? lastBeat.get("type").asText("") : "";
                        if ("dialogue".equals(type) || "emotion".equals(type) || "transition".equals(type)) {
                            hasHook = true;
                        }
                    }
                }
            }

            if (hasHook) episodesWithHooks++;
        }

        return Math.min(100.0, (double) episodesWithHooks / totalEpisodes * 100 + 10);
    }

    /**
     * 计算节奏曲线：衡量动作/对白/转场的分布。
     * 理想值：每场 3-6 个 beat，类型分布均衡。
     */
    private double computeRhythmCurve(JsonNode episodes) {
        int totalScenes = 0;
        int totalBeats = 0;
        int actionCount = 0;
        int dialogueCount = 0;
        int transitionCount = 0;

        for (JsonNode ep : episodes) {
            JsonNode scenes = ep.get("scenes");
            if (scenes == null || !scenes.isArray()) continue;
            totalScenes += scenes.size();
            for (JsonNode scene : scenes) {
                JsonNode beats = scene.get("beats");
                if (beats == null || !beats.isArray()) continue;
                totalBeats += beats.size();
                for (JsonNode beat : beats) {
                    String type = beat.has("type") ? beat.get("type").asText("") : "";
                    switch (type) {
                        case "action" -> actionCount++;
                        case "dialogue" -> dialogueCount++;
                        case "transition" -> transitionCount++;
                        default -> { }
                    }
                }
            }
        }

        if (totalScenes == 0) return 50.0;

        // 基于每场 beat 数量评分
        double avgBeatsPerScene = (double) totalBeats / totalScenes;
        double bpsScore;
        if (avgBeatsPerScene >= 3 && avgBeatsPerScene <= 6) bpsScore = 85.0;
        else if (avgBeatsPerScene >= 2 && avgBeatsPerScene <= 8) bpsScore = 70.0;
        else bpsScore = 50.0;

        // 基于类型分布均衡性评分
        if (totalBeats > 0) {
            double actionRatio = (double) actionCount / totalBeats;
            double dialogueRatio = (double) dialogueCount / totalBeats;
            double transRatio = (double) transitionCount / totalBeats;
            // 与理想值的方差（动作:0.4，对白:0.4，转场:0.2）
            double variance = Math.pow(actionRatio - 0.4, 2) +
                    Math.pow(dialogueRatio - 0.4, 2) +
                    Math.pow(transRatio - 0.2, 2);
            double normalizedVariance = Math.sqrt(variance) / 0.73;
            double balanceScore = Math.max(0, 100 - normalizedVariance * 100);
            return (bpsScore + balanceScore) / 2.0;
        }

        return bpsScore;
    }

    /**
     * 计算角色均衡：主角对白占总对白的比例。
     * 同时考虑角色在各集中的出场情况以进行更丰富的分析。
     * 目标范围：0.4-0.6。
     */
    private double computeCharacterBalance(JsonNode episodes, List<CharacterPO> characters) {
        java.util.Map<String, Integer> characterDialogueCount = new java.util.HashMap<>();
        int totalDialogue = 0;

        // 统计每个角色的对白 beat 数量
        for (JsonNode ep : episodes) {
            JsonNode scenes = ep.get("scenes");
            if (scenes == null || !scenes.isArray()) continue;
            for (JsonNode scene : scenes) {
                JsonNode beats = scene.get("beats");
                if (beats == null || !beats.isArray()) continue;
                for (JsonNode beat : beats) {
                    String type = beat.has("type") ? beat.get("type").asText("") : "";
                    if ("dialogue".equals(type) && beat.has("character")) {
                        String character = beat.get("character").asText("");
                        if (!character.isBlank()) {
                            characterDialogueCount.merge(character, 1, Integer::sum);
                            totalDialogue++;
                        }
                    }
                }
            }
        }

        if (totalDialogue == 0 || characterDialogueCount.isEmpty()) return 40.0;

        // 找出对白最多的角色（视为主角）
        int maxDialogue = characterDialogueCount.values().stream()
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0);

        double protagonistRatio = (double) maxDialogue / totalDialogue;

        // 评分：理想比例为 0.4-0.6
        if (protagonistRatio >= 0.4 && protagonistRatio <= 0.6) return 85.0;
        if (protagonistRatio >= 0.3 && protagonistRatio <= 0.7) return 70.0;
        if (protagonistRatio >= 0.2 && protagonistRatio <= 0.8) return 55.0;
        return 40.0;
    }

    /**
     * 计算对白比例：对白元素占总元素的比例。
     * 目标范围：0.3-0.5。
     */
    private double computeDialogueRatio(JsonNode episodes) {
        int dialogueCount = 0;
        int totalElements = 0;

        for (JsonNode ep : episodes) {
            JsonNode scenes = ep.get("scenes");
            if (scenes == null || !scenes.isArray()) continue;
            for (JsonNode scene : scenes) {
                JsonNode beats = scene.get("beats");
                if (beats == null || !beats.isArray()) continue;
                for (JsonNode beat : beats) {
                    totalElements++;
                    String type = beat.has("type") ? beat.get("type").asText("") : "";
                    if ("dialogue".equals(type)) {
                        dialogueCount++;
                    }
                }
            }
        }

        if (totalElements == 0) return 50.0;

        double ratio = (double) dialogueCount / totalElements * 100;
        // 理想对白比例为 30-50%
        if (ratio >= 30 && ratio <= 50) return 85.0;
        if (ratio >= 20 && ratio <= 65) return 70.0;
        if (ratio >= 10 && ratio <= 80) return 55.0;
        return 40.0;
    }

    /**
     * 计算场景多样性：独立场景地点数占总场景数的比例。
     * 目标：> 0.6。
     */
    private double computeSceneDiversity(JsonNode episodes) {
        Set<String> uniqueLocations = new HashSet<>();
        int totalScenes = 0;

        for (JsonNode ep : episodes) {
            JsonNode scenes = ep.get("scenes");
            if (scenes == null || !scenes.isArray()) continue;
            for (JsonNode scene : scenes) {
                totalScenes++;
                String location = scene.has("location") ? scene.get("location").asText("") : "";
                if (!location.isBlank()) {
                    uniqueLocations.add(location.toLowerCase().trim());
                }
            }
        }

        if (totalScenes == 0) return 50.0;

        double diversityRatio = (double) uniqueLocations.size() / totalScenes;
        if (diversityRatio >= 0.6) return 90.0;
        if (diversityRatio >= 0.4) return 75.0;
        if (diversityRatio >= 0.2) return 60.0;
        return 40.0;
    }

    // ─── 辅助方法 ────────────────────────────────────────────────────

    private String metricStatus(double value, double target) {
        if (value >= target) return "good";
        if (value >= target * 0.8) return "warning";
        return "critical";
    }

    private QualityMetricsResponse emptyMetrics(String reason) {
        QualityMetricsResponse.MetricDetail empty = new QualityMetricsResponse.MetricDetail(0, 0, "no_data", reason);
        return new QualityMetricsResponse(
                empty, empty, empty, empty, empty,
                new QualityMetricsResponse.ForeshadowStatus(0, 0, 0, "no_data", reason),
                0
        );
    }
}
