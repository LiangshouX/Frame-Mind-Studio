-- V1: Initial schema for FrameMind Studio
-- Drop legacy tables (from Python backend) if they exist, then recreate

-- Drop in reverse dependency order to avoid FK violations
DROP TABLE IF EXISTS agent_messages CASCADE;
DROP TABLE IF EXISTS agent_sessions CASCADE;
DROP TABLE IF EXISTS foreshadows CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS script_versions CASCADE;
DROP TABLE IF EXISTS scripts CASCADE;
DROP TABLE IF EXISTS project_budgets CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
-- Also drop Alembic version table from Python backend
DROP TABLE IF EXISTS alembic_version CASCADE;

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    genre JSONB NOT NULL DEFAULT '[]',
    format VARCHAR(50) NOT NULL DEFAULT 'short_drama',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    target_episodes INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Scripts table (1:1 with project)
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    format_type VARCHAR(50) NOT NULL DEFAULT 'fountain',
    word_count INTEGER NOT NULL DEFAULT 0,
    scene_count INTEGER NOT NULL DEFAULT 0,
    episode_count INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Script versions (version history)
CREATE TABLE script_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content JSONB NOT NULL,
    message VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(script_id, version)
);
CREATE INDEX idx_script_versions_script_id ON script_versions(script_id);

-- Characters
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'supporting',
    description TEXT,
    personality JSONB DEFAULT '[]',
    appearance TEXT,
    background TEXT,
    goals TEXT,
    relationships JSONB DEFAULT '[]',
    dialogue_style TEXT,
    arc TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);
CREATE INDEX idx_characters_project_id ON characters(project_id);

-- Foreshadows
CREATE TABLE foreshadows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    plant TEXT NOT NULL,
    payoff TEXT,
    episode_hint INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'planted',
    urgency VARCHAR(20) NOT NULL DEFAULT 'medium',
    character_id VARCHAR(36),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_foreshadows_project_status ON foreshadows(project_id, status);

-- Project budget (1:1 with project)
CREATE TABLE project_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    token_limit BIGINT NOT NULL DEFAULT 1000000,
    tokens_used BIGINT NOT NULL DEFAULT 0,
    warning_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.80,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Agent sessions
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    input_data JSONB NOT NULL,
    output_data JSONB,
    tokens_consumed INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_agent_sessions_project_id ON agent_sessions(project_id);

-- Agent messages
CREATE TABLE agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    agent_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    message_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_agent_messages_session_order ON agent_messages(session_id, message_order);
