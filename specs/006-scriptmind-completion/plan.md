# Implementation Plan: ScriptMind 剧本工作流补全

**Branch**: `006-scriptmind-completion` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-scriptmind-completion/spec.md`

## Summary

补全 ScriptMind 模块所有缺失功能。后端 API 和数据模型已基本完整（所有 CRUD、Export、Import、Quality、Foreshadow、Review 端点均已实现），主要工作集中在：(1) 后端 WorkflowController 中 4 个 stub 端点接入 Agent；(2) 前端角色面板 CRUD、世界观 AI 对话、统一三栏布局、上传/导出/审查 UI 的全面实现。

## Technical Context

**Language/Version**: Java 17 (backend), TypeScript 5.x (frontend)

**Primary Dependencies**: Spring Boot 3.2.5, AgentScope-Java SDK 2.0.0-RC3, Next.js 14 (App Router), Zustand, Slate.js, Tailwind CSS

**Storage**: PostgreSQL (JSONB for flexible content), Flyway migrations

**Testing**: JUnit 5 (backend), Playwright (frontend E2E)

**Target Platform**: Web application (Docker deployment), Chrome/Firefox/Safari/Edge

**Project Type**: Web application (frontend + backend)

**Performance Goals**: SC-008 <50ms editor switch, SC-009 <1s tab switch, SC-011 <5s WebSocket connect

**Constraints**: Single-user local deployment, no auth, new content overwrites (no versioning)

**Scale/Scope**: 10 user stories, 68 functional requirements, 5 workflow tabs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is template-only (not filled in). No governance constraints to check. Gate passes by default.

## Project Structure

### Documentation (this feature)

```text
specs/006-scriptmind-completion/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend-java/
├── src/main/java/io/framemind/
│   ├── modules/scriptmind/
│   │   ├── controller/       # WorkflowController (4 stubs to wire)
│   │   ├── service/          # All services (mostly complete)
│   │   ├── agent/            # Agent wrappers (mostly complete)
│   │   ├── dto/              # DTOs
│   │   ├── po/               # PO classes (complete)
│   │   └── repository/       # Repositories (complete)
│   └── agent/orchestration/  # PipelineOrchestrator, AgentCallAdapter
└── src/main/resources/db/migration/  # Flyway migrations

frontend/
├── src/
│   ├── app/projects/[id]/scriptmind/  # Main ScriptMind page
│   ├── components/scriptmind/         # Workflow panels
│   │   ├── character-panel/           # NEEDS: Full CRUD rebuild
│   │   ├── worldview-panel/           # NEEDS: Add AI chat
│   │   ├── synopsis-panel/            # NEEDS: Text editor + guidance
│   │   ├── outline-panel/             # NEEDS: Single-episode actions
│   │   ├── script-editor/             # NEEDS: Three-column layout fix
│   │   ├── upload-dialog/             # NEW: Upload modal
│   │   ├── export-dialog/             # NEW: Export modal
│   │   └── workflow-tabs/             # NEEDS: Status indicators
│   ├── components/shared/
│   │   ├── agent-chat/                # NEEDS: Fix WebSocket connection
│   │   └── quality-dashboard/         # NEEDS: Collapsible integration
│   ├── stores/                        # Zustand stores
│   └── lib/api/                       # API client functions
```

**Structure Decision**: Existing frontend/backend monorepo structure retained. No new packages needed. Two new component directories (upload-dialog, export-dialog) added.

## Complexity Tracking

No constitution violations to justify.

---

## Phase 0: Research

All technical unknowns resolved from codebase exploration:

| Unknown | Resolution |
|---------|-----------|
| Backend API completeness | All CRUD endpoints exist; 4 WorkflowController stubs need wiring |
| Agent integration | Agent components exist (CreativeAgent, CharacterDesignerAgent, etc.); need to call them from stubs |
| WebSocket infrastructure | Handler exists at `/ws/agent/{session_id}`; frontend stomp-client.ts exists but shows "未连接" |
| Frontend character panel | Component exists but is read-only display; needs full CRUD rebuild |
| Frontend AI chat on each page | AgentChat component exists; needs to be integrated into worldview/synopsis/character/outline panels |

**Decision**: No new technologies needed. All gaps are implementation gaps, not architectural decisions.

---

## Phase 1: Design & Contracts

### Data Model

No schema changes needed. All PO classes and migrations already exist:

| PO Class | Table | Key Fields | Status |
|----------|-------|------------|--------|
| `CharacterPO` | `characters` | name, gender, role, identity, persona, background, arc, overview, personality (JSONB) | ✅ Complete |
| `WorldSettingPO` | `world_settings` | content (JSONB) | ✅ Complete |
| `SynopsisPO` | `synopses` | content (JSONB) | ✅ Complete |
| `OutlinePO` | `outlines` | content (JSONB), format (episode_list/act_structure) | ✅ Complete |
| `ScriptPO` | `scripts` | content (JSONB), formatType | ✅ Complete |
| `ReviewReportPO` | `review_reports` | scope, episodeNumber, report (JSONB) | ✅ Complete |
| `ForeshadowPO` | `foreshadows` | plant, payoff, status, urgency | ✅ Complete |

### API Contracts

Existing endpoints cover all spec requirements:

| Spec Requirement | Endpoint | Status |
|-----------------|----------|--------|
| Character CRUD (FR-017~FR-024) | `GET/POST/PATCH/DELETE /projects/{id}/characters` | ✅ |
| World setting (FR-010~FR-013) | `GET/PUT/DELETE /projects/{id}/world-setting` | ✅ |
| Synopsis (FR-014~FR-016) | `GET/PUT/DELETE /projects/{id}/synopsis` | ✅ |
| Outline (FR-025~FR-030) | `GET/PUT/DELETE /projects/{id}/outline`, `PUT /outline/episodes/{n}` | ✅ |
| Script (FR-031~FR-041) | `GET/PUT/PATCH /projects/{id}/script`, `PUT /script/episodes/{n}` | ✅ |
| Export (FR-063~FR-066) | `GET /projects/{id}/export/json`, `/fountain` | ✅ |
| Import (FR-056~FR-062) | `POST /agent/import-file` | ✅ |
| Quality (FR-067) | `GET /projects/{id}/script/quality` | ✅ |
| Foreshadow (FR-068) | `GET/PATCH /projects/{id}/foreshadows` | ✅ |
| Review (FR-052~FR-055) | `GET/PATCH /projects/{id}/review-reports` | ✅ |
| Generate characters (FR-017) | `POST /projects/{id}/workflow/generate-characters` | ⚠️ STUB |
| Generate outline (FR-027) | `POST /projects/{id}/workflow/generate-outline` | ⚠️ STUB |
| Generate script (FR-036) | `POST /projects/{id}/workflow/generate-script` | ⚠️ STUB |
| Review script (FR-052) | `POST /projects/{id}/workflow/review` | ⚠️ STUB |

---

## Implementation Phases

### Phase A: Backend — Wire 4 Workflow Stubs (2h)

**Goal**: Replace 4 stub endpoints in WorkflowController with real agent calls.

**Files to modify**:
- `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/WorkflowController.java`
- `backend-java/src/main/java/io/framemind/agent/orchestration/PipelineOrchestrator.java`

**Detailed Tasks**:

1. **generate-characters** (FR-017)
   - In `WorkflowController.generateCharacters()`: Read project's world_setting + synopsis as context
   - Call `PipelineOrchestrator.executeCharacterGeneration(projectId, context)`
   - New method in PipelineOrchestrator: 1-stage pipeline using `CharacterDesignerAgent.designCharacters()`
   - Stream results via StreamingHook, save to CharacterPO on completion

2. **generate-outline** (FR-027)
   - In `WorkflowController.generateOutline()`: Read world_setting + synopsis + characters as context
   - Call existing `PipelineOrchestrator.executeOutlineGeneration()` (already implemented)
   - Just need to wire the WorkflowController to call it instead of returning stub

3. **generate-script** (FR-036)
   - In `WorkflowController.generateScript()`: Read outline + characters as context
   - New pipeline: `PipelineOrchestrator.executeScriptGeneration(projectId, context)`
   - 1-stage pipeline using `ShowrunnerAgent` to expand outline into full script
   - Save result to ScriptPO on completion

4. **review** (FR-052)
   - In `WorkflowController.review()`: Read full script content
   - New pipeline: `PipelineOrchestrator.executeReview(projectId, context)`
   - 1-stage pipeline using `ScriptDoctorAgent.reviewScript()`
   - Save result to ReviewReportPO on completion

**Acceptance Criteria**: Each endpoint returns 202 with session_id + websocket_url, streams results via WebSocket, saves to DB on completion.

---

### Phase B: Frontend — Character Panel CRUD (4h)

**Goal**: Rebuild CharacterPanel with full CRUD, AI generate, AI optimize.

**Files to modify**:
- `frontend/src/components/scriptmind/character-panel/index.tsx` — Complete rewrite

**Detailed Tasks**:

1. **Character list view**
   - Cards grouped by role: 主角 / 反派 / 配角 / 次要角色
   - Each card shows: name, gender, identity, personality tags
   - Empty state: "暂无角色，点击「AI 生成」或「新增角色」开始设计"

2. **AI 生成角色 button**
   - Calls `POST /api/v1/projects/{id}/workflow/generate-characters`
   - Shows loading state during generation
   - On WebSocket `complete` message, refresh character list

3. **新增角色 button**
   - Opens inline form with fields: 姓名, 性别(select), 性格标签(input), 身份定位(textarea), 人物小传(textarea)
   - Conditional fields: persona (short drama) or background + arc (movie)
   - Save calls `POST /api/v1/projects/{id}/characters`

4. **Edit mode**
   - Click card → expand to editable form
   - All fields editable, auto-save on blur via `PATCH /api/v1/projects/{id}/characters/{charId}`

5. **AI 优化 per character**
   - Button on each card → calls `POST /api/v1/agent/optimize-segment` with character context
   - Shows 2-3 alternatives, user picks one to replace

6. **Delete per character**
   - Button → confirmation dialog → `DELETE /api/v1/projects/{id}/characters/{charId}`
   - Warning about references in outline/script

**Acceptance Criteria**: Create, edit, delete, AI generate, AI optimize all functional.

---

### Phase C: Frontend — Unified AI Chat Layout (3h)

**Goal**: Every workflow tab has AI chat panel on the right side.

**Files to modify**:
- `frontend/src/components/scriptmind/worldview-panel/index.tsx`
- `frontend/src/components/scriptmind/synopsis-panel/index.tsx`
- `frontend/src/components/scriptmind/character-panel/index.tsx`
- `frontend/src/components/scriptmind/outline-panel/index.tsx`
- `frontend/src/app/projects/[id]/scriptmind/page.tsx`

**Detailed Tasks**:

1. **Create shared WorkflowLayout component**
   - Props: `children` (content), `step` (current workflow step)
   - Layout: `flex` with content area (left 60%) + AI chat panel (right 40%)
   - AI chat panel renders `AgentChat` component with WebSocket connection

2. **Wrap each panel in WorkflowLayout**
   - WorldviewPanel → WorkflowLayout wrapping the form
   - SynopsisPanel → WorkflowLayout wrapping the text editor
   - CharacterPanel → WorkflowLayout wrapping the character list
   - OutlinePanel → WorkflowLayout wrapping the outline editor
   - ScriptPanel already has three-column layout (keep as-is, just fix WebSocket)

3. **AI response auto-fill**
   - Worldview: AI response parsed → fill structured form fields
   - Synopsis: AI response → fill text editor
   - Characters: AI response → refresh character list
   - Outline: AI response → refresh outline data

**Acceptance Criteria**: All 5 tabs show AI chat panel on right, WebSocket connects, messages flow.

---

### Phase D: Frontend — Synopsis Panel Redesign (2h)

**Goal**: Replace form with text editor + hidden guidance panel.

**Files to modify**:
- `frontend/src/components/scriptmind/synopsis-panel/index.tsx` — Rewrite

**Detailed Tasks**:

1. **Rich text editor**
   - Use textarea or TipTap for synopsis editing
   - Placeholder: "开始撰写你的故事梗概..."
   - Auto-save on content change

2. **AI 生成梗概 button**
   - Calls `POST /api/v1/projects/{id}/workflow/generate-synopsis`
   - Generated text fills the editor

3. **Collapsible guidance panel**
   - Toggle button: "📋 梗概结构指导"
   - Panel content: explains what a good synopsis should contain
   - Sections: 故事主线, 核心冲突, 主要转折点, 结局走向

4. **跳过此步 button**
   - Marks step as completed, allows navigation to next tab

**Acceptance Criteria**: AI generates synopsis, user edits, guidance panel toggles, skip works.

---

### Phase E: Frontend — Outline Panel Enhancements (2h)

**Goal**: Add single-episode regenerate, delete, and review button.

**Files to modify**:
- `frontend/src/components/scriptmind/outline-panel/index.tsx`

**Detailed Tasks**:

1. **Per-episode "重新生成" button**
   - Calls `PUT /api/v1/projects/{id}/outline/episodes/{n}` with AI regeneration flag
   - Only regenerates that episode, others untouched

2. **Per-episode "删除" button**
   - Confirmation dialog → removes episode from outline

3. **"AI 审查" button in toolbar**
   - Calls `POST /api/v1/projects/{id}/workflow/review`
   - Report appears in AI chat panel on right

**Acceptance Criteria**: Regenerate single episode, delete episode, review button works.

---

### Phase F: Frontend — Script Editor Fix (3h)

**Goal**: Complete three-column layout with functional scene nav and AI chat.

**Files to modify**:
- `frontend/src/components/scriptmind/script-editor/index.tsx`
- `frontend/src/components/scriptmind/scene-nav/index.tsx`
- `frontend/src/components/shared/agent-chat/index.tsx`

**Detailed Tasks**:

1. **Fix SceneNav**
   - Extract scene headings from Slate editor content
   - Update scene list in real-time as user types
   - Click scene → scroll editor to that position

2. **Fix AgentChat WebSocket**
   - Ensure WebSocket connects on page load
   - Show "已连接" status when connected
   - Handle reconnection on disconnect

3. **Add toolbar buttons**
   - "AI 生成剧本" button → calls `POST /workflow/generate-script`
   - "AI 审查" button → calls `POST /workflow/review`

4. **Collapsible quality/foreshadow panels**
   - Above AI chat panel on right
   - Quality panel: overall score + 5 metrics
   - Foreshadow panel: planted/resolved list with urgency
   - Toggle expand/collapse

**Acceptance Criteria**: Three columns render, scene nav updates, WebSocket connects, AI generate/review work.

---

### Phase G: Frontend — Upload & Export UI (3h)

**Goal**: Upload and export entries in left sidebar.

**Files to modify/create**:
- `frontend/src/components/shared/project-sidebar/index.tsx`
- NEW: `frontend/src/components/scriptmind/upload-dialog/index.tsx`
- NEW: `frontend/src/components/scriptmind/export-dialog/index.tsx`

**Detailed Tasks**:

1. **Sidebar menu items**
   - Add "上传已有内容" item below "剧本工厂"
   - Add "导出" item below "上传已有内容"

2. **Upload dialog**
   - File picker: accept .txt, .docx, .md, .fountain
   - Upload button → `POST /api/v1/agent/import-file`
   - Progress indicator during upload
   - Parse result: show extracted characters, chapter structure
   - Merge strategy: 覆盖/合并/跳过 (when existing content detected)

3. **Export dialog**
   - Format selection: JSON / Fountain
   - Download button → `GET /api/v1/projects/{id}/export/json` or `/fountain`
   - Handle empty content (FR-066): "暂无内容可导出"

**Acceptance Criteria**: Upload file, see parsed results, export as JSON/Fountain.

---

### Phase H: Frontend — Step Status & Skip (1h)

**Goal**: Show completion status on tabs, add skip buttons.

**Files to modify**:
- `frontend/src/components/scriptmind/workflow-tabs/index.tsx`
- `frontend/src/components/scriptmind/worldview-panel/index.tsx`
- `frontend/src/components/scriptmind/synopsis-panel/index.tsx`

**Detailed Tasks**:

1. **Tab status indicators**
   - ✓ icon when step has saved content
   - Spinner when AI is generating
   - Empty circle when not started

2. **Skip buttons**
   - "跳过此步" on worldview and synopsis panels
   - Marks step as completed in workflow store

**Acceptance Criteria**: Tabs show correct status, skip buttons work.
