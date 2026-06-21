package io.framemind.infrastructure.po;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 项目预算持久化对象，对应 project_budgets 表。
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "project_budgets")
public class ProjectBudgetPO {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", referencedColumnName = "id", unique = true, nullable = false)
    private ProjectPO project;

    @Column(name = "project_id", insertable = false, updatable = false)
    private UUID projectId;

    @Column(name = "token_limit", columnDefinition = "bigint default 1000000")
    private long tokenLimit = 1_000_000L;

    @Column(name = "tokens_used", columnDefinition = "bigint default 0")
    private long tokensUsed = 0L;

    @Column(name = "warning_threshold", columnDefinition = "numeric(3,2) default 0.80")
    private BigDecimal warningThreshold = new BigDecimal("0.80");

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
