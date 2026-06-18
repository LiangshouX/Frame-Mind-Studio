# Research: ScriptMind 前端功能细化

**Date**: 2026-06-18 | **Feature**: [spec.md](./spec.md)

## Research Tasks

### R1: Slate.js 反向序列化（slateToScript）

**Question**: 如何将 Slate.js 编辑器状态反向转换为结构化的 `ScriptContent` 格式？

**Decision**: 实现自定义 `slateToScript` 函数，基于节点类型的顺序解析重建层级结构。

**Rationale**:
- Slate 编辑器状态是一个扁平的 `Descendant[]` 数组，每个节点有 `type` 属性
- `scriptToSlate` 已将层级结构（episodes → scenes → beats）展平，`slateToScript` 需要反转这个过程
- 关键规则：`scene_heading` 节点标记新 scene 的开始，`episode_heading` 标记新 episode 的开始
- 不在 Slate 中存储元数据（moodTags 等），仅转换文本和结构

**Alternatives considered**:
- 在 Slate 节点中存储元数据属性：增加编辑器复杂度，与澄清决策（Q1）不符
- 使用 Slate 的 `Editor.nodes` API 按类型查询：过于复杂，顺序解析更简单直接

**Implementation approach**:
```
遍历 editor.children:
  遇到 episode_heading → 创建新 Episode
  遇到 scene_heading → 创建新 Scene，添加到当前 Episode
  遇到 dialogue/action/transition/parenthetical → 创建 Beat，添加到当前 Scene
  character 类型 + dialogue 类型 → 合并为带 characterName 的 dialogue Beat
```

### R2: Zustand Store 中的流式消息结束标记

**Question**: 如何在 Agent 任务完成时正确标记所有流式消息为已完成？

**Decision**: 在 `agent-store` 中新增 `finishStreaming` action。

**Rationale**:
- `appendStream` 创建消息时设置 `isStreaming: true`
- `complete` WebSocket 消息到达时需要将所有 `isStreaming: true` 的消息设为 `false`
- 当前 `use-websocket.ts` 中有注释 `// mark all streaming messages as done` 但未实现

**Implementation approach**:
```typescript
finishStreaming: () => set(state => ({
  messages: state.messages.map(m =>
    m.isStreaming ? { ...m, isStreaming: false } : m
  )
}))
```

### R3: 自动保存防抖策略

**Question**: 如何修复自动保存读取 stale props 的 bug，同时避免与手动保存冲突？

**Decision**: 使用 `useRef` 持有编辑器引用，自动保存时从 ref 读取当前状态。

**Rationale**:
- 当前 `autoSave` 通过 `useMemo` + `debounce` 创建，闭包捕获了 `script?.content`（props）
- `useMemo` 的依赖 `[projectId, script]` 导致每次 script 变化时 debounce 重置
- 需要用 `useRef` 保存 editor 实例引用，自动保存时从 ref 读取 `editor.children`

**Alternatives considered**:
- 将 editor state 存入 Zustand store：增加状态同步复杂度，Slate 已有自己的状态管理
- 使用 `useSyncExternalStore`：过度设计，ref 方案更简单

**Implementation approach**:
```typescript
const editorRef = useRef<Editor>()
// autoSave 从 editorRef.current.children 读取并通过 slateToScript 转换
// 手动保存时取消 pending 的 autoSave（debounce.cancel()）
```

### R4: 版本历史 diff 渲染

**Question**: 如何展示两个版本之间的差异？

**Decision**: 使用简单文本 diff（逐行对比），新增 diff viewer 组件。

**Rationale**:
- 后端 `compareVersions` API 返回 diff 数据
- 前端需要一个简单的 diff 渲染组件
- 初期实现逐行文本 diff，后续可升级为结构化 diff

**Alternatives considered**:
- 使用 `diff` 库（如 `jsdiff`）：引入新依赖，当前阶段用简单实现即可
- 结构化 diff（按 scene/beat 对比）：复杂度高，延期实现

### R5: 右侧面板标签页切换

**Question**: 如何在编辑器右侧面板实现角色/伏笔/版本历史的标签页切换？

**Decision**: 在 scriptmind 页面中添加标签页状态管理，条件渲染三个面板组件。

**Rationale**:
- 当前右侧面板直接渲染 `CharacterPanel` 和 `ForeshadowTracker`
- 需要改为标签页切换，使用简单的 `useState` 管理当前标签
- 标签页 UI 使用 Tailwind 样式，无需引入额外 UI 库

**Implementation approach**:
```typescript
const [activeTab, setActiveTab] = useState<'characters' | 'foreshadows' | 'versions'>('characters')
// 标签按钮 + 条件渲染对应面板
```
