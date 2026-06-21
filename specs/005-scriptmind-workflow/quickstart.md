# Quickstart: ScriptMind 剧本工作流

**Date**: 2026-06-22

## 前置条件

1. Docker 环境已安装
2. 项目根目录下有 `.env` 文件，包含必要的 API Key
3. 数据库已初始化（V1 + V2 迁移）

## 启动步骤

```bash
# 1. 启动全部服务
docker-compose up -d

# 2. 验证服务状态
curl http://localhost:8080/actuator/health
curl http://localhost:3000

# 3. 数据库迁移自动执行（Flyway）
# V1: 初始 schema
# V2: 工作流扩展 schema
```

## 验证场景

### 场景 1：创建项目并完成工作流

```bash
# 1. 创建短剧项目
curl -X POST http://localhost:8080/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "都市逆袭",
    "format": "short_drama",
    "genre": ["都市", "复仇"],
    "logline": "女主被渣男背叛后逆袭"
  }'
# 期望: 201, 返回项目 ID

# 2. AI 生成世界观
curl -X POST http://localhost:8080/api/v1/projects/{projectId}/workflow/generate-world-setting \
  -H "Content-Type: application/json"
# 期望: 202, 返回 session_id 和 websocket_url

# 3. 查看世界观设定
curl http://localhost:8080/api/v1/projects/{projectId}/world-setting
# 期望: 200, 返回世界观内容

# 4. AI 生成角色
curl -X POST http://localhost:8080/api/v1/projects/{projectId}/workflow/generate-characters \
  -H "Content-Type: application/json"
# 期望: 202

# 5. 查看角色列表
curl http://localhost:8080/api/v1/projects/{projectId}/characters
# 期望: 200, 返回角色列表

# 6. AI 生成大纲
curl -X POST http://localhost:8080/api/v1/projects/{projectId}/workflow/generate-outline \
  -H "Content-Type: application/json"
# 期望: 202

# 7. AI 生成剧本（第1集）
curl -X POST http://localhost:8080/api/v1/projects/{projectId}/workflow/generate-script \
  -H "Content-Type: application/json" \
  -d '{"episode_number": 1}'
# 期望: 202

# 8. AI 审查
curl -X POST http://localhost:8080/api/v1/projects/{projectId}/workflow/review \
  -H "Content-Type: application/json" \
  -d '{"scope": "full"}'
# 期望: 202

# 9. 导出 JSON
curl http://localhost:8080/api/v1/projects/{projectId}/export/json
# 期望: 200, 返回 ScriptsDataModel 格式 JSON

# 10. 导出 Fountain
curl http://localhost:8080/api/v1/projects/{projectId}/export/fountain
# 期望: 200, 返回 Fountain 格式文本
```

### 场景 2：前端 UI 验证

1. 打开 `http://localhost:3000`
2. 创建新项目，选择"短剧"类型
3. 在"创意及世界观" Tab 与 AI 对话
4. 切换到"角色" Tab，查看 AI 生成的角色
5. 切换到"大纲" Tab，查看结构化大纲
6. 切换到"剧本内容" Tab，查看生成的剧本
7. 点击"AI 审查"，查看审查报告
8. 导出为 JSON 和 Fountain 格式

### 场景 3：上传已有内容

```bash
# 上传 TXT 文件
curl -X POST http://localhost:8080/api/v1/projects/{projectId}/import/file \
  -F "file=@novel.txt"
# 期望: 202

# 从 URL 抓取
curl -X POST http://localhost:8080/api/v1/projects/{projectId}/import/url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/story"}'
# 期望: 202
```

## 数据验证

```bash
# 验证数据库表结构
docker exec -it postgres psql -U framemind -d framemind -c "\dt"
# 期望: 显示 projects, scripts, characters, foreshadows, 
#       world_settings, synopses, outlines, review_reports,
#       agent_sessions, agent_messages, project_budgets

# 验证 projects 表有 logline 字段
docker exec -it postgres psql -U framemind -d framemind \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'logline';"

# 验证 characters 表有新字段
docker exec -it postgres psql -U framemind -d framemind \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'characters' AND column_name IN ('gender', 'identity', 'persona', 'overview');"

# 验证 script_versions 表已删除
docker exec -it postgres psql -U framemind -d framemind \
  -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'script_versions');"
# 期望: f (false)
```

## 常见问题

### Q: AI 生成返回 placeholder 响应
A: 检查 `.env` 中的 API Key 配置，确保 `framemind.agent.adapter=agentscope`。

### Q: WebSocket 连接失败
A: 检查 `ws://localhost:8080/ws/agent/session/{sessionId}` 是否可达。

### Q: 数据库迁移失败
A: 检查 Flyway 迁移文件顺序，确保 V1 先于 V2 执行。
