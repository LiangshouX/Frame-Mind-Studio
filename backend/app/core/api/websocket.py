"""WebSocket endpoint for agent session streaming."""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter()

# Active connections keyed by session_id
_connections: dict[str, list[WebSocket]] = {}


async def broadcast_to_session(session_id: str, message: dict):
    """Broadcast a message to all WebSocket clients connected to a session."""
    connections = _connections.get(session_id, [])
    dead = []
    for ws in connections:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.remove(ws)


@router.websocket("/ws/agent/{session_id}")
async def agent_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    if session_id not in _connections:
        _connections[session_id] = []
    _connections[session_id].append(websocket)
    logger.info(f"WebSocket connected for session {session_id}")

    try:
        while True:
            data = await websocket.receive_text()
            # Client can send HITL responses
            try:
                msg = json.loads(data)
                if msg.get("type") == "hitl_response":
                    # Forward to agent orchestrator
                    logger.info(f"HITL response for {session_id}: {msg}")
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
        if session_id in _connections:
            _connections[session_id] = [ws for ws in _connections[session_id] if ws != websocket]
            if not _connections[session_id]:
                del _connections[session_id]
