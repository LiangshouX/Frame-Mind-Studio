package io.framemind.infrastructure.repository;

import io.framemind.infrastructure.po.AgentMessagePO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Agent 消息仓储接口，提供 Agent 消息实体的数据库访问操作。
 */
@Repository
public interface AgentMessageRepository extends JpaRepository<AgentMessagePO, UUID> {

    /**
     * 根据会话 ID 查询消息列表，按消息顺序升序排列。
     *
     * @param sessionId 会话 ID
     * @return 消息列表
     */
    List<AgentMessagePO> findBySessionIdOrderByMessageOrderAsc(UUID sessionId);
}
