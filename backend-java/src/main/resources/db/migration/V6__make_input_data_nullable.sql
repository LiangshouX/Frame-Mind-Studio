-- 将 agent_sessions.input_data 改为可空
-- 原因：并非所有会话都需要输入数据（如直接对话、AI 一键生成场景）
-- 原约束由 V1 创建时为 NOT NULL，但多处调用方（ProjectAgentController.createSession 等）传 null
ALTER TABLE agent_sessions ALTER COLUMN input_data DROP NOT NULL;
