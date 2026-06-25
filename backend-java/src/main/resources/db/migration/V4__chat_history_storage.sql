-- V4: Chat History Storage Enhancement
-- 新增 title 列和复合索引用于会话列表查询

-- 在 agent_sessions 表新增 title 列
ALTER TABLE agent_sessions ADD COLUMN title VARCHAR(200);

-- 新增复合索引：按 project + step + 时间倒序查询会话列表
CREATE INDEX idx_agent_sessions_project_step_created
    ON agent_sessions (project_id, workflow_step, created_at DESC);
