package io.framemind.agent.orchestration;

import io.framemind.agent.client.OpenClawTaskRequest;
import io.framemind.infrastructure.po.AgentMessagePO;
import io.framemind.infrastructure.repository.AgentMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * 对话历史构建服务，负责从数据库中加载 Agent 消息并转换为 OpenClaw 任务请求所需的历史格式。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AgentMessageHistoryBuilder {

    private final AgentMessageRepository agentMessageRepository;

    /**
     * 构建指定会话的对话历史消息列表，用于 OpenClaw 任务请求。
     * <p>
     * 从数据库中查询该会话的全部消息（按 messageOrder 升序），截取最近 {@code maxRounds * 2} 条
     * （每轮包含一条 user 消息和一条 assistant 消息），过滤掉内容为 null 的消息后，
     * 转换为 {@link OpenClawTaskRequest.ChatMessage} 列表。
     *
     * @param sessionId 会话 ID
     * @param maxRounds 最大保留轮数（每轮 = user + assistant）
     * @return 对话历史消息列表，按消息顺序排列；若查询结果为空则返回空列表
     */
    public List<OpenClawTaskRequest.ChatMessage> buildHistory(UUID sessionId, int maxRounds) {
        List<AgentMessagePO> allMessages = agentMessageRepository
                .findBySessionIdOrderByMessageOrderAsc(sessionId);

        if (allMessages.isEmpty()) {
            log.debug("会话 {} 无历史消息，返回空列表", sessionId);
            return Collections.emptyList();
        }

        int maxMessages = maxRounds * 2;
        int startIndex = Math.max(0, allMessages.size() - maxMessages);
        List<AgentMessagePO> recentMessages = allMessages.subList(startIndex, allMessages.size());

        log.debug("会话 {} 共 {} 条消息，截取最近 {} 条用于构建历史", sessionId, allMessages.size(), recentMessages.size());

        return recentMessages.stream()
                .filter(msg -> msg.getContent() != null)
                .map(msg -> new OpenClawTaskRequest.ChatMessage(msg.getRole(), msg.getContent()))
                .toList();
    }
}
