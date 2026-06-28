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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OpenClaw 任务追踪持久化对象。
 * <p>
 * 记录每次 Java → OpenClaw 的任务调用信息，用于调试、审计和重试。
 */
@Entity
@Table(name = "openclaw_tasks")
@Getter
@Setter
public class OpenClawTaskPO {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AgentSessionPO session;

    @Column(name = "task_id", nullable = false, unique = true)
    private String taskId;

    @Column(name = "task_type", nullable = false)
    private String taskType;

    @Column(name = "agent_name")
    private String agentName;

    @Column(name = "status", nullable = false)
    private String status = "pending";

    @Column(name = "request_payload", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode requestPayload;

    @Column(name = "response_payload", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode responsePayload;

    @Column(name = "token_usage", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode tokenUsage;

    @Column(name = "used_skills", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode usedSkills;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
