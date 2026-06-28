package io.framemind.agent.client;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * OpenClaw Webhook 请求体。
 * <p>
 * 所有对 OpenClaw 的操作都通过 Webhook action 提交。
 * JSON 序列化时 action 字段与额外参数在同一层级（扁平结构），
 * 符合 OpenClaw Webhooks 插件的请求格式。
 * <p>
 * 示例序列化结果：
 * <pre>
 * { "action": "create_flow", "goal": "...", "status": "queued" }
 * </pre>
 *
 * @param action         操作类型
 * @param additionalFields 操作参数（不同 action 对应不同字段）
 */
public record WebhookAction(
        String action,
        @JsonAnySetter @JsonAnyGetter
        Map<String, Object> additionalFields
) {
    /**
     * 构建 create_flow 请求。
     *
     * @param goal   任务目标描述
     * @param status 初始状态（通常为 "queued"）
     */
    public static WebhookAction createFlow(String goal, String status) {
        return new WebhookAction("create_flow", Map.of(
                "goal", goal,
                "status", status != null ? status : "queued",
                "notifyPolicy", "done_only"
        ));
    }

    /**
     * 构建 run_task 请求。
     *
     * @param flowId  TaskFlow ID
     * @param task    任务描述（完整 prompt）
     * @param runtime 运行时类型（subagent / acp）
     */
    public static WebhookAction runTask(String flowId, String task, String runtime) {
        return new WebhookAction("run_task", Map.of(
                "flowId", flowId,
                "task", task,
                "runtime", runtime != null ? runtime : "subagent"
        ));
    }

    /**
     * 构建 get_flow 请求。
     */
    public static WebhookAction getFlow(String flowId) {
        return new WebhookAction("get_flow", Map.of("flowId", flowId));
    }

    /**
     * 构建 finish_flow 请求。
     */
    public static WebhookAction finishFlow(String flowId) {
        return new WebhookAction("finish_flow", Map.of("flowId", flowId));
    }

    /**
     * 构建 resume_flow 请求。
     *
     * @param flowId           TaskFlow ID
     * @param expectedRevision 期望的版本号（乐观锁）
     */
    public static WebhookAction resumeFlow(String flowId, int expectedRevision) {
        return new WebhookAction("resume_flow", Map.of(
                "flowId", flowId,
                "expectedRevision", expectedRevision
        ));
    }

    /**
     * 构建 cancel_flow 请求。
     */
    public static WebhookAction cancelFlow(String flowId) {
        return new WebhookAction("cancel_flow", Map.of("flowId", flowId));
    }

    /**
     * 构建 fail_flow 请求。
     */
    public static WebhookAction failFlow(String flowId) {
        return new WebhookAction("fail_flow", Map.of("flowId", flowId));
    }

    /**
     * 构建 get_task_summary 请求。
     */
    public static WebhookAction getTaskSummary(String flowId) {
        return new WebhookAction("get_task_summary", Map.of("flowId", flowId));
    }

    /**
     * 构建 list_flows 请求。
     */
    public static WebhookAction listFlows() {
        return new WebhookAction("list_flows", Map.of());
    }

    /**
     * 构建 find_latest_flow 请求。
     */
    public static WebhookAction findLatestFlow() {
        return new WebhookAction("find_latest_flow", Map.of());
    }

    /**
     * 构建 resolve_flow 请求。
     */
    public static WebhookAction resolveFlow(String flowId) {
        return new WebhookAction("resolve_flow", Map.of("flowId", flowId));
    }

    /**
     * 使用可变 Map 构建（用于需要动态添加参数的场景）。
     */
    public static WebhookAction of(String action, Map<String, Object> params) {
        return new WebhookAction(action, new LinkedHashMap<>(params));
    }
}
