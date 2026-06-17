"""FastAPI entry point — mounts core and module routers."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.api.v1.router import api_router
from app.core.api.websocket import router as ws_router

app = FastAPI(
    title="FrameMind Studio",
    description="AI-powered screenplay creation platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core API routes
app.include_router(api_router)

# WebSocket routes
app.include_router(ws_router)


# Module routers — register each module's router
# ScriptMind
from app.modules.scriptmind.router import router as scriptmind_router
app.include_router(scriptmind_router)

# Future modules: storyboard, styleforge, motioncore, voicestage, export
# from app.modules.storyboard.router import router as storyboard_router
# app.include_router(storyboard_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "framemind-backend"}
