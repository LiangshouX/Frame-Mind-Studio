"""Project Pydantic schemas."""

from pydantic import BaseModel, Field
from datetime import datetime


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    genre: list[str] = Field(default_factory=list)
    format: str = Field(default="short_drama")
    description: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    genre: list[str] | None = None
    format: str | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    id: str
    title: str
    genre: list[str]
    format: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
