"""Global configuration management."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://framemind:framemind_dev@localhost:5432/framemind"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8000

    # LLM API Keys
    openai_api_key: str = ""
    qwen_api_key: str = ""
    anthropic_api_key: str = ""
    deepseek_api_key: str = ""

    # Security
    fernet_key: str = ""

    # App
    app_name: str = "FrameMind Studio"
    debug: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
