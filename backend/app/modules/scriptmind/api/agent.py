"""Agent task API endpoints."""

import uuid
import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.models.project import Project
from app.core.api.websocket import broadcast_to_session
from app.core.ai_gateway.budget import check_budget, consume_tokens
from app.modules.scriptmind.schemas.script import (
    GenerateOutlineRequest, RefineScriptRequest, ImportUrlRequest,
)
from app.modules.scriptmind.services.import_service import parse_file, fetch_url_content
from app.modules.scriptmind.services.script_service import update_script_content

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["agent"])


async def _run_outline_generation(session_id: str, project_id: str, user_input: str,
                                   style_preset: str | None, target_episodes: int, db: AsyncSession):
    """Background task for outline generation."""
    try:
        await broadcast_to_session(session_id, {
            "type": "stage_update",
            "data": {"stage": "showrunner", "stageLabel": "主笔编剧", "status": "started"},
        })

        from app.core.agent.orchestrator import ScriptMindOrchestrator
        orchestrator = ScriptMindOrchestrator()

        initial_state = {
            "project_id": project_id,
            "user_input": user_input,
            "input_type": "one_sentence",
            "style_preset": style_preset,
            "target_episodes": target_episodes,
            "story_outline": None,
            "world_setting": None,
            "characters": None,
            "script_draft": None,
            "review_feedback": None,
            "output": None,
            "hitl_pending": False,
            "hitl_action": None,
            "hitl_feedback": None,
            "tokens_consumed": 0,
            "current_agent": None,
        }

        result = await orchestrator.run(initial_state, thread_id=session_id)

        # Stream completion
        if result.get("hitl_pending"):
            await broadcast_to_session(session_id, {
                "type": "hitl_prompt",
                "data": {
                    "stage": "human_review",
                    "stageLabel": "人类审核",
                    "content": str(result.get("story_outline", {})),
                    "options": ["approve", "revise"],
                },
            })
        else:
            await broadcast_to_session(session_id, {
                "type": "complete",
                "data": {
                    "session_id": session_id,
                    "result": result.get("output"),
                    "tokens_consumed": result.get("tokens_consumed", 0),
                },
            })

    except Exception as e:
        logger.error(f"Outline generation failed: {e}", exc_info=True)
        await broadcast_to_session(session_id, {
            "type": "error",
            "data": {"session_id": session_id, "error_code": "GENERATION_FAILED", "message": str(e)},
        })


@router.post("/generate-outline", status_code=202)
async def generate_outline(body: GenerateOutlineRequest, db: AsyncSession = Depends(get_db)):
    # Check project exists
    result = await db.execute(select(Project).where(Project.id == body.project_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    # Check budget
    budget_status = await check_budget(db, body.project_id)
    if budget_status["is_exceeded"]:
        raise HTTPException(status_code=429, detail="Token 预算已用完，请调整预算后重试")

    session_id = str(uuid.uuid4())

    # Start background task
    asyncio.create_task(
        _run_outline_generation(
            session_id, body.project_id, body.input_content,
            body.style_preset, body.target_episodes, db,
        )
    )

    return {
        "session_id": session_id,
        "status": "pending",
        "websocket_url": f"ws://localhost:8080/ws/agent/{session_id}",
    }


@router.post("/refine-script", status_code=202)
async def refine_script(body: RefineScriptRequest, db: AsyncSession = Depends(get_db)):
    session_id = str(uuid.uuid4())
    # Placeholder — full implementation uses orchestrator
    return {
        "session_id": session_id,
        "status": "pending",
        "websocket_url": f"ws://localhost:8080/ws/agent/{session_id}",
    }


@router.post("/import-file", status_code=202)
async def import_file(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    parsed = parse_file(file.filename or "unknown.txt", content)

    if "error" in parsed:
        raise HTTPException(status_code=400, detail=parsed["error"])

    session_id = str(uuid.uuid4())
    return {
        "session_id": session_id,
        "status": "completed",
        "result": parsed,
    }


@router.post("/import-url", status_code=202)
async def import_url(body: ImportUrlRequest, db: AsyncSession = Depends(get_db)):
    result = await fetch_url_content(body.url)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    session_id = str(uuid.uuid4())
    return {
        "session_id": session_id,
        "status": "completed",
        "result": result,
    }


@router.post("/sessions/{session_id}/review")
async def submit_review(session_id: str, action: str = "approve", feedback: str | None = None):
    """Submit HITL review response."""
    await broadcast_to_session(session_id, {
        "type": "hitl_response",
        "data": {"action": action, "feedback": feedback},
    })
    return {"session_id": session_id, "status": "review_submitted"}


@router.post("/optimize-segment")
async def optimize_segment(
    project_id: str = Form(...),
    text: str = Form(...),
    element_type: str = Form(default="dialogue"),
    context: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
):
    """AI-optimize a screenplay segment, returning 2-3 alternatives."""
    from app.core.ai_gateway.provider import get_llm
    from app.core.ai_gateway.budget import check_budget, consume_tokens
    from langchain_core.messages import SystemMessage, HumanMessage

    # Check budget
    budget_status = await check_budget(db, project_id)
    if budget_status["is_exceeded"]:
        raise HTTPException(status_code=429, detail="Token 预算已用完")

    type_labels = {
        "scene_heading": "场景标题",
        "action": "动作描写",
        "character": "角色名",
        "dialogue": "对白",
        "parenthetical": "括号说明",
        "transition": "转场",
    }
    type_label = type_labels.get(element_type, element_type)

    system_prompt = f"""你是一位专业的剧本润色师。用户会给你一段{type_label}，请你提供 2-3 种不同的改写方案。

要求：
1. 保持原始意图和情感基调
2. 每种方案风格略有不同（如：更简洁、更生动、更口语化）
3. 如果是对白，要符合角色性格
4. 返回 JSON 格式

返回格式：
{{"alternatives": [{{"text": "改写文本", "style": "风格说明", "reason": "改写理由"}}]}}"""

    human_prompt = f"原文：{text}"
    if context:
        human_prompt += f"\n\n上下文：{context}"

    try:
        llm = get_llm(temperature=0.8)
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt),
        ])

        # Parse response
        import json
        content = response.content
        # Try to extract JSON from response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        result = json.loads(content.strip())
        return {"alternatives": result.get("alternatives", [])}

    except Exception as e:
        logger.error(f"Optimize segment failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"优化失败: {str(e)}")
