# Research: ScriptMind 剧本工厂

**Date**: 2026-06-16
**Feature**: ScriptMind 剧本工厂

## Research Tasks

### 1. LangChain/LangGraph Agent 编排方案

**Decision**: 使用 LangGraph 的 StateGraph 构建多 Agent 协作流水线

**Rationale**:
- LangGraph 原生支持有向图编排，适合 Showrunner → WorldBuilder → CharacterDesigner → ScriptDoctor 的线性流水线
- 内置 Human-in-the-Loop 支持（interrupt() 原语），满足大纲审核节点需求
- 状态检查点（Checkpoint）机制支持长任务恢复
- LangChain 生态的 `with_structured_output()` 可强制约束 Agent 输出为 JSON Schema

**Alternatives considered**:
- AutoGen (Microsoft): 对话驱动架构，不适合结构化流水线
- CrewAI: 角色驱动，状态管理较简单，缺少原生 HITL 支持

**Implementation notes**:
- 每个 Agent 封装为 LangGraph 节点，通过 Pydantic Schema 约束输出
- 状态对象包含 story_outline、world_setting、characters、script_drafts、review_feedback
- 边条件：script_doctor → [pass] → output_formatter, [needs_revision] → showrunner

---

### 2. 剧本编辑器技术选型

**Decision**: 基于 Slate.js 构建自定义剧本编辑器

**Rationale**:
- Slate.js 是高度可定制的富文本编辑器框架，支持自定义 Element 类型（scene_heading、action、character 等）
- 原生支持键盘快捷键自定义（Tab 切换、Enter 行为）
- 文档模型为 JSON 树结构，与剧本的 ScriptContent JSON Schema 天然对齐
- React 生态，与 Next.js 无缝集成

**Alternatives considered**:
- ProseMirror: 功能强大但 API 更复杂，学习成本高
- TipTap: 基于 ProseMirror 的封装，但自定义 Element 类型不如 Slate 灵活
- Monaco Editor: 代码编辑器，不适合剧本排版场景
- 自研 contentEditable: 开发成本过高，需处理浏览器兼容性

**Implementation notes**:
- 定义 6 种 Element 类型，每种类型对应独立的渲染组件和样式
- Tab/Shift+Tab 通过 onKeyDown 事件拦截，循环切换 Element type
- Enter 键根据当前 Element type 决定下一个默认 type
- 场景编号通过 Decorator 或左侧边栏组件实现，监听文档变化自动更新

---

### 3. 文件解析方案

**Decision**: 多格式文件解析器组合方案

**Rationale**:
- `.txt`: 纯文本，使用 chardet 自动检测编码，按章节标题正则分割
- `.docx`: 使用 python-docx 解析 Word 文档结构
- `.md`: 使用 markdown-it 或 mistune 解析 Markdown AST
- `.fountain`: 使用 fountain.py 解析 Fountain 剧本格式

**Alternatives considered**:
- 统一使用 Pandoc: 需要外部依赖，Docker 镜像体积大
- 纯 LLM 解析: 成本高、速度慢、不稳定

**Implementation notes**:
- 文件编码检测优先使用 chardet，失败时回退到 utf-8 with errors='replace'
- 章节/场景边界识别结合正则表达式（章节标题模式）和 LLM 辅助判断
- 解析结果统一转换为中间格式后交给 LLM 进行结构化转换

---

### 4. URL 抓取方案

**Decision**: 使用 trafilatura 进行网页正文提取

**Rationale**:
- trafilatura 专门设计用于网页正文提取，自动过滤广告、导航、页脚等噪声
- 支持多种网页结构，比 BeautifulSoup 手动解析更可靠
- 内置编码检测和 HTML 解析

**Alternatives considered**:
- BeautifulSoup + 手动规则: 需要针对不同网站编写规则，维护成本高
- newspaper3k: 已停止维护
- readability-lxml: 提取效果不如 trafilatura

**Implementation notes**:
- 配合 httpx 异步 HTTP 客户端
- 超时设置 10 秒，失败时返回明确错误信息
- 提取结果为纯文本，交给 LLM 进行章节识别和结构化转换

---

### 5. 版本控制存储方案

**Decision**: PostgreSQL JSONB 字段存储版本快照，结合差异压缩

**Rationale**:
- 剧本内容为 JSON 结构，JSONB 字段天然支持
- 每次保存存储完整快照，回溯时直接读取，无需重放
- 结合自动合并策略（相近时间的微小变更合并），控制存储增长
- PostgreSQL 的 JSONB 索引支持高效查询

**Alternatives considered**:
- Git-based 版本控制: 对单用户 Web 应用过于复杂
- 操作转换 (OT/CRDT): 适合实时协作，单用户场景不需要
- 独立版本数据库: 增加架构复杂度

**Implementation notes**:
- versions 表存储：id, script_id, version_number, content (JSONB), created_at, change_summary
- 保留最近 100 个关键版本，超出时自动合并相邻微小变更
- diff 计算在后端完成，返回结构化差异数据供前端渲染

---

### 6. ChromaDB 项目记忆方案

**Decision**: 使用 ChromaDB 嵌入式向量数据库存储项目记忆

**Rationale**:
- ChromaDB 为嵌入式数据库，零运维，Docker 部署简单
- LangChain 原生集成，可直接作为 Retriever 使用
- 支持 Collection 级别的元数据过滤（project_id, type, category）
- 适合存储设定集、角色档案、伏笔记录等需要语义检索的数据

**Alternatives considered**:
- FAISS: 纯向量索引，缺少元数据过滤和持久化
- Milvus: 功能强大但部署复杂，对单用户场景过重
- PostgreSQL pgvector: 可行但需要额外扩展

**Implementation notes**:
- 三个 Collection: story_bible, characters, foreshadows
- 每条记录包含 document (文本)、metadata (project_id, type, importance 等)、id
- 语义检索用于 Agent 的记忆检索节点 (memory_retrieval)

---

### 7. WebSocket 实时通信方案

**Decision**: FastAPI 原生 WebSocket 支持 + Redis Pub/Sub

**Rationale**:
- FastAPI 内置 WebSocket 支持，无需额外依赖
- 用于 Agent 生成过程的实时进度推送（阶段标签 + 流式输出）
- Redis Pub/Sub 支持多 Worker 场景下的消息广播

**Alternatives considered**:
- Socket.IO: 额外依赖，FastAPI 原生 WebSocket 已足够
- Server-Sent Events (SSE): 单向通信，不适合需要双向交互的场景
- 轮询: 延迟高，不适合实时进度推送

**Implementation notes**:
- WebSocket 端点: `/ws/agent/{session_id}`
- 消息格式: JSON，包含 type (stage_update/stream_chunk/complete/error)、data
- Agent 生成过程中，Orchestrator 通过 WebSocket 推送每个 Agent 阶段的开始和流式输出

---

### 8. Token 预算与成本控制方案

**Decision**: 项目级 Token 预算，数据库存储用量记录

**Rationale**:
- 每个项目独立配置 Token 预算（token_limit、warning_threshold）
- 每次 LLM 调用后记录实际 Token 用量
- 达到警告阈值时前端显示提示，达到硬上限时暂停 Agent 任务
- 429 错误时指数退避重试（1s, 2s, 4s，最多 3 次）

**Alternatives considered**:
- 全局预算: 可能中断其他项目的正常工作
- 无预算控制: 用户可能因 Agent 循环产生意外高额 API 费用

**Implementation notes**:
- project_budgets 表: id, project_id, token_limit, tokens_used, warning_threshold, reset_at
- 每次 LLM 调用通过 AI Gateway 中间件记录用量
- 重试策略: exponential backoff with jitter, max 3 retries on 429

---

### 9. 伏笔追踪方案

**Decision**: 结合规则引擎和 LLM 的伏笔追踪系统

**Rationale**:
- 自动伏笔识别依赖 LLM 的语义理解能力
- 伏笔状态追踪使用数据库记录（planted/resolved/episode references）
- ScriptDoctor Agent 审校时通过检索 ChromaDB 中的伏笔 Collection 进行检查

**Alternatives considered**:
- 纯规则引擎: 无法理解语义层面的伏笔关系
- 纯 LLM: 成本高、可能遗漏

**Implementation notes**:
- 伏笔在大纲生成阶段由 CharacterDesigner 或 Showrunner 标记
- 存储到 ChromaDB foreshadows Collection
- ScriptDoctor 审校时检索所有未回收伏笔，检查后续集数是否包含回收情节
- 审校报告列出未回收伏笔及其埋设位置

---

### 10. Docker 部署方案

**Decision**: Docker Compose 编排所有服务

**Rationale**:
- 单命令启动全部服务（frontend, backend, PostgreSQL, Redis, ChromaDB）
- 用户只需配置 API Key 即可使用
- 数据卷挂载保证数据持久化

**Services**:
- frontend: Next.js 应用 (端口 3000)
- backend: FastAPI 应用 (端口 8080)
- postgres: PostgreSQL 16 (端口 5432)
- redis: Redis 7 (端口 6379)
- chromadb: ChromaDB (端口 8000)

**Implementation notes**:
- backend Dockerfile 基于 Python 3.11-slim
- frontend Dockerfile 基于 Node 20-alpine
- 环境变量通过 .env 文件配置 API Key
- 数据卷: postgres_data, redis_data, chromadb_data, minio_data
