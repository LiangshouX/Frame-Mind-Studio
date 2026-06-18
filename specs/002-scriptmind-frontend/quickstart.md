# Quickstart: ScriptMind 前端重建

**Date**: 2026-06-18
**Feature**: ScriptMind 前端重建

## Prerequisites

- Node.js 20+
- npm 10+ 或 pnpm 8+
- 后端服务运行中（参照 `specs/001-scriptmind-screenplay-factory/quickstart.md`）
- 至少一个 LLM 提供商的 API Key 已在后端配置

## Quick Start

### 1. 清除现有代码并重建

```bash
cd frontend

# 备份现有代码（git 已处理）
# 删除 src 目录下所有文件
rm -rf src/*

# 安装依赖（如果 package.json 有更新）
npm install

# 初始化 shadcn/ui
npx shadcn@latest init

# 安装所需 shadcn/ui 组件
npx shadcn@latest add button card input textarea badge dialog tabs \
  scroll-area select toast progress tooltip dropdown-menu separator skeleton
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 验证场景

#### Scenario 1: 首页与项目创建 (P1)

1. 访问 http://localhost:3000
2. **预期**：显示首页，包含平台介绍、工作流程、Agent 团队介绍
3. 点击"打开工作台"
4. **预期**：显示项目列表页（可能为空）
5. 点击"新建项目"
6. 输入标题："测试项目"
7. 选择题材标签：都市、复仇
8. 选择目标形态：短剧
9. 点击创建
10. **预期**：项目创建成功，跳转到项目工作台

**验证点**:
- [ ] 首页加载时间 < 2 秒
- [ ] 项目列表页空状态显示引导提示
- [ ] 新建项目表单验证正常
- [ ] 创建成功后正确跳转

#### Scenario 2: Agent 大纲生成 (P1)

1. 进入已创建的项目
2. 在 Agent 交互面板输入："写一个现代都市复仇短剧，女主被渣男背叛后逆袭"
3. 选择风格预设："逆袭"
4. 点击发送
5. **预期**：界面显示 Agent 阶段进度标签（Showrunner → WorldBuilder → CharacterDesigner → ScriptDoctor）
6. **预期**：实时流式输出 Agent 文本内容
7. 生成完成后进入人类审核节点
8. **预期**：显示大纲内容预览和审核按钮
9. 点击"批准"
10. **预期**：大纲保存成功，大纲查看器显示集数规划

**验证点**:
- [ ] Agent 阶段进度实时显示
- [ ] 流式输出延迟 < 500ms
- [ ] 人类审核节点正常工作
- [ ] 大纲保存后可查看

#### Scenario 3: 剧本编辑器 (P1)

1. 在已生成大纲的项目中点击"细化为剧本"
2. 等待剧本生成完成
3. 进入剧本编辑器
4. 在编辑器中输入内容
5. 按 Tab 键切换元素类型
6. **预期**：元素类型按 scene_heading → action → character → dialogue → parenthetical → transition 循环切换
7. 输入对白后按 Enter
8. **预期**：新建段落默认为 action 类型
9. 查看左侧边栏
10. **预期**：场景编号自动显示

**验证点**:
- [ ] Tab 键循环切换 6 种元素类型
- [ ] Enter 键根据当前类型创建正确的默认类型
- [ ] Backspace 删除空元素并移动焦点
- [ ] 场景编号自动更新
- [ ] 元素类型视觉区分正确

#### Scenario 4: 自动保存与版本快照 (P1)

1. 在编辑器中修改内容
2. 等待 30 秒（不手动保存）
3. 刷新页面
4. **预期**：修改内容已自动保存（防丢数据）
5. 修改内容后按 Ctrl+S 手动保存
6. 打开版本历史面板
7. **预期**：版本列表中显示手动保存的版本快照

**验证点**:
- [ ] 30 秒防抖自动保存正常工作
- [ ] 手动保存创建版本快照
- [ ] 自动保存不创建版本快照
- [ ] 刷新页面后内容不丢失

#### Scenario 5: 角色与伏笔管理 (P2)

1. 进入项目工作台
2. 打开角色面板
3. **预期**：显示按类型分组的角色列表
4. 点击某个角色查看详情
5. 修改角色描述并保存
6. 打开伏笔追踪面板
7. **预期**：显示按状态分组的伏笔列表
8. 将一个伏笔标记为"已回收"

**验证点**:
- [ ] 角色列表正确分组显示
- [ ] 角色详情可查看和编辑
- [ ] 伏笔列表正确分组显示
- [ ] 伏笔状态可更新

#### Scenario 6: 版本控制 (P3)

1. 在编辑器中进行多次编辑并手动保存
2. 打开版本历史面板
3. **预期**：显示版本列表
4. 选择一个早期版本
5. 点击"回溯到此版本"
6. **预期**：剧本内容恢复到该版本
7. 选择两个版本进行对比
8. **预期**：高亮显示差异

**验证点**:
- [ ] 版本历史正确记录
- [ ] 版本回溯在 5 秒内完成
- [ ] Diff 对比正确显示差异

#### Scenario 7: 后端不可用处理 (P1)

1. 停止后端服务
2. 在编辑器中修改内容
3. **预期**：编辑器正常工作（内容保存在 localStorage）
4. 尝试执行需要后端的操作（如保存）
5. **预期**：显示后端不可用错误提示
6. 恢复后端服务
7. 点击"重试连接"
8. **预期**：连接恢复，localStorage 中的草稿可同步

**验证点**:
- [ ] 后端不可达时显示全屏错误页
- [ ] 编辑内容保存在 localStorage
- [ ] 后端恢复后可重新连接
- [ ] localStorage 草稿可同步

#### Scenario 8: Agent 生成过程中导航离开 (P1)

1. 触发 Agent 大纲生成
2. 在生成过程中导航到设置页面
3. **预期**：导航栏显示小型进度指示器（旋转图标 + 阶段名称）
4. 返回项目工作台
5. **预期**：Agent 仍在执行，进度正确显示

**验证点**:
- [ ] 导航离开时 Agent 后台继续执行
- [ ] 导航栏进度指示器正确显示
- [ ] 返回后进度正确恢复

## 本地开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 运行 E2E 测试
npx playwright test
```

## Troubleshooting

### 前端启动失败

```bash
# 清除缓存
rm -rf .next node_modules
npm install

# 检查 Node.js 版本
node --version  # 需要 20+
```

### shadcn/ui 组件安装失败

```bash
# 重新初始化
npx shadcn@latest init

# 单个组件安装
npx shadcn@latest add button
```

### WebSocket 连接失败

```bash
# 确认后端 WebSocket 端点可访问
curl -v http://localhost:8080/ws/agent/test

# 常见原因：
# - 后端未启动
# - SockJS 端点路径不正确
# - 防火墙阻止 WebSocket 连接
```

### 编辑器性能问题

- 检查是否启用了不必要的重渲染（React DevTools Profiler）
- 确认 Slate.js 的 `onChange` 回调中没有昂贵的计算
- 使用 `useCallback` 和 `memo` 优化组件渲染
