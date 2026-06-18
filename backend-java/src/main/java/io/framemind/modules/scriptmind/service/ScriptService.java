package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.core.model.Project;
import io.framemind.core.repository.ProjectRepository;
import io.framemind.modules.scriptmind.dto.DiffResponse;
import io.framemind.modules.scriptmind.dto.VersionDetailResponse;
import io.framemind.modules.scriptmind.dto.VersionListResponse;
import io.framemind.modules.scriptmind.dto.VersionResponse;
import io.framemind.modules.scriptmind.model.Script;
import io.framemind.modules.scriptmind.model.ScriptVersion;
import io.framemind.modules.scriptmind.repository.CharacterRepository;
import io.framemind.modules.scriptmind.repository.ForeshadowRepository;
import io.framemind.modules.scriptmind.repository.ScriptRepository;
import io.framemind.modules.scriptmind.repository.ScriptVersionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScriptService {

    private final ScriptRepository scriptRepository;
    private final ScriptVersionRepository scriptVersionRepository;
    private final CharacterRepository characterRepository;
    private final ForeshadowRepository foreshadowRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    // ─── Read Methods ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Optional<Script> getScriptByProjectId(UUID projectId) {
        return scriptRepository.findByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public VersionListResponse getVersionHistory(UUID projectId, int limit, int offset) {
        Script script = getScriptOrThrow(projectId);
        List<ScriptVersion> versions = scriptVersionRepository.findByScriptIdOrderByVersionDesc(
                script.getId(), PageRequest.of(offset / Math.max(limit, 1), limit));
        List<VersionResponse> items = versions.stream()
                .map(v -> new VersionResponse(v.getId(), v.getVersion(), v.getMessage(), v.getCreatedAt()))
                .collect(Collectors.toList());
        long total = scriptVersionRepository.findByScriptIdOrderByVersionDesc(script.getId()).size();
        return new VersionListResponse(items, (int) total);
    }

    @Transactional(readOnly = true)
    public VersionDetailResponse getVersion(UUID projectId, int version) {
        Script script = getScriptOrThrow(projectId);
        ScriptVersion sv = scriptVersionRepository.findByScriptIdAndVersion(script.getId(), version)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Version " + version + " not found for script in project " + projectId));
        return new VersionDetailResponse(sv.getId(), sv.getVersion(), sv.getContent(), sv.getMessage(), sv.getCreatedAt());
    }

    // ─── Write Methods ──────────────────────────────────────────────

    @Transactional
    public Script createScript(UUID projectId, String title, JsonNode content) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        if (scriptRepository.findByProjectId(projectId).isPresent()) {
            throw new IllegalStateException("Script already exists for project " + projectId);
        }

        Script script = Script.builder()
                .project(project)
                .title(title != null ? title : "Untitled Script")
                .content(content != null ? content : objectMapper.createObjectNode())
                .version(1)
                .build();
        recalculateCounts(script);
        script = scriptRepository.save(script);

        // Auto-create version 1 snapshot
        saveVersionSnapshot(script, "Initial version");

        log.info("Created script for project {} with title '{}'", projectId, script.getTitle());
        return script;
    }

    @Transactional
    public Script updateScript(UUID projectId, JsonNode content, String changeSummary) {
        if (content == null) {
            throw new IllegalArgumentException("Content must not be null");
        }

        Script script = getScriptOrThrow(projectId);
        script.setContent(content);
        script.setVersion(script.getVersion() + 1);
        recalculateCounts(script);
        script = scriptRepository.save(script);

        saveVersionSnapshot(script, changeSummary != null ? changeSummary : "Updated");

        log.info("Updated script for project {} to version {}", projectId, script.getVersion());
        return script;
    }

    @Transactional
    public Script restoreVersion(UUID projectId, int version) {
        Script script = getScriptOrThrow(projectId);
        ScriptVersion sv = scriptVersionRepository.findByScriptIdAndVersion(script.getId(), version)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Version " + version + " not found for script in project " + projectId));

        script.setContent(sv.getContent());
        script.setVersion(script.getVersion() + 1);
        recalculateCounts(script);
        script = scriptRepository.save(script);

        saveVersionSnapshot(script, "Restored from version " + version);

        log.info("Restored script for project {} from version {}, new version is {}",
                projectId, version, script.getVersion());
        return script;
    }

    @Transactional(readOnly = true)
    public DiffResponse computeDiff(UUID projectId, int fromVersion, int toVersion) {
        Script script = getScriptOrThrow(projectId);

        ScriptVersion from = scriptVersionRepository.findByScriptIdAndVersion(script.getId(), fromVersion)
                .orElseThrow(() -> new EntityNotFoundException("Version " + fromVersion + " not found"));
        ScriptVersion to = scriptVersionRepository.findByScriptIdAndVersion(script.getId(), toVersion)
                .orElseThrow(() -> new EntityNotFoundException("Version " + toVersion + " not found"));

        JsonNode fromEpisodes = getEpisodesArray(from.getContent());
        JsonNode toEpisodes = getEpisodesArray(to.getContent());

        List<DiffResponse.EpisodeDiff> added = new ArrayList<>();
        List<DiffResponse.EpisodeDiff> removed = new ArrayList<>();
        List<DiffResponse.EpisodeDiff> modified = new ArrayList<>();

        // Index episodes by episode number
        java.util.Map<Integer, JsonNode> fromMap = new java.util.HashMap<>();
        java.util.Map<Integer, JsonNode> toMap = new java.util.HashMap<>();

        if (fromEpisodes.isArray()) {
            for (JsonNode ep : fromEpisodes) {
                int epNum = ep.has("episodeNumber") ? ep.get("episodeNumber").asInt() : 0;
                fromMap.put(epNum, ep);
            }
        }
        if (toEpisodes.isArray()) {
            for (JsonNode ep : toEpisodes) {
                int epNum = ep.has("episodeNumber") ? ep.get("episodeNumber").asInt() : 0;
                toMap.put(epNum, ep);
            }
        }

        // Find added episodes
        for (java.util.Map.Entry<Integer, JsonNode> entry : toMap.entrySet()) {
            if (!fromMap.containsKey(entry.getKey())) {
                added.add(new DiffResponse.EpisodeDiff(entry.getKey(), List.of()));
            }
        }

        // Find removed episodes
        for (java.util.Map.Entry<Integer, JsonNode> entry : fromMap.entrySet()) {
            if (!toMap.containsKey(entry.getKey())) {
                removed.add(new DiffResponse.EpisodeDiff(entry.getKey(), List.of()));
            }
        }

        // Find modified episodes (compare scene-level)
        for (java.util.Map.Entry<Integer, JsonNode> entry : fromMap.entrySet()) {
            int epNum = entry.getKey();
            if (toMap.containsKey(epNum)) {
                List<DiffResponse.SceneDiff> sceneDiffs = diffScenes(entry.getValue(), toMap.get(epNum));
                if (!sceneDiffs.isEmpty()) {
                    modified.add(new DiffResponse.EpisodeDiff(epNum, sceneDiffs));
                }
            }
        }

        return new DiffResponse(fromVersion, toVersion,
                new DiffResponse.DiffData(added, removed, modified));
    }

    @Transactional(readOnly = true)
    public JsonNode parseOutline(String outlineText) {
        if (outlineText == null || outlineText.isBlank()) {
            return objectMapper.createObjectNode();
        }

        ObjectNode result = objectMapper.createObjectNode();
        ArrayNode episodes = objectMapper.createArrayNode();

        String[] lines = outlineText.split("\\r?\\n");
        ObjectNode currentEpisode = null;
        int episodeNumber = 0;

        // Patterns for episode markers
        Pattern headingPattern = Pattern.compile("^#{1,3}\\s*(.+)");
        Pattern chineseEpisodePattern = Pattern.compile("第\\s*(\\d+)\\s*集");
        Pattern chapterPattern = Pattern.compile("(?i)(?:chapter|ep(?:isode)?|第)\\s*(\\d+)");
        Pattern numberedPattern = Pattern.compile("^(\\d+)[.、)\\s]\\s*(.+)");

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            // Check for markdown heading
            Matcher headingMatcher = headingPattern.matcher(trimmed);
            if (headingMatcher.matches()) {
                String headingText = headingMatcher.group(1);

                // Check if it looks like an episode heading
                Matcher epMatcher = chineseEpisodePattern.matcher(headingText);
                Matcher chMatcher = chapterPattern.matcher(headingText);

                if (epMatcher.find()) {
                    episodeNumber = Integer.parseInt(epMatcher.group(1));
                    if (currentEpisode != null) {
                        episodes.add(currentEpisode);
                    }
                    currentEpisode = objectMapper.createObjectNode();
                    currentEpisode.put("episodeNumber", episodeNumber);
                    currentEpisode.put("title", headingText);
                    currentEpisode.set("keyEvents", objectMapper.createArrayNode());
                    continue;
                } else if (chMatcher.find()) {
                    episodeNumber = Integer.parseInt(chMatcher.group(1));
                    if (currentEpisode != null) {
                        episodes.add(currentEpisode);
                    }
                    currentEpisode = objectMapper.createObjectNode();
                    currentEpisode.put("episodeNumber", episodeNumber);
                    currentEpisode.put("title", headingText);
                    currentEpisode.set("keyEvents", objectMapper.createArrayNode());
                    continue;
                }
            }

            // Check for numbered list items
            Matcher numMatcher = numberedPattern.matcher(trimmed);
            if (numMatcher.matches()) {
                episodeNumber = Integer.parseInt(numMatcher.group(1));
                if (currentEpisode != null) {
                    episodes.add(currentEpisode);
                }
                currentEpisode = objectMapper.createObjectNode();
                currentEpisode.put("episodeNumber", episodeNumber);
                currentEpisode.put("title", numMatcher.group(2).trim());
                currentEpisode.set("keyEvents", objectMapper.createArrayNode());
                continue;
            }

            // Otherwise treat as content within current episode (summary/key event)
            if (currentEpisode != null) {
                if (currentEpisode.has("summary")) {
                    String existing = currentEpisode.get("summary").asText();
                    currentEpisode.put("summary", existing + "\n" + trimmed);
                } else {
                    currentEpisode.put("summary", trimmed);
                }
            }
        }

        // Add last episode
        if (currentEpisode != null) {
            episodes.add(currentEpisode);
        }

        result.set("episodes", episodes);
        result.put("totalEpisodes", episodes.size());
        return result;
    }

    @Transactional
    public Script reorderEpisodes(UUID projectId, List<Integer> newOrder) {
        if (newOrder == null || newOrder.isEmpty()) {
            throw new IllegalArgumentException("newOrder must not be null or empty");
        }

        Script script = getScriptOrThrow(projectId);
        JsonNode content = script.getContent();
        ArrayNode episodes = (ArrayNode) getEpisodesArray(content);

        // Build index by episode number
        java.util.Map<Integer, JsonNode> episodeMap = new java.util.LinkedHashMap<>();
        for (JsonNode ep : episodes) {
            int epNum = ep.get("episodeNumber").asInt();
            episodeMap.put(epNum, ep);
        }

        ArrayNode reordered = objectMapper.createArrayNode();
        for (int epNum : newOrder) {
            JsonNode ep = episodeMap.get(epNum);
            if (ep == null) {
                throw new IllegalArgumentException("Episode " + epNum + " not found in script");
            }
            reordered.add(ep);
        }

        // Update episode numbers to reflect new order
        for (int i = 0; i < reordered.size(); i++) {
            ((ObjectNode) reordered.get(i)).put("episodeNumber", i + 1);
        }

        if (content.isObject()) {
            ((ObjectNode) content).set("episodes", reordered);
            ((ObjectNode) content).put("totalEpisodes", reordered.size());
        }

        script.setContent(content);
        script.setVersion(script.getVersion() + 1);
        recalculateCounts(script);
        script = scriptRepository.save(script);
        saveVersionSnapshot(script, "Reordered episodes");

        return script;
    }

    @Transactional
    public Script mergeEpisodes(UUID projectId, int ep1, int ep2) {
        if (ep1 == ep2) {
            throw new IllegalArgumentException("Cannot merge an episode with itself");
        }

        Script script = getScriptOrThrow(projectId);
        JsonNode content = script.getContent();
        ArrayNode episodes = (ArrayNode) getEpisodesArray(content);

        JsonNode first = null;
        JsonNode second = null;
        int firstIdx = -1, secondIdx = -1;

        for (int i = 0; i < episodes.size(); i++) {
            int epNum = episodes.get(i).get("episodeNumber").asInt();
            if (epNum == ep1) { first = episodes.get(i); firstIdx = i; }
            if (epNum == ep2) { second = episodes.get(i); secondIdx = i; }
        }

        if (first == null) throw new EntityNotFoundException("Episode " + ep1 + " not found");
        if (second == null) throw new EntityNotFoundException("Episode " + ep2 + " not found");

        // Merge scenes from second into first
        ArrayNode mergedScenes = objectMapper.createArrayNode();
        JsonNode firstScenes = first.get("scenes");
        JsonNode secondScenes = second.get("scenes");
        if (firstScenes != null && firstScenes.isArray()) {
            for (JsonNode s : firstScenes) mergedScenes.add(s);
        }
        if (secondScenes != null && secondScenes.isArray()) {
            for (JsonNode s : secondScenes) mergedScenes.add(s);
        }

        ((ObjectNode) first).set("scenes", mergedScenes);
        String title1 = first.has("title") ? first.get("title").asText() : "";
        String title2 = second.has("title") ? second.get("title").asText() : "";
        ((ObjectNode) first).put("title", title1 + " + " + title2);

        // Remove second episode
        int removeIdx = Math.max(firstIdx, secondIdx);
        episodes.remove(removeIdx);

        // Renumber episodes
        for (int i = 0; i < episodes.size(); i++) {
            ((ObjectNode) episodes.get(i)).put("episodeNumber", i + 1);
        }

        if (content.isObject()) {
            ((ObjectNode) content).put("totalEpisodes", episodes.size());
        }

        script.setContent(content);
        script.setVersion(script.getVersion() + 1);
        recalculateCounts(script);
        script = scriptRepository.save(script);
        saveVersionSnapshot(script, "Merged episodes " + ep1 + " and " + ep2);

        return script;
    }

    @Transactional
    public Script splitEpisode(UUID projectId, int episodeNumber, int splitPoint) {
        Script script = getScriptOrThrow(projectId);
        JsonNode content = script.getContent();
        ArrayNode episodes = (ArrayNode) getEpisodesArray(content);

        JsonNode target = null;
        int targetIdx = -1;
        for (int i = 0; i < episodes.size(); i++) {
            if (episodes.get(i).get("episodeNumber").asInt() == episodeNumber) {
                target = episodes.get(i);
                targetIdx = i;
                break;
            }
        }

        if (target == null) {
            throw new EntityNotFoundException("Episode " + episodeNumber + " not found");
        }

        JsonNode scenes = target.get("scenes");
        if (scenes == null || !scenes.isArray() || scenes.size() <= 1) {
            throw new IllegalArgumentException("Episode must have more than one scene to split");
        }

        if (splitPoint < 1 || splitPoint >= scenes.size()) {
            throw new IllegalArgumentException("splitPoint must be between 1 and " + (scenes.size() - 1));
        }

        // First half keeps original episode number
        ArrayNode firstHalf = objectMapper.createArrayNode();
        ArrayNode secondHalf = objectMapper.createArrayNode();
        for (int i = 0; i < scenes.size(); i++) {
            if (i < splitPoint) {
                firstHalf.add(scenes.get(i));
            } else {
                secondHalf.add(scenes.get(i));
            }
        }

        ((ObjectNode) target).set("scenes", firstHalf);
        String originalTitle = target.has("title") ? target.get("title").asText() : "Episode " + episodeNumber;
        ((ObjectNode) target).put("title", originalTitle + " (Part 1)");

        // Create second episode
        ObjectNode newEp = objectMapper.createObjectNode();
        newEp.put("episodeNumber", episodeNumber + 1);
        newEp.put("title", originalTitle + " (Part 2)");
        newEp.set("scenes", secondHalf);
        newEp.set("keyEvents", objectMapper.createArrayNode());

        // Insert new episode after the original
        episodes.insert(targetIdx + 1, newEp);

        // Renumber all episodes
        for (int i = 0; i < episodes.size(); i++) {
            ((ObjectNode) episodes.get(i)).put("episodeNumber", i + 1);
        }

        if (content.isObject()) {
            ((ObjectNode) content).put("totalEpisodes", episodes.size());
        }

        script.setContent(content);
        script.setVersion(script.getVersion() + 1);
        recalculateCounts(script);
        script = scriptRepository.save(script);
        saveVersionSnapshot(script, "Split episode " + episodeNumber + " at scene " + splitPoint);

        return script;
    }

    // ─── Private Helpers ────────────────────────────────────────────

    private Script getScriptOrThrow(UUID projectId) {
        return scriptRepository.findByProjectId(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Script not found for project " + projectId));
    }

    private void saveVersionSnapshot(Script script, String message) {
        ScriptVersion version = ScriptVersion.builder()
                .script(script)
                .version(script.getVersion())
                .content(script.getContent())
                .message(message)
                .build();
        scriptVersionRepository.save(version);
    }

    private void recalculateCounts(Script script) {
        JsonNode content = script.getContent();
        if (content == null || !content.isObject()) return;

        int wordCount = 0;
        int sceneCount = 0;
        int episodeCount = 0;

        JsonNode episodes = content.get("episodes");
        if (episodes != null && episodes.isArray()) {
            episodeCount = episodes.size();
            for (JsonNode ep : episodes) {
                JsonNode scenes = ep.get("scenes");
                if (scenes != null && scenes.isArray()) {
                    sceneCount += scenes.size();
                    for (JsonNode scene : scenes) {
                        JsonNode beats = scene.get("beats");
                        if (beats != null && beats.isArray()) {
                            for (JsonNode beat : beats) {
                                if (beat.has("content")) {
                                    String text = beat.get("content").asText("");
                                    // Approximate word count: for CJK, count characters; for Latin, split by whitespace
                                    wordCount += countWords(text);
                                }
                            }
                        }
                    }
                }
            }
        }

        script.setWordCount(wordCount);
        script.setSceneCount(sceneCount);
        script.setEpisodeCount(episodeCount);
    }

    private int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        // CJK characters count individually, Latin words split by whitespace
        int count = 0;
        boolean inWord = false;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (Character.isIdeographic(c)) {
                count++;
                inWord = false;
            } else if (Character.isLetterOrDigit(c)) {
                if (!inWord) { count++; inWord = true; }
            } else {
                inWord = false;
            }
        }
        return count;
    }

    private JsonNode getEpisodesArray(JsonNode content) {
        if (content != null && content.isObject() && content.has("episodes")) {
            return content.get("episodes");
        }
        return objectMapper.createArrayNode();
    }

    private List<DiffResponse.SceneDiff> diffScenes(JsonNode fromEpisode, JsonNode toEpisode) {
        List<DiffResponse.SceneDiff> diffs = new ArrayList<>();

        JsonNode fromScenes = fromEpisode.has("scenes") ? fromEpisode.get("scenes") : objectMapper.createArrayNode();
        JsonNode toScenes = toEpisode.has("scenes") ? toEpisode.get("scenes") : objectMapper.createArrayNode();

        java.util.Map<String, JsonNode> fromSceneMap = new java.util.LinkedHashMap<>();
        java.util.Map<String, JsonNode> toSceneMap = new java.util.LinkedHashMap<>();

        if (fromScenes.isArray()) {
            for (JsonNode s : fromScenes) {
                String id = s.has("sceneId") ? s.get("sceneId").asText() : "unknown";
                fromSceneMap.put(id, s);
            }
        }
        if (toScenes.isArray()) {
            for (JsonNode s : toScenes) {
                String id = s.has("sceneId") ? s.get("sceneId").asText() : "unknown";
                toSceneMap.put(id, s);
            }
        }

        // Compare scenes present in both versions
        for (java.util.Map.Entry<String, JsonNode> entry : fromSceneMap.entrySet()) {
            String sceneId = entry.getKey();
            if (toSceneMap.containsKey(sceneId)) {
                List<DiffResponse.BeatDiff> beatDiffs = diffBeats(entry.getValue(), toSceneMap.get(sceneId));
                if (!beatDiffs.isEmpty()) {
                    diffs.add(new DiffResponse.SceneDiff(sceneId, List.of(), List.of(), beatDiffs));
                }
            }
        }

        return diffs;
    }

    private List<DiffResponse.BeatDiff> diffBeats(JsonNode fromScene, JsonNode toScene) {
        List<DiffResponse.BeatDiff> diffs = new ArrayList<>();

        JsonNode fromBeats = fromScene.has("beats") ? fromScene.get("beats") : objectMapper.createArrayNode();
        JsonNode toBeats = toScene.has("beats") ? toScene.get("beats") : objectMapper.createArrayNode();

        java.util.Map<String, JsonNode> fromBeatMap = new java.util.LinkedHashMap<>();
        java.util.Map<String, JsonNode> toBeatMap = new java.util.LinkedHashMap<>();

        if (fromBeats.isArray()) {
            for (JsonNode b : fromBeats) {
                String id = b.has("beatId") ? b.get("beatId").asText() : "unknown";
                fromBeatMap.put(id, b);
            }
        }
        if (toBeats.isArray()) {
            for (JsonNode b : toBeats) {
                String id = b.has("beatId") ? b.get("beatId").asText() : "unknown";
                toBeatMap.put(id, b);
            }
        }

        for (java.util.Map.Entry<String, JsonNode> entry : fromBeatMap.entrySet()) {
            String beatId = entry.getKey();
            JsonNode fromBeat = entry.getValue();
            if (toBeatMap.containsKey(beatId)) {
                JsonNode toBeat = toBeatMap.get(beatId);
                // Compare key fields
                for (String field : new String[]{"content", "character", "emotion", "type"}) {
                    String oldVal = fromBeat.has(field) ? fromBeat.get(field).asText("") : "";
                    String newVal = toBeat.has(field) ? toBeat.get(field).asText("") : "";
                    if (!oldVal.equals(newVal)) {
                        diffs.add(new DiffResponse.BeatDiff(beatId, field, oldVal, newVal));
                    }
                }
            }
        }

        return diffs;
    }
}
