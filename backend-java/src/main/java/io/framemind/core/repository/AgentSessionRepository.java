package io.framemind.core.repository;

import io.framemind.core.model.AgentSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgentSessionRepository extends JpaRepository<AgentSession, UUID> {

    List<AgentSession> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
