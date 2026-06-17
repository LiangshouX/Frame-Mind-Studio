"""Foreshadow SQLAlchemy model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, Boolean, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Foreshadow(Base):
    __tablename__ = "foreshadows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    planted_episode: Mapped[int] = mapped_column(Integer, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resolved_episode: Mapped[int | None] = mapped_column(Integer, nullable=True)
    related_characters: Mapped[list] = mapped_column(JSON, default=list)
    importance: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    project = relationship("Project", back_populates="foreshadows")
