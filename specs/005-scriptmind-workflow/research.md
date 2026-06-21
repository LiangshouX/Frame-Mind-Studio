# Research: ScriptMind 剧本工作流

**Date**: 2026-06-22
**Feature**: 005-scriptmind-workflow

## Existing Implementation Analysis

### 已有实现概览

| 层级 | 组件 | 状态 | 与新 Spec 的关系 |
|------|------|------|-----------------|
| **Backend PO** | ProjectPO | ✅ 可复用 | 需扩展字段（logline） |
| **Backend PO** | ScriptPO | ✅ 可复用 | 需扩展 formatType 支持传统影视 |
| **Backend PO** | CharacterPO | ⚠️ 需扩展 | 缺少 gender、persona 字段 |
| **Backend PO** | ForeshadowPO | ✅ 可复用 | 无需修改 |
| **Backend PO** | ScriptVersionPO | ❌ 需删除 | Spec 明确不需要版本管理 |
| **Backend PO** | AgentSessionPO | ✅ 可复用 | Agent 会话管理 |
| **Backend PO** | AgentMessagePO | ✅ 可复用 | Agent 消息记录 |
| **Backend PO** | ProjectBudgetPO | ✅ 可复用 | Token 预算管理 |
| **Backend Service** | ScriptService | ⚠️ 需重构 | 移除版本管理逻辑，适配工作流 |
| **Backend Service** | CharacterService | ⚠️ 需扩展 | 增加 CRUD 能力 |
| **Backend Service** | QualityService | ✅ 可复用 | 审查功能基础 |
| **Backend Service** | ImportService | ✅ 可复用 | 文件解析能力 |
| **Backend Service** | ForeshadowService | ✅ 可复用 | 伏笔追踪 |
| **Backend Service** | AgentSessionService | ✅ 可复用 | Agent 会话管理 |
| **Backend Controller** | ScriptController | ⚠️ 需重构 | 适配工作流 API |
| **Backend Controller** | CharacterController | ⚠️ 需扩展 | 增加创建/删除接口 |
| **Backend Controller** | AgentController | ⚠️ 需扩展 | 增加工作流步骤 API |
| **Backend Controller** | VersionController | ❌ 需删除 | Spec 不需要版本管理 |
| **Backend Agent** | ShowrunnerAgent | ✅ 可复用 | 大纲生成 |
| **Backend Agent** | WorldBuilderAgent | ✅ 可复用 | 世界观设定 |
| **Backend Agent** | CharacterDesignerAgent | ✅ 可复用 | 角色设计 |
| **Backend Agent** | ScriptDoctorAgent | ✅ 可复用 | 审查修订 |
| **Backend** | PipelineOrchestrator | ✅ 可复用 | Agent 编排 |
| **Backend** | AgentCallAdapter 体系 | ✅ 可复用 | LLM 调用抽象 |
| **Frontend Page** | scriptmind/page.tsx | ⚠️ 需重构 | 从单页编辑器改为 5-Tab 工作流 |
| **Frontend Page** | scriptmind/outline/page.tsx | ❌ 需删除 | 整合到大纲 Tab |
| **Frontend Page** | scriptmind/import/page.tsx | ❌ 需删除 | 整合到上传功能 |
| **Frontend Component** | ScriptEditor | ✅ 可复用 | 剧本编辑器 |
| **Frontend Component** | CharacterPanel | ✅ 可复用 | 角色展示 |
| **Frontend Component** | ForeshadowTracker | ✅ 可复用 | 伏笔追踪 |
| **Frontend Component** | SceneNav | ✅ 可复用 | 场景导航 |
| **Frontend Component** | AgentChat | ✅ 可复用 | AI 对话 |
| **Frontend Store** | project-store | ⚠️ 需扩展 | 增加工作流状态 |
| **Frontend Store** | editor-store | ✅ 可复用 | 编辑器状态 |
| **Frontend Store** | agent-store | ✅ 可复用 | Agent 状态 |
| **DB Migration** | V1__init_schema.sql | ⚠️ 需扩展 | 增加新表/字段 |
| **Shared Types** | script.ts | ⚠️ 需扩展 | 增加传统影视模型 |

### 需要删除的冗余实现

1. **ScriptVersionPO** + **ScriptVersionRepository** — Spec 明确"不需要管理历史版本，新内容直接覆盖"
2. **VersionController** — 版本管理 API 不再需要
3. **ScriptService 中的版本管理逻辑** — saveVersionSnapshot()、getVersionHistory()、restoreVersion()、diffVersions()
4. **前端 VersionHistory 组件引用** — scriptmind/page.tsx 中的版本 Tab
5. **前端 versions API** — lib/api/versions.ts
6. **前端 shared/types 中的版本相关类型**

### 数据模型冲突与解决方案

| 冲突点 | 现有实现 | Spec 要求 | 解决方案 |
|--------|----------|-----------|---------|
| Character 缺少字段 | 无 gender、persona | 需要 gender、persona（短剧）、overview | Flyway 迁移增加字段 |
| CharacterPO 字段命名 | role、description | roleType、identity、persona | 重命名或增加字段 |
| ScriptContent 仅支持短剧 | Scene → Beat → Dialogue | 短剧 + 传统影视双模型 | JSONB content 灵活存储 |
| ProjectPO 缺少 logline | 无 logline 字段 | 创建时需填写一句话梗概 | Flyway 迁移增加字段 |
| 无 WorldSetting 实体 | 无 | 需要世界观设定存储 | 新增 world_settings 表 |
| 无 Synopsis 实体 | 无 | 需要梗概存储 | 新增 synopses 表 |
| 无 Outline 实体 | 无 | 需要大纲存储 | 新增 outlines 表 |
| 无 ReviewReport 实体 | 无 | 需要审查报告存储 | 新增 review_reports 表 |
| 无 WorkflowState 实体 | 无 | 需要跟踪各步骤完成状态 | 新增 workflow_states 表或在 ProjectPO 中扩展 |

## Key Decisions

### Decision 1: 数据模型扩展策略

**Decision**: 采用 Flyway 增量迁移（V2）扩展现有表 + 新建独立表的方式。

**Rationale**: 
- 现有 6 张核心表（projects, scripts, characters, foreshadows, agent_sessions, agent_messages）结构合理，可复用
- 新增 4 张表（world_settings, synopses, outlines, review_reports）对应工作流新步骤
- CharacterPO 通过迁移增加字段而非重建，避免数据迁移风险

**Alternatives considered**:
- 完全重建数据库：风险高，现有数据可能丢失
- 全部用 JSONB 存储：查询性能差，无法建立索引

### Decision 2: 前端页面架构

**Decision**: 将现有 scriptmind/page.tsx 从单页编辑器重构为 Tab 导航工作流页面。

**Rationale**:
- 现有 3 列布局（SceneNav + Editor + SidePanel）需要完全重构为 5-Tab 结构
- 每个 Tab 内部可复用现有组件（ScriptEditor、CharacterPanel 等）
- 新增 AI 对话面板组件，贯穿所有 Tab

**Alternatives considered**:
- 保留现有布局，在侧边栏增加 Tab：空间不足，体验差
- 每个 Tab 独立页面：增加路由复杂度，Tab 切换不流畅

### Decision 3: AI Agent 架构

**Decision**: 扩展现有 Agent 体系，为每个工作流步骤增加对应的 Agent 能力。

**Rationale**:
- 现有 4 个 Agent（Showrunner/WorldBuilder/CharacterDesigner/ScriptDoctor）覆盖了大部分场景
- 需要新增"创意对话 Agent"和"梗概生成 Agent"
- AgentCallAdapter 接口已支持流式输出和工具调用
- 需要集成网络搜索（Tavily）和长期记忆能力

**Alternatives considered**:
- 使用单一万能 Agent：上下文窗口限制，质量难以保证
- 完全重写 Agent 体系：浪费已有工作

### Decision 4: 版本管理移除

**Decision**: 完全移除版本管理功能，所有编辑直接覆盖保存。

**Rationale**:
- Spec 明确"不需要管理历史版本，新内容直接覆盖"
- 移除 ScriptVersionPO、VersionController、版本管理相关 Service 方法
- 前端移除 VersionHistory 组件和版本 API

**Alternatives considered**:
- 保留版本管理但隐藏：增加维护成本，与 Spec 矛盾

## Open Questions

无。所有技术决策已通过 Spec Clarifications 确定。
