"""Character API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.scriptmind.models.character import Character
from app.modules.scriptmind.schemas.character import CharacterResponse, CharacterListResponse, CharacterUpdateRequest

router = APIRouter(prefix="/projects/{project_id}/characters", tags=["characters"])


@router.get("", response_model=CharacterListResponse)
async def list_characters(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Character).where(Character.project_id == project_id).order_by(Character.name)
    )
    characters = result.scalars().all()
    return CharacterListResponse(items=characters, total=len(characters))


@router.patch("/{character_id}", response_model=CharacterResponse)
async def update_character(
    project_id: str,
    character_id: str,
    body: CharacterUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Character).where(Character.id == character_id, Character.project_id == project_id)
    )
    char = result.scalar_one_or_none()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(char, field, value)
    await db.flush()
    return char
