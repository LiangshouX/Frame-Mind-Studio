package io.framemind.core.repository;

import io.framemind.core.model.ProjectBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectBudgetRepository extends JpaRepository<ProjectBudget, UUID> {

    Optional<ProjectBudget> findByProjectId(UUID projectId);
}
