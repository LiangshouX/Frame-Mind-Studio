# Quickstart Validation: Agent Module Architecture Refactor

**Date**: 2026-06-25
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Java 17+
- Maven Wrapper (`./mvnw`)
- PostgreSQL running (Docker: `docker-compose up -d postgres redis`)

## Validation Scenarios

### V1: 编译验证 — agent/ 包无反向依赖

**目的**: 验证 FR-001 — `agent/` 包不包含任何对 `modules/` 的 import

```bash
cd backend-java
# 编译整个项目
./mvnw compile

# 检查 agent/ 包是否 import 了 modules/
grep -r "import io.framemind.modules" src/main/java/io/framemind/agent/
# 预期: 无输出（0 匹配）
```

### V2: Tool 归属验证

**目的**: 验证 FR-002/FR-003 — 业务 Tool 在模块内，通用 Tool 在框架层

```bash
# 检查 agent/tool/ 下只有 WebSearchTool
ls src/main/java/io/framemind/agent/tool/
# 预期: 只有 WebSearchTool.java

# 检查 modules/scriptmind/tool/ 包含 4 个业务 Tool
ls src/main/java/io/framemind/modules/scriptmind/tool/
# 预期: CharacterTool.java, OutlineTool.java, ScriptTool.java, SynopsisTool.java
```

### V3: 死代码清理验证

**目的**: 验证 FR-004 — 5 个未使用的 Agent 类已删除

```bash
# 检查 modules/scriptmind/agent/ 目录不存在或为空
ls src/main/java/io/framemind/modules/scriptmind/agent/ 2>/dev/null
# 预期: 目录不存在或无 .java 文件

# 全局搜索确认无残留引用
grep -r "ShowrunnerAgent\|CreativeAgent\|CharacterDesignerAgent\|WorldBuilderAgent\|ScriptDoctorAgent" src/
# 预期: 无输出（0 匹配）
```

### V4: Agent 定义归属验证

**目的**: 验证 FR-005/FR-006 — Agent 定义在模块层注册

```bash
# 检查 agent/config/AgentScopeConfig 不包含 ScriptMind agent 定义
grep -A5 "creative_agent\|synopsis_agent\|character_agent\|outline_agent\|script_agent" \
  src/main/java/io/framemind/agent/config/AgentScopeConfig.java
# 预期: 无匹配（定义已移入模块层）

# 检查模块层有配置类
ls src/main/java/io/framemind/modules/scriptmind/config/
# 预期: ScriptMindAgentConfig.java
```

### V5: PipelineOrchestrator 清理验证

**目的**: 验证 FR-008 — 无 @Deprecated 方法

```bash
grep -c "@Deprecated" src/main/java/io/framemind/agent/orchestration/PipelineOrchestrator.java
# 预期: 0
```

### V6: 硬编码映射移除验证

**目的**: 验证 FR-007 — AgentScopeAgentFactory 无硬编码 agent → tool 映射

```bash
grep -c "switch\|case \"creative_agent\"\|case \"synopsis_agent\"" \
  src/main/java/io/framemind/agent/core/AgentScopeAgentFactory.java
# 预期: 0（switch 已移除）
```

### V7: 功能回归验证

**目的**: 验证 FR-009 — 所有现有功能保持不变

```bash
cd backend-java

# 运行所有测试
./mvnw test
# 预期: 全部通过，0 failures

# 启动应用
./mvnw spring-boot:run
# 预期: 启动成功，无异常

# 手动测试（可选）：
# 1. 创建项目 → POST /api/v1/projects
# 2. 启动 workflow → POST /api/v1/projects/{id}/workflow/world-setting
# 3. 检查 WebSocket 推送正常
```

### V8: 模块化扩展验证（可选）

**目的**: 验证 SC-005 — 新增模块无需修改 agent/ 包

```bash
# 创建一个最小测试模块
mkdir -p src/main/java/io/framemind/modules/testmodule/config
# 创建 TestModuleAgentConfig 注册一个 agent 定义和空 Tool 列表
# 编译验证
./mvnw compile
# 预期: 编译成功，agent/ 包代码未修改
```

## Exit Criteria

| 验证项 | 对应 FR | 检查方式 | 通过条件 |
|---|---|---|---|
| V1 | FR-001, FR-011 | grep import | 0 matches |
| V2 | FR-002, FR-003 | ls + grep | 文件在正确位置 |
| V3 | FR-004 | ls + grep | 目录空/不存在，0 引用 |
| V4 | FR-005, FR-006 | grep + ls | 定义在模块层 |
| V5 | FR-008 | grep @Deprecated | 0 matches |
| V6 | FR-007 | grep switch | 0 matches |
| V7 | FR-009, FR-010 | mvnw test | 全部通过 |
| V8 | FR-012, SC-005 | mvnw compile | 编译成功 |
