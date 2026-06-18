# Quickstart: ScriptMind 剧本工厂

**Date**: 2026-06-16
**Feature**: ScriptMind 剧本工厂
**Updated**: 2026-06-18 — 后端从 Python/FastAPI 迁移至 Spring Boot + AgentScope-Java

## Prerequisites

- JDK 17+
- Node.js 20+
- Docker 24.0+ 和 Docker Compose 2.20+
- 至少一个 LLM 服务的 API Key（DashScope / OpenAI / Anthropic）
- 4GB+ 可用内存
- 10GB+ 可用磁盘空间

## Quick Start

### 1. 启动服务

```bash
# 克隆仓库
git clone https://github.com/framemind/studio.git
cd studio

# 配置 API Key
cp .env.example .env
# 编辑 .env，填入至少一个 API Key：
# DASHSCOPE_API_KEY=sk-...
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# 启动所有服务
docker compose up -d
```

等待所有服务启动完成（约 30 秒），访问 http://localhost:3000

### 2. 验证服务状态

```bash
# 检查所有容器运行状态
docker compose ps

# 预期输出：
# NAME                STATUS
# framemind-frontend  Up
# framemind-backend   Up (healthy)
# framemind-postgres  Up (healthy)
# framemind-redis     Up (healthy)
```

### 3. 验证场景

#### Scenario 1: 一句话生成大纲 (P1)

1. 打开 http://localhost:3000
2. 点击"新建项目"
3. 输入项目标题："逆袭女王"
4. 选择题材标签：都市、复仇、逆袭
5. 在 Agent 工作台输入："写一个现代都市复仇短剧，女主被渣男背叛后逆袭"
6. 点击发送
7. **预期**：界面显示 Agent 阶段进度（Showrunner → WorldBuilder → CharacterDesigner → ScriptDoctor），流式输出文本内容
8. 大纲生成后显示人类审核节点，点击"批准"
9. **预期**：大纲保存成功，显示集数规划和每集摘要

**验证点**:
- [ ] 大纲在 60 秒内生成
- [ ] 每集包含标题、摘要、关键事件、结尾钩子
- [ ] Agent 阶段进度实时显示
- [ ] 人类审核节点正常工作

#### Scenario 2: 剧本编辑器 (P1)

1. 进入已创建的项目
2. 点击"编辑剧本"
3. 在编辑器中输入内容
4. 按 Tab 键切换元素类型
5. 输入对白内容后按 Enter
6. **预期**：新建段落默认为 action 类型
7. 输入角色名后按 Enter
8. **预期**：新建段落默认为 dialogue 类型
9. 查看左侧边栏
10. **预期**：场景编号自动显示

**验证点**:
- [ ] Tab 键循环切换 6 种元素类型
- [ ] Enter 键根据当前类型创建正确的默认类型
- [ ] Backspace 删除空元素并移动焦点
- [ ] 场景编号自动更新

#### Scenario 3: 文件导入 (P2)

1. 准备一个测试小说文件 `test.txt`（包含 3 个章节）
2. 进入项目，点击"导入文件"
3. 上传 `test.txt`
4. **预期**：系统显示导入进度，完成后展示转换结果
5. 查看角色列表
6. **预期**：自动提取的角色列表显示

**验证点**:
- [ ] 文件导入在 120 秒内完成
- [ ] 章节/场景边界正确识别
- [ ] 角色列表自动提取

#### Scenario 4: 版本控制 (P3)

1. 编辑剧本并保存（版本 1）
2. 修改对白内容并保存（版本 2）
3. 点击"版本历史"
4. **预期**：显示版本列表（版本 1、版本 2）
5. 选择版本 1，点击"回溯"
6. **预期**：剧本恢复到版本 1 内容，当前版本变为版本 3

**验证点**:
- [ ] 版本历史正确记录
- [ ] 版本回溯在 5 秒内完成
- [ ] diff 对比正确显示差异

#### Scenario 5: 质量评估 (P1)

1. 创建一个包含 5 集的剧本
2. 查看质量评估仪表盘
3. **预期**：显示钩子强度、节奏曲线、角色均衡、对白占比、场景多样性指标

**验证点**:
- [ ] 质量指标在 3 秒内计算完成
- [ ] 指标数值合理
- [ ] 未回收伏笔有警告提示

#### Scenario 6: API 成本控制 (P1)

1. 设置项目 Token 预算为 10000
2. 触发多次 Agent 生成任务
3. 当用量达到 80% 时
4. **预期**：界面显示预算警告
5. 继续使用直到达到 100%
6. **预期**：Agent 任务暂停，提示调整预算

**验证点**:
- [ ] 警告阈值（80%）触发时显示提示
- [ ] 硬上限（100%）触发时暂停 AI 任务
- [ ] Token 用量实时更新

## API 验证

### 创建项目并生成大纲

```bash
# 创建项目
curl -X POST http://localhost:8080/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试项目",
    "genre": ["都市", "复仇"],
    "format": "short_drama"
  }'

# 生成大纲（使用返回的 project_id）
curl -X POST http://localhost:8080/api/v1/agent/generate-outline \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "<project_id>",
    "input_type": "one_sentence",
    "input_content": "写一个都市复仇短剧",
    "style_preset": "revenge",
    "target_episodes": 10
  }'

# 预期：返回 session_id 和 websocket_url
# 通过 WebSocket 接收进度更新
```

### 检查质量评估

```bash
curl http://localhost:8080/api/v1/projects/<project_id>/script/quality

# 预期：返回 JSON 包含各指标的值、目标、状态
```

## 本地开发启动

### 后端（Spring Boot）

```bash
cd backend

# 启动 PostgreSQL 和 Redis
docker compose up -d postgres redis

# 配置环境变量（或在 application-dev.yml 中设置）
export DASHSCOPE_API_KEY=sk-xxx

# 运行数据库迁移
mvn flyway:migrate

# 启动应用
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 前端（Next.js）

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

### 服务启动失败

```bash
# 查看日志
docker compose logs backend
docker compose logs frontend

# 常见问题：
# - 端口被占用：修改 docker-compose.yml 中的端口映射
# - API Key 未配置：检查 .env 文件
# - 数据库连接失败：等待 postgres 健康检查通过
# - JDK 版本不兼容：确保使用 JDK 17+
```

### Agent 生成超时

```bash
# 检查后端日志
docker compose logs -f backend

# 常见原因：
# - API Key 无效或额度不足
# - 网络连接问题
# - LLM 服务响应慢
# - 可在 application.yml 中调整 agentscope.agent.max-iters
```

### 文件导入失败

```bash
# 检查文件编码
file -i test.txt

# 常见原因：
# - 文件编码非 UTF-8：转换编码后重试
# - 文件过大：超过 50 万字限制
# - 格式不支持：仅支持 .txt/.docx/.md/.fountain
```
