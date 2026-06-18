package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.model.Foreshadow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForeshadowRepository extends JpaRepository<Foreshadow, UUID> {

    List<Foreshadow> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    List<Foreshadow> findByProjectIdAndStatusOrderByCreatedAtDesc(UUID projectId, String status);

    long countByProjectIdAndStatus(UUID projectId, String status);
}
