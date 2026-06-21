package io.framemind.modules.scriptmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 导入服务，负责解析和导入各种格式的剧本文件（TXT、DOCX、Markdown、Fountain），
 * 以及从 URL 抓取文本内容。
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImportService {

    private static final int MAX_CHAR_LIMIT = 500_000;
    private static final Pattern CHAPTER_MARKER = Pattern.compile(
            "^\\s*(?:#{1,3}\\s+|第.*[章集]|Chapter\\s+\\d+|EP\\s*\\d+|\\d+[.、)\\s])",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE
    );
    private static final Pattern HEADING_PATTERN = Pattern.compile("^(#{1,6})\\s+(.+)$", Pattern.MULTILINE);
    private static final Pattern SCENE_HEADING_FOUNTAIN = Pattern.compile(
            "^(?:(?:INT|EXT|EST|INT\\.?/EXT\\.?)[\\.\\s].+|\\.[\\.\\s].+)$", Pattern.MULTILINE
    );
    private static final Pattern FOUNTAIN_TRANSITION = Pattern.compile(
            "^\\s*(?:CUT TO:|FADE (?:IN|OUT|TO BLACK|TO WHITE)|DISSOLVE TO:|SMASH CUT TO:|MATCH CUT TO:).*$",
            Pattern.MULTILINE | Pattern.CASE_INSENSITIVE
    );

    private final ObjectMapper objectMapper;

    // ─── 文件解析 ───────────────────────────────────────────────────

    /**
     * 解析纯文本文件，自动检测编码并按章节/节标记拆分。
     *
     * @param content  文件字节内容
     * @param filename 文件名
     * @return 解析后的 JSON 结构
     */
    public JsonNode parseTxtFile(byte[] content, String filename) {
        if (content == null || content.length == 0) {
            return createEmptyContent();
        }
        String text = detectAndDecode(content);
        return parseTextByMarkers(text, filename);
    }

    /**
     * 解析 DOCX 文件。通过基本的 XML 提取从 DOCX 压缩结构中获取文本。
     * 解析失败时回退为原始文本。
     *
     * @param content 文件字节内容
     * @return 解析后的 JSON 结构
     */
    public JsonNode parseDocxFile(byte[] content) {
        if (content == null || content.length == 0) {
            return createEmptyContent();
        }
        try {
            String text = extractTextFromDocx(content);
            return parseTextByMarkers(text, "imported.docx");
        } catch (Exception e) {
            log.warn("Failed to parse DOCX file, falling back to raw text", e);
            String raw = new String(content, StandardCharsets.UTF_8);
            return parseTextByMarkers(raw, "imported.docx");
        }
    }

    /**
     * 解析 Markdown 文件，使用标题结构作为集数/场景边界。
     *
     * @param content 文件字节内容
     * @return 解析后的 JSON 结构
     */
    public JsonNode parseMarkdownFile(byte[] content) {
        if (content == null || content.length == 0) {
            return createEmptyContent();
        }
        String text = new String(content, StandardCharsets.UTF_8);
        validateFileSize(text);

        ObjectNode result = objectMapper.createObjectNode();
        ArrayNode episodes = objectMapper.createArrayNode();

        String[] lines = text.split("\\r?\\n");
        ObjectNode currentEpisode = null;
        ObjectNode currentScene = null;
        int episodeNum = 0;
        int sceneNum = 0;
        StringBuilder currentContent = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            Matcher headingMatcher = HEADING_PATTERN.matcher(trimmed);

            if (headingMatcher.matches()) {
                int level = headingMatcher.group(1).length();
                String headingText = headingMatcher.group(2).trim();

                // 刷新待处理内容
                if (currentContent.length() > 0 && currentScene != null) {
                    addContentAsBeat(currentScene, currentContent.toString());
                    currentContent.setLength(0);
                }

                if (level <= 2) {
                    // 1-2 级标题 = 集数边界
                    episodeNum++;
                    currentEpisode = objectMapper.createObjectNode();
                    currentEpisode.put("episodeNumber", episodeNum);
                    currentEpisode.put("title", headingText);
                    currentEpisode.set("scenes", objectMapper.createArrayNode());
                    currentEpisode.set("keyEvents", objectMapper.createArrayNode());
                    episodes.add(currentEpisode);
                    currentScene = null;
                } else if (level <= 4 && currentEpisode != null) {
                    // 3-4 级标题 = 场景边界
                    sceneNum++;
                    currentScene = objectMapper.createObjectNode();
                    currentScene.put("sceneId", "scene_" + sceneNum);
                    currentScene.put("location", headingText);
                    currentScene.put("time", "");
                    currentScene.set("beats", objectMapper.createArrayNode());
                    currentScene.set("moodTags", objectMapper.createArrayNode());
                    currentScene.set("charactersPresent", objectMapper.createArrayNode());
                    ((ArrayNode) currentEpisode.get("scenes")).add(currentScene);
                }
            } else {
                currentContent.append(trimmed).append("\n");
            }
        }

        // 刷新剩余内容
        if (currentContent.length() > 0 && currentScene != null) {
            addContentAsBeat(currentScene, currentContent.toString());
        }

        result.set("episodes", episodes);
        result.put("totalEpisodes", episodes.size());
        result.put("title", "Imported Markdown");
        return result;
    }

    /**
     * 解析 Fountain 剧本格式文件。
     * 支持：标题页、场景标题、动作、对白、括号注释、转场。
     *
     * @param content 文件字节内容
     * @return 解析后的 JSON 结构
     */
    public JsonNode parseFountainFile(byte[] content) {
        if (content == null || content.length == 0) {
            return createEmptyContent();
        }
        String text = new String(content, StandardCharsets.UTF_8);
        validateFileSize(text);

        ObjectNode result = objectMapper.createObjectNode();
        ArrayNode episodes = objectMapper.createArrayNode();

        // Fountain 默认使用单集/幕结构
        ObjectNode episode = objectMapper.createObjectNode();
        episode.put("episodeNumber", 1);
        episode.put("title", "Imported Fountain");
        episode.set("scenes", objectMapper.createArrayNode());
        episode.set("keyEvents", objectMapper.createArrayNode());
        episodes.add(episode);

        String[] lines = text.split("\\r?\\n");
        ObjectNode currentScene = null;
        StringBuilder actionBuffer = new StringBuilder();
        boolean inDialogue = false;
        String currentCharacter = null;
        int sceneNum = 0;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String trimmed = line.trim();

            if (trimmed.isEmpty()) {
                // 空行：刷新缓冲区
                if (!inDialogue && actionBuffer.length() > 0) {
                    if (currentScene == null) {
                        currentScene = createDefaultScene(++sceneNum);
                        ((ArrayNode) episode.get("scenes")).add(currentScene);
                    }
                    addBeat(currentScene, "action", actionBuffer.toString().trim(), null, null);
                    actionBuffer.setLength(0);
                }
                inDialogue = false;
                continue;
            }

            // 标题页（文档开头，首个内容之前）
            if (i < 20 && trimmed.startsWith("Title:")) {
                String titleVal = trimmed.substring("Title:".length()).trim();
                episode.put("title", titleVal);
                result.put("title", titleVal);
                continue;
            }

            // 场景标题
            if (SCENE_HEADING_FOUNTAIN.matcher(trimmed).matches()) {
                if (actionBuffer.length() > 0 && currentScene != null) {
                    addBeat(currentScene, "action", actionBuffer.toString().trim(), null, null);
                    actionBuffer.setLength(0);
                }
                currentScene = createDefaultScene(++sceneNum);
                currentScene.put("location", trimmed);
                ((ArrayNode) episode.get("scenes")).add(currentScene);
                inDialogue = false;
                continue;
            }

            // 转场
            if (FOUNTAIN_TRANSITION.matcher(trimmed).matches()) {
                if (currentScene == null) {
                    currentScene = createDefaultScene(++sceneNum);
                    ((ArrayNode) episode.get("scenes")).add(currentScene);
                }
                addBeat(currentScene, "transition", trimmed, null, null);
                continue;
            }

            // 角色名（全大写，后跟对白）
            if (trimmed.equals(trimmed.toUpperCase()) && trimmed.length() > 1
                    && !trimmed.startsWith("!") && !trimmed.startsWith("=")
                    && i + 1 < lines.length && !lines[i + 1].trim().isEmpty()) {
                currentCharacter = trimmed.replaceAll("\\s*\\(.*\\)$", "").trim();
                inDialogue = true;
                continue;
            }

            // 括号注释
            if (inDialogue && trimmed.startsWith("(") && trimmed.endsWith(")")) {
                if (currentScene == null) {
                    currentScene = createDefaultScene(++sceneNum);
                    ((ArrayNode) episode.get("scenes")).add(currentScene);
                }
                addBeat(currentScene, "parenthetical", trimmed, currentCharacter, null);
                continue;
            }

            // 对白
            if (inDialogue && currentCharacter != null) {
                if (currentScene == null) {
                    currentScene = createDefaultScene(++sceneNum);
                    ((ArrayNode) episode.get("scenes")).add(currentScene);
                }
                addBeat(currentScene, "dialogue", trimmed, currentCharacter, null);
                continue;
            }

            // 动作（默认）
            if (currentScene == null) {
                currentScene = createDefaultScene(++sceneNum);
                ((ArrayNode) episode.get("scenes")).add(currentScene);
            }
            actionBuffer.append(trimmed).append(" ");
        }

        // 刷新剩余内容
        if (actionBuffer.length() > 0 && currentScene != null) {
            addBeat(currentScene, "action", actionBuffer.toString().trim(), null, null);
        }

        result.set("episodes", episodes);
        result.put("totalEpisodes", episodes.size());
        if (!result.has("title")) {
            result.put("title", "Imported Fountain");
        }
        return result;
    }

    // ─── URL 抓取 ───────────────────────────────────────────────────

    /**
     * 从 URL 抓取并提取主要文本内容。去除 HTML 标签后返回纯文本。
     *
     * @param url 目标 URL
     * @return 提取的纯文本内容
     * @throws IllegalArgumentException URL 为空或格式无效时抛出
     */
    public String fetchUrlContent(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("URL must not be null or blank");
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "FrameMindStudio/1.0 (Content Import)")
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                throw new RuntimeException("HTTP error " + response.statusCode() + " fetching URL: " + url);
            }

            String html = response.body();
            return stripHtmlTags(html);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid URL: " + url, e);
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to fetch URL: " + url, e);
        }
    }

    /**
     * 验证文件大小不超过 500,000 个字符。
     *
     * @param content 文件字节内容
     * @return 验证通过返回 true
     * @throws IllegalArgumentException 内容超过限制时抛出
     */
    public boolean validateFileSize(byte[] content) {
        if (content == null) return true;
        String text = new String(content, StandardCharsets.UTF_8);
        validateFileSize(text);
        return true;
    }

    // ─── 私有辅助方法 ────────────────────────────────────────────────

    private void validateFileSize(String text) {
        if (text.length() > MAX_CHAR_LIMIT) {
            throw new IllegalArgumentException(
                    "Content exceeds maximum size of " + MAX_CHAR_LIMIT + " characters (actual: " + text.length() + ")");
        }
    }

    private String detectAndDecode(byte[] content) {
        // 简单的字符集检测：先检查 BOM，然后尝试 UTF-8，最后回退到平台默认编码
        if (content.length >= 3 && content[0] == (byte) 0xEF && content[1] == (byte) 0xBB && content[2] == (byte) 0xBF) {
            // UTF-8 BOM
            validateAndReturn(content, StandardCharsets.UTF_8);
            return new String(content, 3, content.length - 3, StandardCharsets.UTF_8);
        }
        if (content.length >= 2 && content[0] == (byte) 0xFF && content[1] == (byte) 0xFE) {
            return new String(content, 2, content.length - 2, StandardCharsets.UTF_16LE);
        }
        if (content.length >= 2 && content[0] == (byte) 0xFE && content[1] == (byte) 0xFF) {
            return new String(content, 2, content.length - 2, StandardCharsets.UTF_16BE);
        }

        // 优先尝试 UTF-8
        String utf8 = new String(content, StandardCharsets.UTF_8);
        if (!containsReplacementChars(utf8)) {
            validateFileSize(utf8);
            return utf8;
        }

        // 回退到 GBK（适用于中文内容）
        try {
            String gbk = new String(content, Charset.forName("GBK"));
            validateFileSize(gbk);
            return gbk;
        } catch (Exception e) {
            // 最终回退
            validateFileSize(utf8);
            return utf8;
        }
    }

    private boolean containsReplacementChars(String text) {
        // 检查 Unicode 替换字符，表示编码问题
        int replacementCount = 0;
        for (int i = 0; i < text.length(); i++) {
            if (text.charAt(i) == '�') replacementCount++;
        }
        return replacementCount > text.length() * 0.01; // 超过 1% 替换字符
    }

    private void validateAndReturn(byte[] content, Charset charset) {
        String text = new String(content, charset);
        validateFileSize(text);
    }

    private JsonNode parseTextByMarkers(String text, String filename) {
        validateFileSize(text);

        ObjectNode result = objectMapper.createObjectNode();
        ArrayNode episodes = objectMapper.createArrayNode();

        String[] lines = text.split("\\r?\\n");
        ObjectNode currentEpisode = null;
        ObjectNode currentScene = null;
        int episodeNum = 0;
        int sceneNum = 0;
        StringBuilder currentContent = new StringBuilder();

        // 根据内容确定集数标记模式
        Pattern episodePattern = Pattern.compile(
                "^\\s*(?:第\\s*(\\d+)\\s*[章集]|Chapter\\s+(\\d+)|EP\\s*(\\d+)|#{1,2}\\s+.*(?:第|集|Chapter))",
                Pattern.CASE_INSENSITIVE
        );

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                if (currentContent.length() > 0 && currentScene != null) {
                    addContentAsBeat(currentScene, currentContent.toString());
                    currentContent.setLength(0);
                }
                continue;
            }

            Matcher epMatcher = episodePattern.matcher(trimmed);
            if (epMatcher.find()) {
                // 刷新待处理内容
                if (currentContent.length() > 0 && currentScene != null) {
                    addContentAsBeat(currentScene, currentContent.toString());
                    currentContent.setLength(0);
                }

                episodeNum++;
                currentEpisode = objectMapper.createObjectNode();
                currentEpisode.put("episodeNumber", episodeNum);
                currentEpisode.put("title", trimmed);
                currentEpisode.set("scenes", objectMapper.createArrayNode());
                currentEpisode.set("keyEvents", objectMapper.createArrayNode());
                episodes.add(currentEpisode);
                currentScene = null;
                continue;
            }

            if (currentEpisode == null) {
                episodeNum++;
                currentEpisode = objectMapper.createObjectNode();
                currentEpisode.put("episodeNumber", episodeNum);
                currentEpisode.put("title", filename != null ? filename : "Imported");
                currentEpisode.set("scenes", objectMapper.createArrayNode());
                currentEpisode.set("keyEvents", objectMapper.createArrayNode());
                episodes.add(currentEpisode);
            }

            if (currentScene == null) {
                currentScene = createDefaultScene(++sceneNum);
                ((ArrayNode) currentEpisode.get("scenes")).add(currentScene);
            }

            currentContent.append(trimmed).append("\n");
        }

        // 刷新剩余内容
        if (currentContent.length() > 0 && currentScene != null) {
            addContentAsBeat(currentScene, currentContent.toString());
        }

        result.set("episodes", episodes);
        result.put("totalEpisodes", episodes.size());
        result.put("title", filename != null ? filename : "Imported");
        return result;
    }

    private String extractTextFromDocx(byte[] content) throws IOException {
        // 通过读取 ZIP 结构中的 word/document.xml 进行基本的 DOCX 文本提取
        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(new ByteArrayInputStream(content))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if ("word/document.xml".equals(entry.getName())) {
                    String xml = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                    return stripXmlTags(xml);
                }
            }
        }
        return new String(content, StandardCharsets.UTF_8);
    }

    private String stripXmlTags(String xml) {
        // 去除 XML 标签并解码常见实体
        String text = xml.replaceAll("<[^>]+>", " ");
        text = text.replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&#x20;", " ");
        // 合并空白字符
        text = text.replaceAll("\\s+", " ").trim();
        return text;
    }

    private String stripHtmlTags(String html) {
        // 移除 script 和 style 块
        String text = html.replaceAll("(?is)<(script|style)[^>]*>.*?</\\1>", " ");
        // 移除 HTML 标签
        text = text.replaceAll("<[^>]+>", " ");
        // 解码常见 HTML 实体
        text = text.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&#39;", "'");
        // 合并空白字符
        text = text.replaceAll("[ \\t]+", " ");
        // 合并多个空行
        text = text.replaceAll("(\\s*\\n\\s*){3,}", "\n\n");
        return text.trim();
    }

    private ObjectNode createDefaultScene(int sceneNum) {
        ObjectNode scene = objectMapper.createObjectNode();
        scene.put("sceneId", "scene_" + sceneNum);
        scene.put("location", "Scene " + sceneNum);
        scene.put("time", "");
        scene.set("beats", objectMapper.createArrayNode());
        scene.set("moodTags", objectMapper.createArrayNode());
        scene.set("charactersPresent", objectMapper.createArrayNode());
        return scene;
    }

    private void addContentAsBeat(ObjectNode scene, String content) {
        if (content == null || content.isBlank()) return;
        ArrayNode beats = (ArrayNode) scene.get("beats");
        ObjectNode beat = objectMapper.createObjectNode();
        beat.put("beatId", "beat_" + (beats.size() + 1));
        beat.put("type", "action");
        beat.put("content", content.trim());
        beats.add(beat);
    }

    private void addBeat(ObjectNode scene, String type, String content, String character, String emotion) {
        if (content == null || content.isBlank()) return;
        ArrayNode beats = (ArrayNode) scene.get("beats");
        ObjectNode beat = objectMapper.createObjectNode();
        beat.put("beatId", "beat_" + (beats.size() + 1));
        beat.put("type", type);
        beat.put("content", content);
        if (character != null) beat.put("character", character);
        if (emotion != null) beat.put("emotion", emotion);
        beats.add(beat);
    }

    private JsonNode createEmptyContent() {
        ObjectNode result = objectMapper.createObjectNode();
        result.set("episodes", objectMapper.createArrayNode());
        result.put("totalEpisodes", 0);
        result.put("title", "Empty");
        return result;
    }
}
