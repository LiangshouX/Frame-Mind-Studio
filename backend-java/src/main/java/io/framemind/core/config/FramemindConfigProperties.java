package io.framemind.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuration properties for FrameMind's user config persistence.
 * <p>
 * The {@code framemind.config.path} property controls where user configuration
 * (API keys, model settings, tool configs) is persisted. Defaults to
 * {@code ~/.framemind}.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "framemind.config")
public class FramemindConfigProperties {

    /**
     * Path to the FrameMind configuration directory.
     * Defaults to {@code ~/.framemind}.
     */
    private String path = Paths.get(System.getProperty("user.home"), ".framemind").toString();

    /**
     * Returns the resolved config directory as a {@link Path}.
     */
    public Path getConfigDir() {
        return Paths.get(path);
    }

    /**
     * Returns the path to the config.json file.
     */
    public Path getConfigFilePath() {
        return getConfigDir().resolve("config.json");
    }
}
