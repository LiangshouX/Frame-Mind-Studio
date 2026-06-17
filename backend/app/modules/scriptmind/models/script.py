"""Script, ScriptEpisode, ScriptScene, ScriptBeat SQLAlchemy models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, Numeric, JSON, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Script(Base):
    __tablename__ = "scripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="未命名剧本")
    total_episodes: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    style_preset: Mapped[str | None] = mapped_column(String(50), nullable=True)
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    current_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    project = relationship("Project", back_populates="script")
    episodes = relationship("ScriptEpisode", back_populates="script", cascade="all, delete-orphan", order_by="ScriptEpisode.episode_number")
    versions = relationship("ScriptVersion", back_populates="script", cascade="all, delete-orphan")


class ScriptEpisode(Base):
    __tablename__ = "script_episodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    script_id: Mapped[str] = mapped_column(String(36), ForeignKey("scripts.id"), nullable=False)
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    duration_minutes: Mapped[float] = mapped_column(Numeric(4, 1), nullable=False, default=2.5)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_events: Mapped[list] = mapped_column(JSON, default=list)
    cliffhanger: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    script = relationship("Script", back_populates="episodes")
    scenes = relationship("ScriptScene", back_populates="episode", cascade="all, delete-orphan", order_by="ScriptScene.scene_order")

    __table_args__ = (
        CheckConstraint("episode_number >= 1", name="ck_episode_number_positive"),
    )


class ScriptScene(Base):
    __tablename__ = "script_scenes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    episode_id: Mapped[str] = mapped_column(String(36), ForeignKey("script_episodes.id"), nullable=False)
    scene_id: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    time: Mapped[str] = mapped_column(String(100), nullable=False, default="日")
    mood_tags: Mapped[list] = mapped_column(JSON, default=list)
    characters_present: Mapped[list] = mapped_column(JSON, default=list)
    scene_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    episode = relationship("ScriptEpisode", back_populates="scenes")
    beats = relationship("ScriptBeat", back_populates="scene", cascade="all, delete-orphan", order_by="ScriptBeat.beat_order")


class ScriptBeat(Base):
    __tablename__ = "script_beats"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scene_id: Mapped[str] = mapped_column(String(36), ForeignKey("script_scenes.id"), nullable=False)
    beat_id: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    character: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emotion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    camera_suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    beat_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    scene = relationship("ScriptScene", back_populates="beats")

    __table_args__ = (
        CheckConstraint("type IN ('action', 'dialogue', 'emotion', 'transition')", name="ck_beat_type"),
    )
