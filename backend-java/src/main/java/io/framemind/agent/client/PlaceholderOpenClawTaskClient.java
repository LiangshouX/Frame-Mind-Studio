package io.framemind.agent.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * OpenClaw 任务客户端占位符实现，用于无 OpenClaw 环境时的开发和测试。
 * <p>
 * 当 {@code framemind.openclaw.enabled=false} 时激活。
 * 返回固定的模拟响应。
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "framemind.openclaw.enabled", havingValue = "false")
@RequiredArgsConstructor
public class PlaceholderOpenClawTaskClient implements OpenClawTaskClient {

    private final ObjectMapper objectMapper;

    @Override
    public OpenClawTaskResponse submitTask(OpenClawTaskRequest request) {
        log.info("[Placeholder] 模拟 OpenClaw 任务: taskId={}, taskType={}",
                request.taskId(), request.taskType());

        // 模拟处理延迟
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        ObjectNode result = objectMapper.createObjectNode();
        result.put("message", String.format("Placeholder 响应: %s 任务已处理", request.taskType()));
        result.put("task_type", request.taskType());

        return new OpenClawTaskResponse(
                request.taskId(),
                request.sessionId(),
                "success",
                result,
                List.of("placeholder_skill"),
                new OpenClawTaskResponse.TokenUsage(100, 200, 300)
        );
    }

    @Override
    public boolean isHealthy() {
        return true;
    }
}
