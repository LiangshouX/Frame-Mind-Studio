package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.modules.scriptmind.po.ScriptPO;
import io.framemind.modules.scriptmind.repository.ScriptRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 导出服务，负责将剧本内容导出为 JSON 和 Fountain 格式。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {

    private final ScriptRepository scriptRepository;

    /**
     * 导出为 JSON 格式（遵循 ScriptsDataModel 结构）。
     *
     * @param projectId 项目 ID
     * @return JSON 格式的剧本内容
     */
    @Transactional(readOnly = true)
    public JsonNode exportJson(UUID projectId) {
        ScriptPO script = scriptRepository.findByProjectId(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Script not found for project " + projectId));
        return script.getContent();
    }

    /**
     * 导出为 Fountain 格式。
     *
     * @param projectId 项目 ID
     * @return Fountain 格式的剧本文本
     */
    @Transactional(readOnly = true)
    public String exportFountain(UUID projectId) {
        ScriptPO script = scriptRepository.findByProjectId(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Script not found for project " + projectId));

        JsonNode content = script.getContent();
        StringBuilder fountain = new StringBuilder();

        // 标题
        if (content.has("title")) {
            fountain.append("Title: ").append(content.get("title").asText()).append("\n");
        }
        fountain.append("\n");

        // 短剧模型
        if (content.has("episodes")) {
            JsonNode episodes = content.get("episodes");
            if (episodes.isArray()) {
                for (JsonNode episode : episodes) {
                    // 集标题作为场景标题
                    if (episode.has("title")) {
                        fountain.append("= ").append(episode.get("title").asText()).append(" =\n\n");
                    }

                    if (episode.has("scenes")) {
                        for (JsonNode scene : episode.get("scenes")) {
                            // 场景标题
                            String location = scene.has("location") ? scene.get("location").asText() : "";
                            String time = scene.has("time") ? scene.get("time").asText() : "";
                            String intExt = scene.has("intExt") ? scene.get("intExt").asText() : "内景";
                            fountain.append(intExt).append(". ").append(location).append(" - ").append(time).append("\n\n");

                            // 节拍
                            if (scene.has("beats")) {
                                for (JsonNode beat : scene.get("beats")) {
                                    // 动作描述
                                    if (beat.has("visualAction")) {
                                        fountain.append(beat.get("visualAction").asText()).append("\n\n");
                                    }
                                    if (beat.has("content")) {
                                        fountain.append(beat.get("content").asText()).append("\n\n");
                                    }

                                    // 对白
                                    if (beat.has("dialogues")) {
                                        for (JsonNode dialogue : beat.get("dialogues")) {
                                            String charName = dialogue.has("characterName")
                                                    ? dialogue.get("characterName").asText() : "";
                                            fountain.append(charName.toUpperCase()).append("\n");
                                            if (dialogue.has("parenthetical")) {
                                                fountain.append("(").append(dialogue.get("parenthetical").asText()).append(")\n");
                                            }
                                            if (dialogue.has("line")) {
                                                fountain.append(dialogue.get("line").asText()).append("\n");
                                            }
                                            fountain.append("\n");
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 传统影视模型
        if (content.has("acts")) {
            JsonNode acts = content.get("acts");
            if (acts.isArray()) {
                for (JsonNode act : acts) {
                    if (act.has("actName")) {
                        fountain.append("# ").append(act.get("actName").asText()).append("\n\n");
                    }
                    if (act.has("sequences")) {
                        for (JsonNode sequence : act.get("sequences")) {
                            if (sequence.has("sequenceName")) {
                                fountain.append("## ").append(sequence.get("sequenceName").asText()).append("\n\n");
                            }
                            if (sequence.has("scenes")) {
                                for (JsonNode scene : sequence.get("scenes")) {
                                    if (scene.has("slugline")) {
                                        fountain.append(scene.get("slugline").asText()).append("\n\n");
                                    }
                                    if (scene.has("blocks")) {
                                        for (JsonNode block : scene.get("blocks")) {
                                            String blockType = block.has("blockType") ? block.get("blockType").asText() : "";
                                            String blockContent = block.has("content") ? block.get("content").asText() : "";

                                            switch (blockType) {
                                                case "action" -> fountain.append(blockContent).append("\n\n");
                                                case "character" -> fountain.append(blockContent.toUpperCase()).append("\n");
                                                case "dialogue" -> fountain.append(blockContent).append("\n\n");
                                                case "parenthetical" -> fountain.append("(").append(blockContent).append(")\n");
                                                case "transition" -> fountain.append("> ").append(blockContent.toUpperCase()).append("\n\n");
                                                default -> fountain.append(blockContent).append("\n\n");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return fountain.toString();
    }
}
