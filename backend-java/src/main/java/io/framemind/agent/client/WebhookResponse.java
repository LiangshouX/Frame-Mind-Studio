package io.framemind.agent.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * OpenClaw Webhook 响应体。
 * <p>
 * 成功时：{@code { "ok": true, "routeId": "platform", "result": { ... } }}
 * <p>
 * 失败时：{@code { "ok": false, "routeId": "platform", "code": "not_found", "error": "...", "result": {} }}
 *
 * @param ok      是否成功
 * @param routeId 路由 ID
 * @param code    错误码（失败时）
 * @param error   错误描述（失败时）
 * @param result  返回数据（具体结构取决于 action 类型）
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WebhookResponse(
        boolean ok,
        String routeId,
        String code,
        String error,
        JsonNode result
) {}
