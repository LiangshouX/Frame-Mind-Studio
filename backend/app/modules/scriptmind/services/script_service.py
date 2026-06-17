"""Script CRUD and version control service."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.scriptmind.models.script import Script, ScriptEpisode, ScriptScene, ScriptBeat
from app.modules.scriptmind.models.version import ScriptVersion


async def get_or_create_script(db: AsyncSession, project_id: str) -> Script:
    result = await db.execute(select(Script).where(Script.project_id == project_id))
    script = result.scalar_one_or_none()
    if not script:
        script = Script(project_id=project_id)
        db.add(script)
        await db.flush()
    return script


async def update_script_content(
    db: AsyncSession,
    project_id: str,
    content: dict,
    change_summary: str | None = None,
    change_source: str = "manual",
) -> Script:
    script = await get_or_create_script(db, project_id)

    # Save version snapshot before updating
    version = ScriptVersion(
        script_id=script.id,
        version_number=script.current_version,
        content=script.content,
        change_summary=change_summary,
        change_source=change_source,
    )
    db.add(version)

    # Update script
    script.content = content
    script.title = content.get("title", script.title)
    script.total_episodes = content.get("total_episodes", script.total_episodes)
    script.current_version += 1
    script.updated_at = datetime.now(timezone.utc)

    await db.flush()
    return script


async def get_version_history(
    db: AsyncSession,
    project_id: str,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[ScriptVersion], int]:
    script = await get_or_create_script(db, project_id)
    count_result = await db.execute(
        select(func.count()).select_from(ScriptVersion).where(ScriptVersion.script_id == script.id)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(ScriptVersion)
        .where(ScriptVersion.script_id == script.id)
        .order_by(ScriptVersion.version_number.desc())
        .limit(limit)
        .offset(offset)
    )
    versions = result.scalars().all()
    return versions, total


async def get_version(db: AsyncSession, version_id: str) -> ScriptVersion | None:
    result = await db.execute(select(ScriptVersion).where(ScriptVersion.id == version_id))
    return result.scalar_one_or_none()


async def restore_version(db: AsyncSession, project_id: str, version_id: str) -> Script:
    version = await get_version(db, version_id)
    if not version:
        raise ValueError("Version not found")
    return await update_script_content(
        db, project_id, version.content,
        change_summary=f"回溯到版本 {version.version_number}",
        change_source="restore",
    )


def compute_diff(old_content: dict, new_content: dict) -> dict:
    """Compute structured diff between two script contents."""
    old_eps = {e["episodeNumber"]: e for e in old_content.get("episodes", [])}
    new_eps = {e["episodeNumber"]: e for e in new_content.get("episodes", [])}

    episodes_added = [n for n in new_eps if n not in old_eps]
    episodes_removed = [n for n in old_eps if n not in new_eps]
    episodes_modified = []

    for ep_num in set(old_eps.keys()) & set(new_eps.keys()):
        old_ep = old_eps[ep_num]
        new_ep = new_eps[ep_num]
        if old_ep != new_ep:
            episodes_modified.append({
                "episode_number": ep_num,
                "old_title": old_ep.get("title"),
                "new_title": new_ep.get("title"),
                "changed": old_ep != new_ep,
            })

    return {
        "episodes_added": episodes_added,
        "episodes_removed": episodes_removed,
        "episodes_modified": episodes_modified,
    }
