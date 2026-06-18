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

    // ─── File Parsing ───────────────────────────────────────────────

    /**
     * Parse a plain text file, detecting encoding and splitting by chapter/section markers.
     */
    public JsonNode parseTxtFile(byte[] content, String filename) {
        if (content == null || content.length == 0) {
            return createEmptyContent();
        }
        String text = detectAndDecode(content);
        return parseTextByMarkers(text, filename);
    }

    /**
     * Parse a DOCX file. Uses basic XML extraction from the DOCX zip structure.
     * Falls back to raw text if parsing fails.
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
     * Parse a Markdown file, using heading structure as episode/scene boundaries.
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

                // Flush pending content
                if (currentContent.length() > 0 && currentScene != null) {
                    addContentAsBeat(currentScene, currentContent.toString());
                    currentContent.setLength(0);
                }

                if (level <= 2) {
                    // Level 1-2 headings = episode boundaries
                    episodeNum++;
                    currentEpisode = objectMapper.createObjectNode();
                    currentEpisode.put("episodeNumber", episodeNum);
                    currentEpisode.put("title", headingText);
                    currentEpisode.set("scenes", objectMapper.createArrayNode());
                    currentEpisode.set("keyEvents", objectMapper.createArrayNode());
                    episodes.add(currentEpisode);
                    currentScene = null;
                } else if (level <= 4 && currentEpisode != null) {
                    // Level 3-4 headings = scene boundaries
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

        // Flush remaining content
        if (currentContent.length() > 0 && currentScene != null) {
            addContentAsBeat(currentScene, currentContent.toString());
        }

        result.set("episodes", episodes);
        result.put("totalEpisodes", episodes.size());
        result.put("title", "Imported Markdown");
        return result;
    }

    /**
     * Parse a Fountain screenplay format file.
     * Handles: Title, Scene Headings, Action, Dialogue, Parenthetical, Transitions.
     */
    public JsonNode parseFountainFile(byte[] content) {
        if (content == null || content.length == 0) {
            return createEmptyContent();
        }
        String text = new String(content, StandardCharsets.UTF_8);
        validateFileSize(text);

        ObjectNode result = objectMapper.createObjectNode();
        ArrayNode episodes = objectMapper.createArrayNode();

        // Fountain uses a single episode/act structure by default
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
                // Blank line: flush buffers
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

            // Title page (at start of document, before first content)
            if (i < 20 && trimmed.startsWith("Title:")) {
                String titleVal = trimmed.substring("Title:".length()).trim();
                episode.put("title", titleVal);
                result.put("title", titleVal);
                continue;
            }

            // Scene heading
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

            // Transition
            if (FOUNTAIN_TRANSITION.matcher(trimmed).matches()) {
                if (currentScene == null) {
                    currentScene = createDefaultScene(++sceneNum);
                    ((ArrayNode) episode.get("scenes")).add(currentScene);
                }
                addBeat(currentScene, "transition", trimmed, null, null);
                continue;
            }

            // Character name (ALL CAPS followed by dialogue)
            if (trimmed.equals(trimmed.toUpperCase()) && trimmed.length() > 1
                    && !trimmed.startsWith("!") && !trimmed.startsWith("=")
                    && i + 1 < lines.length && !lines[i + 1].trim().isEmpty()) {
                currentCharacter = trimmed.replaceAll("\\s*\\(.*\\)$", "").trim();
                inDialogue = true;
                continue;
            }

            // Parenthetical
            if (inDialogue && trimmed.startsWith("(") && trimmed.endsWith(")")) {
                if (currentScene == null) {
                    currentScene = createDefaultScene(++sceneNum);
                    ((ArrayNode) episode.get("scenes")).add(currentScene);
                }
                addBeat(currentScene, "parenthetical", trimmed, currentCharacter, null);
                continue;
            }

            // Dialogue
            if (inDialogue && currentCharacter != null) {
                if (currentScene == null) {
                    currentScene = createDefaultScene(++sceneNum);
                    ((ArrayNode) episode.get("scenes")).add(currentScene);
                }
                addBeat(currentScene, "dialogue", trimmed, currentCharacter, null);
                continue;
            }

            // Action (default)
            if (currentScene == null) {
                currentScene = createDefaultScene(++sceneNum);
                ((ArrayNode) episode.get("scenes")).add(currentScene);
            }
            actionBuffer.append(trimmed).append(" ");
        }

        // Flush remaining
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

    // ─── URL Fetching ───────────────────────────────────────────────

    /**
     * Fetch and extract main text content from a URL.
     * Strips HTML tags and returns plain text.
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
     * Validate file size does not exceed 500,000 characters.
     */
    public boolean validateFileSize(byte[] content) {
        if (content == null) return true;
        String text = new String(content, StandardCharsets.UTF_8);
        validateFileSize(text);
        return true;
    }

    // ─── Private Helpers ────────────────────────────────────────────

    private void validateFileSize(String text) {
        if (text.length() > MAX_CHAR_LIMIT) {
            throw new IllegalArgumentException(
                    "Content exceeds maximum size of " + MAX_CHAR_LIMIT + " characters (actual: " + text.length() + ")");
        }
    }

    private String detectAndDecode(byte[] content) {
        // Simple charset detection: check for BOM, then try UTF-8, fall back to platform default
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

        // Try UTF-8 first
        String utf8 = new String(content, StandardCharsets.UTF_8);
        if (!containsReplacementChars(utf8)) {
            validateFileSize(utf8);
            return utf8;
        }

        // Fall back to GBK for Chinese content
        try {
            String gbk = new String(content, Charset.forName("GBK"));
            validateFileSize(gbk);
            return gbk;
        } catch (Exception e) {
            // Final fallback
            validateFileSize(utf8);
            return utf8;
        }
    }

    private boolean containsReplacementChars(String text) {
        // Check for Unicode replacement character which indicates encoding issues
        int replacementCount = 0;
        for (int i = 0; i < text.length(); i++) {
            if (text.charAt(i) == '�') replacementCount++;
        }
        return replacementCount > text.length() * 0.01; // More than 1% replacement chars
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

        // Determine episode marker pattern from content
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
                // Flush pending
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

        // Flush remaining
        if (currentContent.length() > 0 && currentScene != null) {
            addContentAsBeat(currentScene, currentContent.toString());
        }

        result.set("episodes", episodes);
        result.put("totalEpisodes", episodes.size());
        result.put("title", filename != null ? filename : "Imported");
        return result;
    }

    private String extractTextFromDocx(byte[] content) throws IOException {
        // Basic DOCX text extraction by reading the word/document.xml inside the zip
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
        // Remove XML tags and decode common entities
        String text = xml.replaceAll("<[^>]+>", " ");
        text = text.replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&#x20;", " ");
        // Collapse whitespace
        text = text.replaceAll("\\s+", " ").trim();
        return text;
    }

    private String stripHtmlTags(String html) {
        // Remove script and style blocks
        String text = html.replaceAll("(?is)<(script|style)[^>]*>.*?</\\1>", " ");
        // Remove HTML tags
        text = text.replaceAll("<[^>]+>", " ");
        // Decode common HTML entities
        text = text.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&#39;", "'");
        // Collapse whitespace
        text = text.replaceAll("[ \\t]+", " ");
        // Collapse multiple blank lines
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
