package io.framemind.infrastructure.repository;

import io.framemind.infrastructure.po.AgentMessagePO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
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

    /**
     * 根据会话 ID 删除所有消息。
     *
     * @param sessionId 会话 ID
     */
    void deleteBySessionId(UUID sessionId);

    /**
     * 统计指定会话的消息数量。
     *
     * @param sessionId 会话 ID
     * @return 消息数量
     */
    long countBySessionId(UUID sessionId);

    /**
     * 查询指定会话的最大消息顺序号。
     *
     * @param sessionId 会话 ID
     * @return 最大消息顺序号，无消息时返回 empty
     */
    @Query("SELECT MAX(m.messageOrder) FROM AgentMessagePO m WHERE m.sessionId = :sessionId")
    Optional<Integer> findMaxMessageOrderBySessionId(@Param("sessionId") UUID sessionId);
}
