# Tasks: ScriptMind 剧本工作流补全

**Input**: Design documents from `/specs/006-scriptmind-completion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Backend stub wiring — the 4 WorkflowController stubs that block all AI generation features.

- [X] T001 [P] Wire `POST /workflow/generate-characters` to `CharacterDesignerAgent` in `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/WorkflowController.java`
- [X] T002 [P] Add `executeCharacterGeneration()` pipeline to `backend-java/src/main/java/io/framemind/agent/orchestration/PipelineOrchestrator.java`
- [X] T003 [P] Wire `POST /workflow/generate-outline` to existing `PipelineOrchestrator.executeOutlineGeneration()` in `WorkflowController.java`
- [X] T004 [P] Add `executeScriptGeneration()` pipeline to `PipelineOrchestrator.java`
- [X] T005 [P] Wire `POST /workflow/generate-script` to new script generation pipeline in `WorkflowController.java`
- [X] T006 [P] Add `executeReview()` pipeline to `PipelineOrchestrator.java`
- [X] T007 [P] Wire `POST /workflow/review` to review pipeline in `WorkflowController.java`

**Checkpoint**: All 4 workflow endpoints return real agent results via WebSocket instead of stub responses.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fix WebSocket connection and create shared layout component that ALL user stories depend on.

- [X] T008 Fix WebSocket connection in `frontend/src/components/shared/agent-chat/index.tsx` — ensure `connectAgentWebSocket()` is called on mount, show "已连接"/"未连接" status correctly
- [X] T009 Create `WorkflowLayout` component in `frontend/src/components/scriptmind/workflow-layout/index.tsx` — flex layout with left content (60%) + right AI chat panel (40%), accepts `step` prop for WebSocket session
- [X] T010 Update `frontend/src/app/projects/[id]/scriptmind/page.tsx` to use `WorkflowLayout` wrapper for all tabs except script (which has its own three-column layout)

**Checkpoint**: WebSocket connects on all pages, shared layout component ready for all panels.

---

## Phase 3: User Story 1 — 角色管理 CRUD (Priority: P1) 🎯 MVP

**Goal**: Users can create, edit, delete, AI generate, and AI optimize characters.

**Independent Test**: Enter 角色 tab → click "AI 生成角色" → see character cards → click card to edit → save → delete character → confirm removal.

### Implementation for User Story 1

- [X] T011 [US1] Rewrite `frontend/src/components/scriptmind/character-panel/index.tsx` — character list view with cards grouped by role (主角/反派/配角/次要), empty state "暂无角色" with action buttons
- [X] T012 [US1] Add "AI 生成角色" button to character panel — calls `POST /api/v1/projects/{id}/workflow/generate-characters`, shows loading spinner, refreshes list on WebSocket `complete`
- [X] T013 [US1] Add "新增角色" button and inline creation form — fields: 姓名, 性别(select), 性格标签(input), 身份定位(textarea), 人物小传(textarea), conditional fields: persona (short drama) / background+arc (movie)
- [X] T014 [US1] Add click-to-edit on character cards — expand to editable form, auto-save on blur via `PATCH /api/v1/projects/{id}/characters/{charId}`
- [X] T015 [US1] Add "AI 优化" button per character — calls `POST /api/v1/agent/optimize-segment`, shows 2-3 alternatives, user picks one to replace
- [X] T016 [US1] Add delete button per character with confirmation dialog — calls `DELETE /api/v1/projects/{id}/characters/{charId}`, shows warning about outline/script references

**Checkpoint**: Character CRUD fully functional with AI generate and optimize.

---

## Phase 4: User Story 2 — 世界观 AI 对话交互 (Priority: P1)

**Goal**: Users can interact with AI via chat to build worldview, with structured form auto-fill.

**Independent Test**: Enter 创意及世界观 tab → type in AI chat → AI responds → structured fields auto-fill → save → switch tabs and return → data persists.

### Implementation for User Story 2

- [X] T017 [US2] Wrap `WorldviewPanel` in `WorkflowLayout` — right side shows AI chat panel, left side shows structured form
- [X] T018 [US2] Add "跳过此步" button to `frontend/src/components/scriptmind/worldview-panel/index.tsx` — marks step as completed in workflow store
- [X] T019 [US2] Implement AI response → form field auto-fill — parse AI chat responses for worldview data (genre_type, style_tone, era_background, etc.) and populate corresponding form fields
- [X] T020 [US2] Ensure auto-save on form field changes — call `PUT /api/v1/projects/{id}/world-setting` on field blur

**Checkpoint**: Worldview panel with AI chat, auto-fill, skip, and auto-save.

---

## Phase 5: User Story 3 — 项目类型修正 (Priority: P1)

**Goal**: Project creation uses "短剧/微电影" instead of "短剧/漫画/电影".

**Independent Test**: Go to /projects/new → see "短剧" and "微电影" options → select each → verify correct format in created project.

### Implementation for User Story 3

- [X] T021 [US3] Update `FORMAT_OPTIONS` in `frontend/src/app/projects/new/page.tsx` — change from `[{short_drama, 短剧}, {comic, 漫画}, {movie, 电影}]` to `[{short_drama, 短剧}, {movie, 微电影}]`
- [X] T022 [US3] Update `createProject` API call in project store to pass correct format value

**Checkpoint**: Project creation shows correct options, projects created with proper format.

---

## Phase 6: User Story 4 — 剧本编辑器三栏布局 (Priority: P1)

**Goal**: Three-column layout with functional scene nav, editor, and AI chat.

**Independent Test**: Enter 剧本内容 tab → see scene nav (left), editor (center), AI chat (right) → type scene heading → scene nav updates → click scene → editor scrolls.

### Implementation for User Story 4

- [X] T023 [US4] Fix `SceneNav` component in `frontend/src/components/scriptmind/scene-nav/index.tsx` — extract scene headings from Slate editor content, update list in real-time
- [X] T024 [US4] Add click-to-scroll in SceneNav — clicking a scene scrolls the editor to that position
- [X] T025 [US4] Fix AgentChat WebSocket in script editor context — ensure WebSocket connects when entering 剧本内容 tab
- [X] T026 [US4] Add "AI 生成剧本" button to editor toolbar — calls `POST /api/v1/projects/{id}/workflow/generate-script`
- [X] T027 [US4] Add collapsible quality panel above AI chat — calls `GET /api/v1/projects/{id}/script/quality`, shows overall score + 5 metrics
- [X] T028 [US4] Add collapsible foreshadow panel above AI chat — calls `GET /api/v1/projects/{id}/foreshadows`, shows status/urgency list

**Checkpoint**: Three-column layout complete with functional scene nav, AI chat, quality and foreshadow panels.

---

## Phase 7: User Story 5 — 梗概面板完善 (Priority: P1)

**Goal**: Synopsis panel with text editor, AI generate, guidance, and skip.

**Independent Test**: Enter 梗概 tab → see text editor → click "AI 生成梗概" → text fills editor → toggle guidance panel → edit text → save → skip step.

### Implementation for User Story 5

- [X] T029 [US5] Rewrite `frontend/src/components/scriptmind/synopsis-panel/index.tsx` — replace form with large textarea/text editor, placeholder "开始撰写你的故事梗概..."
- [X] T030 [US5] Wrap SynopsisPanel in `WorkflowLayout` — AI chat panel on right
- [X] T031 [US5] Add "AI 生成梗概" button — calls `POST /api/v1/projects/{id}/workflow/generate-synopsis`, generated text fills editor
- [X] T032 [US5] Add collapsible "📋 梗概结构指导" panel — explains story structure (主线/冲突/转折/结局)
- [X] T033 [US5] Add "跳过此步" button — marks step as completed
- [X] T034 [US5] Implement auto-save on content change — calls `PUT /api/v1/projects/{id}/synopsis`

**Checkpoint**: Synopsis panel with text editor, AI generate, guidance, skip, auto-save.

---

## Phase 8: User Story 6 — 大纲面板完善 (Priority: P1)

**Goal**: Outline panel with per-episode regenerate, delete, and review button.

**Independent Test**: Enter 大纲 tab → generate outline → click "重新生成" on one episode → only that episode updates → delete one episode → click "AI 审查" → report in chat.

### Implementation for User Story 6

- [X] T035 [US6] Wrap OutlinePanel in `WorkflowLayout` — AI chat panel on right
- [X] T036 [US6] Add "重新生成" button per episode in `frontend/src/components/scriptmind/outline-panel/index.tsx` — calls `PUT /api/v1/projects/{id}/outline/episodes/{n}`
- [X] T037 [US6] Add "删除" button per episode with confirmation — removes episode from outline
- [X] T038 [US6] Add "AI 审查" button to outline toolbar — calls `POST /api/v1/projects/{id}/workflow/review`, report appears in AI chat panel

**Checkpoint**: Outline panel with per-episode actions and review.

---

## Phase 9: User Story 7 — 上传解析功能 (Priority: P2)

**Goal**: Upload existing scripts/novels with auto-parsing and merge strategy.

**Independent Test**: Click "上传已有内容" in sidebar → select .txt file → upload → see parse results → confirm → characters/outline/script populated.

### Implementation for User Story 7

- [X] T039 [P] [US7] Add "上传已有内容" menu item to `frontend/src/components/shared/project-sidebar/index.tsx`
- [X] T040 [US7] Create upload dialog component in `frontend/src/components/scriptmind/upload-dialog/index.tsx` — file picker (.txt/.docx/.md/.fountain), upload button, progress indicator
- [X] T041 [US7] Implement upload flow — calls `POST /api/v1/agent/import-file`, shows parse results (extracted characters, chapter structure)
- [X] T042 [US7] Add merge strategy selection — 覆盖/合并/跳过 when existing content detected

**Checkpoint**: Upload functionality working with parse results and merge strategy.

---

## Phase 10: User Story 8 — 导出功能 (Priority: P2)

**Goal**: Export scripts as JSON or Fountain format.

**Independent Test**: Click "导出" in sidebar → select JSON → file downloads → select Fountain → .fountain file downloads.

### Implementation for User Story 8

- [X] T043 [P] [US8] Add "导出" menu item to `frontend/src/components/shared/project-sidebar/index.tsx`
- [X] T044 [US8] Create export dialog component in `frontend/src/components/scriptmind/export-dialog/index.tsx` — format selection (JSON/Fountain), download button
- [X] T045 [US8] Implement export flow — calls `GET /api/v1/projects/{id}/export/json` or `/fountain`, triggers file download
- [X] T046 [US8] Handle empty content case — show "暂无内容可导出" message (FR-066)

**Checkpoint**: Export functionality working for both formats.

---

## Phase 11: User Story 9 — 审查修订功能 (Priority: P2)

**Goal**: AI review with structured report and adopt/ignore workflow.

**Independent Test**: Click "AI 审查" → report in chat → click "采纳" on suggestion → content updated.

### Implementation for User Story 9

- [X] T047 [US9] Add "AI 审查" button to script editor toolbar in `frontend/src/components/scriptmind/script-editor/toolbar.tsx` — calls `POST /api/v1/projects/{id}/workflow/review`
- [X] T048 [US9] Render review report in AgentChat panel — structured display of issues with location, description, suggestion
- [X] T049 [US9] Add "采纳"/"忽略"/"手动修改" actions per issue — "采纳" calls `PATCH /api/v1/projects/{id}/review-reports/{reportId}/issues/{issueId}` with status update
- [X] T050 [US9] Implement "采纳" content replacement — apply AI suggestion to script content at specified location

**Checkpoint**: Review workflow complete with adopt/ignore.

---

## Phase 12: User Story 10 — 伏笔追踪与质量面板 (Priority: P2)

**Goal**: Foreshadow tracking and quality metrics panels on script page.

**Independent Test**: Enter 剧本内容 tab → expand quality panel → see metrics → expand foreshadow panel → see foreshadow list.

### Implementation for User Story 10

- [X] T051 [P] [US10] Quality panel already built in T027 — verify it displays correctly with real data
- [X] T052 [P] [US10] Foreshadow panel already built in T028 — verify it displays correctly with real data
- [X] T053 [US10] Add high-urgency foreshadow highlighting — gold background + warning icon for urgency=high

**Checkpoint**: Quality and foreshadow panels functional with correct data display.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Final polish across all stories.

- [X] T054 [P] Add "跳过此步" button to 梗概 tab (if not already in T033)
- [X] T055 [P] Update `WorkflowTabs` in `frontend/src/components/scriptmind/workflow-tabs/index.tsx` — show ✓ when step has content, spinner when generating
- [X] T056 Run quickstart.md validation scenarios V1-V10
- [X] T057 Fix any console errors found during testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3-12 (User Stories)**: All depend on Phase 2 completion
  - US1 (角色) and US2 (世界观) can run in parallel
  - US3 (项目类型) is trivial, can run anytime after Phase 2
  - US4 (编辑器) and US5 (梗概) can run in parallel
  - US6 (大纲) depends on US4 (shared layout pattern)
  - US7 (上传) and US8 (导出) are independent, can run in parallel
  - US9 (审查) depends on US4 (script editor toolbar)
  - US10 (伏笔/质量) depends on US4 (panels in script page)
- **Phase 13 (Polish)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (角色 CRUD)**: Independent after Phase 2
- **US2 (世界观 AI)**: Independent after Phase 2
- **US3 (项目类型)**: Independent after Phase 2
- **US4 (编辑器布局)**: Independent after Phase 2
- **US5 (梗概)**: Independent after Phase 2
- **US6 (大纲)**: Depends on US4 (uses same WorkflowLayout pattern)
- **US7 (上传)**: Independent after Phase 2
- **US8 (导出)**: Independent after Phase 2
- **US9 (审查)**: Depends on US4 (toolbar buttons)
- **US10 (伏笔/质量)**: Depends on US4 (panels in script page)

### Parallel Opportunities

- Phase 1: T001-T007 all parallel (different files)
- Phase 2: T008-T010 can run in parallel
- Phase 3+ (after Phase 2):
  - US1 (T011-T016) and US2 (T017-T020) in parallel
  - US3 (T021-T022) anytime
  - US4 (T023-T028) and US5 (T029-T034) in parallel
  - US7 (T039-T042) and US8 (T043-T046) in parallel

---

## Implementation Strategy

### MVP First (US1: 角色 CRUD)

1. Complete Phase 1: Backend stubs wired
2. Complete Phase 2: WebSocket fixed, layout component ready
3. Complete Phase 3: Character panel with full CRUD + AI
4. **STOP and VALIDATE**: Test character creation, edit, delete, AI generate
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. + US1 (角色) → Test → Deploy (MVP!)
3. + US2 (世界观) + US3 (项目类型) → Test → Deploy
4. + US4 (编辑器) + US5 (梗概) → Test → Deploy
5. + US6 (大纲) → Test → Deploy
6. + US7 (上传) + US8 (导出) → Test → Deploy
7. + US9 (审查) + US10 (伏笔/质量) → Test → Deploy
8. Polish → Final release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
