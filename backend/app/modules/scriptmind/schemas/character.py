"""Character Pydantic schemas."""

from pydantic import BaseModel
from datetime import datetime


class CharacterResponse(BaseModel):
    id: str
    name: str
    role_type: str
    description: str | None
    personality: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CharacterListResponse(BaseModel):
    items: list[CharacterResponse]
    total: int


class CharacterUpdateRequest(BaseModel):
    description: str | None = None
    personality: list[str] | None = None
    appearance: str | None = None
    character_arc: str | None = None
