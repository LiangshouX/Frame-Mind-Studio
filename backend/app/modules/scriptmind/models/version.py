"""ScriptVersion SQLAlchemy model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ScriptVersion(Base):
    __tablename__ = "script_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    script_id: Mapped[str] = mapped_column(String(36), ForeignKey("scripts.id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str | None] = mapped_column(String(500), nullable=True)
    change_source: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    script = relationship("Script", back_populates="versions")
