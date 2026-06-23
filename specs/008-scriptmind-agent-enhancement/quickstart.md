# Quickstart: ScriptMind Agent Enhancement

**Date**: 2026-06-23
**Feature**: 008-scriptmind-agent-enhancement

## Prerequisites

1. Java 17+, Maven 3.8+, Node.js 18+, PostgreSQL 15+, Redis 7+
2. AgentScope Java source at `.lib-repo/agentscope-java-main/`
3. At least one LLM provider configured in `~/.framemind/config.json`

## Setup

### 1. Install AgentScope Core to Local Maven Repo

```bash
cd .lib-repo/agentscope-java-main
mvn install -pl agentscope-dependencies-bom,agentscope-distribution/agentscope-bom,agentscope-core -DskipTests
```

### 2. Run Database Migration

```bash
cd backend-java
./mvnw flyway:migrate
```

This applies `V3__agent_enhancement.sql` which adds:
- `workflow_step`, `agent_name` columns to `agent_sessions`
- `message_type`, `metadata` columns to `agent_messages`
- New `agent_config_overrides` table
- `version` column to `characters`

### 3. Start Backend

```bash
cd backend-java
./mvnw spring-boot:run
```

Verify: `curl http://localhost:8080/api/v1/projects` returns 200.

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Verify: `http://localhost:3000` loads the app.

## Validation Scenarios

### V1: Agent Chat in Worldview Tab

1. Create a new project (any format except comic)
2. Navigate to ScriptMind → Worldview tab
3. Verify: Chat window shows empty state, no stage filter buttons
4. Type "帮我构思一个都市复仇题材的短剧创意" and send
5. Verify: Agent response streams in with collapsible thinking/tool blocks
6. Send follow-up "把背景改成古代宫廷"
7. Verify: Agent remembers prior context and refines the concept

### V2: Agent Configuration Drawer

1. In any tab, click the agent config button (gear icon)
2. Verify: Drawer opens with system prompt, skills, rules fields
3. Modify the system prompt and save
4. Verify: Config file created at `~/.framemind/agents/{agent-name}.json`
5. Send a new message
6. Verify: Agent behavior reflects the updated prompt

### V3: Character Management via Agent Tools

1. Navigate to Characters tab
2. Type "创建男主角，名叫李明，28岁，性格坚毅"
3. Verify: Agent calls `create_character` tool, character card appears
4. Type "再批量创建女主和反派"
5. Verify: Agent calls `batch_create_characters`, two new cards appear
6. Edit a character in the form while the agent updates it
7. Verify: Conflict detection prompt appears

### V4: Format-Aware Outline Generation

1. Create a `short_drama` project with completed worldview, synopsis, characters
2. Navigate to Outline tab, click "AI一键生成"
3. Verify: Outline uses episode/scene/beat structure
4. Create a `movie` project, repeat
5. Verify: Outline uses act/sequence/scene structure
6. Create a `comic` project, navigate to Outline tab
7. Verify: "暂不支持" message displayed

### V5: Script Generation with Progress

1. Complete all prior steps for a `short_drama` project
2. Navigate to Script tab
3. Verify: Left sidebar shows outline nodes with status indicators
4. Click "AI生成剧本"
5. Verify: Each episode shows loading indicator, updates to "completed" as generated
6. Click an episode in sidebar
7. Verify: Editor scrolls to section, chat input receives context

### V6: Chat History Persistence

1. Send messages in Worldview tab
2. Switch to Characters tab (verify empty chat)
3. Switch back to Worldview (verify history preserved)
4. Close and reopen the application
5. Navigate to Worldview tab (verify history loaded from backend)

## Build Verification

```bash
# Backend
cd backend-java
./mvnw clean compile        # Must succeed
./mvnw test                  # All tests pass
./mvnw package               # JAR builds

# Frontend
cd frontend
npm run build                # Production build succeeds
npm run lint                 # No errors
```
