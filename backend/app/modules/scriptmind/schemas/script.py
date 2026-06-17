"""ScriptMind Pydantic schemas."""

from pydantic import BaseModel, Field
from datetime import datetime


# --- Outline schemas ---

class OutlineEpisode(BaseModel):
    episode_number: int
    title: str
    summary: str
    key_events: list[str] = Field(default_factory=list)
    cliffhanger: str = ""


class StoryOutline(BaseModel):
    title: str
    genre: list[str] = Field(default_factory=list)
    logline: str = ""
    episodes: list[OutlineEpisode] = Field(default_factory=list)
    main_plot_points: list[str] = Field(default_factory=list)
    turning_points: list[str] = Field(default_factory=list)
    themes: list[str] = Field(default_factory=list)


# --- Script content schemas ---

class ScriptBeatData(BaseModel):
    beat_id: str
    type: str = Field(pattern="^(action|dialogue|emotion|transition)$")
    content: str
    character: str | None = None
    emotion: str | None = None
    camera_suggestion: str | None = None
    duration_seconds: float | None = None


class ScriptSceneData(BaseModel):
    scene_id: str
    location: str = ""
    time: str = "日"
    mood_tags: list[str] = Field(default_factory=list)
    characters_present: list[str] = Field(default_factory=list)
    beats: list[ScriptBeatData] = Field(default_factory=list)


class ScriptEpisodeData(BaseModel):
    episode_number: int
    title: str = ""
    duration_minutes: float = 2.5
    summary: str | None = None
    key_events: list[str] = Field(default_factory=list)
    cliffhanger: str | None = None
    scenes: list[ScriptSceneData] = Field(default_factory=list)


class ScriptContent(BaseModel):
    title: str = "未命名剧本"
    total_episodes: int = 10
    episodes: list[ScriptEpisodeData] = Field(default_factory=list)


# --- API request/response schemas ---

class ScriptResponse(BaseModel):
    id: str
    project_id: str
    title: str
    total_episodes: int
    style_preset: str | None
    content: dict
    current_version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScriptUpdateRequest(BaseModel):
    content: dict
    change_summary: str | None = None


class GenerateOutlineRequest(BaseModel):
    project_id: str
    input_type: str = Field(pattern="^(one_sentence|outline)$")
    input_content: str
    style_preset: str | None = None
    target_episodes: int = Field(default=20, ge=8, le=100)


class RefineScriptRequest(BaseModel):
    project_id: str
    input_content: str


class ImportUrlRequest(BaseModel):
    project_id: str
    url: str
