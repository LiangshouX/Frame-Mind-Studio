"""Quality metrics API endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.scriptmind.services.script_service import get_or_create_script
from app.modules.scriptmind.services.quality_service import calculate_quality_metrics

router = APIRouter(prefix="/projects/{project_id}/script", tags=["quality"])


@router.get("/quality")
async def get_quality_metrics(project_id: str, db: AsyncSession = Depends(get_db)):
    script = await get_or_create_script(db, project_id)
    metrics = calculate_quality_metrics(script.content)
    return metrics
