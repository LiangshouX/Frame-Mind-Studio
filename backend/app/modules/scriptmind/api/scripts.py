"""Script CRUD API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.scriptmind.models.script import Script
from app.modules.scriptmind.schemas.script import ScriptResponse, ScriptUpdateRequest
from app.modules.scriptmind.services.script_service import (
    get_or_create_script, update_script_content,
    get_version_history, get_version, restore_version, compute_diff,
)

router = APIRouter(prefix="/projects/{project_id}/script", tags=["scripts"])


@router.get("", response_model=ScriptResponse)
async def get_script(project_id: str, db: AsyncSession = Depends(get_db)):
    script = await get_or_create_script(db, project_id)
    return script


@router.patch("", response_model=ScriptResponse)
async def update_script(
    project_id: str,
    body: ScriptUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    script = await update_script_content(
        db, project_id, body.content,
        change_summary=body.change_summary or "手动编辑",
        change_source="manual",
    )
    return script


# --- Version endpoints ---

@router.get("/versions")
async def list_versions(
    project_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    versions, total = await get_version_history(db, project_id, limit, offset)
    return {
        "items": [
            {
                "id": v.id,
                "version_number": v.version_number,
                "change_summary": v.change_summary,
                "change_source": v.change_source,
                "created_at": v.created_at.isoformat(),
            }
            for v in versions
        ],
        "total": total,
    }


@router.get("/versions/{version_id}")
async def get_version_detail(version_id: str, db: AsyncSession = Depends(get_db)):
    version = await get_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return {
        "id": version.id,
        "version_number": version.version_number,
        "content": version.content,
        "change_summary": version.change_summary,
        "change_source": version.change_source,
        "created_at": version.created_at.isoformat(),
    }


@router.post("/versions/{version_id}/restore", response_model=ScriptResponse)
async def restore_version_endpoint(
    project_id: str,
    version_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        script = await restore_version(db, project_id, version_id)
        return script
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/versions/compare")
async def compare_versions(
    project_id: str,
    from_version: int = Query(...),
    to_version: int = Query(...),
    db: AsyncSession = Depends(get_db),
):
    script = await get_or_create_script(db, project_id)
    # For simplicity, compare current content with a stored version
    # In production, fetch both versions from the versions table
    return {
        "from_version": from_version,
        "to_version": to_version,
        "diff": {"note": "Full diff implementation requires version snapshots"},
    }
