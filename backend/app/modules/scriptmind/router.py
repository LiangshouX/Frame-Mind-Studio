"""ScriptMind module router — registers all sub-routers."""

from fastapi import APIRouter
from app.modules.scriptmind.api.scripts import router as scripts_router
from app.modules.scriptmind.api.agent import router as agent_router
from app.modules.scriptmind.api.characters import router as characters_router
from app.modules.scriptmind.api.foreshadows import router as foreshadows_router
from app.modules.scriptmind.api.quality import router as quality_router

router = APIRouter(prefix="/api/v1")

router.include_router(scripts_router)
router.include_router(agent_router)
router.include_router(characters_router)
router.include_router(foreshadows_router)
router.include_router(quality_router)
