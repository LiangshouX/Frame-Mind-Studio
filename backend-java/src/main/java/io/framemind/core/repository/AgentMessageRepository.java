package io.framemind.core.repository;

import io.framemind.core.model.AgentMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgentMessageRepository extends JpaRepository<AgentMessage, UUID> {

    List<AgentMessage> findBySessionIdOrderByMessageOrderAsc(UUID sessionId);
}
