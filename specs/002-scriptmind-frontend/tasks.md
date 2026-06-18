# Tasks: ScriptMind 前端重建

**Input**: Design documents from `/specs/002-scriptmind-frontend/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/frontend-api-client.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: 清除现有代码，初始化项目结构和依赖

- [x] T001 删除 frontend/src/ 下所有现有文件和目录（保留 package.json、tailwind.config.ts、tsconfig.json、next.config.js、postcss.config.js）
- [x] T002 检查并更新 frontend/package.json 中的依赖版本，添加缺失依赖（@stomp/stompjs、sockjs-client、zustand、slate、slate-react、slate-history、lucide-react、class-variance-authority、clsx、tailwind-merge）
- [x] T003 运行 npm install 安装依赖
- [x] T004 初始化 shadcn/ui（npx shadcn@latest init），配置 components.json 和 globals.css 主题变量
- [x] T005 安装 shadcn/ui 组件：button、card、input、textarea、badge、dialog、tabs、scroll-area、select、toast、progress、tooltip、dropdown-menu、separator、skeleton 到 frontend/src/components/ui/
- [x] T006 创建 frontend/src/app/globals.css，定义 CSS 变量（颜色系统、字体、间距）和全局样式
- [x] T007 创建 frontend/src/app/layout.tsx，配置全局布局（字体加载、CSS 导入、html lang="zh-CN"）
- [x] T008 创建 frontend/src/lib/utils.ts，实现 cn() className 合并工具（clsx + tailwind-merge）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基础设施，所有用户故事的前提条件

**⚠️ CRITICAL**: 用户故事实现必须等此阶段完成

### TypeScript 类型定义

- [x] T009 [P] 创建 frontend/src/types/project.ts，定义 Project、ProjectDetail 接口
- [x] T010 [P] 创建 frontend/src/types/script.ts，定义 Script、ScriptContent、ScriptEpisode、ScriptScene、ScriptBeat 接口
- [x] T011 [P] 创建 frontend/src/types/character.ts，定义 Character、CharacterRelationship 接口
- [x] T012 [P] 创建 frontend/src/types/foreshadow.ts，定义 Foreshadow 接口
- [x] T013 [P] 创建 frontend/src/types/agent.ts，定义 AgentSession、AgentMessage、AgentStage 接口
- [x] T014 [P] 创建 frontend/src/types/version.ts，定义 ScriptVersion、VersionDiff 接口
- [x] T015 [P] 创建 frontend/src/types/quality.ts，定义 QualityMetrics、MetricItem、ForeshadowStatus 接口
- [x] T016 [P] 创建 frontend/src/types/api.ts，定义 ApiError、ErrorCode、ApiResponse 通用类型
- [x] T017 创建 frontend/src/types/index.ts，统一导出所有类型

### API 客户端层

- [x] T018 创建 frontend/src/lib/api/client.ts，实现 fetch 封装（Base URL、JSON 处理、超时控制、错误分类、429 重试）
- [x] T019 [P] 创建 frontend/src/lib/api/projects.ts，实现 createProject、listProjects、getProject、deleteProject
- [x] T020 [P] 创建 frontend/src/lib/api/scripts.ts，实现 getScript、updateScript
- [x] T021 [P] 创建 frontend/src/lib/api/agent.ts，实现 generateOutline、refineScript、importFile、importUrl、optimizeSegment、getAgentSession、submitReview
- [x] T022 [P] 创建 frontend/src/lib/api/characters.ts，实现 listCharacters、updateCharacter
- [x] T023 [P] 创建 frontend/src/lib/api/foreshadows.ts，实现 listForeshadows、updateForeshadow
- [x] T024 [P] 创建 frontend/src/lib/api/versions.ts，实现 listVersions、getVersion、restoreVersion、compareVersions
- [x] T025 [P] 创建 frontend/src/lib/api/quality.ts，实现 getQualityMetrics
- [x] T026 [P] 创建 frontend/src/lib/api/settings.ts，实现 listApiKeys、updateApiKey、listModels

### 状态管理

- [x] T027 创建 frontend/src/stores/project-store.ts，实现项目列表状态（列表、当前项目、CRUD 操作、loading/error 状态）
- [x] T028 创建 frontend/src/stores/agent-store.ts，实现 Agent 会话状态（阶段、消息列表、Token 消耗、审核状态、连接状态）
- [x] T029 创建 frontend/src/stores/editor-store.ts，实现编辑器状态（当前元素类型、场景列表、isDirty、自动保存状态）
- [x] T030 创建 frontend/src/stores/settings-store.ts，实现设置状态（API Key 列表、模型列表）

### WebSocket 客户端

- [x] T031 创建 frontend/src/lib/websocket/stomp-client.ts，实现 STOMP WebSocket 客户端封装（连接、订阅、断开、自动重连、指数退避）

### 布局组件

- [x] T032 创建 frontend/src/components/layout/navbar.tsx，实现全局导航栏（项目名称、Pipeline 阶段导航、设置入口、Agent 进度指示器）
- [x] T033 创建 frontend/src/components/layout/error-boundary.tsx，实现全局错误边界组件
- [x] T034 创建 frontend/src/components/layout/loading.tsx，实现加载状态组件（骨架屏）
- [x] T035 创建 frontend/src/components/layout/empty-state.tsx，实现空状态引导组件
- [x] T036 创建 frontend/src/components/layout/backend-offline.tsx，实现后端不可用全屏页（重试连接按钮、草稿保留提示）

### 共享组件

- [x] T037 创建 frontend/src/components/shared/pipeline-nav/index.tsx，实现 Pipeline 阶段导航组件

### 工具函数

- [x] T038 [P] 创建 frontend/src/lib/utils/debounce.ts，实现防抖工具函数
- [x] T039 [P] 创建 frontend/src/lib/utils/format.ts，实现格式化工具（日期、字数、百分比）

### 常量定义

- [x] T040 [P] 创建 frontend/src/constants/element-types.ts，定义编辑器 6 种元素类型常量和切换顺序
- [x] T041 [P] 创建 frontend/src/constants/agent-stages.ts，定义 Agent 阶段常量（名称、中文标签、颜色）
- [x] T042 [P] 创建 frontend/src/constants/style-presets.ts，定义风格预设常量列表

### 全局错误处理

- [x] T043 创建 frontend/src/app/error.tsx，实现全局错误页面
- [x] T044 创建 frontend/src/app/not-found.tsx，实现 404 页面

**Checkpoint**: 基础设施就绪 — 可以开始并行实现用户故事

---

## Phase 3: User Story 1 — 首页与项目导航 (Priority: P1) 🎯 MVP

**Goal**: 用户能访问首页、查看项目列表、创建和删除项目

**Independent Test**: 访问首页 → 点击"打开工作台" → 新建项目 → 项目出现在列表中 → 删除项目（二次确认）

### Implementation

- [x] T045 [US1] 创建 frontend/src/app/page.tsx，实现首页（平台介绍、工作流程、Agent 团队、核心能力、CTA）
- [x] T046 [US1] 创建 frontend/src/app/projects/page.tsx，实现项目列表页（项目卡片网格、空状态引导、新建/删除操作）
- [x] T047 [US1] 创建 frontend/src/app/projects/new/page.tsx，实现新建项目页面（标题、题材标签选择、目标形态、目标集数）
- [x] T048 [US1] 实现删除项目二次确认对话框（要求输入项目名称确认），在 frontend/src/app/projects/page.tsx 中集成
- [x] T049 [US1] 创建 frontend/src/app/projects/[id]/layout.tsx，实现项目详情布局（导航栏 + 内容区）
- [x] T050 [US1] 创建 frontend/src/app/projects/[id]/page.tsx，实现项目工作台主页（项目详情、模块入口卡片）

**Checkpoint**: 用户可以访问首页、查看项目列表、创建和删除项目

---

## Phase 4: User Story 2 — 一句话创意生成完整大纲 (Priority: P1)

**Goal**: 用户在 Agent 交互面板输入梗概，AI 生成大纲，用户审核批准

**Independent Test**: 输入一句话梗概 → 选择风格预设 → Agent 阶段进度实时显示 → 流式输出 → 审核批准 → 大纲保存成功

### Implementation

- [x] T051 [P] [US2] 创建 frontend/src/hooks/shared/use-websocket.ts，实现 WebSocket 连接 Hook（连接、消息处理、自动重连、连接状态）
- [x] T052 [P] [US2] 创建 frontend/src/hooks/shared/use-agent-session.ts，实现 Agent 会话管理 Hook（发起任务、监听进度、审核提交）
- [x] T053 [US2] 创建 frontend/src/components/shared/agent-chat/stage-indicator.tsx，实现 Agent 阶段指示器（4 阶段标签、当前阶段高亮、完成状态）
- [x] T054 [US2] 创建 frontend/src/components/shared/agent-chat/message-list.tsx，实现消息列表（流式输出渲染、Agent/用户/系统消息区分）
- [x] T055 [US2] 创建 frontend/src/components/shared/agent-chat/input-bar.tsx，实现输入栏（文本输入、发送按钮、风格预设选择）
- [x] T056 [US2] 创建 frontend/src/components/shared/agent-chat/review-panel.tsx，实现人类审核面板（大纲预览、批准/修改/手动编辑按钮）
- [x] T057 [US2] 创建 frontend/src/components/shared/agent-chat/budget-warning.tsx，实现预算警告组件（80% 警告、100% 暂停）
- [x] T058 [US2] 创建 frontend/src/components/shared/agent-chat/index.tsx，组装 Agent 交互面板（集成所有子组件）
- [x] T059 [P] [US2] 创建 frontend/src/components/scriptmind/style-preset-picker/index.tsx，实现风格预设选择器
- [x] T060 [US2] 更新 frontend/src/app/projects/[id]/page.tsx，在项目工作台中集成 Agent 交互面板

**Checkpoint**: 用户可以通过 Agent 交互面板生成大纲并审核

---

## Phase 5: User Story 3 — 大纲细化为标准剧本 (Priority: P1)

**Goal**: 用户在大纲查看器中点击"细化为剧本"，系统生成结构化剧本

**Independent Test**: 已有大纲的项目 → 点击"细化为剧本" → Agent 生成进度显示 → 生成完成 → 剧本可查看

### Implementation

- [x] T061 [US3] 创建 frontend/src/components/scriptmind/outline-viewer/index.tsx，实现大纲查看器（集数规划、每集摘要、逐集展开/折叠、关键事件和结尾钩子显示）
- [x] T062 [US3] 在大纲查看器中添加"细化为剧本"操作按钮，调用 agent API 的 refineScript
- [x] T063 [US3] 创建 frontend/src/app/projects/[id]/scriptmind/outline/page.tsx，实现大纲生成页面（创意输入区 + 风格预设 + 大纲查看器）

**Checkpoint**: 用户可以查看大纲并触发细化为剧本

---

## Phase 6: User Story 4 — 专业剧本编辑器 (Priority: P1)

**Goal**: 用户在专业编辑器中编写剧本，支持 6 种元素类型、Tab 切换、场景导航、AI 优化

**Independent Test**: 在编辑器中 Tab 切换元素类型 → 输入对白 → Enter 新建段落 → 场景编号自动更新 → AI 优化建议

### Implementation

- [x] T064 [US4] 创建 frontend/src/hooks/scriptmind/use-script-editor.ts，实现编辑器状态 Hook（Slate.js 初始化、元素类型管理、自动保存、场景列表提取）
- [x] T065 [US4] 创建 frontend/src/components/scriptmind/script-editor/editor-element.tsx，实现 6 种自定义 Slate Element 渲染组件（scene_heading、action、character、dialogue、parenthetical、transition 的视觉样式）
- [x] T066 [US4] 创建 frontend/src/components/scriptmind/script-editor/index.tsx，实现剧本编辑器主组件（Slate Editor 集成、Tab/Enter/Backspace 键盘处理、自动保存逻辑）
- [x] T067 [US4] 创建 frontend/src/components/scriptmind/script-editor/toolbar.tsx，实现编辑器工具栏（元素类型切换、保存按钮、字数统计）
- [x] T068 [US4] 创建 frontend/src/components/scriptmind/script-editor/optimize.tsx，实现 AI 优化建议面板（选中文本 → 调用 optimizeSegment → 显示 2-3 种改写方案 → 选择替换）
- [x] T069 [US4] 创建 frontend/src/components/scriptmind/scene-nav/index.tsx，实现场景导航侧边栏（从编辑器内容提取 scene_heading、场景编号、地点、自动更新）
- [x] T070 [US4] 创建 frontend/src/app/projects/[id]/scriptmind/page.tsx，实现剧本编辑器页面（编辑器主体 + 场景导航侧边栏 + 角色面板占位 + 伏笔面板占位）

**Checkpoint**: 用户可以在编辑器中编写剧本，Tab 切换元素类型，场景导航自动更新

---

## Phase 7: User Story 5 — 角色管理面板 (Priority: P2)

**Goal**: 用户查看和编辑角色档案，按类型分组显示

**Independent Test**: 打开角色面板 → 按类型分组显示 → 点击角色查看详情 → 修改描述 → 保存成功

### Implementation

- [x] T071 [US5] 创建 frontend/src/components/scriptmind/character-panel/index.tsx，实现角色面板（按类型分组列表、角色卡片展开/折叠、详情编辑、空状态引导）
- [x] T072 [US5] 更新 frontend/src/app/projects/[id]/scriptmind/page.tsx，集成角色面板到编辑器页面侧边栏

**Checkpoint**: 角色面板可在编辑器页面中使用

---

## Phase 8: User Story 6 — 伏笔追踪面板 (Priority: P2)

**Goal**: 用户查看和管理伏笔状态，按状态分组显示

**Independent Test**: 打开伏笔面板 → 按状态分组 → 标记伏笔回收 → 填写回收内容 → 状态更新成功

### Implementation

- [x] T073 [US6] 创建 frontend/src/components/scriptmind/foreshadow-tracker/index.tsx，实现伏笔追踪面板（按状态分组列表、伏笔详情显示、标记回收操作、高重要性视觉标记、空状态引导）
- [x] T074 [US6] 更新 frontend/src/app/projects/[id]/scriptmind/page.tsx，集成伏笔追踪面板到编辑器页面

**Checkpoint**: 伏笔追踪面板可在编辑器页面中使用

---

## Phase 9: User Story 10 — 文件/URL 导入 (Priority: P2)

**Goal**: 用户上传文件或输入 URL，系统解析并转换为剧本

**Independent Test**: 上传 .txt 文件 → 导入进度显示 → 转换结果展示 → 或输入 URL → 抓取并改编

### Implementation

- [x] T075 [US10] 创建 frontend/src/app/projects/[id]/scriptmind/import/page.tsx，实现文件导入页面（文件上传区、URL 输入区、导入进度显示、转换结果预览、错误提示）

**Checkpoint**: 文件/URL 导入功能可用

---

## Phase 10: User Story 7 — 版本控制与历史回溯 (Priority: P3)

**Goal**: 用户查看版本历史、回溯版本、对比差异

**Independent Test**: 打开版本历史 → 版本列表显示 → 选择版本回溯 → 内容恢复 → 选择两个版本对比 → 高亮差异

### Implementation

- [x] T076 [P] [US7] 创建 frontend/src/hooks/shared/use-version-history.ts，实现版本历史 Hook（列表加载、版本回溯、版本对比）
- [x] T077 [US7] 创建 frontend/src/components/shared/version-history/diff-viewer.tsx，实现 Diff 对比查看器（高亮增删改差异）
- [x] T078 [US7] 创建 frontend/src/components/shared/version-history/index.tsx，实现版本历史面板（版本列表、回溯操作、对比操作、空状态引导）
- [x] T079 [US7] 更新 frontend/src/app/projects/[id]/scriptmind/page.tsx，集成版本历史面板

**Checkpoint**: 版本控制功能可用

---

## Phase 11: User Story 8 — 质量评估仪表盘 (Priority: P3)

**Goal**: 用户查看剧本质量指标和总体评分

**Independent Test**: 打开质量仪表盘 → 各项指标显示 → 警告项标记 → 编辑保存后指标更新

### Implementation

- [x] T080 [P] [US8] 创建 frontend/src/hooks/scriptmind/use-quality-metrics.ts，实现质量指标 Hook（指标加载、自动刷新）
- [x] T081 [US8] 创建 frontend/src/components/shared/quality-dashboard/metric-card.tsx，实现单项指标卡片（数值、目标范围、状态标记）
- [x] T082 [US8] 创建 frontend/src/components/shared/quality-dashboard/score-ring.tsx，实现总分环形图组件
- [x] T083 [US8] 创建 frontend/src/components/shared/quality-dashboard/index.tsx，组装质量评估仪表盘（指标卡片网格、伏笔状态、总分环形图）
- [x] T084 [US8] 更新 frontend/src/app/projects/[id]/scriptmind/page.tsx，集成质量评估仪表盘

**Checkpoint**: 质量评估仪表盘可用

---

## Phase 12: User Story 9 — 全局设置 (Priority: P3)

**Goal**: 用户配置 API Key 和查看可用模型

**Independent Test**: 访问设置页面 → 查看 API Key 列表 → 添加新 Key → 保存成功 → 查看模型列表

### Implementation

- [x] T085 [US9] 创建 frontend/src/app/settings/page.tsx，实现设置页面（API Key 列表、添加 Key 表单、模型列表、配置状态显示）

**Checkpoint**: 全局设置页面可用

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事的优化和完善

- [x] T086 [P] 更新 frontend/src/app/layout.tsx，集成全局错误边界和后端离线检测逻辑
- [x] T087 [P] 更新 frontend/src/components/layout/navbar.tsx，实现 Agent 任务执行期间的全局进度指示器（从 agent-store 读取状态）
- [x] T088 实现 localStorage 草稿缓存逻辑：编辑器内容变更时同步保存到 localStorage，后端恢复后提示恢复
- [x] T089 实现后端健康检查：全局定时检测后端可达性（GET /actuator/health），不可达时显示 backend-offline 页面
- [x] T090 [P] 响应式适配：确保所有页面在移动端（375px 宽度）下可用，侧边栏折叠、编辑器全屏模式
- [x] T091 [P] 优化编辑器性能：使用 React.memo、useCallback、虚拟滚动（100 集剧本场景下保持 30fps）
- [x] T092 [P] 添加 loading 状态和骨架屏：所有页面的数据加载状态处理
- [x] T093 更新 frontend/Dockerfile，确保生产构建配置正确
- [x] T094 运行 quickstart.md 中的所有验证场景，确认功能完整

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 — 立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 — 阻塞所有用户故事
- **US1 (Phase 3)**: 依赖 Foundational 完成 — 首页和项目管理
- **US2 (Phase 4)**: 依赖 Foundational 完成 — Agent 交互
- **US3 (Phase 5)**: 依赖 US2 完成（需要 Agent 交互面板触发细化）
- **US4 (Phase 6)**: 依赖 US3 完成（需要剧本内容才能编辑）
- **US5 (Phase 7)**: 依赖 US4 完成（角色面板集成到编辑器页面）
- **US6 (Phase 8)**: 依赖 US4 完成（伏笔面板集成到编辑器页面）
- **US10 (Phase 9)**: 依赖 Foundational 完成 — 独立于其他故事
- **US7 (Phase 10)**: 依赖 US4 完成（版本历史集成到编辑器页面）
- **US8 (Phase 11)**: 依赖 US4 完成（质量仪表盘集成到编辑器页面）
- **US9 (Phase 12)**: 依赖 Foundational 完成 — 独立于其他故事
- **Polish (Phase 13)**: 依赖所有用户故事完成

### User Story Dependencies Graph

```
Foundational (Phase 2)
├── US1 (首页/项目) ─────────────────────────────────┐
├── US2 (Agent大纲) ──→ US3 (大纲细化) ──→ US4 (编辑器) ─┬→ US5 (角色)
│                                                        ├→ US6 (伏笔)
│                                                        ├→ US7 (版本)
│                                                        └→ US8 (质量)
├── US10 (导入) ────────────────────────────────────────┘
└── US9 (设置) ────────────────────────────────────────┘
```

### Within Each User Story

- 类型定义 → API 客户端 → Hooks → 组件 → 页面集成
- 每个故事完成后独立验证

### Parallel Opportunities

- Phase 2 中所有标记 [P] 的类型定义任务可并行
- Phase 2 中所有标记 [P] 的 API 客户端任务可并行
- US2 中 T051/T052（Hooks）和 T053-T057（子组件）可并行
- US7 中 T076（Hook）和 T077（Diff 查看器）可并行
- US8 中 T080（Hook）、T081（指标卡片）、T082（环形图）可并行
- Phase 13 中所有标记 [P] 的任务可并行

---

## Parallel Example: User Story 2

```bash
# 并行启动 Hook 和子组件：
Task: "T051 use-websocket.ts"
Task: "T052 use-agent-session.ts"
Task: "T053 stage-indicator.tsx"
Task: "T054 message-list.tsx"
Task: "T055 input-bar.tsx"
Task: "T056 review-panel.tsx"
Task: "T057 budget-warning.tsx"
Task: "T059 style-preset-picker/index.tsx"

# 完成后组装：
Task: "T058 agent-chat/index.tsx (组装所有子组件)"
Task: "T060 集成到项目工作台页面"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (首页 + 项目管理)
4. **STOP and VALIDATE**: 验证首页加载、项目列表、新建项目、删除项目
5. 可部署/演示基础框架

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. US1 → 首页/项目管理 → Deploy/Demo (MVP!)
3. US2 → Agent 大纲生成 → Deploy/Demo
4. US3 → 大纲细化 → Deploy/Demo
5. US4 → 剧本编辑器 → Deploy/Demo (核心功能完整!)
6. US5 + US6 → 角色/伏笔 → Deploy/Demo
7. US10 → 文件导入 → Deploy/Demo
8. US7 + US8 + US9 → 版本/质量/设置 → Deploy/Demo (全功能!)
9. Polish → 优化完善

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (首页/项目)
   - Developer B: US2 (Agent 大纲) → US3 (大纲细化) → US4 (编辑器)
   - Developer C: US9 (设置) + US10 (导入)
3. US4 完成后:
   - Developer A: US5 (角色) + US6 (伏笔)
   - Developer B: US7 (版本) + US8 (质量)
   - Developer C: Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- 前端代码完全从零重建，不保留任何遗留代码
- 后端 API 契约不变，前端严格遵循 001 spec 的 API Contracts
