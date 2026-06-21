package io.framemind.infrastructure.po;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 项目持久化对象，对应 projects 表。
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "projects")
public class ProjectPO {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> genre;

    @Column(columnDefinition = "varchar(50) default 'short_drama'")
    private String format = "short_drama";

    @Column(columnDefinition = "text")
    private String logline;

    @Column(columnDefinition = "text")
    private String description;

    @Column(columnDefinition = "varchar(20) default 'draft'")
    private String status = "draft";

    @Column(name = "target_episodes", columnDefinition = "integer default 20")
    private int targetEpisodes = 20;

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
