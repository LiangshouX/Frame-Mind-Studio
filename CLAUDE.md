# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Frame Mind Studio is an AI-powered screenplay production pipeline. Users manage projects through a web UI, and AI agents (via AgentScope-Java) assist with script writing, character analysis, outline generation, and other screenplay tasks.

## Architecture

```
frontend/          Next.js 14 (App Router) + Tailwind + Zustand
backend-java/      Spring Boot 3.2.5 + JPA + Flyway + AgentScope-Java
shared/            TypeScript types/constants shared between frontend and backend contracts
specs/             Feature specifications (speckit-driven development)
```

**Backend** (`io.framemind`):
- `infrastructure/` — Infrastructure 层：核心 PO（`po/`）、核心 Repository（`repository/`）
- `core/adapter/` — Adapter 层：REST Controller（`controller/`）、WebSocket Handler
- `core/service/` — Service 层：业务逻辑、DTO（`dto/`）、实现（`impl/`）
- `core/config/` — 配置类（Security、WebSocket、Redis、DB）
- `core/exception/` — 异常处理（GlobalExceptionHandler、错误码）
- `agent/` — AgentScope-Java integration: `AgentCallAdapter` interface with `PlaceholderAgentCallAdapter` (mock) and `AgentScopeCallAdapter` (real), pipeline orchestration, budget/streaming hooks
- `modules/scriptmind/` — ScriptMind feature module（自包含：controller/service/dto/po/repository/agent）

**Frontend** (`src/`):
- `app/` — Next.js App Router pages (projects, settings, scriptmind sub-pages)
- `components/scriptmind/` — Script editor, character panel, outline viewer, scene nav, foreshadow tracker
- `components/settings/` — Model provider config, MCP server config, Tavily config
- `components/shared/` — Agent chat (WebSocket), pipeline nav, project sidebar, quality dashboard
- `stores/` — Zustand stores for state management
- `lib/api/` — API client functions
- `lib/websocket/` — WebSocket connection management

**Shared** (`shared/`):
- `types/` — Agent, project, script type definitions
- `constants/` — Pipeline stage definitions

## Common Commands

### Frontend
```bash
cd frontend
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

### Backend
```bash
cd backend-java
./mvnw spring-boot:run                    # Run locally
./mvnw test                               # Run all tests
./mvnw test -Dtest=ClassName              # Run single test class
./mvnw test -Dtest=ClassName#methodName   # Run single test method
./mvnw package                            # Build JAR
```

### Docker (full stack)
```bash
docker-compose up -d          # Start postgres, redis, backend, frontend
docker-compose down           # Stop all
```

Services: PostgreSQL (5432), Redis (6379), Backend (8080), Frontend (3000)

## Key Patterns

- **Agent orchestration**: Backend uses `AgentCallAdapter` interface — `PlaceholderAgentCallAdapter` for dev/testing, `AgentScopeCallAdapter` for real LLM calls via AgentScope-Java SDK
- **Real-time communication**: WebSocket (`/ws/agent/{sessionId}`) streams agent messages to frontend; frontend reconnects with exponential backoff
- **State management**: Zustand stores in `frontend/src/stores/`
- **Database migrations**: Flyway (`backend-java/src/main/resources/db/migration/`), schema validated at startup (`ddl-auto: validate`)
- **API contract**: JSON with snake_case property naming (Jackson `SNAKE_CASE` strategy)
- **Config persistence**: User model/tool config stored at `~/.framemind/config.json`, API keys encrypted with Fernet

## Conventions

- **注释语言**: 前后端代码注释使用中文；Java 代码注释使用标准 Javadoc 格式
- Backend: Java 17, Lombok for boilerplate, Spring Data JPA repositories
- Frontend: TypeScript strict mode, Tailwind CSS, shadcn/ui primitives (Radix + CVA)
- Spec-driven development: features are designed in `specs/NNN-feature-name/` before implementation

## Java 架构分层规则（强制）

### 三层架构（逐层访问，禁止反向/跨层）

访问方向：**Adapter → Service → Infrastructure**

| 层级 | 职责 | 包含内容 |
|------|------|---------|
| **Adapter 层** | 对外暴露接口 | Controller（`adapter/controller/`）、WebSocket 接口 |
| **Service 层** | 业务逻辑 | Service 实现、DTO（`service/dto/`）；多模块时 Service 需拆分 |
| **Infrastructure 层** | 数据持久化 | 数据库模型（PO 结尾）、Repository |

### 包结构

```
io.framemind/
├── infrastructure/              # Infrastructure 层（顶层包）
│   ├── po/                      # 核心持久化对象
│   └── repository/              # 核心数据访问接口
├── core/                        # 核心模块
│   ├── adapter/controller/      # Adapter 层：REST Controller
│   ├── service/                 # Service 层：业务逻辑 + DTO
│   ├── config/                  # 配置类
│   └── exception/               # 异常处理
├── modules/scriptmind/          # 功能模块（自包含：controller/service/dto/po/repository）
└── agent/                       # AI Agent 独立模块（不受分层限制）
```

### 关键规则
- **infrastructure/** 是**顶层包**，不嵌套在 core 下
- **DTO 属于 Service 层**，放在 `service/dto/`
- **功能模块**（如 scriptmind）保持**自包含**结构
- 数据库模型类以 **`PO`** 结尾（例：表 `agent_messages` → `AgentMessagePO`）

### 公共包（不受三层限制）
- **Config** — 配置类
- **异常处理** — 错误码 + 全局异常处理器
- **AI Agent** — 独立 package，不受分层限制，但必须高度模块化

## Environment Variables

Required in `.env` (root) for Docker:
- `OPENAI_API_KEY`, `DASHSCOPE_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY` — LLM provider keys
- `AI_PROVIDER` — default model provider (openai, dashscope, etc.)
- `FERNET_KEY` — encryption key for API key storage
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — database credentials

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/006-scriptmind-completion/plan.md
<!-- SPECKIT END -->
