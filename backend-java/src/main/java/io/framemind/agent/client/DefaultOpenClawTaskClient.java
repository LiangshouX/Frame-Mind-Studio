package io.framemind.agent.client;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.agent.hook.StreamingHook;
import io.framemind.core.config.OpenClawProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

/**
 * OpenClaw 任务客户端 Webhook 实现。
 * <p>
 * 通过 OpenClaw 内置 Webhooks 插件的 HTTP 端点创建和驱动 TaskFlow：
 * <ol>
 *   <li>{@code create_flow} — 创建受管 TaskFlow</li>
 *   <li>{@code run_task} — 在 Flow 中提交子任务</li>
 *   <li>轮询 {@code get_flow} — 等待任务完成</li>
 *   <li>{@code finish_flow} — 结束 Flow</li>
 * </ol>
 * <p>
 * 认证方式：{@code Authorization: Bearer {webhookSecret}}
 * <p>
 * 当 {@code framemind.openclaw.enabled=true}（默认）时激活。
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "framemind.openclaw.enabled", havingValue = "true", matchIfMissing = true)
public class DefaultOpenClawTaskClient implements OpenClawTaskClient {

    private final WebClient webClient;
    private final OpenClawProperties properties;
    private final StreamingHook streamingHook;

    public DefaultOpenClawTaskClient(OpenClawProperties properties,
                                     StreamingHook streamingHook) {
        this.properties = properties;
        this.streamingHook = streamingHook;
        this.webClient = WebClient.builder()
                .baseUrl(properties.getWebhookUrl())
                .defaultHeader("Authorization", "Bearer " + properties.getWebhookSecret())
                .build();
    }

    @Override
    public OpenClawTaskResponse submitTask(OpenClawTaskRequest request) {
        log.info("提交 OpenClaw Webhook 任务: taskId={}, session={}, taskType={}",
                request.taskId(), request.sessionId(), request.taskType());

        String flowId = null;
        try {
            // 1. 创建 TaskFlow
            WebhookResponse createResp = callWebhook(
                    WebhookAction.createFlow(request.prompt(), "queued"));
            if (!createResp.ok()) {
                throw new RuntimeException("创建 TaskFlow 失败: " + createResp.error());
            }
            // 提取 flowId（嵌套在 result.flow.flowId 中）
            flowId = extractNestedField(createResp.result(), "flow", "flowId");
            if (flowId == null || flowId.isBlank()) {
                flowId = extractField(createResp.result(), "flowId", "id");
            }
            if (flowId == null || flowId.isBlank()) {
                throw new RuntimeException("创建 TaskFlow 响应中缺少 flowId: " + createResp.result());
            }
            int revision = extractNestedInt(createResp.result(), "flow", "revision", 0);
            log.info("TaskFlow 已创建: flowId={}, revision={}, taskId={}", flowId, revision, request.taskId());

            // 2. 构建完整 prompt（含上下文）
            String fullPrompt = buildFullPrompt(request);

            // 3. 提交 run_task
            WebhookResponse runResp = callWebhook(
                    WebhookAction.runTask(flowId, fullPrompt, "subagent"));
            if (!runResp.ok()) {
                safeCancel(flowId);
                throw new RuntimeException("提交 run_task 失败: " + runResp.error());
            }
            log.info("Task 已提交: flowId={}, taskId={}", flowId, request.taskId());

            // 4. 恢复 Flow 以启动执行（需要 expectedRevision）
            WebhookResponse resumeResp = callWebhook(
                    WebhookAction.resumeFlow(flowId, revision));
            if (!resumeResp.ok()) {
                log.warn("resume_flow 失败（忽略）: {}", resumeResp.error());
            } else {
                log.info("TaskFlow 已恢复执行: flowId={}", flowId);
            }

            // 5. 轮询等待完成
            JsonNode flowResult = pollUntilDone(flowId, request.sessionId());

            // 6. 结束 Flow
            safeFinish(flowId);

            // 6. 提取结果
            String resultText = extractResultText(flowResult);
            JsonNode resultNode = flowResult != null && flowResult.has("result")
                    ? flowResult.get("result") : flowResult;

            log.info("OpenClaw 任务完成: taskId={}, flowId={}, resultLength={}",
                    request.taskId(), flowId, resultText != null ? resultText.length() : 0);

            return new OpenClawTaskResponse(
                    request.taskId(),
                    request.sessionId(),
                    "success",
                    resultNode,
                    null,   // usedSkills 暂不可用
                    null    // tokenUsage 暂不可用
            );

        } catch (Exception e) {
            log.error("OpenClaw Webhook 任务失败: taskId={}, flowId={}", request.taskId(), flowId, e);
            if (flowId != null) {
                safeCancel(flowId);
            }
            throw new RuntimeException("OpenClaw 任务提交异常: " + e.getMessage(), e);
        }
    }

    /**
     * 轮询 TaskFlow 状态直到完成。
     *
     * @param flowId    TaskFlow ID
     * @param sessionId 会话 ID（用于 WebSocket 推送）
     * @return 最终的 Flow 结果节点
     */
    private JsonNode pollUntilDone(String flowId, String sessionId) {
        int maxRetries = properties.getMaxPollRetries();
        long intervalMs = properties.getPollIntervalMs();
        int consecutiveErrors = 0;
        int maxConsecutiveErrors = 5;

        for (int i = 0; i < maxRetries; i++) {
            try {
                WebhookResponse resp = callWebhook(WebhookAction.getFlow(flowId));
                consecutiveErrors = 0; // 成功后重置

                if (!resp.ok()) {
                    log.warn("查询 TaskFlow 失败 (retry {}/{}): {}", i + 1, maxRetries, resp.error());
                    if ("not_found".equals(resp.code())) {
                        throw new RuntimeException("TaskFlow 不存在: " + flowId);
                    }
                } else {
                    JsonNode result = resp.result();
                    String status = extractStatus(result);

                    log.debug("TaskFlow 状态: flowId={}, status={}, attempt={}/{}",
                            flowId, status, i + 1, maxRetries);

                    if (isTerminalStatus(status)) {
                        if ("failed".equals(status) || "error".equals(status)) {
                            String errorMsg = extractNestedField(result, "flow", "error");
                            if (errorMsg == null) errorMsg = extractField(result, "error", "message");
                            throw new RuntimeException("TaskFlow 执行失败: "
                                    + (errorMsg != null ? errorMsg : status));
                        }
                        return result;
                    }

                    // 推送进度提示（每 15 次轮询一次，约 30 秒）
                    if (i > 0 && i % 15 == 0) {
                        streamingHook.onStreamChunk(sessionId, "processing",
                                "Agent 处理中…");
                    }
                }

                Thread.sleep(intervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("轮询被中断: flowId=" + flowId, e);
            } catch (RuntimeException e) {
                // 网络瞬时错误容忍（连接被重置等）
                consecutiveErrors++;
                log.warn("轮询网络错误 ({}/{}): {}", consecutiveErrors, maxConsecutiveErrors, e.getMessage());
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    throw e;
                }
                try { Thread.sleep(intervalMs); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("轮询被中断", ie);
                }
            }
        }

        throw new RuntimeException("TaskFlow 执行超时（" + maxRetries + " 次轮询）: flowId=" + flowId);
    }

    /**
     * 构建包含对话历史的完整 prompt。
     */
    private String buildFullPrompt(OpenClawTaskRequest request) {
        if (request.history() == null || request.history().isEmpty()) {
            return request.prompt();
        }

        StringBuilder sb = new StringBuilder();
        sb.append("## 对话历史\n\n");
        for (OpenClawTaskRequest.ChatMessage msg : request.history()) {
            String role = "user".equals(msg.role()) ? "用户" : "助手";
            sb.append("**").append(role).append("**：").append(msg.content()).append("\n\n");
        }
        sb.append("## 当前任务\n\n").append(request.prompt());
        return sb.toString();
    }

    /**
     * 发送 Webhook 请求。
     */
    private WebhookResponse callWebhook(WebhookAction action) {
        try {
            WebhookResponse response = webClient.post()
                    .uri("")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(action)
                    .retrieve()
                    .bodyToMono(WebhookResponse.class)
                    .timeout(Duration.ofMillis(properties.getRequestTimeoutMs()))
                    .block();

            if (response == null) {
                throw new IllegalStateException("OpenClaw Webhook 返回空响应");
            }
            return response;

        } catch (WebClientResponseException e) {
            log.error("Webhook HTTP 调用失败: action={}, status={}, body={}",
                    action.action(), e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new RuntimeException("Webhook 调用失败: " + e.getStatusCode(), e);
        }
    }

    @Override
    public boolean isHealthy() {
        try {
            // 使用 list_flows 作为连通性检查
            WebhookResponse resp = callWebhook(WebhookAction.listFlows());
            return resp.ok();
        } catch (Exception e) {
            log.debug("OpenClaw 健康检查失败: {}", e.getMessage());
            return false;
        }
    }

    // ─── 辅助方法 ─────────────────────────────────────────────────

    /**
     * 从 JsonNode 中按优先级提取字段值。
     */
    private String extractField(JsonNode node, String... fieldNames) {
        if (node == null) return null;
        for (String name : fieldNames) {
            if (node.has(name) && !node.get(name).isNull()) {
                return node.get(name).asText();
            }
        }
        return null;
    }

    /**
     * 从嵌套对象中提取字段值（如 result.flow.flowId）。
     */
    private String extractNestedField(JsonNode node, String parentKey, String childKey) {
        if (node == null) return null;
        JsonNode parent = node.get(parentKey);
        if (parent != null && parent.has(childKey) && !parent.get(childKey).isNull()) {
            return parent.get(childKey).asText();
        }
        return null;
    }

    /**
     * 从嵌套对象中提取整数字段值。
     */
    private int extractNestedInt(JsonNode node, String parentKey, String childKey, int defaultValue) {
        if (node == null) return defaultValue;
        JsonNode parent = node.get(parentKey);
        if (parent != null && parent.has(childKey) && parent.get(childKey).isNumber()) {
            return parent.get(childKey).asInt();
        }
        return defaultValue;
    }

    /**
     * 从 Flow 结果中提取状态字段。
     * <p>
     * OpenClaw Webhook 响应结构：{@code result.flow.status}
     */
    private String extractStatus(JsonNode result) {
        if (result == null) return "unknown";
        // result.flow.status（标准 Webhook 响应结构）
        JsonNode flow = result.get("flow");
        if (flow != null && flow.has("status")) {
            return flow.get("status").asText();
        }
        // 直接字段（兼容其他结构）
        if (result.has("status")) return result.get("status").asText();
        // 嵌套在 data 中
        if (result.has("data") && result.get("data").has("status")) {
            return result.get("data").get("status").asText();
        }
        return "unknown";
    }

    /**
     * 判断是否为终态。
     */
    private boolean isTerminalStatus(String status) {
        return "done".equals(status) || "finished".equals(status)
                || "completed".equals(status) || "failed".equals(status)
                || "error".equals(status) || "cancelled".equals(status);
    }

    /**
     * 从 Flow 结果中提取文本输出。
     */
    private String extractResultText(JsonNode flowResult) {
        if (flowResult == null) return null;

        // 尝试 result.output
        if (flowResult.has("result")) {
            JsonNode resultNode = flowResult.get("result");
            if (resultNode.isTextual()) return resultNode.asText();
            if (resultNode.has("output")) {
                JsonNode output = resultNode.get("output");
                return output.isTextual() ? output.asText() : output.toString();
            }
            if (resultNode.has("content")) {
                JsonNode content = resultNode.get("content");
                return content.isTextual() ? content.asText() : content.toString();
            }
            return resultNode.toString();
        }

        // 尝试 output
        if (flowResult.has("output")) {
            JsonNode output = flowResult.get("output");
            return output.isTextual() ? output.asText() : output.toString();
        }

        return flowResult.toString();
    }

    /**
     * 安全地结束 Flow（忽略异常）。
     */
    private void safeFinish(String flowId) {
        try {
            callWebhook(WebhookAction.finishFlow(flowId));
        } catch (Exception e) {
            log.warn("结束 TaskFlow 失败（忽略）: flowId={}", flowId, e);
        }
    }

    /**
     * 安全地取消 Flow（忽略异常）。
     */
    private void safeCancel(String flowId) {
        try {
            callWebhook(WebhookAction.cancelFlow(flowId));
        } catch (Exception e) {
            log.warn("取消 TaskFlow 失败（忽略）: flowId={}", flowId, e);
        }
    }
}
