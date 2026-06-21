package io.framemind.agent.hook;

import io.framemind.core.exception.BudgetExceededException;
import io.framemind.infrastructure.po.ProjectBudgetPO;
import io.framemind.infrastructure.repository.ProjectBudgetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Tracks token consumption per project and enforces budget limits.
 * <p>
 * When consumption crosses the configured warning threshold, a budget warning
 * is emitted via {@link StreamingHook}. When the hard token limit is exceeded,
 * a {@link BudgetExceededException} is thrown to halt the pipeline.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BudgetHook {

    private final ProjectBudgetRepository budgetRepository;
    private final StreamingHook streamingHook;

    /**
     * Check whether the project is still within its token budget.
     *
     * @param projectId the project to check
     * @return {@code true} if the project has remaining token budget
     */
    @Transactional(readOnly = true)
    public boolean checkBudget(UUID projectId) {
        Optional<ProjectBudgetPO> budgetOpt = budgetRepository.findByProjectId(projectId);
        if (budgetOpt.isEmpty()) {
            // No budget record means unlimited budget (e.g. newly created project)
            return true;
        }
        ProjectBudgetPO budget = budgetOpt.get();
        return budget.getTokensUsed() < budget.getTokenLimit();
    }

    /**
     * Consume tokens for a project, updating the persistent budget record.
     * <p>
     * If the updated usage crosses the warning threshold, a
     * {@code budget_warning} message is sent via {@link StreamingHook}.
     * If the hard limit is exceeded, a {@link BudgetExceededException} is thrown.
     *
     * @param projectId the project consuming tokens
     * @param tokens    the number of tokens to add to the running total
     * @param sessionId the agent session id (for streaming warnings)
     * @throws BudgetExceededException if the hard token limit is exceeded
     */
    @Transactional
    public void consumeTokens(UUID projectId, int tokens, String sessionId) {
        Optional<ProjectBudgetPO> budgetOpt = budgetRepository.findByProjectId(projectId);
        if (budgetOpt.isEmpty()) {
            log.debug("No budget record for project {}; skipping budget check", projectId);
            return;
        }

        ProjectBudgetPO budget = budgetOpt.get();
        long previousUsed = budget.getTokensUsed();
        long newUsed = previousUsed + tokens;
        long limit = budget.getTokenLimit();
        double threshold = budget.getWarningThreshold().doubleValue();

        budget.setTokensUsed(newUsed);
        budgetRepository.save(budget);

        log.debug("Token consumption: project={}, added={}, total={}/{}", projectId, tokens, newUsed, limit);

        // Check if we crossed the warning threshold with this consumption
        double previousRatio = (limit > 0) ? (double) previousUsed / limit : 0;
        double newRatio = (limit > 0) ? (double) newUsed / limit : 0;

        if (newRatio >= threshold && previousRatio < threshold) {
            log.warn("Budget warning threshold crossed for project {}: {} / {} ({})",
                    projectId, newUsed, limit, threshold);
            streamingHook.onBudgetWarning(sessionId, newUsed, limit, threshold);
        }

        // Hard limit enforcement
        if (newUsed >= limit) {
            throw new BudgetExceededException(newUsed, limit);
        }
    }

    /**
     * Convenience overload for callers that don't have a streaming session.
     * Skips the WebSocket warning and only persists the update.
     *
     * @param projectId the project consuming tokens
     * @param tokens    the number of tokens to add
     */
    @Transactional
    public void consumeTokens(UUID projectId, int tokens) {
        Optional<ProjectBudgetPO> budgetOpt = budgetRepository.findByProjectId(projectId);
        if (budgetOpt.isEmpty()) {
            return;
        }

        ProjectBudgetPO budget = budgetOpt.get();
        long newUsed = budget.getTokensUsed() + tokens;
        budget.setTokensUsed(newUsed);
        budgetRepository.save(budget);

        if (newUsed >= budget.getTokenLimit()) {
            throw new BudgetExceededException(newUsed, budget.getTokenLimit());
        }
    }
}
