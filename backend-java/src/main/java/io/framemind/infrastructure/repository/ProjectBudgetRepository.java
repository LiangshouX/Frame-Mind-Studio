package io.framemind.infrastructure.repository;

import io.framemind.infrastructure.po.ProjectBudgetPO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * 项目预算仓储接口，提供项目预算实体的数据库访问操作。
 */
@Repository
public interface ProjectBudgetRepository extends JpaRepository<ProjectBudgetPO, UUID> {

    /**
     * 根据项目 ID 查询项目预算信息。
     *
     * @param projectId 项目 ID
     * @return 项目预算（可能为空）
     */
    Optional<ProjectBudgetPO> findByProjectId(UUID projectId);
}
