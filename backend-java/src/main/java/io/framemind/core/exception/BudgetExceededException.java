package io.framemind.core.exception;

/**
 * Thrown when a project's token budget hard limit has been exceeded.
 */
public class BudgetExceededException extends RuntimeException {

    private final long tokensUsed;
    private final long tokenLimit;

    public BudgetExceededException(long tokensUsed, long tokenLimit) {
        super(String.format(
                "Project token budget exceeded: used %d / limit %d tokens", tokensUsed, tokenLimit));
        this.tokensUsed = tokensUsed;
        this.tokenLimit = tokenLimit;
    }

    public long getTokensUsed() {
        return tokensUsed;
    }

    public long getTokenLimit() {
        return tokenLimit;
    }
}
