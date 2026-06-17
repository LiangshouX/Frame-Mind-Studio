"""Foreshadow Pydantic schemas."""

from pydantic import BaseModel, Field
from datetime import datetime


class ForeshadowResponse(BaseModel):
    id: str
    content: str
    planted_episode: int
    resolved: bool
    resolved_episode: int | None
    related_characters: list[str]
    importance: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ForeshadowListResponse(BaseModel):
    items: list[ForeshadowResponse]
    total: int


class ForeshadowUpdateRequest(BaseModel):
    resolved: bool | None = None
    resolved_episode: int | None = None
    importance: str | None = Field(default=None, pattern="^(high|medium|low)$")
