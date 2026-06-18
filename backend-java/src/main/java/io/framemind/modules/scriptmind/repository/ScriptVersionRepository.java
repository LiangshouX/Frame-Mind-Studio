package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.model.ScriptVersion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScriptVersionRepository extends JpaRepository<ScriptVersion, UUID> {

    List<ScriptVersion> findByScriptIdOrderByVersionDesc(UUID scriptId);

    List<ScriptVersion> findByScriptIdOrderByVersionDesc(UUID scriptId, Pageable pageable);

    Optional<ScriptVersion> findByScriptIdAndVersion(UUID scriptId, int version);
}
