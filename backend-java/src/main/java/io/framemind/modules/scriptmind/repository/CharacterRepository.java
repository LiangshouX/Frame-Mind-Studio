package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.po.CharacterPO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 角色仓储接口，提供角色实体的数据库访问操作。
 */
@Repository
public interface CharacterRepository extends JpaRepository<CharacterPO, UUID> {

    /**
     * 根据项目 ID 查询角色列表，按名称升序排列。
     *
     * @param projectId 项目 ID
     * @return 角色列表
     */
    List<CharacterPO> findByProjectIdOrderByNameAsc(UUID projectId);

    /**
     * 根据项目 ID 和角色名称查询角色。
     *
     * @param projectId 项目 ID
     * @param name      角色名称
     * @return 角色（可能为空）
     */
    Optional<CharacterPO> findByProjectIdAndName(UUID projectId, String name);
}
