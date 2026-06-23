package io.framemind.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.framemind.infrastructure.po.AgentConfigOverridePO;
import io.framemind.infrastructure.repository.AgentConfigOverrideRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Agent 配置服务，提供两层配置合并：全局文件系统配置 + 项目级数据库覆盖。
 * <p>
 * 全局配置存储在 {@code ~/.framemind/agents/{agent-name}.json}，
 * 项目级覆盖存储在 {@code agent_config_overrides} 表。
 * 合并时项目级配置优先。
 */
@Slf4j
@Service
public class AgentConfigService {

    private final AgentConfigOverrideRepository overrideRepository;
    private final ConfigFileStore configFileStore;
    private final ObjectMapper objectMapper;

    /** 全局配置文件的最后修改时间缓存，用于热重载检测 */
    private final Map<String, Long> globalConfigLastModified = new ConcurrentHashMap<>();

    /** 全局配置缓存 */
    private final Map<String, JsonNode> globalConfigCache = new ConcurrentHashMap<>();

    /** 文件系统轮询调度器 */
    private ScheduledExecutorService scheduler;

    public AgentConfigService(AgentConfigOverrideRepository overrideRepository,
                              ConfigFileStore configFileStore,
                              ObjectMapper objectMapper) {
        this.overrideRepository = overrideRepository;
        this.configFileStore = configFileStore;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        // 启动文件系统监控
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "agent-config-watcher");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleAtFixedRate(this::watchGlobalConfig, 10, 10, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void destroy() {
        if (scheduler != null) {
            scheduler.shutdown();
        }
    }

    /**
     * 加载合并后的 Agent 配置（全局 + 项目覆盖）。
     *
     * @param projectId 项目 ID
     * @param agentName Agent 名称
     * @return 合并后的配置
     */
    public MergedAgentConfig loadConfig(UUID projectId, String agentName) {
        // 1. 加载全局配置
        JsonNode globalConfig = loadGlobalConfig(agentName);

        // 2. 加载项目覆盖
        Optional<AgentConfigOverridePO> overrideOpt =
                overrideRepository.findByProjectIdAndAgentName(projectId, agentName);

        if (overrideOpt.isEmpty()) {
            // 没有覆盖，直接使用全局配置
            return fromJsonNode(agentName, globalConfig, false, 1);
        }

        // 3. 深度合并（项目覆盖优先）
        JsonNode projectConfig = overrideOpt.get().getConfig();
        JsonNode merged = deepMerge(globalConfig, projectConfig);

        return fromJsonNode(agentName, merged, true, overrideOpt.get().getVersion());
    }

    /**
     * 保存项目级 Agent 配置覆盖。
     *
     * @param projectId 项目 ID
     * @param agentName Agent 名称
     * @param config    覆盖配置
     * @return 保存后的版本号
     */
    @Transactional
    public int saveProjectOverride(UUID projectId, String agentName, JsonNode config) {
        Optional<AgentConfigOverridePO> existingOpt =
                overrideRepository.findByProjectIdAndAgentName(projectId, agentName);

        AgentConfigOverridePO po;
        if (existingOpt.isPresent()) {
            po = existingOpt.get();
            po.setConfig(config);
        } else {
            po = new AgentConfigOverridePO();
            // 设置 project 关联
            io.framemind.infrastructure.po.ProjectPO project = new io.framemind.infrastructure.po.ProjectPO();
            project.setId(projectId);
            po.setProject(project);
            po.setAgentName(agentName);
            po.setConfig(config);
        }

        po = overrideRepository.save(po);
        log.info("保存 Agent 配置覆盖: projectId={}, agentName={}, version={}", projectId, agentName, po.getVersion());
        return po.getVersion();
    }

    /**
     * 删除项目级 Agent 配置覆盖（恢复为全局默认）。
     *
     * @param projectId 项目 ID
     * @param agentName Agent 名称
     */
    @Transactional
    public void deleteProjectOverride(UUID projectId, String agentName) {
        overrideRepository.deleteByProjectIdAndAgentName(projectId, agentName);
        log.info("删除 Agent 配置覆盖: projectId={}, agentName={}", projectId, agentName);
    }

    // ─── 全局配置加载 ────────────────────────────────────────────

    private JsonNode loadGlobalConfig(String agentName) {
        return globalConfigCache.computeIfAbsent(agentName, name -> {
            Path configPath = getGlobalConfigPath(name);
            if (!Files.exists(configPath)) {
                return objectMapper.createObjectNode();
            }
            try {
                return objectMapper.readTree(Files.readAllBytes(configPath));
            } catch (IOException e) {
                log.warn("读取全局 Agent 配置失败: {}", configPath, e);
                return objectMapper.createObjectNode();
            }
        });
    }

    private Path getGlobalConfigPath(String agentName) {
        String userHome = System.getProperty("user.home");
        return Path.of(userHome, ".framemind", "agents", agentName + ".json");
    }

    /**
     * 轮询检查全局配置文件变化，实现热重载。
     */
    private void watchGlobalConfig() {
        try {
            for (Map.Entry<String, Long> entry : globalConfigLastModified.entrySet()) {
                String agentName = entry.getKey();
                Path configPath = getGlobalConfigPath(agentName);
                if (Files.exists(configPath)) {
                    long lastModified = Files.getLastModifiedTime(configPath).toMillis();
                    if (lastModified > entry.getValue()) {
                        log.info("检测到全局 Agent 配置变化，重新加载: {}", agentName);
                        globalConfigCache.remove(agentName);
                        globalConfigLastModified.put(agentName, lastModified);
                    }
                }
            }

            // 扫描新配置文件
            Path agentsDir = Path.of(System.getProperty("user.home"), ".framemind", "agents");
            if (Files.isDirectory(agentsDir)) {
                Files.list(agentsDir)
                        .filter(p -> p.toString().endsWith(".json"))
                        .forEach(p -> {
                            String name = p.getFileName().toString().replace(".json", "");
                            globalConfigLastModified.computeIfAbsent(name, n -> {
                                try {
                                    return Files.getLastModifiedTime(p).toMillis();
                                } catch (IOException e) {
                                    return 0L;
                                }
                            });
                        });
            }
        } catch (Exception e) {
            log.debug("监控全局 Agent 配置变化时出错", e);
        }
    }

    // ─── 合并逻辑 ────────────────────────────────────────────────

    private JsonNode deepMerge(JsonNode base, JsonNode override) {
        if (base == null || base.isNull()) return override;
        if (override == null || override.isNull()) return base;
        if (!base.isObject() || !override.isObject()) return override;

        ObjectNode result = base.deepCopy();
        override.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            JsonNode value = entry.getValue();
            if (result.has(key) && result.get(key).isObject() && value.isObject()) {
                result.set(key, deepMerge(result.get(key), value));
            } else {
                result.set(key, value);
            }
        });
        return result;
    }

    private MergedAgentConfig fromJsonNode(String agentName, JsonNode config,
                                           boolean isProjectOverride, int version) {
        return new MergedAgentConfig(
                agentName,
                config.has("system_prompt") ? config.get("system_prompt").asText() : null,
                config.has("skills") ? config.get("skills") : null,
                config.has("rules") ? config.get("rules") : null,
                config.has("model_override") ? config.get("model_override").asText(null) : null,
                isProjectOverride,
                version
        );
    }

    /**
     * 合并后的 Agent 配置。
     */
    public record MergedAgentConfig(
            String agentName,
            String systemPrompt,
            JsonNode skills,
            JsonNode rules,
            String modelOverride,
            boolean isProjectOverride,
            int version
    ) {}
}
