# Tasks: ScriptMind 剧本工厂

**Input**: Design documents from `/specs/001-scriptmind-screenplay-factory/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Docker 环境、项目脚手架、依赖安装

- [x] T001 Create backend project structure with pyproject.toml and dependencies (FastAPI, SQLAlchemy, LangChain, etc.) in backend/pyproject.toml
- [x] T002 Create frontend project structure with Next.js 14, shadcn/ui, Tailwind CSS in frontend/package.json
- [x] T003 [P] Create docker-compose.yml with postgres, redis, chromadb, backend, frontend services in docker-compose.yml
- [x] T004 [P] Create backend Dockerfile in backend/Dockerfile
- [x] T005 [P] Create frontend Dockerfile in frontend/Dockerfile
- [x] T006 [P] Create .env.example with API key placeholders (OPENAI, QWEN, ANTHROPIC, DEEPSEEK) in .env.example
- [x] T007 [P] Create shared types directory with pipeline constants in shared/types/script.ts and shared/constants/pipeline.ts
- [x] T008 [P] Create backend module placeholder directories (storyboard, styleforge, motioncore, voicestage, export) in backend/app/modules/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基础设施，所有用户故事的前置依赖

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Models

- [x] T009 Implement database connection pool and session management in backend/app/core/database.py
- [x] T010 [P] Implement Project SQLAlchemy model in backend/app/core/models/project.py
- [x] T011 [P] Implement AgentSession and AgentMessage SQLAlchemy models in backend/app/core/models/agent_session.py
- [x] T012 [P] Implement ProjectBudget SQLAlchemy model in backend/app/core/models/project.py (add ProjectBudget class)
- [ ] T013 Create Alembic migration configuration and initial migration in backend/alembic/env.py and backend/alembic/versions/

### AI Gateway

- [x] T014 Implement global config management (env vars, API keys) in backend/app/core/config.py
- [x] T015 [P] Implement API key encryption/decryption with Fernet in backend/app/core/security.py
- [x] T016 [P] Implement LLM Provider abstraction and Model Catalog in backend/app/core/ai_gateway/catalog.py and backend/app/core/ai_gateway/provider.py
- [x] T017 Implement Token budget middleware (per-project tracking, warning/hard-stop thresholds) in backend/app/core/ai_gateway/budget.py

### Agent Framework

- [x] T018 Implement Agent base class with structured output support in backend/app/core/agent/base.py
- [x] T019 [P] Implement Agent orchestrator (LangGraph StateGraph, HITL interrupt) in backend/app/core/agent/orchestrator.py
- [x] T020 [P] Implement ChromaDB project memory store in backend/app/core/agent/memory/chroma_store.py
- [x] T021 [P] Implement working memory (LangChain ChatMemory) in backend/app/core/agent/memory/working_memory.py
- [x] T022 [P] Implement web search tool in backend/app/core/agent/tools/web_search.py
- [x] T023 [P] Implement format converter tool in backend/app/core/agent/tools/format_converter.py

### WebSocket

- [x] T024 Implement WebSocket endpoint for agent session streaming in backend/app/core/api/websocket.py

### Shared API Routes

- [x] T025 [P] Implement Projects CRUD API (POST/GET/DELETE) in backend/app/core/api/v1/projects.py
- [x] T026 [P] Implement Settings API (API key management, model list) in backend/app/core/api/v1/settings.py
- [x] T027 Create API router registry in backend/app/core/api/v1/router.py
- [x] T028 Create FastAPI main entry point mounting core + module routers in backend/app/main.py

### Frontend Foundation

- [x] T029 Setup shadcn/ui components, Tailwind config, and global layout in frontend/src/app/layout.tsx and frontend/src/components/ui/
- [x] T030 [P] Implement API client with fetch wrapper in frontend/src/lib/api/client.ts
- [x] T031 [P] Implement Zustand project store in frontend/src/stores/project-store.ts
- [x] T032 [P] Implement Zustand agent store in frontend/src/stores/agent-store.ts
- [x] T033 [P] Implement Zustand settings store in frontend/src/stores/settings-store.ts
- [x] T034 [P] Implement TypeScript types (project, script, agent) in frontend/src/types/project.ts, script.ts, agent.ts
- [x] T035 [P] Implement projects API client in frontend/src/lib/api/projects.ts
- [x] T036 [P] Implement settings API client in frontend/src/lib/api/settings.ts
- [x] T037 Create project list page in frontend/src/app/projects/page.tsx
- [x] T038 [P] Create new project page in frontend/src/app/projects/new/page.tsx
- [ ] T039 [P] Create settings page in frontend/src/app/settings/page.tsx
- [x] T040 [P] Implement Pipeline navigation component in frontend/src/components/shared/pipeline-nav/
- [x] T041 [P] Implement useWebSocket hook in frontend/src/hooks/shared/useWebSocket.ts
- [x] T042 [P] Implement useAgentSession hook in frontend/src/hooks/shared/useAgentSession.ts
- [x] T043 [P] Implement Agent chat panel component in frontend/src/components/shared/agent-chat/

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — 一句话创意生成完整大纲 (Priority: P1) 🎯 MVP

**Goal**: 用户输入一句话梗概，通过 Agent 协作生成结构化大纲，含集数规划和钩子

**Independent Test**: 输入一句话梗概，选择风格预设，点击生成，60 秒内返回完整大纲

### Backend: ScriptMind Models

- [x] T044 [P] [US1] Implement Script SQLAlchemy model in backend/app/modules/scriptmind/models/script.py
- [x] T045 [P] [US1] Implement ScriptEpisode SQLAlchemy model in backend/app/modules/scriptmind/models/script.py
- [x] T046 [P] [US1] Implement ScriptScene SQLAlchemy model in backend/app/modules/scriptmind/models/script.py
- [x] T047 [P] [US1] Implement ScriptBeat SQLAlchemy model in backend/app/modules/scriptmind/models/script.py
- [x] T048 [P] [US1] Implement Character SQLAlchemy model in backend/app/modules/scriptmind/models/character.py

### Backend: ScriptMind Schemas

- [x] T049 [P] [US1] Implement Script Pydantic schemas (StoryOutline, OutlineEpisode) in backend/app/modules/scriptmind/schemas/script.py
- [x] T050 [P] [US1] Implement Character Pydantic schemas in backend/app/modules/scriptmind/schemas/character.py

### Backend: Agents

- [x] T051 [US1] Implement Showrunner Agent (intent parsing, outline generation) in backend/app/modules/scriptmind/agents/showrunner.py
- [x] T052 [US1] Implement WorldBuilder Agent (world setting, story bible) in backend/app/modules/scriptmind/agents/world_builder.py
- [x] T053 [US1] Implement CharacterDesigner Agent (character cards, relationships) in backend/app/modules/scriptmind/agents/character_designer.py
- [x] T054 [US1] Implement ScriptDoctor Agent (logic/rhythm/pacing review) in backend/app/modules/scriptmind/agents/script_doctor.py

### Backend: Services & API

- [x] T055 [US1] Implement ScriptMind module router in backend/app/modules/scriptmind/router.py
- [x] T056 [US1] Implement ScriptService (CRUD, version auto-save) in backend/app/modules/scriptmind/services/script_service.py
- [x] T057 [US1] Implement Agent API endpoint (generate-outline with WebSocket streaming) in backend/app/modules/scriptmind/api/agent.py

### Frontend: Outline Generation

- [x] T058 [P] [US1] Implement style preset picker component in frontend/src/components/scriptmind/style-preset-picker/
- [x] T059 [US1] Implement outline generation page (input form + agent progress) in frontend/src/app/projects/[id]/scriptmind/outline/page.tsx
- [x] T060 [US1] Implement outline viewer component in frontend/src/components/scriptmind/outline-viewer/
- [x] T061 [US1] Implement ScriptMind API client in frontend/src/lib/api/scriptmind.ts

**Checkpoint**: User Story 1 complete — one-sentence input → structured outline with agent streaming

---

## Phase 4: User Story 2 — 多段大纲细化为标准剧本 (Priority: P1)

**Goal**: 用户粘贴大纲文本，系统细化为含场景/动作/对白的标准剧本

**Independent Test**: 粘贴 Markdown 大纲，系统生成结构化剧本，可在编辑器中查看

### Backend

- [x] T062 [US2] Implement outline parsing logic (Markdown/numbered list → OutlineEpisode) in backend/app/modules/scriptmind/services/script_service.py (add parse_outline method)
- [x] T063 [US2] Implement refine-script agent endpoint (outline → full script) in backend/app/modules/scriptmind/api/agent.py (add refine-script route)

### Frontend

- [x] T064 [US2] Implement outline paste/parse UI in frontend/src/app/projects/[id]/scriptmind/outline/page.tsx (add paste mode)
- [x] T065 [US2] Wire refine-script flow: paste outline → agent generates script → navigate to editor in frontend/src/app/projects/[id]/scriptmind/page.tsx

**Checkpoint**: User Story 2 complete — outline text → full script with scenes, actions, dialogue

---

## Phase 5: User Story 5 — 专业剧本编辑器 (Priority: P1)

**Goal**: 6 种元素类型的剧本编辑器，Tab 切换、场景编号自动更新、多标签页独立保存

**Independent Test**: 在编辑器中 Tab 切换元素类型，输入对白，场景编号自动显示

### Backend

- [x] T066 [US5] Implement script content update API (PATCH with auto-version-save) in backend/app/modules/scriptmind/api/scripts.py

### Frontend: Script Editor

- [x] T067 [US5] Implement editor with 6 custom Element types (scene_heading, action, character, dialogue, parenthetical, transition) in frontend/src/components/scriptmind/script-editor/
- [x] T068 [US5] Implement Tab/Shift+Tab keyboard handler for element type cycling in frontend/src/components/scriptmind/script-editor/ (keyboard.ts)
- [x] T069 [US5] Implement Enter key handler with smart default type (dialogue→action, character→dialogue) in frontend/src/components/scriptmind/script-editor/ (keyboard.ts)
- [x] T070 [US5] Implement Backspace handler for empty element deletion in frontend/src/components/scriptmind/script-editor/ (keyboard.ts)
- [x] T071 [US5] Implement scene numbering sidebar (auto-update on content change) in frontend/src/components/scriptmind/scene-nav/
- [x] T072 [US5] Implement useScriptEditor hook (editor state, auto-save) in frontend/src/hooks/scriptmind/useScriptEditor.ts
- [x] T073 [US5] Implement script editor page in frontend/src/app/projects/[id]/scriptmind/page.tsx

**Checkpoint**: User Stories 1, 2, and 5 all functional — input → outline → script → editable in editor

---

## Phase 6: User Story 3 — 全文小说/剧本文件导入 (Priority: P2)

**Goal**: 支持 .txt/.docx/.md/.fountain 文件导入，自动解析为剧本格式

**Independent Test**: 上传 .txt 小说文件，系统返回按章节分割的剧本 + 角色列表

### Backend

- [x] T074 [P] [US3] Implement .txt file parser with encoding detection (chardet) in backend/app/modules/scriptmind/services/import_service.py
- [x] T075 [P] [US3] Implement .docx file parser (python-docx) in backend/app/modules/scriptmind/services/import_service.py
- [x] T076 [P] [US3] Implement .md file parser (mistune) in backend/app/modules/scriptmind/services/import_service.py
- [x] T077 [P] [US3] Implement .fountain file parser (fountain.py) in backend/app/modules/scriptmind/services/import_service.py
- [x] T078 [US3] Implement import-file agent endpoint (file → structured script + character extraction) in backend/app/modules/scriptmind/api/agent.py (add import-file route)

### Frontend

- [x] T079 [US3] Implement file upload UI with drag-and-drop in frontend/src/app/projects/[id]/scriptmind/import/page.tsx
- [x] T080 [US3] Implement import result view (script preview + character list confirmation) in frontend/src/app/projects/[id]/scriptmind/import/page.tsx

**Checkpoint**: User Story 3 complete — file upload → parsed script + extracted characters

---

## Phase 7: User Story 4 — URL 内容抓取与改编 (Priority: P2)

**Goal**: 输入 URL，自动抓取正文并改编为剧本

**Independent Test**: 输入公开故事 URL，系统抓取正文并生成剧本初稿

### Backend

- [x] T081 [US4] Implement URL content extractor (trafilatura + httpx) in backend/app/modules/scriptmind/services/import_service.py (add url_fetch method)
- [x] T082 [US4] Implement import-url agent endpoint in backend/app/modules/scriptmind/api/agent.py (add import-url route)

### Frontend

- [x] T083 [US4] Add URL input tab to import page in frontend/src/app/projects/[id]/scriptmind/import/page.tsx

**Checkpoint**: User Story 4 complete — URL → fetched content → script

---

## Phase 8: User Story 6 — 多集连续剧管理与伏笔追踪 (Priority: P2)

**Goal**: 多集管理、伏笔自动追踪、ScriptDoctor 审校时检查伏笔回收

**Independent Test**: 创建多集剧本，手动标记伏笔，审校时检测未回收伏笔

### Backend

- [x] T084 [P] [US6] Implement Foreshadow SQLAlchemy model in backend/app/modules/scriptmind/models/foreshadow.py
- [x] T085 [P] [US6] Implement Foreshadow Pydantic schemas in backend/app/modules/scriptmind/schemas/foreshadow.py
- [x] T086 [US6] Implement ForeshadowService (CRUD, tracking, resolution check) in backend/app/modules/scriptmind/services/foreshadow_service.py
- [x] T087 [US6] Implement Foreshadow API endpoints in backend/app/modules/scriptmind/api/foreshadows.py
- [x] T088 [US6] Integrate foreshadow check into ScriptDoctor Agent (ChromaDB retrieval during review) in backend/app/modules/scriptmind/agents/script_doctor.py
- [ ] T089 [US6] Implement episode reorder/merge/split API in backend/app/modules/scriptmind/api/scripts.py (add reorder/merge/split routes)

### Frontend

- [x] T090 [P] [US6] Implement foreshadow tracker panel component in frontend/src/components/scriptmind/foreshadow-tracker/
- [ ] T091 [US6] Implement multi-episode management UI (drag-reorder, merge/split) in frontend/src/app/projects/[id]/scriptmind/page.tsx
- [x] T092 [US6] Wire foreshadow panel into editor sidebar in frontend/src/app/projects/[id]/scriptmind/page.tsx

**Checkpoint**: User Story 6 complete — multi-episode management + foreshadow tracking

---

## Phase 9: User Story 7 — 版本控制与历史回溯 (Priority: P3)

**Goal**: 自动版本快照、版本历史列表、任意回溯、diff 对比

**Independent Test**: 多次编辑后回溯到早期版本，diff 对比正确显示差异

### Backend

- [x] T093 [P] [US7] Implement ScriptVersion SQLAlchemy model in backend/app/modules/scriptmind/models/version.py
- [x] T094 [US7] Implement version history API (list, get, restore, compare) in backend/app/modules/scriptmind/api/scripts.py (add version routes)
- [x] T095 [US7] Implement diff computation service (structured JSON diff) in backend/app/modules/scriptmind/services/script_service.py (add compute_diff method)

### Frontend

- [x] T096 [P] [US7] Implement useVersionHistory hook in frontend/src/hooks/shared/useVersionHistory.ts
- [x] T097 [US7] Implement version history panel component in frontend/src/components/shared/version-history/
- [x] T098 [US7] Implement diff viewer with highlighted changes in frontend/src/components/shared/version-history/diff-viewer.tsx

**Checkpoint**: User Story 7 complete — version history, restore, and diff comparison

---

## Phase 10: User Story 8 — AI 辅助段落优化 (Priority: P3)

**Goal**: 选中段落，AI 提供 2-3 种改写方案

**Independent Test**: 选中对白，点击 AI 优化，返回改写方案供选择

### Backend

- [x] T099 [US8] Implement optimize-segment agent endpoint in backend/app/modules/scriptmind/api/agent.py (add optimize-segment route)

### Frontend

- [x] T100 [US8] Implement AI optimize action in script editor (select text → trigger optimization) in frontend/src/components/scriptmind/script-editor/ (optimize.tsx)
- [x] T101 [US8] Implement optimization result panel (show 2-3 alternatives, apply/reject) in frontend/src/components/scriptmind/script-editor/ (optimize.tsx)

**Checkpoint**: User Story 8 complete — inline AI optimization with multiple alternatives

---

## Phase 11: Quality Dashboard & Polish

**Purpose**: 质量评估仪表盘、错误处理、Docker 验收

### Quality Dashboard

- [x] T102 [P] Implement QualityService (hook strength, rhythm, balance, dialogue ratio, scene diversity) in backend/app/modules/scriptmind/services/quality_service.py
- [x] T103 [P] Implement Quality API endpoint in backend/app/modules/scriptmind/api/quality.py
- [x] T104 [US6] Implement quality dashboard component in frontend/src/components/shared/quality-dashboard/
- [x] T105 [US6] Implement useQualityMetrics hook in frontend/src/hooks/scriptmind/useQualityMetrics.ts

### Error Handling & Edge Cases

- [ ] T106 Add error handling for network中断 during AI generation (save draft, retry prompt) in backend/app/modules/scriptmind/api/agent.py
- [ ] T107 Add file size validation (50万字 limit) to import service in backend/app/modules/scriptmind/services/import_service.py
- [x] T108 Add 429 rate limit retry with exponential backoff (max 3 retries) in backend/app/core/ai_gateway/provider.py
- [x] T109 Add budget warning/hard-stop logic to agent orchestrator in backend/app/core/ai_gateway/budget.py

### Frontend Polish

- [ ] T110 [P] Implement project detail / workbench page (dashboard with stats) in frontend/src/app/projects/[projectId]/page.tsx
- [ ] T111 [P] Implement homepage dashboard in frontend/src/app/page.tsx
- [ ] T112 Add loading states and error boundaries to all pages in frontend/src/components/layout/
- [x] T113 Implement character panel (view/edit characters from editor) in frontend/src/components/scriptmind/character-panel/

### Docker & Deployment

- [ ] T114 Verify docker-compose.yml builds and starts all services correctly
- [ ] T115 Run quickstart.md validation scenarios end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 P1)**: Depends on Phase 2 — MVP target
- **Phase 4 (US2 P1)**: Depends on Phase 2 — can parallel with US1
- **Phase 5 (US5 P1)**: Depends on Phase 2 — can parallel with US1/US2
- **Phase 6 (US3 P2)**: Depends on Phase 2 — can parallel with US1/US2/US5
- **Phase 7 (US4 P2)**: Depends on Phase 2 — can parallel
- **Phase 8 (US6 P2)**: Depends on Phase 2 — can parallel
- **Phase 9 (US7 P3)**: Depends on Phase 2 — can parallel
- **Phase 10 (US8 P3)**: Depends on Phase 2 — can parallel
- **Phase 11 (Polish)**: Depends on all desired user stories

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational)
    │
    ├──► Phase 3 (US1: 一句话生成大纲) ──────┐
    ├──► Phase 4 (US2: 大纲细化剧本) ────────┤
    ├──► Phase 5 (US5: 剧本编辑器) ──────────┤── All P1, can parallel
    │                                          │
    ├──► Phase 6 (US3: 文件导入) ─────────────┤
    ├──► Phase 7 (US4: URL 抓取) ────────────┤── All P2, can parallel
    ├──► Phase 8 (US6: 伏笔追踪) ────────────┤
    │                                          │
    ├──► Phase 9 (US7: 版本控制) ─────────────┤── P3, can parallel
    ├──► Phase 10 (US8: AI 段落优化) ─────────┘
    │
    ▼
Phase 11 (Polish & Quality Dashboard)
```

### Within Each User Story

- Models before Schemas before Services before API Endpoints
- Backend endpoints before Frontend pages
- Core implementation before integration/wiring

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006, T007, T008 all parallel
- **Phase 2**: Models (T010-T012) parallel; AI Gateway (T015-T017) parallel; Agent framework (T018-T023) parallel; Frontend foundation (T029-T043) parallel
- **Phase 3**: Models (T044-T048) parallel; Schemas (T049-T050) parallel
- **Phase 6**: Parsers (T074-T077) parallel
- **Phase 8**: Model + Schema (T084-T085) parallel
- **Cross-story**: US1, US2, US5 can all proceed in parallel after Phase 2

---

## Implementation Strategy

### MVP First (User Stories 1 + 5 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T043)
3. Complete Phase 3: US1 — 一句话生成大纲 (T044-T061)
4. Complete Phase 5: US5 — 剧本编辑器 (T066-T073)
5. **STOP and VALIDATE**: Input one sentence → get outline → edit in editor
6. Deploy/demo as MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. + US1 (大纲生成) → Test → MVP with AI generation
3. + US5 (编辑器) → Test → Full editing capability
4. + US2 (大纲细化) → Test → Complete input pipeline
5. + US3 (文件导入) → Test → File import capability
6. + US4 (URL 抓取) → Test → URL import capability
7. + US6 (伏笔追踪) → Test → Multi-episode management
8. + US7 (版本控制) → Test → Version history
9. + US8 (AI 优化) → Test → Inline AI assistance
10. Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- AI Gateway (Phase 2) is shared infrastructure — all agent-dependent stories need it
- WebSocket streaming (T024) is needed by all stories that trigger agent tasks
