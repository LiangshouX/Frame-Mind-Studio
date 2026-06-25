# Quickstart Validation: ScriptMind Chat History Storage

**Date**: 2026-06-25

## Prerequisites

- Docker Compose 运行中（PostgreSQL, Redis, Backend, Frontend）
- 已有至少一个项目和一个 workflow step 的数据

## 验证场景

### 场景 1：会话隔离 (P1)

1. 打开项目 → 进入 "大纲" 步骤
2. 发送消息 "请帮我设计主角" → 等待 AI 回复
3. 点击右侧边栏 "新建对话" 按钮
4. 发送消息 "请帮我设计反派" → 等待 AI 回复
5. **验证**: 在数据库中检查 `agent_sessions` 表，确认有 2 条独立记录，各自的消息不混杂

### 场景 2：历史对话浏览 (P2)

1. 在 "大纲" 步骤创建 3 个不同对话
2. 查看右侧边栏 → **验证**: 显示 3 个会话条目，含标题和时间戳
3. 点击第 2 个会话 → **验证**: 聊天区域加载该会话的完整历史消息
4. 刷新页面 → **验证**: 仍然停留在上次查看的会话

### 场景 3：自动标题 (P3)

1. 创建新会话，发送 "帮我设计一个科幻世界观"
2. 等待 AI 回复完成
3. **验证**: 右侧边栏显示自动生成的标题（如 "科幻世界观设计"）
4. 右键/点击编辑标题 → 修改为 "我的科幻世界" → **验证**: 标题被保留，不会被覆盖

### 场景 4：删除会话 (P3+)

1. 在右侧边栏对某个会话执行删除操作
2. **验证**: 弹出确认对话框
3. 确认删除 → **验证**: 会话从列表消失，数据库中记录被删除

### 场景 5：Block 类型保真 (P4)

1. 发送一个会触发工具调用的消息（如 "搜索项目中的文件"）
2. 等待 AI 完成工具调用和回复
3. 重启后端服务
4. 刷新页面，加载该会话
5. **验证**: 工具调用和思考块仍然显示为可折叠的结构化块，而非纯文本

### 场景 6：Legacy 数据兼容

1. 检查数据库中迁移前创建的旧会话
2. **验证**: 旧会话在列表中显示为 "未命名对话"（或类似回退标题）
3. 点击旧会话 → **验证**: 消息正常显示（作为文本块）

## 运行测试

```bash
# 后端单元测试
cd backend-java
./mvnw test -Dtest=AgentSessionServiceTest
./mvnw test -Dtest=JpaAgentStateStoreTest
./mvnw test -Dtest=PipelineOrchestratorTest

# 前端测试
cd frontend
npm run test -- --run agent-store
npm run test -- --run ChatHistorySidebar
```
