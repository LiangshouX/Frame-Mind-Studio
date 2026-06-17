"""Agent base class with structured output support."""

from abc import ABC, abstractmethod
from typing import Any
from langchain_core.language_models import BaseChatModel
from pydantic import BaseModel

from app.core.ai_gateway.provider import get_llm, call_with_retry


class BaseAgent(ABC):
    """Base class for all FrameMind agents."""

    name: str = "base"
    label: str = "Base Agent"

    def __init__(self, model_id: str | None = None):
        self.model_id = model_id or "qwen-max"

    def get_llm(self) -> BaseChatModel:
        return get_llm(self.model_id)

    def get_llm_with_structured_output(self, schema: type[BaseModel]) -> BaseChatModel:
        llm = self.get_llm()
        return llm.with_structured_output(schema)

    async def call(self, messages: list, fallback: bool = True) -> str:
        return await call_with_retry(self.model_id, messages, fallback=fallback)

    @abstractmethod
    async def run(self, state: dict, **kwargs) -> dict:
        """Execute the agent's task and return updated state."""
        ...
