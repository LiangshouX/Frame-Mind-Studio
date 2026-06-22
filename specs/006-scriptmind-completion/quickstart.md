# Quickstart Validation Guide: ScriptMind 剧本工作流补全

**Date**: 2026-06-22

## Prerequisites

- Docker Compose running (PostgreSQL, Redis, Backend, Frontend)
- Backend at `http://localhost:8080`
- Frontend at `http://localhost:3000`
- At least one LLM provider configured in Settings

## Validation Scenarios

### V1: Project Type Fix (FR-002)

1. Navigate to `http://localhost:3000/projects/new`
2. **Expected**: "目标形态" shows "短剧" and "微电影" (not "漫画" or "电影")
3. Select "短剧", fill title + genre, click "创建项目"
4. **Expected**: Redirects to project page, format is `short_drama`

### V2: Character CRUD (FR-017~FR-024)

1. Enter a project → click "角色" tab
2. **Expected**: "AI 生成角色" and "新增角色" buttons visible
3. Click "新增角色" → fill name, gender, personality, identity, overview
4. **Expected**: Character card appears in list
5. Click card → edit fields → blur to save
6. **Expected**: Changes persist after tab switch
7. Click delete → confirm
8. **Expected**: Character removed

### V3: AI Chat on All Pages (FR-042)

1. Enter a project → click "创意及世界观" tab
2. **Expected**: AI chat panel visible on right side with input box
3. Type message → send
4. **Expected**: Message appears in chat, AI responds (streaming)
5. Repeat for 梗概, 角色, 大纲 tabs
6. **Expected**: Each tab has AI chat panel

### V4: Synopsis Text Editor (FR-015)

1. Click "梗概" tab
2. **Expected**: Large text editor (not form fields), "梗概结构指导" toggle
3. Click "AI 生成梗概"
4. **Expected**: Generated text fills editor
5. Toggle guidance panel
6. **Expected**: Panel shows/collapses

### V5: Outline Per-Episode Actions (FR-028, FR-030)

1. Click "大纲" tab → generate outline
2. **Expected**: Episode cards appear
3. Click "重新生成" on one episode
4. **Expected**: Only that episode regenerates
5. Click "删除" on one episode → confirm
6. **Expected**: Episode removed

### V6: Script Editor Three-Column (FR-039~FR-041)

1. Click "剧本内容" tab
2. **Expected**: Left scene nav, center editor, right AI chat
3. Type scene heading in editor
4. **Expected**: Scene nav updates with new scene
5. Click scene in nav
6. **Expected**: Editor scrolls to that scene

### V7: Upload (FR-056~FR-062)

1. Click "上传已有内容" in left sidebar
2. Select a .txt file
3. **Expected**: Upload completes, parse results shown
4. Confirm merge strategy
5. **Expected**: Characters, outline, script populated in respective tabs

### V8: Export (FR-063~FR-066)

1. Click "导出" in left sidebar
2. Select "JSON"
3. **Expected**: File downloads with correct structure
4. Select "Fountain"
5. **Expected**: .fountain file downloads

### V9: Review (FR-052~FR-054)

1. Click "大纲" or "剧本内容" tab
2. Click "AI 审查" button
3. **Expected**: Review report appears in AI chat panel
4. Click "采纳" on a suggestion
5. **Expected**: Content updated

### V10: Quality & Foreshadow Panels (FR-067~FR-068)

1. Click "剧本内容" tab
2. **Expected**: Collapsible quality panel above AI chat
3. Expand quality panel
4. **Expected**: Overall score + 5 metrics displayed
5. Expand foreshadow panel
6. **Expected**: Foreshadow list with status/urgency
