package io.framemind.infrastructure.repository;

import io.framemind.infrastructure.po.ProjectPO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * 项目仓储接口，提供项目实体的数据库访问操作。
 */
@Repository
public interface ProjectRepository extends JpaRepository<ProjectPO, UUID> {

    /**
     * 查询所有项目，按更新时间降序排列。
     *
     * @return 项目列表
     */
    List<ProjectPO> findAllByOrderByUpdatedAtDesc();
}
