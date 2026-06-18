# Implementation Plan: Multi-Model Routing & Flexible Integration

**Branch**: `004-multi-model-routing` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-multi-model-routing/spec.md`

## Summary

Implement a multi-model routing system that lets users configure LLM provider credentials (DeepSeek, Qianwen, Doubao, MiMo, Kimi) via a Settings UI, persist them to `~/.framemind/config.json`, test connectivity, and wire configured models into the existing Agent pipeline via the AgentScope-Java framework. Also adds MCP Server and Tavily Search configuration tabs.

## Technical Context

**Language/Version**: Java 17, TypeScript 5.x

**Primary Dependencies**: Spring Boot 3.2.5, Next.js 14.2.5 (App Router), AgentScope-Java (vendored at `backend-java/lib-repo/agentscope-java-main`), Zustand, Tailwind CSS

**Storage**: PostgreSQL (existing, for projects/scripts/agents), `~/.framemind/config.json` (new, for user model/tool config persistence)

**Testing**: JUnit 5 + Mockito (backend), Jest/React Testing Library (frontend)

**Target Platform**: Web application — Spring Boot backend (port 8080) + Next.js frontend, Docker-compose deployment

**Project Type**: Web application (frontend + backend)

**Performance Goals**: Connectivity test completes within 10 seconds; config load on startup < 1 second

**Constraints**: API keys never exposed in UI after initial entry; config file plaintext with OS file permissions (chmod 600); AgentScope-Java SDK not yet in pom.xml — must be added as local dependency

**Scale/Scope**: Single-user per machine (config in `~/.framemind/`); 5 initial model providers; extensible catalog

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is a template with no active principles defined. No governance gates apply.

**Result**: PASS (no constraints to violate)

## Project Structure

### Documentation (this feature)

```text
specs/004-multi-model-routing/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend-java/src/main/java/io/framemind/
├── core/
│   ├── controller/
│   │   └── SettingsController.java          # Extend with new endpoints
│   ├── service/
│   │   ├── ApiKeyService.java               # Refactor → delegate to ModelCatalogService
│   │   ├── impl/ApiKeyServiceImpl.java      # Replace in-memory store
│   │   ├── ModelCatalogService.java         # NEW — provider catalog + config persistence
│   │   ├── ConnectivityTestService.java     # NEW — test model/MCP/Tavily connections
│   │   └── ToolConfigService.java           # NEW — MCP + Tavily config management
│   ├── dto/
│   │   ├── ProviderConfigRequest.java       # NEW
│   │   ├── ProviderConfigResponse.java      # NEW
│   │   ├── ConnectivityTestResult.java      # NEW
│   │   ├── McpServerConfigRequest.java      # NEW
│   │   ├── ToolConfigRequest.java           # NEW
│   │   └── ToolConfigResponse.java          # NEW
│   └── config/
│       └── FramemindConfigProperties.java   # NEW — @ConfigurationProperties
├── agent/
│   ├── config/
│   │   └── AgentScopeConfig.java            # Wire real model from config
│   └── orchestration/
│       ├── AgentCallAdapter.java            # Existing interface — no change
│       ├── PlaceholderAgentCallAdapter.java # Keep as fallback
│       └── AgentScopeCallAdapter.java       # NEW — real AgentScope-Java integration
└── modules/scriptmind/                      # No changes needed

backend-java/src/main/resources/
├── application.yml                          # Add framemind.config.path
└── model-catalog.yml                        # NEW — provider catalog definition

frontend/src/
├── app/settings/
│   └── page.tsx                             # Rewrite with tabbed layout
├── components/settings/                     # NEW directory
│   ├── settings-tabs.tsx                    # Tab navigation
│   ├── model-provider-card.tsx              # Provider card
│   ├── provider-config-form.tsx             # API key + config form
│   ├── connectivity-test-button.tsx         # Test connection button
│   ├── mcp-server-config.tsx                # MCP server tab
│   ├── tavily-config.tsx                    # Tavily tab
│   └── default-model-selector.tsx           # Default model picker
├── stores/
│   └── settings-store.ts                    # Extend significantly
├── lib/api/
│   └── settings.ts                          # Extend with new endpoints
└── types/
    └── settings.ts                          # NEW — settings type definitions
```

**Structure Decision**: Extending existing `backend-java/` + `frontend/` web application. All changes fit within established packages — no new modules needed.
