"""Character SQLAlchemy model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role_type: Mapped[str] = mapped_column(String(20), nullable=False, default="supporting")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    appearance: Mapped[str | None] = mapped_column(Text, nullable=True)
    personality: Mapped[list] = mapped_column(JSON, default=list)
    relationships: Mapped[dict] = mapped_column(JSON, default=dict)
    character_arc: Mapped[str | None] = mapped_column(Text, nullable=True)
    visual_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    project = relationship("Project", back_populates="characters")
