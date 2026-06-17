"""Model catalog and routing."""

from dataclasses import dataclass, field
from app.core.config import get_settings


@dataclass
class ModelConfig:
    provider: str
    model_name: str
    use_case: str
    max_tokens: int = 8192
    api_key_env: str = ""


MODEL_CATALOG: dict[str, ModelConfig] = {
    "qwen-max": ModelConfig(
        provider="alibaba",
        model_name="qwen-max",
        use_case="主力创作模型，中文能力强",
        api_key_env="QWEN_API_KEY",
    ),
    "gpt-4o": ModelConfig(
        provider="openai",
        model_name="gpt-4o",
        use_case="复杂推理、英文场景",
        max_tokens=16384,
        api_key_env="OPENAI_API_KEY",
    ),
    "claude-sonnet-4-6": ModelConfig(
        provider="anthropic",
        model_name="claude-sonnet-4-6",
        use_case="长文本分析、审稿",
        api_key_env="ANTHROPIC_API_KEY",
    ),
    "deepseek-v3": ModelConfig(
        provider="deepseek",
        model_name="deepseek-v3",
        use_case="高性价比备选",
        api_key_env="DEEPSEEK_API_KEY",
    ),
}

# Default model order for fallback
FALLBACK_ORDER = ["qwen-max", "gpt-4o", "claude-sonnet-4-6", "deepseek-v3"]


def get_available_models() -> list[dict]:
    settings = get_settings()
    result = []
    for model_id, config in MODEL_CATALOG.items():
        api_key = getattr(settings, config.api_key_env, "")
        result.append({
            "id": model_id,
            "provider": config.provider,
            "name": config.model_name,
            "use_case": config.use_case,
            "configured": bool(api_key),
        })
    return result


def get_preferred_model() -> str | None:
    """Return the first configured model in fallback order."""
    settings = get_settings()
    for model_id in FALLBACK_ORDER:
        config = MODEL_CATALOG[model_id]
        api_key = getattr(settings, config.api_key_env, "")
        if api_key:
            return model_id
    return None
