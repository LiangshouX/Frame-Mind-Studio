package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.po.OutlinePO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * 大纲仓储接口，提供大纲的数据库访问操作。
 */
@Repository
public interface OutlineRepository extends JpaRepository<OutlinePO, UUID> {

    /**
     * 根据项目 ID 查询关联的大纲。
     *
     * @param projectId 项目 ID
     * @return 大纲（可能为空）
     */
    Optional<OutlinePO> findByProjectId(UUID projectId);

    /**
     * 根据项目 ID 删除大纲。
     *
     * @param projectId 项目 ID
     */
    void deleteByProjectId(UUID projectId);
}
