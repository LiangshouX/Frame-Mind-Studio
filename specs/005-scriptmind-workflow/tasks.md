# Tasks: ScriptMind 剧本工作流

**Input**: Design documents from `/specs/005-scriptmind-workflow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workflow-api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 清理冗余实现，建立工作流基础设施

- [x] T001 创建 Flyway 迁移文件 V2__workflow_schema.sql，包含：projects 增加 logline、characters 增加 gender/identity/persona/overview、新建 world_settings/synopses/outlines/review_reports 表、删除 script_versions 表 — `backend-java/src/main/resources/db/migration/V2__workflow_schema.sql`
- [x] T002 删除 ScriptVersionPO 实体类 — `backend-java/src/main/java/io/framemind/modules/scriptmind/po/ScriptVersionPO.java`
- [x] T003 删除 ScriptVersionRepository — `backend-java/src/main/java/io/framemind/modules/scriptmind/repository/ScriptVersionRepository.java`
- [x] T004 删除 VersionController — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/VersionController.java`
- [x] T005 删除前端版本 API 客户端 — `frontend/src/lib/api/versions.ts`
- [x] T006 删除前端 outline 独立页面 — `frontend/src/app/projects/[id]/scriptmind/outline/page.tsx`
- [x] T007 删除前端 import 独立页面 — `frontend/src/app/projects/[id]/scriptmind/import/page.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心数据模型和前后端类型对齐，所有用户故事的基础

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 [P] 修改 ProjectPO 增加 logline 字段 — `backend-java/src/main/java/io/framemind/infrastructure/po/ProjectPO.java`
- [x] T009 [P] 修改 CharacterPO 增加 gender/identity/persona/overview 字段 — `backend-java/src/main/java/io/framemind/modules/scriptmind/po/CharacterPO.java`
- [x] T010 [P] 创建 WorldSettingPO 实体 — `backend-java/src/main/java/io/framemind/modules/scriptmind/po/WorldSettingPO.java`
- [x] T011 [P] 创建 SynopsisPO 实体 — `backend-java/src/main/java/io/framemind/modules/scriptmind/po/SynopsisPO.java`
- [x] T012 [P] 创建 OutlinePO 实体 — `backend-java/src/main/java/io/framemind/modules/scriptmind/po/OutlinePO.java`
- [x] T013 [P] 创建 ReviewReportPO 实体 — `backend-java/src/main/java/io/framemind/modules/scriptmind/po/ReviewReportPO.java`
- [x] T014 [P] 创建 WorldSettingRepository — `backend-java/src/main/java/io/framemind/modules/scriptmind/repository/WorldSettingRepository.java`
- [x] T015 [P] 创建 SynopsisRepository — `backend-java/src/main/java/io/framemind/modules/scriptmind/repository/SynopsisRepository.java`
- [x] T016 [P] 创建 OutlineRepository — `backend-java/src/main/java/io/framemind/modules/scriptmind/repository/OutlineRepository.java`
- [x] T017 [P] 创建 ReviewReportRepository — `backend-java/src/main/java/io/framemind/modules/scriptmind/repository/ReviewReportRepository.java`
- [x] T018 重构 ScriptService 移除版本管理逻辑（删除 saveVersionSnapshot/getVersionHistory/restoreVersion/diffVersions 方法） — `backend-java/src/main/java/io/framemind/modules/scriptmind/service/ScriptService.java`
- [x] T019 创建前端工作流类型定义 — `frontend/src/types/workflow.ts`
- [x] T020 修改 shared/types/script.ts 增加传统影视模型（Block 类型、Act/Sequence 结构）和角色新字段 — `shared/types/script.ts`
- [x] T021 创建 workflow-store 管理工作流步骤状态 — `frontend/src/stores/workflow-store.ts`
- [x] T022 创建 workflow.ts API 客户端 — `frontend/src/lib/api/workflow.ts`

**Checkpoint**: Foundation ready - 数据模型就绪，前后端类型对齐

---

## Phase 3: User Story 1 — 创建剧本项目 (Priority: P1) 🎯 MVP

**Goal**: 用户能创建剧本项目（短剧/微电影），系统初始化项目结构并进入工作流页面

**Independent Test**: 用户在项目列表页点击"新建项目"，填写名称、选择类型、输入梗概后点击确认，系统创建项目并跳转到剧本工作流页面

### Implementation for User Story 1

- [x] T023 [P] [US1] 创建 WorldSettingRequest/WorldSettingResponse DTO — `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/WorldSettingRequest.java`, `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/WorldSettingResponse.java`
- [x] T024 [P] [US1] 创建 SynopsisRequest/SynopsisResponse DTO — `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/SynopsisRequest.java`, `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/SynopsisResponse.java`
- [x] T025 [P] [US1] 创建 OutlineResponse DTO — `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/OutlineResponse.java`
- [x] T026 [P] [US1] 创建 ReviewReportResponse DTO — `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/ReviewReportResponse.java`
- [x] T027 [P] [US1] 创建 CharacterCreateRequest DTO — `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/CharacterCreateRequest.java`
- [ ] T028 [US1] 修改 ProjectController 支持 logline 字段和工作流状态响应 — `backend-java/src/main/java/io/framemind/core/adapter/controller/ProjectController.java`
- [ ] T029 [US1] 修改 ProjectService 增加工作流状态查询逻辑 — `backend-java/src/main/java/io/framemind/core/service/ProjectService.java`
- [ ] T030 [US1] 重构 scriptmind/page.tsx 为 5-Tab 工作流布局 — `frontend/src/app/projects/[id]/scriptmind/page.tsx`
- [ ] T031 [US1] 创建 WorkflowTabs Tab 导航组件 — `frontend/src/components/scriptmind/workflow-tabs/index.tsx`
- [ ] T032 [US1] 修改 project-store 增加工作流状态和 logline 支持 — `frontend/src/stores/project-store.ts`

**Checkpoint**: 用户能创建项目并看到 5-Tab 工作流页面（各 Tab 内容为空）

---

## Phase 4: User Story 2 — AI 对话形成创意与世界观 (Priority: P1)

**Goal**: 用户在"创意及世界观" Tab 中通过 AI 对话形成世界观设定，支持跳过

**Independent Test**: 用户进入创意及世界观 Tab，与 AI 对话讨论题材，AI 生成结构化世界观文档，用户可编辑修改

### Implementation for User Story 2

- [x] T033 [US2] 创建 WorldSettingService — `backend-java/src/main/java/io/framemind/modules/scriptmind/service/WorldSettingService.java`
- [x] T034 [US2] 创建 WorldSettingController（CRUD API） — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/WorldSettingController.java`
- [x] T035 [US2] 新增 CreativeAgent 定义（创意对话 Agent 系统提示） — `backend-java/src/main/java/io/framemind/modules/scriptmind/agent/CreativeAgent.java`
- [x] T036 [US2] 修改 AgentScopeConfig 注册 creative Agent — `backend-java/src/main/java/io/framemind/agent/config/AgentScopeConfig.java`
- [ ] T037 [US2] 修改 AgentController 增加 generate-world-setting 端点 — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/AgentController.java`
- [ ] T038 [US2] 创建 WorldViewPanel 组件（世界观 Tab，含 AI 对话和结构化编辑） — `frontend/src/components/scriptmind/worldview-panel/index.tsx`
- [ ] T039 [US2] 创建 AiChatPanel 通用 AI 对话面板组件 — `frontend/src/components/scriptmind/ai-chat-panel/index.tsx`

**Checkpoint**: 用户能在世界观 Tab 与 AI 对话并生成/编辑世界观设定

---

## Phase 5: User Story 3 — 设定作品梗概 (Priority: P1)

**Goal**: 用户在"梗概" Tab 中通过 AI 生成或手动编写梗概，支持跳过

**Independent Test**: 用户在梗概 Tab 点击"AI 生成梗概"，系统基于世界观设定生成梗概文本，用户可编辑

### Implementation for User Story 3

- [x] T040 [US3] 创建 SynopsisService — `backend-java/src/main/java/io/framemind/modules/scriptmind/service/SynopsisService.java`
- [x] T041 [US3] 创建 SynopsisController（CRUD API） — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/SynopsisController.java`
- [ ] T042 [US3] 修改 AgentController 增加 generate-synopsis 端点 — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/AgentController.java`
- [ ] T043 [US3] 创建 SynopsisPanel 组件（梗概 Tab，含 AI 生成和手动编辑） — `frontend/src/components/scriptmind/synopsis-panel/index.tsx`

**Checkpoint**: 用户能在梗概 Tab 生成/编辑梗概内容

---

## Phase 6: User Story 4 — 设计角色 (Priority: P1)

**Goal**: 用户在"角色" Tab 中设计角色档案，支持 AI 生成和手动创建

**Independent Test**: 用户在角色 Tab 点击"AI 生成角色"，系统生成主要角色列表，用户可逐个编辑

### Implementation for User Story 4

- [x] T044 [US4] 修改 CharacterService 增加 create/delete 方法 — `backend-java/src/main/java/io/framemind/modules/scriptmind/service/CharacterService.java`
- [x] T045 [US4] 修改 CharacterController 增加 POST/DELETE 端点 — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/CharacterController.java`
- [x] T046 [US4] 修改 CharacterResponse DTO 增加新字段（gender/identity/persona/overview） — `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/CharacterResponse.java`
- [x] T047 [US4] 修改 CharacterUpdateRequest DTO 增加新字段 — `backend-java/src/main/java/io/framemind/modules/scriptmind/dto/CharacterUpdateRequest.java`
- [ ] T048 [US4] 修改 AgentController 增加 generate-characters 端点 — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/AgentController.java`
- [ ] T049 [US4] 修改 CharacterPanel 组件适配新字段，增加创建/删除功能 — `frontend/src/components/scriptmind/character-panel/index.tsx`
- [ ] T050 [US4] 修改 characters.ts API 客户端增加 create/delete — `frontend/src/lib/api/characters.ts`

**Checkpoint**: 用户能在角色 Tab 创建/编辑/删除角色，支持 AI 生成

---

## Phase 7: User Story 5 — 设计剧情大纲 (Priority: P1)

**Goal**: 用户在"大纲" Tab 中查看和编辑结构化大纲，支持 AI 生成和单集重新生成

**Independent Test**: 用户点击"AI 生成大纲"，系统生成结构化大纲，用户可逐集编辑

### Implementation for User Story 5

- [x] T051 [US5] 创建 OutlineService — `backend-java/src/main/java/io/framemind/modules/scriptmind/service/OutlineService.java`
- [x] T052 [US5] 创建 OutlineController（CRUD API + 单集更新） — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/OutlineController.java`
- [ ] T053 [US5] 修改 AgentController 增加 generate-outline 端点（复用现有 PipelineOrchestrator） — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/AgentController.java`
- [ ] T054 [US5] 创建 OutlinePanel 组件（大纲 Tab，按集/幕展示，支持展开编辑） — `frontend/src/components/scriptmind/outline-panel/index.tsx`

**Checkpoint**: 用户能在大纲 Tab 查看/编辑结构化大纲

---

## Phase 8: User Story 6 — 逐章编写剧本内容 (Priority: P1)

**Goal**: 用户在"剧本内容" Tab 中查看和编辑剧本，支持 AI 生成整集和手动编辑

**Independent Test**: 用户选择第一集点击"AI 生成剧本"，系统生成完整剧本内容，用户可在编辑器中修改

### Implementation for User Story 6

- [x] T055 [US6] 修改 ScriptController 适配工作流 API（PUT 全量覆盖 + PUT 单集更新） — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/ScriptController.java`
- [ ] T056 [US6] 修改 AgentController 增加 generate-script 端点 — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/AgentController.java`
- [ ] T057 [US6] 修改 scriptmind/page.tsx 中剧本内容 Tab 集成 ScriptEditor — `frontend/src/app/projects/[id]/scriptmind/page.tsx`
- [ ] T058 [US6] 修改 ScriptEditor 适配双数据模型（短剧 Beat + 微电影 Block） — `frontend/src/components/scriptmind/script-editor/index.tsx`

**Checkpoint**: 用户能在剧本内容 Tab 生成/编辑剧本

---

## Phase 9: User Story 9 — AI 对话贯穿全流程 (Priority: P1)

**Goal**: 所有 Tab 中的 AI 对话能自动读取前序步骤内容作为上下文，生成内容自动注入数据区域

**Independent Test**: 用户在任意 Tab 的 AI 对话框中输入请求，AI 基于当前步骤上下文生成响应，内容自动注入

### Implementation for User Story 9

- [ ] T059 [US9] 修改 PipelineOrchestrator 增加跨步骤上下文组装逻辑 — `backend-java/src/main/java/io/framemind/agent/orchestration/PipelineOrchestrator.java`
- [ ] T060 [US9] 实现 AI 生成内容的 WebSocket content_inject 消息类型 — `backend-java/src/main/java/io/framemind/agent/hook/StreamingHook.java`
- [ ] T061 [US9] 修改 AiChatPanel 支持 content_inject 消息处理和预览区暂存 — `frontend/src/components/scriptmind/ai-chat-panel/index.tsx`
- [ ] T062 [US9] 修改 agent-store 增加 content_inject 状态管理 — `frontend/src/stores/agent-store.ts`
- [ ] T063 [US9] 实现跳过步骤时的提示逻辑（缺少前序设定信息时建议补充） — `frontend/src/components/scriptmind/ai-chat-panel/index.tsx`

**Checkpoint**: AI 对话在所有 Tab 中能自动获取上下文并注入内容

---

## Phase 10: User Story 7 — AI + 人工审查修订 (Priority: P2)

**Goal**: 用户能对剧本进行逐集或全量 AI 审查，查看结构化报告并逐条处理建议

**Independent Test**: 用户点击"AI 审查"，系统生成审查报告，用户逐条采纳/忽略/手动修改

### Implementation for User Story 7

- [x] T064 [US7] 创建 ReviewService — `backend-java/src/main/java/io/framemind/modules/scriptmind/service/ReviewService.java`
- [x] T065 [US7] 创建 ReviewController（审查触发 + 报告查询 + 问题状态更新） — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/ReviewController.java`
- [ ] T066 [US7] 修改 AgentController 增加 review 端点（支持 full/episode scope） — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/AgentController.java`
- [ ] T067 [US7] 修改 ScriptDoctorAgent 系统提示适配逐集审查和全量审查 — `backend-java/src/main/java/io/framemind/modules/scriptmind/agent/ScriptDoctorAgent.java`
- [ ] T068 [US7] 创建 ReviewPanel 组件（审查报告展示，按维度筛选，逐条处理） — `frontend/src/components/scriptmind/review-panel/index.tsx`

**Checkpoint**: 用户能触发 AI 审查并处理审查建议

---

## Phase 11: User Story 8 — 上传已有剧本/小说一键解析 (Priority: P2)

**Goal**: 用户上传已有文件，系统自动解析并填充到工作流各步骤

**Independent Test**: 用户上传 TXT 文件，系统解析后自动识别章节和角色，填充到对应 Tab

### Implementation for User Story 8

- [ ] T069 [US8] 修改 ImportService 增加自动填充逻辑（解析结果写入 world_settings/synopses/characters/scripts） — `backend-java/src/main/java/io/framemind/modules/scriptmind/service/ImportService.java`
- [ ] T070 [US8] 修改 AgentController 的 import-file/import-url 端点增加合并策略参数 — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/AgentController.java`
- [ ] T071 [US8] 在 scriptmind/page.tsx 中增加"上传已有内容"入口和合并策略选择 UI — `frontend/src/app/projects/[id]/scriptmind/page.tsx`

**Checkpoint**: 用户能上传文件并自动填充到工作流各步骤

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: 导出功能、端到端优化

- [x] T072 创建 ExportService（JSON + Fountain 导出） — `backend-java/src/main/java/io/framemind/modules/scriptmind/service/ExportService.java`
- [x] T073 创建 ExportController — `backend-java/src/main/java/io/framemind/modules/scriptmind/controller/ExportController.java`
- [ ] T074 在 scriptmind/page.tsx 中增加导出按钮和格式选择 — `frontend/src/app/projects/[id]/scriptmind/page.tsx`
- [ ] T075 运行 quickstart.md 验证场景确保端到端可用 — `specs/005-scriptmind-workflow/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3-9 (P1 Stories)**: All depend on Phase 2 completion
  - US1 (项目创建) must complete first — other stories need a project
  - US2-6, US9 can proceed after US1 — largely independent
  - US9 (AI 对话贯穿) should be done after US2-6 to integrate with all Tabs
- **Phase 10-11 (P2 Stories)**: Depend on P1 stories being complete
- **Phase 12 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (创建项目)**: Depends on Phase 2 — No other story dependencies
- **US2 (创意及世界观)**: Depends on US1 — Independent of US3-8
- **US3 (梗概)**: Depends on US1 — Independent of US2, US4-8
- **US4 (角色)**: Depends on US1 — Independent of US2-3, US5-8
- **US5 (大纲)**: Depends on US1 — Independent of US2-4, US6-8
- **US6 (剧本内容)**: Depends on US1 — Independent of US2-5, US7-8
- **US9 (AI 对话贯穿)**: Depends on US2-6 — Integrates across all Tabs
- **US7 (审查修订)**: Depends on US6 — Needs script content to review
- **US8 (上传解析)**: Depends on US1 — Independent of US2-7

### Within Each User Story

- PO/Repository → Service → Controller → DTO → Frontend Component
- API 后端先于前端组件
- 核心功能先于集成优化

### Parallel Opportunities

- Phase 2 中 T008-T017（PO 和 Repository）可全部并行
- Phase 3 中 T023-T027（DTO）可全部并行
- US2-US6 的后端 Service/Controller 可并行开发（不同文件）
- US2-US6 的前端 Panel 组件可并行开发（不同文件）

---

## Implementation Strategy

### MVP First (User Story 1 + Core Workflow)

1. Complete Phase 1: Setup（清理冗余）
2. Complete Phase 2: Foundational（数据模型）
3. Complete Phase 3: US1 创建项目
4. Complete Phase 4-8: US2-US6 核心工作流
5. **STOP and VALIDATE**: 测试完整工作流（创建→世界观→梗概→角色→大纲→剧本）
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 数据基础就绪
2. US1 → 创建项目 → 可测试
3. US2-US6 → 核心工作流 → 可测试（MVP!）
4. US9 → AI 对话贯穿 → 体验提升
5. US7 → 审查修订 → 质量保障
6. US8 → 上传解析 → 扩展能力
7. Polish → 导出/优化 → 完整功能

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
