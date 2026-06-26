-- V5: Fix Session Management — 添加 title_source 列区分自动/手动标题

-- 在 agent_sessions 表新增 title_source 列
ALTER TABLE agent_sessions ADD COLUMN title_source VARCHAR(20) DEFAULT 'auto';

-- 为已有的 title 非空的会话设置 title_source 为 'auto'
UPDATE agent_sessions SET title_source = 'auto' WHERE title IS NOT NULL AND title != '';
