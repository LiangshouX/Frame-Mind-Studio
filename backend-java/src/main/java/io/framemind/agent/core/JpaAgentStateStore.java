package io.framemind.agent.core;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import java.util.Map;
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
    private final ObjectMapper objectMapper;

    public JpaAgentStateStore(AgentSessionRepository sessionRepository,
                              AgentMessageRepository messageRepository,
                              ObjectMapper objectMapper) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.objectMapper = objectMapper;
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

            // 将完整 content blocks 序列化到 metadata
            List<ContentBlock> contentBlocks = msg.getContent();
            if (contentBlocks != null && !contentBlocks.isEmpty()) {
                try {
                    ObjectNode metadata = serializeContentBlocks(contentBlocks);
                    po.setMetadata(metadata);
                } catch (Exception e) {
                    log.warn("序列化 content blocks 失败: msgIndex={}", i, e);
                }
            }

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

    /**
     * 解析消息类型。检查所有 content blocks，支持多 block 消息。
     */
    private String resolveMessageType(Msg msg) {
        List<ContentBlock> content = msg.getContent();
        if (content == null || content.isEmpty()) return "text";

        // 如果只有一个 block，直接返回其类型
        if (content.size() == 1) {
            ContentBlock block = content.get(0);
            if (block instanceof ThinkingBlock) return "thinking";
            if (block instanceof ToolUseBlock) return "tool_call";
            if (block instanceof ToolResultBlock) return "tool_result";
            return "text";
        }

        // 多个 block 时，检查是否全部是同一类型
        boolean allThinking = content.stream().allMatch(b -> b instanceof ThinkingBlock);
        boolean allToolCall = content.stream().allMatch(b -> b instanceof ToolUseBlock);
        boolean allToolResult = content.stream().allMatch(b -> b instanceof ToolResultBlock);

        if (allThinking) return "thinking";
        if (allToolCall) return "tool_call";
        if (allToolResult) return "tool_result";

        // 混合类型，以 text 为主类型，具体 block 信息存储在 metadata 中
        return "text";
    }

    /**
     * 将 content blocks 序列化为 JSON 存入 metadata。
     */
    private ObjectNode serializeContentBlocks(List<ContentBlock> blocks) throws JsonProcessingException {
        ObjectNode metadata = objectMapper.createObjectNode();
        ArrayNode blocksArray = metadata.putArray("blocks");

        for (ContentBlock block : blocks) {
            ObjectNode blockNode = objectMapper.createObjectNode();
            if (block instanceof TextBlock textBlock) {
                blockNode.put("type", "text");
                blockNode.put("text", textBlock.getText());
            } else if (block instanceof ThinkingBlock thinkingBlock) {
                blockNode.put("type", "thinking");
                blockNode.put("thinking", thinkingBlock.getThinking());
            } else if (block instanceof ToolUseBlock toolUseBlock) {
                blockNode.put("type", "tool_use");
                blockNode.put("id", toolUseBlock.getId());
                blockNode.put("name", toolUseBlock.getName());
                if (toolUseBlock.getInput() != null) {
                    blockNode.set("input", objectMapper.valueToTree(toolUseBlock.getInput()));
                }
            } else if (block instanceof ToolResultBlock toolResultBlock) {
                blockNode.put("type", "tool_result");
                blockNode.put("id", toolResultBlock.getId() != null ? toolResultBlock.getId() : "");
                blockNode.put("name", toolResultBlock.getName() != null ? toolResultBlock.getName() : "");
                // 序列化 output (List<ContentBlock>) 为 JSON 数组
                List<ContentBlock> output = toolResultBlock.getOutput();
                if (output != null && !output.isEmpty()) {
                    ArrayNode outputArray = blockNode.putArray("output");
                    for (ContentBlock outBlock : output) {
                        if (outBlock instanceof TextBlock tb) {
                            ObjectNode outNode = objectMapper.createObjectNode();
                            outNode.put("type", "text");
                            outNode.put("text", tb.getText());
                            outputArray.add(outNode);
                        }
                    }
                }
            }
            blocksArray.add(blockNode);
        }

        return metadata;
    }

    /**
     * 从 metadata JSON 反序列化 content blocks。
     */
    private List<ContentBlock> deserializeContentBlocks(JsonNode metadata) {
        if (metadata == null || !metadata.has("blocks")) {
            return null;
        }

        try {
            JsonNode blocksArray = metadata.get("blocks");
            if (!blocksArray.isArray()) return null;

            List<ContentBlock> blocks = new ArrayList<>();
            for (JsonNode blockNode : blocksArray) {
                String type = blockNode.get("type").asText();
                switch (type) {
                    case "text" -> blocks.add(TextBlock.builder()
                            .text(blockNode.get("text").asText(""))
                            .build());
                    case "thinking" -> blocks.add(ThinkingBlock.builder()
                            .thinking(blockNode.get("thinking").asText(""))
                            .build());
                    case "tool_use" -> {
                        String id = blockNode.has("id") ? blockNode.get("id").asText() : null;
                        String name = blockNode.has("name") ? blockNode.get("name").asText() : "unknown";
                        @SuppressWarnings("unchecked")
                        Map<String, Object> input = blockNode.has("input") && !blockNode.get("input").isNull()
                                ? objectMapper.convertValue(blockNode.get("input"), Map.class)
                                : null;
                        blocks.add(ToolUseBlock.builder()
                                .id(id)
                                .name(name)
                                .input(input)
                                .build());
                    }
                    case "tool_result" -> {
                        String id = blockNode.has("id") ? blockNode.get("id").asText() : null;
                        String name = blockNode.has("name") ? blockNode.get("name").asText() : "";
                        // 从 output 数组重建 ContentBlock 列表
                        List<ContentBlock> outputBlocks = new ArrayList<>();
                        if (blockNode.has("output") && blockNode.get("output").isArray()) {
                            for (JsonNode outNode : blockNode.get("output")) {
                                if ("text".equals(outNode.get("type").asText())) {
                                    outputBlocks.add(TextBlock.builder()
                                            .text(outNode.get("text").asText(""))
                                            .build());
                                }
                            }
                        }
                        if (outputBlocks.isEmpty()) {
                            // 兼容旧格式：从 content 字段构建
                            String content = blockNode.has("content") ? blockNode.get("content").asText("") : "";
                            outputBlocks.add(TextBlock.builder().text(content).build());
                        }
                        blocks.add(ToolResultBlock.builder()
                                .id(id)
                                .name(name)
                                .output(outputBlocks)
                                .build());
                    }
                    default -> blocks.add(TextBlock.builder()
                            .text(blockNode.toString())
                            .build());
                }
            }
            return blocks;
        } catch (Exception e) {
            log.warn("反序列化 content blocks 失败", e);
            return null;
        }
    }

    private Msg toMsg(AgentMessagePO po) {
        try {
            String roleStr = po.getRole();
            MsgRole role = MsgRole.valueOf(roleStr.toUpperCase());

            // 尝试从 metadata 反序列化原始 content blocks
            List<ContentBlock> contentBlocks = null;
            if (po.getMetadata() != null && po.getMetadata().has("blocks")) {
                contentBlocks = deserializeContentBlocks(po.getMetadata());
            }

            // 如果没有 metadata 或反序列化失败，回退到 TextBlock
            if (contentBlocks == null || contentBlocks.isEmpty()) {
                contentBlocks = List.of(
                        TextBlock.builder().text(po.getContent() != null ? po.getContent() : "").build()
                );
            }

            return Msg.builder()
                    .name(role == MsgRole.USER ? "user" : "assistant")
                    .role(role)
                    .content(contentBlocks)
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
