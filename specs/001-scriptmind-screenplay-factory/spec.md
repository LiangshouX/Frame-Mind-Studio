# Feature Specification: ScriptMind 剧本工厂

**Feature Branch**: `001-scriptmind-screenplay-factory`

**Created**: 2026-06-16

**Status**: Draft

**Input**: 根据 @docs/Product-Design-Specification.md 文档中的 "PART III — ScriptMind 剧本工厂" 部分的需求内容，编写 Spec 规格

## Clarifications

### Session 2026-06-16

- Q: What user access model should ScriptMind support? → A: No auth/authorization for initial version — single-user local deployment via Docker, configure AI settings and run locally.
- Q: How should the system communicate progress during AI generation? → A: Stage-based progress with agent output streaming — show current agent stage (Showrunner/WorldBuilder/etc.) and stream its text output to the user.
- Q: How should the system handle concurrent edits to the same script? → A: Last-write-wins with auto-save — each tab saves independently, version history provides recovery for accidental overwrites.
- Q: Should scripts have explicit workflow states? → A: No formal states for initial version — script is always editable, user controls progression implicitly. Full workflow states (draft → in_review → approved → archived) documented as future consideration.
- Q: How should the system handle LLM API rate limits and cost guardrails? → A: Per-project token budget with configurable warning threshold (warn at 80%, hard stop at 100%) + retry with exponential backoff on 429 rate limit errors.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — 一句话创意生成完整大纲 (Priority: P1)

用户输入一句话梗概（如"写一个现代都市复仇短剧，女主被渣男背叛后逆袭"），系统通过 AI Agent 协作自动解析意图、构建设定、设计角色、审校并生成结构化的剧集大纲，包含集数规划、主线脉络和关键反转点。

**Why this priority**: 这是 ScriptMind 最核心的入口功能，将用户的模糊创意转化为可执行的结构化大纲，是整个创作流程的起点。没有此功能，后续所有模块无法启动。

**Independent Test**: 用户在输入框中输入一句话梗概，选择风格预设后点击生成，系统返回包含集数规划、每集摘要和钩子的完整大纲，用户可逐集查看详情。

**Acceptance Scenarios**:

1. **Given** 用户输入"写一个现代都市复仇短剧，女主被渣男背叛后逆袭"并选择"逆袭"风格预设，**When** 点击"生成大纲"，**Then** 系统在 60 秒内返回一份包含 8-100 集规划的结构化大纲，每集包含标题、摘要、关键事件和结尾钩子
2. **Given** 系统生成大纲后进入人类审核节点，**When** 用户选择"批准"，**Then** 大纲定稿并保存，可用于后续分镜流程
3. **Given** 系统生成大纲后进入人类审核节点，**When** 用户选择"要求修改"并提供反馈，**Then** 系统根据反馈重新生成修订版大纲
4. **Given** 用户输入过于简短或模糊（如"写个故事"），**When** 系统尝试解析意图，**Then** 系统提示用户补充关键信息（题材、目标形态、大致集数）
5. **Given** AI 生成过程正在进行，**When** 用户查看界面，**Then** 系统显示当前所处的 Agent 阶段（Showrunner/WorldBuilder/CharacterDesigner/ScriptDoctor）并实时流式输出该 Agent 的文本内容

---

### User Story 2 — 多段大纲细化为标准剧本 (Priority: P1)

用户粘贴已有的大纲文本（Markdown 或编号列表格式），系统自动解析并将其细化为包含场景、动作、对白的标准剧本格式。

**Why this priority**: 许多创作者已有初步大纲，需要 AI 辅助细化为完整剧本。这是从"粗纲"到"细本"的关键转化能力。

**Independent Test**: 用户粘贴一份 5 段大纲文本，系统解析后生成包含场景标题、动作描述和对白的结构化剧本，用户可在编辑器中查看和修改。

**Acceptance Scenarios**:

1. **Given** 用户粘贴一份 Markdown 格式大纲（含集数标题和事件描述），**When** 点击"细化为剧本"，**Then** 系统自动识别集数、场景边界，生成包含场景标题、动作、对白的结构化剧本
2. **Given** 系统生成剧本后，**When** 用户在编辑器中修改某段对白，**Then** 修改立即生效并自动保存版本快照
3. **Given** 大纲中包含模糊描述（如"两人发生冲突"），**When** 系统细化剧本，**Then** 系统生成具体的动作和对白内容，而非保留模糊描述

---

### User Story 3 — 全文小说/剧本文件导入 (Priority: P2)

用户导入已有的小说或剧本文件（支持 `.txt`、`.docx`、`.md`、`.fountain` 格式），系统自动解析内容、识别章节/场景边界、提取角色信息并转换为标准剧本格式。

**Why this priority**: 网文作者和已有作品的创作者需要将现有内容快速转化为剧本格式，这是扩展用户群的关键能力。

**Independent Test**: 用户上传一个 `.txt` 格式的小说文件，系统返回按章节分割的剧本，自动识别出的角色列表供用户确认。

**Acceptance Scenarios**:

1. **Given** 用户上传一个包含 10 章内容的 `.txt` 小说文件，**When** 点击"导入并转换"，**Then** 系统在 120 秒内完成解析，生成按章节/场景分割的结构化剧本
2. **Given** 系统完成文件导入，**When** 展示转换结果，**Then** 同时展示自动提取的角色列表（含名称和简要描述），用户可确认或编辑
3. **Given** 用户上传 `.fountain` 格式的专业剧本文件，**When** 系统解析，**Then** 正确识别 Fountain 格式的场景标题、对白、动作等元素并转换为系统内部格式
4. **Given** 上传的文件过大（超过 50 万字），**When** 系统处理，**Then** 系统提示文件过大并建议分批导入或精简内容

---

### User Story 4 — URL 内容抓取与改编 (Priority: P2)

用户输入一个网页 URL，系统自动抓取页面正文内容，过滤噪声后提取故事文本，并将其改编为剧本格式。

**Why this priority**: 用户经常在网上发现感兴趣的故事素材，直接从 URL 导入可以大幅降低内容获取的摩擦。

**Independent Test**: 用户输入一个公开的故事网页 URL，系统抓取正文并生成剧本初稿。

**Acceptance Scenarios**:

1. **Given** 用户输入一个公开可访问的故事网页 URL，**When** 点击"抓取并改编"，**Then** 系统自动抓取页面正文，过滤广告和导航噪声，提取故事文本并转换为剧本格式
2. **Given** 输入的 URL 无法访问或返回非故事类内容，**When** 系统尝试抓取，**Then** 系统提示用户 URL 无效或内容不适用，并建议其他输入方式
3. **Given** 抓取到的内容为长篇连载，**When** 系统处理，**Then** 系统按章节自动分割并提示用户选择导入范围

---

### User Story 5 — 专业剧本编辑器 (Priority: P1)

用户在专业剧本编辑器中编写和修改剧本，支持六种元素类型（场景标题、动作、角色、对白、括号说明、转场），通过 Tab 键快速切换元素类型，场景编号自动更新。

**Why this priority**: 剧本编辑器是用户直接操作剧本的核心界面，其易用性直接影响创作效率和用户体验。

**Independent Test**: 用户在编辑器中通过 Tab 键切换元素类型，输入对白内容，场景编号自动显示和更新。

**Acceptance Scenarios**:

1. **Given** 用户在编辑器中输入内容，**When** 按下 Tab 键，**Then** 当前元素类型按 scene_heading → action → character → dialogue → parenthetical → transition 顺序循环切换
2. **Given** 用户在对白元素后按 Enter，**When** 新段落创建，**Then** 默认元素类型为 action
3. **Given** 用户在角色元素后按 Enter，**When** 新段落创建，**Then** 默认元素类型为 dialogue
4. **Given** 用户在空内容元素上按 Backspace，**When** 元素被删除，**Then** 焦点自动移到上一个元素
5. **Given** 编辑器中有多个场景标题，**When** 用户编辑内容导致场景顺序变化，**Then** 左侧边栏的场景编号自动更新
6. **Given** 用户在浏览器 A 标签页中编辑剧本，**When** 同时在 B 标签页中打开同一剧本并编辑，**Then** 两个标签页各自独立保存，以最后保存的版本为准，用户可通过版本历史恢复

---

### User Story 6 — 多集连续剧管理与伏笔追踪 (Priority: P2)

用户管理多集连续剧的集数规划，系统自动追踪伏笔的埋设与回收，ScriptDoctor Agent 在审校时检查伏笔是否合理回收。

**Why this priority**: 短剧和连载内容的核心竞争力在于伏笔和连贯性，自动追踪伏笔是区别于简单文本编辑器的关键能力。

**Independent Test**: 用户创建一个多集剧本，手动添加伏笔标记，ScriptDoctor 审校时检测到未回收的伏笔并提醒。

**Acceptance Scenarios**:

1. **Given** 用户创建一个 20 集的短剧项目，**When** AI 生成大纲，**Then** 系统自动规划每集的核心事件和结尾钩子
2. **Given** 剧本第 1 集中埋设了一个伏笔（如"捡到刻有'LQ'的戒指"），**When** ScriptDoctor 审校后续集数，**Then** 系统检测到该伏笔尚未回收并提醒用户
3. **Given** 用户拖拽调整集数顺序，**When** 顺序变更完成，**Then** 伏笔的埋设/回收集数引用自动更新
4. **Given** 所有伏笔在结局前均已回收，**When** ScriptDoctor 审校，**Then** 审校报告显示伏笔管理通过

---

### User Story 7 — 版本控制与历史回溯 (Priority: P3)

每次 AI 修改或手动编辑自动创建版本快照，用户可查看版本历史、任意版本回溯和对比差异。

**Why this priority**: 创作过程需要反复迭代，版本控制保障用户可以安全地尝试不同方向而不丢失工作成果。

**Independent Test**: 用户进行多次编辑后，在版本历史中选择一个早期版本进行回溯，确认内容恢复正确。

**Acceptance Scenarios**:

1. **Given** 用户编辑剧本并保存，**When** 查看版本历史，**Then** 列表中显示每次编辑的时间戳和变更摘要
2. **Given** 用户选择一个早期版本，**When** 点击"回溯到此版本"，**Then** 剧本内容恢复到该版本状态，当前版本作为新快照保留
3. **Given** 用户选择两个版本进行对比，**When** 打开 diff 视图，**Then** 以高亮方式展示两个版本之间的增删改差异

---

### User Story 8 — AI 辅助段落优化 (Priority: P3)

用户选中剧本中的某段内容，请求 AI 优化建议，系统提供多种改写方案供用户选择。

**Why this priority**: 这是"人机共创"的微观体现，让用户在细节层面获得 AI 辅助，提升剧本质量。

**Independent Test**: 用户选中一段对白，点击"AI 优化"，系统返回 2-3 种改写方案供选择。

**Acceptance Scenarios**:

1. **Given** 用户选中一段对白内容，**When** 点击"AI 优化建议"，**Then** 系统返回 2-3 种不同风格的改写方案
2. **Given** 系统返回改写方案，**When** 用户选择其中一个方案，**Then** 选中方案替换原内容，原内容自动保存为版本快照
3. **Given** 用户对改写方案均不满意，**When** 点击"保持原文"，**Then** 内容不做任何变更

---

### Edge Cases

- 用户输入一句话梗概后网络中断，AI 生成过程失败，系统如何处理？→ 保存草稿状态，提示用户重试
- 导入的小说文件编码不正确（如 GBK 编码的 `.txt`），系统如何处理？→ 自动检测编码，失败时提示用户转换编码
- URL 抓取目标网站有反爬机制，抓取失败如何处理？→ 提示用户手动复制文本内容并使用"大纲粘贴"方式输入
- 剧本编辑器中用户连续快速按 Tab 切换元素类型，系统如何保证响应流畅？→ 前端即时切换，不依赖后端响应
- 伏笔数量过多（超过 50 个），审校报告如何展示？→ 按重要性和集数分组展示，支持筛选和排序
- 版本历史过多（超过 100 个版本），如何管理？→ 自动合并相近时间的微小变更，保留关键节点版本
- LLM API 返回 429 速率限制错误，系统如何处理？→ 指数退避重试（最多 3 次），全部失败后提示用户稍后重试或切换模型
- 项目 Token 用量达到警告阈值（80%），系统如何处理？→ 界面显示警告提示，建议用户优化输入或升级 API 配额
- 项目 Token 用量达到硬上限（100%），系统如何处理？→ 暂停 AI 生成任务，提示用户调整预算或等待下一计费周期

## Requirements *(mandatory)*

### Functional Requirements

**创意输入与意图解析**

- **FR-001**: 系统 MUST 支持用户通过一句话梗概输入创意，并自动解析为结构化意图（题材、目标形态、目标集数、节奏、核心冲突）
- **FR-002**: 系统 MUST 支持用户粘贴 Markdown 格式或编号列表格式的大纲文本，并自动解析为结构化的集数列表
- **FR-003**: 系统 MUST 支持导入 `.txt`、`.docx`、`.md`、`.fountain` 四种文件格式的剧本/小说
- **FR-004**: 系统 MUST 支持输入网页 URL 并自动抓取正文内容，过滤广告和导航噪声
- **FR-005**: 系统 MUST 在文件导入时自动检测文件编码，支持 UTF-8、GBK 等常见编码

**大纲生成与 Agent 协作**

- **FR-006**: 系统 MUST 通过多 Agent 协作（Showrunner → WorldBuilder → CharacterDesigner → ScriptDoctor）生成结构化大纲
- **FR-007**: 系统 MUST 在大纲生成流程中设置人类审核节点，用户可选择"批准"、"要求修改"或"手动编辑"
- **FR-008**: 系统 MUST 内置至少 6 种风格预设（甜宠、悬疑、逆袭、古风、漫威风、搞笑），用户可一键选择
- **FR-009**: 系统 MUST 自动检测剧本中的平淡点、钩子缺失、爽感密度不足等节奏问题，并生成优化建议
- **FR-010**: 系统 MUST 支持 AI 模型降级与回退，首选模型失败时自动切换备选模型
- **FR-011**: 系统 MUST 在 AI 生成过程中显示当前 Agent 阶段标签（Showrunner/WorldBuilder/CharacterDesigner/ScriptDoctor）并实时流式输出该 Agent 的文本内容

**剧本编辑器**

- **FR-012**: 编辑器 MUST 支持六种元素类型：场景标题 (scene_heading)、动作 (action)、角色 (character)、对白 (dialogue)、括号说明 (parenthetical)、转场 (transition)
- **FR-013**: 编辑器 MUST 支持 Tab 键循环切换元素类型，Shift+Tab 反向切换
- **FR-014**: 编辑器 MUST 在对白后按 Enter 默认创建 action 元素，在角色后按 Enter 默认创建 dialogue 元素
- **FR-015**: 编辑器 MUST 在空内容元素上按 Backspace 删除该元素并将焦点移到上一个元素
- **FR-016**: 编辑器 MUST 在左侧边栏自动显示场景编号，随编辑自动更新
- **FR-017**: 编辑器 MUST 支持多标签页独立编辑同一剧本，采用最后写入保存策略，版本历史提供恢复能力

**多集管理与伏笔**

- **FR-018**: 系统 MUST 支持 8-100 集的短剧项目，每集时长 1-3 分钟
- **FR-019**: 系统 MUST 支持用户拖拽调整集数顺序，支持合并/拆分集
- **FR-020**: 系统 MUST 自动追踪伏笔的生命周期（埋设集数、是否回收、回收集数、关联角色）
- **FR-021**: ScriptDoctor Agent 在审校时 MUST 检查所有已埋伏笔的回收状态，对未回收伏笔生成提醒

**版本控制**

- **FR-022**: 系统 MUST 在每次 AI 修改或手动编辑后自动创建版本快照
- **FR-023**: 系统 MUST 支持任意版本回溯，回溯时保留当前版本为新快照
- **FR-024**: 系统 MUST 支持两个版本的 diff 对比视图，高亮展示增删改差异

**质量评估**

- **FR-025**: 系统 MUST 自动计算剧本质量指标：钩子强度（目标 100%）、节奏曲线（标准差 > 0.3）、角色出场均衡（40%-60%）、对白占比（30%-50%）、场景多样性（> 0.6）
- **FR-026**: 系统 MUST 在剧本编辑界面展示质量评估仪表盘，实时更新指标

**数据输出**

- **FR-027**: 系统 MUST 将剧本输出为标准化 JSON 格式，包含完整的 ScriptContent 结构（title、totalEpisodes、episodes → scenes → beats）
- **FR-028**: 系统 MUST 为每个 beat 生成镜头建议 (cameraSuggestion)，为后续分镜模块提供输入

**API 成本控制**

- **FR-029**: 系统 MUST 支持按项目配置 Token 预算，提供可配置的警告阈值（默认 80%）和硬上限（默认 100%）
- **FR-030**: 系统 MUST 在 Token 用量达到警告阈值时在界面显示警告提示
- **FR-031**: 系统 MUST 在 Token 用量达到硬上限时暂停 AI 生成任务并提示用户
- **FR-032**: 系统 MUST 在 LLM API 返回 429 速率限制错误时进行指数退避重试（最多 3 次）

### Key Entities

- **Script (剧本)**: 一个完整的剧本项目，包含标题、总集数、所有集的内容。关键属性：title、totalEpisodes、version。初始版本无正式状态机，用户通过继续下一 Pipeline 阶段隐式控制进度。
- **ScriptEpisode (剧集)**: 剧本中的单集，包含该集的所有场景。关键属性：episodeNumber、title、durationMinutes
- **ScriptScene (场景)**: 单集中的一个场景，包含地点、时间、情绪标签、在场角色和所有节拍。关键属性：sceneId、location、time、moodTags
- **ScriptBeat (节拍)**: 场景中的最小叙事单元，可以是动作、对白、情绪或转场。关键属性：beatId、type、content、character、emotion、cameraSuggestion、durationSeconds
- **Character (角色)**: 剧本中的角色档案，包含外貌、性格、关系、弧光。关键属性：name、role_type、personality_tags
- **Foreshadow (伏笔)**: 剧本中埋设的伏笔记录，追踪其生命周期。关键属性：foreshadow_id、content、planted_episode、resolved、resolved_episode、related_characters
- **StoryOutline (故事大纲)**: AI 生成的结构化大纲，包含标题、题材、梗概、集数规划、主线和反转点
- **ScriptVersion (版本快照)**: 剧本的版本历史记录，支持回溯和对比
- **ProjectBudget (项目预算)**: 每个项目的 Token 用量预算和消耗记录。关键属性：token_limit、tokens_used、warning_threshold

### Future Considerations

以下设计决策在初始版本中采用简化方案，未来迭代时可参考完整方案：

- **脚本状态机 (Script State Machine)**: 初始版本不设正式状态。未来多用户协作时可引入 `draft → in_review → approved → archived` 状态机，配合状态转换守卫和通知机制。
- **用户认证与授权 (Auth & Authorization)**: 初始版本为单用户本地部署，无需认证。未来如需支持多用户，可引入基于角色的访问控制（owner/editor/viewer）。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户输入一句话梗概后，系统在 60 秒内生成包含完整集数规划的结构化大纲
- **SC-002**: 90% 的用户能在首次使用时通过一句话梗概成功生成可用大纲，无需额外指导
- **SC-003**: 文件导入功能支持 50 万字以内的小说文件，导入处理时间不超过 120 秒
- **SC-004**: 剧本编辑器的元素类型切换响应时间低于 50 毫秒，用户无感知延迟
- **SC-005**: 伏笔追踪系统在审校时能识别 95% 以上的未回收伏笔
- **SC-006**: 版本回溯操作在 5 秒内完成，diff 对比准确率 100%
- **SC-007**: 剧本质量评估指标的计算在每次编辑保存后 3 秒内完成更新
- **SC-008**: 风格预设覆盖 6 种以上主流短剧题材，用户满意度达到 80% 以上
- **SC-009**: AI 辅助优化建议提供 2-3 种改写方案，用户接受率达到 60% 以上
- **SC-010**: 系统支持同时处理 10 个以上并发剧本生成请求，无明显性能下降
- **SC-011**: AI 生成过程中，用户可实时看到当前 Agent 阶段和流式输出内容，无需等待全部完成
- **SC-012**: LLM API 429 错误的自动重试成功率达到 80% 以上（在 API 服务恢复正常后）

## Assumptions

- 用户已配置至少一个 LLM 服务的 API Key（如通义千问、GPT-4o、Claude 等），系统通过 AI Gateway 层统一路由调用
- 用户具备基本的剧本/小说创作知识，理解场景、对白、动作等基本概念
- 文件导入的单文件大小上限为 50 万字（约 1MB 纯文本），超出需分批导入
- URL 抓取仅支持公开可访问的网页，不支持需要登录或付费的内容
- 版本历史默认保留最近 100 个关键版本，自动合并相近时间的微小变更
- 剧本编辑器为 Web 端应用，支持主流现代浏览器（Chrome、Firefox、Safari、Edge 最新两个版本）
- 伏笔追踪依赖 ScriptDoctor Agent 的审校能力，其准确率受所选 LLM 模型影响
- 风格预设的"漫威风"和"搞笑"等预设为初始版本，后续可通过社区贡献扩展
- 剧本输出的 JSON 格式为下游模块（StoryboardAI、StyleForge）的标准输入，格式变更需协调
- 本 Spec 覆盖 ScriptMind 剧本工厂模块，不包含 StoryboardAI、StyleForge、MotionCore、VoiceStage、SoundGen 和 Export 模块的功能
- 初始版本为单用户本地部署（Docker），无用户认证、角色或授权机制
- Token 预算的默认值和阈值为建议值，用户可根据自身 API 配额自行调整
