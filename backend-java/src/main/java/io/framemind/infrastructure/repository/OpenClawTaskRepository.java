package io.framemind.infrastructure.repository;

import io.framemind.infrastructure.po.OpenClawTaskPO;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * OpenClaw 任务追踪数据访问接口。
 */
public interface OpenClawTaskRepository extends JpaRepository<OpenClawTaskPO, UUID> {

    /**
     * 根据任务 ID 查找任务记录。
     *
     * @param taskId OpenClaw 任务 ID
     * @return 任务记录
     */
    Optional<OpenClawTaskPO> findByTaskId(String taskId);

    /**
     * 根据会话 ID 查询任务列表（按创建时间倒序）。
     *
     * @param sessionId 会话 ID
     * @return 任务列表
     */
    List<OpenClawTaskPO> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
}
