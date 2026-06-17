"""Project and ProjectBudget SQLAlchemy models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, BigInteger, Numeric, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    genre: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    format: Mapped[str] = mapped_column(String(50), nullable=False, default="short_drama")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    script = relationship("Script", back_populates="project", uselist=False, cascade="all, delete-orphan")
    characters = relationship("Character", back_populates="project", cascade="all, delete-orphan")
    foreshadows = relationship("Foreshadow", back_populates="project", cascade="all, delete-orphan")
    budget = relationship("ProjectBudget", back_populates="project", uselist=False, cascade="all, delete-orphan")
    agent_sessions = relationship("AgentSession", back_populates="project", cascade="all, delete-orphan")


class ProjectBudget(Base):
    __tablename__ = "project_budgets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), unique=True, nullable=False)
    token_limit: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1_000_000)
    tokens_used: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    warning_threshold: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False, default=0.80)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    project = relationship("Project", back_populates="budget")
