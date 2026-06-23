package io.framemind.infrastructure.repository;

import io.framemind.infrastructure.po.AgentConfigOverridePO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Agent 配置覆盖数据访问接口。
 */
@Repository
public interface AgentConfigOverrideRepository extends JpaRepository<AgentConfigOverridePO, UUID> {

    /**
     * 查找指定项目的指定 Agent 配置覆盖。
     *
     * @param projectId 项目 ID
     * @param agentName Agent 名称
     * @return 配置覆盖（可能不存在）
     */
    Optional<AgentConfigOverridePO> findByProjectIdAndAgentName(UUID projectId, String agentName);

    /**
     * 删除指定项目的指定 Agent 配置覆盖。
     *
     * @param projectId 项目 ID
     * @param agentName Agent 名称
     */
    void deleteByProjectIdAndAgentName(UUID projectId, String agentName);
}
