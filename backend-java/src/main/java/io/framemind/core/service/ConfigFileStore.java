package io.framemind.core.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.framemind.core.config.FramemindConfigProperties;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads and writes the user configuration file at {@code ~/.framemind/config.json}.
 * <p>
 * Handles directory/file creation, graceful corruption recovery, and
 * restrictive file permissions (owner read/write only).
 */
@Slf4j
@Component
public class ConfigFileStore {

    private final FramemindConfigProperties configProperties;
    private final ObjectMapper objectMapper;
    private FramemindConfig config;

    public ConfigFileStore(FramemindConfigProperties configProperties) {
        this.configProperties = configProperties;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        this.objectMapper.findAndRegisterModules();
    }

    @PostConstruct
    public void init() {
        load();
    }

    /**
     * Loads config from disk. Creates directory/file if missing.
     * Corrupted entries are logged and skipped.
     */
    public synchronized void load() {
        Path configPath = configProperties.getConfigFilePath();
        if (!Files.exists(configPath)) {
            log.info("Config file not found at {}, creating default", configPath);
            this.config = new FramemindConfig();
            save();
            return;
        }
        try {
            byte[] bytes = Files.readAllBytes(configPath);
            if (bytes.length == 0) {
                this.config = new FramemindConfig();
                return;
            }
            this.config = objectMapper.readValue(bytes, FramemindConfig.class);
            log.info("Loaded config from {}", configPath);
        } catch (IOException e) {
            log.error("Failed to parse config file at {}: {}", configPath, e.getMessage());
            this.config = new FramemindConfig();
        }
    }

    /**
     * Saves current config to disk with restrictive permissions.
     */
    public synchronized void save() {
        Path configDir = configProperties.getConfigDir();
        Path configPath = configProperties.getConfigFilePath();
        try {
            if (!Files.exists(configDir)) {
                Files.createDirectories(configDir);
            }
            objectMapper.writeValue(configPath.toFile(), config);
            // Set owner read/write only (chmod 600) on POSIX systems
            try {
                Files.setPosixFilePermissions(configPath, PosixFilePermissions.fromString("rw-------"));
            } catch (UnsupportedOperationException e) {
                // Windows — skip POSIX permissions
                log.debug("POSIX file permissions not supported (likely Windows)");
            }
        } catch (IOException e) {
            log.error("Failed to save config to {}: {}", configPath, e.getMessage());
        }
    }

    // --- Provider config accessors ---

    public Map<String, ProviderEntry> getProviders() {
        return config.getProviders();
    }

    public ProviderEntry getProvider(String providerId) {
        return config.getProviders().get(providerId);
    }

    public void putProvider(String providerId, ProviderEntry entry) {
        config.getProviders().put(providerId, entry);
        save();
    }

    public void removeProvider(String providerId) {
        config.getProviders().remove(providerId);
        save();
    }

    // --- Tool config accessors ---

    public Map<String, ToolEntry> getTools() {
        return config.getTools();
    }

    public ToolEntry getTool(String toolId) {
        return config.getTools().get(toolId);
    }

    public void putTool(String toolId, ToolEntry entry) {
        config.getTools().put(toolId, entry);
        save();
    }

    public void removeTool(String toolId) {
        config.getTools().remove(toolId);
        save();
    }

    // --- MCP server config accessors ---

    public Map<String, McpServerEntry> getMcpServers() {
        return config.getMcpServers();
    }

    public McpServerEntry getMcpServer(String serverId) {
        return config.getMcpServers().get(serverId);
    }

    public void putMcpServer(String serverId, McpServerEntry entry) {
        config.getMcpServers().put(serverId, entry);
        save();
    }

    public void removeMcpServer(String serverId) {
        config.getMcpServers().remove(serverId);
        save();
    }

    // --- Default model accessors ---

    public DefaultModelEntry getDefaultModel() {
        return config.getDefaultModel();
    }

    public void setDefaultModel(DefaultModelEntry entry) {
        config.setDefaultModel(entry);
        save();
    }

    // --- Inner classes for config structure ---

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FramemindConfig {
        private int version = 1;
        private Map<String, ProviderEntry> providers = new LinkedHashMap<>();
        private Map<String, ToolEntry> tools = new LinkedHashMap<>();
        private Map<String, McpServerEntry> mcpServers = new LinkedHashMap<>();
        private DefaultModelEntry defaultModel = new DefaultModelEntry();
    }

    @Getter
    @Setter
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProviderEntry {
        private String apiKey;
        private String baseUrl;
        private List<String> models = new ArrayList<>();
        private String defaultModel;
        private String lastTested;
        private String lastTestResult;
        private String lastTestMessage;
    }

    @Getter
    @Setter
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ToolEntry {
        private String apiKey;
        private Map<String, String> parameters = new LinkedHashMap<>();
        private String lastTested;
        private String lastTestResult;
        private String lastTestMessage;
    }

    @Getter
    @Setter
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class McpServerEntry {
        private String name;
        private String url;
        private String authType;
        private String credentials;
        private String lastTested;
        private String lastTestResult;
        private String lastTestMessage;
    }

    @Getter
    @Setter
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DefaultModelEntry {
        private String provider;
        private String model;
    }
}
