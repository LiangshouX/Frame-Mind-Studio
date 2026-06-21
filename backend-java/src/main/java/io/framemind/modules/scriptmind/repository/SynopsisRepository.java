package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.po.SynopsisPO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * 梗概仓储接口，提供梗概的数据库访问操作。
 */
@Repository
public interface SynopsisRepository extends JpaRepository<SynopsisPO, UUID> {

    /**
     * 根据项目 ID 查询关联的梗概。
     *
     * @param projectId 项目 ID
     * @return 梗概（可能为空）
     */
    Optional<SynopsisPO> findByProjectId(UUID projectId);

    /**
     * 根据项目 ID 删除梗概。
     *
     * @param projectId 项目 ID
     */
    void deleteByProjectId(UUID projectId);
}
