package io.framemind.modules.scriptmind.po;

import com.fasterxml.jackson.databind.JsonNode;
import io.framemind.infrastructure.po.ProjectPO;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 角色持久化对象，对应 characters 表。
 */
@Entity
@Table(
    name = "characters",
    uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "name"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CharacterPO {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectPO project;

    @Column(nullable = false)
    private String name;

    /** 性别 */
    @Column(name = "gender", columnDefinition = "varchar(20)")
    private String gender;

    @Column(nullable = false)
    @Builder.Default
    private String role = "supporting";

    /** 身份定位 */
    @Column(name = "identity", columnDefinition = "varchar(255)")
    private String identity;

    /** 人设特征与记忆点（短剧专用） */
    @Column(name = "persona", columnDefinition = "text")
    private String persona;

    @Column(columnDefinition = "text")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private JsonNode personality = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.arrayNode();

    @Column(columnDefinition = "text")
    private String appearance;

    @Column(columnDefinition = "text")
    private String background;

    @Column(columnDefinition = "text")
    private String goals;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private JsonNode relationships = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.arrayNode();

    @Column(name = "dialogue_style", columnDefinition = "text")
    private String dialogueStyle;

    @Column(columnDefinition = "text")
    private String arc;

    /** 人物概述/小传 */
    @Column(name = "overview", columnDefinition = "text")
    private String overview;

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
