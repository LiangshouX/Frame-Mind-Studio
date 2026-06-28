package io.framemind.agent.client;

/**
 * OpenClaw 任务客户端接口。
 * <p>
 * 提供向 OpenClaw 引擎提交任务和检查连通性的能力。
 * 通过 OpenClaw 内置 Webhooks 插件创建和驱动 TaskFlow。
 * <p>
 * 有两个实现：{@code DefaultOpenClawTaskClient}（Webhook HTTP 调用）
 * 和 {@code PlaceholderOpenClawTaskClient}（开发/测试桩）。
 */
public interface OpenClawTaskClient {

    /**
     * 提交任务到 OpenClaw 引擎（通过 Webhooks 插件）。
     * <p>
     * 内部流程：create_flow → run_task → 轮询 get_flow → finish_flow。
     * 同步等待最终结果返回。
     *
     * @param request 任务请求
     * @return 任务响应（包含结构化结果和 token 消耗）
     */
    OpenClawTaskResponse submitTask(OpenClawTaskRequest request);

    /**
     * 检查 OpenClaw 引擎连通性。
     *
     * @return 如果引擎可达返回 true
     */
    boolean isHealthy();
}
