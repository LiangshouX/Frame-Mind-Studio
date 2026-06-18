# Research: ScriptMind 前端重建

**Date**: 2026-06-18
**Feature**: ScriptMind 前端重建

## Research Tasks

### 1. 前端清除与重建策略

**Decision**: 完全删除 `frontend/src/` 目录下所有文件，保留 `package.json`、`tailwind.config.ts`、`tsconfig.json` 等配置文件作为基础，从空 `src/` 目录开始重建。

**Rationale**:
- 现有代码结构混乱，存在大量遗留代码和未使用的文件
- 从零重建可以确保代码质量和架构一致性
- 保留配置文件避免重复配置依赖和构建工具
- `package.json` 中的依赖列表基本正确（Next.js、shadcn/ui、Slate.js、Zustand），可作为重建的依赖基础

**Implementation notes**:
- 清除前备份现有代码（git commit）
- 删除 `frontend/src/` 下所有文件和目录
- 保留 `frontend/package.json`、`frontend/tailwind.config.ts`、`frontend/tsconfig.json`、`frontend/next.config.js`、`frontend/postcss.config.js`
- 检查并更新 `package.json` 中的依赖版本（如有需要）
- 从 `src/app/layout.tsx` 开始逐步重建

---

### 2. shadcn/ui 组件集成方案

**Decision**: 使用 shadcn/ui CLI 按需安装组件，不使用完整的组件库包

**Rationale**:
- shadcn/ui 不是传统的 npm 包，而是通过 CLI 将组件源码复制到项目中
- 每个组件都是独立的源文件，可以直接修改和定制
- 与 Tailwind CSS 深度集成，样式一致性强
- 支持 class-variance-authority (CVA) 实现组件变体

**Implementation notes**:
- 使用 `npx shadcn@latest init` 初始化 shadcn/ui 配置
- 按需安装组件：`npx shadcn@latest add button card input textarea badge dialog tabs scroll-area select toast progress tooltip dropdown-menu separator skeleton`
- 所有组件安装到 `src/components/ui/` 目录
- 自定义主题色通过 CSS 变量配置（`globals.css`）

---

### 3. Slate.js 剧本编辑器方案

**Decision**: 基于 Slate.js 0.124+ 构建自定义剧本编辑器，使用自定义 Element 类型实现 6 种剧本元素

**Rationale**:
- Slate.js 是高度可定制的富文本编辑器框架，文档模型为 JSON 树结构
- 与剧本的 ScriptContent JSON Schema 天然对齐
- 原生支持键盘快捷键自定义（Tab 切换、Enter 行为、Backspace 删除）
- React 生态，与 Next.js 无缝集成
- 支持自定义 Element 渲染，可为每种元素类型提供不同的视觉样式

**Implementation notes**:
- 定义 6 种自定义 Element 类型：`scene_heading`、`action`、`character`、`dialogue`、`parenthetical`、`transition`
- 每种 Element 类型有独立的渲染组件（`editor-element.tsx`），提供不同的视觉样式
- Tab 键处理器：循环切换元素类型（scene_heading → action → character → dialogue → parenthetical → transition）
- Enter 键处理器：根据当前元素类型决定新段落的默认类型（对白后 → action，角色后 → dialogue）
- Backspace 键处理器：空元素时删除并移动焦点到上一个元素
- 编辑器内容变更时触发 30 秒防抖自动保存
- 手动保存（Ctrl+S / 保存按钮）触发版本快照创建
- 场景导航侧边栏通过遍历编辑器内容中的 scene_heading 元素自动生成

---

### 4. Zustand 状态管理方案

**Decision**: 使用 Zustand 5.0+ 管理全局状态，按关注点分离为多个 store

**Rationale**:
- Zustand 是轻量级的状态管理库，API 简洁，无 Provider 包裹
- 支持中间件（persist、devtools）
- 支持 TypeScript 类型推断
- 性能优秀，选择性订阅避免不必要的重渲染

**Implementation notes**:
- `project-store.ts`：项目列表状态（列表、当前项目、CRUD 操作）
- `agent-store.ts`：Agent 会话状态（阶段、消息列表、Token 消耗、审核状态）
- `editor-store.ts`：编辑器状态（当前元素类型、光标位置、场景列表、自动保存状态）
- `settings-store.ts`：设置状态（API Key 列表、模型列表）
- 使用 `persist` 中间件将用户偏好（如编辑器设置）保存到 localStorage
- 使用 `devtools` 中间件支持 Redux DevTools 调试

---

### 5. WebSocket 实时通信方案

**Decision**: 使用 STOMP over WebSocket（通过 SockJS 降级）接收 Agent 任务进度

**Rationale**:
- 后端使用 Spring WebSocket (STOMP) + SockJS，前端需匹配
- STOMP 协议提供消息订阅/发布语义，支持按 session_id 订阅
- SockJS 提供降级支持（WebSocket 不可用时回退到 HTTP 长轮询）
- 支持自动重连（指数退避策略）

**Implementation notes**:
- 使用 `@stomp/stompjs` + `sockjs-client` 库
- WebSocket 端点：`ws://localhost:8080/ws/agent/{session_id}`
- 消息类型：`stage_update`、`stream_chunk`、`hitl_prompt`、`complete`、`error`、`budget_warning`
- 自动重连：初始延迟 1 秒，最大延迟 30 秒，指数退避
- 连接状态管理：connecting / connected / disconnected / error
- 导航离开时保持 WebSocket 连接（后台继续接收进度）
- 导航栏进度指示器从全局 agent-store 读取当前阶段信息

---

### 6. API 客户端封装方案

**Decision**: 基于原生 fetch 封装统一的 API 客户端，每个业务域一个模块

**Rationale**:
- 原生 fetch 无额外依赖，Next.js 原生支持
- 统一封装错误处理、超时、重试逻辑
- 按业务域分离 API 模块，便于维护和测试

**Implementation notes**:
- `client.ts`：基础 fetch 封装，包含：
  - Base URL 配置（`http://localhost:8080/api/v1`）
  - JSON 请求/响应处理
  - 超时控制（默认 30 秒，文件上传 120 秒）
  - 错误分类（网络错误、超时、4xx、5xx）
  - 429 错误自动重试（指数退避，最多 3 次）
- 每个业务域模块（projects.ts、scripts.ts、agent.ts 等）导出类型安全的函数
- 文件上传使用 FormData + fetch
- 后端不可达时抛出特定错误，由全局错误边界捕获

---

### 7. 自动保存与版本快照方案

**Decision**: 30 秒防抖自动保存（防丢数据），手动保存（Ctrl+S / 保存按钮）触发版本快照创建

**Rationale**:
- 30 秒防抖间隔平衡了数据安全性和版本历史整洁性
- 自动保存仅保存内容，不创建版本快照，避免版本历史被微小编辑淹没
- 手动保存由用户显式触发，表示"这是一个值得记录的版本"
- localStorage 作为自动保存的临时存储，后端恢复后可同步

**Implementation notes**:
- 使用 debounce 工具函数，30 秒防抖间隔
- 自动保存流程：编辑器内容变更 → 30 秒后触发 → PATCH /projects/{id}/script（不创建版本快照）
- 手动保存流程：用户按 Ctrl+S 或点击保存按钮 → PATCH /projects/{id}/script（带 change_summary）→ 版本快照由后端创建
- localStorage 缓存：编辑器内容变更时同步保存到 localStorage，防止后端不可用时数据丢失
- 后端恢复后自动同步 localStorage 中的未保存内容

---

### 8. 后端不可用处理方案

**Decision**: 显示全屏错误页，提供"重试连接"按钮，已编辑的草稿保留在 localStorage 中

**Rationale**:
- 单用户本地部署场景下，Docker 容器可能停止或重启
- 用户可能正在编辑重要内容，不能丢失工作
- 全屏错误页明确告知用户当前状态，避免困惑

**Implementation notes**:
- 全局错误边界捕获 API 请求的网络错误
- 检测到后端不可达时显示全屏 `backend-offline.tsx` 组件
- "重试连接"按钮发送健康检查请求（GET /actuator/health）
- 编辑器内容变更时同步保存到 localStorage（key: `draft:{project_id}`）
- 后端恢复后检查 localStorage 中是否有未同步的草稿，提示用户是否恢复

---

### 9. 移动端响应式方案

**Decision**: 采用移动优先的响应式设计，核心功能在 375px 宽度下可用

**Rationale**:
- SC-011 要求所有页面在移动端（375px 宽度）下可用
- 剧本编辑器在移动端体验受限，但查看和基本编辑应可用
- Agent 交互面板在移动端应可正常输入和查看

**Implementation notes**:
- 使用 Tailwind CSS 的响应式前缀（sm/md/lg/xl）
- 移动端布局：侧边栏折叠为底部抽屉或顶部下拉
- 编辑器在移动端：全屏模式，隐藏场景导航侧边栏
- 项目列表：移动端单列卡片，桌面端网格布局
- Agent 交互面板：移动端全屏，输入栏固定在底部

---

### 10. 测试策略

**Decision**: Jest + React Testing Library 进行组件/单元测试，Playwright 进行 E2E 测试

**Rationale**:
- Jest + React Testing Library 是 React 生态的标准测试方案
- Playwright 支持多浏览器 E2E 测试，与 Next.js 集成良好
- 先编写关键路径的 E2E 测试，再补充组件测试

**Implementation notes**:
- 组件测试：使用 React Testing Library 测试组件渲染和交互
- Hook 测试：使用 `renderHook` 测试自定义 Hooks
- Store 测试：直接测试 Zustand store 的状态变更
- E2E 测试：覆盖 10 个 User Story 的关键路径
- 测试文件与源文件同目录（`__tests__/` 子目录或 `.test.tsx` 后缀）

## Alternatives Considered

### 状态管理：Redux Toolkit vs Zustand

- Redux Toolkit：更成熟，生态更丰富，但样板代码多，学习曲线陡峭
- **选择 Zustand**：API 简洁，无 Provider 包裹，TypeScript 支持好，性能优秀

### 编辑器：ProseMirror vs Slate.js vs Tiptap

- ProseMirror：底层框架，需要大量自定义工作
- Tiptap：基于 ProseMirror 的封装，更易用但定制性略差
- **选择 Slate.js**：JSON 文档模型与剧本 Schema 天然对齐，定制性最强

### WebSocket：Socket.IO vs STOMP/SockJS

- Socket.IO：功能丰富但需要后端额外支持
- **选择 STOMP/SockJS**：与后端 Spring WebSocket 方案匹配，无需额外配置

### CSS 方案：CSS Modules vs Tailwind CSS + shadcn/ui

- CSS Modules：样式隔离好但开发效率低
- **选择 Tailwind CSS + shadcn/ui**：开发效率高，组件一致性好，与设计系统集成
