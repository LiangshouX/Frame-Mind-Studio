"""Agent Pydantic schemas."""

from pydantic import BaseModel, Field
from datetime import datetime


class AgentSessionResponse(BaseModel):
    id: str
    session_type: str
    status: str
    tokens_consumed: int
    started_at: datetime | None
    completed_at: datetime | None
    output_data: dict | None

    model_config = {"from_attributes": True}


class ReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|revise)$")
    feedback: str | None = None
