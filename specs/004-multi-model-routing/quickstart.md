# Quickstart: Multi-Model Routing & Flexible Integration

**Date**: 2026-06-18 | **Feature**: 004-multi-model-routing

## Prerequisites

- Java 17+, Maven 3.8+
- Node.js 18+, npm
- PostgreSQL running (existing dev setup)
- Backend running on port 8080, frontend on port 3000

## Validation Scenarios

### 1. View Model Provider Catalog

1. Open `http://localhost:3000/settings`
2. The "Model Providers" tab should be active by default
3. Verify 5 provider cards are displayed: DeepSeek, Qianwen, Doubao, MiMo, Kimi
4. Each card shows provider name, description, and "Not Configured" status

**Expected**: All 5 providers visible with correct names and "Not Configured" badges.

---

### 2. Configure a Model Provider

1. Click on the DeepSeek provider card
2. A configuration form appears with:
   - API Key field (required, empty)
   - Base URL field (pre-filled with `https://api.deepseek.com`)
   - Model list (pre-filled with `deepseek-chat`, `deepseek-reasoner`)
3. Enter a valid DeepSeek API key
4. Click "Save"
5. The card status changes to "Configured"
6. Refresh the page — configuration persists

**Expected**: API key saved, status shows "Configured", key is masked as `sk-***xxx` on revisit.

---

### 3. Test Provider Connectivity

1. On the configured DeepSeek card, click "Test Connection"
2. A loading spinner appears
3. Within 10 seconds, a green "Connection successful" message appears

**Expected**: Test completes within 10 seconds with success indicator.

---

### 4. Test with Invalid Key

1. Edit DeepSeek config, change API key to an invalid value
2. Click "Test Connection"
3. A red "Invalid API key" error appears

**Expected**: Clear error message, no crash.

---

### 5. Configure Multiple Models

1. On the DeepSeek provider detail view, add a new model name: `deepseek-coder`
2. Save
3. Verify `deepseek-coder` appears in the model list

**Expected**: Custom model names are saved and displayed.

---

### 6. Set Default Model

1. Navigate to the "Default Model" selector at the bottom of the Model Providers tab
2. Select "DeepSeek / deepseek-chat"
3. Save
4. Create a new agent task (e.g., via ScriptMind)
5. Verify the model field is pre-populated

**Expected**: Default model persists and pre-fills in agent creation.

---

### 7. Configure Tavily Search

1. Switch to the "Tavily Search" tab
2. Enter a valid Tavily API key
3. Click "Save"
4. Click "Test Connection"
5. Verify success indicator

**Expected**: Tavily config saves and test passes.

---

### 8. Configure MCP Server

1. Switch to the "MCP Servers" tab
2. Click "Add Server"
3. Enter: name = "test-server", URL = "http://localhost:3000", auth = Bearer, token = "test"
4. Save
5. Click "Test Connection"

**Expected**: Server config saves and test completes.

---

### 9. Configuration Persistence

1. Configure DeepSeek and Tavily
2. Stop the backend and frontend
3. Restart both
4. Navigate to `/settings`
5. Verify all configurations are loaded automatically

**Expected**: All configs persist across restarts via `~/.framemind/config.json`.

---

### 10. Corrupted Config Recovery

1. Manually edit `~/.framemind/config.json` and corrupt one provider entry (e.g., remove the `api_key` field)
2. Restart the backend
3. Navigate to `/settings`
4. Verify the corrupted entry is skipped and a warning is shown
5. Verify other valid entries are still loaded

**Expected**: Graceful degradation — valid entries load, corrupted entry shows warning.

---

## Quick Commands

```bash
# Start backend
cd backend-java && mvn spring-boot:run

# Start frontend
cd frontend && npm run dev

# Check config file
cat ~/.framemind/config.json

# Run backend tests
cd backend-java && mvn test

# Run frontend tests
cd frontend && npm test
```
