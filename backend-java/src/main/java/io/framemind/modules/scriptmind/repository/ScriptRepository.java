package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.po.ScriptPO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * 剧本仓储接口，提供剧本实体的数据库访问操作。
 */
@Repository
public interface ScriptRepository extends JpaRepository<ScriptPO, UUID> {

    /**
     * 根据项目 ID 查询关联的剧本。
     *
     * @param projectId 项目 ID
     * @return 剧本（可能为空）
     */
    Optional<ScriptPO> findByProjectId(UUID projectId);
}
