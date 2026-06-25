# Feature Specification: ScriptMind Chat History Storage

**Feature Branch**: `012-scriptmind-chat-history-storage`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "优化当前系统中，ScriptMind模块的几大Agent对话聊天的聊天记录存储。当前的存储存在以下问题：1. 不区分每次对话的session，所有的从前端发起的对话都存在一个session里，很影响Context engineering的管理；2. 前端不具备历史对话记录选择能力，对话不可回溯；3. 每个session不能够自动总结title进行存储；4. 对话记录的结构不完全匹配AgentScope框架的数据块（Block）的结构"

## Clarifications

### Session 2026-06-25

- Q: 对话历史列表应该放在哪里？ → A: 右侧边栏（与 agent 配置面板共用或切换）
- Q: 用户如何触发创建新对话？ → A: 侧边栏顶部有显式"新建对话"按钮
- Q: 用户是否可以删除历史对话？ → A: 可以删除，需二次确认（如滑动删除或弹窗确认）

## User Scenarios & Testing

### User Story 1 - Session Isolation for New Conversations (Priority: P1)

As a screenplay writer using ScriptMind, when I start a new conversation in any workflow step (worldview, synopsis, characters, outline, script), I expect it to be stored as a separate session. Each conversation should have its own distinct session, allowing the AI agent to maintain focused context within that conversation. Currently, all messages from different conversations within the same workflow step are merged into a single session, causing context pollution and degraded AI performance.

**Why this priority**: Session isolation is the foundational fix. Without it, context engineering is impossible and all downstream features (history browsing, title generation) cannot function correctly.

**Independent Test**: Start two separate conversations in the same workflow step (e.g., "outline"). Verify they are stored as two distinct sessions in the database, each containing only its own messages. Verify the AI agent only sees messages from the current session when generating responses.

**Acceptance Scenarios**:

1. **Given** a user has an active conversation in the "outline" step, **When** the user clicks the "新建对话" button at the top of the right sidebar, **Then** a new session is created in the database and all subsequent messages belong to this new session.
2. **Given** a user has two sessions in the "outline" step, **When** the user sends a message in the older session, **Then** the agent only processes messages from that specific session as context.
3. **Given** a new session is created, **When** the first user message is sent, **Then** the session status transitions from "pending" to "running" and a unique session identifier is returned to the frontend.

---

### User Story 2 - Conversation History Browsing and Selection (Priority: P2)

As a screenplay writer, I want to see a list of all my past conversations in each workflow step, and I want to click on any past conversation to view its full history. This allows me to revisit previous discussions, reference earlier AI suggestions, and continue where I left off. The conversation list should show a meaningful title (auto-generated or user-provided) and a timestamp.

**Why this priority**: This is the primary user-facing value of the feature — enabling conversation retrace and selection. It depends on session isolation (P1) being in place.

**Independent Test**: Create multiple conversations in a workflow step, then verify the frontend displays a list of all conversations with titles. Click on a specific conversation and verify its full message history is loaded into the chat view.

**Acceptance Scenarios**:

1. **Given** a user has 3 past conversations in the "synopsis" step, **When** the user navigates to the synopsis step, **Then** the right sidebar displays all 3 conversations with their titles and timestamps, sorted by most recent first.
2. **Given** a user clicks on a past conversation from the list, **When** the conversation loads, **Then** the full message history (including user messages, assistant responses, thinking blocks, and tool call results) is displayed in the chat area.
3. **Given** a user is viewing a past conversation, **When** the user sends a new message, **Then** the conversation continues within the same session (extending the existing context).
4. **Given** a user wants to start fresh, **When** the user clicks the "新建对话" button at the top of the right sidebar, **Then** a new empty session is created and the chat view is cleared.
5. **Given** the conversation list is displayed, **When** the user has conversations in multiple workflow steps, **Then** each step tab shows only its own conversations.
6. **Given** a user wants to remove a past conversation, **When** the user initiates a delete action on a conversation in the right sidebar and confirms the deletion, **Then** the session and all its messages are permanently removed from the database and disappear from the list.

---

### User Story 3 - Auto-Generated Session Titles (Priority: P3)

As a screenplay writer, I want each conversation to have a meaningful, automatically generated title based on the conversation content, so I can quickly identify what a past conversation was about without opening it. The title should be generated after the first meaningful exchange (user message + assistant response) and stored persistently.

**Why this priority**: Titles significantly improve the usability of the conversation list (P2). Without meaningful titles, the history list is hard to navigate.

**Independent Test**: Start a new conversation, send a message about "developing the protagonist's backstory", and verify the session gets a meaningful auto-generated title like "主角背景故事讨论" within a reasonable time.

**Acceptance Scenarios**:

1. **Given** a new conversation is created, **When** the first user message is sent and the assistant responds, **Then** a title is automatically generated summarizing the conversation topic (e.g., based on the user's first message or a brief LLM-generated summary).
2. **Given** a conversation already has an auto-generated title, **When** the user manually edits the title, **Then** the user-provided title is preserved and not overwritten by auto-generation.
3. **Given** a conversation has only a system greeting or empty exchange, **When** the title is auto-generated, **Then** a generic fallback title is used (e.g., "新对话" or timestamp-based).

---

### User Story 4 - Structured Message Storage Matching AgentScope Blocks (Priority: P4)

As a system architect, I want the message storage structure to accurately represent AgentScope's content block hierarchy (TextBlock, ThinkingBlock, ToolUseBlock, ToolResultBlock) so that when conversation history is reloaded into the agent context, the agent receives the correct structured data rather than flattened text. This preserves the integrity of tool call results, thinking traces, and multi-block messages across session reloads.

**Why this priority**: This is a technical correctness requirement that affects AI performance on session reload. It is less visible to users but critical for reliable operation.

**Independent Test**: Send a message that triggers tool use (e.g., a file search), reload the session from the database, and verify that the tool call and tool result are stored as separate structured blocks rather than collapsed into plain text.

**Acceptance Scenarios**:

1. **Given** an agent response contains a thinking block, a text block, and a tool call, **When** these are persisted to the database, **Then** each block is stored as a separate message record with the correct `message_type` ("thinking", "text", "tool_call") and structured metadata.
2. **Given** a session is reloaded from the database (e.g., after server restart), **When** the messages are reconstructed into AgentScope `Msg` objects, **Then** each message retains its original block type (ThinkingBlock, TextBlock, ToolUseBlock, ToolResultBlock) rather than being flattened to TextBlock.
3. **Given** a message contains multiple content blocks (e.g., text + tool call), **When** stored, **Then** the message record preserves the ordered sequence of blocks within its metadata.

---

### Edge Cases

- What happens when a user has hundreds of sessions in one workflow step? The conversation list should support pagination or lazy loading to avoid performance issues.
- What happens when the auto-title generation fails (e.g., LLM timeout)? The system should fall back to a timestamp-based title and log the error without blocking the conversation.
- What happens when a user tries to continue a conversation whose session status is "failed"? The system should allow retrying or starting a new session.
- What happens when the database contains legacy sessions (pre-migration) that lack titles or have flattened message structures? The system should handle these gracefully (display "Untitled" for missing titles, treat all messages as text blocks).
- What happens when two browser tabs are open to the same project and both try to create new sessions simultaneously? Each tab should get its own independent session without conflicts.
- What happens when a user deletes a conversation that is currently active in another browser tab? The active tab should detect the deletion and automatically switch to a different session or create a new one.

## Requirements

### Functional Requirements

- **FR-001**: System MUST create a new session for each distinct conversation initiated by the user, rather than reusing the most recent session for a given `(project, workflow_step)` pair.
- **FR-002**: System MUST provide a "New Conversation" action that explicitly creates a new session and marks it as active in the frontend.
- **FR-003**: System MUST persist all conversation sessions with a unique identifier, project association, workflow step, status, and creation timestamp.
- **FR-004**: System MUST store each AgentScope content block (TextBlock, ThinkingBlock, ToolUseBlock, ToolResultBlock) as a distinct message record with its correct type and structured metadata, rather than flattening all blocks into plain text.
- **FR-005**: System MUST reconstruct AgentScope `Msg` objects from stored messages with their original block types preserved when loading session history.
- **FR-006**: System MUST automatically generate a descriptive title for each session after the first meaningful exchange (user message + assistant response).
- **FR-007**: System MUST allow users to manually edit session titles, and preserve user-provided titles against auto-generation.
- **FR-008**: System MUST provide an API endpoint to list all sessions for a given project and workflow step, ordered by most recent, including session title and timestamp.
- **FR-009**: System MUST provide an API endpoint to retrieve the full message history for a specific session, with messages ordered and typed correctly.
- **FR-010**: Frontend MUST display a conversation list in the right sidebar of each workflow step tab (sharing space with or toggling from the agent config panel), showing session titles and timestamps.
- **FR-016**: System MUST allow users to delete conversation sessions, requiring a二次确认 (confirmation dialog or滑动删除) before permanent removal.
- **FR-011**: Frontend MUST allow users to select a past conversation from the list to load its full history into the chat view.
- **FR-012**: Frontend MUST support continuing an existing conversation (sending new messages within a loaded historical session).
- **FR-013**: Frontend MUST persist the active session selection per workflow step so that refreshing the page restores the last-viewed conversation.
- **FR-014**: System MUST handle legacy sessions gracefully — sessions without titles display a fallback, sessions with flattened messages are readable as text.
- **FR-015**: System MUST support pagination or lazy loading for conversation lists exceeding 20 entries.

### Key Entities

- **Session (AgentSession)**: Represents a single conversation thread within a specific workflow step. Key attributes: unique identifier, project reference, workflow step, agent name, status (pending/running/completed/failed), title (auto-generated or user-provided), input data, output data, token consumption, creation and completion timestamps.
- **Message (AgentMessage)**: Represents a single message within a session. Key attributes: unique identifier, session reference, agent name, role (user/assistant/system), content, message order, message type (text/thinking/tool_call/tool_result/skill), structured metadata (JSON), creation timestamp.
- **Content Block**: A structured unit within a message representing an AgentScope block (TextBlock, ThinkingBlock, ToolUseBlock, ToolResultBlock). Stored as part of the message's metadata, preserving block type, content, and ordering.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create and switch between multiple independent conversations within the same workflow step without context overlap.
- **SC-002**: Users can view and select from a complete list of past conversations, with each conversation loading its full message history in under 3 seconds.
- **SC-003**: Every new session receives an auto-generated title within 5 seconds of the first assistant response, with ≥90% title relevance (meaningful summary of conversation topic).
- **SC-004**: After a session is reloaded from the database, the agent context preserves ≥95% of the original structured block types (thinking, tool_call, tool_result) compared to the in-memory state.
- **SC-005**: Legacy sessions (pre-migration) remain accessible and readable without data loss or errors.
- **SC-006**: Conversation list supports 100+ sessions per workflow step without noticeable UI lag (list renders in under 1 second).

## Assumptions

- Users interact with one conversation at a time per workflow step (no split-screen multi-conversation view).
- Auto-title generation uses the existing LLM infrastructure (no new external service required).
- The existing database schema (`agent_sessions`, `agent_messages`) can be extended via Flyway migration without breaking existing data.
- The frontend agent store (Zustand) can be extended to manage per-session state without replacing the existing tab-based architecture.
- WebSocket connections remain tied to a single session at a time (switching sessions reconnects the WebSocket to the new session).
- The older `AgentController` workflow-style endpoints are not the focus of this feature; only the newer `ProjectAgentController` chat flow is in scope.
- Token consumption tracking per session is a secondary concern and can remain as-is.
