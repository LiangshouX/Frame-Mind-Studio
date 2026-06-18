package io.framemind.modules.scriptmind.repository;

import io.framemind.modules.scriptmind.model.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CharacterRepository extends JpaRepository<Character, UUID> {

    List<Character> findByProjectIdOrderByNameAsc(UUID projectId);

    Optional<Character> findByProjectIdAndName(UUID projectId, String name);
}
