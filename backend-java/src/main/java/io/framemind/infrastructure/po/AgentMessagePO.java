package io.framemind.infrastructure.po;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Agent 消息持久化对象，对应 agent_messages 表。
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "agent_messages")
public class AgentMessagePO {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AgentSessionPO session;

    @Column(name = "session_id", insertable = false, updatable = false)
    private UUID sessionId;

    @Column(name = "agent_name", nullable = false, columnDefinition = "varchar(50)")
    private String agentName;

    @Column(nullable = false, columnDefinition = "varchar(20)")
    private String role;

    @Column(columnDefinition = "text")
    private String content;

    @Column(name = "message_order", nullable = false)
    private int messageOrder;

    /** 消息类型：text/tool_call/tool_result/thinking/skill */
    @Column(name = "message_type", columnDefinition = "varchar(20) default 'text'")
    private String messageType = "text";

    /** 元数据（工具名称、思考内容等） */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private JsonNode metadata;

    /** OpenClaw 任务 ID（V7 迁移新增） */
    @Column(name = "task_id", columnDefinition = "varchar(100)")
    private String taskId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
