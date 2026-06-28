package io.framemind.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * OpenClaw 引擎连接配置属性（Webhook 模式）。
 * <p>
 * 通过 {@code framemind.openclaw.*} 前缀在 application.yml 或环境变量中配置。
 * <p>
 * Java 端通过 OpenClaw 内置 Webhooks 插件发起任务请求：
 * <pre>
 * POST {gatewayUrl}/plugins/webhooks/{webhookRouteId}
 * Authorization: Bearer {webhookSecret}
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "framemind.openclaw")
@Getter
@Setter
public class OpenClawProperties {

    /** OpenClaw Gateway 访问地址（如 http://localhost:18080） */
    private String gatewayUrl = "http://localhost:18080";

    /** Webhook 路由 ID（对应 OpenClaw routes 中的 key） */
    private String webhookRouteId = "platform";

    /** Webhook 认证密钥 */
    private String webhookSecret = "changeme";

    /** 是否启用 OpenClaw（false 时回退到 Placeholder） */
    private boolean enabled = true;

    /** 请求超时（毫秒） */
    private int requestTimeoutMs = 120_000;

    /** 连接超时（毫秒） */
    private int connectTimeoutMs = 10_000;

    /** TaskFlow 轮询间隔（毫秒） */
    private int pollIntervalMs = 2_000;

    /** TaskFlow 最大轮询次数 */
    private int maxPollRetries = 120;

    /**
     * 拼装 Webhook 端点完整 URL。
     * <p>
     * 格式：{@code {gatewayUrl}/plugins/webhooks/{webhookRouteId}}
     */
    public String getWebhookUrl() {
        return gatewayUrl + "/plugins/webhooks/" + webhookRouteId;
    }
}
