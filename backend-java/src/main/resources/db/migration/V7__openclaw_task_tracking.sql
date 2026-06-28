-- V7: OpenClaw 任务追踪
-- 记录每次 OpenClaw 调用的任务信息，用于调试、审计和重试

CREATE TABLE IF NOT EXISTS openclaw_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    task_id VARCHAR(100) NOT NULL UNIQUE,
    task_type VARCHAR(50) NOT NULL,
    agent_name VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    request_payload JSONB,
    response_payload JSONB,
    token_usage JSONB,
    used_skills JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_openclaw_tasks_session
    ON openclaw_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_tasks_status
    ON openclaw_tasks(status);

-- agent_messages 表增加 task_id 关联字段
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS task_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_agent_messages_task
    ON agent_messages(task_id);
