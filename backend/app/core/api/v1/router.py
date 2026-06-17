"""API router registry — mounts core and module routers."""

from fastapi import APIRouter
from app.core.api.v1.projects import router as projects_router
from app.core.api.v1.settings import router as settings_router

api_router = APIRouter(prefix="/api/v1")

# Core routes
api_router.include_router(projects_router)
api_router.include_router(settings_router)
