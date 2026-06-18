# Quickstart Validation: ScriptMind 前端功能细化

**Date**: 2026-06-18 | **Feature**: [spec.md](./spec.md)

## Prerequisites

- 后端服务运行在 `http://localhost:8080`
- 前端开发服务器运行在 `http://localhost:3000`
- 至少有一个已创建的项目
- 后端数据库中 `agent_sessions.input_data` 列已修复为允许 NOT NULL（见 003 之前的 hotfix）

## Validation Scenarios

### VS1: Agent 聊天交互闭环

**Steps**:
1. 访问 `http://localhost:3000/projects/[id]`（工作台页面）
2. 在右侧 Agent 面板输入一句话梗概，如 "写一个现代都市复仇短剧"
3. 点击发送按钮

**Expected**:
- [ ] Agent 阶段进度标签实时更新（Showrunner → WorldBuilder → CharacterDesigner → ScriptDoctor）
- [ ] 消息列表自动滚动到最新内容
- [ ] 流式输出完成后，"输出中..."标记消失
- [ ] 底部显示 Token 消耗量和连接状态

**Error case**:
1. 停止后端服务
2. 在 Agent 面板输入内容并发送

**Expected**:
- [ ] 聊天界面显示红色错误消息，而非静默失败

---

### VS2: 大纲→剧本细化

**Steps**:
1. 在工作台页面通过 Agent 生成大纲
2. 大纲显示后，查看大纲顶部

**Expected**:
- [ ] "细化为剧本"按钮可见
3. 点击"细化为剧本"

**Expected**:
- [ ] Agent 面板启动新的生成任务
- [ ] 阶段进度标签显示

---

### VS3: 编辑器工具栏与保存

**Steps**:
1. 进入 `/projects/[id]/scriptmind`（编辑器页面）
2. 查看页面顶部

**Expected**:
- [ ] 工具栏显示元素类型选择器、保存状态、保存按钮
3. 在编辑器中输入内容
4. 按 Tab 键切换元素类型

**Expected**:
- [ ] 工具栏中的元素类型选择器同步高亮
5. 按 Ctrl+S

**Expected**:
- [ ] 工具栏显示"保存中..."
- [ ] 保存成功后显示"已保存"

---

### VS4: 自动保存正确性

**Steps**:
1. 在编辑器中输入一段独特内容（如 "测试自动保存 12345"）
2. 等待 30 秒
3. 刷新页面

**Expected**:
- [ ] 刷新后内容仍为 "测试自动保存 12345"（非被原始内容覆盖）

---

### VS5: 场景导航

**Steps**:
1. 在编辑器中有多个场景的项目中
2. 点击左侧 SceneNav 中的某个场景

**Expected**:
- [ ] 编辑器自动滚动到该场景位置
- [ ] 场景高亮显示

---

### VS6: 版本历史

**Steps**:
1. 在编辑器中修改内容
2. 按 Ctrl+S 手动保存
3. 再次修改并保存
4. 查看右侧面板的"版本历史"标签

**Expected**:
- [ ] 版本列表显示 2 个版本
- [ ] 选择一个版本点击"回溯"，编辑器内容恢复
- [ ] 选择两个版本点击"对比"，显示差异

---

### VS7: AI 优化建议

**Steps**:
1. 在编辑器中选中一段文本
2. 点击工具栏中的"AI 优化"按钮

**Expected**:
- [ ] OptimizePanel 在侧面展开
- [ ] 显示 2-3 种优化建议
- [ ] 点击"应用"后文本被替换

## Build Verification

```bash
cd frontend && npm run build
```

**Expected**: Build passes with no TypeScript errors.
