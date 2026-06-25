package io.framemind.infrastructure.repository;

import io.framemind.infrastructure.po.AgentSessionPO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Agent 会话仓储接口，提供 Agent 会话实体的数据库访问操作。
 */
@Repository
public interface AgentSessionRepository extends JpaRepository<AgentSessionPO, UUID> {

    /**
     * 根据项目 ID 查询会话列表，按创建时间降序排列。
     *
     * @param projectId 项目 ID
     * @return 会话列表
     */
    List<AgentSessionPO> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    /**
     * 根据项目 ID 和工作流步骤查询会话列表，按创建时间降序排列。
     *
     * @param projectId    项目 ID
     * @param workflowStep 工作流步骤
     * @return 会话列表
     */
    List<AgentSessionPO> findByProjectIdAndWorkflowStepOrderByCreatedAtDesc(UUID projectId, String workflowStep);

    /**
     * 根据项目 ID 和工作流步骤分页查询会话列表，按创建时间降序排列。
     *
     * @param projectId    项目 ID
     * @param workflowStep 工作流步骤
     * @param pageable     分页参数
     * @return 分页会话列表
     */
    Page<AgentSessionPO> findByProjectIdAndWorkflowStepOrderByCreatedAtDesc(
            UUID projectId, String workflowStep, Pageable pageable);

    /**
     * 统计指定项目和工作流步骤的会话数量。
     *
     * @param projectId    项目 ID
     * @param workflowStep 工作流步骤
     * @return 会话数量
     */
    long countByProjectIdAndWorkflowStep(UUID projectId, String workflowStep);
}
