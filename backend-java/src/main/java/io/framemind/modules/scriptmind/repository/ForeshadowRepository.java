package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.po.ForeshadowPO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * 伏笔仓储接口，提供伏笔实体的数据库访问操作。
 */
@Repository
public interface ForeshadowRepository extends JpaRepository<ForeshadowPO, UUID> {

    /**
     * 根据项目 ID 查询伏笔列表，按创建时间降序排列。
     *
     * @param projectId 项目 ID
     * @return 伏笔列表
     */
    List<ForeshadowPO> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    /**
     * 根据项目 ID 和状态查询伏笔列表，按创建时间降序排列。
     *
     * @param projectId 项目 ID
     * @param status    伏笔状态
     * @return 伏笔列表
     */
    List<ForeshadowPO> findByProjectIdAndStatusOrderByCreatedAtDesc(UUID projectId, String status);

    /**
     * 统计指定项目和状态下的伏笔数量。
     *
     * @param projectId 项目 ID
     * @param status    伏笔状态
     * @return 伏笔数量
     */
    long countByProjectIdAndStatus(UUID projectId, String status);
}
