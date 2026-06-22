# Research: ScriptMind 剧本工作流补全

**Date**: 2026-06-22

## Codebase Exploration Findings

### Backend Status

| Component | Status | Notes |
|-----------|--------|-------|
| ProjectController | ✅ Complete | GET list, GET detail, POST create, DELETE |
| CharacterController | ✅ Complete | Full CRUD with partial updates |
| WorldSettingController | ✅ Complete | GET/PUT/DELETE |
| SynopsisController | ✅ Complete | GET/PUT/DELETE |
| OutlineController | ✅ Complete | GET/PUT/DELETE + per-episode update |
| ScriptController | ✅ Complete | GET/PUT/PATCH + per-episode update |
| ExportController | ✅ Complete | JSON + Fountain |
| ImportService | ✅ Complete | TXT/DOCX/MD/Fountain + charset detection |
| QualityController | ✅ Complete | 5 metrics + foreshadow status |
| ForeshadowController | ✅ Complete | GET/PATCH + stats |
| ReviewController | ✅ Complete | GET/PATCH per-issue status |
| AgentController | ✅ Complete | Async pipeline with WebSocket streaming |
| WorkflowController | ⚠️ 4 stubs | generate-characters, generate-outline, generate-script, review |
| PipelineOrchestrator | ✅ 5 pipelines | outline, script-refinement, file-import, url-import, optimization |
| WebSocketHandler | ✅ Complete | `/ws/agent/{session_id}`, server-push model |
| Agent components | ✅ 5 agents | creative, showrunner, world_builder, character_designer, script_doctor |

### Frontend Status

| Component | Status | Notes |
|-----------|--------|-------|
| WorkflowTabs | ✅ Complete | 5 tabs with step numbers |
| WorldviewPanel | ⚠️ Partial | Form + AI generate button, no AI chat |
| SynopsisPanel | ⚠️ Partial | Form + AI generate, no skip, no text editor |
| CharacterPanel | ❌ Empty | Only "暂无角色" placeholder |
| OutlinePanel | ⚠️ Partial | AI generate + manual add, no per-episode regenerate/delete |
| ScriptEditor | ⚠️ Partial | Three-column exists but scene nav empty, WS "未连接" |
| AgentChat | ⚠️ Broken | WebSocket shows "未连接" |
| ProjectSidebar | ✅ Complete | 剧本工厂 active, 5 disabled modules |
| QualityDashboard | ✅ Complete | Score ring + 5 metric cards |
| ForeshadowTracker | ✅ Complete | Status grouping + urgency |

### Key Decisions

1. **No schema changes needed** — All PO classes and migrations already cover the data model
2. **No new API endpoints needed** — All CRUD endpoints exist; only 4 stubs need wiring
3. **Frontend is the primary work** — Backend is ~90% complete, frontend is ~40% complete
4. **WebSocket fix is critical** — AgentChat component exists but connection is broken
5. **Shared WorkflowLayout** — Create one layout component to avoid duplicating AI chat integration across 5 panels
