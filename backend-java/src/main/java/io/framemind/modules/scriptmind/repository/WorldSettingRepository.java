package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.po.WorldSettingPO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * 世界观设定仓储接口，提供世界观设定的数据库访问操作。
 */
@Repository
public interface WorldSettingRepository extends JpaRepository<WorldSettingPO, UUID> {

    /**
     * 根据项目 ID 查询关联的世界观设定。
     *
     * @param projectId 项目 ID
     * @return 世界观设定（可能为空）
     */
    Optional<WorldSettingPO> findByProjectId(UUID projectId);

    /**
     * 根据项目 ID 删除世界观设定。
     *
     * @param projectId 项目 ID
     */
    void deleteByProjectId(UUID projectId);
}
