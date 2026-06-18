# Research: ScriptMind 剧本工厂

**Date**: 2026-06-16
**Feature**: ScriptMind 剧本工厂
**Updated**: 2026-06-18 — 技术栈从 Python/FastAPI/LangChain 迁移至 Spring Boot + AgentScope-Java

## Research Tasks

### 1. AgentScope-Java Agent 编排方案

**Decision**: 使用 AgentScope-Java 的 ReActAgent + SubAgentTool 构建多 Agent 协作流水线

**Rationale**:
- AgentScope-Java（`io.agentscope:agentscope:1.0.12`）是阿里巴巴开源的 Java Agent 框架，基于 Project Reactor 实现响应式架构
- `ReActAgent` 采用 ReAct（Reasoning-Acting）范式，Agent 可自主规划和执行复杂任务
- `SubAgentTool` 支持 Supervisor → SubAgent 委托模式：Supervisor Agent 可将子任务委托给专门的 SubAgent，每个 SubAgent 维护独立会话
- 内置 Hook 系统（`Hook` 接口）支持在 Agent 执行的各个阶段（PreReasoning、PostActing、PreCall 等）进行拦截和干预
- `RequireUserConfirmEvent` + `ConfirmResult` 机制原生支持 Human-in-the-Loop
- 流式输出通过事件系统（`ReasoningChunkEvent`、`TextBlockDeltaEvent`、`ThinkingBlockDeltaEvent`）实现
- 内置 `LongTermMemory` 支持跨会话持久化记忆，`PlanNotebook` 支持结构化任务管理
- `StructuredOutput` 工具保证类型安全的 JSON 输出，自动重试修正格式错误

**Alternatives considered**:
- LangChain4j: 生态较成熟但缺少原生 HITL 和 SubAgent 委托模式
- Spring AI: Spring 官方项目但 Agent 编排能力较弱，偏向单轮 RAG 场景
- 自研编排框架: 开发成本过高，重复造轮子

**Implementation notes**:
- 每个 Agent（Showrunner、WorldBuilder、CharacterDesigner、ScriptDoctor）封装为独立的 `ReActAgent` 实例
- `PipelineOrchestrator` 作为 Supervisor Agent，通过 `SubAgentTool` 按顺序委托给各阶段 Agent
- 使用 `Hook` 系统实现：流式输出推送到 WebSocket、Token 预算检查、HITL 审核节点
- Agent 的 `call()` 方法返回 `Mono<Msg>`，天然支持异步非阻塞
- 使用 `StreamOptions` + `StreamingHook` 实现实时流式输出

---

### 2. Spring Boot 3.x 集成方案

**Decision**: 使用 AgentScope-Java 官方 Spring Boot Starter + Spring Boot 3.x

**Rationale**:
- AgentScope-Java 提供官方 Spring Boot Starter（`agentscope-spring-boot-starter`）
- 自动配置 `ReActAgent`、`Model`、`Memory`、`Toolkit` Bean
- 支持通过 `application.yml` 配置模型提供商（DashScope/OpenAI/Anthropic/Gemini/Ollama）
- Starter 基于 `@AutoConfiguration`，通过 `@ConditionalOnProperty` 控制启用
- `Memory` 和 `Toolkit` 为 Prototype 作用域，支持多实例隔离

**Configuration example**:
```yaml
agentscope:
  model:
    provider: dashscope  # 或 openai / anthropic / gemini
  dashscope:
    enabled: true
    api-key: ${DASHSCOPE_API_KEY}
    model-name: qwen-max
    stream: true
  agent:
    enabled: true
    name: "Assistant"
    sys-prompt: "You are a helpful AI assistant."
    max-iters: 10
```

**Alternatives considered**:
- 手动配置 AgentScope Bean: 更灵活但维护成本高
- 嵌入式 Agent 引擎（非 Spring）: 无法利用 Spring 生态

**Implementation notes**:
- 项目使用多个 Agent 实例（Showrunner、WorldBuilder 等），需手动创建而非依赖 Starter 的单 Agent 自动配置
- 在 `AgentScopeConfig` 中使用 `@Bean` 方法创建各 Agent 实例，注入不同的 `Model`、`sysPrompt`、`Toolkit`
- 每个 Agent 的 `Toolkit` 注入专属的 `@Tool` 方法（如 `ScriptQueryTool`、`ForeshadowCheckTool`）
- 使用 `SubAgentProvider` 为 Supervisor Agent 注册 SubAgentTool

---

### 3. 数据库与持久化方案

**Decision**: Spring Data JPA + PostgreSQL，使用 Flyway 管理数据库迁移

**Rationale**:
- 数据模型保持不变（PostgreSQL + JSONB），仅将 ORM 层从 SQLAlchemy 迁移到 Spring Data JPA
- Spring Data JPA 的 Repository 抽象层与 SQLAlchemy 的 Active Record 模式类似，迁移成本低
- Flyway 提供版本化的数据库迁移管理，比 Alembic 更适合 Java 生态
- JPA 的 `@Type(JsonType.class)`（Hibernate 6）支持 JSONB 字段映射

**Alternatives considered**:
- MyBatis: 更灵活但缺少 JPA 的声明式 Repository
- JOOQ: 类型安全但学习成本高
- 保持 SQLAlchemy（Python）: 与新技术栈不兼容

**Implementation notes**:
- 所有实体使用 `@Entity` + `@Table` 注解，UUID 主键使用 `@GeneratedValue(strategy = UUID)`
- JSONB 字段使用 Hibernate 的 `@Type(JsonType.class)` 或自定义 `AttributeConverter`
- 关系映射：`@OneToMany`、`@ManyToOne`、`@OneToOne` 保持与原数据模型一致
- Repository 接口继承 `JpaRepository<Entity, UUID>`，自定义查询使用 `@Query` 注解
- Flyway 迁移脚本放在 `src/main/resources/db/migration/`

---

### 4. WebSocket 实时通信方案

**Decision**: Spring WebSocket (STOMP) + SockJS

**Rationale**:
- Spring Boot 内置 WebSocket 支持，通过 `@EnableWebSocket` 和 `WebSocketHandler` 实现
- 用于 Agent 生成过程的实时进度推送（阶段标签 + 流式输出）
- STOMP 协议提供消息订阅/发布语义，SockJS 提供降级支持
- 与 AgentScope-Java 的事件系统（Hook）无缝集成

**Alternatives considered**:
- Server-Sent Events (SSE): 单向通信，不适合需要双向交互的场景
- 轮询: 延迟高，不适合实时进度推送
- Socket.IO: 额外依赖，Spring WebSocket 已足够

**Implementation notes**:
- WebSocket 端点: `/ws/agent/{session_id}`
- 消息格式: JSON，包含 type (stage_update/stream_chunk/complete/error)、data
- `StreamingHook` 监听 AgentScope 事件（`TextBlockDeltaEvent`、`ReasoningChunkEvent`），通过 WebSocket 推送到前端
- `HitlHook` 监听 `RequireUserConfirmEvent`，通过 WebSocket 发送审核请求

---

### 5. 剧本编辑器技术选型

**Decision**: 基于 Slate.js 构建自定义剧本编辑器（前端不变）

**Rationale**:
- Slate.js 是高度可定制的富文本编辑器框架，支持自定义 Element 类型
- 原生支持键盘快捷键自定义（Tab 切换、Enter 行为）
- 文档模型为 JSON 树结构，与剧本的 ScriptContent JSON Schema 天然对齐
- React 生态，与 Next.js 无缝集成

**Implementation notes**:
- 前端编辑器方案不变，仅后端 API 调用路径调整（从 `/api/v1/` 前缀改为 Spring Boot 的 REST 控制器路径）
- 编辑器交互完全在前端完成，不依赖后端响应

---

### 6. 文件解析方案

**Decision**: Java 多格式文件解析器组合方案

**Rationale**:
- `.txt`: 使用 `juniversalchardet` 自动检测编码，按章节标题正则分割
- `.docx`: 使用 `apache-poi` 或 `docx4j` 解析 Word 文档结构
- `.md`: 使用 `flexmark-java` 解析 Markdown AST
- `.fountain`: 使用自定义解析器或 `fountain-java`（如有）

**Alternatives considered**:
- Tika: 全格式支持但依赖过重
- 纯 LLM 解析: 成本高、速度慢、不稳定

**Implementation notes**:
- 文件编码检测使用 `juniversalchardet`，失败时回退到 UTF-8
- 章节/场景边界识别结合正则表达式和 LLM 辅助判断
- 解析结果统一转换为中间格式后交给 LLM 进行结构化转换
- 文件大小限制 50 万字（约 1MB），超出时提示用户分批导入

---

### 7. URL 抓取方案

**Decision**: 使用 Jsoup + 自定义正文提取

**Rationale**:
- Jsoup 是 Java 生态最成熟的 HTML 解析器
- 配合 readability 算法提取正文内容
- 轻量级，无外部服务依赖

**Alternatives considered**:
- Apache Tika: 功能全面但依赖过重
- 自研提取器: 开发成本高

**Implementation notes**:
- 使用 Jsoup 抓取 HTML，通过启发式算法提取正文（移除 script/style/nav/header/footer 标签）
- 超时设置 10 秒，失败时返回明确错误信息
- 提取结果为纯文本，交给 LLM 进行章节识别和结构化转换

---

### 8. 版本控制存储方案

**Decision**: PostgreSQL JSONB 字段存储版本快照，结合差异压缩（保持不变）

**Rationale**:
- 剧本内容为 JSON 结构，JSONB 字段天然支持
- 每次保存存储完整快照，回溯时直接读取，无需重放
- 结合自动合并策略（相近时间的微小变更合并），控制存储增长

**Implementation notes**:
- `script_versions` 表存储：id, script_id, version_number, content (JSONB), created_at, change_summary
- 保留最近 100 个关键版本，超出时自动合并相邻微小变更
- diff 计算在后端完成，返回结构化差异数据供前端渲染
- 使用 JPA 的 `@Type(JsonType.class)` 映射 JSONB 字段

---

### 9. Token 预算与成本控制方案

**Decision**: 项目级 Token 预算，通过 AgentScope-Java Hook 系统实现

**Rationale**:
- 每个项目独立配置 Token 预算（token_limit、warning_threshold）
- 使用 AgentScope-Java 的 `Hook` 系统在每次 LLM 调用后记录 Token 用量
- `BudgetHook` 监听 `PostCallEvent`，累加 Token 用量并检查阈值
- 达到警告阈值时通过 WebSocket 推送警告，达到硬上限时中断 Agent 执行

**Implementation notes**:
- `project_budgets` 表存储预算配置和用量
- `BudgetHook` 实现 `Hook` 接口，在 `PostCallEvent` 中提取 `ChatUsage` 信息
- Agent 的 `interrupt()` 方法支持安全中断，保留上下文
- 429 错误时 AgentScope-Java 内置重试机制（可配置）

---

### 10. Docker 部署方案

**Decision**: Docker Compose 编排所有服务

**Rationale**:
- 单命令启动全部服务（frontend, backend, PostgreSQL, Redis）
- 用户只需配置 API Key 即可使用
- 数据卷挂载保证数据持久化

**Services**:
- frontend: Next.js 应用 (端口 3000)
- backend: Spring Boot 应用 (端口 8080)
- postgres: PostgreSQL 16 (端口 5432)
- redis: Redis 7 (端口 6379)

**Implementation notes**:
- backend Dockerfile 基于 Eclipse Temurin JDK 17，多阶段构建（Maven build → JRE runtime）
- frontend Dockerfile 基于 Node 20-alpine
- 环境变量通过 .env 文件配置 API Key
- 数据卷: postgres_data, redis_data
- Spring Boot Actuator 提供健康检查端点 `/actuator/health`
