# Feature Specification: ScriptMind Agent Enhancement & Chat UI Optimization

**Feature Branch**: `008-scriptmind-agent-enhancement`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "完善剧本创作的5个标签页（世界观/梗概/角色/大纲/剧本）的AI Agent能力，优化前端Chat窗口交互，支持Agent配置热更新"

## Clarifications

### Session 2026-06-23

- Q: Agent 实例与 tab 的映射关系？ → A: 每个 tab 绑定一个专用 agent（1:1 映射），现有 agent 大多推翻重来，按 tab 重新设计适配的 agent
- Q: Agent 配置的作用域？ → A: 两层结构 — 全局默认配置（本地文件系统 `~/.framemind/`）+ 项目级覆盖（数据库），项目级配置优先
- Q: Comic 格式的大纲如何处理？ → A: 本期不支持 comic 格式，大纲 tab 对 comic 项目显示"暂不支持"提示
- Q: 聊天历史的数据库方案？ → A: 扩展现有 `agent_sessions` + `agent_messages` 表，增加 `workflow_step`、`message_type`、`metadata` 等字段
- Q: Agent tool call 与用户手动编辑的并发冲突如何处理？ → A: 乐观锁 + 提示合并，使用版本号检测冲突，冲突时弹出提示让用户选择保留哪个版本

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Creative Ideation via Worldview Tab (Priority: P1)

As a screenwriter, I want to interact with an AI agent in the Worldview tab to brainstorm and refine a creative concept through multi-turn conversation, so that I can arrive at a solid creative direction before proceeding to detailed writing.

**Why this priority**: This is the entry point of the entire screenplay pipeline. Without a solid creative concept, all downstream work (synopsis, characters, outline, script) lacks foundation.

**Independent Test**: Can be fully tested by opening the Worldview tab, sending messages to the agent, receiving streaming responses, and verifying multi-turn conversation memory works correctly.

**Acceptance Scenarios**:

1. **Given** the user opens the Worldview tab, **When** they type a one-sentence concept and send it, **Then** the agent responds with a creative analysis in streaming fashion within the chat window.
2. **Given** the agent has responded with a creative proposal, **When** the user sends follow-up refinement messages, **Then** the agent remembers prior context and refines the concept accordingly across multiple turns.
3. **Given** the user clicks the "AI一键生成" button, **When** the action completes, **Then** a pre-configured prompt is sent to the agent and the response appears in the chat window as a normal message exchange.
4. **Given** the agent is responding, **When** the response contains tool calls, thinking blocks, or skill invocations, **Then** these are displayed as collapsible blocks in the chat without interrupting the main content flow.

---

### User Story 2 - Agent Configuration via Drawer (Priority: P1)

As a power user, I want to configure each tab's agent (system prompt, skills, rules) through a drawer panel and have my changes persist, so that I can customize agent behavior without restarting the application.

**Why this priority**: Agent customization is fundamental to the user experience — different projects and genres require different agent behaviors, and the ability to hot-reload configurations is a core differentiator.

**Independent Test**: Can be tested by opening the agent config drawer, modifying the system prompt, saving, and confirming the agent uses the new prompt on the next message.

**Acceptance Scenarios**:

1. **Given** the user is on any ScriptMind tab, **When** they click the agent configuration button, **Then** a drawer opens showing the current agent's system prompt, skills list, and rule constraints in editable form.
2. **Given** the user has modified the system prompt in the drawer, **When** they save the configuration, **Then** the config is persisted and the agent immediately uses the updated configuration for subsequent messages.
3. **Given** the application restarts, **When** an agent instance is created, **Then** it loads the user's custom configuration, falling back to built-in defaults if no custom config exists.
4. **Given** a project has a project-level agent config override, **When** the user opens that project's ScriptMind tab, **Then** the project-level config takes precedence over the global default config.

---

### User Story 3 - Synopsis Generation and Refinement (Priority: P2)

As a screenwriter, I want the AI agent to generate a screenplay synopsis based on the creative concept from the Worldview tab, and then interactively refine it through conversation, so that I have a solid story summary before designing characters and outline.

**Why this priority**: Synopsis is the second step in the pipeline and depends on the Worldview output. It delivers standalone value as a story summary document.

**Independent Test**: Can be tested by completing the Worldview step, navigating to the Synopsis tab, triggering synopsis generation, and verifying the output conforms to the synopsis data model.

**Acceptance Scenarios**:

1. **Given** the Worldview step is completed, **When** the user navigates to the Synopsis tab and triggers AI generation, **Then** the agent generates a synopsis that includes main plot, core conflict, turning points, ending, and themes.
2. **Given** a synopsis has been generated, **When** the user requests specific changes via chat, **Then** the agent modifies only the targeted sections while preserving the rest.
3. **Given** the user manually edits the synopsis form, **When** they save, **Then** the changes are persisted and the agent's subsequent responses reflect the updated content.

---

### User Story 4 - Character Management via Agent Tools (Priority: P2)

As a screenwriter, I want to create, edit, and delete characters through both the card-based UI and agent conversation, with the agent having dedicated tools for single and batch character operations.

**Why this priority**: Characters are essential to the screenplay and need both manual and AI-assisted management. The tool-based approach ensures structured, reliable character data.

**Independent Test**: Can be tested by using agent chat to create a character (e.g., "创建一个男主角，名叫李明"), verifying the character card appears, and then using the agent to batch-create additional characters.

**Acceptance Scenarios**:

1. **Given** the user is on the Characters tab, **When** they ask the agent to create a character with specific attributes, **Then** the agent uses its character creation tool and a new character card appears in the UI.
2. **Given** existing characters, **When** the user asks the agent to modify a character's attributes, **Then** the agent uses its character update tool and the card reflects the changes.
3. **Given** existing characters, **When** the user asks the agent to batch-create multiple characters from a description, **Then** the agent uses its batch creation tool and all character cards appear.
4. **Given** a character exists, **When** the user asks the agent to delete it, **Then** the agent uses its deletion tool and the card is removed after user confirmation.
5. **Given** the user is editing a character in the form while the agent's tool call modifies the same character, **When** the tool call completes, **Then** the system detects the conflict via version checking and prompts the user to choose which version to keep.

---

### User Story 5 - Outline Generation with Format Awareness (Priority: P2)

As a screenwriter, I want the AI agent to generate a story outline that automatically adapts to my project's format (short drama vs. traditional film), so that the structure matches industry standards for my chosen medium.

**Why this priority**: The outline is the structural backbone of the screenplay. Format awareness ensures the output is usable without manual restructuring.

**Independent Test**: Can be tested by creating a short_drama project and a movie project, generating outlines for both, and verifying the short drama uses episode/scene/beat structure while the movie uses act/sequence/scene structure.

**Acceptance Scenarios**:

1. **Given** a short_drama project with completed worldview, synopsis, and characters, **When** the user triggers outline generation, **Then** the agent produces an outline with episodes, scenes, and beats matching the short drama data model.
2. **Given** a movie project with completed worldview, synopsis, and characters, **When** the user triggers outline generation, **Then** the agent produces an outline with acts, sequences, and scenes matching the traditional film data model.
3. **Given** an outline exists, **When** the user requests changes to a specific episode or act via chat, **Then** the agent modifies only that section and checks downstream content for consistency.
4. **Given** a comic format project, **When** the user navigates to the Outline tab, **Then** the system displays a "暂不支持" (not yet supported) message and does not attempt outline generation.

---

### User Story 6 - Script Writing with Outline-Driven Navigation (Priority: P3)

As a screenwriter, I want to write the actual screenplay content guided by the outline, with the ability to click on any outline node to jump to that section, send context to the agent for targeted optimization, and trigger full-script AI generation with progress tracking.

**Why this priority**: This is the final and most complex step. It depends on all previous steps being complete and delivers the primary output of the pipeline.

**Independent Test**: Can be tested by completing all prior steps, navigating to the Script tab, clicking an outline node, verifying the editor scrolls to that section, and triggering AI generation with loading states.

**Acceptance Scenarios**:

1. **Given** an outline exists, **When** the user navigates to the Script tab, **Then** the left sidebar displays all outline nodes (episodes/scenes for short drama, acts/sequences for film) with completion status indicators.
2. **Given** the user clicks on a specific episode/scene in the sidebar, **When** the action completes, **Then** the editor scrolls to that section and the agent chat receives context about the selected section for targeted assistance.
3. **Given** the user clicks "AI生成剧本", **When** generation begins, **Then** each episode/act in the sidebar shows a loading indicator, and the status updates to "completed" as each section finishes generating.
4. **Given** the user has modified a section, **When** they ask the agent to optimize it, **Then** the agent receives the section content and outline context, and provides optimized content that the user can apply.
5. **Given** the agent has optimized a section, **When** the optimization is applied, **Then** the system checks subsequent sections for consistency and flags any contradictions.

---

### User Story 7 - Persistent Agent Chat Across Tabs (Priority: P3)

As a screenwriter, I want each tab to maintain its own independent chat history, so that conversations about worldview don't mix with character discussions, and I can revisit previous AI interactions at any time.

**Why this priority**: Chat persistence improves the user experience but is not strictly required for core functionality.

**Independent Test**: Can be tested by sending messages in the Worldview tab, switching to Characters tab (verifying empty chat), sending messages there, then switching back to Worldview (verifying history is preserved).

**Acceptance Scenarios**:

1. **Given** the user has sent messages in the Worldview tab, **When** they switch to the Synopsis tab and back, **Then** the Worldview chat history is preserved and scrollable.
2. **Given** the user closes and reopens the application, **When** they return to a tab, **Then** the previous chat history for that tab is loaded from the backend.

---

### Edge Cases

- What happens when the agent fails to parse a tool call response? The system should display an error message in the chat and allow the user to retry.
- What happens when the user sends a message while the agent is still streaming? The message should be queued and sent after the current response completes.
- What happens when the WebSocket connection drops mid-conversation? The system should attempt automatic reconnection with exponential backoff and display connection status.
- What happens when the user modifies the agent config while a generation is in progress? The in-progress generation should complete with the old config; new messages should use the updated config.
- What happens when a project has no worldview set and the user tries to generate a synopsis? The system should prompt the user to complete the Worldview step first.
- What happens when the outline is empty and the user navigates to the Script tab? The system should display a message indicating the outline must be created first.
- What happens when the agent's tool call modifies data that the user is currently editing in the form? The system detects the conflict via optimistic locking (version check) and prompts the user to choose which version to keep.
- What happens when the LLM provider returns a rate limit error? The system should display a user-friendly message and suggest retrying after a delay.
- What happens when the LLM provider is completely unavailable? The system should display an error state in the chat window and disable AI generation buttons until connectivity is restored.
- What happens when the user tries to use the Script tab on a comic format project? The system should display a "暂不支持" message consistent with the Outline tab behavior.

## Requirements *(mandatory)*

### Functional Requirements

**Chat Window Optimization (applies to all 5 tabs)**

- **FR-001**: System MUST remove the current agent stage filter buttons ("主笔编剧", "架构设定师", "角色设计师", "剧本医生") from the chat window header.
- **FR-002**: System MUST support streaming text output in the chat window, displaying content incrementally as it arrives.
- **FR-003**: System MUST display tool call results as collapsible blocks within the chat message stream, defaulting to collapsed state.
- **FR-004**: System MUST display thinking/reasoning blocks as collapsible blocks within the chat message stream, defaulting to collapsed state.
- **FR-005**: System MUST display skill invocation results as collapsible blocks within the chat message stream, defaulting to collapsed state.
- **FR-006**: System MUST provide an agent configuration button in the chat window header that opens a drawer panel.
- **FR-007**: The agent configuration drawer MUST allow editing of: system prompt, skills list, and rule constraints for the current tab's agent.
- **FR-008**: System MUST persist agent configurations to the local filesystem under the application's config directory as global defaults, organized by agent name.
- **FR-009**: System MUST support project-level agent configuration overrides stored in the database, which take precedence over global defaults.
- **FR-010**: System MUST load agent configurations at startup by merging global defaults with project-level overrides (project-level wins), falling back to built-in defaults when no custom config exists.
- **FR-011**: System MUST apply agent configuration changes immediately without requiring application restart (hot reload).
- **FR-012**: Each of the 5 tabs MUST maintain an independent chat history that persists across tab switches within a session.
- **FR-013**: Chat history MUST persist to the backend database and be reloadable across application sessions.

**Agent Architecture (applies to all 5 tabs)**

- **FR-014**: System MUST define 5 dedicated agents, each bound 1:1 to a workflow tab: worldview agent, synopsis agent, character agent, outline agent, script agent.
- **FR-015**: Each agent MUST operate with independent context, configuration, and tool set — no shared state between agents.
- **FR-016**: Existing agent implementations (showrunner, world_builder, character_designer, script_doctor, creative) MUST be replaced with new tab-aligned agents. Only implementations that naturally align with a tab may be retained as reference.
- **FR-017**: Agent MUST support multi-turn conversation with context memory within each tab's session.
- **FR-018**: Agent MUST support streaming response delivery via WebSocket.
- **FR-019**: Agent MUST support web search capability (e.g., Tavily integration) for research tasks.
- **FR-020**: Agent MUST support skill configuration and invocation during conversation.
- **FR-021**: All "AI一键生成" buttons MUST send a pre-configured prompt to the agent and display the exchange normally in the chat window.

**Worldview Tab (Tab A)**

- **FR-022**: Agent MUST be able to generate a creative concept from a single-sentence user input.
- **FR-023**: Agent MUST be able to analyze and refine a user-provided creative concept through multi-turn conversation.
- **FR-024**: The Worldview agent MUST have access to web search for market research and trend analysis.

**Synopsis Tab (Tab B)**

- **FR-025**: Agent MUST generate a synopsis based on the completed worldview content.
- **FR-026**: Agent MUST support interactive refinement of specific synopsis sections via conversation.
- **FR-027**: Synopsis output MUST conform to the existing `SynopsisContent` data model.

**Characters Tab (Tab C)**

- **FR-028**: Character cards MUST be displayed in a card-based layout, grouped by role type.
- **FR-029**: Manual character creation and editing MUST use the existing form-based UI.
- **FR-030**: Agent MUST have a built-in tool for creating a single character with all attributes.
- **FR-031**: Agent MUST have a built-in tool for updating a single character's attributes.
- **FR-032**: Agent MUST have a built-in tool for deleting a single character.
- **FR-033**: Agent MUST have a built-in tool for batch creating multiple characters from a description.
- **FR-034**: Agent MUST have a built-in tool for batch deleting multiple characters.
- **FR-035**: Character data modified by agent tool calls MUST use optimistic locking (version field) to detect concurrent edits, and prompt the user to resolve conflicts when detected.

**Outline Tab (Tab D)**

- **FR-036**: Agent MUST generate outlines in short drama format (episodes/scenes/beats) when the project format is `short_drama`.
- **FR-037**: Agent MUST generate outlines in traditional film format (acts/sequences/scenes) when the project format is `movie`.
- **FR-038**: Agent MUST have access to the project's worldview, synopsis, and character data when generating outlines.
- **FR-039**: Outline tab MUST display a "暂不支持" message for comic format projects and disable outline generation.

**Script Tab (Tab E)**

- **FR-040**: Left sidebar MUST display outline nodes as a navigable menu, showing episodes/scenes for short drama or acts/sequences for film.
- **FR-041**: Clicking an outline node MUST scroll the editor to the corresponding section and inject section context into the agent chat input.
- **FR-042**: Agent MUST receive the selected section's content and surrounding outline context when the user clicks an outline node.
- **FR-043**: "AI生成剧本" MUST trigger sequential generation of all outline sections with per-section loading indicators in the sidebar.
- **FR-044**: After optimizing a section, the agent MUST check subsequent sections for narrative consistency and flag contradictions.
- **FR-045**: The Script tab MUST NOT be accessible when the outline is empty — it must display a prompt to complete the outline first.
- **FR-046**: Script tab MUST display a "暂不支持" message for comic format projects.

**Data & Persistence**

- **FR-047**: System MUST extend the existing `agent_sessions` table with a `workflow_step` column to associate sessions with specific workflow tabs.
- **FR-048**: System MUST extend the existing `agent_messages` table with `message_type` (text/tool_call/tool_result/thinking/skill) and `metadata` (JSONB) columns.
- **FR-049**: System MUST support both global agent configs (filesystem) and project-level overrides (database) with merge semantics (project-level wins).
- **FR-050**: System MUST implement optimistic locking (version field) on data entities modified by agent tool calls to detect concurrent edit conflicts.

### Key Entities

- **AgentConfiguration**: Represents a tab-specific agent's customizable settings (system prompt, skills, rules). Two storage layers: global defaults on local filesystem, project-level overrides in database. Key attributes: `agentName`, `systemPrompt`, `skills[]`, `rules[]`, `modelOverride?`, `version`.
- **AgentMessage**: A single message in a chat session. Extends existing `agent_messages` table. Key attributes: `id`, `sessionId`, `agentName`, `role` (user/assistant/tool/thinking), `content`, `messageType` (text/tool_call/tool_result/thinking/skill), `metadata?` (collapsible block data), `messageOrder`, `timestamp`.
- **AgentChatSession**: A persistent chat session tied to a specific project and workflow step. Extends existing `agent_sessions` table. Key attributes: `id`, `projectId`, `workflowStep`, `agentName`, `messages[]`, `createdAt`, `updatedAt`.
- **Character**: A screenplay character with full attributes (name, gender, role, identity, persona, appearance, background, personality, relationships, arc, overview, visualPrompt). Must include a `version` field for optimistic locking.
- **StoryOutline**: The structured outline of the screenplay, dual-format (short drama: episodes/scenes/beats; film: acts/sequences/scenes). Comic format not supported in this iteration.
- **WorldSetting**: The creative concept and world-building data for the project.
- **Synopsis**: The story summary with main plot, conflict, turning points, ending, and themes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a full creative ideation session (worldview) in under 15 minutes through agent conversation, compared to manual form-filling.
- **SC-002**: Agent configuration changes take effect immediately after saving, without requiring application restart.
- **SC-003**: Each of the 5 tabs maintains independent chat history — switching between tabs preserves all conversation context with zero data loss.
- **SC-004**: Character creation via agent tool completes in under 10 seconds per character, with all required fields populated.
- **SC-005**: Full script generation (all episodes/acts) provides real-time progress feedback, with each section's status visible in the sidebar within 1 second of completion.
- **SC-006**: Agent responses stream to the chat window with less than 500ms latency from the first token.
- **SC-007**: 90% of users can navigate the agent configuration drawer and save custom settings on their first attempt without documentation.
- **SC-008**: Outline generation correctly adapts to project format — 100% of short_drama projects produce episode-based outlines, 100% of movie projects produce act-based outlines.
- **SC-009**: Concurrent edit conflicts (user vs agent tool call) are detected and resolved within 5 seconds, with zero silent data loss.
- **SC-010**: Comic format projects display consistent "暂不支持" messaging across Outline and Script tabs.

## Assumptions

- The existing real-time communication infrastructure is sufficient for the enhanced streaming requirements and will be extended rather than replaced.
- The existing agent call adapter interface supports tool-calling capabilities, or will be extended to support function/tool calling patterns.
- The application's config directory is writable by the application process on all target platforms (Windows, macOS, Linux).
- The project's format field is set at project creation time and does not change during the screenplay workflow.
- The existing database schema for agent sessions and messages can be extended to support new message types (tool call, thinking, skill) without migration issues.
- The web search integration already configured in the settings page is available for agent web search capabilities.
- The existing mock agent adapter will be extended to return mock tool-call and thinking responses for development/testing.
- Chat history persistence uses the existing message storage with an added message type column and optional structured metadata column.
- Existing agent implementations (showrunner, world_builder, etc.) serve only as reference for prompt engineering; the actual agent code will be rewritten to align with the 5-tab architecture.
- Comic format support is explicitly out of scope for this iteration and will be addressed in a future feature.
