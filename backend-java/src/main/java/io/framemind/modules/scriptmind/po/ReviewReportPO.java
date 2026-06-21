package io.framemind.modules.scriptmind.po;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.infrastructure.po.ProjectPO;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 审查报告持久化对象，对应 review_reports 表。
 */
@Entity
@Table(name = "review_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewReportPO {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectPO project;

    /** 审查范围：full / episode */
    @Column(nullable = false)
    private String scope;

    /** 审查的集数（scope=episode 时） */
    @Column(name = "episode_number")
    private Integer episodeNumber;

    /** 审查报告内容（JSONB） */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private JsonNode report = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
