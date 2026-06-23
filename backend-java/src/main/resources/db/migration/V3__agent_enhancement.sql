-- V3: Agent Enhancement — 支持 per-tab 聊天、富消息类型、Agent 配置覆盖、乐观锁

-- 1. agent_sessions 表增加 workflow_step 和 agent_name 字段
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS workflow_step VARCHAR(50);
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS agent_name VARCHAR(50);

-- 新增索引：按 project_id + workflow_step 查询会话
CREATE INDEX IF NOT EXISTS idx_agent_sessions_project_workflow
    ON agent_sessions(project_id, workflow_step);

-- 2. agent_messages 表增加 message_type 和 metadata 字段
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 3. 新建 agent_config_overrides 表（项目级 Agent 配置覆盖）
CREATE TABLE IF NOT EXISTS agent_config_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_name VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, agent_name)
);
CREATE INDEX IF NOT EXISTS idx_agent_config_overrides_project
    ON agent_config_overrides(project_id);

-- 4. characters 表增加 version 字段（乐观锁）
ALTER TABLE characters ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
