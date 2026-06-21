package io.framemind.modules.scriptmind.po;

import io.framemind.infrastructure.po.ProjectPO;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 伏笔持久化对象，对应 foreshadows 表。
 */
@Entity
@Table(
    name = "foreshadows",
    indexes = @Index(name = "idx_foreshadows_project_status", columnList = "project_id, status")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForeshadowPO {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectPO project;

    @Column(columnDefinition = "text", nullable = false)
    private String plant;

    @Column(columnDefinition = "text")
    private String payoff;

    @Column(name = "episode_hint")
    private Integer episodeHint;

    @Column(nullable = false)
    @Builder.Default
    private String status = "planted";

    @Column(nullable = false)
    @Builder.Default
    private String urgency = "medium";

    @Column(name = "character_id")
    private String characterId;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
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
