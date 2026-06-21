-- V2: ScriptMind 工作流 schema 扩展
-- 新增工作流步骤表、扩展现有表字段、删除版本管理表

-- 1. projects 表增加 logline 字段
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logline TEXT;

-- 2. characters 表增加新字段
ALTER TABLE characters ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE characters ADD COLUMN IF NOT EXISTS identity VARCHAR(255);
ALTER TABLE characters ADD COLUMN IF NOT EXISTS persona TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS overview TEXT;

-- 3. 新建 world_settings 表（世界观设定，1:1 with project）
CREATE TABLE IF NOT EXISTS world_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. 新建 synopses 表（梗概，1:1 with project）
CREATE TABLE IF NOT EXISTS synopses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. 新建 outlines 表（大纲，1:1 with project）
CREATE TABLE IF NOT EXISTS outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}',
    format VARCHAR(50) NOT NULL DEFAULT 'episode_list',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. 新建 review_reports 表（审查报告）
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL,
    episode_number INTEGER,
    report JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_reports_project ON review_reports(project_id, created_at DESC);

-- 7. 删除版本管理相关表（Spec 明确不需要历史版本）
DROP TABLE IF EXISTS script_versions CASCADE;
