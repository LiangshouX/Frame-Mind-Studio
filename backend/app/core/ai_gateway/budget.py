"""Token budget middleware for per-project cost control."""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.models.project import ProjectBudget


async def check_budget(db: AsyncSession, project_id: str, estimated_tokens: int = 0) -> dict:
    """Check if project has budget remaining. Returns status dict."""
    result = await db.execute(select(ProjectBudget).where(ProjectBudget.project_id == project_id))
    budget = result.scalar_one_or_none()
    if not budget:
        # Auto-create budget with defaults
        budget = ProjectBudget(project_id=project_id)
        db.add(budget)
        await db.flush()

    remaining = budget.token_limit - budget.tokens_used
    warning_threshold = float(budget.warning_threshold)
    is_warning = budget.tokens_used >= budget.token_limit * warning_threshold
    is_exceeded = budget.tokens_used >= budget.token_limit

    return {
        "token_limit": budget.token_limit,
        "tokens_used": budget.tokens_used,
        "remaining": remaining,
        "is_warning": is_warning,
        "is_exceeded": is_exceeded,
        "warning_threshold": warning_threshold,
    }


async def consume_tokens(db: AsyncSession, project_id: str, tokens: int) -> dict:
    """Record token consumption and return updated budget status."""
    result = await db.execute(select(ProjectBudget).where(ProjectBudget.project_id == project_id))
    budget = result.scalar_one_or_none()
    if not budget:
        budget = ProjectBudget(project_id=project_id)
        db.add(budget)
        await db.flush()

    budget.tokens_used += tokens
    await db.flush()
    return await check_budget(db, project_id)


async def reset_budget(db: AsyncSession, project_id: str) -> None:
    """Reset token usage for a project."""
    await db.execute(
        update(ProjectBudget)
        .where(ProjectBudget.project_id == project_id)
        .values(tokens_used=0)
    )
