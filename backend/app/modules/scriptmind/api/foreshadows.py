"""Foreshadow API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.scriptmind.models.foreshadow import Foreshadow
from app.modules.scriptmind.schemas.foreshadow import (
    ForeshadowResponse, ForeshadowListResponse, ForeshadowUpdateRequest,
)

router = APIRouter(prefix="/projects/{project_id}/foreshadows", tags=["foreshadows"])


@router.get("", response_model=ForeshadowListResponse)
async def list_foreshadows(
    project_id: str,
    resolved: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Foreshadow).where(Foreshadow.project_id == project_id)
    if resolved is not None:
        query = query.where(Foreshadow.resolved == resolved)
    query = query.order_by(Foreshadow.planted_episode)

    result = await db.execute(query)
    items = result.scalars().all()
    return ForeshadowListResponse(items=items, total=len(items))


@router.patch("/{foreshadow_id}", response_model=ForeshadowResponse)
async def update_foreshadow(
    project_id: str,
    foreshadow_id: str,
    body: ForeshadowUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Foreshadow).where(Foreshadow.id == foreshadow_id, Foreshadow.project_id == project_id)
    )
    fs = result.scalar_one_or_none()
    if not fs:
        raise HTTPException(status_code=404, detail="Foreshadow not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(fs, field, value)
    await db.flush()
    return fs
