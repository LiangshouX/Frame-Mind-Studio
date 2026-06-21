package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.po.ReviewReportPO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * 审查报告仓储接口，提供审查报告的数据库访问操作。
 */
@Repository
public interface ReviewReportRepository extends JpaRepository<ReviewReportPO, UUID> {

    /**
     * 根据项目 ID 查询所有审查报告，按创建时间降序排列。
     *
     * @param projectId 项目 ID
     * @return 审查报告列表
     */
    List<ReviewReportPO> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    /**
     * 根据项目 ID 和审查范围查询审查报告。
     *
     * @param projectId 项目 ID
     * @param scope     审查范围（full / episode）
     * @return 审查报告列表
     */
    List<ReviewReportPO> findByProjectIdAndScopeOrderByCreatedAtDesc(UUID projectId, String scope);
}
