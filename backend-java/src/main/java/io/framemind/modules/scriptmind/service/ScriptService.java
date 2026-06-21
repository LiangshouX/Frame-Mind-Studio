package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.infrastructure.po.ProjectPO;
import io.framemind.infrastructure.repository.ProjectRepository;
import io.framemind.modules.scriptmind.po.ScriptPO;
import io.framemind.modules.scriptmind.repository.ScriptRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 剧本服务，负责剧本的创建、编辑、集数编排等业务操作。
 * 新内容直接覆盖旧内容，不保留历史版本。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScriptService {

    private final ScriptRepository scriptRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    // ─── 读取方法 ───────────────────────────────────────────────────

    /**
     * 根据项目 ID 获取关联的剧本。
     *
     * @param projectId 项目 ID
     * @return 剧本（可能为空）
     */
    @Transactional(readOnly = true)
    public Optional<ScriptPO> getScriptByProjectId(UUID projectId) {
        return scriptRepository.findByProjectId(projectId);
    }

    // ─── 写入方法 ──────────────────────────────────────────────────

    /**
     * 为项目创建新剧本。
     *
     * @param projectId 项目 ID
     * @param title     剧本标题
     * @param content   剧本内容（JSON）
     * @return 创建后的剧本实体
     * @throws IllegalStateException 项目已存在剧本时抛出
     */
    @Transactional
    public ScriptPO createScript(UUID projectId, String title, JsonNode content) {
        ProjectPO project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        if (scriptRepository.findByProjectId(projectId).isPresent()) {
            throw new IllegalStateException("Script already exists for project " + projectId);
        }

        ScriptPO script = ScriptPO.builder()
                .project(project)
                .title(title != null ? title : "Untitled Script")
                .content(content != null ? content : objectMapper.createObjectNode())
                .version(1)
                .build();
        recalculateCounts(script);
        script = scriptRepository.save(script);

        log.info("Created script for project {} with title '{}'", projectId, script.getTitle());
        return script;
    }

    /**
     * 更新剧本内容。如果剧本不存在则自动创建（Upsert 语义）。
     * 新内容直接覆盖旧内容，不保留历史版本。
     *
     * @param projectId 项目 ID
     * @param content   新的剧本内容（JSON）
     * @return 更新后的剧本实体
     * @throws IllegalArgumentException 内容为 null 时抛出
     */
    @Transactional
    public ScriptPO updateScript(UUID projectId, JsonNode content) {
        if (content == null) {
            throw new IllegalArgumentException("Content must not be null");
        }

        // Upsert：如果剧本不存在则自动创建
        ScriptPO script = scriptRepository.findByProjectId(projectId)
                .orElseGet(() -> {
                    log.info("Script not found for project {}, creating new one", projectId);
                    ProjectPO project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
                    return ScriptPO.builder()
                            .project(project)
                            .title("Untitled Script")
                            .content(objectMapper.createObjectNode())
                            .version(0)
                            .build();
                });

        script.setContent(content);
        script.setVersion(script.getVersion() + 1);
        recalculateCounts(script);
        script = scriptRepository.save(script);

        log.info("Updated script for project {} to version {}", projectId, script.getVersion());
        return script;
    }

    /**
     * 更新单集剧本内容。
     *
     * @param projectId     项目 ID
     * @param episodeNumber 集数编号
     * @param episodeContent 新的集数内容（JSON）
     * @return 更新后的剧本实体
     */
    @Transactional
    public ScriptPO updateEpisode(UUID projectId, int episodeNumber, JsonNode episodeContent) {
        ScriptPO script = getScriptOrThrow(projectId);
        JsonNode content = script.getContent();
        ArrayNode episodes = (ArrayNode) getEpisodesArray(content);

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
            throw new EntityNotFoundException("Episode " + episodeNumber + " not found in script");
        }

        script.setContent(content);
        script.setVersion(script.getVersion() + 1);
        recalculateCounts(script);
        script = scriptRepository.save(script);

        log.info("Updated episode {} for project {}", episodeNumber, projectId);
        return script;
    }

    /**
     * 解析大纲文本，提取集数结构和关键事件。
     *
     * @param outlineText 大纲文本
     * @return 解析后的 JSON 结构
     */
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

        // 集数标记模式
        Pattern headingPattern = Pattern.compile("^#{1,3}\\s*(.+)");
        Pattern chineseEpisodePattern = Pattern.compile("第\\s*(\\d+)\\s*集");
        Pattern chapterPattern = Pattern.compile("(?i)(?:chapter|ep(?:isode)?|第)\\s*(\\d+)");
        Pattern numberedPattern = Pattern.compile("^(\\d+)[.、)\\s]\\s*(.+)");

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            // 检查 Markdown 标题
            Matcher headingMatcher = headingPattern.matcher(trimmed);
            if (headingMatcher.matches()) {
                String headingText = headingMatcher.group(1);

                // 检查是否为集数标题
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

            // 检查编号列表项
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

            // 其余内容作为当前集数的摘要/关键事件
            if (currentEpisode != null) {
                if (currentEpisode.has("summary")) {
                    String existing = currentEpisode.get("summary").asText();
                    currentEpisode.put("summary", existing + "\n" + trimmed);
                } else {
                    currentEpisode.put("summary", trimmed);
                }
            }
        }

        // 添加最后一集
        if (currentEpisode != null) {
            episodes.add(currentEpisode);
        }

        result.set("episodes", episodes);
        result.put("totalEpisodes", episodes.size());
        return result;
    }

    /**
     * 重新排列集数顺序。
     *
     * @param projectId 项目 ID
     * @param newOrder  新的集数顺序（集数编号列表）
     * @return 更新后的剧本实体
     */
    @Transactional
    public ScriptPO reorderEpisodes(UUID projectId, List<Integer> newOrder) {
        if (newOrder == null || newOrder.isEmpty()) {
            throw new IllegalArgumentException("newOrder must not be null or empty");
        }

        ScriptPO script = getScriptOrThrow(projectId);
        JsonNode content = script.getContent();
        ArrayNode episodes = (ArrayNode) getEpisodesArray(content);

        // 按集数编号构建索引
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

        // 更新集数编号以反映新顺序
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

        return script;
    }

    // ─── 私有辅助方法 ───────────────────────────────────────────────

    private ScriptPO getScriptOrThrow(UUID projectId) {
        return scriptRepository.findByProjectId(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Script not found for project " + projectId));
    }

    private void recalculateCounts(ScriptPO script) {
        JsonNode content = script.getContent();
        if (content == null || !content.isObject()) return;

        int wordCount = 0;
        int sceneCount = 0;
        int episodeCount = 0;

        // 支持短剧模型（episodes）和传统影视模型（acts）
        JsonNode episodes = content.get("episodes");
        if (episodes != null && episodes.isArray()) {
            episodeCount = episodes.size();
            for (JsonNode ep : episodes) {
                JsonNode scenes = ep.get("scenes");
                if (scenes != null && scenes.isArray()) {
                    sceneCount += scenes.size();
                    for (JsonNode scene : scenes) {
                        // 短剧模型：beats
                        JsonNode beats = scene.get("beats");
                        if (beats != null && beats.isArray()) {
                            for (JsonNode beat : beats) {
                                if (beat.has("content")) {
                                    wordCount += countWords(beat.get("content").asText(""));
                                }
                                // 统计对白字数
                                JsonNode dialogues = beat.get("dialogues");
                                if (dialogues != null && dialogues.isArray()) {
                                    for (JsonNode d : dialogues) {
                                        if (d.has("line")) {
                                            wordCount += countWords(d.get("line").asText(""));
                                        }
                                    }
                                }
                            }
                        }
                        // 传统影视模型：blocks
                        JsonNode blocks = scene.get("blocks");
                        if (blocks != null && blocks.isArray()) {
                            for (JsonNode block : blocks) {
                                if (block.has("content")) {
                                    wordCount += countWords(block.get("content").asText(""));
                                }
                            }
                        }
                    }
                }
            }
        }

        // 传统影视模型：acts → sequences → scenes
        JsonNode acts = content.get("acts");
        if (acts != null && acts.isArray()) {
            for (JsonNode act : acts) {
                JsonNode sequences = act.get("sequences");
                if (sequences != null && sequences.isArray()) {
                    for (JsonNode seq : sequences) {
                        JsonNode scenes = seq.get("scenes");
                        if (scenes != null && scenes.isArray()) {
                            sceneCount += scenes.size();
                            for (JsonNode scene : scenes) {
                                JsonNode blocks = scene.get("blocks");
                                if (blocks != null && blocks.isArray()) {
                                    for (JsonNode block : blocks) {
                                        if (block.has("content")) {
                                            wordCount += countWords(block.get("content").asText(""));
                                        }
                                    }
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
}
