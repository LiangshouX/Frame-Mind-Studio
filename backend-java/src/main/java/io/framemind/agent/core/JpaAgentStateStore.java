package io.framemind.agent.core;

import io.agentscope.core.message.ContentBlock;
import io.agentscope.core.message.Msg;
import io.agentscope.core.message.MsgRole;
import io.agentscope.core.message.TextBlock;
import io.agentscope.core.message.ThinkingBlock;
import io.agentscope.core.message.ToolResultBlock;
import io.agentscope.core.message.ToolUseBlock;
import io.agentscope.core.state.AgentState;
import io.agentscope.core.state.AgentStateStore;
import io.agentscope.core.state.State;
import io.framemind.infrastructure.po.AgentMessagePO;
import io.framemind.infrastructure.po.AgentSessionPO;
import io.framemind.infrastructure.repository.AgentMessageRepository;
import io.framemind.infrastructure.repository.AgentSessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 基于 JPA 的 Agent 状态持久化实现。
 */
@Slf4j
@Component
public class JpaAgentStateStore implements AgentStateStore {

    private final AgentSessionRepository sessionRepository;
    private final AgentMessageRepository messageRepository;

    public JpaAgentStateStore(AgentSessionRepository sessionRepository,
                              AgentMessageRepository messageRepository) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
    }

    @Override
    public void save(String userId, String sessionId, String key, State value) {
        if (!(value instanceof AgentState agentState)) {
            log.warn("JpaAgentStateStore 仅支持 AgentState 类型，忽略: {}", value.getClass().getSimpleName());
            return;
        }

        UUID sessionUuid = parseUuid(sessionId);
        if (sessionUuid == null) return;

        // 清除该会话的旧消息
        messageRepository.deleteBySessionId(sessionUuid);

        // 将 AgentState.context (List<Msg>) 逐条保存
        List<Msg> context = agentState.getContext();
        if (context == null || context.isEmpty()) return;

        Optional<AgentSessionPO> sessionOpt = sessionRepository.findById(sessionUuid);
        if (sessionOpt.isEmpty()) {
            log.warn("会话不存在: {}", sessionId);
            return;
        }

        AgentSessionPO session = sessionOpt.get();
        List<AgentMessagePO> messages = new ArrayList<>();
        for (int i = 0; i < context.size(); i++) {
            Msg msg = context.get(i);
            AgentMessagePO po = new AgentMessagePO();
            po.setSession(session);
            po.setAgentName(session.getAgentName() != null ? session.getAgentName() : "unknown");
            po.setRole(msg.getRole() != null ? msg.getRole().name().toLowerCase() : "assistant");
            po.setContent(msg.getTextContent() != null ? msg.getTextContent() : "");
            po.setMessageOrder(i + 1);
            po.setMessageType(resolveMessageType(msg));
            messages.add(po);
        }

        messageRepository.saveAll(messages);
        log.debug("保存 AgentState: sessionId={}, 消息数={}", sessionId, messages.size());
    }

    @Override
    public void save(String userId, String sessionId, String key, List<? extends State> values) {
        for (State value : values) {
            save(userId, sessionId, key, value);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T extends State> Optional<T> get(String userId, String sessionId, String key, Class<T> type) {
        if (type != AgentState.class) {
            return Optional.empty();
        }

        UUID sessionUuid = parseUuid(sessionId);
        if (sessionUuid == null) return Optional.empty();

        List<AgentMessagePO> messages = messageRepository.findBySessionIdOrderByMessageOrderAsc(sessionUuid);
        if (messages.isEmpty()) {
            return Optional.empty();
        }

        List<Msg> context = messages.stream()
                .map(this::toMsg)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        AgentState state = AgentState.builder()
                .sessionId(sessionId)
                .userId(userId)
                .context(context)
                .build();

        return Optional.of((T) state);
    }

    @Override
    public <T extends State> List<T> getList(String userId, String sessionId, String key, Class<T> itemType) {
        Optional<T> single = get(userId, sessionId, key, itemType);
        return single.map(List::of).orElse(List.of());
    }

    @Override
    public boolean exists(String userId, String sessionId) {
        UUID sessionUuid = parseUuid(sessionId);
        if (sessionUuid == null) return false;
        return !messageRepository.findBySessionIdOrderByMessageOrderAsc(sessionUuid).isEmpty();
    }

    @Override
    public void delete(String userId, String sessionId) {
        UUID sessionUuid = parseUuid(sessionId);
        if (sessionUuid == null) return;
        messageRepository.deleteBySessionId(sessionUuid);
    }

    @Override
    public Set<String> listSessionIds(String userId) {
        return sessionRepository.findAll().stream()
                .map(s -> s.getId().toString())
                .collect(Collectors.toSet());
    }

    // ─── 内部辅助方法 ────────────────────────────────────────────

    private String resolveMessageType(Msg msg) {
        List<ContentBlock> content = msg.getContent();
        if (content != null && !content.isEmpty()) {
            ContentBlock first = content.get(0);
            if (first instanceof ThinkingBlock) return "thinking";
            if (first instanceof ToolUseBlock) return "tool_call";
            if (first instanceof ToolResultBlock) return "tool_result";
        }
        return "text";
    }

    private Msg toMsg(AgentMessagePO po) {
        try {
            String roleStr = po.getRole();
            MsgRole role = MsgRole.valueOf(roleStr.toUpperCase());
            return Msg.builder()
                    .name(role == MsgRole.USER ? "user" : "assistant")
                    .role(role)
                    .content(TextBlock.builder().text(po.getContent() != null ? po.getContent() : "").build())
                    .build();
        } catch (Exception e) {
            log.warn("反序列化消息失败: id={}, error={}", po.getId(), e.getMessage());
            return null;
        }
    }

    private UUID parseUuid(String sessionId) {
        try {
            return UUID.fromString(sessionId);
        } catch (IllegalArgumentException e) {
            log.warn("无效的 sessionId 格式: {}", sessionId);
            return null;
        }
    }
}
