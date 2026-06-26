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
 * Agent 会话持久化对象，对应 agent_sessions 表。
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "agent_sessions")
public class AgentSessionPO {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectPO project;

    @Column(name = "project_id", insertable = false, updatable = false)
    private UUID projectId;

    @Column(name = "session_type", nullable = false, columnDefinition = "varchar(50)")
    private String sessionType;

    @Column(nullable = false, columnDefinition = "varchar(20) default 'pending'")
    private String status = "pending";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_data", columnDefinition = "jsonb")
    private JsonNode inputData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "output_data", columnDefinition = "jsonb")
    private JsonNode outputData;

    @Column(name = "tokens_consumed", columnDefinition = "integer default 0")
    private int tokensConsumed = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /** 工作流步骤：worldview/synopsis/characters/outline/script */
    @Column(name = "workflow_step", columnDefinition = "varchar(50)")
    private String workflowStep;

    /** Agent 名称：creative_agent/synopsis_agent/character_agent/outline_agent/script_agent */
    @Column(name = "agent_name", columnDefinition = "varchar(50)")
    private String agentName;

    /** 会话标题（自动生成或用户编辑） */
    @Column(name = "title", columnDefinition = "varchar(200)")
    private String title;

    /** 标题来源：auto（自动生成）或 manual（用户手动编辑） */
    @Column(name = "title_source", columnDefinition = "varchar(20) default 'auto'")
    private String titleSource = "auto";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
