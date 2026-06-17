"""LLM Provider abstraction with retry and fallback."""

import asyncio
import logging
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI

from app.core.config import get_settings
from app.core.ai_gateway.catalog import MODEL_CATALOG, FALLBACK_ORDER

logger = logging.getLogger(__name__)

# Provider endpoint mapping
PROVIDER_ENDPOINTS = {
    "openai": "https://api.openai.com/v1",
    "alibaba": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "anthropic": "https://api.anthropic.com",
    "deepseek": "https://api.deepseek.com",
}


def get_llm(model_id: str) -> BaseChatModel:
    """Get LLM instance for the given model ID."""
    config = MODEL_CATALOG.get(model_id)
    if not config:
        raise ValueError(f"Unknown model: {model_id}")

    settings = get_settings()
    api_key = getattr(settings, config.api_key_env, "")
    if not api_key:
        raise ValueError(f"API key not configured for {model_id}")

    endpoint = PROVIDER_ENDPOINTS.get(config.provider, "")
    return ChatOpenAI(
        model=config.model_name,
        api_key=api_key,
        base_url=endpoint,
        max_tokens=config.max_tokens,
    )


async def call_with_retry(
    model_id: str,
    messages: list,
    max_retries: int = 3,
    fallback: bool = True,
) -> str:
    """Call LLM with exponential backoff retry and optional fallback."""
    settings = get_settings()
    models_to_try = [model_id]
    if fallback:
        models_to_try.extend(m for m in FALLBACK_ORDER if m != model_id)

    last_error = None
    for current_model in models_to_try:
        config = MODEL_CATALOG.get(current_model)
        if not config:
            continue
        api_key = getattr(settings, config.api_key_env, "")
        if not api_key:
            continue

        for attempt in range(max_retries):
            try:
                llm = get_llm(current_model)
                response = await llm.ainvoke(messages)
                return response.content
            except Exception as e:
                last_error = e
                if "429" in str(e) or "rate" in str(e).lower():
                    wait = 2 ** attempt
                    logger.warning(f"Rate limited on {current_model}, retry {attempt+1}/{max_retries} in {wait}s")
                    await asyncio.sleep(wait)
                else:
                    logger.error(f"Error calling {current_model}: {e}")
                    break

    raise RuntimeError(f"All models failed. Last error: {last_error}")
