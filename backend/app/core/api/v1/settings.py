"""Settings API — API key management and model list."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.security import encrypt_api_key, mask_api_key
from app.core.ai_gateway.catalog import get_available_models

router = APIRouter(prefix="/settings", tags=["settings"])

# In-memory API key store (persisted to .env in production)
_api_keys: dict[str, str] = {}


class ApiKeyUpdate(BaseModel):
    provider: str
    api_key: str


@router.get("/api-keys")
async def list_api_keys():
    settings = get_settings()
    providers = {
        "openai": settings.openai_api_key,
        "alibaba": settings.qwen_api_key,
        "anthropic": settings.anthropic_api_key,
        "deepseek": settings.deepseek_api_key,
    }
    items = []
    for provider, key in providers.items():
        items.append({
            "provider": provider,
            "key_preview": mask_api_key(key) if key else "",
            "configured": bool(key),
        })
    return {"items": items}


@router.put("/api-keys")
async def update_api_key(body: ApiKeyUpdate):
    encrypted = encrypt_api_key(body.api_key)
    _api_keys[body.provider] = encrypted
    return {
        "provider": body.provider,
        "key_preview": mask_api_key(body.api_key),
        "configured": True,
    }


@router.get("/models")
async def list_models():
    return {"items": get_available_models()}
